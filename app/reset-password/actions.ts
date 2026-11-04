"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { passwordProblem } from "@/lib/password";

export type ResetState = { error?: string };

export async function setNewPassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const problem = passwordProblem(password, confirm);
  if (problem) return { error: problem };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) redirect("/login?error=link-expired");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "ما قدرنا نحفظ كلمة المرور. جرّب كلمة مختلفة." };
  await supabase.from("admins").update({ must_change_password: false }).eq("id", uid);
  redirect("/");
}
