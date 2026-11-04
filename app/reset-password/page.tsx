import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetForm } from "./ResetForm";

export const metadata = { title: "تعيين كلمة مرور جديدة" };

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login?error=link-expired");

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <main className="flex w-full max-w-[420px] flex-col gap-6">
        <div className="flex justify-center">
          <Image src="/krc-logo.png" alt="مركز الكويت للتأهيل KRC" width={200} height={107} className="rounded-xl" />
        </div>
        <div className="card flex flex-col gap-4 !rounded-2xl p-8">
          <h1 className="m-0 text-2xl font-bold">تعيين كلمة مرور جديدة</h1>
          <ResetForm />
        </div>
      </main>
    </div>
  );
}
