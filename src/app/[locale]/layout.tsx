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

function getBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const vercelPreviewUrl = process.env.VERCEL_URL;
  const url = configuredUrl ?? vercelProductionUrl ?? vercelPreviewUrl ?? "https://bewegesund.de";
  const cleanUrl = url.endsWith("/") ? url.slice(0, -1) : url;

  return cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`;
}

export const metadata: Metadata = {
  title: "Bewegesund",
  metadataBase: new URL(getBaseUrl()),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "64x64", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Bewegesund",
    siteName: "Bewegesund",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: "Bewegesund logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Bewegesund",
    images: ["/logo.png"],
  },
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
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
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
