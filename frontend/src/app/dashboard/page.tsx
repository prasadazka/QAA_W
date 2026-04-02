"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import { useAuth } from "@/lib/auth";
import { api, QueueItem, Conversation, AgentMetric } from "@/lib/api";
import Link from "next/link";

interface AssignedConversation extends Conversation {
  summary?: string;
  summaryLoading?: boolean;
}

interface MyStats {
  active_chats: number;
  total_tickets: number;
  resolved: number;
  avg_response_min: number | null;
  total_conversations_handled: number;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [conversations, setConversations] = useState<AssignedConversation[]>([]);
  const [agents, setAgents] = useState<AgentMetric[]>([]);
  const [myStats, setMyStats] = useState<MyStats | null>(null);
  const [picking, setPicking] = useState<string | null>(null);

  const isAdminOrSup = user?.role === "admin" || user?.role === "supervisor";

  useEffect(() => {
    const load = async () => {
      try {
        const [q, convs, stats] = await Promise.all([
          api.get<QueueItem[]>("/admin/api/queue"),
          api.get<Conversation[]>("/admin/api/conversations"),
          api.get<MyStats>("/admin/api/me/stats").catch(() => null),
        ]);
        setQueue(q);
        setMyStats(stats);
        setConversations((prev) => {
          const summaryMap = new Map(prev.map(c => [c.conversation_id, c.summary]));
          return convs.map(c => ({
            ...c,
            summary: summaryMap.get(c.conversation_id),
          }));
        });

        if (isAdminOrSup) {
          api.get<AgentMetric[]>("/admin/api/metrics/agents")
            .then(setAgents)
            .catch(() => {});
        }
      } catch (e) {
        console.error(e);
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [isAdminOrSup]);

  const loadSummary = async (convId: string) => {
    setConversations(prev => prev.map(c =>
      c.conversation_id === convId ? { ...c, summaryLoading: true } : c
    ));
    try {
      const res = await api.get<{ summary: string }>(`/admin/api/conversations/${convId}/summary`);
      setConversations(prev => prev.map(c =>
        c.conversation_id === convId ? { ...c, summary: res.summary, summaryLoading: false } : c
      ));
    } catch {
      setConversations(prev => prev.map(c =>
        c.conversation_id === convId ? { ...c, summaryLoading: false } : c
      ));
    }
  };

  const pick = async (id: string) => {
    setPicking(id);
    try {
      await api.post(`/admin/api/conversations/${id}/pick`);
      router.push(`/conversation/${id}`);
    } catch (e) {
      alert("Could not pick: " + (e as Error).message);
      setPicking(null);
    }
  };

  return (
    <ProtectedLayout>
      <h2 className="text-xl font-bold text-qaa-navy-900 mb-6">Dashboard</h2>

      {/* Personal Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Queue</p>
          <p className="text-3xl font-bold text-qaa-gold-500 mt-1">{queue.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500">My Active Chats</p>
          <p className="text-3xl font-bold text-qaa-navy-500 mt-1">{myStats?.active_chats ?? conversations.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500">My Tickets</p>
          <p className="text-3xl font-bold text-qaa-navy-700 mt-1">{myStats?.total_tickets ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500">My Resolved</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{myStats?.resolved ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Avg Response</p>
          <p className="text-3xl font-bold text-qaa-navy-600 mt-1">
            {myStats?.avg_response_min !== null && myStats?.avg_response_min !== undefined
              ? `${myStats.avg_response_min}m`
              : "—"}
          </p>
        </div>
      </div>

      {/* Escalation Queue (inline) */}
      {queue.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-semibold text-qaa-navy-900">Escalation Queue</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">{queue.length}</span>
          </div>
          <div className="space-y-3 mb-8">
            {queue.map((item) => (
              <div key={item.conversation_id} className="bg-white rounded-xl border border-orange-100 p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-qaa-navy-900">{item.name}</p>
                      <span className="text-xs text-gray-400">{item.phone}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.priority === "high" || item.priority === "urgent"
                          ? "bg-red-50 text-red-600"
                          : "bg-qaa-gold-100 text-qaa-gold-500"
                      }`}>
                        {item.priority}
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(item.escalated_at || item.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">{item.last_message || "No message"}</p>
                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                      <span>{item.ticket_number ? `#${item.ticket_number}` : "No ticket"}</span>
                      <span>{item.message_count} msgs</span>
                      <span>{item.escalation_reason || "user_requested"}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => pick(item.conversation_id)}
                    disabled={picking === item.conversation_id}
                    className="ml-4 px-5 py-2 bg-qaa-gold-500 text-white text-sm font-medium rounded-lg hover:bg-qaa-gold-400 transition disabled:opacity-50"
                  >
                    {picking === item.conversation_id ? "Picking..." : "Pick Up"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* My Active Conversations */}
      <h3 className="text-lg font-semibold text-qaa-navy-900 mb-3">My Active Conversations</h3>
      <div className="space-y-3 mb-8">
        {conversations.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
            <p className="text-gray-500">No active conversations. New escalations will be auto-assigned to you.</p>
          </div>
        ) : (
          conversations.map((c) => (
            <div key={c.conversation_id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-4 flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-qaa-navy-900">{c.name}</p>
                    <span className="text-xs text-gray-400">{c.phone}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.priority === "high" || c.priority === "urgent"
                        ? "bg-red-50 text-red-600"
                        : "bg-qaa-gold-100 text-qaa-gold-500"
                    }`}>
                      {c.priority}
                    </span>
                    {c.ticket_number && (
                      <span className="text-xs text-gray-400">#{c.ticket_number}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{c.last_message}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  {!c.summary && (
                    <button
                      type="button"
                      onClick={() => loadSummary(c.conversation_id)}
                      disabled={c.summaryLoading}
                      className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      {c.summaryLoading ? "Loading..." : "AI Summary"}
                    </button>
                  )}
                  <Link
                    href={`/conversation/${c.conversation_id}`}
                    className="px-4 py-1.5 bg-qaa-navy-900 text-white text-xs font-medium rounded-lg hover:bg-qaa-navy-800 transition"
                  >
                    Open Chat
                  </Link>
                </div>
              </div>

              {/* AI Context Summary */}
              {c.summary && (
                <div className="px-4 pb-4">
                  <div className="bg-qaa-navy-50 rounded-lg p-3 border border-qaa-navy-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <svg className="w-4 h-4 text-qaa-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                      </svg>
                      <span className="text-xs font-semibold text-qaa-navy-700">AI Context Summary</span>
                    </div>
                    <p className="text-sm text-qaa-navy-800 leading-relaxed">{c.summary}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Agent Performance — admin/supervisor only */}
      {isAdminOrSup && agents.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-qaa-navy-900 mb-3">Agent Performance</h3>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-qaa-navy-50 text-left">
                  <th className="px-4 py-3 font-semibold text-qaa-navy-700">Agent</th>
                  <th className="px-4 py-3 font-semibold text-qaa-navy-700">Department</th>
                  <th className="px-4 py-3 font-semibold text-qaa-navy-700 text-center">Status</th>
                  <th className="px-4 py-3 font-semibold text-qaa-navy-700 text-center">Active Chats</th>
                  <th className="px-4 py-3 font-semibold text-qaa-navy-700 text-center">Tickets</th>
                  <th className="px-4 py-3 font-semibold text-qaa-navy-700 text-center">Resolved</th>
                  <th className="px-4 py-3 font-semibold text-qaa-navy-700 text-center">Avg Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {agents.map((a) => (
                  <tr key={a.email} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-qaa-navy-900">{a.name}</p>
                      <p className="text-xs text-gray-400">{a.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{a.department}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        a.status === "online"
                          ? "bg-green-50 text-green-600"
                          : a.status === "busy"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-qaa-navy-700">{a.active_chats}</td>
                    <td className="px-4 py-3 text-center font-medium text-qaa-navy-700">{a.total_tickets}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium text-green-600">{a.resolved}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {a.avg_response_min !== null ? `${a.avg_response_min}m` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </ProtectedLayout>
  );
}
