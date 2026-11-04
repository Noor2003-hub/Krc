"use client";

import Link from "next/link";
import { useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { useFormAction } from "@/components/useFormAction";
import { addMonths, EXPENSE_LABEL, monthLabel, monthStart, type ExpenseCategory } from "@/lib/rules";
import type { Expense } from "@/lib/types";
import { saveExpense, type ExpenseState } from "./actions";

export function ExpenseForm({ month, today, initial }: { month: string; today: string; initial?: Expense }) {
  const { state, onSubmit, pending } = useFormAction<ExpenseState>(saveExpense, {});
  const [category, setCategory] = useState<ExpenseCategory>(initial?.category ?? "rent");
  const [selectedMonth, setSelectedMonth] = useState(initial?.month ?? month);
  const months = Array.from({ length: 13 }, (_, k) => addMonths(monthStart(today), 1 - k));
  if (!months.includes(selectedMonth)) months.push(selectedMonth);

  return (
    <form onSubmit={onSubmit} key={state.at ?? 0} className="flex flex-col gap-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="fld">نوع المصروف
        <div className="grid max-w-[560px] grid-cols-3 gap-2.5">
          {(["rent", "salaries", "other"] as const).map((c) => (
            <label key={c} className="opt justify-center">
              <input type="radio" name="category" value={c} checked={category === c} onChange={() => setCategory(c)} />
              {EXPENSE_LABEL[c]}
            </label>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="fld min-w-0 flex-[1_1_180px]">عن شهر
          <select name="month" className="inp" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </label>
        <label className="fld min-w-0 flex-[1_1_180px]">المبلغ
          <span className="flex h-11 w-full min-w-0 overflow-hidden rounded-[10px] border-2 border-brand bg-white">
            <input name="amount" inputMode="decimal" required defaultValue={initial ? Number(initial.amount).toFixed(3) : ""} className="num w-full min-w-0 flex-1 border-0 px-3 text-lg font-semibold outline-none" />
            <span className="flex items-center px-3.5 text-sm font-bold text-[#44403c]">د.ك</span>
          </span>
        </label>
        <label className="fld min-w-0 flex-[1_1_180px]">تاريخ الصرف
          <input type="date" name="spent_on" required defaultValue={initial?.spent_on ?? today} className="inp" />
        </label>
      </div>
      <label className="fld">الوصف {category === "other" ? <span className="hint">(مطلوب)</span> : <span className="hint">(اختياري)</span>}
        <input name="description" defaultValue={initial?.description ?? ""} required={category === "other"}
          placeholder={category === "rent" ? "مثلاً: إيجار المبنى" : category === "salaries" ? "مثلاً: رواتب المعلمات" : "مثلاً: كهرباء، أدوات، صيانة"} className="inp" />
      </label>
      {(state.error || state.ok) && (
        <p role={state.error ? "alert" : "status"} className={`m-0 rounded-[10px] px-3.5 py-3 text-[13px] ${state.error ? "bg-[#fef2f2] text-[#7f1d1d]" : "bg-[#f0fdf4] text-[#14532d]"}`}>{state.error ?? state.ok}</p>
      )}
      <div className="flex justify-end gap-3">
        {initial && <Link href={`/expenses?month=${initial.month}`} className="btn">إلغاء</Link>}
        <SubmitButton pending={pending}>{initial ? "حفظ التعديل" : "إضافة المصروف"}</SubmitButton>
      </div>
    </form>
  );
}
