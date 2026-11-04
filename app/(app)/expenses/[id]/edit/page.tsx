import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { requireAdmin } from "@/lib/auth";
import { todayKuwait } from "@/lib/rules";
import type { Expense } from "@/lib/types";
import { ExpenseForm } from "../../ExpenseForm";

export const metadata = { title: "تعديل مصروف" };

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("expenses").select("*").eq("id", Number(id)).maybeSingle();
  if (!data) notFound();
  const e = data as Expense;
  return (
    <>
      <PageHeader title="تعديل مصروف" back={{ href: `/expenses?month=${e.month}`, label: "المصروفات" }} />
      <section className="card max-w-[720px] p-6">
        <ExpenseForm month={e.month} today={todayKuwait()} initial={e} />
      </section>
    </>
  );
}
