import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

const intlMiddleware = createMiddleware({
  locales: ["en", "de"],
  defaultLocale: "de",
  localeDetection: false
});

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect root "/" to default locale
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/en"; 
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"]
};
