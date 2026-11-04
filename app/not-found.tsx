import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="m-0 text-2xl font-bold">الصفحة غير موجودة</h1>
      <p className="m-0 text-muted">ممكن الفاتورة انحذفت أو الرابط غلط.</p>
      <Link href="/" className="btn btn-primary">لوحة التحكم</Link>
    </div>
  );
}
