"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { api, QueueItem, Conversation } from "@/lib/api";
import Link from "next/link";

interface AssignedConversation extends Conversation {
  summary?: string;
  summaryLoading?: boolean;
}

export default function DashboardPage() {
  const [queueSize, setQueueSize] = useState<number>(0);
  const [conversations, setConversations] = useState<AssignedConversation[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [queue, convs] = await Promise.all([
          api.get<QueueItem[]>("/admin/api/queue"),
          api.get<Conversation[]>("/admin/api/conversations"),
        ]);
        setQueueSize(queue.length);
        setConversations((prev) => {
          // Preserve existing summaries
          const summaryMap = new Map(prev.map(c => [c.conversation_id, c.summary]));
          return convs.map(c => ({
            ...c,
            summary: summaryMap.get(c.conversation_id),
          }));
        });
      } catch (e) {
        console.error(e);
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

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
      <div className="space-y-3">
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
    </ProtectedLayout>
  );
}
