"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { formatKwd, METHOD_LABEL, monthLabel, type Method } from "@/lib/rules";

export type InvoiceFormState = { error?: string; duplicate?: boolean };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}-01$/;
const METHODS: Method[] = ["cash", "link", "wamd", "other"];

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

export async function saveInvoice(_prev: InvoiceFormState, fd: FormData): Promise<InvoiceFormState> {
  const { admin, supabase } = await requireAdmin();

  const id = str(fd, "id") ? Number(str(fd, "id")) : null;
  const kind = str(fd, "kind") === "regular" ? "regular" : "once";
  const shift = str(fd, "shift") === "pm" ? "pm" : "am";
  const invoiceDate = str(fd, "invoice_date");
  const period = kind === "regular" ? str(fd, "period_month") : "";
  const amount = Number(str(fd, "amount").replace(/,/g, ""));
  const status = str(fd, "status") === "unpaid" ? "unpaid" : "paid";
  const method = str(fd, "method") as Method;
  const methodNote = str(fd, "method_note");
  const paidOn = str(fd, "paid_on");
  const reference = str(fd, "reference");
  const notes = str(fd, "notes");
  const confirmDuplicate = str(fd, "confirm_duplicate") === "1";
  const after = str(fd, "after");

  if (!DATE_RE.test(invoiceDate)) return { error: "تاريخ الفاتورة غير صحيح." };
  if (!(amount > 0) || amount > 100000) return { error: "اكتب مبلغ صحيح." };
  if (kind === "regular" && !MONTH_RE.test(period)) return { error: "اختر «قسط عن شهر»." };
  if (status === "paid" && !METHODS.includes(method)) return { error: "اختر طريقة الدفع." };
  if (status === "paid" && method === "other" && !methodNote) return { error: "اكتب طريقة الدفع الأخرى (مثلاً: تحويل بنكي)." };
  if (paidOn && !DATE_RE.test(paidOn)) return { error: "تاريخ الدفع غير صحيح." };

  // ---- العميل ----
  let customerId = str(fd, "customer_id");
  if (kind === "regular") {
    if (!customerId) return { error: "اختر المشترك." };
  } else {
    const name = str(fd, "name");
    const phone = str(fd, "phone").replace(/\s+/g, "");
    if (!name) return { error: "اكتب اسم العميل." };
    if (customerId) {
      await supabase.from("customers").update({ name, phone: phone || null }).eq("id", customerId).eq("kind", "once");
    }
    if (!customerId && phone) {
      const { data: found } = await supabase.from("customers").select("id").eq("phone", phone).limit(1).maybeSingle();
      if (found) customerId = found.id;
    }
    if (!customerId) {
      const { data: created, error } = await supabase
        .from("customers")
        .insert({ name, phone: phone || null, kind: "once", shift })
        .select("id")
        .single();
      if (error || !created) return { error: "ما قدرنا نحفظ العميل." };
      customerId = created.id;
    }
  }

  // ---- منع التكرار ----
  if (kind === "regular" && !confirmDuplicate) {
    let dup = supabase.from("invoices").select("id").eq("customer_id", customerId).eq("period_month", period);
    if (id) dup = dup.neq("id", id);
    const { data: existing } = await dup.limit(1);
    if (existing && existing.length) {
      return {
        duplicate: true,
        error: `المشترك عنده فاتورة رقم ${existing[0].id} عن ${monthLabel(period)}. لو متأكد، علّم «حفظ رغم التكرار» واحفظ مرة ثانية.`,
      };
    }
  }

  const row = {
    customer_id: customerId,
    kind,
    shift,
    invoice_date: invoiceDate,
    period_month: kind === "regular" ? period : null,
    amount,
    status,
    method: status === "paid" ? method : null,
    method_note: status === "paid" && method === "other" ? methodNote : null,
    paid_on: status === "paid" ? paidOn || invoiceDate : null,
    reference: reference || null,
    notes: notes || null,
    updated_by: admin.id,
    updated_at: new Date().toISOString(),
  };

  let invoiceId = id;
  if (id) {
    const { error } = await supabase.from("invoices").update(row).eq("id", id);
    if (error) return { error: "ما قدرنا نحفظ التعديل." };
    await supabase.from("invoice_events").insert({
      invoice_id: id, admin_id: admin.id, action: "updated",
      summary: `${status === "paid" ? `مدفوعة · ${METHOD_LABEL[method]}` : "غير مدفوعة"} · ${formatKwd(amount)} د.ك`,
    });
  } else {
    const { data, error } = await supabase.from("invoices").insert({ ...row, created_by: admin.id }).select("id").single();
    if (error || !data) return { error: "ما قدرنا نحفظ الفاتورة." };
    invoiceId = data.id;
    await supabase.from("invoice_events").insert({
      invoice_id: data.id, admin_id: admin.id, action: "created",
      summary: `${row.period_month ? `عن ${monthLabel(row.period_month)}` : "دفعة واحدة"} · ${formatKwd(amount)} د.ك · ${status === "paid" ? METHOD_LABEL[method] : "غير مدفوعة"}`,
    });
  }

  revalidatePath("/", "layout");
  redirect(after === "print" ? `/receipt/${invoiceId}` : `/invoices/${invoiceId}`);
}

export async function markUnpaid(fd: FormData) {
  const { admin, supabase } = await requireAdmin();
  const id = Number(fd.get("id"));
  if (!id) return;
  await supabase
    .from("invoices")
    .update({ status: "unpaid", method: null, method_note: null, paid_on: null, updated_by: admin.id, updated_at: new Date().toISOString() })
    .eq("id", id);
  await supabase.from("invoice_events").insert({ invoice_id: id, admin_id: admin.id, action: "marked_unpaid", summary: "تغيير إلى غير مدفوعة" });
  revalidatePath("/", "layout");
  redirect(`/invoices/${id}`);
}
