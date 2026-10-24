import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("role" in body) ||
    (body.role !== "USER" && body.role !== "ADMIN")
  ) {
    return NextResponse.json({ error: "Quyền người dùng không hợp lệ." }, { status: 400 });
  }

  const { id } = await context.params;
  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
  if (target.id === admin.id && body.role !== "ADMIN") {
    return NextResponse.json({ error: "Bạn không thể tự hạ quyền Admin của mình." }, { status: 409 });
  }

  if (target.role === "ADMIN" && body.role === "USER") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Không thể hạ quyền Admin cuối cùng." }, { status: 409 });
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: body.role },
    select: { id: true, fullName: true, email: true, role: true, createdAt: true },
  });
  return NextResponse.json(user);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });

  const { id } = await context.params;
  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, _count: { select: { orders: true } } },
  });
  if (!target) return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
  if (target.id === admin.id) {
    return NextResponse.json({ error: "Bạn không thể xóa tài khoản Admin đang đăng nhập." }, { status: 409 });
  }
  if (target.role === "ADMIN" && (await prisma.user.count({ where: { role: "ADMIN" } })) <= 1) {
    return NextResponse.json({ error: "Không thể xóa Admin cuối cùng." }, { status: 409 });
  }
  if (target._count.orders > 0) {
    return NextResponse.json(
      { error: "Không thể xóa người dùng đã có đơn hàng." },
      { status: 409 },
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
