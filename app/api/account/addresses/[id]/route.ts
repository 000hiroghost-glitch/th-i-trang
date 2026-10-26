import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

function isAddressInput(value: unknown): value is {
  label: string;
  recipient: string;
  phone: string;
  address: string;
  isDefault: boolean;
} {
  return typeof value === "object" &&
    value !== null &&
    "label" in value && typeof value.label === "string" && value.label.trim().length > 0 && value.label.length <= 40 &&
    "recipient" in value && typeof value.recipient === "string" && value.recipient.trim().length >= 2 && value.recipient.length <= 120 &&
    "phone" in value && typeof value.phone === "string" && value.phone.trim().length >= 8 && value.phone.length <= 30 &&
    "address" in value && typeof value.address === "string" && value.address.trim().length >= 8 && value.address.length <= 300 &&
    "isDefault" in value && typeof value.isDefault === "boolean";
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Địa chỉ không hợp lệ." }, { status: 400 });
  }
  if (!isAddressInput(body)) {
    return NextResponse.json({ error: "Vui lòng nhập đầy đủ thông tin địa chỉ." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    const { id } = await context.params;
    const address = await prisma.$transaction(async transaction => {
      const existing = await transaction.accountAddress.findFirst({ where: { id, userId: user.id } });
      if (!existing) return null;
      if (body.isDefault) {
        await transaction.accountAddress.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      }
      const updated = await transaction.accountAddress.update({
        where: { id },
        data: {
          label: body.label.trim(),
          recipient: body.recipient.trim(),
          phone: body.phone.trim(),
          address: body.address.trim(),
          isDefault: body.isDefault,
        },
      });
      if (updated.isDefault) {
        await transaction.user.update({ where: { id: user.id }, data: { address: updated.address, phone: updated.phone } });
      } else if (existing.isDefault) {
        const nextDefault = await transaction.accountAddress.findFirst({
          where: { userId: user.id, id: { not: id } },
          orderBy: { createdAt: "desc" },
        });
        if (nextDefault) {
          await transaction.accountAddress.update({ where: { id: nextDefault.id }, data: { isDefault: true } });
          await transaction.user.update({ where: { id: user.id }, data: { address: nextDefault.address, phone: nextDefault.phone } });
        } else {
          await transaction.accountAddress.update({ where: { id }, data: { isDefault: true } });
          await transaction.user.update({ where: { id: user.id }, data: { address: updated.address, phone: updated.phone } });
        }
      }
      return updated;
    });
    if (!address) return NextResponse.json({ error: "Không tìm thấy địa chỉ." }, { status: 404 });
    return NextResponse.json({ success: true, address });
  } catch (error) {
    console.error("Không thể cập nhật địa chỉ:", error);
    return NextResponse.json({ error: "Không thể cập nhật địa chỉ." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    const { id } = await context.params;
    const result = await prisma.$transaction(async transaction => {
      const address = await transaction.accountAddress.findFirst({ where: { id, userId: user.id } });
      if (!address) return null;
      await transaction.accountAddress.delete({ where: { id } });
      if (address.isDefault) {
        const nextDefault = await transaction.accountAddress.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
        });
        if (nextDefault) {
          await transaction.accountAddress.update({ where: { id: nextDefault.id }, data: { isDefault: true } });
          await transaction.user.update({ where: { id: user.id }, data: { address: nextDefault.address, phone: nextDefault.phone } });
        } else {
          await transaction.user.update({ where: { id: user.id }, data: { address: null } });
        }
      }
      return address;
    });
    if (!result) return NextResponse.json({ error: "Không tìm thấy địa chỉ." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Không thể xóa địa chỉ:", error);
    return NextResponse.json({ error: "Không thể xóa địa chỉ." }, { status: 500 });
  }
}
