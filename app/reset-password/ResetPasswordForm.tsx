"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(token ? "" : "Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu token.");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Không thể đặt lại mật khẩu.");
      setMessage(result.message || "Mật khẩu đã được cập nhật.");
      setPassword("");
      setConfirmPassword("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đặt lại mật khẩu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="account-page">
      <section className="account-card account-login">
        <p className="account-eyebrow">BẢO MẬT TÀI KHOẢN</p>
        <h1>Đặt mật khẩu mới</h1>
        <form className="account-form" onSubmit={submit}>
          <label className="account-wide">Mật khẩu mới<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} /></label>
          <label className="account-wide">Xác nhận mật khẩu<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>
          <button className="account-primary" type="submit" disabled={busy || !token}>Đặt lại mật khẩu</button>
        </form>
        {message && <p className="account-alert account-success" role="status">{message}</p>}
        {error && <p className="account-alert account-error" role="alert">{error}</p>}
        <p><Link href="/index.html">Quay lại đăng nhập</Link></p>
      </section>
    </main>
  );
}
