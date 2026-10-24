import Link from "next/link";
import { prisma } from "../../lib/prisma";

export default async function AdminPage() {
  const [productCount, orderCount, userCount, pendingOrderCount] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <>
      <header className="admin-page-heading">
        <div><p className="admin-muted">KCJ STORE / TỔNG QUAN</p><h1>Chào mừng đến Admin</h1></div>
      </header>
      <section className="admin-overview-grid" aria-label="Thống kê cửa hàng">
        <Link className="admin-overview-card" href="/admin/products">
          <span>Sản phẩm</span><strong>{productCount}</strong>
        </Link>
        <Link className="admin-overview-card" href="/admin/orders">
          <span>Đơn hàng</span><strong>{orderCount}</strong>
        </Link>
        <Link className="admin-overview-card" href="/admin/users">
          <span>Người dùng</span><strong>{userCount}</strong>
        </Link>
        <Link className="admin-overview-card" href="/admin/orders">
          <span>Đơn chờ xử lý</span><strong>{pendingOrderCount}</strong>
        </Link>
      </section>
    </>
  );
}
