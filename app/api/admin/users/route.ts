import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });

    const search = request.nextUrl.searchParams.get("search")?.trim().slice(0, 120) || "";
    const role = request.nextUrl.searchParams.get("role");
    const status = request.nextUrl.searchParams.get("status");
    const users = await prisma.user.findMany({
      where: {
        ...(role === "USER" || role === "ADMIN" ? { role } : {}),
        ...(status === "blocked" ? { isBlocked: true } : status === "active" ? { isBlocked: false } : {}),
        ...(search ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { fullName: { contains: search, mode: "insensitive" } },
          ],
        } : {}),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isBlocked: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Không thể tải danh sách người dùng:", error);
    return NextResponse.json({ error: "Không thể tải danh sách người dùng." }, { status: 500 });
  }
}
