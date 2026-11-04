import { PageHeader } from "@/components/PageHeader";
import { getSettings, requireAdmin } from "@/lib/auth";
import type { Admin } from "@/lib/types";
import { InvoiceSettingsForm, NameForm, PasswordForm, ResetLinkForm } from "./Forms";

export const metadata = { title: "الإعدادات" };

export default async function SettingsPage() {
  const { admin, supabase } = await requireAdmin();
  const settings = await getSettings();
  const { data } = await supabase.from("admins").select("id, name, email, must_change_password, last_login_at").order("created_at");
  const admins = (data ?? []) as Admin[];
  const fmt = (t: string | null) => (t ? new Intl.DateTimeFormat("ar-KW-u-nu-latn", { timeZone: "Asia/Kuwait", dateStyle: "medium", timeStyle: "short" }).format(new Date(t)) : "لم يدخل بعد");

  return (
    <>
      <PageHeader title="الإعدادات" subtitle="حسابك، كلمة المرور، والمسؤولين." />

      <div className="flex flex-wrap items-start gap-6">
        <section className="card flex min-w-0 flex-[1_1_360px] flex-col gap-[18px] p-6" aria-label="حسابي">
          <h2 className="m-0 text-lg font-bold">حسابي</h2>
          <NameForm name={admin.name} email={admin.email} />
        </section>
        <section id="password" className="card flex min-w-0 flex-[1_1_360px] scroll-mt-8 flex-col gap-[18px] p-6" aria-label="تغيير كلمة المرور">
          <h2 className="m-0 text-lg font-bold">تغيير كلمة المرور</h2>
          <PasswordForm />
        </section>
      </div>

      <section className="card flex flex-col gap-4 p-6" aria-label="المسؤولين">
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-lg font-bold">المسؤولين</h2>
          <p className="m-0 text-[13px] text-muted">الاثنين لهم نفس الصلاحيات. لو أحد نسي كلمة المرور، أرسل له رابط إعادة التعيين على بريده.</p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3">
          {admins.map((a) => (
            <div key={a.id} className="flex flex-col gap-3 rounded-xl border border-line p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dcebf8] font-bold text-brand-dark">{a.name.trim().charAt(0)}</span>
                <div className="flex min-w-0 flex-col">
                  <strong>{a.name} {a.id === admin.id && <span className="text-xs font-semibold text-muted">(أنت)</span>}</strong>
                  <span dir="ltr" className="truncate text-right text-[13px] text-muted">{a.email}</span>
                </div>
              </div>
              <span className="text-xs text-muted">آخر دخول: {fmt(a.last_login_at)}{a.must_change_password && " · كلمة المرور مؤقتة"}</span>
              {a.id !== admin.id && <ResetLinkForm adminId={a.id} />}
            </div>
          ))}
        </div>
      </section>

      <section className="card flex flex-col gap-4 p-6" aria-label="إعدادات الفواتير">
        <h2 className="m-0 text-lg font-bold">إعدادات الفواتير</h2>
        <InvoiceSettingsForm cutoff={settings.cutoff_day} fee={settings.default_fee} />
      </section>
    </>
  );
}
