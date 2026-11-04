import Link from "next/link";
import { KindPill, ShiftPill, StatusPill } from "@/components/Pills";
import { dateLabel, formatKwd, isPrepaid, METHOD_LABEL, monthLabel } from "@/lib/rules";
import type { InvoiceWithCustomer } from "@/lib/types";

export function InvoiceTable({ rows, showNumber = false }: { rows: InvoiceWithCustomer[]; showNumber?: boolean }) {
  if (!rows.length) return <p className="m-0 px-5 pb-6 text-sm text-muted">ما في فواتير.</p>;
  return (
    <table className="tbl min-w-[900px]">
      <thead>
        <tr>
          {showNumber && <th>رقم</th>}
          <th>الاسم</th><th>النوع</th><th>الدوام</th><th>تاريخ الفاتورة</th><th>عن شهر</th><th>المبلغ</th><th>طريقة الدفع</th><th>الحالة</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            {showNumber && <td className="num"><Link href={`/invoices/${r.id}`} className="font-semibold">{r.id}</Link></td>}
            <td>
              <Link href={`/invoices/${r.id}`} className="font-bold no-underline hover:underline">{r.customer?.name ?? "—"}</Link>
              {showNumber && r.customer?.phone && <><br /><span dir="ltr" className="num inline-block text-xs text-muted">{r.customer.phone}</span></>}
            </td>
            <td><KindPill kind={r.kind} /></td>
            <td><ShiftPill shift={r.shift} /></td>
            <td className="num">{dateLabel(r.invoice_date)}</td>
            <td>{r.period_month ? <>{monthLabel(r.period_month)}{isPrepaid(r.invoice_date, r.period_month) && <span className="text-xs text-muted"> (مقدم)</span>}</> : "دفعة واحدة"}</td>
            <td className="num">{formatKwd(r.amount)} د.ك</td>
            <td>{r.method ? METHOD_LABEL[r.method] + (r.method === "other" && r.method_note ? ` · ${r.method_note}` : "") : "—"}</td>
            <td><StatusPill status={r.status} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
