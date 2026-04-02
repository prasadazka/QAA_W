"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { api, ActivityLog, ActivityListResponse } from "@/lib/api";

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");

  const load = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "30" });
      if (actionFilter) params.set("action", actionFilter);
      const res = await api.get<ActivityListResponse>(`/admin/api/activity?${params}`);
      setLogs(res.logs);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, [page, actionFilter]);

  const totalPages = Math.ceil(total / 30);

  const actionLabel = (action: string) => {
    const labels: Record<string, string> = {
      resolve_conversation: "Resolved Conversation",
      create_user: "Created User",
      update_user: "Updated User",
      delete_user: "Deactivated User",
      update_settings: "Updated Settings",
    };
    return labels[action] || action.replace(/_/g, " ");
  };

  return (
    <ProtectedLayout>
      <h2 className="text-xl font-bold text-qaa-navy-900 mb-6">Activity Log</h2>

      <div className="flex gap-3 mb-4">
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">All Actions</option>
          <option value="resolve_conversation">Resolve Conversation</option>
          <option value="create_user">Create User</option>
          <option value="update_user">Update User</option>
          <option value="delete_user">Delete User</option>
          <option value="update_settings">Update Settings</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-qaa-navy-50">
            <tr>
              <th className="text-left p-3 font-medium text-qaa-navy-700">Timestamp</th>
              <th className="text-left p-3 font-medium text-qaa-navy-700">User</th>
              <th className="text-left p-3 font-medium text-qaa-navy-700">Action</th>
              <th className="text-left p-3 font-medium text-qaa-navy-700">Entity</th>
              <th className="text-left p-3 font-medium text-qaa-navy-700">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-gray-50">
                <td className="p-3 text-xs text-gray-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="p-3">
                  <p className="font-medium text-qaa-navy-900">{log.agent_name}</p>
                  <p className="text-xs text-gray-400">{log.agent_email}</p>
                </td>
                <td className="p-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-qaa-navy-100 text-qaa-navy-700 font-medium">
                    {actionLabel(log.action)}
                  </span>
                </td>
                <td className="p-3 text-gray-500 text-xs">
                  {log.entity_type}{log.entity_id ? ` #${log.entity_id.slice(0, 8)}` : ""}
                </td>
                <td className="p-3 text-xs text-gray-400 max-w-xs truncate">
                  {Object.keys(log.details).length > 0 ? JSON.stringify(log.details).slice(0, 80) : "-"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-400">No activity logs found</td></tr>
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
