"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import "../account/account.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Không thể gửi yêu cầu.");
      setMessage(result.message);
      if (result.resetToken) {
        setMessage(`${result.message} Token kiểm thử: ${result.resetToken}`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể gửi yêu cầu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="account-page">
      <section className="account-card account-login">
        <p className="account-eyebrow">BẢO MẬT TÀI KHOẢN</p>
        <h1>Quên mật khẩu?</h1>
        <p>Nhập email tài khoản. Nếu tài khoản tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.</p>
        <form className="account-form" onSubmit={submit}>
          <label className="account-wide">Email<input type="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} /></label>
          <button className="account-primary" type="submit" disabled={busy}>Gửi hướng dẫn</button>
        </form>
        {message && <p className="account-alert account-success" role="status">{message}</p>}
        {error && <p className="account-alert account-error" role="alert">{error}</p>}
        <p><Link href="/account">Quay lại tài khoản</Link></p>
      </section>
    </main>
  );
}
