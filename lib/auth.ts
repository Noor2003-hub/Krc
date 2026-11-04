import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "./supabase/server";
import type { Admin, Settings } from "./types";

/** المسؤول الحالي؛ لو مش مسؤول أو مش داخل يرجع لصفحة الدخول */
export const requireAdmin = cache(async (): Promise<{ admin: Admin; supabase: Awaited<ReturnType<typeof createClient>> }> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) redirect("/login");

  const { data: admin } = await supabase
    .from("admins")
    .select("id, name, email, must_change_password, last_login_at")
    .eq("id", uid)
    .maybeSingle();

  if (!admin) {
    await supabase.auth.signOut();
    redirect("/login?error=not-admin");
  }
  return { admin: admin as Admin, supabase };
});

export const getSettings = cache(async (): Promise<Settings> => {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("settings").select("cutoff_day, default_fee").eq("id", 1).maybeSingle();
  return {
    cutoff_day: data?.cutoff_day ?? 15,
    default_fee: Number(data?.default_fee ?? 35),
  };
});
