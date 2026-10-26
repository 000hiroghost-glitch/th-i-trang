"use client";

import { ReactNode, useEffect, useState } from "react";

type Section = "overview" | "products" | "banners" | "orders" | "users";

const sections: Array<{ id: Section; label: string }> = [
  { id: "overview", label: "Tổng quan" },
  { id: "products", label: "Sản phẩm" },
  { id: "banners", label: "Banner & khuyến mãi" },
  { id: "orders", label: "Đơn hàng" },
  { id: "users", label: "Người dùng" },
];

export default function AdminAccountSections({
  productCount,
  orderCount,
  userCount,
  pendingOrderCount,
  productsPanel,
  bannersPanel,
  ordersPanel,
  usersPanel,
}: {
  productCount: number;
  orderCount: number;
  userCount: number;
  pendingOrderCount: number;
  productsPanel: ReactNode;
  bannersPanel: ReactNode;
  ordersPanel: ReactNode;
  usersPanel: ReactNode;
}) {
  const [section, setSection] = useState<Section>("overview");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("section");
    if (sections.some(item => item.id === requested)) setSection(requested as Section);
  }, []);

  function selectSection(next: Section) {
    setSection(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", "admin");
    if (next === "overview") url.searchParams.delete("section");
    else url.searchParams.set("section", next);
    window.history.replaceState(null, "", url);
  }

  return (
    <section className="account-admin">
      <header className="account-admin-heading">
        <p className="account-eyebrow">KCJ STORE / QUẢN TRỊ</p>
        <h2>Quản trị hệ thống</h2>
        <p>Quản lý cửa hàng trong trang tài khoản. Các thao tác vẫn được xác thực quyền Admin ở API.</p>
      </header>
      <nav className="account-admin-tabs" aria-label="Các chức năng quản trị">
        {sections.map(item => (
          <button
            key={item.id}
            type="button"
            className={section === item.id ? "is-active" : ""}
            aria-current={section === item.id ? "page" : undefined}
            onClick={() => selectSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="account-admin-body">
        {section === "overview" && (
          <div className="admin-overview-grid" aria-label="Thống kê cửa hàng">
            <button type="button" className="admin-overview-card" onClick={() => selectSection("products")}><span>Sản phẩm</span><strong>{productCount}</strong></button>
            <button type="button" className="admin-overview-card" onClick={() => selectSection("orders")}><span>Đơn hàng</span><strong>{orderCount}</strong></button>
            <button type="button" className="admin-overview-card" onClick={() => selectSection("users")}><span>Người dùng</span><strong>{userCount}</strong></button>
            <button type="button" className="admin-overview-card" onClick={() => selectSection("orders")}><span>Đơn chờ xử lý</span><strong>{pendingOrderCount}</strong></button>
          </div>
        )}
        {section === "products" && productsPanel}
        {section === "banners" && bannersPanel}
        {section === "orders" && ordersPanel}
        {section === "users" && usersPanel}
      </div>
    </section>
  );
}
