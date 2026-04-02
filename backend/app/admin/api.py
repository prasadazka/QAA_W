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
    hash_password,
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


# ── AI Context Summary ─────────────────────────────────────

@router.get("/conversations/{conversation_id}/summary")
async def conversation_summary(conversation_id: str, user: dict = Depends(get_current_user)):
    """Generate an AI summary of the conversation for agent handoff."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT direction::text, content, ai_intent, created_at
            FROM messages WHERE conversation_id = %s
            ORDER BY created_at ASC
        """, (conversation_id,))
        msgs = cur.fetchall()

        cur.execute("""
            SELECT u.display_name, u.phone_number, c.escalation_reason::text, c.language::text
            FROM conversations c JOIN users u ON u.id = c.user_id
            WHERE c.id = %s
        """, (conversation_id,))
        info = cur.fetchone()

    if not msgs:
        return {"summary": "No messages in this conversation yet."}

    # Build conversation text for LLM
    lines = []
    for m in msgs[-20:]:
        role = "User" if m[0] == "inbound" else ("Agent" if m[2] == "agent_reply" else "Bot")
        lines.append(f"{role}: {m[1]}")
    conversation_text = "\n".join(lines)

    user_name = info[0] if info else "Unknown"
    phone = info[1] if info else ""
    reason = info[2] if info else "user_requested"
    language = info[3] if info else "en"

    prompt = (
        f"Summarize this customer support conversation in 2-3 sentences for an agent taking over.\n"
        f"Customer: {user_name} ({phone}), Language: {language}, Escalation reason: {reason}\n\n"
        f"Conversation:\n{conversation_text}\n\n"
        f"Write a brief handoff summary: what the user asked, what the bot answered, "
        f"and what the user still needs help with. Keep it under 80 words."
    )

    try:
        from app.services.llm import generate_summary
        summary = await generate_summary(prompt)
        if summary:
            return {"summary": summary}
    except Exception as e:
        logger.warning(f"Summary generation failed: {e}")

    # Fallback: simple text summary
    user_msgs = [m[1] for m in msgs if m[0] == "inbound"]
    last_q = user_msgs[-1] if user_msgs else "No user messages"
    return {"summary": f"User {user_name} ({phone}) asked: \"{last_q[:150]}\" — escalation reason: {reason}"}


# ── Transfer Conversation ──────────────────────────────────

