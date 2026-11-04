"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { useFormAction } from "@/components/useFormAction";
import { forgotPassword, signIn, type LoginState } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export function LoginForm({ initialError }: { initialError?: string }) {
  const { state: loginState, onSubmit, pending } = useFormAction<LoginState>(signIn, { error: initialError });
  const [forgotState, forgotAction, forgotPending] = useActionState<LoginState, FormData>(forgotPassword, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [show, setShow] = useState(false);
  const message = forgotState.info ?? forgotState.error ?? loginState.error;
  const isInfo = !!forgotState.info;

  return (
    <form ref={formRef} onSubmit={onSubmit} className="card flex flex-col gap-[18px] !rounded-2xl p-8">
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-2xl font-bold">تسجيل الدخول</h1>
        <p className="m-0 text-sm text-muted">للمسؤولين فقط</p>
      </div>
      <label className="fld">
        البريد الإلكتروني
        <input name="email" type="email" dir="ltr" required autoComplete="email" placeholder="name@example.com" className="inp h-12 text-right text-[15px]" />
      </label>
      <label className="fld">
        كلمة المرور
        <span className="relative block">
          <input name="password" type={show ? "text" : "password"} required autoComplete="current-password" className="inp h-12 pl-12 text-[15px]" />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} className="absolute left-1 top-1 flex h-10 w-10 cursor-pointer items-center justify-center border-0 bg-transparent text-muted">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
          </button>
        </span>
      </label>
      <div className="flex items-center justify-end">
        <button type="button" disabled={forgotPending} onClick={() => { const fd = new FormData(formRef.current!); startTransition(() => forgotAction(fd)); }} className="cursor-pointer border-0 bg-transparent p-0 text-sm font-bold text-brand underline">
          نسيت كلمة المرور؟
        </button>
      </div>
      <SubmitButton pending={pending} className="btn btn-primary h-[50px] rounded-xl text-base" pendingText="جارٍ الدخول…">دخول</SubmitButton>
      {message && (
        <div role={isInfo ? "status" : "alert"} className={`rounded-[10px] px-3.5 py-3 text-[13px] leading-relaxed ${isInfo ? "bg-[#f0fdf4] text-[#14532d]" : "bg-[#fef2f2] text-[#7f1d1d]"}`}>
          {message}
        </div>
      )}
    </form>
  );
}
