import { prisma } from "../../../lib/prisma";
import ProductManager from "./ProductManager";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: { category: true, variants: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <header className="admin-page-heading">
        <div><p className="admin-muted">KCJ STORE / QUẢN LÝ</p><h1>Sản phẩm</h1></div>
      </header>
      <ProductManager initialProducts={products} categories={categories} />
    </>
  );
}
