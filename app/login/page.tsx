import Image from "next/image";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "تسجيل الدخول" };

const ERRORS: Record<string, string> = {
  "not-admin": "هذا الحساب ليس من المسؤولين.",
  "link-expired": "الرابط انتهى أو غير صالح. اطلب رابط جديد.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <main className="flex w-full max-w-[420px] flex-col gap-6">
        <div className="flex flex-col items-center gap-2.5">
          <Image src="/krc-logo.png" alt="مركز الكويت للتأهيل KRC" width={220} height={118} priority className="rounded-xl" />
          <span className="text-sm font-semibold text-muted">نظام الفواتير والرسوم</span>
        </div>
        <LoginForm initialError={error ? ERRORS[error] : undefined} />
        <p className="m-0 text-center text-xs text-muted">ما في تسجيل حساب جديد. الحسابات يضيفها مسؤول النظام فقط.</p>
      </main>
    </div>
  );
}
