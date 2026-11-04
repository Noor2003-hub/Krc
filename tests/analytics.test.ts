import { test } from "node:test";
import assert from "node:assert/strict";
import { computeDashboard, type AInvoice, type ACustomer } from "../lib/analytics.ts";

const customers: ACustomer[] = [
  { id: "a", name: "سارة", kind: "regular", shift: "am", active: true, joined_on: "2026-01-01" },
  { id: "b", name: "فهد", kind: "regular", shift: "pm", active: true, joined_on: "2026-02-01" },
  { id: "c", name: "عبدالله", kind: "regular", shift: "pm", active: true, joined_on: "2026-04-01" },
  { id: "d", name: "جاسم", kind: "regular", shift: "am", active: true, joined_on: "2026-12-01" }, // اشترك بعدين
  { id: "x", name: "مريم", kind: "once", shift: "am", active: true, joined_on: null },
];
const inv = (o: Partial<AInvoice>): AInvoice => ({
  id: 1, customer_id: "a", kind: "regular", shift: "am", invoice_date: "2026-11-04",
  period_month: "2026-11-01", amount: 35, status: "paid", method: "cash", ...o,
});
const invoices: AInvoice[] = [
  inv({ id: 1, customer_id: "a" }),
  inv({ id: 2, customer_id: "b", shift: "pm", invoice_date: "2026-10-28", method: "wamd" }), // مقدم لنوفمبر
  inv({ id: 3, customer_id: "c", shift: "pm", status: "unpaid", method: null }),
  inv({ id: 4, customer_id: "x", kind: "once", period_month: null, amount: 10, invoice_date: "2026-11-03", method: "link" }),
  inv({ id: 5, customer_id: "a", invoice_date: "2026-10-05", period_month: "2026-10-01" }),
  inv({ id: 6, customer_id: "a", invoice_date: "2026-11-20", period_month: "2026-12-01" }), // مقدم لديسمبر
];

test("لوحة التحكم لشهر نوفمبر", () => {
  const d = computeDashboard(invoices, customers, "2026-11-01");
  assert.equal(d.collected, 80);
  assert.equal(d.regularCount, 3);
  assert.equal(d.regularPaid, 2);
  assert.deepEqual(d.notPaid.map((c) => [c.id, c.hasUnpaidInvoice]), [["c", true]]);
  assert.equal(d.onceCount, 1);
  assert.equal(d.onceTotal, 10);
  assert.equal(d.prepaidNext, 1);
  assert.deepEqual(d.timing, { sameMonth: 1, prepaid: 1 });
  assert.equal(d.byMonth.at(-1)?.regular, 70);
  assert.equal(d.byMonth.at(-2)?.regular, 35);
  assert.equal(Math.round(d.changePct ?? 0), 129);
  assert.deepEqual(d.methods.map((m) => m.count), [1, 1, 1, 0]);
  assert.deepEqual(d.shift.map((s) => s.total), [45, 35]);
});

test("المصروفات والصافي", () => {
  const expenses = [
    { month: "2026-11-01", category: "rent" as const, amount: 300 },
    { month: "2026-11-01", category: "salaries" as const, amount: 200.5 },
    { month: "2026-11-01", category: "other" as const, amount: 9.5 },
    { month: "2026-10-01", category: "rent" as const, amount: 300 },
  ];
  const d = computeDashboard(invoices, customers, "2026-11-01", expenses);
  assert.equal(d.spent, 510);
  assert.equal(d.net, 80 - 510);
  assert.deepEqual(d.expenseByCategory.map((c) => c.total), [300, 200.5, 9.5]);
  assert.equal(d.byMonth.at(-1)?.net, -430);
  assert.equal(d.byMonth.at(-2)?.spent, 300);
  assert.equal(d.byMonth.at(-2)?.net, 35 - 300);
});
