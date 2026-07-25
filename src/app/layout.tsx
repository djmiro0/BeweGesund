import type { Metadata, Viewport } from "next";
import ConsentAwareAnalytics from "./components/ConsentAwareAnalytics";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
import "./[locale]/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Bewegesund",
    template: "%s | Bewegesund",
  },
  manifest: "/manifest.webmanifest",
  applicationName: "Bewegesund",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bewegesund",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#9b2b42",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        {children}
        <ServiceWorkerRegistration />
        <ConsentAwareAnalytics />
      </body>
    </html>
  );
}
