import { formatKwd } from "@/lib/rules";

/** مبلغ بالدينار؛ الرقم دائماً من اليسار لليمين عشان علامة السالب تطلع صح */
export function Money({ value, unit = true, className = "" }: { value: number | string; unit?: boolean; className?: string }) {
  const n = Number(value);
  return (
    <span className={`num whitespace-nowrap ${className}`}>
      <bdi dir="ltr">{n < 0 ? "−" : ""}{formatKwd(Math.abs(n))}</bdi>
      {unit && <span className="text-[0.6em] font-semibold text-muted"> د.ك</span>}
    </span>
  );
}
