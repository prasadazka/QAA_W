import uuid
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from app.core.database import get_db
from app.admin.auth import (
    authenticate_user,
    create_token,
    get_current_user,
    require_role,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/api")


# ── Auth ────────────────────────────────────────────────────

@router.post("/login")
async def login(request: Request):
    body = await request.json()
    email = body.get("email", "")
    password = body.get("password", "")

    user = authenticate_user(email, password)
    if not user:
        raise HTTPException(401, "Invalid email or password")

    token = create_token(
        user["user_id"], user["email"], user["role"],
        user["agent_id"], user["name"],
    )

    # Update agent status to online
    if user["agent_id"]:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute(
                "UPDATE agents SET status = 'online', last_active_at = NOW() WHERE id = %s",
                (user["agent_id"],),
            )

    return {"token": token, "user": user}


@router.post("/logout")
async def logout(user: dict = Depends(get_current_user)):
    if user.get("agent_id"):
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute(
                "UPDATE agents SET status = 'offline' WHERE id = %s",
                (user["agent_id"],),
            )
    return {"status": "logged_out"}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ── Queue ───────────────────────────────────────────────────

@router.get("/queue")
async def get_queue(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT c.id, c.status, c.escalation_reason::text, c.escalated_at,
                   c.message_count, c.language::text,
                   u.phone_number, u.display_name,
                   t.id AS ticket_id, t.ticket_number, t.priority::text,
                   (SELECT content FROM messages WHERE conversation_id = c.id
                    ORDER BY created_at DESC LIMIT 1) AS last_message,
                   c.created_at
            FROM conversations c
            JOIN users u ON u.id = c.user_id
            LEFT JOIN tickets t ON t.conversation_id = c.id AND t.status NOT IN ('resolved','closed')
            WHERE c.status = 'waiting_agent' AND c.agent_id IS NULL
            ORDER BY c.escalated_at ASC NULLS LAST, c.created_at ASC
            LIMIT 50
        """)
        rows = cur.fetchall()

    return [
        {
            "conversation_id": str(r[0]),
            "status": r[1],
            "escalation_reason": r[2],
            "escalated_at": str(r[3]) if r[3] else None,
            "message_count": r[4],
            "language": r[5],
            "phone": r[6],
            "name": r[7] or "Unknown",
            "ticket_id": str(r[8]) if r[8] else None,
            "ticket_number": r[9],
            "priority": r[10] or "medium",
            "last_message": (r[11] or "")[:120],
            "created_at": str(r[12]),
        }
        for r in rows
    ]


# ── Pick Conversation ───────────────────────────────────────

@router.post("/conversations/{conversation_id}/pick")
async def pick_conversation(conversation_id: str, user: dict = Depends(get_current_user)):
    agent_id = user.get("agent_id")
    if not agent_id:
        raise HTTPException(403, "Not an agent")

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            UPDATE conversations
            SET agent_id = %s, status = 'agent_handling'
            WHERE id = %s AND status = 'waiting_agent' AND agent_id IS NULL
            RETURNING id
        """, (agent_id, conversation_id))

        if cur.rowcount == 0:
            raise HTTPException(409, "Conversation already picked or not in queue")

        # Update ticket
        cur.execute("""
            UPDATE tickets SET assigned_agent_id = %s, status = 'assigned',
                   first_response_at = COALESCE(first_response_at, NOW())
            WHERE conversation_id = %s AND status = 'open'
        """, (agent_id, conversation_id))

        # Update agent active chats
        cur.execute(
            "UPDATE agents SET active_chats = active_chats + 1, last_active_at = NOW() WHERE id = %s",
            (agent_id,),
        )

    return {"status": "assigned", "conversation_id": conversation_id}


# ── My Conversations ────────────────────────────────────────

@router.get("/conversations")
async def my_conversations(user: dict = Depends(get_current_user)):
    agent_id = user.get("agent_id")
    if not agent_id:
        return []

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT c.id, c.status, c.escalation_reason::text, c.message_count, c.updated_at,
                   u.phone_number, u.display_name,
                   t.ticket_number, t.priority::text,
                   (SELECT content FROM messages WHERE conversation_id = c.id
                    ORDER BY created_at DESC LIMIT 1) AS last_message
            FROM conversations c
            JOIN users u ON u.id = c.user_id
            LEFT JOIN tickets t ON t.conversation_id = c.id AND t.status NOT IN ('resolved','closed')
            WHERE c.agent_id = %s AND c.status = 'agent_handling'
            ORDER BY c.updated_at DESC
        """, (agent_id,))
        rows = cur.fetchall()

    return [
        {
            "conversation_id": str(r[0]),
            "status": r[1],
            "escalation_reason": r[2],
            "message_count": r[3],
            "updated_at": str(r[4]),
            "phone": r[5],
            "name": r[6] or "Unknown",
            "ticket_number": r[7],
            "priority": r[8] or "medium",
            "last_message": (r[9] or "")[:120],
        }
        for r in rows
    ]


# ── Conversation Messages ───────────────────────────────────

@router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str, after: str = None, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cur = conn.cursor()

        if after:
            cur.execute("""
                SELECT id, direction::text, message_type::text, content, ai_intent, ai_confidence, created_at
                FROM messages
                WHERE conversation_id = %s AND created_at > %s
                ORDER BY created_at ASC
            """, (conversation_id, after))
        else:
            cur.execute("""
                SELECT id, direction::text, message_type::text, content, ai_intent, ai_confidence, created_at
                FROM messages
                WHERE conversation_id = %s
                ORDER BY created_at ASC
            """, (conversation_id,))
        rows = cur.fetchall()

    return [
        {
            "id": str(r[0]),
            "direction": r[1],
            "type": r[2],
            "content": r[3] or "",
            "ai_intent": r[4],
            "ai_confidence": r[5],
            "created_at": str(r[6]),
        }
        for r in rows
    ]


# ── Conversation Detail ─────────────────────────────────────

@router.get("/conversations/{conversation_id}/detail")
async def conversation_detail(conversation_id: str, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT c.id, c.status, c.language::text, c.channel::text,
                   c.escalation_reason::text, c.escalated_at, c.message_count, c.created_at,
                   u.id AS user_id, u.phone_number, u.display_name, u.user_type::text,
                   u.preferred_language::text, u.student_id
            FROM conversations c
            JOIN users u ON u.id = c.user_id
            WHERE c.id = %s
        """, (conversation_id,))
        row = cur.fetchone()

    if not row:
        raise HTTPException(404, "Conversation not found")

    return {
        "conversation_id": str(row[0]),
        "status": row[1],
        "language": row[2],
        "channel": row[3],
        "escalation_reason": row[4],
        "escalated_at": str(row[5]) if row[5] else None,
        "message_count": row[6],
        "created_at": str(row[7]),
        "user_id": str(row[8]),
        "phone": row[9],
        "name": row[10] or "Unknown",
        "user_type": row[11],
        "user_language": row[12],
        "student_id": row[13],
    }


