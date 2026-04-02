"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import { api, Message, ConversationDetail } from "@/lib/api";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const lastTimestamp = useRef<string>("");

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
        setDetail(await api.get<ConversationDetail>(`/admin/api/conversations/${id}/detail`));
      } catch (e) {
        console.error(e);
      }
    };
    loadDetail();
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [id, loadMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || sending) return;
    setSending(true);

    // Optimistic append
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

  return (
    <ProtectedLayout>
      <div className="flex gap-4 h-[calc(100vh-3rem)]">
        {/* Chat Panel */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center">
            <div>
              <h2 className="font-bold text-gray-800">
                {detail?.name || "Loading..."}{" "}
                <span className="text-sm font-normal text-gray-400">{detail?.phone}</span>
              </h2>
              <p className="text-xs text-gray-500">
                {detail?.status} | {detail?.message_count} messages
              </p>
            </div>
            <button
              onClick={handleResolve}
              disabled={resolving}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition disabled:opacity-50"
            >
              {resolving ? "Resolving..." : "Resolve"}
            </button>
          </div>

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.direction === "inbound" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    msg.direction === "inbound"
                      ? "bg-white border border-gray-200 text-gray-800"
                      : msg.ai_intent === "agent_reply"
                      ? "bg-blue-600 text-white"
                      : "bg-green-600 text-white"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] opacity-60">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
          </div>

          {/* Reply Box */}
          <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
            <input
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type a reply..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={sending || !reply.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>

        {/* Info Sidebar */}
        <div className="w-72 bg-white rounded-lg shadow p-4 space-y-4">
          <h3 className="font-semibold text-gray-700">User Info</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Name:</span>
              <p className="font-medium">{detail?.name || "-"}</p>
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>
              <p className="font-medium">{detail?.phone || "-"}</p>
            </div>
            <div>
              <span className="text-gray-500">Language:</span>
              <p className="font-medium">{detail?.user_language || "-"}</p>
            </div>
            <div>
              <span className="text-gray-500">Student ID:</span>
              <p className="font-medium">{detail?.student_id || "N/A"}</p>
            </div>
            <div>
              <span className="text-gray-500">Type:</span>
              <p className="font-medium">{detail?.user_type || "-"}</p>
            </div>
          </div>

          <hr />

          <h3 className="font-semibold text-gray-700">Escalation</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Reason:</span>
              <p className="font-medium">{detail?.escalation_reason || "User requested"}</p>
            </div>
            <div>
              <span className="text-gray-500">Escalated at:</span>
              <p className="font-medium">
                {detail?.escalated_at
                  ? new Date(detail.escalated_at).toLocaleString()
                  : "-"}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Channel:</span>
              <p className="font-medium">{detail?.channel || "-"}</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
