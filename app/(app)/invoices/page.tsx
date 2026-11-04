import Link from "next/link";
import { InvoiceTable } from "@/components/InvoiceTable";
import { PageHeader, PlusIcon } from "@/components/PageHeader";
import { requireAdmin } from "@/lib/auth";
import { invoiceQuery, PAGE_SIZE, type InvoiceFilters } from "@/lib/invoiceQuery";
import { addMonths, monthLabel, monthStart, todayKuwait } from "@/lib/rules";
import type { InvoiceWithCustomer } from "@/lib/types";

export const metadata = { title: "الفواتير" };

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<InvoiceFilters> }) {
  const { supabase } = await requireAdmin();
  const f = await searchParams;
  const { data, count, error } = await invoiceQuery(supabase, f, { paginate: true });
  const rows = (data ?? []) as InvoiceWithCustomer[];
  const page = Math.max(1, Number(f.page) || 1);
  const total = count ?? 0;
  const current = monthStart(todayKuwait());
  const months = Array.from({ length: 18 }, (_, k) => addMonths(current, 1 - k));

  const params = new URLSearchParams(Object.entries(f).filter(([k, v]) => v && k !== "page") as [string, string][]);
  const pageHref = (p: number) => `/invoices?${new URLSearchParams({ ...Object.fromEntries(params), page: String(p) })}`;

  return (
    <>
      <PageHeader title="الفواتير" subtitle="كل الفواتير محفوظة هنا: الشهر، طريقة الدفع، وهل اتدفعت.">
        <a href={`/invoices/export?${params}`} className="btn">تصدير Excel</a>
        <Link href="/invoices/new" className="btn btn-primary"><PlusIcon />تسجيل فاتورة</Link>
      </PageHeader>

      <form className="card no-print flex flex-wrap items-end gap-4 px-5 py-4" aria-label="فلاتر">
        {f.customer && <input type="hidden" name="customer" value={f.customer} />}
        <label className="fld flex-[2_1_220px] text-xs text-muted">بحث
          <input type="search" name="q" defaultValue={f.q} placeholder="الاسم أو رقم الجوال أو رقم الفاتورة" className="inp" />
        </label>
        <Select name="kind" label="النوع" value={f.kind} options={[["", "الكل"], ["regular", "ثابت"], ["once", "غير ثابت"]]} />
        <Select name="shift" label="الدوام" value={f.shift} options={[["", "الكل"], ["am", "صباحي"], ["pm", "مسائي"]]} />
        <Select name="month" label="عن شهر" value={f.month} options={[["", "كل الشهور"], ...months.map((m) => [m, monthLabel(m)] as [string, string])]} />
        <Select name="status" label="الحالة" value={f.status} options={[["", "الكل"], ["paid", "مدفوعة"], ["unpaid", "غير مدفوعة"]]} />
        <Select name="method" label="طريقة الدفع" value={f.method} options={[["", "الكل"], ["cash", "كاش"], ["link", "رابط دفع"], ["wamd", "ومض"], ["other", "أخرى"]]} />
        <div className="flex gap-2">
          <button className="btn btn-primary">تطبيق</button>
          <Link href="/invoices" className="btn">مسح</Link>
        </div>
      </form>

      {error && <p role="alert" className="m-0 rounded-xl bg-[#fef2f2] p-4 text-sm text-[#7f1d1d]">صار خطأ في تحميل الفواتير.</p>}

      <section className="card overflow-hidden" aria-label="قائمة الفواتير">
        <div className="overflow-x-auto pt-2"><InvoiceTable rows={rows} showNumber /></div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5 text-[13px] text-muted">
          <span>عرض {rows.length} من {total} فاتورة</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={pageHref(page - 1)} className="btn btn-sm">السابق</Link>}
            {page * PAGE_SIZE < total && <Link href={pageHref(page + 1)} className="btn btn-sm">التالي</Link>}
          </div>
        </div>
      </section>
    </>
  );
}

function Select({ name, label, value, options }: { name: string; label: string; value?: string; options: [string, string][] }) {
  return (
    <label className="fld flex-[1_1_140px] text-xs text-muted">{label}
      <select name={name} defaultValue={value ?? ""} className="inp">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
