import Link from "next/link";
import { notFound } from "next/navigation";
import { KindPill, ShiftPill, StatusPill } from "@/components/Pills";
import { SubmitButton } from "@/components/SubmitButton";
import { requireAdmin } from "@/lib/auth";
import { addMonths, dateLabel, formatKwd, isPrepaid, METHOD_LABEL, monthLabel, SHIFT_LABEL } from "@/lib/rules";
import type { InvoiceEvent, InvoiceWithCustomer } from "@/lib/types";
import { markUnpaid } from "../actions";

export const metadata = { title: "تفاصيل الفاتورة" };

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("invoices").select("*, customer:customers(id, name, phone, kind, joined_on)").eq("id", Number(id)).maybeSingle();
  if (!data) notFound();
  const inv = data as InvoiceWithCustomer & { customer: { kind: string; joined_on: string | null } | null };

  const [{ data: events }, { data: admins }, history] = await Promise.all([
    supabase.from("invoice_events").select("*").eq("invoice_id", inv.id).order("created_at"),
    supabase.from("admins").select("id, name"),
    inv.kind === "regular" && inv.period_month
      ? supabase.from("invoices").select("period_month, status").eq("customer_id", inv.customer_id)
          .gte("period_month", addMonths(inv.period_month, -5)).lte("period_month", inv.period_month)
      : Promise.resolve({ data: null }),
  ]);
  const adminName = new Map((admins ?? []).map((a) => [a.id, a.name as string]));
  const months = inv.period_month ? Array.from({ length: 6 }, (_, k) => addMonths(inv.period_month!, k - 5)) : [];
  const paidMonths = new Set((history.data ?? []).filter((h) => h.status === "paid").map((h) => h.period_month));
  const anyMonths = new Set((history.data ?? []).map((h) => h.period_month));
  const prepaid = isPrepaid(inv.invoice_date, inv.period_month);

  return (
    <>
      <Link href="/invoices" className="no-print inline-flex min-h-8 items-center gap-1.5 self-start text-sm font-semibold text-[#44403c] no-underline">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
        الفواتير
      </Link>
      <header className="card -mt-2 flex flex-wrap items-end justify-between gap-5 p-7">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="num text-sm font-semibold text-muted">فاتورة رقم {inv.id}</span>
            <StatusPill status={inv.status} />
            <KindPill kind={inv.kind} />
            <ShiftPill shift={inv.shift} />
          </div>
          <h1 className="num m-0 text-[40px] font-bold">{formatKwd(inv.amount)} <span className="text-xl text-muted">د.ك</span></h1>
          <p className="m-0 text-[15px] text-[#44403c]">
            {inv.customer?.name} · {inv.period_month ? <>رسوم شهر <strong>{monthLabel(inv.period_month)}</strong></> : "دفعة واحدة"}
            {prepaid && <> · دُفعت مقدماً يوم {dateLabel(inv.invoice_date)}</>}
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2.5">
          <Link href={`/receipt/${inv.id}`} className="btn">طباعة سند قبض</Link>
          <Link href={`/invoices/${inv.id}/edit`} className="btn">{inv.status === "unpaid" ? "تسجيل الدفع / تعديل" : "تعديل"}</Link>
          {inv.status === "paid" && (
            <form action={markUnpaid}>
              <input type="hidden" name="id" value={inv.id} />
              <SubmitButton className="btn" pendingText="…">تغيير إلى غير مدفوعة</SubmitButton>
            </form>
          )}
        </div>
      </header>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[3_1_460px] flex-col gap-6">
          <section className="card flex flex-col gap-[18px] p-6">
            <h2 className="m-0 text-base font-bold">تفاصيل الفاتورة</h2>
            <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 [&_dd]:m-0 [&_dd]:text-sm [&_dd]:font-bold [&_dt]:text-xs [&_dt]:font-bold [&_dt]:text-muted [&>div]:flex [&>div]:flex-col [&>div]:gap-1">
              <div><dt>الاسم</dt><dd>{inv.customer?.name ?? "—"}</dd></div>
              <div><dt>رقم الجوال</dt><dd dir="ltr" className="num text-right">{inv.customer?.phone ?? "—"}</dd></div>
              <div><dt>نوع العميل</dt><dd>{inv.kind === "regular" ? `مشترك ثابت${inv.customer?.joined_on ? ` منذ ${monthLabel(inv.customer.joined_on.slice(0, 7) + "-01")}` : ""}` : "غير ثابت"}</dd></div>
              <div><dt>الدوام</dt><dd>{SHIFT_LABEL[inv.shift]}</dd></div>
              <div><dt>تاريخ الفاتورة</dt><dd className="num">{dateLabel(inv.invoice_date)}</dd></div>
              <div><dt>قسط عن شهر</dt><dd>{inv.period_month ? <>{monthLabel(inv.period_month)}{prepaid && <span className="text-xs font-semibold text-muted"> (مقدم)</span>}</> : "دفعة واحدة"}</dd></div>
              <div><dt>طريقة الدفع</dt><dd>{inv.method ? METHOD_LABEL[inv.method] + (inv.method_note ? ` · ${inv.method_note}` : "") : "—"}</dd></div>
              <div><dt>تاريخ الدفع</dt><dd className="num">{dateLabel(inv.paid_on)}</dd></div>
              <div><dt>رقم المرجع</dt><dd dir="ltr" className="text-right font-mono font-medium">{inv.reference ?? "—"}</dd></div>
              <div><dt>سجّلها</dt><dd>{(inv.created_by && adminName.get(inv.created_by)) ?? "—"}</dd></div>
            </dl>
            {prepaid && (
              <div className="rounded-[10px] bg-brand-tint px-3.5 py-3 text-[13px] leading-relaxed text-brand-dark">
                تاريخ الفاتورة آخر الشهر، فتسجّلت مقدماً عن الشهر اللي بعده ({monthLabel(inv.period_month!)}).
              </div>
            )}
          </section>

          {months.length > 0 && (
            <section className="card flex flex-col gap-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="m-0 text-base font-bold">سجل دفع {inv.customer?.name} (آخر 6 شهور)</h2>
                <Link href={`/invoices?customer=${inv.customer_id}`} className="text-[13px] font-bold">كل فواتيره</Link>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {months.map((m) => {
                  const st = paidMonths.has(m) ? "ok" : anyMonths.has(m) ? "no" : "none";
                  return (
                    <div key={m} className="flex flex-col items-center gap-1.5 text-xs font-semibold text-[#44403c]">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-[10px] text-base font-bold ${st === "ok" ? "bg-[#dcfce7] text-[#14532d]" : st === "no" ? "bg-[#fee2e2] text-[#7f1d1d]" : "bg-[#f1f1ee] text-muted"} ${m === inv.period_month ? "outline-2 outline-offset-2 outline-brand" : ""}`}>
                        {st === "ok" ? "✓" : st === "no" ? "!" : "–"}
                      </span>
                      <span className={m === inv.period_month ? "font-bold text-ink" : ""}>{monthLabel(m, false)}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {inv.notes && (
            <section className="card flex flex-col gap-3 p-6">
              <h2 className="m-0 text-base font-bold">ملاحظات</h2>
              <p className="m-0 whitespace-pre-line text-sm leading-relaxed text-[#44403c]">{inv.notes}</p>
            </section>
          )}
        </div>

        <section aria-label="سجل التعديلات" className="card flex min-w-0 flex-[2_1_300px] flex-col gap-5 p-6">
          <h2 className="m-0 text-base font-bold">سجل التعديلات</h2>
          <ol className="m-0 flex list-none flex-col p-0">
            {((events ?? []) as InvoiceEvent[]).map((e, i, arr) => (
              <li key={e.id} className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <span className="mt-1 h-3.5 w-3.5 rounded-full bg-brand" />
                  {i < arr.length - 1 && <span className="min-h-6 w-0.5 flex-1 bg-line" />}
                </div>
                <div className={`flex flex-col gap-0.5 ${i < arr.length - 1 ? "pb-5" : ""}`}>
                  <strong className="text-sm">{EVENT_LABEL[e.action] ?? e.action}</strong>
                  <span className="text-[13px] text-muted">{e.summary}{e.admin_id && ` · ${adminName.get(e.admin_id) ?? ""}`}</span>
                  <span className="num text-xs text-muted">{new Intl.DateTimeFormat("ar-KW-u-nu-latn", { timeZone: "Asia/Kuwait", dateStyle: "medium", timeStyle: "short" }).format(new Date(e.created_at))}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}

const EVENT_LABEL: Record<string, string> = {
  created: "تسجيل الفاتورة",
  updated: "تعديل",
  marked_unpaid: "تغيير إلى غير مدفوعة",
  marked_paid: "تأكيد الدفع",
};
