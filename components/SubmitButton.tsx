"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText = "جارٍ الحفظ…",
  className = "btn btn-primary",
  name,
  value,
  pending: pendingProp,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  name?: string;
  value?: string;
  /** للفورمات اللي تستخدم useFormAction */
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button type="submit" className={className} disabled={pending} name={name} value={value} aria-busy={pending}>
      {pending ? pendingText : children}
    </button>
  );
}
