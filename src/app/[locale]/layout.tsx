import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import AppShell from "./components/AppShell";
import "./globals.css";
import enMessages from "../../../locales/en.json";
import deMessages from "../../../locales/de.json";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "S.Bewegesund",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const messages = locale === "de" ? deMessages : enMessages;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem("sbewegesund-theme");
                  var systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                  document.documentElement.dataset.theme = savedTheme || systemTheme;
                } catch (error) {
                  document.documentElement.dataset.theme = "light";
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppShell locale={locale}>{children}</AppShell>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
