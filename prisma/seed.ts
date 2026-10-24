import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

const products = [
  {
    id: "a12f0000-0000-4000-8000-000000000001",
    category: { name: "Áo", slug: "ao" },
    name: "Áo thun KCJ Essential",
    price: 249000,
    description: "Áo thun cotton mềm mại, phom dáng cơ bản dễ phối đồ.",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    ],
    variants: [
      { id: "b12f0000-0000-4000-8000-000000000001", size: "S", color: "Trắng", stock: 20 },
      { id: "b12f0000-0000-4000-8000-000000000002", size: "M", color: "Đen", stock: 18 },
    ],
  },
  {
    id: "a12f0000-0000-4000-8000-000000000002",
    category: { name: "Áo", slug: "ao" },
    name: "Áo sơ mi Linen KCJ",
    price: 459000,
    description: "Sơ mi linen thoáng mát, phù hợp cho ngày thường và dịp đi chơi.",
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80",
    ],
    variants: [
      { id: "b12f0000-0000-4000-8000-000000000003", size: "M", color: "Be", stock: 12 },
      { id: "b12f0000-0000-4000-8000-000000000004", size: "L", color: "Xanh nhạt", stock: 9 },
    ],
  },
  {
    id: "a12f0000-0000-4000-8000-000000000003",
    category: { name: "Quần", slug: "quan" },
    name: "Quần jeans KCJ Straight",
    price: 629000,
    description: "Quần jeans ống đứng chất denim bền đẹp, dễ kết hợp trang phục.",
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80",
    ],
    variants: [
      { id: "b12f0000-0000-4000-8000-000000000005", size: "M", color: "Xanh denim", stock: 10 },
      { id: "b12f0000-0000-4000-8000-000000000006", size: "L", color: "Xanh denim", stock: 8 },
    ],
  },
  {
    id: "a12f0000-0000-4000-8000-000000000004",
    category: { name: "Áo khoác", slug: "ao-khoac" },
    name: "Áo khoác Bomber KCJ",
    price: 799000,
    description: "Áo khoác bomber nhẹ, thiết kế tối giản với túi tiện dụng.",
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80",
    ],
    variants: [
      { id: "b12f0000-0000-4000-8000-000000000007", size: "M", color: "Đen", stock: 7 },
      { id: "b12f0000-0000-4000-8000-000000000008", size: "L", color: "Rêu", stock: 6 },
    ],
  },
];

async function main() {
  for (const item of products) {
    const category = await prisma.category.upsert({
      where: { slug: item.category.slug },
      update: { name: item.category.name },
      create: item.category,
    });

    await prisma.product.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        price: item.price,
        description: item.description,
        images: item.images,
        categoryId: category.id,
      },
      create: {
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description,
        images: item.images,
        categoryId: category.id,
      },
    });

    for (const variant of item.variants) {
      await prisma.productVariant.upsert({
        where: { id: variant.id },
        update: {
          productId: item.id,
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
        },
        create: { ...variant, productId: item.id },
      });
    }
  }

  console.log(`Seeded ${products.length} KCJ products.`);

  const adminEmail = "admin@kcjstore.com";
  const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const adminPasswordHash = bootstrapPassword ? await hashPassword(bootstrapPassword) : null;
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true },
  });

  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        role: "ADMIN",
        ...(adminPasswordHash ? { password: adminPasswordHash } : {}),
      },
    });
    console.log("Granted ADMIN role to the configured bootstrap account.");
  } else if (adminPasswordHash) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: "KCJ Store Admin",
        password: adminPasswordHash,
        role: "ADMIN",
      },
    });
    console.log("Created the KCJ Store bootstrap admin account.");
  } else {
    throw new Error("Set ADMIN_BOOTSTRAP_PASSWORD to create admin@kcjstore.com.");
  }

  const promoteEmail = process.env.PROMOTE_ADMIN_EMAIL?.trim().toLowerCase();
  if (promoteEmail) {
    const promoted = await prisma.user.updateMany({
      where: { email: promoteEmail },
      data: { role: "ADMIN" },
    });
    if (promoted.count === 0) {
      console.warn("PROMOTE_ADMIN_EMAIL was not found; no existing account was changed.");
    } else {
      console.log("Granted ADMIN role to the requested existing account.");
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed the database:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
