import type { OrderStatus } from "@prisma/client";
import { prisma } from "./prisma";

export class OrderNotFoundError extends Error {}
export class OrderConflictError extends Error {}
export class InsufficientStockError extends Error {}

export async function changeOrderStatus(
  id: string,
  status: OrderStatus,
  userId?: string,
  allowedCurrentStatuses?: OrderStatus[],
) {
  return prisma.$transaction(async transaction => {
    const current = await transaction.order.findFirst({
      where: { id, ...(userId ? { userId } : {}) },
      include: { items: true },
    });
    if (!current) throw new OrderNotFoundError("Không tìm thấy đơn hàng.");
    if (current.status === status) return current;
    if (allowedCurrentStatuses && !allowedCurrentStatuses.includes(current.status)) {
      throw new OrderConflictError("Chỉ có thể hủy đơn hàng đang chờ xử lý.");
    }

    const changed = await transaction.order.updateMany({
      where: { id, status: current.status, ...(userId ? { userId } : {}) },
      data: { status },
    });
    if (changed.count !== 1) {
      throw new OrderConflictError("Đơn hàng vừa được cập nhật. Hãy tải lại trang.");
    }

    if (current.status === "CANCELLED" && status !== "CANCELLED") {
      for (const item of current.items) {
        const reserved = await transaction.productVariant.updateMany({
          where: { id: item.productVariantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (reserved.count !== 1) {
          throw new InsufficientStockError("Không đủ tồn kho để mở lại đơn hàng đã hủy.");
        }
      }
    } else if (current.status !== "CANCELLED" && status === "CANCELLED") {
      for (const item of current.items) {
        await transaction.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return { ...current, status };
  });
}
