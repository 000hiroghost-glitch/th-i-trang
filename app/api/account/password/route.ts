import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import { hashPassword, verifyPassword } from "../../../../lib/password";
import { prisma } from "../../../../lib/prisma";

export async function PATCH(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("currentPassword" in body) ||
    typeof body.currentPassword !== "string" ||
    body.currentPassword.length > 128 ||
    !("newPassword" in body) ||
    typeof body.newPassword !== "string" ||
    !("confirmPassword" in body) ||
    typeof body.confirmPassword !== "string" ||
    body.newPassword.length < 8 ||
    body.newPassword.length > 128 ||
    body.newPassword !== body.confirmPassword
  ) {
    return NextResponse.json({ error: "Mật khẩu mới phải có ít nhất 8 ký tự và phần xác nhận phải khớp." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    const credentials = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true, sessionVersion: true },
    });
    if (!credentials || !(await verifyPassword(body.currentPassword, credentials.password))) {
      return NextResponse.json({ error: "Mật khẩu hiện tại không chính xác." }, { status: 403 });
    }
    if (body.currentPassword === body.newPassword) {
      return NextResponse.json({ error: "Mật khẩu mới phải khác mật khẩu hiện tại." }, { status: 400 });
    }

    const updated = await prisma.user.updateMany({
      where: { id: user.id, sessionVersion: credentials.sessionVersion },
      data: {
        password: await hashPassword(body.newPassword),
        sessionVersion: { increment: 1 },
      },
    });
    if (!updated.count) {
      return NextResponse.json({ error: "Phiên đăng nhập đã thay đổi. Vui lòng đăng nhập lại." }, { status: 409 });
    }
    const response = NextResponse.json({ success: true, message: "Đã đổi mật khẩu. Vui lòng đăng nhập lại." });
    response.cookies.delete("kcj_session");
    return response;
  } catch (error) {
    console.error("Không thể đổi mật khẩu:", error);
    return NextResponse.json({ error: "Không thể đổi mật khẩu." }, { status: 500 });
  }
}
