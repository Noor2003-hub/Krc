"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { siteUrl, SUPABASE_KEY, SUPABASE_URL } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; info?: string };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "اكتب البريد وكلمة المرور." };

  if (!SUPABASE_URL || !SUPABASE_KEY) return { error: "إعدادات Supabase ناقصة في Vercel (متغيرات البيئة). أعد النشر بعد ربط Supabase." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "email_not_confirmed") return { error: "البريد غير مؤكَّد. في Supabase → Authentication → Users أكِّد المستخدم (Confirm user)." };
    if (code === "invalid_credentials" || error?.status === 400) return { error: "البريد أو كلمة المرور غير صحيحة." };
    return { error: `تعذّر الاتصال بقاعدة البيانات (${error?.status ?? "?"}). حاول بعد دقيقة.` };
  }

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
  const site = siteUrl((await headers()).get("origin"));
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${site}/auth/confirm?next=/reset-password` });
  // نفس الرسالة دائماً عشان ما نكشف أي بريد مسجّل
  return { info: "لو البريد مسجّل، وصلك رابط لتعيين كلمة مرور جديدة." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
