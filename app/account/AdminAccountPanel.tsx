import { prisma } from "../../lib/prisma";
import { getAdminBanners } from "../../lib/banner-repository";
import ProductManager from "../admin/products/ProductManager";
import OrderManager from "../admin/orders/OrderManager";
import UserManager from "../admin/users/UserManager";
import BannerManager from "../admin/banners/BannerManager";
import AdminAccountSections from "./AdminAccountSections";

export default async function AdminAccountPanel() {
  const [products, categories, banners, orders, users, productCount, orderCount, userCount, pendingOrderCount] = await Promise.all([
    prisma.product.findMany({
      include: { category: true, variants: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    getAdminBanners(),
    prisma.order.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
        items: { include: { variant: { include: { product: { select: { name: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      select: { id: true, fullName: true, email: true, role: true, isBlocked: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <AdminAccountSections
      productCount={productCount}
      orderCount={orderCount}
      userCount={userCount}
      pendingOrderCount={pendingOrderCount}
      productsPanel={<ProductManager initialProducts={products} categories={categories} />}
      bannersPanel={<BannerManager initialBanners={banners.map(banner => ({
        ...banner,
        startsAt: banner.startsAt?.toISOString() ?? null,
        endsAt: banner.endsAt?.toISOString() ?? null,
        createdAt: banner.createdAt.toISOString(),
        updatedAt: banner.updatedAt.toISOString(),
      }))} />}
      ordersPanel={<OrderManager initialOrders={orders.map(order => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
      }))} />}
      usersPanel={<UserManager initialUsers={users.map(user => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
      }))} />}
    />
  );
}
