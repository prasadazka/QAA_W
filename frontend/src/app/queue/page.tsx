"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import { api, QueueItem } from "@/lib/api";

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

export default function QueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [picking, setPicking] = useState<string | null>(null);
  const router = useRouter();

  const load = async () => {
    try {
      setItems(await api.get<QueueItem[]>("/admin/api/queue"));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const pick = async (id: string) => {
    setPicking(id);
    try {
      await api.post(`/admin/api/conversations/${id}/pick`);
      router.push(`/conversation/${id}`);
    } catch (e) {
      alert("Could not pick conversation: " + (e as Error).message);
      setPicking(null);
      load();
    }
  };

  return (
    <ProtectedLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-qaa-navy-900">Escalation Queue</h2>
        <span className="text-xs text-gray-400 bg-white px-3 py-1.5 rounded-full border border-gray-100">
          Auto-refreshes every 10s
        </span>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-qaa-navy-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-qaa-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg font-medium">No pending escalations</p>
          <p className="text-gray-400 text-sm mt-1">Queue is clear</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.conversation_id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-qaa-navy-900">{item.name}</p>
                    <span className="text-xs text-gray-400">{item.phone}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.priority === "high" || item.priority === "urgent"
                          ? "bg-red-50 text-red-600"
                          : "bg-qaa-gold-100 text-qaa-gold-500"
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{item.last_message || "No message"}</p>
                  <div className="flex gap-4 mt-3 text-xs text-gray-400">
                    <span>{item.ticket_number ? `Ticket #${item.ticket_number}` : "No ticket"}</span>
                    <span>{item.message_count} messages</span>
                    <span>{item.escalation_reason || "user_requested"}</span>
                    <span>{timeAgo(item.escalated_at || item.created_at)}</span>
                  </div>
                </div>
                <button
                  onClick={() => pick(item.conversation_id)}
                  disabled={picking === item.conversation_id}
                  className="ml-4 px-5 py-2.5 bg-qaa-navy-900 text-white text-sm font-medium rounded-lg hover:bg-qaa-navy-800 transition disabled:opacity-50"
                >
                  {picking === item.conversation_id ? "Picking..." : "Pick"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ProtectedLayout>
  );
}
