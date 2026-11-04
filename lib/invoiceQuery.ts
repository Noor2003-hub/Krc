import type { SupabaseClient } from "@supabase/supabase-js";
import { addMonths } from "./rules";

export type InvoiceFilters = {
  q?: string;
  kind?: string;
  shift?: string;
  month?: string;
  status?: string;
  method?: string;
  customer?: string;
  page?: string;
};

export const PAGE_SIZE = 50;

/** يبني استعلام الفواتير حسب الفلاتر (يُستخدم في الصفحة وفي التصدير) */
export function invoiceQuery(supabase: SupabaseClient, f: InvoiceFilters, opts: { paginate: boolean }) {
  const q = (f.q ?? "").trim().replace(/[%,()]/g, " ");
  // أرقام قصيرة = رقم فاتورة، غير كذا = اسم أو جوال
  const isInvoiceNo = /^\d{1,6}$/.test(q);
  const joinInner = !!q && !isInvoiceNo;
  let query = supabase
    .from("invoices")
    .select(`*, customer:customers${joinInner ? "!inner" : ""}(id, name, phone)`, { count: "exact" })
    .order("invoice_date", { ascending: false })
    .order("id", { ascending: false });

  if (q) {
    if (isInvoiceNo) query = query.eq("id", Number(q));
    else query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`, { referencedTable: "customers" });
  }
  if (f.kind === "regular" || f.kind === "once") query = query.eq("kind", f.kind);
  if (f.shift === "am" || f.shift === "pm") query = query.eq("shift", f.shift);
  if (f.status === "paid" || f.status === "unpaid") query = query.eq("status", f.status);
  if (f.method && ["cash", "link", "wamd", "other"].includes(f.method)) query = query.eq("method", f.method);
  if (f.customer && /^[0-9a-f-]{36}$/i.test(f.customer)) query = query.eq("customer_id", f.customer);
  if (f.month && /^\d{4}-\d{2}-01$/.test(f.month)) {
    const next = addMonths(f.month, 1);
    query = query.or(`period_month.eq.${f.month},and(period_month.is.null,invoice_date.gte.${f.month},invoice_date.lt.${next})`);
  }
  if (opts.paginate) {
    const page = Math.max(1, Number(f.page) || 1);
    query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  }
  return query;
}
