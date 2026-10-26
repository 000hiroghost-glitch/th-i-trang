import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { hashResetToken, isValidEmail } from "../../../../lib/account-validation";
import { prisma } from "../../../../lib/prisma";

async function sendResetEmail(email: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Email reset chưa được cấu hình. Cần RESEND_API_KEY và EMAIL_FROM.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Đặt lại mật khẩu KCJ Store",
      text: `Bạn đã yêu cầu đặt lại mật khẩu. Mở liên kết sau trong vòng 60 phút: ${resetUrl}\nNếu không phải bạn, hãy bỏ qua email này.`,
    }),
  });
  if (!response.ok) {
    console.error("Nhà cung cấp email từ chối gửi email đặt lại mật khẩu:", response.status);
    throw new Error("Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.");
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || !("email" in body) || typeof body.email !== "string") {
    return NextResponse.json({ error: "Vui lòng nhập email hợp lệ." }, { status: 400 });
  }
  const email = body.email.trim().toLowerCase();
  if (!isValidEmail(email)) return NextResponse.json({ error: "Vui lòng nhập email hợp lệ." }, { status: 400 });
  if (process.env.NODE_ENV === "production" && (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)) {
    console.error("Thiếu cấu hình email reset trong môi trường production.");
    return NextResponse.json({ error: "Dịch vụ đặt lại mật khẩu hiện chưa sẵn sàng." }, { status: 503 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, isBlocked: true },
    });
    const responseData: { success: true; message: string; resetToken?: string } = {
      success: true,
      message: "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi đến hộp thư của bạn.",
    };

    if (user && !user.isBlocked) {
      const recentTokens = await prisma.passwordResetToken.count({
        where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } },
      });
      if (recentTokens < 3) {
        const token = randomBytes(32).toString("base64url");
        await prisma.$transaction([
          prisma.passwordResetToken.updateMany({
            where: { userId: user.id, usedAt: null },
            data: { usedAt: new Date() },
          }),
          prisma.passwordResetToken.create({
            data: {
              userId: user.id,
              tokenHash: hashResetToken(token),
              expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
          }),
        ]);
        const resetUrl = new URL("/reset-password", process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin);
        resetUrl.searchParams.set("token", token);
        if (process.env.NODE_ENV === "development") {
          responseData.resetToken = token;
        } else {
          await sendResetEmail(user.email, resetUrl.toString());
        }
      }
    }
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Không thể xử lý yêu cầu đặt lại mật khẩu:", error);
    return NextResponse.json({ error: "Không thể xử lý yêu cầu. Vui lòng thử lại sau." }, { status: 500 });
  }
}
