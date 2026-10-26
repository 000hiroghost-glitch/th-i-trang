import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

const MAX_IMAGE_DATA_URL_LENGTH = 3 * 1024 * 1024;

function validProductImage(image: unknown): image is string {
  return typeof image === "string" && (
    (image.length > 0 && image.length <= 2048) ||
    (image.length <= MAX_IMAGE_DATA_URL_LENGTH &&
      /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image))
  );
}

function validProductInput(body: unknown): body is {
  name: string;
  price: number;
  description?: string;
  images: string[];
  categoryId: string;
  variants: { size: string; color?: string; stock: number }[];
} {
  return typeof body === "object" &&
    body !== null &&
    "name" in body &&
    typeof body.name === "string" &&
    body.name.trim().length > 0 &&
    body.name.length <= 160 &&
    "price" in body &&
    typeof body.price === "number" &&
    Number.isFinite(body.price) &&
    body.price >= 0 &&
    "categoryId" in body &&
    typeof body.categoryId === "string" &&
    "images" in body &&
    Array.isArray(body.images) &&
    body.images.length > 0 &&
    body.images.every(validProductImage) &&
    "variants" in body &&
    Array.isArray(body.variants) &&
    body.variants.length > 0 &&
    body.variants.every((variant: unknown) =>
      typeof variant === "object" &&
      variant !== null &&
      "size" in variant &&
      typeof variant.size === "string" &&
      variant.size.length <= 24 &&
      "stock" in variant &&
      typeof variant.stock === "number" &&
      Number.isInteger(variant.stock) &&
      variant.stock >= 0 &&
      (!("color" in variant) || variant.color === undefined || variant.color === null || typeof variant.color === "string")
    ) &&
    (!("description" in body) || body.description === undefined || body.description === null || typeof body.description === "string");
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }
  if (!validProductInput(body)) {
    return NextResponse.json({ error: "Thông tin sản phẩm không hợp lệ." }, { status: 400 });
  }

  const { id } = await context.params;
  const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
  if (!category) {
    return NextResponse.json({ error: "Danh mục không tồn tại." }, { status: 400 });
  }

  const existingProduct = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!existingProduct) {
    return NextResponse.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
  }

  const product = await prisma.$transaction(async transaction => {
    await transaction.product.update({
      where: { id },
      data: {
        name: body.name.trim(),
        price: body.price,
        description: body.description?.trim() || null,
        images: body.images,
        categoryId: category.id,
      },
    });
    const existingVariants = await transaction.productVariant.findMany({ where: { productId: id } });
    const retainedVariantIds: string[] = [];

    for (const variant of body.variants) {
      const size = variant.size.trim();
      const color = variant.color?.trim() || null;
      const existingVariant = existingVariants.find(
        candidate => candidate.size === size && candidate.color === color,
      );
      if (existingVariant) {
        retainedVariantIds.push(existingVariant.id);
        await transaction.productVariant.update({
          where: { id: existingVariant.id },
          data: { stock: variant.stock },
        });
      } else {
        const createdVariant = await transaction.productVariant.create({
          data: { productId: id, size, color, stock: variant.stock },
        });
        retainedVariantIds.push(createdVariant.id);
      }
    }

    for (const variant of existingVariants) {
      if (!retainedVariantIds.includes(variant.id)) {
        await transaction.productVariant.deleteMany({
          where: { id: variant.id, items: { none: {} } },
        });
      }
    }

    return transaction.product.findUniqueOrThrow({
      where: { id },
      include: { category: true, variants: true },
    });
  });
  return NextResponse.json(product);
}
