"use client";

import Link from "next/link";
import { useFormAction } from "@/components/useFormAction";
import { SubmitButton } from "@/components/SubmitButton";
import type { Customer } from "@/lib/types";
import { saveSubscriber, type SubscriberState } from "./actions";

export function SubscriberForm({ initial, defaultFee, today }: { initial?: Customer; defaultFee: number; today: string }) {
  const { state, onSubmit, pending } = useFormAction<SubscriberState>(saveSubscriber, {});
  return (
    <form onSubmit={onSubmit} className="card flex max-w-[720px] flex-col gap-5 p-7">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="flex flex-wrap gap-4">
        <label className="fld flex-[1_1_240px]">الاسم
          <input name="name" defaultValue={initial?.name} required className="inp" />
        </label>
        <label className="fld flex-[1_1_240px]">رقم الجوال
          <input name="phone" dir="ltr" inputMode="tel" defaultValue={initial?.phone ?? ""} className="inp text-right" />
        </label>
      </div>
      <div className="fld">الدوام
        <div className="grid max-w-[420px] grid-cols-2 gap-2.5">
          <label className="opt"><input type="radio" name="shift" value="am" defaultChecked={(initial?.shift ?? "am") === "am"} />صباحي</label>
          <label className="opt"><input type="radio" name="shift" value="pm" defaultChecked={initial?.shift === "pm"} />مسائي</label>
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="fld flex-[1_1_200px]">الرسوم الشهرية (د.ك)
          <input name="monthly_fee" inputMode="decimal" defaultValue={Number(initial?.monthly_fee ?? defaultFee).toFixed(3)} required className="inp num" />
        </label>
        <label className="fld flex-[1_1_200px]">مشترك منذ
          <input type="date" name="joined_on" defaultValue={initial?.joined_on ?? today} className="inp" />
        </label>
      </div>
      {initial && (
        <div className="fld">الحالة
          <div className="grid max-w-[420px] grid-cols-2 gap-2.5">
            <label className="opt"><input type="radio" name="active" value="1" defaultChecked={initial.active} />نشط</label>
            <label className="opt"><input type="radio" name="active" value="0" defaultChecked={!initial.active} />متوقف</label>
          </div>
          <span className="hint">المشترك المتوقف ما يظهر في «لم يدفعوا»، وفواتيره القديمة تبقى محفوظة.</span>
        </div>
      )}
      <label className="fld">ملاحظات <span className="hint">(اختياري)</span>
        <textarea name="notes" rows={2} defaultValue={initial?.notes ?? ""} className="inp h-auto resize-y py-3" />
      </label>
      {state.error && <p role="alert" className="m-0 rounded-[10px] bg-[#fef2f2] px-3.5 py-3 text-[13px] text-[#7f1d1d]">{state.error}</p>}
      <div className="flex justify-end gap-3">
        <Link href="/subscribers" className="btn">إلغاء</Link>
        <SubmitButton pending={pending}>حفظ</SubmitButton>
      </div>
    </form>
  );
}
