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
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-qaa-navy-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </ProtectedLayout>
    );
  }

  const c = metrics.conversations;
  const t = metrics.tickets;

  return (
    <ProtectedLayout>
      <h2 className="text-xl font-bold text-qaa-navy-900 mb-6">Metrics</h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Conversations" value={c.total} />
        <StatCard label="Today" value={c.today} color="text-qaa-navy-500" />
        <StatCard label="This Week" value={c.this_week} color="text-qaa-navy-500" />
        <StatCard label="Total Escalated" value={c.total_escalated} color="text-qaa-gold-500" />
        <StatCard label="Queue Size" value={c.queue_size} color="text-red-600" />
        <StatCard label="Active Handling" value={c.active_handling} color="text-amber-600" />
        <StatCard label="Resolved" value={c.resolved} color="text-green-600" />
        <StatCard
          label="Escalation Rate"
          value={c.total > 0 ? `${((c.total_escalated / c.total) * 100).toFixed(1)}%` : "0%"}
          color="text-qaa-gold-500"
        />
      </div>

      {/* Ticket Stats */}
      <h3 className="text-lg font-semibold text-qaa-navy-900 mb-3">Ticket Performance (This Week)</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Tickets" value={t.total} />
        <StatCard label="Resolved" value={t.resolved} color="text-green-600" />
        <StatCard
          label="Avg First Response"
          value={t.avg_first_response_min ? `${t.avg_first_response_min}m` : "N/A"}
          color="text-qaa-navy-500"
        />
        <StatCard
          label="Avg Resolution"
          value={t.avg_resolution_min ? `${t.avg_resolution_min}m` : "N/A"}
          color="text-qaa-navy-500"
        />
      </div>

      {/* Top Intents */}
      <h3 className="text-lg font-semibold text-qaa-navy-900 mb-3">Top Intents (This Week)</h3>
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-8">
        {metrics.top_intents.length === 0 ? (
          <p className="text-gray-400 text-sm">No data yet</p>
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
                      className="bg-qaa-navy-500 rounded-full h-5 flex items-center justify-end px-2"
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
      <h3 className="text-lg font-semibold text-qaa-navy-900 mb-3">Agent Performance</h3>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-qaa-navy-50">
            <tr>
              <th className="text-left p-3 font-medium text-qaa-navy-700">Agent</th>
              <th className="text-left p-3 font-medium text-qaa-navy-700">Department</th>
              <th className="text-left p-3 font-medium text-qaa-navy-700">Status</th>
              <th className="text-center p-3 font-medium text-qaa-navy-700">Active</th>
              <th className="text-center p-3 font-medium text-qaa-navy-700">Tickets</th>
              <th className="text-center p-3 font-medium text-qaa-navy-700">Resolved</th>
              <th className="text-center p-3 font-medium text-qaa-navy-700">Avg Response</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a, i) => (
              <tr key={i} className="border-t border-gray-50">
                <td className="p-3">
                  <p className="font-medium text-qaa-navy-900">{a.name}</p>
                  <p className="text-xs text-gray-400">{a.email}</p>
                </td>
                <td className="p-3 text-gray-600">{a.department}</td>
                <td className="p-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      a.status === "online"
                        ? "bg-green-50 text-green-600"
                        : a.status === "busy"
                        ? "bg-amber-50 text-amber-600"
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
                <td colSpan={7} className="p-6 text-center text-gray-400">
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

function StatCard({
  label,
  value,
  color = "text-qaa-navy-900",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
    </div>
  );
}
