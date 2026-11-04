import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { requireAdmin } from "@/lib/auth";
import type { InvoiceWithCustomer } from "@/lib/types";
import { InvoiceForm } from "../../InvoiceForm";
import { loadInvoiceFormData } from "../../formData";

export const metadata = { title: "تعديل فاتورة" };

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("invoices").select("*, customer:customers(id, name, phone)").eq("id", Number(id)).maybeSingle();
  if (!data) notFound();
  const inv = data as InvoiceWithCustomer;
  const { subscribers, taken, settings } = await loadInvoiceFormData(inv.id);

  // لو المشترك صار غير نشط، نخليه ظاهر في القائمة
  if (inv.kind === "regular" && !subscribers.some((s) => s.id === inv.customer_id) && inv.customer) {
    subscribers.unshift({ id: inv.customer_id, name: inv.customer.name, phone: inv.customer.phone, shift: inv.shift, monthly_fee: inv.amount });
  }

  return (
    <>
      <PageHeader title={`تعديل فاتورة رقم ${inv.id}`} back={{ href: `/invoices/${inv.id}`, label: "تفاصيل الفاتورة" }} />
      <InvoiceForm
        subscribers={subscribers}
        cutoffDay={settings.cutoff_day}
        defaultFee={settings.default_fee}
        taken={taken}
        initial={{
          id: inv.id,
          kind: inv.kind,
          customer_id: inv.customer_id,
          name: inv.customer?.name,
          phone: inv.customer?.phone ?? "",
          shift: inv.shift,
          invoice_date: inv.invoice_date,
          period_month: inv.period_month,
          amount: Number(inv.amount),
          status: inv.status,
          method: inv.method,
          method_note: inv.method_note,
          paid_on: inv.paid_on,
          reference: inv.reference,
          notes: inv.notes,
        }}
      />
    </>
  );
}
