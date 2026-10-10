import type { Metadata } from "next";
import "@fontsource-variable/alexandria";
import "./globals.css";
export const metadata: Metadata = { title: "مصنع الإعلانات | AD Factory", description: "مساحة إنتاج الإعلانات: من الفكرة إلى الفيديو" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
