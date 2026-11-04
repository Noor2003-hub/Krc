"use client";

import { useFormAction } from "@/components/useFormAction";
import { PasswordFields } from "@/components/PasswordFields";
import { SubmitButton } from "@/components/SubmitButton";
import { changePassword, saveInvoiceSettings, saveName, sendResetLink, type FormState } from "./actions";

function Msg({ state }: { state: FormState }) {
  if (!state.error && !state.ok) return null;
  return (
    <p role={state.error ? "alert" : "status"} className={`m-0 rounded-[10px] px-3.5 py-3 text-[13px] ${state.error ? "bg-[#fef2f2] text-[#7f1d1d]" : "bg-[#f0fdf4] text-[#14532d]"}`}>
      {state.error ?? state.ok}
    </p>
  );
}

export function NameForm({ name, email }: { name: string; email: string }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(saveName, {});
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-[18px]">
      <label className="fld">الاسم<input name="name" defaultValue={name} required className="inp" /></label>
      <label className="fld">البريد الإلكتروني
        <input value={email} dir="ltr" readOnly className="inp bg-ground text-right text-[#44403c]" />
      </label>
      <p className="hint -mt-2 m-0">الاسم يظهر في خانة «المستلم» في سند القبض. البريد للدخول ولا يتغير من هنا.</p>
      <Msg state={state} />
      <div className="flex justify-end"><SubmitButton pending={pending} className="btn">حفظ الاسم</SubmitButton></div>
    </form>
  );
}

export function PasswordForm() {
  const { state, onSubmit, pending } = useFormAction<FormState>(changePassword, {});
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-[18px]" key={state.ok ?? "pw"}>
      <label className="fld">كلمة المرور الحالية<input name="current" type="password" required autoComplete="current-password" className="inp" /></label>
      <PasswordFields />
      <Msg state={state} />
      <div className="flex justify-end"><SubmitButton pending={pending}>تغيير كلمة المرور</SubmitButton></div>
    </form>
  );
}

export function ResetLinkForm({ adminId }: { adminId: string }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(sendResetLink, {});
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <input type="hidden" name="admin_id" value={adminId} />
      <SubmitButton pending={pending} className="btn btn-sm h-[38px]" pendingText="جارٍ الإرسال…">إرسال رابط إعادة تعيين كلمة المرور</SubmitButton>
      <Msg state={state} />
    </form>
  );
}

export function InvoiceSettingsForm({ cutoff, fee }: { cutoff: number; fee: number }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(saveInvoiceSettings, {});
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <label className="fld flex-[1_1_220px]">يوم الفصل لـ «عن شهر»
          <input name="cutoff_day" type="number" min={1} max={28} defaultValue={cutoff} className="inp num" />
          <span className="hint">الدفع بعد هذا اليوم يُسجَّل للشهر اللي بعده</span>
        </label>
        <label className="fld flex-[1_1_220px]">الرسوم الشهرية الافتراضية (د.ك)
          <input name="default_fee" inputMode="decimal" defaultValue={fee.toFixed(3)} className="inp num" />
          <span className="hint">تتعبى تلقائياً للمشترك الجديد</span>
        </label>
      </div>
      <Msg state={state} />
      <div className="flex justify-end"><SubmitButton pending={pending} className="btn">حفظ</SubmitButton></div>
    </form>
  );
}
