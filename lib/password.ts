export const PASSWORD_RULES = [
  { key: "length", label: "10 أحرف على الأقل", test: (p: string) => p.length >= 10 },
  { key: "mix", label: "حروف وأرقام", test: (p: string) => /[A-Za-z؀-ۿ]/.test(p) && /\d/.test(p) },
] as const;

export function passwordProblem(password: string, confirm: string): string | null {
  for (const rule of PASSWORD_RULES) if (!rule.test(password)) return `كلمة المرور لازم: ${rule.label}.`;
  if (password !== confirm) return "كلمتا المرور غير متطابقتين.";
  return null;
}
