import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import ScrollProgress from "@/components/ui/ScrollProgress";
import VisitTracker from "@/components/ui/VisitTracker";

export const metadata: Metadata = {
  title: "LEONPHOTO | Leon Wang - 摄影与生活随笔",
  description:
    "Leon Wang 的个人摄影作品集与随笔，记录人像、风光、美食、生活片段和成长感受。",
  keywords: ["摄影", "人像", "风光", "美食", "作品集", "生活随笔", "成长", "Leon Wang"],
  openGraph: {
    title: "LEONPHOTO | Leon Wang",
    description: "Leon Wang 的个人摄影作品集与生活随笔",
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
      className="dark"
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
