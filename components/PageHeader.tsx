import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  back,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  back?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        {back && (
          <Link href={back.href} className="no-print mb-1 inline-flex min-h-8 items-center gap-1.5 text-sm font-semibold text-[#44403c] no-underline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
            {back.label}
          </Link>
        )}
        <h1 className="m-0 text-[28px] font-bold">{title}</h1>
        {subtitle && <p className="m-0 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="no-print flex flex-wrap items-center gap-3">{children}</div>}
    </header>
  );
}

export function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
  );
}
