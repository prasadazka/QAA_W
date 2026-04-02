"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import { api, AdminUser, UserListResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [user, router]);

  const load = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "20" });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      const res = await api.get<UserListResponse>(`/admin/api/users?${params}`);
      setUsers(res.users);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, [page, roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Deactivate user "${name}"? They will lose access.`)) return;
    setDeleting(userId);
    try {
      await api.delete(`/admin/api/users/${userId}`);
      load();
    } catch (e) {
      alert("Failed: " + (e as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <ProtectedLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-qaa-navy-900">Users & Agents</h2>
        <Link
          href="/users/new"
          className="px-4 py-2 bg-qaa-navy-900 text-white text-sm font-medium rounded-lg hover:bg-qaa-navy-800 transition"
        >
          + Create User
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-qaa-navy-500 bg-white"
          />
        </form>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="supervisor">Supervisor</option>
          <option value="agent">Agent</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-qaa-navy-50">
            <tr>
              <th className="text-left p-3 font-medium text-qaa-navy-700">Name</th>
              <th className="text-left p-3 font-medium text-qaa-navy-700">Role</th>
              <th className="text-left p-3 font-medium text-qaa-navy-700">Department</th>
              <th className="text-left p-3 font-medium text-qaa-navy-700">Status</th>
              <th className="text-center p-3 font-medium text-qaa-navy-700">Active Chats</th>
              <th className="text-right p-3 font-medium text-qaa-navy-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id} className="border-t border-gray-50">
                <td className="p-3">
                  <p className="font-medium text-qaa-navy-900">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    u.role === "admin" ? "bg-purple-50 text-purple-600"
                    : u.role === "supervisor" ? "bg-qaa-navy-100 text-qaa-navy-600"
                    : "bg-gray-100 text-gray-600"
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3 text-gray-600">{u.department || "-"}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    u.status === "online" ? "bg-green-50 text-green-600"
                    : u.status === "busy" ? "bg-amber-50 text-amber-600"
                    : "bg-gray-100 text-gray-500"
                  }`}>
                    {u.status || "offline"}
                  </span>
                </td>
                <td className="p-3 text-center">{u.active_chats}</td>
                <td className="p-3 text-right space-x-2">
                  <Link href={`/users/${u.user_id}`} className="text-qaa-navy-500 hover:underline text-xs">
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(u.user_id, u.name)}
                    disabled={deleting === u.user_id}
                    className="text-red-500 hover:underline text-xs disabled:opacity-50"
                  >
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-400">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50">Prev</button>
          <span className="px-3 py-1 text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50">Next</button>
        </div>
      )}
    </ProtectedLayout>
  );
}
