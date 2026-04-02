import uuid
import json
import logging
from app.core.database import get_db

logger = logging.getLogger(__name__)


def get_or_create_user(phone_number: str, name: str = None) -> dict:
    """Find existing user by phone or create anonymous one."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id, user_type, preferred_language FROM users WHERE phone_number = %s", (phone_number,))
        row = cur.fetchone()

        if row:
            return {"id": row[0], "user_type": row[1], "language": row[2]}

        user_id = uuid.uuid4()
        cur.execute(
            """INSERT INTO users (id, phone_number, display_name, user_type, preferred_language)
               VALUES (%s, %s, %s, 'anonymous', 'en')""",
            (user_id, phone_number, name),
        )
        return {"id": user_id, "user_type": "anonymous", "language": "en"}


def get_or_create_conversation(user_id, channel: str = "whatsapp_registration") -> dict:
    """Get active conversation or create new one."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """SELECT id, status, language FROM conversations
               WHERE user_id = %s AND channel = %s AND status IN ('active', 'waiting_agent', 'agent_handling')
               ORDER BY created_at DESC LIMIT 1""",
            (user_id, channel),
        )
        row = cur.fetchone()

        if row:
            return {"id": row[0], "status": row[1], "language": row[2]}

        conv_id = uuid.uuid4()
        cur.execute(
            """INSERT INTO conversations (id, user_id, channel, status, language)
               VALUES (%s, %s, %s, 'active', 'en')""",
            (conv_id, user_id, channel),
        )
        return {"id": conv_id, "status": "active", "language": "en"}


def save_message(conversation_id, direction: str, content: str, message_type: str = "text",
                 whatsapp_message_id: str = None, ai_confidence: float = None,
                 ai_intent: str = None, ai_matched_faq_id=None) -> uuid.UUID:
    """Save a message to the database."""
    msg_id = uuid.uuid4()
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO messages (id, conversation_id, direction, message_type, content,
                                     whatsapp_message_id, ai_confidence, ai_intent, ai_matched_faq_id)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (msg_id, conversation_id, direction, message_type, content,
             whatsapp_message_id, ai_confidence, ai_intent, ai_matched_faq_id),
        )
        # Update message count
        cur.execute(
            "UPDATE conversations SET message_count = message_count + 1 WHERE id = %s",
            (conversation_id,),
        )
    return msg_id


def get_conversation_history(conversation_id, limit: int = 10) -> list[dict]:
    """Fetch the last N messages for a conversation (oldest first)."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """SELECT direction, content, message_type, created_at
               FROM messages
               WHERE conversation_id = %s
               ORDER BY created_at DESC
               LIMIT %s""",
            (conversation_id, limit),
        )
        rows = cur.fetchall()

    # Reverse so oldest is first (chronological order)
    messages = []
    for row in reversed(rows):
        messages.append({
            "role": "user" if row[0] == "inbound" else "assistant",
            "content": row[1] or "",
            "type": row[2],
            "timestamp": str(row[3]),
        })
    return messages


def escalate_conversation(conversation_id, user_id, reason: str = None) -> dict:
    """Mark conversation as waiting_agent and build context summary for handover."""
    with get_db() as conn:
        cur = conn.cursor()

        # Update conversation status + escalated_at
        cur.execute(
            "UPDATE conversations SET status = 'waiting_agent', escalated_at = NOW(), escalation_reason = 'user_requested' WHERE id = %s",
            (conversation_id,),
        )

        # Get user info
        cur.execute(
            "SELECT phone_number, display_name, preferred_language FROM users WHERE id = %s",
            (user_id,),
        )
        user_row = cur.fetchone()

        # Get last 20 messages for agent context
        cur.execute(
            """SELECT direction, content, ai_intent, created_at
               FROM messages
               WHERE conversation_id = %s
               ORDER BY created_at DESC
               LIMIT 20""",
            (conversation_id,),
        )
        msg_rows = cur.fetchall()

    # Build context summary
    history_lines = []
    for row in reversed(msg_rows):
        direction = "User" if row[0] == "inbound" else "Bot"
        history_lines.append(f"[{row[3]}] {direction}: {row[1]}")

    return {
        "conversation_id": str(conversation_id),
        "user_phone": user_row[0] if user_row else "",
        "user_name": user_row[1] if user_row else "",
        "user_language": user_row[2] if user_row else "en",
        "escalation_reason": reason,
        "message_history": "\n".join(history_lines),
    }


def create_escalation_ticket(conversation_id, user_id, channel: str = "whatsapp_registration",
                             reason: str = None, last_message: str = None):
    """Create a ticket when a conversation is escalated."""
    ticket_id = uuid.uuid4()
    subject = f"Escalation: {last_message[:100]}" if last_message else "User requested agent"

    with get_db() as conn:
        cur = conn.cursor()
        # Skip if ticket already exists
        cur.execute(
            "SELECT id FROM tickets WHERE conversation_id = %s AND status NOT IN ('resolved','closed')",
            (conversation_id,),
        )
        if cur.fetchone():
            return None

        cur.execute("""
            INSERT INTO tickets (id, conversation_id, user_id, department, status,
                                 priority, subject, channel, escalation_reason)
            VALUES (%s, %s, %s, 'registration', 'open', 'medium', %s, %s, 'user_requested')
        """, (ticket_id, conversation_id, user_id, subject, channel))

    logger.info(f"Created ticket {ticket_id} for conversation {conversation_id}")
    return ticket_id


def log_webhook(direction: str, channel: str, payload: dict, status_code: int = None, error: str = None):
    """Log raw webhook payload for debugging."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO webhook_logs (id, direction, channel, payload, status_code, error_message, processed)
               VALUES (%s, %s, %s, %s, %s, %s, TRUE)""",
            (uuid.uuid4(), direction, channel, json.dumps(payload), status_code, error),
        )
