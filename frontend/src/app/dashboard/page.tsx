"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { api, QueueItem, Conversation } from "@/lib/api";
import Link from "next/link";

export default function DashboardPage() {
  const [queueSize, setQueueSize] = useState<number>(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [queue, convs] = await Promise.all([
          api.get<QueueItem[]>("/admin/api/queue"),
          api.get<Conversation[]>("/admin/api/conversations"),
        ]);
        setQueueSize(queue.length);
        setConversations(convs);
      } catch (e) {
        console.error(e);
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ProtectedLayout>
      <h2 className="text-xl font-bold text-qaa-navy-900 mb-6">Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Escalation Queue</p>
          <p className="text-3xl font-bold text-qaa-gold-500 mt-1">{queueSize}</p>
          <Link href="/queue" className="text-sm text-qaa-navy-500 hover:underline mt-2 inline-block">
            View queue
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500">My Active Chats</p>
          <p className="text-3xl font-bold text-qaa-navy-500 mt-1">{conversations.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Status</p>
          <p className="text-lg font-semibold text-green-600 mt-1">Online</p>
        </div>
      </div>

      {/* My Active Conversations */}
      <h3 className="text-lg font-semibold text-qaa-navy-900 mb-3">My Active Conversations</h3>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {conversations.length === 0 ? (
          <p className="p-6 text-gray-500 text-center">
            No active conversations. Pick one from the queue.
          </p>
        ) : (
          conversations.map((c) => (
            <Link
              key={c.conversation_id}
              href={`/conversation/${c.conversation_id}`}
              className="block p-4 border-b border-gray-50 hover:bg-qaa-navy-50 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-qaa-navy-900">
                    {c.name} ({c.phone})
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{c.last_message}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      c.priority === "high" || c.priority === "urgent"
                        ? "bg-red-50 text-red-600"
                        : "bg-qaa-gold-100 text-qaa-gold-500"
                    }`}
                  >
                    {c.priority}
                  </span>
                  {c.ticket_number && (
                    <p className="text-xs text-gray-400 mt-1">#{c.ticket_number}</p>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </ProtectedLayout>
  );
}
