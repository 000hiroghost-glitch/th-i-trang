import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "../../../../lib/auth-token";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "../../../../lib/password";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("email" in body) ||
    !("password" in body) ||
    typeof body.email !== "string" ||
    typeof body.password !== "string" ||
    body.password.length > 128
  ) {
    return NextResponse.json({ error: "Vui lòng nhập email và mật khẩu hợp lệ." }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email hoặc mật khẩu không chính xác." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordValid = user
    ? await verifyPassword(body.password, user.password)
    : await verifyPassword(body.password, DUMMY_PASSWORD_HASH);

  if (!user || !passwordValid) {
    return NextResponse.json({ error: "Email hoặc mật khẩu không chính xác." }, { status: 401 });
  }

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.fullName || user.email.split("@")[0],
      role: user.role,
    },
  });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
