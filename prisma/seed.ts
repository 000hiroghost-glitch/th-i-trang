import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();
const TARGET_PRODUCT_COUNT = 100;
const SEED_ID_PREFIX = "kcj-seed-product-";
const sizeVariants = ["S", "M", "L"];
const productImages = [
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1548126032-079a0fb0099d?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1550614000-4895a10e1bfd?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1564859228273-274232fdb516?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=900&q=85",
];
const productStyles = {
  ao: {
    category: { name: "Áo", slug: "ao" },
    names: ["Áo thun Essential", "Áo sơ mi Linen", "Áo polo Classic", "Áo hoodie Cotton"],
  },
  quan: {
    category: { name: "Quần", slug: "quan" },
    names: ["Quần jeans Straight", "Quần kaki Daily", "Quần ống rộng Relax", "Quần short Cotton"],
  },
  aoKhoac: {
    category: { name: "Áo khoác", slug: "ao-khoac" },
    names: ["Áo khoác Bomber", "Áo khoác Denim", "Áo cardigan Knit", "Áo blazer Minimal"],
  },
};

const products = Array.from({ length: TARGET_PRODUCT_COUNT }, (_, index) => {
  const style = Object.values(productStyles)[index % Object.keys(productStyles).length];
  const styleName = style.names[Math.floor(index / Object.keys(productStyles).length) % style.names.length];
  const productId = `${SEED_ID_PREFIX}${String(index + 1).padStart(3, "0")}`;
  return {
    id: productId,
    category: style.category,
    name: `${styleName} KCJ ${String(index + 1).padStart(3, "0")}`,
    price: 249000 + (index % 30) * 25000,
    description: `${styleName} thiết kế tối giản, chất liệu thoải mái phù hợp sử dụng hằng ngày.`,
    images: [productImages[index % productImages.length]],
    variants: sizeVariants.map(size => ({
      id: `kcj-seed-variant-${String(index + 1).padStart(3, "0")}-${size.toLowerCase()}`,
      size,
      color: "Đen",
      stock: 10,
    })),
  };
});

async function seedProducts() {
  const existingSeedProducts = await prisma.product.findMany({
    where: { id: { startsWith: SEED_ID_PREFIX } },
    select: { id: true },
  });
  const totalProducts = await prisma.product.count();
  const unseededProducts = totalProducts - existingSeedProducts.length;
  const requiredSeedCount = Math.max(0, TARGET_PRODUCT_COUNT - unseededProducts);
  const existingSeedIds = new Set(existingSeedProducts.map(product => product.id));
  const missingSeeds = products
    .filter(product => !existingSeedIds.has(product.id))
    .slice(0, Math.max(0, requiredSeedCount - existingSeedProducts.length));

  for (const item of missingSeeds) {
    const category = await prisma.category.upsert({
      where: { slug: item.category.slug },
      update: { name: item.category.name },
      create: item.category,
    });
    await prisma.product.create({
      data: {
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description,
        images: item.images,
        categoryId: category.id,
        variants: {
          create: item.variants.map(({ id, size, color, stock }) => ({
            id,
            size,
            color,
            stock,
          })),
        },
      },
    });
  }

  const seededProducts = await prisma.product.findMany({
    where: { id: { startsWith: SEED_ID_PREFIX } },
    select: { id: true },
  });
  for (const item of products) {
    if (!seededProducts.some(product => product.id === item.id)) continue;
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: item.category.slug } });
    await prisma.product.update({
      where: { id: item.id },
      data: {
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
        update: { productId: item.id, size: variant.size, color: variant.color },
        create: { ...variant, productId: item.id },
      });
    }
  }

  const catalogProducts = await prisma.product.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      variants: { select: { size: true, color: true } },
    },
  });
  for (const [index, product] of catalogProducts.entries()) {
    await prisma.product.update({
      where: { id: product.id },
      data: { images: [productImages[index % productImages.length]] },
    });
    const existingSizes = new Set(product.variants.map(variant => variant.size.toUpperCase()));
    const color = product.variants.find(variant => variant.color)?.color ?? "Đen";
    for (const size of sizeVariants) {
      if (existingSizes.has(size)) continue;
      await prisma.productVariant.create({
        data: { productId: product.id, size, color, stock: 10 },
      });
    }
  }

  console.log(`Ensured ${catalogProducts.length} products total; assigned ${productImages.length} rotating images (at most 3 products per image for a 100-product catalog) and S/M/L variants.`);
}

async function seedBootstrapAdmin() {
  const adminEmail = "admin@kcjstore.com";
  const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (bootstrapPassword) {
    const password = await hashPassword(bootstrapPassword);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: "ADMIN", password },
      create: {
        email: adminEmail,
        fullName: "KCJ Store Admin",
        password,
        role: "ADMIN",
      },
    });
    console.log("Configured the KCJ bootstrap admin account.");
  } else {
    console.log("Skipped bootstrap admin setup; ADMIN_BOOTSTRAP_PASSWORD is not configured.");
  }

  const promoteEmail = process.env.PROMOTE_ADMIN_EMAIL?.trim().toLowerCase();
  if (!promoteEmail) return;
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

async function main() {
  await seedProducts();
  await seedBootstrapAdmin();
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed the database:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
