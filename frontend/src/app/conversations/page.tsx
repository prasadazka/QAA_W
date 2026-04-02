"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { api, AllConversation, ConversationListResponse } from "@/lib/api";
import Link from "next/link";

export default function AllConversationsPage() {
  const [conversations, setConversations] = useState<AllConversation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await api.get<ConversationListResponse>(`/admin/api/conversations/all?${params}`);
      setConversations(res.conversations);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const totalPages = Math.ceil(total / 20);

  const statusColor = (s: string) => {
    switch (s) {
      case "active": return "bg-blue-50 text-blue-600";
      case "waiting_agent": return "bg-qaa-gold-100 text-qaa-gold-500";
      case "agent_handling": return "bg-purple-50 text-purple-600";
      case "resolved": return "bg-green-50 text-green-600";
      default: return "bg-gray-100 text-gray-500";
    }
  };

  return (
    <ProtectedLayout>
      <h2 className="text-xl font-bold text-qaa-navy-900 mb-6">All Conversations</h2>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex-1">
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by phone or name..."
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-qaa-navy-500 bg-white"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="waiting_agent">Waiting Agent</option>
          <option value="agent_handling">Agent Handling</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-qaa-navy-50">
            <tr>
              <th className="text-left p-3 font-medium text-qaa-navy-700">User</th>
              <th className="text-left p-3 font-medium text-qaa-navy-700">Status</th>
              <th className="text-left p-3 font-medium text-qaa-navy-700">Agent</th>
              <th className="text-center p-3 font-medium text-qaa-navy-700">Messages</th>
              <th className="text-left p-3 font-medium text-qaa-navy-700">Escalation</th>
              <th className="text-left p-3 font-medium text-qaa-navy-700">Created</th>
              <th className="text-right p-3 font-medium text-qaa-navy-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((c) => (
              <tr key={c.conversation_id} className="border-t border-gray-50">
                <td className="p-3">
                  <p className="font-medium text-qaa-navy-900">{c.user_name}</p>
                  <p className="text-xs text-gray-400">{c.phone}</p>
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(c.status)}`}>
                    {c.status.replace("_", " ")}
                  </span>
                </td>
                <td className="p-3 text-gray-600">{c.agent_name || "-"}</td>
                <td className="p-3 text-center">{c.message_count}</td>
                <td className="p-3 text-gray-500 text-xs">{c.escalation_reason || "-"}</td>
                <td className="p-3 text-gray-500 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                <td className="p-3 text-right">
                  <Link href={`/conversations/${c.conversation_id}`}
                    className="text-qaa-navy-500 hover:underline text-xs">View</Link>
                </td>
              </tr>
            ))}
            {conversations.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-gray-400">No conversations found</td></tr>
            )}
          </tbody>
        </table>
      </div>

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
