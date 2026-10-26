import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import {
  changeOrderStatus,
  InsufficientStockError,
  OrderConflictError,
  OrderNotFoundError,
} from "../../../../lib/order-status";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập để tra cứu đơn hàng." }, { status: 401 });
    const { id } = await context.params;
    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
      include: {
        items: {
          include: {
            variant: { include: { product: { select: { name: true } } } },
          },
        },
      },
    });
    if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng trong tài khoản của bạn." }, { status: 404 });
    return NextResponse.json(order, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Không thể tra cứu đơn hàng:", error);
    return NextResponse.json({ error: "Không thể tra cứu đơn hàng." }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
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
    body.status !== "CANCELLED"
  ) {
    return NextResponse.json({ error: "Chỉ hỗ trợ hủy đơn hàng." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập để hủy đơn hàng." }, { status: 401 });
    const { id } = await context.params;
    const order = await changeOrderStatus(id, "CANCELLED", user.id, ["PENDING"]);
    return NextResponse.json({ success: true, order });
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof OrderConflictError || error instanceof InsufficientStockError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Không thể hủy đơn hàng:", error);
    return NextResponse.json({ error: "Không thể hủy đơn hàng. Vui lòng thử lại." }, { status: 500 });
  }
}
