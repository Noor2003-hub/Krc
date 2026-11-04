import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { amountInArabicWords, formatKwd, isPrepaid, KIND_LABEL, METHOD_LABEL, monthLabel, SHIFT_LABEL, splitKwd } from "@/lib/rules";
import type { InvoiceWithCustomer } from "@/lib/types";
import { PrintButton } from "./PrintButton";

export const metadata = { title: "سند قبض" };

// بيانات التواصل في أسفل السند
const CONTACT = { phone: "65723135", instagram: "Krc_2024", email: "krc.specialneeds2024@gmail.com" };

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("invoices").select("*, customer:customers(id, name, phone)").eq("id", Number(id)).maybeSingle();
  if (!data) notFound();
  const inv = data as InvoiceWithCustomer;
  const { data: creator } = inv.created_by
    ? await supabase.from("admins").select("name").eq("id", inv.created_by).maybeSingle()
    : { data: null };

  const { dinars, fils } = splitKwd(inv.amount);
  const d = inv.paid_on ?? inv.invoice_date;
  const dateStr = `${Number(d.slice(8, 10))} / ${Number(d.slice(5, 7))} / ${d.slice(0, 4)}`;
  const forText = inv.period_month
    ? `رسوم شهر ${monthLabel(inv.period_month)}${isPrepaid(inv.invoice_date, inv.period_month) ? " (مقدم)" : ""} · ${inv.kind === "regular" ? "مشترك ثابت" : KIND_LABEL[inv.kind]}`
    : "دفعة واحدة · عميل غير ثابت";

  return (
    <div className="flex min-h-screen flex-col items-center gap-5 bg-ground px-4 py-8 print:bg-white print:p-0">
      <div className="no-print flex w-full max-w-[600px] flex-wrap items-center justify-between gap-3">
        <Link href={`/invoices/${inv.id}`} className="btn">رجوع للفاتورة</Link>
        <PrintButton />
      </div>

      {inv.status !== "paid" && (
        <p className="no-print m-0 w-full max-w-[600px] rounded-xl bg-[#fef3c7] px-4 py-3 text-sm text-[#78350f]">
          تنبيه: هذه الفاتورة <strong>غير مدفوعة</strong>. سند القبض يُعطى بعد استلام المبلغ.
        </p>
      )}

      <article className="flex min-h-[920px] w-full max-w-[600px] flex-col bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] print:min-h-screen print:shadow-none">
        <div className="flex flex-1 flex-col gap-6 px-6 pt-11 sm:px-12">
          <header className="flex items-start justify-between gap-5 border-b-[3px] border-brand pb-[22px]">
            <div className="flex flex-col gap-1.5">
              <Image src="/krc-logo.png" alt="مركز الكويت للتأهيل KRC" width={180} height={97} priority />
              <span className="text-[13px] font-bold text-brand-dark">مركز الكويت للتأهيل</span>
            </div>
            <div className="flex flex-col gap-0.5 text-left">
              <h1 className="m-0 text-[28px] font-bold text-brand">سند قبض</h1>
              <span className="font-sans text-xs font-semibold tracking-[0.08em] text-muted">RECEIPT VOUCHER</span>
              <span className="num mt-2 text-sm text-muted">رقم {inv.id}</span>
              <span className="num text-sm text-muted">التاريخ: {dateStr}</span>
            </div>
          </header>

          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-semibold text-muted">وصلنا من</span>
            <span className="text-[22px] font-bold">{inv.customer?.name ?? "—"}</span>
            {inv.customer?.phone && <span dir="ltr" className="num text-right text-sm text-[#44403c]">{inv.customer.phone}</span>}
          </div>

          <div className="flex flex-col [&>div]:flex [&>div]:justify-between [&>div]:gap-4 [&>div]:border-b [&>div]:border-line-soft [&>div]:py-3 [&>div]:text-[15px] [&_span:first-child]:font-semibold [&_span:first-child]:text-muted [&_span:last-child]:text-left [&_span:last-child]:font-bold">
            <div><span>وذلك عن</span><span>{forText}</span></div>
            <div><span>الدوام</span><span>{SHIFT_LABEL[inv.shift]}</span></div>
            <div><span>طريقة الدفع</span><span>{inv.method ? METHOD_LABEL[inv.method] + (inv.method_note ? ` · ${inv.method_note}` : "") : "—"}</span></div>
            {inv.reference && <div><span>رقم المرجع</span><span dir="ltr" className="font-mono !font-medium">{inv.reference}</span></div>}
          </div>

          <div className="flex flex-col gap-2.5 rounded-[14px] bg-brand-tint px-[22px] py-[18px]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-base font-bold text-brand-dark">مبلغ وقدره</span>
              <div className="num flex gap-2">
                <Box value={String(dinars)} label="دينار" />
                <Box value={String(fils).padStart(3, "0")} label="فلس" />
              </div>
            </div>
            <span className="text-sm font-semibold text-brand-dark">{amountInArabicWords(inv.amount)}</span>
            <span className="sr-only">{formatKwd(inv.amount)} د.ك</span>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-8 pb-7 text-[13px] text-muted">
            <div className="flex flex-col gap-1.5">
              <span className="font-bold text-ink">المستلم</span>
              <span>{creator?.name ?? "—"}</span>
              <span className="h-[34px] border-b border-[#a8a29e]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-bold text-ink">الاعتماد</span>
              <span>التوقيع / الختم</span>
              <span className="h-[34px] border-b border-[#a8a29e]" />
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#b9d7f1] bg-brand-tint px-6 py-3.5 text-[13px] font-semibold text-brand-dark sm:px-12 print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>
            <span dir="ltr" className="num">{CONTACT.phone}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></svg>
            <span dir="ltr">{CONTACT.instagram}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
            <span dir="ltr">{CONTACT.email}</span>
          </span>
        </footer>
      </article>
    </div>
  );
}

function Box({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-[84px] flex-col items-center rounded-[10px] bg-white px-2.5 py-1.5">
      <span className="text-[26px] font-bold text-brand">{value}</span>
      <span className="text-[11px] font-bold text-muted">{label}</span>
    </div>
  );
}
