"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminHeader({ name }: { name: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Không thể đăng xuất. Vui lòng thử lại.");
      router.replace("/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đăng xuất.");
      setLoggingOut(false);
    }
  }

  return (
    <header className="admin-topbar">
      <p>{name}</p>
      <div className="admin-topbar-actions">
        {error && <span className="admin-error" role="alert">{error}</span>}
        <a className="admin-button admin-button-secondary" href="/index.html">Quay lại cửa hàng</a>
        <button className="admin-button" type="button" onClick={logout} disabled={loggingOut}>
          {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
        </button>
      </div>
    </header>
  );
}
