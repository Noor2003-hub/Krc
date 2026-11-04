// حساب أرقام لوحة التحكم من الفواتير (دالة صافية قابلة للاختبار)
import { addMonths, isPrepaid, monthStart, type Method, type Shift } from "./rules.ts";

export type AInvoice = {
  id: number;
  customer_id: string;
  kind: "regular" | "once";
  shift: Shift;
  invoice_date: string;
  period_month: string | null;
  amount: number;
  status: "paid" | "unpaid";
  method: Method | null;
};
export type AExpense = { month: string; category: "rent" | "salaries" | "other"; amount: number };
export type ACustomer = { id: string; name: string; kind: "regular" | "once"; shift: Shift; active: boolean; joined_on: string | null };

/** الشهر اللي تنحسب عليه الفاتورة: «عن شهر» أو شهر تاريخ الفاتورة للدفعة الواحدة */
export function accountingMonth(inv: Pick<AInvoice, "period_month" | "invoice_date">): string {
  return inv.period_month ?? monthStart(inv.invoice_date);
}

export function computeDashboard(invoices: AInvoice[], customers: ACustomer[], month: string, expenses: AExpense[] = []) {
  const inMonth = (inv: AInvoice) => accountingMonth(inv) === month;
  const paid = invoices.filter((i) => i.status === "paid");
  const paidThisMonth = paid.filter(inMonth);
  const sum = (xs: AInvoice[]) => xs.reduce((s, i) => s + Number(i.amount), 0);

  const collected = sum(paidThisMonth);
  const prevMonth = addMonths(month, -1);
  const collectedPrev = sum(paid.filter((i) => accountingMonth(i) === prevMonth));
  const changePct = collectedPrev > 0 ? ((collected - collectedPrev) / collectedPrev) * 100 : null;

  const regulars = customers.filter((c) => c.kind === "regular" && c.active && (!c.joined_on || monthStart(c.joined_on) <= month));
  const paidRegularIds = new Set(paidThisMonth.filter((i) => i.kind === "regular").map((i) => i.customer_id));
  const unpaidInvoiceIds = new Set(invoices.filter((i) => inMonth(i) && i.status === "unpaid").map((i) => i.customer_id));
  const notPaid = regulars
    .filter((c) => !paidRegularIds.has(c.id))
    .map((c) => ({ ...c, hasUnpaidInvoice: unpaidInvoiceIds.has(c.id) }));

  const oncePaid = paidThisMonth.filter((i) => i.kind === "once");
  const nextMonth = addMonths(month, 1);
  const prepaidNext = paid.filter((i) => i.period_month === nextMonth).length;

  const months = Array.from({ length: 6 }, (_, k) => addMonths(month, k - 5));
  const spentIn = (m: string) => expenses.filter((e) => e.month === m).reduce((s, e) => s + Number(e.amount), 0);
  const byMonth = months.map((m) => {
    const xs = paid.filter((i) => accountingMonth(i) === m);
    const regular = sum(xs.filter((i) => i.kind === "regular"));
    const once = sum(xs.filter((i) => i.kind === "once"));
    const spent = spentIn(m);
    return { month: m, regular, once, spent, net: regular + once - spent };
  });
  const spent = spentIn(month);
  const expenseByCategory = (["rent", "salaries", "other"] as const).map((c) => ({
    category: c,
    total: expenses.filter((e) => e.month === month && e.category === c).reduce((s, e) => s + Number(e.amount), 0),
  }));

  const shift = (["am", "pm"] as const).map((s) => {
    const xs = paidThisMonth.filter((i) => i.shift === s);
    return { shift: s, total: sum(xs), people: new Set(xs.map((i) => i.customer_id)).size };
  });

  const timing = {
    sameMonth: paidThisMonth.filter((i) => i.period_month && !isPrepaid(i.invoice_date, i.period_month)).length,
    prepaid: paidThisMonth.filter((i) => isPrepaid(i.invoice_date, i.period_month)).length,
  };

  const methods = (["cash", "wamd", "link", "other"] as const).map((m) => {
    const xs = paidThisMonth.filter((i) => i.method === m);
    return { method: m, count: xs.length, total: sum(xs) };
  });

  return {
    collected, changePct, spent, net: collected - spent, expenseByCategory,
    regularCount: regulars.length, regularPaid: regulars.length - notPaid.length, notPaid,
    onceCount: oncePaid.length, onceTotal: sum(oncePaid),
    prepaidNext, byMonth, shift, timing, methods,
  };
}
