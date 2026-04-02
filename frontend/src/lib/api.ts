const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("qaa_token", token);
    } else {
      localStorage.removeItem("qaa_token");
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("qaa_token");
    }
    return this.token;
  }

  async fetch(path: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      this.setToken(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return res;
  }

  async get<T = unknown>(path: string): Promise<T> {
    const res = await this.fetch(path);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    const res = await this.fetch(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
}

export const api = new ApiClient();

// Types
export interface QueueItem {
  conversation_id: string;
  status: string;
  escalation_reason: string | null;
  escalated_at: string | null;
  message_count: number;
  language: string;
  phone: string;
  name: string;
  ticket_id: string | null;
  ticket_number: number | null;
  priority: string;
  last_message: string;
  created_at: string;
}

export interface Conversation {
  conversation_id: string;
  status: string;
  escalation_reason: string | null;
  message_count: number;
  updated_at: string;
  phone: string;
  name: string;
  ticket_number: number | null;
  priority: string;
  last_message: string;
}

export interface Message {
  id: string;
  direction: string;
  type: string;
  content: string;
  ai_intent: string | null;
  ai_confidence: number | null;
  created_at: string;
}

export interface ConversationDetail {
  conversation_id: string;
  status: string;
  language: string;
  channel: string;
  escalation_reason: string | null;
  escalated_at: string | null;
  message_count: number;
  created_at: string;
  user_id: string;
  phone: string;
  name: string;
  user_type: string;
  user_language: string;
  student_id: string | null;
}

export interface User {
  sub: string;
  email: string;
  role: string;
  agent_id: string | null;
  name: string;
}

export interface Metrics {
  conversations: {
    total: number;
    today: number;
    this_week: number;
    total_escalated: number;
    queue_size: number;
    active_handling: number;
    resolved: number;
  };
  tickets: {
    total: number;
    resolved: number;
    avg_first_response_min: number | null;
    avg_resolution_min: number | null;
  };
  top_intents: { intent: string; count: number }[];
}

export interface AgentMetric {
  name: string;
  email: string;
  department: string;
  status: string;
  active_chats: number;
  total_tickets: number;
  resolved: number;
  avg_response_min: number | null;
}
