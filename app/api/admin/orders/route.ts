import { NextResponse } from "next/server";
import { getAdminUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });

  const orders = await prisma.order.findMany({
    include: {
      user: { select: { fullName: true, email: true } },
      items: {
        include: {
          variant: {
            include: { product: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}
