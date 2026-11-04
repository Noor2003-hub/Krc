import Link from "next/link";
import { Money } from "@/components/Money";
import { PageHeader } from "@/components/PageHeader";
import { requireAdmin } from "@/lib/auth";
import { accountingMonth } from "@/lib/analytics";
import { addMonths, dateLabel, EXPENSE_LABEL, monthLabel, monthStart, todayKuwait } from "@/lib/rules";
import type { Expense } from "@/lib/types";
import { DeleteExpenseButton } from "./DeleteButton";
import { ExpenseForm } from "./ExpenseForm";

export const metadata = { title: "المصروفات" };

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ month?: string; category?: string }> }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const today = todayKuwait();
  const current = monthStart(today);
  const month = sp.month && /^\d{4}-\d{2}-01$/.test(sp.month) ? sp.month : current;
  const months6 = Array.from({ length: 6 }, (_, k) => addMonths(month, k - 5));
  const from = months6[0];
  const to = addMonths(month, 1);

  const [{ data: expData }, { data: invData }, { data: admins }] = await Promise.all([
    supabase.from("expenses").select("*").gte("month", from).lt("month", to).order("spent_on", { ascending: false }).order("id", { ascending: false }),
    supabase.from("invoices").select("amount, period_month, invoice_date").eq("status", "paid")
      .or(`and(period_month.gte.${from},period_month.lt.${to}),and(period_month.is.null,invoice_date.gte.${from},invoice_date.lt.${to})`),
    supabase.from("admins").select("id, name"),
  ]);
  const all = (expData ?? []) as Expense[];
  const adminName = new Map((admins ?? []).map((a) => [a.id, a.name as string]));
  const thisMonth = all.filter((e) => e.month === month);
  const list = sp.category ? thisMonth.filter((e) => e.category === sp.category) : thisMonth;
  const total = (xs: Expense[]) => xs.reduce((s, e) => s + Number(e.amount), 0);
  const spent = total(thisMonth);
  const byCat = (["rent", "salaries", "other"] as const).map((c) => ({ c, total: total(thisMonth.filter((e) => e.category === c)) }));

  const collectedIn = (m: string) =>
    (invData ?? []).filter((i) => accountingMonth(i) === m).reduce((s, i) => s + Number(i.amount), 0);
  const collected = collectedIn(month);
  const net = collected - spent;
  const history = months6.map((m) => {
    const sp = total(all.filter((e) => e.month === m));
    const col = collectedIn(m);
    return { m, col, sp, net: col - sp };
  });
  const monthOptions = Array.from({ length: 12 }, (_, k) => addMonths(current, 1 - k));

  return (
    <>
      <PageHeader title="المصروفات" subtitle={`مصروفات شهر ${monthLabel(month)}: إيجار، رواتب، ومصروفات أخرى.`}>
        <form className="flex items-center gap-2 text-[13px] font-semibold text-[#44403c]">
          <label htmlFor="month">الشهر</label>
          <select id="month" name="month" defaultValue={month} className="inp w-auto">
            {monthOptions.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <button className="btn btn-sm">عرض</button>
        </form>
      </PageHeader>

      <section aria-label="ملخص الشهر" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Kpi label="المحصّل" value={collected} />
        <Kpi label="إجمالي المصروفات" value={spent} />
        <Kpi label="الصافي (المحصّل − المصروفات)" value={net} tone={net >= 0 ? "good" : "bad"} />
      </section>
      <section aria-label="حسب النوع" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {byCat.map((x) => <Kpi key={x.c} label={EXPENSE_LABEL[x.c]} value={x.total} small />)}
      </section>

      <div className="flex flex-col gap-6">
        <section className="card flex min-w-0 flex-col gap-4 p-6" aria-label="إضافة مصروف">
          <h2 className="m-0 text-lg font-bold">إضافة مصروف</h2>
          <ExpenseForm month={month} today={today} />
        </section>

        <section className="card flex min-w-0 flex-col gap-4 overflow-hidden" aria-label="مصروفات الشهر">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6">
            <h2 className="m-0 text-lg font-bold">مصروفات {monthLabel(month)}</h2>
            <div className="flex flex-wrap gap-2">
              {[["", "الكل"], ["rent", "إيجار"], ["salaries", "رواتب"], ["other", "أخرى"]].map(([v, l]) => (
                <Link key={v} href={`/expenses?month=${month}${v ? `&category=${v}` : ""}`}
                  className={`inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] no-underline ${(sp.category ?? "") === v ? "border-ink bg-ink font-bold text-white" : "border-[#d6d3cd] bg-white font-semibold text-[#44403c]"}`}>{l}</Link>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            {list.length === 0 ? (
              <p className="m-0 px-6 pb-6 text-sm text-muted">ما في مصروفات مسجّلة لهذا الشهر.</p>
            ) : (
              <table className="tbl min-w-[620px]">
                <thead><tr><th>النوع</th><th>الوصف</th><th>تاريخ الصرف</th><th>المبلغ</th><th>سجّلها</th><th><span className="sr-only">إجراءات</span></th></tr></thead>
                <tbody>
                  {list.map((e) => (
                    <tr key={e.id}>
                      <td><span className={`pill ${e.category === "rent" ? "pill-regular" : e.category === "salaries" ? "pill-pm" : "pill-once"}`}>{EXPENSE_LABEL[e.category]}</span></td>
                      <td className="max-w-[260px] truncate">{e.description ?? "—"}</td>
                      <td className="num">{dateLabel(e.spent_on)}</td>
                      <td><Money value={e.amount} className="font-bold" /></td>
                      <td className="text-muted">{(e.created_by && adminName.get(e.created_by)) ?? "—"}</td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <Link href={`/expenses/${e.id}/edit`} className="btn btn-sm">تعديل</Link>
                          <DeleteExpenseButton id={e.id} month={month} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={3} className="font-bold">المجموع</td><td><Money value={total(list)} className="font-bold" /></td><td colSpan={2} /></tr>
                </tfoot>
              </table>
            )}
          </div>
        </section>
      </div>

      <section className="card overflow-hidden" aria-label="آخر 6 شهور">
        <h2 className="m-0 px-6 pt-6 text-lg font-bold">آخر 6 شهور</h2>
        <div className="overflow-x-auto pt-3">
          <table className="tbl min-w-[560px]">
            <thead><tr><th>الشهر</th><th>المحصّل</th><th>المصروفات</th><th>الصافي</th></tr></thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.m}>
                  <td><Link href={`/expenses?month=${h.m}`} className={h.m === month ? "font-bold" : ""}>{monthLabel(h.m)}</Link></td>
                  <td><Money value={h.col} /></td>
                  <td><Money value={h.sp} /></td>
                  <td><Money value={h.net} className={`font-bold ${h.net >= 0 ? "text-[#14532d]" : "text-[#991b1b]"}`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Kpi({ label, value, tone, small }: { label: string; value: number; tone?: "good" | "bad"; small?: boolean }) {
  return (
    <div className="card flex flex-col gap-1.5 p-5">
      <span className="text-[13px] font-semibold text-muted">{label}</span>
      <Money value={value} className={`font-bold ${small ? "text-xl" : "text-[26px]"} ${tone === "good" ? "text-[#14532d]" : tone === "bad" ? "text-[#991b1b]" : ""}`} />
    </div>
  );
}
