"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; info?: string };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "اكتب البريد وكلمة المرور." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "البريد أو كلمة المرور غير صحيحة." };

  const { data: admin } = await supabase.from("admins").select("id").eq("id", data.user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    return { error: "هذا الحساب ليس من المسؤولين." };
  }
  await supabase.from("admins").update({ last_login_at: new Date().toISOString() }).eq("id", data.user.id);
  redirect("/");
}

export async function forgotPassword(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "اكتب بريدك أولاً ثم اضغط «نسيت كلمة المرور؟»." };
  const supabase = await createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${site}/auth/confirm?next=/reset-password` });
  // نفس الرسالة دائماً عشان ما نكشف أي بريد مسجّل
  return { info: "لو البريد مسجّل، وصلك رابط لتعيين كلمة مرور جديدة." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
