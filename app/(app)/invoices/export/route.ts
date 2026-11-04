import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { invoiceQuery } from "@/lib/invoiceQuery";
import { KIND_LABEL, METHOD_LABEL, monthLabel, SHIFT_LABEL, STATUS_LABEL, todayKuwait } from "@/lib/rules";
import type { InvoiceWithCustomer } from "@/lib/types";

// ملف CSV يفتح في Excel بالعربي (مع BOM)
export async function GET(request: NextRequest) {
  const { supabase } = await requireAdmin();
  const f = Object.fromEntries(request.nextUrl.searchParams);
  const { data, error } = await invoiceQuery(supabase, f, { paginate: false }).limit(10000);
  if (error) return new NextResponse("خطأ في التصدير", { status: 500 });

  const header = ["رقم الفاتورة", "الاسم", "الجوال", "النوع", "الدوام", "تاريخ الفاتورة", "عن شهر", "المبلغ (د.ك)", "الحالة", "طريقة الدفع", "تفاصيل الطريقة", "تاريخ الدفع", "رقم المرجع", "ملاحظات"];
  const rows = ((data ?? []) as InvoiceWithCustomer[]).map((r) => [
    r.id, r.customer?.name ?? "", r.customer?.phone ?? "", KIND_LABEL[r.kind], SHIFT_LABEL[r.shift], r.invoice_date,
    r.period_month ? monthLabel(r.period_month) : "دفعة واحدة", Number(r.amount).toFixed(3), STATUS_LABEL[r.status],
    r.method ? METHOD_LABEL[r.method] : "", r.method_note ?? "", r.paid_on ?? "", r.reference ?? "", r.notes ?? "",
  ]);
  const esc = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@]/.test(s)) s = `'${s}`; // حماية من صيغ Excel
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = "﻿" + [header, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="krc-invoices-${todayKuwait()}.csv"`,
    },
  });
}