@router.post("/conversations/{conversation_id}/transfer")
async def transfer_conversation(conversation_id: str, request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    target_agent_id = body.get("agent_id", "").strip()
    if not target_agent_id:
        raise HTTPException(400, "agent_id is required")

    current_agent_id = user.get("agent_id")

    with get_db() as conn:
        cur = conn.cursor()

        # Verify target agent exists and has capacity
        cur.execute("""
            SELECT a.id, u.display_name, a.active_chats, a.max_concurrent_chats, a.status::text
            FROM agents a JOIN users u ON u.id = a.user_id
            WHERE a.id = %s
        """, (target_agent_id,))
        target = cur.fetchone()
        if not target:
            raise HTTPException(404, "Target agent not found")
        if target[2] >= target[3]:
            raise HTTPException(409, f"{target[1]} is at max capacity ({target[3]} chats)")

        # Transfer: update conversation agent
        cur.execute("""
            UPDATE conversations SET agent_id = %s
            WHERE id = %s AND status = 'agent_handling'
            RETURNING id
        """, (target_agent_id, conversation_id))

        if cur.rowcount == 0:
            raise HTTPException(404, "Conversation not found or not in agent_handling")

        # Update ticket
        cur.execute("""
            UPDATE tickets SET assigned_agent_id = %s
            WHERE conversation_id = %s AND status NOT IN ('resolved', 'closed')
        """, (target_agent_id, conversation_id))

        # Update agent chat counts
        cur.execute(
            "UPDATE agents SET active_chats = active_chats + 1, last_active_at = NOW() WHERE id = %s",
            (target_agent_id,),
        )
        if current_agent_id:
            cur.execute(
                "UPDATE agents SET active_chats = GREATEST(active_chats - 1, 0) WHERE id = %s",
                (current_agent_id,),
            )

        # Audit log
        cur.execute("""
            INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, new_value)
            VALUES (%s, %s, 'transfer_conversation', 'conversation', %s, %s)
        """, (str(uuid.uuid4()), user["sub"], conversation_id,
              json.dumps({"from_agent": current_agent_id, "to_agent": target_agent_id, "to_name": target[1]})))

    return {"status": "transferred", "to_agent": target[1]}


# ── Available Agents (for transfer dropdown) ───────────────

@router.get("/agents/available")
async def available_agents(user: dict = Depends(get_current_user)):
    """List agents for transfer dropdown."""
    current_agent_id = user.get("agent_id")

    with get_db() as conn:
        cur = conn.cursor()
        if current_agent_id:
            cur.execute("""
                SELECT a.id, u.display_name, a.department::text, a.status::text,
                       a.active_chats, a.max_concurrent_chats
                FROM agents a
                JOIN users u ON u.id = a.user_id
                WHERE u.user_type IN ('agent', 'supervisor', 'admin')
                  AND a.id::text != %s
                ORDER BY a.status = 'online' DESC, a.active_chats ASC
            """, (str(current_agent_id),))
        else:
            cur.execute("""
                SELECT a.id, u.display_name, a.department::text, a.status::text,
                       a.active_chats, a.max_concurrent_chats
                FROM agents a
                JOIN users u ON u.id = a.user_id
                WHERE u.user_type IN ('agent', 'supervisor', 'admin')
                ORDER BY a.status = 'online' DESC, a.active_chats ASC
            """)
        rows = cur.fetchall()

    return {
        "agents": [
            {
                "agent_id": str(r[0]), "name": r[1], "department": r[2],
                "status": r[3], "active_chats": r[4], "max_concurrent_chats": r[5],
                "has_capacity": r[4] < r[5],
            }
            for r in rows
        ]
    }


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


# ── User Management (Admin only) ──────────────────────────

@router.get("/users")
async def list_users(
    role: str = None, search: str = None, page: int = 1, per_page: int = 20,
    user: dict = Depends(require_role("admin")),
):
    offset = (page - 1) * per_page
    conditions = ["u.user_type IN ('agent', 'supervisor', 'admin')"]
    params: list = []

    if role:
        conditions.append("u.user_type = %s")
        params.append(role)
    if search:
        conditions.append("(u.display_name ILIKE %s OR u.email ILIKE %s)")
        params.extend([f"%{search}%", f"%{search}%"])

    where = " AND ".join(conditions)

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(f"SELECT count(*) FROM users u WHERE {where}", params)
        total = cur.fetchone()[0]

        cur.execute(f"""
            SELECT u.id, u.email, u.display_name, u.user_type::text,
                   a.id AS agent_id, a.department::text, a.status::text,
                   a.is_supervisor, a.max_concurrent_chats, a.active_chats,
                   a.last_active_at, u.created_at
            FROM users u
            LEFT JOIN agents a ON a.user_id = u.id
            WHERE {where}
            ORDER BY u.created_at DESC
            LIMIT %s OFFSET %s
        """, params + [per_page, offset])
        rows = cur.fetchall()

    return {
        "users": [
            {
                "user_id": str(r[0]), "email": r[1], "name": r[2] or "",
                "role": r[3], "agent_id": str(r[4]) if r[4] else None,
                "department": r[5], "status": r[6],
                "is_supervisor": r[7] or False,
                "max_concurrent_chats": r[8] or 5,
                "active_chats": r[9] or 0,
                "last_active_at": str(r[10]) if r[10] else None,
                "created_at": str(r[11]),
            }
            for r in rows
        ],
        "total": total, "page": page, "per_page": per_page,
    }


@router.get("/users/{user_id}")
async def get_user(user_id: str, user: dict = Depends(require_role("admin"))):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT u.id, u.email, u.display_name, u.user_type::text,
                   a.id AS agent_id, a.department::text, a.status::text,
                   a.is_supervisor, a.max_concurrent_chats, a.active_chats,
                   a.last_active_at, u.created_at
            FROM users u
            LEFT JOIN agents a ON a.user_id = u.id
            WHERE u.id = %s
        """, (user_id,))
        r = cur.fetchone()

    if not r:
        raise HTTPException(404, "User not found")

    return {
        "user_id": str(r[0]), "email": r[1], "name": r[2] or "",
        "role": r[3], "agent_id": str(r[4]) if r[4] else None,
        "department": r[5], "status": r[6],
        "is_supervisor": r[7] or False,
        "max_concurrent_chats": r[8] or 5,
        "active_chats": r[9] or 0,
        "last_active_at": str(r[10]) if r[10] else None,
        "created_at": str(r[11]),
    }


@router.post("/users")
async def create_user(request: Request, user: dict = Depends(require_role("admin"))):
    body = await request.json()
    email = body.get("email", "").strip()
    name = body.get("name", "").strip()
    password = body.get("password", "")
    role = body.get("role", "agent")
    department = body.get("department", "registration")
    max_chats = body.get("max_concurrent_chats", 5)

    if not email or not password or not name:
        raise HTTPException(400, "email, name and password are required")
    if role not in ("agent", "supervisor", "admin"):
        raise HTTPException(400, "role must be agent, supervisor or admin")

    pw_hash = hash_password(password)
    new_user_id = uuid.uuid4()

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            raise HTTPException(409, "Email already exists")

        cur.execute("""
            INSERT INTO users (id, email, display_name, user_type, metadata, is_verified)
            VALUES (%s, %s, %s, %s, %s, TRUE)
        """, (str(new_user_id), email, name, role, json.dumps({"password_hash": pw_hash})))

        agent_id = None
        if role in ("agent", "supervisor", "admin"):
            agent_id = uuid.uuid4()
            cur.execute("""
                INSERT INTO agents (id, user_id, department, status, is_supervisor, max_concurrent_chats)
                VALUES (%s, %s, %s, 'offline', %s, %s)
            """, (str(agent_id), str(new_user_id), department, role in ("supervisor", "admin"), max_chats))

        # Audit
        cur.execute("""
            INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, new_value)
            VALUES (%s, %s, 'create_user', 'user', %s, %s)
        """, (str(uuid.uuid4()), user["sub"], str(new_user_id),
              json.dumps({"email": email, "role": role})))

    return {"user_id": str(new_user_id), "agent_id": str(agent_id) if agent_id else None,
            "email": email, "name": name, "role": role}


@router.put("/users/{user_id}")
async def update_user(user_id: str, request: Request, user: dict = Depends(require_role("admin"))):
    body = await request.json()

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id, user_type::text FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "User not found")

        updates = []
        params = []

        if "name" in body:
            updates.append("display_name = %s")
            params.append(body["name"])
        if "email" in body:
            updates.append("email = %s")
            params.append(body["email"])
        if "role" in body and body["role"] in ("agent", "supervisor", "admin"):
            updates.append("user_type = %s")
            params.append(body["role"])
        if "password" in body and body["password"]:
            pw_hash = hash_password(body["password"])
            updates.append("metadata = jsonb_set(COALESCE(metadata, '{}'), '{password_hash}', %s)")
            params.append(json.dumps(pw_hash))

        if updates:
            params.append(user_id)
            cur.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = %s", params)

        # Update agent record
        agent_updates = []
        agent_params = []
        if "department" in body:
            agent_updates.append("department = %s")
            agent_params.append(body["department"])
        if "max_concurrent_chats" in body:
            agent_updates.append("max_concurrent_chats = %s")
            agent_params.append(body["max_concurrent_chats"])
        if "role" in body:
            agent_updates.append("is_supervisor = %s")
            agent_params.append(body["role"] in ("supervisor", "admin"))

        if agent_updates:
            agent_params.append(user_id)
            cur.execute(f"UPDATE agents SET {', '.join(agent_updates)} WHERE user_id = %s", agent_params)

        # Audit
        cur.execute("""
            INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, new_value)
            VALUES (%s, %s, 'update_user', 'user', %s, %s)
        """, (str(uuid.uuid4()), user["sub"], user_id, json.dumps(body)))

    return {"status": "updated"}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, user: dict = Depends(require_role("admin"))):
    if user_id == user["sub"]:
        raise HTTPException(400, "Cannot delete yourself")

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("UPDATE agents SET status = 'offline' WHERE user_id = %s", (user_id,))
        cur.execute("UPDATE users SET user_type = 'anonymous' WHERE id = %s AND id != %s RETURNING id",
                     (user_id, user["sub"]))
        if cur.rowcount == 0:
            raise HTTPException(404, "User not found")

        cur.execute("""
            INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id)
            VALUES (%s, %s, 'delete_user', 'user', %s)
        """, (str(uuid.uuid4()), user["sub"], user_id))

    return {"status": "deleted"}


# ── All Conversations (Admin/Supervisor) ───────────────────

@router.get("/conversations/all")
async def all_conversations(
    status: str = None, agent_id: str = None, search: str = None,
    page: int = 1, per_page: int = 20,
    user: dict = Depends(require_role("admin", "supervisor")),
):
    offset = (page - 1) * per_page
    conditions = ["1=1"]
    params: list = []

    if status:
        conditions.append("c.status = %s")
        params.append(status)
    if agent_id:
        conditions.append("c.agent_id = (SELECT id FROM agents WHERE id = %s OR user_id::text = %s)")
        params.extend([agent_id, agent_id])
    if search:
        conditions.append("(u.phone_number ILIKE %s OR u.display_name ILIKE %s)")
        params.extend([f"%{search}%", f"%{search}%"])

    where = " AND ".join(conditions)

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(f"SELECT count(*) FROM conversations c JOIN users u ON u.id = c.user_id WHERE {where}", params)
        total = cur.fetchone()[0]

        cur.execute(f"""
            SELECT c.id, u.display_name, u.phone_number, c.status,
                   ag_u.display_name AS agent_name, c.channel::text,
                   c.message_count, c.escalation_reason::text,
                   c.created_at, c.updated_at
            FROM conversations c
            JOIN users u ON u.id = c.user_id
            LEFT JOIN agents a ON a.id = c.agent_id
            LEFT JOIN users ag_u ON ag_u.id = a.user_id
            WHERE {where}
            ORDER BY c.updated_at DESC
            LIMIT %s OFFSET %s
        """, params + [per_page, offset])
        rows = cur.fetchall()

    return {
        "conversations": [
            {
                "conversation_id": str(r[0]),
                "user_name": r[1] or "Unknown", "phone": r[2] or "",
                "status": r[3], "agent_name": r[4],
                "channel": r[5] or "", "message_count": r[6] or 0,
                "escalation_reason": r[7],
                "created_at": str(r[8]), "updated_at": str(r[9]) if r[9] else "",
            }
            for r in rows
        ],
        "total": total, "page": page, "per_page": per_page,
    }


@router.get("/conversations/{conversation_id}/full")
async def conversation_full(conversation_id: str, user: dict = Depends(require_role("admin", "supervisor"))):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT c.id, c.status, c.language::text, c.channel::text,
                   c.escalation_reason::text, c.escalated_at, c.message_count, c.created_at,
                   u.id, u.phone_number, u.display_name, u.user_type::text,
                   u.preferred_language::text, u.student_id,
                   ag_u.display_name AS agent_name
            FROM conversations c
            JOIN users u ON u.id = c.user_id
            LEFT JOIN agents a ON a.id = c.agent_id
            LEFT JOIN users ag_u ON ag_u.id = a.user_id
            WHERE c.id = %s
        """, (conversation_id,))
        row = cur.fetchone()

    if not row:
        raise HTTPException(404, "Conversation not found")

    return {
        "conversation_id": str(row[0]), "status": row[1],
        "language": row[2], "channel": row[3],
        "escalation_reason": row[4],
        "escalated_at": str(row[5]) if row[5] else None,
        "message_count": row[6], "created_at": str(row[7]),
        "user_id": str(row[8]), "phone": row[9],
        "name": row[10] or "Unknown", "user_type": row[11],
        "user_language": row[12], "student_id": row[13],
        "agent_name": row[14],
    }


