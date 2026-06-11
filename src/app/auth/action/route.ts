import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const target = new URL("/de/auth/action", request.url);
  const continueUrl = request.nextUrl.searchParams.get("continueUrl");

  if (continueUrl) {
    try {
      const continuePath = new URL(continueUrl).pathname;
      if (continuePath === "/en" || continuePath.startsWith("/en/")) {
        target.pathname = "/en/auth/action";
      }
    } catch {
      // Firebase owns the signed action parameters; an invalid continue URL
      // should not prevent the user from reaching the action handler.
    }
  }

  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  return NextResponse.redirect(target);
}
