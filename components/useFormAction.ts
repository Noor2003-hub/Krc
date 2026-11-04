"use client";

import { startTransition, useActionState, type FormEvent } from "react";

/**
 * مثل useActionState لكن بدون ما React يمسح الفورم بعد الإرسال،
 * عشان لو طلع خطأ تبقى البيانات اللي كتبها المسؤول.
 */
export function useFormAction<S>(action: (prev: S, fd: FormData) => Promise<S>, initial: S) {
  const [state, dispatch, pending] = useActionState<S, FormData>(
    action as (prev: Awaited<S>, fd: FormData) => Promise<S>,
    initial as Awaited<S>,
  );
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const fd = new FormData(e.currentTarget, submitter);
    startTransition(() => dispatch(fd));
  };
  return { state, onSubmit, pending, dispatch };
}
