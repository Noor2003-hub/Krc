import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { requireAdmin } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { admin } = await requireAdmin();
  return (
    <div className="flex min-h-screen flex-wrap">
      <Sidebar name={admin.name} email={admin.email} />
      <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-6 px-5 py-8 sm:px-10">
        {admin.must_change_password && (
          <div role="status" className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#fef3c7] px-4 py-3.5 text-sm text-[#78350f]">
            <span><strong>كلمة المرور الحالية مؤقتة.</strong> غيّرها عشان ما يقدر أحد غيرك يدخل بحسابك.</span>
            <Link href="/settings#password" className="btn btn-sm">تغيير كلمة المرور</Link>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
