"use client";

import { useState } from "react";

type User = {
  id: string;
  fullName: string | null;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
};

export default function UserManager({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateRole(user: User, role: User["role"]) {
    setBusyId(user.id);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể cập nhật quyền.");
      setUsers(current => current.map(item => item.id === user.id ? result : item));
      setMessage(`Đã cập nhật quyền cho ${user.email}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể cập nhật quyền.");
    } finally {
      setBusyId(null);
    }
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
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr><th>ID</th><th>Họ tên</th><th>Email</th><th>Role</th><th>Ngày tạo</th><th>Thao tác</th></tr>
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
            {users.length === 0 && <tr><td colSpan={6}>Chưa có tài khoản.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
