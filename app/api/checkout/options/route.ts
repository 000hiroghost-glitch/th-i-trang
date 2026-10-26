import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const user = await getCurrentUser();
    const [addresses, promotions] = await Promise.all([
      user
        ? prisma.accountAddress.findMany({
            where: { userId: user.id },
            select: { id: true, label: true, recipient: true, phone: true, address: true, isDefault: true },
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          })
        : Promise.resolve([]),
      prisma.banner.findMany({
        where: {
          active: true,
          couponCode: { not: null },
          discountPercent: { not: null },
          OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        },
        select: { id: true, title: true, couponCode: true, discountPercent: true, startsAt: true, endsAt: true },
        orderBy: [{ startsAt: "asc" }, { sortOrder: "asc" }],
        take: 20,
      }),
    ]);
    return NextResponse.json({
      customer: user ? { fullName: user.fullName, phone: user.phone } : null,
      addresses,
      promotions: promotions.map(promotion => ({
        ...promotion,
        available: !promotion.startsAt || promotion.startsAt <= now,
      })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Không thể tải dữ liệu checkout:", error);
    return NextResponse.json({ error: "Không thể tải thông tin giao hàng và khuyến mãi." }, { status: 500 });
  }
}
