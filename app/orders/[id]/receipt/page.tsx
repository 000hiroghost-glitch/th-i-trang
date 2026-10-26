import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import PrintReceiptButton from "./PrintReceiptButton";
import "./receipt.css";

const currency = new Intl.NumberFormat("vi-VN");
const paymentLabels: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng (COD)",
  QR: "Chuyển khoản QR (demo)",
  INSTALLMENT: "Đăng ký trả góp",
};

export default async function OrderReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) notFound();

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: {
      id,
      status: "COMPLETED",
      ...(user.role === "ADMIN" ? {} : { userId: user.id }),
    },
    include: {
      items: {
        include: {
          variant: { include: { product: { select: { name: true } } } },
        },
      },
    },
  });
  if (!order) notFound();

  const subtotal = order.items.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <main className="receipt-page">
      <div className="receipt-actions">
        <Link href={user.role === "ADMIN" ? "/account?tab=admin&section=orders" : "/account#orders"}>Quay lại đơn hàng</Link>
        <PrintReceiptButton />
      </div>
      <article className="receipt-document">
        <header className="receipt-header">
          <div>
            <p className="receipt-eyebrow">KCJ STORE</p>
            <h1>Biên lai điện tử</h1>
            <p>Chứng từ xác nhận đơn hàng đã hoàn thành.</p>
          </div>
          <div className="receipt-paid-stamp">ĐÃ HOÀN THÀNH</div>
        </header>

        <section className="receipt-meta">
          <div><span>Mã đơn hàng</span><strong>{order.id}</strong></div>
          <div><span>Ngày đặt hàng</span><strong>{order.createdAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</strong></div>
          <div><span>Trạng thái</span><strong>Đã thanh toán / Hoàn thành</strong></div>
        </section>

        <section className="receipt-customer">
          <h2>Thông tin người nhận</h2>
          <p><strong>{order.customerName || "Khách hàng"}</strong></p>
          <p>{order.phone}</p>
          <p>{order.shippingAddress}</p>
        </section>

        <section className="receipt-payment">
          <h2>Thanh toán</h2>
          <p>{paymentLabels[order.paymentMethod] || order.paymentMethod}</p>
          {order.isInstallment && (
            <p>{order.installmentMonths} tháng · {order.installmentProvider || "Chưa chọn đối tác"} · {order.installmentVerificationStatus === "VERIFIED" ? "Đã xác minh qua đối tác" : "Đơn trả góp đang chờ đối tác xác minh"}</p>
          )}
        </section>

        <table className="receipt-items">
          <thead>
            <tr><th>Sản phẩm</th><th>Biến thể</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.id}>
                <td>{item.variant.product.name}</td>
                <td>{item.variant.size}{item.variant.color ? ` / ${item.variant.color}` : ""}</td>
                <td>{item.quantity}</td>
                <td>{currency.format(item.price)}₫</td>
                <td>{currency.format(item.price * item.quantity)}₫</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="receipt-totals">
          <div><span>Tạm tính</span><strong>{currency.format(subtotal)}₫</strong></div>
          {order.discountAmount > 0 && (
            <div><span>Giảm giá{order.discountCode ? ` (${order.discountCode})` : ""}</span><strong>−{currency.format(order.discountAmount)}₫</strong></div>
          )}
          <div className="receipt-grand-total"><span>Tổng thanh toán</span><strong>{currency.format(order.totalAmount)}₫</strong></div>
        </section>

        <footer className="receipt-footer">
          Biên lai được tạo từ thông tin đơn hàng KCJ Store. Đây không phải hóa đơn thuế.
        </footer>
      </article>
    </main>
  );
}
