// قواعد العمل: «عن شهر»، تنسيق المبالغ والتواريخ، والمبلغ بالحروف.

export const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export type Shift = "am" | "pm";
export type Kind = "regular" | "once";
export type Method = "cash" | "link" | "wamd" | "other";
export type Status = "paid" | "unpaid";

export const SHIFT_LABEL: Record<Shift, string> = { am: "صباحي", pm: "مسائي" };
export const KIND_LABEL: Record<Kind, string> = { regular: "ثابت", once: "غير ثابت" };
export const METHOD_LABEL: Record<Method, string> = { cash: "كاش", link: "رابط دفع", wamd: "ومض", other: "أخرى" };
export type ExpenseCategory = "rent" | "salaries" | "other";
export const EXPENSE_LABEL: Record<ExpenseCategory, string> = { rent: "إيجار", salaries: "رواتب", other: "مصروفات أخرى" };
export const STATUS_LABEL: Record<Status, string> = { paid: "مدفوعة", unpaid: "غير مدفوعة" };

/** تاريخ اليوم بتوقيت الكويت بصيغة YYYY-MM-DD */
export function todayKuwait(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait" }).format(now);
}

/** أول يوم في الشهر: YYYY-MM-01 */
export function monthStart(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`;
}

/** يضيف شهور على YYYY-MM-01 */
export function addMonths(month: string, n: number): string {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7)) - 1 + n;
  const yy = y + Math.floor(m / 12);
  const mm = ((m % 12) + 12) % 12;
  return `${yy}-${String(mm + 1).padStart(2, "0")}-01`;
}

/**
 * «عن شهر»: الدفع من 1 لغاية يوم الفصل ← نفس الشهر،
 * بعد يوم الفصل ← مقدم للشهر اللي بعده.
 */
export function periodFor(dateStr: string, cutoffDay: number): string {
  const day = Number(dateStr.slice(8, 10));
  const start = monthStart(dateStr);
  return day <= cutoffDay ? start : addMonths(start, 1);
}

/** هل الفاتورة مدفوعة مقدماً (تاريخها قبل شهرها)؟ */
export function isPrepaid(invoiceDate: string, period: string | null): boolean {
  return !!period && monthStart(invoiceDate) < period;
}

export function monthLabel(month: string, withYear = true): string {
  const m = MONTHS_AR[Number(month.slice(5, 7)) - 1];
  return withYear ? `${m} ${month.slice(0, 4)}` : m;
}

export function dateLabel(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = Number(dateStr.slice(8, 10));
  return `${d} ${MONTHS_AR[Number(dateStr.slice(5, 7)) - 1]} ${dateStr.slice(0, 4)}`;
}

/** 1245.5 → "1,245.500" */
export function formatKwd(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  const [int, frac] = Math.abs(n).toFixed(3).split(".");
  return `${n < 0 ? "-" : ""}${int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${frac}`;
}

/** يفصل المبلغ إلى دينار وفلس */
export function splitKwd(value: number | string): { dinars: number; fils: number } {
  const totalFils = Math.round(Number(value) * 1000);
  return { dinars: Math.floor(totalFils / 1000), fils: totalFils % 1000 };
}

// ---------- الأرقام بالحروف ----------
const ONES = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
const TEENS = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
const TENS = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const HUNDREDS = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

function below1000(n: number): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h) parts.push(HUNDREDS[h]);
  if (rest) {
    if (rest < 10) parts.push(ONES[rest]);
    else if (rest < 20) parts.push(TEENS[rest - 10]);
    else {
      const o = rest % 10;
      const t = Math.floor(rest / 10);
      parts.push(o ? `${ONES[o]} و${TENS[t]}` : TENS[t]);
    }
  }
  return parts.join(" و");
}

export function numberToArabicWords(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "صفر";
  if (n >= 1_000_000) return String(n);
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (thousands === 1) parts.push("ألف");
  else if (thousands === 2) parts.push("ألفان");
  else if (thousands >= 3 && thousands <= 10) parts.push(`${below1000(thousands)} آلاف`);
  else if (thousands > 10) parts.push(`${below1000(thousands)} ألف`);
  if (rest) parts.push(below1000(rest));
  return parts.join(" و");
}

function dinarPhrase(n: number): string {
  if (n === 1) return "دينار كويتي واحد";
  if (n === 2) return "ديناران كويتيان";
  const words = numberToArabicWords(n);
  const lastTwo = n % 100;
  if (lastTwo >= 3 && lastTwo <= 10) return `${words} دنانير كويتية`;
  return `${words} دينار كويتي`;
}

function filsPhrase(n: number): string {
  if (n === 1) return "فلس واحد";
  if (n === 2) return "فلسان";
  return `${numberToArabicWords(n)} فلس`;
}

/** 35 → "خمسة وثلاثون دينار كويتي فقط لا غير" */
export function amountInArabicWords(value: number | string): string {
  const { dinars, fils } = splitKwd(value);
  const parts: string[] = [];
  if (dinars) parts.push(dinarPhrase(dinars));
  if (fils) parts.push(filsPhrase(fils));
  if (!parts.length) parts.push("صفر");
  return `${parts.join(" و")} فقط لا غير`;
}
