"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import { api, Message, ConversationDetail } from "@/lib/api";
import Link from "next/link";

interface AvailableAgent {
  agent_id: string;
  name: string;
  email: string;
  department: string;
  status: string;
  active_chats: number;
  max_concurrent_chats: number;
  has_capacity: boolean;
}

// Render interactive message placeholders as styled tags
function MessageContent({ content }: { content: string }) {
  const menuMatch = content.match(/^\[(.+?)\s*menu\]$/i);
  if (menuMatch) {
    return (
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
        <span className="text-sm italic opacity-80">Sent {menuMatch[1]} menu</span>
      </div>
    );
  }
  if (content === "[interactive]") {
    return (
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
        <span className="text-sm italic opacity-80">Sent interactive message</span>
      </div>
    );
  }
  return <p className="text-sm whitespace-pre-wrap">{content}</p>;
}

export default function ViewConversationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<(ConversationDetail & { agent_name?: string }) | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const lastTimestamp = useRef<string>("");

  // Transfer state
  const [showTransfer, setShowTransfer] = useState(false);
  const [agents, setAgents] = useState<AvailableAgent[]>([]);
  const [transferTarget, setTransferTarget] = useState("");
  const [transferring, setTransferring] = useState(false);

  // AI Summary state
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const isActive = detail?.status === "agent_handling" || detail?.status === "waiting_agent";

  const scrollToBottom = () => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  };

  const loadMessages = useCallback(async () => {
    try {
      if (lastTimestamp.current) {
        const newMsgs = await api.get<Message[]>(
          `/admin/api/conversations/${id}/messages?after=${encodeURIComponent(lastTimestamp.current)}`
        );
        if (newMsgs.length > 0) {
          setMessages((prev) => [...prev, ...newMsgs]);
          lastTimestamp.current = newMsgs[newMsgs.length - 1].created_at;
          setTimeout(scrollToBottom, 100);
        }
      } else {
        const allMsgs = await api.get<Message[]>(`/admin/api/conversations/${id}/messages`);
        setMessages(allMsgs);
        if (allMsgs.length > 0) {
          lastTimestamp.current = allMsgs[allMsgs.length - 1].created_at;
        }
        setTimeout(scrollToBottom, 100);
      }
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const d = await api.get<ConversationDetail & { agent_name?: string }>(`/admin/api/conversations/${id}/full`);
        setDetail(d);
      } catch (e) {
        console.error(e);
      }
    };
    loadDetail();
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [id, loadMessages]);

  // Load AI summary for escalated conversations
  useEffect(() => {
    if (!detail || !isActive) return;
    setSummaryLoading(true);
    api.get<{ summary: string }>(`/admin/api/conversations/${id}/summary`)
      .then((res) => setSummary(res.summary))
      .catch(() => {})
      .finally(() => setSummaryLoading(false));
  }, [id, detail, isActive]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || sending) return;
    setSending(true);

    const optimistic: Message = {
      id: "temp-" + Date.now(),
      direction: "outbound",
      type: "text",
      content: reply,
      ai_intent: "agent_reply",
      ai_confidence: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setReply("");
    setTimeout(scrollToBottom, 50);

    try {
      await api.post(`/admin/api/conversations/${id}/reply`, { message: reply });
    } catch (e) {
      alert("Failed to send: " + (e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!confirm("Resolve this conversation? The bot will resume for this user.")) return;
    setResolving(true);
    try {
      await api.post(`/admin/api/conversations/${id}/resolve`, { notes: "" });
      router.push("/dashboard");
    } catch (e) {
      alert("Failed to resolve: " + (e as Error).message);
      setResolving(false);
    }
  };

  const openTransferModal = async () => {
    setShowTransfer(true);
    try {
      const res = await api.get<{ agents: AvailableAgent[] }>(`/admin/api/agents/available?conversation_id=${id}`);
      setAgents(res.agents);
    } catch {
      setAgents([]);
    }
  };

  const handleTransfer = async () => {
    if (!transferTarget) return;
    setTransferring(true);
    try {
      await api.post(`/admin/api/conversations/${id}/transfer`, { target_agent_id: transferTarget });
      router.push("/dashboard");
    } catch (e) {
      alert("Transfer failed: " + (e as Error).message);
      setTransferring(false);
    }
  };

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
      <div className="flex items-center gap-3 mb-4">
        <Link href="/conversations" className="text-gray-400 hover:text-qaa-navy-900">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-xl font-bold text-qaa-navy-900">
          {isActive ? "Live Conversation" : "Conversation History"}
        </h2>
        {isActive && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">Live</span>
        )}
      </div>

      <div className="flex gap-4 h-[calc(100vh-7rem)]">
        {/* Chat Panel */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-qaa-navy-900">
                {detail.name}{" "}
                <span className="text-sm font-normal text-gray-400">{detail.phone}</span>
              </h3>
              <p className="text-xs text-gray-500">
                {detail.status} | {messages.length} messages
              </p>
            </div>
            {isActive && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={openTransferModal}
                  className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Transfer
                </button>
                <button
                  type="button"
                  onClick={handleResolve}
                  disabled={resolving}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {resolving ? "Resolving..." : "Resolve"}
                </button>
              </div>
            )}
          </div>

          {/* AI Context Summary Banner */}
          {isActive && (summary || summaryLoading) && (
            <div className="px-4 pt-3">
              <div className="bg-qaa-navy-50 rounded-lg p-3 border border-qaa-navy-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <svg className="w-4 h-4 text-qaa-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                  <span className="text-xs font-semibold text-qaa-navy-700">AI Context Summary</span>
                </div>
                {summaryLoading ? (
                  <p className="text-sm text-gray-400 italic">Generating summary...</p>
                ) : (
                  <p className="text-sm text-qaa-navy-800 leading-relaxed">{summary}</p>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-qaa-navy-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.direction === "inbound" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[70%] rounded-xl px-4 py-2.5 ${
                  msg.direction === "inbound"
                    ? "bg-white border border-gray-200 text-gray-800"
                    : msg.ai_intent === "agent_reply"
                    ? "bg-qaa-navy-500 text-white"
                    : "bg-qaa-gold-100 text-qaa-navy-900 border border-qaa-gold-300"
                }`}>
                  <MessageContent content={msg.content} />
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

          {/* Reply Box — only for active conversations */}
          {isActive && (
            <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type a reply..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-qaa-navy-500 bg-gray-50"
              />
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="px-6 py-2.5 bg-qaa-navy-900 text-white text-sm font-medium rounded-lg hover:bg-qaa-navy-800 transition disabled:opacity-50"
              >
                Send
              </button>
            </form>
          )}
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

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-qaa-navy-900">Transfer Conversation</h3>
              <p className="text-sm text-gray-500 mt-1">Select an agent to transfer this conversation to.</p>
            </div>
            <div className="p-5 space-y-2 max-h-64 overflow-y-auto">
              {agents.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No other agents available</p>
              ) : (
                agents.map((agent) => (
                  <label
                    key={agent.agent_id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      transferTarget === agent.agent_id
                        ? "border-qaa-navy-500 bg-qaa-navy-50"
                        : "border-gray-100 hover:bg-gray-50"
                    } ${!agent.has_capacity ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="radio"
                      name="transfer_agent"
                      value={agent.agent_id}
                      checked={transferTarget === agent.agent_id}
                      onChange={() => setTransferTarget(agent.agent_id)}
                      disabled={!agent.has_capacity}
                      className="accent-qaa-navy-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-qaa-navy-900">{agent.name}</p>
                      <p className="text-xs text-gray-400">{agent.department} &middot; {agent.active_chats}/{agent.max_concurrent_chats} chats</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      agent.status === "online" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                    }`}>
                      {agent.status}
                    </span>
                  </label>
                ))
              )}
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowTransfer(false); setTransferTarget(""); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTransfer}
                disabled={!transferTarget || transferring}
                className="px-4 py-2 bg-qaa-navy-900 text-white text-sm font-medium rounded-lg hover:bg-qaa-navy-800 transition disabled:opacity-50"
              >
                {transferring ? "Transferring..." : "Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}
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
