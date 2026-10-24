import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getAdminUser } from "../../lib/auth";
import AdminHeader from "./AdminHeader";
import AdminNavigation from "./AdminNavigation";
import "./admin.css";

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const admin = await getAdminUser();
  if (!admin) redirect("/");

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">KCJ<span>.</span></Link>
        <p className="admin-caption">QUẢN TRỊ CỬA HÀNG</p>
        <AdminNavigation />
      </aside>
      <div className="admin-main">
        <AdminHeader name={admin.fullName || admin.email} />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
