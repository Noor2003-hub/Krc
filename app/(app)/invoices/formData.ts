import { requireAdmin, getSettings } from "@/lib/auth";
import { addMonths, monthStart, todayKuwait } from "@/lib/rules";
import type { SubscriberOption } from "./InvoiceForm";

/** بيانات الفورم: المشتركين الثابتين + الفواتير الموجودة (للتنبيه من التكرار) */
export async function loadInvoiceFormData(excludeInvoiceId?: number) {
  const { supabase } = await requireAdmin();
  const settings = await getSettings();
  const from = addMonths(monthStart(todayKuwait()), -12);

  const [{ data: subs }, { data: existing }] = await Promise.all([
    supabase.from("customers").select("id, name, phone, shift, monthly_fee").eq("kind", "regular").eq("active", true).order("name"),
    supabase.from("invoices").select("id, customer_id, period_month").not("period_month", "is", null).gte("period_month", from),
  ]);

  const taken = (existing ?? [])
    .filter((r) => r.id !== excludeInvoiceId)
    .map((r) => `${r.customer_id}|${r.period_month}`);

  return { subscribers: (subs ?? []) as SubscriberOption[], taken, settings };
}