# ── Agent Reply ─────────────────────────────────────────────

@router.post("/conversations/{conversation_id}/reply")
async def agent_reply(conversation_id: str, request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    message_text = body.get("message", "").strip()
    if not message_text:
        raise HTTPException(400, "Message is required")

    agent_id = user.get("agent_id")

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT u.phone_number, c.status
            FROM conversations c
            JOIN users u ON u.id = c.user_id
            WHERE c.id = %s
        """, (conversation_id,))
        row = cur.fetchone()

    if not row:
        raise HTTPException(404, "Conversation not found")

    phone = row[0]

    # Send via WhatsApp
    from app.services.whatsapp import send_text_message
    result = await send_text_message(phone, message_text)

    wa_msg_id = None
    if isinstance(result, dict) and "messages" in result:
        wa_msg_id = result["messages"][0].get("id")

    # Save message
    from app.services.conversation import save_message
    save_message(
        conversation_id=conversation_id,
        direction="outbound",
        content=message_text,
        message_type="text",
        whatsapp_message_id=wa_msg_id,
        ai_intent="agent_reply",
    )

    return {"status": "sent", "whatsapp_message_id": wa_msg_id}


# ── Resolve ─────────────────────────────────────────────────

@router.post("/conversations/{conversation_id}/resolve")
async def resolve_conversation(conversation_id: str, request: Request, user: dict = Depends(get_current_user)):
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass
    notes = body.get("notes", "")

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            UPDATE conversations
            SET status = 'resolved', ended_at = NOW()
            WHERE id = %s AND status = 'agent_handling'
            RETURNING id
        """, (conversation_id,))

        if cur.rowcount == 0:
            raise HTTPException(404, "Conversation not found or not in agent_handling")

        cur.execute("""
            UPDATE tickets
            SET status = 'resolved', resolved_at = NOW(), resolution_notes = %s
            WHERE conversation_id = %s AND status NOT IN ('resolved', 'closed')
        """, (notes, conversation_id))

        agent_id = user.get("agent_id")
        if agent_id:
            cur.execute(
                "UPDATE agents SET active_chats = GREATEST(active_chats - 1, 0) WHERE id = %s",
                (agent_id,),
            )

        # Audit log
        cur.execute("""
            INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, new_value)
            VALUES (%s, %s, 'resolve_conversation', 'conversation', %s, %s)
        """, (str(uuid.uuid4()), user["sub"], conversation_id, json.dumps({"notes": notes})))

    return {"status": "resolved"}


