import { prisma } from "../../../lib/prisma";
import UserManager from "./UserManager";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <header className="admin-page-heading">
        <div><p className="admin-muted">KCJ STORE / QUẢN LÝ</p><h1>Người dùng</h1></div>
      </header>
      <UserManager initialUsers={users.map(user => ({ ...user, createdAt: user.createdAt.toISOString() }))} />
    </>
  );
}
