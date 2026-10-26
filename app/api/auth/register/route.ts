import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "../../../../lib/auth-token";
import { hashPassword } from "../../../../lib/password";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("fullName" in body) ||
      !("email" in body) ||
      !("password" in body) ||
      typeof body.fullName !== "string" ||
      typeof body.email !== "string" ||
      typeof body.password !== "string"
    ) {
      return NextResponse.json({ error: "Vui lòng kiểm tra lại thông tin đăng ký." }, { status: 400 });
    }

    const name = body.fullName.trim();
    const email = body.email.trim().toLowerCase();
    if (
      name.length < 2 ||
      name.length > 120 ||
      body.password.length < 8 ||
      body.password.length > 128 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json({ error: "Thông tin đăng ký không hợp lệ." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) {
      return NextResponse.json({ error: "Email này đã được đăng ký." }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        fullName: name,
        password: await hashPassword(body.password),
        role: "USER",
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        sessionVersion: true,
      },
    });
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.fullName, role: user.role },
    });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return response;
  } catch (error: unknown) {
    console.error("Lỗi khi đăng ký tài khoản:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Lỗi không xác định khi đăng ký.",
    }, { status: 500 });
  }
}
