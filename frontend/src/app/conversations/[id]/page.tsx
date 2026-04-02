"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import { api, Message, ConversationDetail } from "@/lib/api";
import Link from "next/link";

export default function ViewConversationPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<(ConversationDetail & { agent_name?: string }) | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [d, m] = await Promise.all([
          api.get<ConversationDetail & { agent_name?: string }>(`/admin/api/conversations/${id}/full`),
          api.get<Message[]>(`/admin/api/conversations/${id}/messages`),
        ]);
        setDetail(d);
        setMessages(m);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [id]);

  if (!detail) {
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
      <div className="flex items-center gap-3 mb-6">
        <Link href="/conversations" className="text-gray-400 hover:text-qaa-navy-900">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-xl font-bold text-qaa-navy-900">Conversation History</h2>
      </div>

      <div className="flex gap-4">
        {/* Messages */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-qaa-navy-900">{detail.name} ({detail.phone})</h3>
            <p className="text-xs text-gray-500">{messages.length} messages | Status: {detail.status}</p>
          </div>
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto bg-qaa-navy-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.direction === "inbound" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[70%] rounded-xl px-4 py-2.5 ${
                  msg.direction === "inbound"
                    ? "bg-white border border-gray-200 text-gray-800"
                    : msg.ai_intent === "agent_reply"
                    ? "bg-qaa-navy-500 text-white"
                    : "bg-qaa-gold-100 text-qaa-navy-900 border border-qaa-gold-300"
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] opacity-60">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {msg.ai_intent && msg.direction === "outbound" && (
                      <span className="text-[10px] opacity-60">
                        {msg.ai_intent === "agent_reply" ? "Agent" : "Bot"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-center text-gray-400 py-8">No messages</p>
            )}
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="w-72 bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h3 className="font-semibold text-qaa-navy-900">Details</h3>
          <div className="space-y-3 text-sm">
            <InfoRow label="User" value={detail.name} />
            <InfoRow label="Phone" value={detail.phone} />
            <InfoRow label="Language" value={detail.user_language} />
            <InfoRow label="Student ID" value={detail.student_id || "N/A"} />
            <InfoRow label="Status" value={detail.status} />
            <InfoRow label="Agent" value={detail.agent_name || "Unassigned"} />
            <InfoRow label="Escalation" value={detail.escalation_reason || "None"} />
            <InfoRow label="Channel" value={detail.channel} />
            <InfoRow label="Created" value={new Date(detail.created_at).toLocaleString()} />
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-gray-400 text-xs">{label}</span>
      <p className="font-medium text-qaa-navy-900">{value || "-"}</p>
    </div>
  );
}
