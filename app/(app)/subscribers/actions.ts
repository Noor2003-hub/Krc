"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSettings, requireAdmin } from "@/lib/auth";
import { todayKuwait } from "@/lib/rules";

export type SubscriberState = { error?: string };

export async function saveSubscriber(_prev: SubscriberState, fd: FormData): Promise<SubscriberState> {
  const { supabase } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const name = String(fd.get("name") ?? "").trim();
  const phone = String(fd.get("phone") ?? "").replace(/\s+/g, "");
  const shift = fd.get("shift") === "pm" ? "pm" : "am";
  const fee = Number(String(fd.get("monthly_fee") ?? "").replace(/,/g, ""));
  const joined = String(fd.get("joined_on") ?? "") || todayKuwait();
  const active = fd.get("active") !== "0";
  const notes = String(fd.get("notes") ?? "").trim();

  if (!name) return { error: "اكتب الاسم." };
  if (!(fee >= 0) || fee > 100000) return { error: "اكتب رسوم شهرية صحيحة." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(joined)) return { error: "تاريخ الاشتراك غير صحيح." };

  const row = { name, phone: phone || null, shift, monthly_fee: fee, joined_on: joined, active, notes: notes || null, kind: "regular" as const };
  const { error } = id
    ? await supabase.from("customers").update(row).eq("id", id)
    : await supabase.from("customers").insert(row);
  if (error) return { error: "ما قدرنا نحفظ المشترك." };

  revalidatePath("/", "layout");
  redirect("/subscribers");
}

/** تحويل عميل غير ثابت لمشترك ثابت */
export async function convertToRegular(fd: FormData) {
  const { supabase } = await requireAdmin();
  const settings = await getSettings();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await supabase
    .from("customers")
    .update({ kind: "regular", active: true, monthly_fee: settings.default_fee, joined_on: todayKuwait() })
    .eq("id", id);
  revalidatePath("/", "layout");
  redirect(`/subscribers/${id}/edit`);
}
