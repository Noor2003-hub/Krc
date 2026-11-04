"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { siteUrl } from "@/lib/env";
import { requireAdmin } from "@/lib/auth";
import { passwordProblem } from "@/lib/password";

export type FormState = { error?: string; ok?: string };

export async function saveName(_prev: FormState, fd: FormData): Promise<FormState> {
  const { admin, supabase } = await requireAdmin();
  const name = String(fd.get("name") ?? "").trim();
  if (name.length < 2) return { error: "اكتب الاسم." };
  const { error } = await supabase.from("admins").update({ name }).eq("id", admin.id);
  if (error) return { error: "ما قدرنا نحفظ الاسم." };
  revalidatePath("/", "layout");
  return { ok: "تم حفظ الاسم." };
}

export async function changePassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const { admin, supabase } = await requireAdmin();
  const current = String(fd.get("current") ?? "");
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  const problem = passwordProblem(password, confirm);
  if (problem) return { error: problem };
  if (password === current) return { error: "كلمة المرور الجديدة لازم تختلف عن الحالية." };

  // تأكيد كلمة المرور الحالية
  const { error: checkError } = await supabase.auth.signInWithPassword({ email: admin.email, password: current });
  if (checkError) return { error: "كلمة المرور الحالية غير صحيحة." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "ما قدرنا نغيّر كلمة المرور. جرّب كلمة مختلفة." };
  await supabase.from("admins").update({ must_change_password: false }).eq("id", admin.id);
  revalidatePath("/", "layout");
  return { ok: "تم تغيير كلمة المرور." };
}

export async function sendResetLink(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const targetId = String(fd.get("admin_id") ?? "");
  const { data: target } = await supabase.from("admins").select("email").eq("id", targetId).maybeSingle();
  if (!target) return { error: "المسؤول غير موجود." };
  const site = siteUrl((await headers()).get("origin"));
  const { error } = await supabase.auth.resetPasswordForEmail(target.email, { redirectTo: `${site}/auth/confirm?next=/reset-password` });
  if (error) return { error: "ما قدرنا نرسل الرابط. جرّب بعد دقيقة." };
  return { ok: `تم إرسال رابط إعادة التعيين إلى ${target.email}` };
}

export async function saveInvoiceSettings(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const cutoff = Number(fd.get("cutoff_day"));
  const fee = Number(String(fd.get("default_fee") ?? "").replace(/,/g, ""));
  if (!Number.isInteger(cutoff) || cutoff < 1 || cutoff > 28) return { error: "يوم الفصل لازم يكون من 1 إلى 28." };
  if (!(fee >= 0)) return { error: "اكتب رسوم صحيحة." };
  const { error } = await supabase.from("settings").update({ cutoff_day: cutoff, default_fee: fee, updated_at: new Date().toISOString() }).eq("id", 1);
  if (error) return { error: "ما قدرنا نحفظ الإعدادات." };
  revalidatePath("/", "layout");
  return { ok: "تم الحفظ." };
}
