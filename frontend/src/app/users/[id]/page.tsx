"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import { api, AdminUser } from "@/lib/api";
import Link from "next/link";

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [userData, setUserData] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "", department: "", max_concurrent_chats: 5, password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const u = await api.get<AdminUser>(`/admin/api/users/${id}`);
        setUserData(u);
        setForm({
          name: u.name, email: u.email, role: u.role,
          department: u.department || "registration",
          max_concurrent_chats: u.max_concurrent_chats,
          password: "",
        });
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name, email: form.email, role: form.role,
        department: form.department, max_concurrent_chats: form.max_concurrent_chats,
      };
      if (form.password) body.password = form.password;
      await api.put(`/admin/api/users/${id}`, body);
      router.push("/users");
    } catch (err) {
      setError((err as Error).message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (!userData) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-qaa-navy-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/users" className="text-gray-400 hover:text-qaa-navy-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h2 className="text-xl font-bold text-qaa-navy-900">Edit User</h2>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-qaa-navy-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-qaa-navy-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
            <input type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-qaa-navy-500"
              placeholder="Enter new password" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="agent">Agent</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="registration">Registration</option>
                <option value="student_affairs">Student Affairs</option>
                <option value="finance">Finance</option>
                <option value="it_support">IT Support</option>
                <option value="training">Training</option>
                <option value="administration">Administration</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Concurrent Chats</label>
            <input type="number" value={form.max_concurrent_chats} min={1} max={20}
              onChange={(e) => setForm({ ...form, max_concurrent_chats: parseInt(e.target.value) || 5 })}
              className="w-32 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-qaa-navy-500" />
          </div>

          {/* User stats */}
          <div className="bg-qaa-navy-50 rounded-lg p-4 text-sm">
            <p className="text-gray-500">Active chats: <span className="font-medium text-qaa-navy-900">{userData.active_chats}</span></p>
            <p className="text-gray-500">Status: <span className="font-medium text-qaa-navy-900">{userData.status || "offline"}</span></p>
            <p className="text-gray-500">Last active: <span className="font-medium text-qaa-navy-900">{userData.last_active_at ? new Date(userData.last_active_at).toLocaleString() : "Never"}</span></p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="px-6 py-2 bg-qaa-navy-900 text-white text-sm font-medium rounded-lg hover:bg-qaa-navy-800 transition disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <Link href="/users" className="px-6 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50">Cancel</Link>
          </div>
        </form>
      </div>
    </ProtectedLayout>
  );
}
