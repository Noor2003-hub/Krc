"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export type ExpenseState = { error?: string; ok?: string; at?: number };

const CATEGORIES = ["rent", "salaries", "other"];

export async function saveExpense(_prev: ExpenseState, fd: FormData): Promise<ExpenseState> {
  const { admin, supabase } = await requireAdmin();
  const id = Number(fd.get("id") ?? 0) || null;
  const month = String(fd.get("month") ?? "");
  const category = String(fd.get("category") ?? "");
  const amount = Number(String(fd.get("amount") ?? "").replace(/,/g, ""));
  const spentOn = String(fd.get("spent_on") ?? "");
  const description = String(fd.get("description") ?? "").trim();

  if (!/^\d{4}-\d{2}-01$/.test(month)) return { error: "اختر الشهر." };
  if (!CATEGORIES.includes(category)) return { error: "اختر نوع المصروف." };
  if (!(amount > 0) || amount > 1_000_000) return { error: "اكتب مبلغ صحيح." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(spentOn)) return { error: "تاريخ الصرف غير صحيح." };
  if (category === "other" && !description) return { error: "اكتب وصف للمصروف (مثلاً: كهرباء، أدوات)." };

  const row = { month, category, amount, spent_on: spentOn, description: description || null, updated_by: admin.id, updated_at: new Date().toISOString() };
  const { error } = id
    ? await supabase.from("expenses").update(row).eq("id", id)
    : await supabase.from("expenses").insert({ ...row, created_by: admin.id });
  if (error) return { error: "ما قدرنا نحفظ المصروف." };

  revalidatePath("/", "layout");
  if (id) redirect(`/expenses?month=${month}`);
  return { ok: "تم حفظ المصروف.", at: Date.now() };
}

export async function deleteExpense(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = Number(fd.get("id"));
  const month = String(fd.get("month") ?? "");
  if (id) await supabase.from("expenses").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect(`/expenses${/^\d{4}-\d{2}-01$/.test(month) ? `?month=${month}` : ""}`);
}
