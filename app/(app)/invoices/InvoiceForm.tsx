"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormAction } from "@/components/useFormAction";
import { SubmitButton } from "@/components/SubmitButton";
import { addMonths, formatKwd, METHOD_LABEL, monthLabel, periodFor, SHIFT_LABEL, todayKuwait, type Kind, type Method, type Shift, type Status } from "@/lib/rules";
import { saveInvoice, type InvoiceFormState } from "./actions";

export type SubscriberOption = { id: string; name: string; phone: string | null; shift: Shift; monthly_fee: number | null };

export type InvoiceInitial = {
  id?: number;
  kind: Kind;
  customer_id?: string;
  name?: string;
  phone?: string;
  shift: Shift;
  invoice_date: string;
  period_month?: string | null;
  amount?: number;
  status: Status;
  method?: Method | null;
  method_note?: string | null;
  paid_on?: string | null;
  reference?: string | null;
  notes?: string | null;
};

export function InvoiceForm({
  subscribers, cutoffDay, defaultFee, taken, initial,
}: {
  subscribers: SubscriberOption[];
  cutoffDay: number;
  defaultFee: number;
  /** "customerId|YYYY-MM-01" للفواتير الموجودة (للتنبيه من التكرار) */
  taken: string[];
  initial: InvoiceInitial;
}) {
  const { state, onSubmit, pending } = useFormAction<InvoiceFormState>(saveInvoice, {});
  const editing = !!initial.id;

  const [kind, setKind] = useState<Kind>(initial.kind);
  const [customerId, setCustomerId] = useState(initial.customer_id ?? "");
  const sub = subscribers.find((s) => s.id === customerId);
  const [name, setName] = useState(initial.name ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [shift, setShift] = useState<Shift>(initial.shift);
  const [date, setDate] = useState(initial.invoice_date);
  const autoPeriod = periodFor(date || todayKuwait(), cutoffDay);
  const [periodOverride, setPeriodOverride] = useState<string | null>(initial.period_month && initial.period_month !== autoPeriod ? initial.period_month : null);
  const period = periodOverride ?? autoPeriod;
  const [amount, setAmount] = useState(initial.amount != null ? Number(initial.amount).toFixed(3) : "");
  const [status, setStatus] = useState<Status>(initial.status);
  const [method, setMethod] = useState<Method>(initial.method ?? "cash");

  const periodOptions = useMemo(() => Array.from({ length: 7 }, (_, k) => addMonths(autoPeriod, k - 3)), [autoPeriod]);
  const day = Number((date || "0000-00-00").slice(8, 10));
  const takenSet = useMemo(() => new Set(taken), [taken]);
  const isDuplicate = kind === "regular" && !!customerId && takenSet.has(`${customerId}|${period}`);
  const displayName = kind === "regular" ? sub?.name ?? "—" : name || "—";

  function pickSubscriber(id: string) {
    setCustomerId(id);
    const s = subscribers.find((x) => x.id === id);
    if (s) {
      setShift(s.shift);
      setAmount(Number(s.monthly_fee ?? defaultFee).toFixed(3));
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-start gap-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="period_month" value={kind === "regular" ? period : ""} />
      {kind === "regular" && <input type="hidden" name="customer_id" value={customerId} />}
      {kind === "once" && initial.kind === "once" && initial.customer_id && <input type="hidden" name="customer_id" value={initial.customer_id} />}

      <div className="card flex min-w-0 flex-[3_1_480px] flex-col gap-6 p-7">
        <Fieldset legend="نوع العميل">
          <div className="grid grid-cols-2 gap-2.5">
            <Choice name="kind_ui" checked={kind === "regular"} onChange={() => setKind("regular")} label="مشترك ثابت" sub="رسوم شهرية، مسجّل عندنا" disabled={editing && initial.kind === "once"} />
            <Choice name="kind_ui" checked={kind === "once"} onChange={() => setKind("once")} label="عميل غير ثابت" sub="دفعة واحدة بدون اشتراك" disabled={editing && initial.kind === "regular"} />
          </div>
          {kind === "regular" && (
            <label className="fld">اختر المشترك
              <select className="inp" value={customerId} onChange={(e) => pickSubscriber(e.target.value)} required>
                <option value="">— اختر —</option>
                {subscribers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} · {SHIFT_LABEL[s.shift]} · {formatKwd(s.monthly_fee ?? defaultFee)} د.ك شهرياً</option>
                ))}
              </select>
              {subscribers.length === 0 && <span className="hint">ما في مشتركين ثابتين بعد. <Link href="/subscribers/new" className="font-bold">أضف مشترك</Link></span>}
            </label>
          )}
        </Fieldset>

        <hr className="m-0 border-line-soft" />

        <Fieldset legend="بيانات العميل">
          {kind === "once" ? (
            <div className="flex flex-wrap gap-4">
              <label className="fld flex-[1_1_220px]">الاسم
                <input name="name" className="inp" value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label className="fld flex-[1_1_220px]">رقم الجوال <span className="hint">(اختياري، لربط الدفعات المتكررة)</span>
                <input name="phone" dir="ltr" inputMode="tel" className="inp text-right" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
            </div>
          ) : (
            sub && <p className="m-0 text-sm text-[#44403c]"><strong>{sub.name}</strong>{sub.phone && <> · <span dir="ltr" className="num">{sub.phone}</span></>}</p>
          )}
          <div className="fld">الدوام
            <div className="grid max-w-[420px] grid-cols-2 gap-2.5">
              <Choice name="shift" value="am" checked={shift === "am"} onChange={() => setShift("am")} label="صباحي" />
              <Choice name="shift" value="pm" checked={shift === "pm"} onChange={() => setShift("pm")} label="مسائي" />
            </div>
          </div>
        </Fieldset>

        <hr className="m-0 border-line-soft" />

        <Fieldset legend="الفاتورة">
          <div className="flex flex-wrap gap-4">
            <label className="fld flex-[1_1_200px]">تاريخ الفاتورة
              <input type="date" name="invoice_date" className="inp" value={date} onChange={(e) => { setDate(e.target.value); setPeriodOverride(null); }} required />
            </label>
            <label className="fld flex-[1_1_200px]">المبلغ
              <span className="flex h-11 overflow-hidden rounded-[10px] border-2 border-brand bg-white">
                <input name="amount" inputMode="decimal" className="num min-w-0 flex-1 border-0 px-3 text-lg font-semibold outline-none" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                <span className="flex items-center px-3.5 text-sm font-bold text-[#44403c]">د.ك</span>
              </span>
            </label>
          </div>
          {kind === "regular" && (
            <div className="flex flex-col gap-2.5 rounded-xl border border-[#b9d7f1] bg-brand-tint p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <label className="fld flex-[1_1_220px]">قسط عن شهر
                  <select className="inp border-[#8fbde6]" value={period} onChange={(e) => setPeriodOverride(e.target.value === autoPeriod ? null : e.target.value)}>
                    {periodOptions.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
                  </select>
                </label>
                <span className="pill pill-regular">{periodOverride ? "معدّل يدوياً" : "محسوب تلقائياً"}</span>
              </div>
              <p className="m-0 text-[13px] leading-relaxed text-brand-dark">
                {day ? <>التاريخ يوم <strong>{day}</strong> = {day <= cutoffDay ? "أول الشهر، فالفاتورة لنفس الشهر." : "آخر الشهر، فالفاتورة مقدماً للشهر اللي بعده."}<br /></> : null}
                القاعدة: من 1 إلى {cutoffDay} ← نفس الشهر · من {cutoffDay + 1} لآخر الشهر ← الشهر اللي بعده.
              </p>
            </div>
          )}
          <label className="fld">ملاحظات <span className="hint">(اختياري)</span>
            <textarea name="notes" rows={2} defaultValue={initial.notes ?? ""} className="inp h-auto resize-y py-3" />
          </label>
        </Fieldset>

        <hr className="m-0 border-line-soft" />

        <Fieldset legend="الدفع">
          <div className="fld">الحالة
            <div className="grid max-w-[420px] grid-cols-2 gap-2.5">
              <Choice name="status" value="paid" checked={status === "paid"} onChange={() => setStatus("paid")} label="مدفوعة" />
              <Choice name="status" value="unpaid" checked={status === "unpaid"} onChange={() => setStatus("unpaid")} label="غير مدفوعة" />
            </div>
          </div>
          {status === "paid" && (
            <>
              <div className="fld">طريقة الدفع
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {(["cash", "link", "wamd", "other"] as const).map((m) => (
                    <Choice key={m} name="method" value={m} checked={method === m} onChange={() => setMethod(m)} label={METHOD_LABEL[m]} />
                  ))}
                </div>
              </div>
              {method === "other" && (
                <label className="fld">وضّح طريقة الدفع
                  <input name="method_note" defaultValue={initial.method_note ?? ""} placeholder="مثلاً: تحويل بنكي" className="inp" required />
                </label>
              )}
              <div className="flex flex-wrap gap-4">
                <label className="fld flex-[1_1_200px]">تاريخ الدفع
                  <input type="date" name="paid_on" defaultValue={initial.paid_on ?? ""} className="inp" />
                  <span className="hint">لو فاضي = تاريخ الفاتورة</span>
                </label>
                <label className="fld flex-[1_1_200px]">رقم المرجع <span className="hint">(لومض أو الرابط أو التحويل)</span>
                  <input name="reference" dir="ltr" defaultValue={initial.reference ?? ""} placeholder="اختياري" className="inp text-right" />
                </label>
              </div>
            </>
          )}
        </Fieldset>

        {state.error && (
          <div role="alert" className="flex flex-col gap-2 rounded-[10px] bg-[#fef2f2] px-3.5 py-3 text-[13px] text-[#7f1d1d]">
            <span>{state.error}</span>
            {state.duplicate && (
              <label className="flex items-center gap-2 font-bold"><input type="checkbox" name="confirm_duplicate" value="1" />حفظ رغم التكرار</label>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Link href={initial.id ? `/invoices/${initial.id}` : "/invoices"} className="btn h-12">إلغاء</Link>
          <SubmitButton pending={pending} className="btn h-12" name="after" value="print">حفظ وطباعة سند قبض</SubmitButton>
          <SubmitButton pending={pending} className="btn btn-primary h-12 px-6 text-[15px]" name="after" value="view">
            حفظ الفاتورة{Number(amount) > 0 ? ` · ${formatKwd(amount)} د.ك` : ""}
          </SubmitButton>
        </div>
      </div>

      <aside aria-label="ملخص الفاتورة" className="flex min-w-0 flex-[2_1_320px] flex-col gap-4 lg:sticky lg:top-8">
        <div className="card flex flex-col gap-4 p-6">
          <h2 className="m-0 text-lg font-bold">ملخص الفاتورة</h2>
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-[13px] [&_dd]:m-0 [&_dd]:text-left [&_dd]:font-bold [&_dt]:font-semibold [&_dt]:text-muted">
            <dt>العميل</dt><dd>{displayName}</dd>
            <dt>النوع</dt><dd><span className={`pill pill-${kind}`}>{kind === "regular" ? "مشترك ثابت" : "غير ثابت"}</span></dd>
            <dt>الدوام</dt><dd><span className={`pill pill-${shift}`}>{SHIFT_LABEL[shift]}</span></dd>
            <dt>عن شهر</dt><dd>{kind === "regular" ? monthLabel(period) : "دفعة واحدة"}</dd>
            <dt>المبلغ</dt><dd className="num">{Number(amount) > 0 ? `${formatKwd(amount)} د.ك` : "—"}</dd>
            <dt>طريقة الدفع</dt><dd>{status === "paid" ? METHOD_LABEL[method] : "—"}</dd>
            <dt>الحالة</dt><dd><span className={`pill pill-${status}`}>{status === "paid" ? "مدفوعة" : "غير مدفوعة"}</span></dd>
          </dl>
          {kind === "regular" && customerId && (
            isDuplicate ? (
              <p className="m-0 rounded-[10px] bg-[#fef3c7] px-3.5 py-3 text-[13px] leading-relaxed text-[#78350f]">تنبيه: {sub?.name} عنده فاتورة عن {monthLabel(period)}.</p>
            ) : (
              <p className="m-0 rounded-[10px] bg-[#f0fdf4] px-3.5 py-3 text-[13px] leading-relaxed text-[#14532d]">✓ {sub?.name} ما عنده فاتورة عن {monthLabel(period)}، ما في تكرار.</p>
            )
          )}
        </div>
        {kind === "regular" && (
          <div className="rounded-[14px] bg-line-soft px-5 py-4 text-[13px] leading-7 text-[#292524]">
            <strong className="mb-1 block text-sm">أمثلة على «عن شهر»</strong>
            دفع يوم 4 ← نفس الشهر<br />دفع يوم {cutoffDay} ← نفس الشهر<br />دفع يوم {cutoffDay + 1} ← الشهر اللي بعده (مقدم)
          </div>
        )}
      </aside>
    </form>
  );
}

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="m-0 flex flex-col gap-3.5 border-0 p-0">
      <legend className="mb-3.5 p-0 text-base font-bold">{legend}</legend>
      {children}
    </fieldset>
  );
}

function Choice({ name, value, checked, onChange, label, sub, disabled }: {
  name: string; value?: string; checked: boolean; onChange: () => void; label: string; sub?: string; disabled?: boolean;
}) {
  return (
    <label className={`opt flex-col !items-start gap-0.5 ${disabled ? "cursor-not-allowed opacity-50" : ""}`}>
      <span className="flex items-center gap-2"><input type="radio" name={name} value={value ?? label} checked={checked} onChange={onChange} disabled={disabled} />{label}</span>
      {sub && <span className="pr-6 text-xs font-medium text-muted">{sub}</span>}
    </label>
  );
}
