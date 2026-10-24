import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

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
    body.images.every((image: unknown) => typeof image === "string" && image.length <= 2048) &&
    "variants" in body &&
    Array.isArray(body.variants) &&
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

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: { category: true, variants: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  return NextResponse.json({ products, categories });
}

export async function POST(request: NextRequest) {
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

  const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
  if (!category) {
    return NextResponse.json({ error: "Danh mục không tồn tại." }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name: body.name.trim(),
      price: body.price,
      description: body.description?.trim() || null,
      images: body.images,
      categoryId: category.id,
      variants: {
        create: body.variants.map(variant => ({
          size: variant.size.trim(),
          color: variant.color?.trim() || null,
          stock: variant.stock,
        })),
      },
    },
    include: { category: true, variants: true },
  });
  return NextResponse.json(product, { status: 201 });
}
