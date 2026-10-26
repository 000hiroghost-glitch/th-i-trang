import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };
type UserPatch = { role: "USER" | "ADMIN" } | { isBlocked: boolean };

function parseUserPatch(value: unknown): UserPatch | null {
  if (typeof value !== "object" || value === null) return null;
  if ("role" in value && (value.role === "USER" || value.role === "ADMIN")) {
    return { role: value.role };
  }
  if ("isBlocked" in value && typeof value.isBlocked === "boolean") {
    return { isBlocked: value.isBlocked };
  }
  return null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }

  const changes = parseUserPatch(body);
  if (!changes) return NextResponse.json({ error: "Quyền hoặc trạng thái người dùng không hợp lệ." }, { status: 400 });

  const { id } = await context.params;
  try {
    const user = await prisma.$transaction(async transaction => {
      const target = await transaction.user.findUnique({
        where: { id },
        select: { id: true, role: true, isBlocked: true },
      });
      if (!target) return { error: "NOT_FOUND" as const };
      if ("role" in changes) {
        if (target.id === admin.id && changes.role !== "ADMIN") return { error: "SELF_DEMOTION" as const };
        if (target.role === "ADMIN" && changes.role === "USER") {
          const adminCount = await transaction.user.count({ where: { role: "ADMIN" } });
          if (adminCount <= 1) return { error: "LAST_ADMIN" as const };
        }
        await transaction.user.update({
          where: { id },
          data: {
            role: changes.role,
            ...(target.role !== changes.role ? { sessionVersion: { increment: 1 } } : {}),
          },
        });
      } else {
        if (target.id === admin.id && changes.isBlocked) return { error: "SELF_BLOCK" as const };
        await transaction.user.update({
          where: { id },
          data: {
            isBlocked: changes.isBlocked,
            ...(target.isBlocked !== changes.isBlocked ? { sessionVersion: { increment: 1 } } : {}),
          },
        });
      }
      return {
        user: await transaction.user.findUniqueOrThrow({
          where: { id },
          select: { id: true, fullName: true, email: true, role: true, isBlocked: true, createdAt: true },
        }),
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if ("error" in user && typeof user.error === "string") {
      const errors = {
        NOT_FOUND: ["Không tìm thấy người dùng.", 404],
        SELF_DEMOTION: ["Bạn không thể tự hạ quyền Admin của mình.", 409],
        LAST_ADMIN: ["Không thể hạ quyền Admin cuối cùng.", 409],
        SELF_BLOCK: ["Bạn không thể tự khóa tài khoản Admin đang đăng nhập.", 409],
      } as const;
      const [message, status] = errors[user.error];
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json(user.user);
  } catch (error) {
    console.error("Không thể cập nhật người dùng:", error);
    return NextResponse.json({ error: "Không thể cập nhật người dùng." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });

  const { id } = await context.params;
  try {
    const result = await prisma.$transaction(async transaction => {
      const target = await transaction.user.findUnique({ where: { id }, select: { id: true, role: true } });
      if (!target) return "NOT_FOUND" as const;
      if (target.id === admin.id) return "SELF_DELETE" as const;
      if (target.role === "ADMIN" && await transaction.user.count({ where: { role: "ADMIN" } }) <= 1) {
        return "LAST_ADMIN" as const;
      }
      await transaction.order.updateMany({ where: { userId: id }, data: { userId: null } });
      await transaction.user.delete({ where: { id } });
      return "DELETED" as const;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (result !== "DELETED") {
      const errors = {
        NOT_FOUND: ["Không tìm thấy người dùng.", 404],
        SELF_DELETE: ["Bạn không thể xóa tài khoản Admin đang đăng nhập.", 409],
        LAST_ADMIN: ["Không thể xóa Admin cuối cùng.", 409],
      } as const;
      const [message, status] = errors[result];
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Không thể xóa người dùng:", error);
    return NextResponse.json({ error: "Không thể xóa người dùng." }, { status: 500 });
  }
}
