"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/products", label: "Quản lý sản phẩm" },
  { href: "/admin/orders", label: "Quản lý đơn hàng" },
  { href: "/admin/users", label: "Quản lý người dùng" },
];

export default function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Quản trị">
      {links.map(link => {
        const active = link.href === "/admin"
          ? pathname === "/admin"
          : pathname.startsWith(link.href);
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
