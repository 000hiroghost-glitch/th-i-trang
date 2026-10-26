import { NextRequest, NextResponse } from "next/server";
import { hashResetToken } from "../../../../lib/account-validation";
import { hashPassword } from "../../../../lib/password";
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
    !("token" in body) ||
    typeof body.token !== "string" ||
    body.token.length < 32 ||
    body.token.length > 256 ||
    !("password" in body) ||
    typeof body.password !== "string" ||
    body.password.length < 8 ||
    body.password.length > 128 ||
    !("confirmPassword" in body) ||
    typeof body.confirmPassword !== "string" ||
    body.password !== body.confirmPassword
  ) {
    return NextResponse.json({ error: "Mật khẩu phải có ít nhất 8 ký tự và phần xác nhận phải khớp." }, { status: 400 });
  }

  try {
    const tokenHash = hashResetToken(body.token);
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() }, user: { isBlocked: false } },
      select: { id: true, userId: true },
    });
    if (!resetToken) return NextResponse.json({ error: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." }, { status: 400 });
    const passwordHash = await hashPassword(body.password);
    const updated = await prisma.$transaction(async transaction => {
      const consumed = await transaction.passwordResetToken.updateMany({
        where: { id: resetToken.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (!consumed.count) return false;
      const userUpdated = await transaction.user.updateMany({
        where: { id: resetToken.userId, isBlocked: false },
        data: { password: passwordHash, sessionVersion: { increment: 1 } },
      });
      if (!userUpdated.count) throw new Error("Tài khoản không thể được cập nhật.");
      await transaction.passwordResetToken.updateMany({
        where: { userId: resetToken.userId, usedAt: null },
        data: { usedAt: new Date() },
      });
      return true;
    });
    if (!updated) return NextResponse.json({ error: "Liên kết đặt lại mật khẩu đã được sử dụng." }, { status: 409 });
    return NextResponse.json({ success: true, message: "Mật khẩu đã được đặt lại. Bạn có thể đăng nhập." });
  } catch (error) {
    console.error("Không thể đặt lại mật khẩu:", error);
    return NextResponse.json({ error: "Không thể đặt lại mật khẩu. Vui lòng thử lại." }, { status: 500 });
  }
}
