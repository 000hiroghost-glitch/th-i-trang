import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./lib/auth-token";

export async function middleware(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (session?.role !== "ADMIN") {
    if (request.nextUrl.pathname.startsWith("/api/admin/")) {
      return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
