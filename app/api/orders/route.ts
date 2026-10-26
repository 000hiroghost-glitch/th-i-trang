import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

type OrderItemInput = { variantId: string; quantity: number };

class StockError extends Error {}
class CouponError extends Error {}

function isOrderInput(body: unknown): body is {
  shippingAddressId: string;
  paymentMethod: "cod" | "qr" | "installment";
  installmentMonths?: number;
  installmentProvider?: string;
  discountCode?: string;
  items: OrderItemInput[];
} {
  return typeof body === "object" &&
    body !== null &&
    "shippingAddressId" in body &&
    typeof body.shippingAddressId === "string" &&
    body.shippingAddressId.length > 0 &&
    "paymentMethod" in body &&
    (body.paymentMethod === "cod" || body.paymentMethod === "qr" || body.paymentMethod === "installment") &&
    (!("discountCode" in body) || typeof body.discountCode === "string" && body.discountCode.length <= 40) &&
    (body.paymentMethod !== "installment" || (
      "installmentMonths" in body &&
      [3, 6, 9, 12].includes(body.installmentMonths as number) &&
      "installmentProvider" in body &&
      typeof body.installmentProvider === "string" &&
      body.installmentProvider.trim().length >= 2 &&
      body.installmentProvider.length <= 100
    )) &&
    "items" in body &&
    Array.isArray(body.items) &&
    body.items.length > 0 &&
    body.items.every(item =>
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
    return NextResponse.json({ error: "Dữ liệu đặt hàng không hợp lệ." }, { status: 400 });
  }
  if (!isOrderInput(body)) {
    return NextResponse.json({ error: "Vui lòng kiểm tra thông tin giao hàng và sản phẩm." }, { status: 400 });
  }

  const groupedItems = new Map<string, number>();
  for (const item of body.items) {
    groupedItems.set(item.variantId, (groupedItems.get(item.variantId) || 0) + item.quantity);
  }
  if ([...groupedItems.values()].some(quantity => quantity > 999)) {
    return NextResponse.json({ error: "Số lượng sản phẩm vượt quá giới hạn." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập để đặt hàng bằng địa chỉ đã lưu." }, { status: 401 });
    const savedAddress = await prisma.accountAddress.findFirst({
      where: { id: body.shippingAddressId, userId: user.id },
      select: { id: true, recipient: true, phone: true, address: true },
    });
    if (!savedAddress) return NextResponse.json({ error: "Địa chỉ giao hàng không tồn tại trong tài khoản của bạn." }, { status: 404 });
    const customerName = savedAddress.recipient;
    const phone = savedAddress.phone;
    const address = savedAddress.address;
    const shippingAddressId = savedAddress.id;
    if (
      customerName.length < 2 ||
      phone.length < 8 ||
      phone.length > 30 ||
      address.length < 8
    ) {
      return NextResponse.json({ error: "Vui lòng kiểm tra họ tên, số điện thoại và địa chỉ giao hàng." }, { status: 400 });
    }
    const order = await prisma.$transaction(async transaction => {
      const variants = await transaction.productVariant.findMany({
        where: { id: { in: [...groupedItems.keys()] } },
        include: { product: { select: { name: true, price: true } } },
      });
      if (variants.length !== groupedItems.size) {
        throw new StockError("Một hoặc nhiều biến thể sản phẩm không còn tồn tại.");
      }

      let subtotal = 0;
      for (const variant of variants) {
        const quantity = groupedItems.get(variant.id)!;
        const reserved = await transaction.productVariant.updateMany({
          where: { id: variant.id, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
        if (reserved.count !== 1) {
          throw new StockError(`Sản phẩm vừa hết hàng: ${variant.product.name} · size ${variant.size}. Vui lòng tải lại giỏ hàng.`);
        }
        subtotal += variant.product.price * quantity;
      }

      const discountCode = body.discountCode?.trim().toUpperCase() || null;
      let discountAmount = 0;
      if (discountCode) {
        const now = new Date();
        const promotion = await transaction.banner.findFirst({
          where: {
            active: true,
            couponCode: { equals: discountCode, mode: "insensitive" },
            discountPercent: { gte: 1, lte: 80 },
            AND: [
              { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
              { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
            ],
          },
          select: { couponCode: true, discountPercent: true },
        });
        if (!promotion?.couponCode || !promotion.discountPercent) {
          throw new CouponError("Mã giảm giá không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại.");
        }
        discountAmount = Math.round(subtotal * promotion.discountPercent / 100);
      }
      const isInstallment = body.paymentMethod === "installment";
      return transaction.order.create({
        data: {
          userId: user.id,
          customerName,
          totalAmount: Math.max(0, subtotal - discountAmount),
          status: "PENDING",
          shippingAddress: address,
          phone,
          shippingAddressId,
          paymentMethod: body.paymentMethod.toUpperCase(),
          isInstallment,
          installmentMonths: isInstallment ? body.installmentMonths : null,
          installmentProvider: isInstallment ? body.installmentProvider!.trim() : null,
          installmentVerificationStatus: isInstallment ? "PENDING_PROVIDER" : null,
          discountCode,
          discountAmount,
          items: {
            create: variants.map(variant => ({
              productVariantId: variant.id,
              quantity: groupedItems.get(variant.id)!,
              price: variant.product.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              variant: { include: { product: { select: { name: true } } } },
            },
          },
        },
      });
    });
    return NextResponse.json({
      ...order,
      createdAt: order.createdAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    if (error instanceof StockError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof CouponError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Không thể tạo đơn hàng:", error);
    return NextResponse.json({ error: "Không thể lưu đơn hàng. Vui lòng thử lại." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập để xem đơn hàng." }, { status: 401 });

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            variant: { include: { product: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Không thể tải đơn hàng của khách:", error);
    return NextResponse.json({ error: "Không thể tải danh sách đơn hàng." }, { status: 500 });
  }
}
