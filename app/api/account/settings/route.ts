import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function PATCH(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cài đặt không hợp lệ." }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("allowMarketingEmails" in body) ||
    typeof body.allowMarketingEmails !== "boolean" ||
    !("orderStatusNotifications" in body) ||
    typeof body.orderStatusNotifications !== "boolean" ||
    !("preferredLanguage" in body) ||
    (body.preferredLanguage !== "vi" && body.preferredLanguage !== "en")
  ) {
    return NextResponse.json({ error: "Vui lòng kiểm tra các tùy chọn cài đặt." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    const settings = await prisma.user.update({
      where: { id: user.id },
      data: {
        allowMarketingEmails: body.allowMarketingEmails,
        orderStatusNotifications: body.orderStatusNotifications,
        preferredLanguage: body.preferredLanguage,
      },
      select: { allowMarketingEmails: true, orderStatusNotifications: true, preferredLanguage: true },
    });
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Không thể lưu cài đặt tài khoản:", error);
    return NextResponse.json({ error: "Không thể lưu cài đặt." }, { status: 500 });
  }
}
