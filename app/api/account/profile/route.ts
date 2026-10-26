import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import { isProfileInput } from "../../../../lib/account-validation";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        role: true,
        email: true,
        fullName: true,
        phone: true,
        avatar: true,
        dateOfBirth: true,
        gender: true,
        allowMarketingEmails: true,
        orderStatusNotifications: true,
        preferredLanguage: true,
        addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
      },
    });
    if (!user) return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });
    return NextResponse.json({ ...user, fullName: user.fullName || user.email.split("@")[0] });
  } catch (error) {
    console.error("Không thể tải hồ sơ cá nhân:", error);
    return NextResponse.json({ error: "Không thể tải hồ sơ." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu hồ sơ không hợp lệ." }, { status: 400 });
  }
  if (!isProfileInput(body)) {
    return NextResponse.json({ error: "Vui lòng kiểm tra họ tên, số điện thoại, ngày sinh và ảnh đại diện." }, { status: 400 });
  }

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        fullName: body.fullName.trim(),
        phone: body.phone.trim() || null,
        avatar: body.avatar,
        dateOfBirth: body.dateOfBirth ? new Date(`${body.dateOfBirth}T00:00:00.000Z`) : null,
        gender: body.gender,
      },
      select: { id: true, email: true, fullName: true, phone: true, avatar: true, dateOfBirth: true, gender: true },
    });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Không thể lưu hồ sơ cá nhân:", error);
    return NextResponse.json({ error: "Không thể lưu hồ sơ." }, { status: 500 });
  }
}
