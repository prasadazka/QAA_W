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
        <h2 className="text-xl font-bold text-gray-800">Escalation Queue</h2>
        <span className="text-sm text-gray-500">Auto-refreshes every 10s</span>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-10 text-center">
          <p className="text-gray-500 text-lg">No pending escalations</p>
          <p className="text-gray-400 text-sm mt-1">Queue is clear</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.conversation_id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <span className="text-xs text-gray-400">{item.phone}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        item.priority === "high" || item.priority === "urgent"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{item.last_message || "No message"}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>{item.ticket_number ? `Ticket #${item.ticket_number}` : "No ticket"}</span>
                    <span>Messages: {item.message_count}</span>
                    <span>{item.escalation_reason || "user_requested"}</span>
                    <span>{timeAgo(item.escalated_at || item.created_at)}</span>
                  </div>
                </div>
                <button
                  onClick={() => pick(item.conversation_id)}
                  disabled={picking === item.conversation_id}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition disabled:opacity-50"
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
