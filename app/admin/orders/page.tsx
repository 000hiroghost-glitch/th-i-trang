import { prisma } from "../../../lib/prisma";
import OrderManager from "./OrderManager";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { user: { select: { fullName: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <header className="admin-page-heading">
        <div><p className="admin-muted">KCJ STORE / QUẢN LÝ</p><h1>Đơn hàng</h1></div>
      </header>
      <OrderManager initialOrders={orders.map(order => ({ ...order, createdAt: order.createdAt.toISOString() }))} />
    </>
  );
}
