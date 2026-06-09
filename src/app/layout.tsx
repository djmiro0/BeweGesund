import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./[locale]/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Bewegesund",
    template: "%s | Bewegesund",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
