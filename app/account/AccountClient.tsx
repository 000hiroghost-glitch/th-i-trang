"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, ReactNode, useEffect, useState } from "react";
import "./account.css";
import "../admin/admin.css";

type Gender = "FEMALE" | "MALE" | "OTHER" | "UNSPECIFIED";
type Address = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  address: string;
  isDefault: boolean;
};
type Profile = {
  id: string;
  role: "USER" | "ADMIN";
  email: string;
  fullName: string;
  phone: string;
  avatar: string | null;
  dateOfBirth: string | null;
  gender: Gender;
  allowMarketingEmails: boolean;
  orderStatusNotifications: boolean;
  preferredLanguage: "vi" | "en";
  addresses: Address[];
};
type Order = {
  id: string;
  status: "PENDING" | "PAID" | "SHIPPED" | "COMPLETED" | "CANCELLED";
  totalAmount: number;
  shippingAddress: string;
  customerName: string | null;
  phone: string;
  paymentMethod: string;
  isInstallment: boolean;
  installmentMonths: number | null;
  installmentProvider: string | null;
  discountCode: string | null;
  discountAmount: number;
  createdAt: string;
  items: Array<{
    quantity: number;
    price: number;
    variant: { size: string; color: string | null; product: { name: string } };
  }>;
};

const emptyAddress = { label: "Nhà riêng", recipient: "", phone: "", address: "", isDefault: false };
async function readResponse(response: Response) {
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = result && typeof result === "object" && "error" in result && typeof result.error === "string"
      ? result.error
      : "Yêu cầu không thành công.";
    throw new Error(error);
  }
  return result;
}

