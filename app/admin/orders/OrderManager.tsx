"use client";

import { useState } from "react";

type Order = {
  id: string;
  totalAmount: number;
  status: string;
  phone: string;
  shippingAddress: string;
  createdAt: string;
  customerName: string | null;
  paymentMethod: string;
  isInstallment: boolean;
  installmentMonths: number | null;
  installmentProvider: string | null;
  installmentVerificationStatus: string | null;
  discountCode: string | null;
  discountAmount: number;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    variant: { size: string; color: string | null; product: { name: string } };
  }>;
  user: { fullName: string | null; email: string } | null;
};

const statuses = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"];
const currency = new Intl.NumberFormat("vi-VN");
const statusLabels: Record<string, string> = {
  PENDING: "Đang xử lý",
  PAID: "Đã xác nhận",
  SHIPPED: "Đang giao",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
};
const paymentLabels: Record<string, string> = {
  COD: "COD",
  QR: "QR (demo)",
  INSTALLMENT: "Trả góp",
};

export default function OrderManager({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setSavingId(id);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể cập nhật đơn hàng.");
      setOrders(current => current.map(order => order.id === id ? { ...order, status } : order));
      setMessage("Đã cập nhật trạng thái đơn hàng.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể cập nhật đơn hàng.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <p className="admin-status" role="status">{message}</p>
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr><th>Khách hàng & giao hàng</th><th>Sản phẩm</th><th>Thanh toán</th><th>Tổng tiền</th><th>Ngày tạo</th><th>Trạng thái</th><th>Cập nhật</th></tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>
                  {order.customerName || order.user?.fullName || order.user?.email || "Khách vãng lai"}
                  <br /><span className="admin-muted">{order.phone}<br />{order.shippingAddress}</span>
                </td>
                <td>
                  <details>
                    <summary>{order.items.length} sản phẩm</summary>
                    <ul className="admin-order-items">
                      {order.items.map(item => <li key={item.id}>
                        {item.variant.product.name} · {item.variant.size}{item.variant.color ? ` / ${item.variant.color}` : ""} × {item.quantity} — {currency.format(item.price * item.quantity)}₫
                      </li>)}
                    </ul>
                  </details>
                </td>
                <td>
                  <strong>{paymentLabels[order.paymentMethod] || order.paymentMethod}</strong>
                  {order.isInstallment && <div className="admin-muted">
                    {order.installmentMonths} tháng · {order.installmentProvider || "Chưa chọn đối tác"}
                    <br />Xác minh: {order.installmentVerificationStatus === "VERIFIED" ? "Đã xác minh qua đối tác" : "Chờ đối tác xác minh"}
                  </div>}
                  {order.discountCode && <div className="admin-muted">Mã {order.discountCode} · −{currency.format(order.discountAmount)}₫</div>}
                </td>
                <td>{currency.format(order.totalAmount)}₫</td>
                <td>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                <td>{statusLabels[order.status] || order.status}</td>
                <td>
                  <select
                    className="admin-control"
                    aria-label={`Trạng thái đơn ${order.id}`}
                    value={order.status}
                    disabled={savingId === order.id}
                    onChange={event => updateStatus(order.id, event.target.value)}
                  >
                    {statuses.map(status => <option key={status} value={status}>{statusLabels[status] || status}</option>)}
                  </select>
                  {order.status === "COMPLETED" && (
                    <a className="admin-receipt-link" href={`/orders/${encodeURIComponent(order.id)}/receipt`} target="_blank" rel="noreferrer">
                      Xem biên lai
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={7}>Chưa có đơn hàng.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
