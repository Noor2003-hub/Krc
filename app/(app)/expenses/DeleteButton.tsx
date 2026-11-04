"use client";

import { deleteExpense } from "./actions";

export function DeleteExpenseButton({ id, month }: { id: number; month: string }) {
  return (
    <form
      action={deleteExpense}
      onSubmit={(e) => {
        if (!window.confirm("حذف هذا المصروف؟")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="month" value={month} />
      <button type="submit" className="btn btn-sm border-[#fca5a5] text-[#991b1b]">حذف</button>
    </form>
  );
}
