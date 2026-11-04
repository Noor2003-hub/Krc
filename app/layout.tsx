import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "نظام الفواتير · KRC", template: "%s · KRC" },
  description: "نظام الفواتير والرسوم – مركز الكويت للتأهيل",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
