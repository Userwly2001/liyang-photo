import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import ScrollProgress from "@/components/ui/ScrollProgress";
import VisitTracker from "@/components/ui/VisitTracker";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { COOKIE_NAME, DEFAULT_LANG, type Language } from "@/i18n/settings";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "LEON WANG | Photographer · Engineer · Writer",
  description:
    "Leon Wang 的个人网站，记录摄影、技术、旅行、生活片段与成长感受。",
  keywords: ["摄影", "工程师", "技术", "旅行", "作品集", "生活随笔", "成长", "Leon Wang"],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: {
      ...(process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : {}),
      ...(process.env.BAIDU_SITE_VERIFICATION ? { 'baidu-site-verification': process.env.BAIDU_SITE_VERIFICATION } : {}),
    },
  },
  openGraph: {
    title: "LEONPHOTO | Leon Wang",
    description: "Leon Wang 的个人摄影作品集与生活随笔",
    type: "website",
    url: "/",
    siteName: "LEON WANG",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang: Language = (cookieStore.get(COOKIE_NAME)?.value === 'en' ? 'en' : DEFAULT_LANG);
  const htmlLang = lang === 'en' ? 'en' : 'zh-CN';

  return (
    <html
      lang={htmlLang}
      className="dark"
    >
      <body className="bg-background text-foreground min-h-screen antialiased">
        <LanguageProvider initialLang={lang}>
          <ScrollProgress />
          <VisitTracker />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
