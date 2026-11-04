// يدعم أسماء المتغيرات من تكامل Vercel ↔ Supabase (الجديدة والقديمة)
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") as string;
export const SUPABASE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "") as string;

/** رابط الموقع لروابط البريد: من المتغير، أو من Vercel، أو من الطلب الحالي */
export function siteUrl(requestOrigin?: string | null): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return requestOrigin ?? "";
}
