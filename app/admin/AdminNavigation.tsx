"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/account?tab=admin", adminPath: "/admin", label: "Tổng quan" },
  { href: "/account?tab=admin&section=products", adminPath: "/admin/products", label: "Quản lý sản phẩm" },
  { href: "/account?tab=admin&section=banners", adminPath: "/admin/banners", label: "Banner & khuyến mãi" },
  { href: "/account?tab=admin&section=orders", adminPath: "/admin/orders", label: "Quản lý đơn hàng" },
  { href: "/account?tab=admin&section=users", adminPath: "/admin/users", label: "Quản lý người dùng" },
];

export default function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Quản trị">
      {links.map(link => {
        const active = link.adminPath === "/admin"
          ? pathname === "/admin"
          : pathname.startsWith(link.adminPath);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={active ? "is-active" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
