"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  fullName: string | null;
  email: string;
  role: "USER" | "ADMIN";
  isBlocked: boolean;
  createdAt: string;
};

export default function UserManager({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      try {
        const response = await fetch(`/api/admin/users?${params}`, { signal: controller.signal });
        const result: unknown = await response.json();
        if (!response.ok) {
          const error = result && typeof result === "object" && "error" in result && typeof result.error === "string"
            ? result.error
            : "Không thể tải danh sách người dùng.";
          throw new Error(error);
        }
        if (Array.isArray(result)) setUsers(result);
      } catch (error) {
        if (!controller.signal.aborted) {
          setMessage(error instanceof Error ? error.message : "Không thể tải danh sách người dùng.");
        }
      }
    }, 200);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search, roleFilter, statusFilter]);

  async function sendUserUpdate(user: User, changes: { role?: User["role"]; isBlocked?: boolean }) {
    setBusyId(user.id);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể cập nhật người dùng.");
      setUsers(current => current.map(item => item.id === user.id ? result : item));
      setMessage(`Đã cập nhật tài khoản ${user.email}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể cập nhật người dùng.");
    } finally {
      setBusyId(null);
    }
  }

  async function updateRole(user: User, role: User["role"]) {
    await sendUserUpdate(user, { role });
  }

  async function deleteUser(user: User) {
    if (!window.confirm(`Bạn có chắc muốn xóa tài khoản ${user.email}?`)) return;

    setBusyId(user.id);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể xóa tài khoản.");
      setUsers(current => current.filter(item => item.id !== user.id));
      setMessage(`Đã xóa tài khoản ${user.email}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể xóa tài khoản.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <p className="admin-status" role="status">{message}</p>
      <div className="admin-user-filters">
        <label>
          Tìm kiếm
          <input
            className="admin-control"
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Email hoặc họ tên"
          />
        </label>
        <label>
          Phân quyền
          <select className="admin-control" value={roleFilter} onChange={event => setRoleFilter(event.target.value)}>
            <option value="">Tất cả</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>
        <label>
          Trạng thái
          <select className="admin-control" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
            <option value="">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="blocked">Đang khóa</option>
          </select>
        </label>
      </div>
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr><th>ID</th><th>Họ tên</th><th>Email</th><th>Role</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td><code>{user.id}</code></td>
                <td>{user.fullName || "—"}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    className="admin-control"
                    aria-label={`Role của ${user.email}`}
                    value={user.role}
                    disabled={busyId === user.id}
                    onChange={event => updateRole(user, event.target.value as User["role"])}
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td>
                  <button
                    className={`admin-button ${user.isBlocked ? "admin-button-secondary" : "admin-button-danger"}`}
                    type="button"
                    disabled={busyId === user.id}
                    onClick={() => sendUserUpdate(user, { isBlocked: !user.isBlocked })}
                  >
                    {user.isBlocked ? "Mở khóa" : "Khóa"}
                  </button>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString("vi-VN")}</td>
                <td>
                  <button
                    className="admin-button admin-button-danger"
                    type="button"
                    disabled={busyId === user.id}
                    onClick={() => deleteUser(user)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={7}>Không tìm thấy tài khoản.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
