import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import AppShell from "./components/AppShell";
import "./globals.css";
import enMessages from "../../../locales/en.json";
import deMessages from "../../../locales/de.json";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = await params;

  const messages = locale === "de" ? deMessages : enMessages;

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppShell locale={locale}>{children}</AppShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
