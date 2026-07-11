import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "字里少年宫｜小学语文动画课程",
  description: "面向小学一至六年级孩子的统编版语文动画课程，在山水课堂中学习拼音、识字、阅读、古诗与表达。",
  openGraph: {
    title: "字里少年宫｜小学语文动画课程",
    description: "在山水间，读懂中国字。小学一至六年级语文动画学习地图。",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
