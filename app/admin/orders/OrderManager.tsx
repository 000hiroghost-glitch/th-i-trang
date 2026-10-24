"use client";

import { useState } from "react";

type Order = {
  id: string;
  totalAmount: number;
  status: string;
  phone: string;
  shippingAddress: string;
  createdAt: string;
  user: { fullName: string | null; email: string } | null;
};

const statuses = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"];
const currency = new Intl.NumberFormat("vi-VN");

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
            <tr><th>Khách hàng</th><th>Điện thoại</th><th>Tổng tiền</th><th>Ngày tạo</th><th>Trạng thái</th><th>Cập nhật</th></tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>{order.user?.fullName || order.user?.email || "Khách vãng lai"}<br /><span className="admin-muted">{order.shippingAddress}</span></td>
                <td>{order.phone}</td>
                <td>{currency.format(order.totalAmount)}₫</td>
                <td>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                <td>{order.status}</td>
                <td>
                  <select
                    className="admin-control"
                    aria-label={`Trạng thái đơn ${order.id}`}
                    value={order.status}
                    disabled={savingId === order.id}
                    onChange={event => updateStatus(order.id, event.target.value)}
                  >
                    {statuses.map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={6}>Chưa có đơn hàng.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