export default function AccountClient({ adminPanel }: { adminPanel: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [orderCode, setOrderCode] = useState("");
  const [trackingMessage, setTrackingMessage] = useState("");
  const [trackingBusy, setTrackingBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("kcj-theme") === "dark" ? "dark" : "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
    void loadAccount();
  }, []);

  useEffect(() => {
    const syncTabFromHash = () => {
      const requestedTab = window.location.hash.slice(1) || new URLSearchParams(window.location.search).get("tab") || "";
      if (["profile", "addresses", "orders", "security", "settings", "admin"].includes(requestedTab)) {
        setActiveTab(requestedTab);
      }
    };
    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);
    window.addEventListener("popstate", syncTabFromHash);
    return () => {
      window.removeEventListener("hashchange", syncTabFromHash);
      window.removeEventListener("popstate", syncTabFromHash);
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "orders") return;
    let refreshing = false;
    const refreshOrders = async () => {
      if (refreshing || document.visibilityState === "hidden") return;
      refreshing = true;
      try {
        const data: unknown = await readResponse(await fetch("/api/orders", { cache: "no-store" }));
        if (!Array.isArray(data)) throw new Error("Máy chủ trả về danh sách đơn hàng không hợp lệ.");
        setOrders(data as Order[]);
        setTrackedOrder(current => current ? (data as Order[]).find(order => order.id === current.id) || current : null);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Không thể cập nhật trạng thái đơn hàng.");
      } finally {
        refreshing = false;
      }
    };
    const interval = window.setInterval(() => void refreshOrders(), 2000);
    window.addEventListener("focus", refreshOrders);
    document.addEventListener("visibilitychange", refreshOrders);
    void refreshOrders();
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOrders);
      document.removeEventListener("visibilitychange", refreshOrders);
    };
  }, [activeTab]);

  async function loadAccount() {
    setError("");
    try {
      const [profileResponse, ordersResponse] = await Promise.all([
        fetch("/api/account/profile", { cache: "no-store" }),
        fetch("/api/orders", { cache: "no-store" }),
      ]);
      const [profileData, orderData] = await Promise.all([
        readResponse(profileResponse),
        readResponse(ordersResponse),
      ]);
      setProfile(profileData as Profile);
      setOrders(orderData as Order[]);
      if ((profileData as Profile).role !== "ADMIN" && new URLSearchParams(window.location.search).get("tab") === "admin") {
        setActiveTab("profile");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải thông tin tài khoản.");
    }
  }

  async function trackOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = orderCode.trim();
    if (!id) return;
    setTrackingBusy(true);
    setTrackingMessage("");
    setError("");
    try {
      const result = await readResponse(await fetch(`/api/orders/${encodeURIComponent(id)}`, { cache: "no-store" }));
      if (!result || typeof result !== "object" || !("id" in result) || !("status" in result)) {
        throw new Error("Máy chủ trả về thông tin đơn hàng không hợp lệ.");
      }
      setTrackedOrder(result as Order);
      setTrackingMessage("Đã tìm thấy đơn hàng trong tài khoản của bạn.");
    } catch (cause) {
      setTrackedOrder(null);
      setTrackingMessage(cause instanceof Error ? cause.message : "Không thể tra cứu đơn hàng.");
    } finally {
      setTrackingBusy(false);
    }
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const result = await readResponse(await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profile.fullName,
          phone: profile.phone,
          avatar: profile.avatar,
          dateOfBirth: profile.dateOfBirth?.slice(0, 10) || null,
          gender: profile.gender,
        }),
      }));
      setProfile(current => current ? { ...current, ...(result as { user: Partial<Profile> }).user } : current);
      setMessage("Đã lưu hồ sơ cá nhân.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu hồ sơ.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !profile) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError("Ảnh đại diện phải là JPG, PNG hoặc WebP và không quá 2 MB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setProfile(current => current ? { ...current, avatar: reader.result as string } : current);
    };
    reader.onerror = () => setError("Không thể đọc tệp ảnh.");
    reader.readAsDataURL(file);
  }

  async function submitAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        editingAddressId ? `/api/account/addresses/${encodeURIComponent(editingAddressId)}` : "/api/account/addresses",
        {
          method: editingAddressId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addressForm),
        },
      );
      await readResponse(response);
      setAddressForm(emptyAddress);
      setEditingAddressId(null);
      await loadAccount();
      setMessage("Đã lưu địa chỉ giao hàng.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu địa chỉ.");
    } finally {
      setBusy(false);
    }
  }

  async function removeAddress(address: Address) {
    if (!window.confirm(`Xóa địa chỉ "${address.label}"?`)) return;
    try {
      await readResponse(await fetch(`/api/account/addresses/${encodeURIComponent(address.id)}`, { method: "DELETE" }));
      await loadAccount();
      setMessage("Đã xóa địa chỉ.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể xóa địa chỉ.");
    }
  }

  async function saveSettings(changes: Partial<Pick<Profile, "allowMarketingEmails" | "orderStatusNotifications" | "preferredLanguage">>) {
    if (!profile || busy) return;
    const next = { ...profile, ...changes };
    setProfile(next);
    setBusy(true);
    setError("");
    try {
      await readResponse(await fetch("/api/account/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowMarketingEmails: next.allowMarketingEmails,
          orderStatusNotifications: next.orderStatusNotifications,
          preferredLanguage: next.preferredLanguage,
        }),
      }));
      setMessage("Đã lưu cài đặt.");
    } catch (cause) {
      await loadAccount();
      setError(cause instanceof Error ? cause.message : "Không thể lưu cài đặt.");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await readResponse(await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      }));
      setMessage((result as { message?: string }).message || "Đã đổi mật khẩu.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      window.setTimeout(() => window.location.assign("/index.html"), 1000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đổi mật khẩu.");
    } finally {
      setBusy(false);
    }
  }

  function switchTheme(next: "light" | "dark") {
    setTheme(next);
    window.localStorage.setItem("kcj-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  const t = (vietnamese: string, english: string) =>
    profile?.preferredLanguage === "en" ? english : vietnamese;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/index.html");
  }

  function selectTab(tab: string) {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.hash = "";
    url.searchParams.set("tab", tab);
    if (tab !== "admin") url.searchParams.delete("section");
    window.history.replaceState(null, "", url);
  }

  if (!profile && !error) return <main className="account-page"><p>Đang tải tài khoản…</p></main>;
  if (!profile) {
    return (
      <main className="account-page">
        <div className="account-card account-login">
          <h1>Tài khoản KCJ Store</h1>
          <p>{error}</p>
          <Link href="/index.html">Quay lại trang chủ và đăng nhập</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="account-page">
      <header className="account-header">
        <Link href="/index.html" className="account-brand">KCJ <span>STORE</span></Link>
        <div>
          <span>{profile.fullName}</span>
          <button type="button" className="account-link-button" onClick={() => void logout()}>{t("Đăng xuất", "Sign out")}</button>
        </div>
      </header>
      <div className="account-layout">
        <aside className="account-sidebar">
          <p className="account-eyebrow">{t("TÀI KHOẢN CỦA BẠN", "YOUR ACCOUNT")}</p>
          <h1>{t("Xin chào,", "Hello,")}<br /><em>{profile.fullName.split(" ")[0]}</em></h1>
          <nav aria-label="Khu vực tài khoản">
            {[
              ["profile", t("Hồ sơ cá nhân", "Profile")],
              ["addresses", t("Địa chỉ giao hàng", "Shipping addresses")],
              ["orders", t("Lịch sử đơn hàng", "Order history")],
              ["security", t("Mật khẩu & bảo mật", "Password & security")],
              ["settings", t("Cài đặt", "Settings")],
              ...(profile.role === "ADMIN" && adminPanel ? [["admin", "Quản trị hệ thống"]] : []),
            ].map(([id, label]) => (
              <button key={id} type="button" className={activeTab === id ? "is-active" : ""} onClick={() => selectTab(id)}>
                {label}
              </button>
            ))}
          </nav>
        </aside>
        <section className="account-content">
          {message && <p className="account-alert account-success" role="status">{message}</p>}
          {error && <p className="account-alert account-error" role="alert">{error}</p>}

          {activeTab === "profile" && (
            <section className="account-card">
              <div className="account-section-heading"><div><p className="account-eyebrow">{t("HỒ SƠ CỦA BẠN", "YOUR PROFILE")}</p><h2>{t("Thông tin cá nhân", "Personal information")}</h2></div></div>
              <form className="account-form" onSubmit={submitProfile}>
                <div className="account-avatar-field">
                  <div className="account-avatar">{profile.avatar ? <img src={profile.avatar} alt="Ảnh đại diện" /> : profile.fullName.slice(0, 1).toUpperCase()}</div>
                  <label className="account-upload">{t("Chọn ảnh đại diện", "Choose avatar")}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} /></label>
                  <small>{t("JPG, PNG hoặc WebP · tối đa 2 MB", "JPG, PNG or WebP · up to 2 MB")}</small>
                </div>
                <label>{t("Họ và tên", "Full name")}<input required minLength={2} maxLength={120} value={profile.fullName} onChange={event => setProfile({ ...profile, fullName: event.target.value })} /></label>
                <label>Email<input value={profile.email} readOnly aria-readonly="true" /></label>
                <label>{t("Số điện thoại", "Phone")}<input maxLength={30} value={profile.phone || ""} onChange={event => setProfile({ ...profile, phone: event.target.value })} /></label>
                <label>{t("Ngày sinh", "Date of birth")}<input type="date" value={profile.dateOfBirth?.slice(0, 10) || ""} onChange={event => setProfile({ ...profile, dateOfBirth: event.target.value || null })} /></label>
                <label>{t("Giới tính", "Gender")}
                  <select value={profile.gender} onChange={event => setProfile({ ...profile, gender: event.target.value as Gender })}>
                    <option value="UNSPECIFIED">{t("Không muốn tiết lộ", "Prefer not to say")}</option><option value="FEMALE">{t("Nữ", "Female")}</option><option value="MALE">{t("Nam", "Male")}</option><option value="OTHER">{t("Khác", "Other")}</option>
                  </select>
                </label>
                <button className="account-primary" type="submit" disabled={busy}>{t("Lưu thay đổi", "Save changes")}</button>
              </form>
            </section>
          )}

          {activeTab === "addresses" && (
            <section className="account-card">
              <p className="account-eyebrow">{t("GIAO HÀNG", "DELIVERY")}</p><h2>{t("Địa chỉ của bạn", "Your addresses")}</h2>
              <div className="account-address-list">
                {profile.addresses.map(address => (
                  <article className="account-address" key={address.id}>
                    <div><strong>{address.label}</strong>{address.isDefault && <span className="account-default">{t("Mặc định", "Default")}</span>}
                      <p>{address.recipient} · {address.phone}</p><p>{address.address}</p>
                    </div>
                    <div className="account-inline-actions">
                      <button type="button" onClick={() => { setAddressForm({ label: address.label, recipient: address.recipient, phone: address.phone, address: address.address, isDefault: address.isDefault }); setEditingAddressId(address.id); }}>{t("Sửa", "Edit")}</button>
                      <button type="button" onClick={() => void removeAddress(address)}>{t("Xóa", "Delete")}</button>
                    </div>
                  </article>
                ))}
                {profile.addresses.length === 0 && <p>{t("Chưa lưu địa chỉ giao hàng.", "No shipping addresses saved.")}</p>}
              </div>
              <h3>{editingAddressId ? t("Cập nhật địa chỉ", "Update address") : t("Thêm địa chỉ", "Add address")}</h3>
              <form className="account-form" onSubmit={submitAddress}>
                <label>{t("Nhãn", "Label")}<input required maxLength={40} value={addressForm.label} onChange={event => setAddressForm({ ...addressForm, label: event.target.value })} /></label>
                <label>{t("Người nhận", "Recipient")}<input required maxLength={120} value={addressForm.recipient} onChange={event => setAddressForm({ ...addressForm, recipient: event.target.value })} /></label>
                <label>{t("Số điện thoại", "Phone")}<input required minLength={8} maxLength={30} value={addressForm.phone} onChange={event => setAddressForm({ ...addressForm, phone: event.target.value })} /></label>
                <label className="account-wide">{t("Địa chỉ", "Address")}<input required minLength={8} maxLength={300} value={addressForm.address} onChange={event => setAddressForm({ ...addressForm, address: event.target.value })} /></label>
                <label className="account-check"><input type="checkbox" checked={addressForm.isDefault} onChange={event => setAddressForm({ ...addressForm, isDefault: event.target.checked })} /> {t("Đặt làm địa chỉ mặc định", "Set as default address")}</label>
                <div className="account-form-actions">
                  <button className="account-primary" type="submit" disabled={busy}>{editingAddressId ? t("Cập nhật", "Update") : t("Thêm địa chỉ", "Add address")}</button>
                  {editingAddressId && <button type="button" onClick={() => { setEditingAddressId(null); setAddressForm(emptyAddress); }}>{t("Hủy sửa", "Cancel")}</button>}
                </div>
              </form>
            </section>
          )}

          {activeTab === "orders" && (
            <section className="account-card">
              <p className="account-eyebrow">KCJ STORE</p><h2>{t("Lịch sử đơn hàng", "Order history")}</h2>
              <p className="account-order-sync" role="status">{t("Trạng thái tự động đồng bộ mỗi 2 giây khi trang đang mở.", "Order statuses refresh every 2 seconds while this page is open.")}</p>
              <form className="account-order-lookup" onSubmit={trackOrder}>
                <label htmlFor="account-order-code">{t("Tra cứu bằng mã đơn hàng", "Look up by order ID")}</label>
                <div>
                  <input
                    id="account-order-code"
                    value={orderCode}
                    onChange={event => setOrderCode(event.target.value)}
                    placeholder={t("Nhập mã đơn hàng đầy đủ", "Enter the full order ID")}
                    required
                  />
                  <button type="submit" disabled={trackingBusy}>{trackingBusy ? t("Đang tìm...", "Searching...") : t("Tra cứu", "Track order")}</button>
                  {trackedOrder && <button type="button" onClick={() => { setTrackedOrder(null); setOrderCode(""); setTrackingMessage(""); }}>{t("Xóa bộ lọc", "Clear")}</button>}
                </div>
                {trackingMessage && <p role="status">{trackingMessage}</p>}
              </form>
              <div className="account-orders">
                {(trackedOrder ? [trackedOrder] : orders).map(order => (
                  <article key={order.id} className="account-order">
                    <div className="account-order-heading"><strong>{t("Mã đơn", "Order")} {order.id}</strong><span className={`account-order-status status-${order.status.toLowerCase()}`}>{{
                      PENDING: t("Đang xử lý", "Processing"),
                      PAID: t("Đã xác nhận", "Confirmed"),
                      SHIPPED: t("Đang giao", "Shipping"),
                      COMPLETED: t("Đã giao", "Delivered"),
                      CANCELLED: t("Đã hủy", "Cancelled"),
                    }[order.status]}</span></div>
                    <p>{new Date(order.createdAt).toLocaleDateString(profile.preferredLanguage === "vi" ? "vi-VN" : "en-US")} · {order.shippingAddress}</p>
                    {order.status === "CANCELLED" ? (
                      <p className="account-order-cancelled" role="status">{t("Đơn hàng đã bị hủy.", "This order was cancelled.")}</p>
                    ) : (
                      <ol className="account-order-tracking" aria-label={t("Tiến trình đơn hàng", "Order progress")}>
                        {[
                          t("Đã đặt hàng", "Order placed"),
                          t("Đang xử lý", "Processing"),
                          t("Đang giao hàng", "Shipping"),
                          t("Đã giao", "Delivered"),
                        ].map((step, index) => {
                          const currentStep = order.status === "SHIPPED" ? 2 : order.status === "COMPLETED" ? 3 : 1;
                          const completed = order.status === "COMPLETED" || index < currentStep;
                          return (
                            <li
                              key={step}
                              className={completed ? "is-complete" : index === currentStep ? "is-current" : ""}
                              aria-current={index === currentStep && order.status !== "COMPLETED" ? "step" : undefined}
                            >
                              <span>{index + 1}</span>{step}
                            </li>
                          );
                        })}
                      </ol>
                    )}
                    <ul>{order.items.map(item => <li key={`${order.id}-${item.variant.product.name}-${item.variant.size}`}>{item.variant.product.name} · {item.variant.size}{item.variant.color ? ` / ${item.variant.color}` : ""} × {item.quantity} <span>{new Intl.NumberFormat(profile.preferredLanguage === "vi" ? "vi-VN" : "en-US").format(item.price * item.quantity)} ₫</span></li>)}</ul>
                    <strong className="account-order-total">{t("Tổng cộng:", "Total:")} {new Intl.NumberFormat(profile.preferredLanguage === "vi" ? "vi-VN" : "en-US").format(order.totalAmount)} ₫</strong>
                    {order.status === "COMPLETED" && (
                      <Link className="account-receipt-link" href={`/orders/${encodeURIComponent(order.id)}/receipt`}>
                        {t("Xem / in biên lai", "View / print receipt")}
                      </Link>
                    )}
                  </article>
                ))}
                {(trackedOrder ? [trackedOrder] : orders).length === 0 && <p>{t("Bạn chưa có đơn hàng nào.", "You have no orders yet.")}</p>}
              </div>
            </section>
          )}

          {activeTab === "security" && (
            <section className="account-card">
              <p className="account-eyebrow">{t("BẢO MẬT", "SECURITY")}</p><h2>{t("Đổi mật khẩu", "Change password")}</h2>
              <form className="account-form account-security-form" onSubmit={changePassword}>
                <label className="account-wide">{t("Mật khẩu hiện tại", "Current password")}<input type="password" autoComplete="current-password" required value={passwordForm.currentPassword} onChange={event => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} /></label>
                <label>{t("Mật khẩu mới", "New password")}<input type="password" minLength={8} maxLength={128} autoComplete="new-password" required value={passwordForm.newPassword} onChange={event => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} /></label>
                <label>{t("Xác nhận mật khẩu mới", "Confirm new password")}<input type="password" minLength={8} maxLength={128} autoComplete="new-password" required value={passwordForm.confirmPassword} onChange={event => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} /></label>
                <button className="account-primary" type="submit" disabled={busy}>{t("Đổi mật khẩu", "Change password")}</button>
              </form>
              <p className="account-hint">{t("Quên mật khẩu?", "Forgot your password?")} <Link href="/forgot-password">{t("Gửi liên kết đặt lại qua email", "Email me a reset link")}</Link></p>
            </section>
          )}

          {activeTab === "settings" && (
            <section className="account-card">
              <p className="account-eyebrow">{t("TÙY CHỈNH", "PREFERENCES")}</p><h2>{t("Cài đặt tài khoản", "Account settings")}</h2>
              <div className="account-setting-row"><div><strong>{t("Giao diện", "Appearance")}</strong><p>{t("Chọn giao diện sáng hoặc tối trên thiết bị này.", "Choose light or dark appearance on this device.")}</p></div>
                <select value={theme} onChange={event => switchTheme(event.target.value as "light" | "dark")}><option value="light">{t("Sáng", "Light")}</option><option value="dark">{t("Tối", "Dark")}</option></select>
              </div>
              <div className="account-setting-row"><div><strong>{t("Ngôn ngữ", "Language")}</strong><p>{t("Ngôn ngữ ưu tiên cho tài khoản.", "Preferred language for your account.")}</p></div>
                <select disabled={busy} value={profile.preferredLanguage} onChange={event => void saveSettings({ preferredLanguage: event.target.value as "vi" | "en" })}><option value="vi">Tiếng Việt</option><option value="en">English</option></select>
              </div>
              <label className="account-setting-row account-setting-toggle"><span><strong>{t("Email khuyến mãi", "Promotional emails")}</strong><small>{t("Nhận thông tin ưu đãi và chương trình mới.", "Receive offers and news about new campaigns.")}</small></span><input type="checkbox" disabled={busy} checked={profile.allowMarketingEmails} onChange={event => void saveSettings({ allowMarketingEmails: event.target.checked })} /></label>
              <label className="account-setting-row account-setting-toggle"><span><strong>{t("Thông báo trạng thái đơn hàng", "Order status notifications")}</strong><small>{t("Nhận cập nhật khi trạng thái đơn thay đổi.", "Receive updates when your order status changes.")}</small></span><input type="checkbox" disabled={busy} checked={profile.orderStatusNotifications} onChange={event => void saveSettings({ orderStatusNotifications: event.target.checked })} /></label>
            </section>
          )}
          {activeTab === "admin" && profile.role === "ADMIN" && adminPanel && (
            <div className="account-card account-admin-card">{adminPanel}</div>
          )}
        </section>
      </div>
    </main>
  );
}