# ── Metrics (Admin/Supervisor) ──────────────────────────────

@router.get("/metrics")
async def get_metrics(user: dict = Depends(require_role("admin", "supervisor"))):
    with get_db() as conn:
        cur = conn.cursor()

        # Conversation stats
        cur.execute("""
            SELECT
                count(*) AS total,
                count(*) FILTER (WHERE created_at >= CURRENT_DATE) AS today,
                count(*) FILTER (WHERE created_at >= date_trunc('week', CURRENT_DATE)) AS this_week,
                count(*) FILTER (WHERE escalation_reason IS NOT NULL) AS total_escalated,
                count(*) FILTER (WHERE status = 'waiting_agent') AS queue_size,
                count(*) FILTER (WHERE status = 'agent_handling') AS active_handling,
                count(*) FILTER (WHERE status = 'resolved') AS resolved
            FROM conversations
        """)
        conv = cur.fetchone()

        # Ticket stats
        cur.execute("""
            SELECT
                count(*) AS total_tickets,
                count(*) FILTER (WHERE status = 'resolved') AS resolved_tickets,
                ROUND(AVG(EXTRACT(EPOCH FROM (first_response_at - created_at)) / 60)::numeric, 1)
                    AS avg_first_response_min,
                ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60)::numeric, 1)
                    AS avg_resolution_min
            FROM tickets
            WHERE created_at >= date_trunc('week', CURRENT_DATE)
        """)
        tickets = cur.fetchone()

        # Top intents
        cur.execute("""
            SELECT ai_intent, count(*) AS cnt
            FROM messages
            WHERE ai_intent IS NOT NULL AND created_at >= date_trunc('week', CURRENT_DATE)
            GROUP BY ai_intent
            ORDER BY cnt DESC
            LIMIT 10
        """)
        intents = cur.fetchall()

    return {
        "conversations": {
            "total": conv[0], "today": conv[1], "this_week": conv[2],
            "total_escalated": conv[3], "queue_size": conv[4],
            "active_handling": conv[5], "resolved": conv[6],
        },
        "tickets": {
            "total": tickets[0], "resolved": tickets[1],
            "avg_first_response_min": float(tickets[2]) if tickets[2] else None,
            "avg_resolution_min": float(tickets[3]) if tickets[3] else None,
        },
        "top_intents": [{"intent": r[0], "count": r[1]} for r in intents],
    }


@router.get("/metrics/agents")
async def get_agent_metrics(user: dict = Depends(require_role("admin", "supervisor"))):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT
                u.display_name, u.email,
                a.department::text, a.status::text, a.active_chats,
                count(DISTINCT t.id) AS total_tickets,
                count(DISTINCT t.id) FILTER (WHERE t.status = 'resolved') AS resolved,
                ROUND(AVG(EXTRACT(EPOCH FROM (t.first_response_at - t.created_at)) / 60)::numeric, 1)
                    AS avg_response_min
            FROM agents a
            JOIN users u ON u.id = a.user_id
            LEFT JOIN tickets t ON t.assigned_agent_id = a.id
                AND t.created_at >= date_trunc('week', CURRENT_DATE)
            GROUP BY a.id, u.display_name, u.email, a.department, a.status, a.active_chats
            ORDER BY resolved DESC
        """)
        rows = cur.fetchall()

    return [
        {
            "name": r[0], "email": r[1], "department": r[2],
            "status": r[3], "active_chats": r[4],
            "total_tickets": r[5], "resolved": r[6],
            "avg_response_min": float(r[7]) if r[7] else None,
        }
        for r in rows
    ]
