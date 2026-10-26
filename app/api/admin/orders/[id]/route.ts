import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "../../../../../lib/auth";
import {
  changeOrderStatus,
  InsufficientStockError,
  OrderConflictError,
  OrderNotFoundError,
} from "../../../../../lib/order-status";

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
  try {
    await changeOrderStatus(id, body.status as (typeof orderStatuses)[number]);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof OrderConflictError || error instanceof InsufficientStockError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Không thể cập nhật trạng thái đơn hàng:", error);
    return NextResponse.json({ error: "Không thể cập nhật đơn hàng." }, { status: 500 });
  }
}
