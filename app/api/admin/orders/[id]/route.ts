import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

const orderStatuses = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"] as const;

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
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
    !("status" in body) ||
    typeof body.status !== "string" ||
    !orderStatuses.includes(body.status as (typeof orderStatuses)[number])
  ) {
    return NextResponse.json({ error: "Trạng thái đơn hàng không hợp lệ." }, { status: 400 });
  }

  const { id } = await context.params;
  const result = await prisma.order.updateMany({
    where: { id },
    data: { status: body.status as (typeof orderStatuses)[number] },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
