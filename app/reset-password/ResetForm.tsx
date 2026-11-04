"use client";

import { useFormAction } from "@/components/useFormAction";
import { PasswordFields } from "@/components/PasswordFields";
import { SubmitButton } from "@/components/SubmitButton";
import { setNewPassword, type ResetState } from "./actions";

export function ResetForm() {
  const { state, onSubmit, pending } = useFormAction<ResetState>(setNewPassword, {});
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <PasswordFields />
      {state.error && <p role="alert" className="m-0 rounded-[10px] bg-[#fef2f2] px-3.5 py-3 text-[13px] text-[#7f1d1d]">{state.error}</p>}
      <SubmitButton pending={pending}>حفظ كلمة المرور</SubmitButton>
    </form>
  );
}
