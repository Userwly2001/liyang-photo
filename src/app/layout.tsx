import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import ScrollProgress from "@/components/ui/ScrollProgress";
import VisitTracker from "@/components/ui/VisitTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LEONPHOTO | Leon Wang - 摄影与个人日志",
  description:
    "Leon Wang 的个人摄影作品集与日志，记录人像、风光、美食、生活随笔和城市片段。",
  keywords: ["摄影", "人像", "风光", "美食", "作品集", "生活随笔", "日志", "Leon Wang"],
  openGraph: {
    title: "LEONPHOTO | Leon Wang",
    description: "Leon Wang 的个人摄影作品集与生活日志",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
    >
      <body className="bg-background text-foreground min-h-screen antialiased">
        <ScrollProgress />
        <VisitTracker />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