# ── Activity Log (Admin/Supervisor) ────────────────────────

@router.get("/activity")
async def get_activity(
    agent_id: str = None, action: str = None,
    page: int = 1, per_page: int = 50,
    user: dict = Depends(require_role("admin", "supervisor")),
):
    offset = (page - 1) * per_page
    conditions = ["1=1"]
    params: list = []

    if agent_id:
        conditions.append("al.user_id = %s")
        params.append(agent_id)
    if action:
        conditions.append("al.action = %s")
        params.append(action)

    where = " AND ".join(conditions)

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(f"SELECT count(*) FROM audit_logs al WHERE {where}", params)
        total = cur.fetchone()[0]

        cur.execute(f"""
            SELECT al.id, u.display_name, u.email, al.action,
                   al.entity_type, al.entity_id, al.new_value, al.created_at
            FROM audit_logs al
            LEFT JOIN users u ON u.id = al.user_id
            WHERE {where}
            ORDER BY al.created_at DESC
            LIMIT %s OFFSET %s
        """, params + [per_page, offset])
        rows = cur.fetchall()

    return {
        "logs": [
            {
                "id": str(r[0]), "agent_name": r[1] or "System",
                "agent_email": r[2] or "", "action": r[3],
                "entity_type": r[4], "entity_id": str(r[5]) if r[5] else None,
                "details": r[6] if isinstance(r[6], dict) else {},
                "created_at": str(r[7]),
            }
            for r in rows
        ],
        "total": total, "page": page, "per_page": per_page,
    }


