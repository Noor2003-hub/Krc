import Link from "next/link";
import { PageHeader, PlusIcon } from "@/components/PageHeader";
import { ShiftPill } from "@/components/Pills";
import { SubmitButton } from "@/components/SubmitButton";
import { requireAdmin } from "@/lib/auth";
import { addMonths, dateLabel, formatKwd, isPrepaid, METHOD_LABEL, monthLabel, monthStart, todayKuwait, type Method } from "@/lib/rules";
import type { Customer } from "@/lib/types";
import { convertToRegular } from "./actions";

export const metadata = { title: "المشتركين" };

type Inv = { id: number; customer_id: string; period_month: string | null; invoice_date: string; status: "paid" | "unpaid"; method: Method | null; paid_on: string | null; kind: string };

export default async function SubscribersPage({ searchParams }: { searchParams: Promise<{ shift?: string; filter?: string }> }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const current = monthStart(todayKuwait());
  const months = Array.from({ length: 6 }, (_, k) => addMonths(current, k - 5));

  const [{ data: custData }, { data: invData }, { data: onceData }, { data: firstInv }] = await Promise.all([
    supabase.from("customers").select("*").eq("kind", "regular").order("active", { ascending: false }).order("name"),
    supabase.from("invoices").select("id, customer_id, period_month, invoice_date, status, method, paid_on, kind").eq("kind", "regular").gte("period_month", months[0]).lte("period_month", current),
    supabase.from("invoices").select("customer_id, invoice_date, customer:customers!inner(id, name, shift, kind)").eq("kind", "once").eq("status", "paid").eq("customer.kind", "once").order("invoice_date", { ascending: false }).limit(2000),
    supabase.from("invoices").select("period_month").not("period_month", "is", null).order("period_month").limit(1),
  ]);
  // الشهور قبل أول فاتورة في النظام ما تنحسب «غير مدفوع»
  const systemStart: string = firstInv?.[0]?.period_month ?? current;

  const all = (custData ?? []) as Customer[];
  const invoices = (invData ?? []) as Inv[];
  const byCustMonth = new Map<string, Inv[]>();
  for (const i of invoices) {
    const k = `${i.customer_id}|${i.period_month}`;
    byCustMonth.set(k, [...(byCustMonth.get(k) ?? []), i]);
  }
  const cell = (c: Customer, m: string): "ok" | "no" | "before" => {
    if (m < systemStart || (c.joined_on && monthStart(c.joined_on) > m)) return "before";
    return (byCustMonth.get(`${c.id}|${m}`) ?? []).some((i) => i.status === "paid") ? "ok" : "no";
  };

  const active = all.filter((c) => c.active);
  const counts = { all: active.length, am: active.filter((c) => c.shift === "am").length, pm: active.filter((c) => c.shift === "pm").length, unpaid: active.filter((c) => cell(c, current) === "no").length };
  let list = sp.filter === "inactive" ? all.filter((c) => !c.active) : active;
  if (sp.shift === "am" || sp.shift === "pm") list = list.filter((c) => c.shift === sp.shift);
  if (sp.filter === "unpaid") list = list.filter((c) => cell(c, current) === "no");

  // عملاء غير ثابتين دفعوا أكثر من مرة
  type OnceRow = { customer_id: string; invoice_date: string; customer: { id: string; name: string; shift: "am" | "pm" } };
  const repeat = new Map<string, { name: string; shift: "am" | "pm"; times: number; last: string }>();
  for (const r of (onceData ?? []) as unknown as OnceRow[]) {
    const e = repeat.get(r.customer_id);
    if (e) e.times++;
    else repeat.set(r.customer_id, { name: r.customer.name, shift: r.customer.shift, times: 1, last: r.invoice_date });
  }
  const candidates = [...repeat.entries()].filter(([, v]) => v.times >= 2).sort((a, b) => b[1].times - a[1].times).slice(0, 9);

  const chip = (label: string, href: string, on: boolean) => (
    <Link href={href} className={`inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] no-underline ${on ? "border-ink bg-ink font-bold text-white" : "border-[#d6d3cd] bg-white font-semibold text-[#44403c]"}`}>{label}</Link>
  );

  return (
    <>
      <PageHeader title={<>المشتركين الثابتين <span className="num font-semibold text-muted">({counts.all})</span></>} subtitle="سجل كل مشترك شهر بشهر، محسوب من الفواتير المسجّلة.">
        <a href="/invoices/export?kind=regular" className="btn">تصدير Excel</a>
        <Link href="/subscribers/new" className="btn btn-primary"><PlusIcon />إضافة مشترك</Link>
      </PageHeader>

      <div className="no-print flex flex-wrap items-center gap-2">
        {chip(`الكل · ${counts.all}`, "/subscribers", !sp.shift && !sp.filter)}
        {chip(`صباحي · ${counts.am}`, "/subscribers?shift=am", sp.shift === "am")}
        {chip(`مسائي · ${counts.pm}`, "/subscribers?shift=pm", sp.shift === "pm")}
        {chip(`ما دفعوا ${monthLabel(current, false)} · ${counts.unpaid}`, "/subscribers?filter=unpaid", sp.filter === "unpaid")}
        {chip("المتوقفين", "/subscribers?filter=inactive", sp.filter === "inactive")}
        <span className="mr-auto flex gap-3.5 text-xs font-semibold text-[#44403c]">
          <Legend kind="ok" label="مدفوع" /><Legend kind="no" label="غير مدفوع" /><Legend kind="before" label="قبل الاشتراك أو قبل بداية النظام" />
        </span>
      </div>

      <section className="card overflow-hidden" aria-label="المشتركين">
        <div className="overflow-x-auto">
          {list.length === 0 ? (
            <p className="m-0 p-6 text-sm text-muted">ما في مشتركين هنا. <Link href="/subscribers/new" className="font-bold">أضف مشترك</Link></p>
          ) : (
            <table className="tbl min-w-[940px]">
              <thead>
                <tr>
                  <th>الاسم</th><th>الدوام</th><th>الرسوم</th><th>مشترك منذ</th>
                  {months.map((m) => <th key={m} className="!px-1 !text-center">{monthLabel(m, false)}</th>)}
                  <th>حالة {monthLabel(current, false)}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const thisMonth = byCustMonth.get(`${c.id}|${current}`) ?? [];
                  const paidInv = thisMonth.find((i) => i.status === "paid");
                  return (
                    <tr key={c.id}>
                      <td><Link href={`/subscribers/${c.id}/edit`} className="font-bold no-underline hover:underline">{c.name}</Link></td>
                      <td><ShiftPill shift={c.shift} /></td>
                      <td className="num">{formatKwd(c.monthly_fee)}</td>
                      <td>{c.joined_on ? monthLabel(monthStart(c.joined_on)) : "—"}</td>
                      {months.map((m) => <td key={m} className="!px-1 text-center"><Cell kind={cell(c, m)} /></td>)}
                      <td>
                        {paidInv ? (
                          <Link href={`/invoices/${paidInv.id}`} className="pill pill-paid no-underline">
                            {paidInv.method ? METHOD_LABEL[paidInv.method] : ""} · {isPrepaid(paidInv.invoice_date, paidInv.period_month) ? "مقدم " : ""}{dateLabel(paidInv.paid_on ?? paidInv.invoice_date).replace(/ \d{4}$/, "")}
                          </Link>
                        ) : thisMonth.length ? (
                          <Link href={`/invoices/${thisMonth[0].id}`} className="pill pill-unpaid no-underline">فاتورة غير مدفوعة</Link>
                        ) : c.active ? (
                          <Link href={`/invoices/new?customer=${c.id}`} className="pill pill-unpaid no-underline">لا توجد فاتورة · سجّل</Link>
                        ) : <span className="pill pill-once">متوقف</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="card flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-base font-bold">عملاء غير ثابتين دفعوا أكثر من مرة</h2>
          <p className="m-0 text-[13px] text-muted">فرصة تحوّلهم لمشتركين ثابتين وتزيد العدد.</p>
        </div>
        {candidates.length === 0 ? (
          <p className="m-0 text-sm text-muted">لا يوجد حالياً.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
            {candidates.map(([id, v]) => (
              <div key={id} className="flex flex-col gap-2.5 rounded-xl border border-line p-4">
                <div className="flex items-center justify-between"><strong>{v.name}</strong><ShiftPill shift={v.shift} /></div>
                <span className="num text-[13px] text-[#44403c]">دفع {v.times} مرات · آخرها {dateLabel(v.last)}</span>
                <form action={convertToRegular}>
                  <input type="hidden" name="id" value={id} />
                  <SubmitButton className="btn btn-sm h-10 w-full" pendingText="…">تحويل لمشترك ثابت</SubmitButton>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

const CELL_STYLE = { ok: "bg-[#dcfce7] text-[#14532d]", no: "bg-[#fee2e2] text-[#7f1d1d]", before: "bg-[#f1f1ee] text-muted" };
const CELL_TEXT = { ok: "✓", no: "!", before: "–" };
const CELL_LABEL = { ok: "مدفوع", no: "غير مدفوع", before: "قبل الاشتراك أو قبل بداية النظام" };

function Cell({ kind }: { kind: "ok" | "no" | "before" }) {
  return <span title={CELL_LABEL[kind]} aria-label={CELL_LABEL[kind]} className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold ${CELL_STYLE[kind]}`}>{CELL_TEXT[kind]}</span>;
}
function Legend({ kind, label }: { kind: "ok" | "no" | "before"; label: string }) {
  return <span className="flex items-center gap-1.5"><span aria-hidden="true" className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-xs font-bold ${CELL_STYLE[kind]}`}>{CELL_TEXT[kind]}</span>{label}</span>;
}
