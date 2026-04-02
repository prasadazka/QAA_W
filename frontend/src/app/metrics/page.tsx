"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { api, Metrics, AgentMetric } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function MetricsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [agents, setAgents] = useState<AgentMetric[]>([]);

  useEffect(() => {
    if (user && !["admin", "supervisor"].includes(user.role)) {
      router.push("/dashboard");
      return;
    }

    const load = async () => {
      try {
        const [m, a] = await Promise.all([
          api.get<Metrics>("/admin/api/metrics"),
          api.get<AgentMetric[]>("/admin/api/metrics/agents"),
        ]);
        setMetrics(m);
        setAgents(a);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [user, router]);

  if (!metrics) {
    return (
      <ProtectedLayout>
        <p className="text-gray-500">Loading metrics...</p>
      </ProtectedLayout>
    );
  }

  const c = metrics.conversations;
  const t = metrics.tickets;

  return (
    <ProtectedLayout>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Metrics</h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card label="Total Conversations" value={c.total} />
        <Card label="Today" value={c.today} color="text-blue-600" />
        <Card label="This Week" value={c.this_week} color="text-blue-600" />
        <Card label="Total Escalated" value={c.total_escalated} color="text-orange-600" />
        <Card label="Queue Size" value={c.queue_size} color="text-red-600" />
        <Card label="Active Handling" value={c.active_handling} color="text-yellow-600" />
        <Card label="Resolved" value={c.resolved} color="text-green-600" />
        <Card
          label="Escalation Rate"
          value={c.total > 0 ? `${((c.total_escalated / c.total) * 100).toFixed(1)}%` : "0%"}
          color="text-orange-600"
        />
      </div>

      {/* Ticket Stats */}
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Ticket Performance (This Week)</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card label="Total Tickets" value={t.total} />
        <Card label="Resolved" value={t.resolved} color="text-green-600" />
        <Card
          label="Avg First Response"
          value={t.avg_first_response_min ? `${t.avg_first_response_min}m` : "N/A"}
          color="text-blue-600"
        />
        <Card
          label="Avg Resolution"
          value={t.avg_resolution_min ? `${t.avg_resolution_min}m` : "N/A"}
          color="text-blue-600"
        />
      </div>

      {/* Top Intents */}
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Top Intents (This Week)</h3>
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        {metrics.top_intents.length === 0 ? (
          <p className="text-gray-500 text-sm">No data yet</p>
        ) : (
          <div className="space-y-2">
            {metrics.top_intents.map((item) => {
              const max = metrics.top_intents[0].count;
              const width = max > 0 ? (item.count / max) * 100 : 0;
              return (
                <div key={item.intent} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-36 truncate">{item.intent}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5">
                    <div
                      className="bg-blue-500 rounded-full h-5 flex items-center justify-end px-2"
                      style={{ width: `${Math.max(width, 5)}%` }}
                    >
                      <span className="text-[10px] text-white font-medium">{item.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Agent Performance */}
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Agent Performance</h3>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium text-gray-600">Agent</th>
              <th className="text-left p-3 font-medium text-gray-600">Department</th>
              <th className="text-left p-3 font-medium text-gray-600">Status</th>
              <th className="text-center p-3 font-medium text-gray-600">Active</th>
              <th className="text-center p-3 font-medium text-gray-600">Tickets</th>
              <th className="text-center p-3 font-medium text-gray-600">Resolved</th>
              <th className="text-center p-3 font-medium text-gray-600">Avg Response</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a, i) => (
              <tr key={i} className="border-t">
                <td className="p-3">
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs text-gray-400">{a.email}</p>
                </td>
                <td className="p-3 text-gray-600">{a.department}</td>
                <td className="p-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      a.status === "online"
                        ? "bg-green-100 text-green-700"
                        : a.status === "busy"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="p-3 text-center">{a.active_chats}</td>
                <td className="p-3 text-center">{a.total_tickets}</td>
                <td className="p-3 text-center text-green-600">{a.resolved}</td>
                <td className="p-3 text-center">
                  {a.avg_response_min ? `${a.avg_response_min}m` : "N/A"}
                </td>
              </tr>
            ))}
            {agents.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  No agents found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ProtectedLayout>
  );
}

function Card({
  label,
  value,
  color = "text-gray-800",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
