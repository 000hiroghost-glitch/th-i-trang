import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

type CartLine = { variantId: string; quantity: number };

function isCouponRequest(value: unknown): value is { code: string; items: CartLine[] } {
  return typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof value.code === "string" &&
    value.code.trim().length > 0 &&
    value.code.length <= 40 &&
    "items" in value &&
    Array.isArray(value.items) &&
    value.items.length > 0 &&
    value.items.length <= 100 &&
    value.items.every(item =>
      typeof item === "object" &&
      item !== null &&
      "variantId" in item &&
      typeof item.variantId === "string" &&
      "quantity" in item &&
      typeof item.quantity === "number" &&
      Number.isSafeInteger(item.quantity) &&
      item.quantity > 0 &&
      item.quantity <= 999
    );
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Yêu cầu kiểm tra mã giảm giá không hợp lệ." }, { status: 400 });
  }
  if (!isCouponRequest(body)) {
    return NextResponse.json({ error: "Vui lòng nhập mã giảm giá và kiểm tra giỏ hàng." }, { status: 400 });
  }

  try {
    const grouped = new Map<string, number>();
    for (const item of body.items) {
      grouped.set(item.variantId, (grouped.get(item.variantId) || 0) + item.quantity);
    }
    if ([...grouped.values()].some(quantity => quantity > 999)) {
      return NextResponse.json({ error: "Số lượng sản phẩm vượt quá giới hạn." }, { status: 400 });
    }
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: [...grouped.keys()] } },
      select: { id: true, product: { select: { price: true } } },
    });
    if (variants.length !== grouped.size) {
      return NextResponse.json({ error: "Giỏ hàng có sản phẩm không còn tồn tại." }, { status: 409 });
    }
    const subtotal = variants.reduce((sum, variant) => sum + variant.product.price * grouped.get(variant.id)!, 0);
    const now = new Date();
    const promotion = await prisma.banner.findFirst({
      where: {
        active: true,
        couponCode: { equals: body.code.trim(), mode: "insensitive" },
        discountPercent: { gte: 1, lte: 80 },
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      select: { couponCode: true, discountPercent: true, title: true },
    });
    if (!promotion?.couponCode || !promotion.discountPercent) {
      return NextResponse.json({ error: "Mã giảm giá không hợp lệ hoặc chưa/đã hết hạn." }, { status: 400 });
    }
    const discountAmount = Math.round(subtotal * promotion.discountPercent / 100);
    return NextResponse.json({
      code: promotion.couponCode,
      title: promotion.title,
      discountPercent: promotion.discountPercent,
      subtotal,
      discountAmount,
      totalAmount: Math.max(0, subtotal - discountAmount),
    });
  } catch (error) {
    console.error("Không thể kiểm tra mã giảm giá:", error);
    return NextResponse.json({ error: "Không thể kiểm tra mã giảm giá." }, { status: 500 });
  }
}
