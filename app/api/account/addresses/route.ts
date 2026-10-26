import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    const addresses = await prisma.accountAddress.findMany({
      where: { userId: user.id },
      select: { id: true, label: true, recipient: true, phone: true, address: true, isDefault: true },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ addresses }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Không thể tải địa chỉ giao hàng:", error);
    return NextResponse.json({ error: "Không thể tải danh sách địa chỉ." }, { status: 500 });
  }
}

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

export async function POST(request: NextRequest) {
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
    const count = await prisma.accountAddress.count({ where: { userId: user.id } });
    if (count >= 20) return NextResponse.json({ error: "Mỗi tài khoản lưu tối đa 20 địa chỉ." }, { status: 400 });
    const address = await prisma.$transaction(async transaction => {
      if (body.isDefault || count === 0) {
        await transaction.accountAddress.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      }
      const created = await transaction.accountAddress.create({
        data: {
          userId: user.id,
          label: body.label.trim(),
          recipient: body.recipient.trim(),
          phone: body.phone.trim(),
          address: body.address.trim(),
          isDefault: body.isDefault || count === 0,
        },
      });
      if (created.isDefault) {
        await transaction.user.update({ where: { id: user.id }, data: { address: created.address, phone: created.phone } });
      }
      return created;
    });
    return NextResponse.json({ success: true, address }, { status: 201 });
  } catch (error) {
    console.error("Không thể thêm địa chỉ:", error);
    return NextResponse.json({ error: "Không thể thêm địa chỉ." }, { status: 500 });
  }
}
