"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";

const NAV = [
  { href: "/", label: "لوحة التحكم" },
  { href: "/invoices", label: "الفواتير" },
  { href: "/subscribers", label: "المشتركين" },
  { href: "/expenses", label: "المصروفات" },
  { href: "/settings", label: "الإعدادات" },
];

export function Sidebar({ name, email }: { name: string; email: string }) {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <aside className="no-print flex max-w-full flex-[1_1_232px] flex-col gap-7 border-l border-line bg-white px-5 py-7 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:max-w-[260px]">
      <Link href="/" className="flex flex-col gap-2.5 no-underline">
        <Image src="/krc-logo.png" alt="مركز الكويت للتأهيل KRC" width={176} height={94} priority />
        <span className="text-[13px] font-semibold text-muted">نظام الفواتير والرسوم</span>
      </Link>
      <nav aria-label="القائمة" className="flex flex-wrap gap-1 lg:flex-col">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={`flex min-h-11 items-center rounded-[10px] px-3.5 text-sm no-underline ${isActive(item.href) ? "bg-[#f1f1ee] font-bold text-ink" : "font-semibold text-[#44403c] hover:bg-[#f6f6f3]"}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-2.5 border-t border-line-soft pt-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#dcebf8] text-sm font-bold text-brand-dark">{name.trim().charAt(0)}</span>
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-bold">{name}</span>
            <span dir="ltr" className="truncate text-right text-xs text-muted">{email}</span>
          </div>
        </div>
        <form action={signOut}>
          <button type="submit" className="btn btn-sm h-10 w-full text-[#44403c]">تسجيل خروج</button>
        </form>
      </div>
    </aside>
  );
}
