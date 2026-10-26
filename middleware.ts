import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./lib/auth-token";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const claims = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
    if (claims?.role === "ADMIN") return NextResponse.next();
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const adminPath = request.nextUrl.pathname.split("/")[2];
  const section = adminPath === "products" || adminPath === "banners" || adminPath === "orders" || adminPath === "users"
    ? adminPath
    : null;
  const accountUrl = new URL("/account?tab=admin", request.url);
  if (section) accountUrl.searchParams.set("section", section);
  return NextResponse.redirect(accountUrl);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
