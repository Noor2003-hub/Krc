import { PageHeader } from "@/components/PageHeader";
import { todayKuwait } from "@/lib/rules";
import { InvoiceForm } from "../InvoiceForm";
import { loadInvoiceFormData } from "../formData";

export const metadata = { title: "تسجيل فاتورة" };

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ customer?: string }> }) {
  const { customer } = await searchParams;
  const { subscribers, taken, settings } = await loadInvoiceFormData();
  const pre = subscribers.find((s) => s.id === customer);

  return (
    <>
      <PageHeader title="تسجيل فاتورة" subtitle="سجّل الفاتورة بعد ما العميل يدفع، أو سجّلها غير مدفوعة وحدّثها بعدين." back={{ href: "/invoices", label: "الفواتير" }} />
      <InvoiceForm
        subscribers={subscribers}
        cutoffDay={settings.cutoff_day}
        defaultFee={settings.default_fee}
        taken={taken}
        initial={{
          kind: subscribers.length ? "regular" : "once",
          customer_id: pre?.id,
          shift: pre?.shift ?? "am",
          invoice_date: todayKuwait(),
          amount: pre ? Number(pre.monthly_fee ?? settings.default_fee) : undefined,
          status: "paid",
          method: "cash",
        }}
      />
    </>
  );
}
