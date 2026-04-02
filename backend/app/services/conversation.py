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


def log_webhook(direction: str, channel: str, payload: dict, status_code: int = None, error: str = None):
    """Log raw webhook payload for debugging."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO webhook_logs (id, direction, channel, payload, status_code, error_message, processed)
               VALUES (%s, %s, %s, %s, %s, %s, TRUE)""",
            (uuid.uuid4(), direction, channel, json.dumps(payload), status_code, error),
        )
