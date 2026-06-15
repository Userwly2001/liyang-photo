import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import ScrollProgress from "@/components/ui/ScrollProgress";
import VisitTracker from "@/components/ui/VisitTracker";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { getRequestLanguage } from "@/i18n/server";
import { localizedMetadata } from "@/i18n/metadata";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLanguage();
  return {
    ...localizedMetadata(lang, 'home', '/'),
    metadataBase: new URL(SITE_URL),
    robots: { index: true, follow: true },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
      other: {
        ...(process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : {}),
        ...(process.env.BAIDU_SITE_VERIFICATION ? { 'baidu-site-verification': process.env.BAIDU_SITE_VERIFICATION } : {}),
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getRequestLanguage();
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
