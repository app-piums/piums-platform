import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware — server-side route protection.
 * Reads the `admin_session` cookie set on login.
 * Falls back to client-side AdminGuard for the actual JWT validation.
 */

const PUBLIC_PATHS = ["/login", "/_next", "/favicon.ico", "/logo.png", "/api"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and assets through without a session check
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = request.cookies.get("admin_session");
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|logo\\.png|logo-white\\.png).*)"],
};
