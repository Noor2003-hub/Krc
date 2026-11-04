"use client";

import { useState } from "react";
import { PASSWORD_RULES } from "@/lib/password";

export function PasswordFields() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const checks = [
    ...PASSWORD_RULES.map((r) => ({ label: r.label, ok: r.test(pw) })),
    { label: "الكلمتين متطابقتين", ok: pw.length > 0 && pw === confirm },
  ];
  return (
    <>
      <label className="fld">
        كلمة المرور الجديدة
        <input name="password" type="password" required autoComplete="new-password" className="inp" value={pw} onChange={(e) => setPw(e.target.value)} />
      </label>
      <label className="fld">
        تأكيد كلمة المرور الجديدة
        <input name="confirm" type="password" required autoComplete="new-password" className="inp" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </label>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-2 text-[13px] text-[#44403c]">
            <span aria-hidden="true" className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-xs font-bold ${c.ok ? "bg-[#dcfce7] text-[#14532d]" : "bg-[#f1f1ee] text-muted"}`}>
              {c.ok ? "✓" : "–"}
            </span>
            {c.label}
          </li>
        ))}
      </ul>
    </>
  );
}
