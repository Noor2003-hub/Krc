import Link from "next/link";
import { PageHeader, PlusIcon } from "@/components/PageHeader";
import { InvoiceTable } from "@/components/InvoiceTable";
import { Money } from "@/components/Money";
import { requireAdmin } from "@/lib/auth";
import { computeDashboard, type AExpense, type AInvoice, type ACustomer } from "@/lib/analytics";
import { addMonths, EXPENSE_LABEL, formatKwd, METHOD_LABEL, monthLabel, monthStart, SHIFT_LABEL, todayKuwait } from "@/lib/rules";
import type { InvoiceWithCustomer } from "@/lib/types";

export const metadata = { title: "لوحة التحكم" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const current = monthStart(todayKuwait());
  const month = sp.month && /^\d{4}-\d{2}-01$/.test(sp.month) ? sp.month : current;
  const from = addMonths(month, -6);
  const to = addMonths(month, 2);

  const [{ data: invData }, { data: custData }, { data: recentData }, { data: expData }] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, customer_id, kind, shift, invoice_date, period_month, amount, status, method")
      .or(`and(period_month.gte.${from},period_month.lt.${to}),and(period_month.is.null,invoice_date.gte.${from},invoice_date.lt.${to})`),
    supabase.from("customers").select("id, name, kind, shift, active, joined_on"),
    supabase.from("invoices").select("*, customer:customers(id, name, phone)").order("created_at", { ascending: false }).limit(5),
    supabase.from("expenses").select("month, category, amount").gte("month", from).lt("month", to),
  ]);

  const d = computeDashboard((invData ?? []) as AInvoice[], (custData ?? []) as ACustomer[], month, (expData ?? []) as AExpense[]);
  const maxMoney = Math.max(1, ...d.byMonth.map((m) => Math.max(m.regular + m.once, m.spent)));
  const recent = (recentData ?? []) as InvoiceWithCustomer[];
  const maxBar = Math.max(1, ...d.byMonth.map((m) => m.regular + m.once));
  const monthOptions = Array.from({ length: 12 }, (_, k) => addMonths(current, 1 - k));
  const paidPct = d.regularCount ? Math.round((d.regularPaid / d.regularCount) * 100) : 0;
  const shiftTotal = d.shift.reduce((s, x) => s + x.total, 0) || 1;
  const timingTotal = d.timing.sameMonth + d.timing.prepaid || 1;
  const methodTotal = d.methods.reduce((s, x) => s + x.total, 0) || 1;

  return (
    <>
      <PageHeader title="لوحة التحكم" subtitle={`ملخص فواتير شهر ${monthLabel(month)}`}>
        <form className="flex items-center gap-2 text-[13px] font-semibold text-[#44403c]">
          <label htmlFor="month">الشهر</label>
          <select id="month" name="month" defaultValue={month} className="inp w-auto">
            {monthOptions.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <button className="btn btn-sm">عرض</button>
        </form>
        <Link href="/invoices/new" className="btn btn-primary"><PlusIcon />تسجيل فاتورة</Link>
      </PageHeader>

      <section aria-label="الأرقام الرئيسية" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Kpi label={`المحصّل عن ${monthLabel(month, false)}`} value={<>{formatKwd(d.collected)} <span className="text-[15px] text-muted">د.ك</span></>}
          note={d.changePct === null ? "—" : `${d.changePct >= 0 ? "+" : ""}${d.changePct.toFixed(1)}% عن ${monthLabel(addMonths(month, -1), false)}`} good={d.changePct !== null && d.changePct >= 0} />
        <Kpi label="المشتركين الثابتين" value={d.regularCount} note={`دفع ${d.regularPaid} · باقي ${d.regularCount - d.regularPaid}`} />
        <Kpi label="عملاء غير ثابتين" value={d.onceCount} note={`${formatKwd(d.onceTotal)} د.ك هذا الشهر`} />
        <Kpi label={`مدفوع مقدماً لـ${monthLabel(addMonths(month, 1), false)}`} value={d.prepaidNext} note="فواتير آخر الشهر" />
      </section>

      <section aria-label="المصروفات والصافي" className="flex flex-wrap items-stretch gap-4">
        <div className="card flex min-w-0 flex-[1_1_260px] flex-col gap-3 p-6">
          <h2 className="m-0 text-base font-bold">المصروفات والصافي · {monthLabel(month, false)}</h2>
          <div className="flex items-baseline justify-between gap-2 text-sm"><span className="font-semibold text-muted">المحصّل</span><span className="num font-bold">{formatKwd(d.collected)} د.ك</span></div>
          <div className="flex items-baseline justify-between gap-2 text-sm"><span className="font-semibold text-muted">اتصرف</span><span className="num font-bold"><bdi dir="ltr">−{formatKwd(d.spent)}</bdi> د.ك</span></div>
          <div className="flex items-baseline justify-between gap-2 border-t border-line pt-3">
            <span className="text-sm font-bold">الصافي</span>
            <Money value={d.net} className={`text-[26px] font-bold ${d.net >= 0 ? "text-[#14532d]" : "text-[#991b1b]"}`} />
          </div>
          <div className="flex flex-col gap-2 pt-1">
            {d.expenseByCategory.map((c) => (
              <div key={c.category} className="flex justify-between text-[13px]"><span className="text-muted">{EXPENSE_LABEL[c.category]}</span><span className="num font-semibold">{formatKwd(c.total)} د.ك</span></div>
            ))}
          </div>
          <Link href={`/expenses?month=${month}`} className="btn btn-sm mt-auto">المصروفات</Link>
        </div>
        <div className="card flex min-w-0 flex-[3_1_460px] flex-col gap-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-base font-bold">المحصّل والمصروفات (آخر 6 شهور)</h2>
            <div className="flex gap-4 text-xs font-semibold text-[#44403c]">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[3px] bg-brand" />المحصّل</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[3px] bg-[#ea580c]" />المصروفات</span>
            </div>
          </div>
          <div role="img" aria-label="المحصّل والمصروفات لكل شهر" className="grid h-48 grid-cols-6 items-end gap-4 border-b border-line">
            {d.byMonth.map((m) => (
              <div key={m.month} className="flex items-end justify-center gap-1">
                <div className="w-5 rounded-t bg-brand" style={{ height: `${((m.regular + m.once) / maxMoney) * 170}px` }} />
                <div className="w-5 rounded-t bg-[#ea580c]" style={{ height: `${(m.spent / maxMoney) * 170}px` }} />
              </div>
            ))}
          </div>
          <div className="-mt-2 grid grid-cols-6 gap-4 text-center text-xs">
            {d.byMonth.map((m) => (
              <div key={m.month} className="flex flex-col gap-0.5">
                <span className={`font-semibold ${m.month === month ? "text-ink" : "text-[#44403c]"}`}>{monthLabel(m.month, false)}</span>
                <Money value={Math.round(m.net)} unit={false} className={`font-bold ${m.net >= 0 ? "text-[#14532d]" : "text-[#991b1b]"}`} />
              </div>
            ))}
          </div>
          <p className="m-0 text-xs text-muted">الرقم تحت كل شهر = الصافي (المحصّل − المصروفات) بالدينار.</p>
        </div>
      </section>

      <div className="flex flex-wrap items-stretch gap-4">
        <section className="card flex min-w-0 flex-[3_1_460px] flex-col gap-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-base font-bold">الدخل حسب الشهر (آخر 6 شهور)</h2>
            <div className="flex gap-4 text-xs font-semibold text-[#44403c]">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[3px] bg-brand" />مشتركين ثابتين</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[3px] bg-brand-light" />غير ثابتين</span>
            </div>
          </div>
          <div role="img" aria-label="الدخل لكل شهر" className="grid h-60 grid-cols-6 items-end gap-4 border-b border-line">
            {d.byMonth.map((m) => (
              <div key={m.month} className="flex flex-col items-center gap-1.5">
                <span className="num text-xs font-bold">{Math.round(m.regular + m.once)}</span>
                <div className="flex w-11 flex-col">
                  <div className="rounded-t bg-brand-light" style={{ height: `${(m.once / maxBar) * 190}px` }} />
                  <div className={`bg-brand ${m.once ? "" : "rounded-t"}`} style={{ height: `${(m.regular / maxBar) * 190}px` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="-mt-2.5 grid grid-cols-6 gap-4 text-center text-xs font-semibold text-[#44403c]">
            {d.byMonth.map((m) => <span key={m.month} className={m.month === month ? "font-bold text-ink" : ""}>{monthLabel(m.month, false)}</span>)}
          </div>
          <p className="m-0 text-xs text-muted">المبالغ بالدينار الكويتي، محسوبة حسب «عن شهر» وليس تاريخ الدفع.</p>
        </section>

        <section className="card flex min-w-0 flex-[2_1_300px] flex-col gap-4 p-6">
          <h2 className="m-0 text-base font-bold">المشتركين الثابتين · {monthLabel(month, false)}</h2>
          <div className="flex items-baseline justify-between">
            <span className="num text-[32px] font-bold">{d.regularPaid} <span className="text-base text-muted">من {d.regularCount} دفعوا</span></span>
            <span className="num text-sm font-bold text-[#14532d]">{paidPct}%</span>
          </div>
          <div className="bar !h-3"><span className="bg-brand" style={{ width: `${paidPct}%` }} /></div>
          <h3 className="m-0 mt-2 text-[13px] font-bold text-muted">لم يدفعوا بعد</h3>
          {d.notPaid.length === 0 ? (
            <p className="m-0 text-sm text-muted">كل المشتركين دفعوا هذا الشهر.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {d.notPaid.slice(0, 6).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 rounded-[10px] border border-line-soft px-3 py-2.5">
                  <span className="flex flex-col"><strong className="text-sm">{c.name}</strong><span className="text-xs text-muted">{SHIFT_LABEL[c.shift]} · {c.hasUnpaidInvoice ? "فاتورة مسجّلة غير مدفوعة" : "لا توجد فاتورة"}</span></span>
                  {c.hasUnpaidInvoice
                    ? <Link href={`/invoices?customer=${c.id}`} className="btn btn-sm">عرض</Link>
                    : <Link href={`/invoices/new?customer=${c.id}`} className="btn btn-sm">تسجيل فاتورة</Link>}
                </li>
              ))}
              {d.notPaid.length > 6 && <li><Link href="/subscribers?filter=unpaid" className="text-sm font-bold">عرض الكل ({d.notPaid.length})</Link></li>}
            </ul>
          )}
        </section>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
        <section className="card flex flex-col gap-4 p-6">
          <h2 className="m-0 text-base font-bold">صباحي ومسائي</h2>
          {d.shift.map((s) => (
            <Meter key={s.shift} label={`${SHIFT_LABEL[s.shift]} · ${s.people} شخص`} value={`${formatKwd(s.total)} د.ك`} pct={(s.total / shiftTotal) * 100} color={s.shift === "am" ? "#ea580c" : "#6d28d9"} />
          ))}
          <p className="m-0 text-xs text-muted">يشمل الثابتين وغير الثابتين.</p>
        </section>
        <section className="card flex flex-col gap-4 p-6">
          <h2 className="m-0 text-base font-bold">متى يدفعون؟</h2>
          <Meter label="في نفس الشهر" value={`${d.timing.sameMonth} فاتورة`} pct={(d.timing.sameMonth / timingTotal) * 100} color="var(--color-brand)" note="تُسجَّل لنفس الشهر" />
          <Meter label="مقدماً من الشهر اللي قبله" value={`${d.timing.prepaid} فاتورة`} pct={(d.timing.prepaid / timingTotal) * 100} color="var(--color-brand-light)" note="دفعوا آخر الشهر السابق" />
        </section>
        <section className="card flex flex-col gap-3.5 p-6">
          <h2 className="m-0 text-base font-bold">طرق الدفع</h2>
          {d.methods.map((m) => (
            <Meter key={m.method} label={METHOD_LABEL[m.method]} value={`${m.count} · ${formatKwd(m.total)} د.ك`} pct={(m.total / methodTotal) * 100} color="#44403c" />
          ))}
          <p className="m-0 text-xs text-muted">قارن الأرقام بالصندوق وكشف البنك آخر الشهر.</p>
        </section>
      </div>

      <section className="card overflow-hidden" aria-label="آخر الفواتير">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="m-0 text-base font-bold">آخر الفواتير</h2>
          <Link href="/invoices" className="text-sm font-bold">عرض الكل</Link>
        </div>
        <div className="overflow-x-auto">
          <InvoiceTable rows={recent} />
        </div>
      </section>
    </>
  );
}

function Kpi({ label, value, note, good }: { label: string; value: React.ReactNode; note: string; good?: boolean }) {
  return (
    <div className="card flex flex-col gap-1.5 p-5">
      <span className="text-[13px] font-semibold text-muted">{label}</span>
      <span className="num text-[26px] font-bold">{value}</span>
      <span className={`text-xs font-bold ${good ? "text-[#14532d]" : "text-[#44403c]"}`}>{note}</span>
    </div>
  );
}

function Meter({ label, value, pct, color, note }: { label: string; value: string; pct: number; color: string; note?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between gap-2 text-[13px] font-semibold"><span>{label}</span><span className="num">{value}</span></div>
      <div className="bar"><span style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} /></div>
      {note && <span className="text-xs text-muted">{note}</span>}
    </div>
  );
}
