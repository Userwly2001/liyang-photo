import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import ScrollProgress from "@/components/ui/ScrollProgress";
import VisitTracker from "@/components/ui/VisitTracker";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { COOKIE_NAME, DEFAULT_LANG, type Language } from "@/i18n/settings";

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
