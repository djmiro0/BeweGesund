import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

const intlMiddleware = createMiddleware({
  locales: ["de", "en"],
  defaultLocale: "de",
  localeDetection: false
});

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect root "/" to default locale
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/de";
    return NextResponse.redirect(url);
  }

  if (pathname === "/auth/action") {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"]
};