# ── System Settings (Admin only) ──────────────────────────

@router.get("/settings")
async def get_settings(user: dict = Depends(require_role("admin"))):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT key, value FROM system_settings")
        rows = cur.fetchall()

    settings_dict = {r[0]: r[1] for r in rows}
    return {
        "escalation_threshold": settings_dict.get("escalation_threshold", 0.3),
        "max_queue_size": settings_dict.get("max_queue_size", 50),
        "auto_resolve_hours": settings_dict.get("auto_resolve_hours", 24),
        "welcome_message_en": settings_dict.get("welcome_message_en", ""),
        "welcome_message_ar": settings_dict.get("welcome_message_ar", ""),
        "default_department": settings_dict.get("default_department", "registration"),
    }


@router.put("/settings")
async def update_settings(request: Request, user: dict = Depends(require_role("admin"))):
    body = await request.json()

    with get_db() as conn:
        cur = conn.cursor()
        for key, value in body.items():
            cur.execute("""
                INSERT INTO system_settings (key, value, updated_by, updated_at)
                VALUES (%s, %s, %s, NOW())
                ON CONFLICT (key) DO UPDATE SET value = %s, updated_by = %s, updated_at = NOW()
            """, (key, json.dumps(value), user["sub"], json.dumps(value), user["sub"]))

        cur.execute("""
            INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, new_value)
            VALUES (%s, %s, 'update_settings', 'system', NULL, %s)
        """, (str(uuid.uuid4()), user["sub"], json.dumps(body)))

    return {"status": "updated"}
