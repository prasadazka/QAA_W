import logging
from fastapi import APIRouter, Request, BackgroundTasks
from app.services.whatsapp import parse_incoming_message, send_text_message
from app.services.conversation import (
    get_or_create_user,
    get_or_create_conversation,
    save_message,
    log_webhook,
)
from app.services.knowledge_base import search_kb, format_kb_response

logger = logging.getLogger(__name__)
router = APIRouter()

GREETING_TRIGGERS = {"hi", "hello", "hey", "start", "menu", "مرحبا", "السلام عليكم", "مرحبًا", "هلا"}

WELCOME_MSG = (
    "Welcome to Qatar Aeronautical Academy! 🎓\n"
    "مرحبًا بكم في أكاديمية قطر للطيران!\n\n"
    "How can I help you today?\n"
    "كيف يمكنني مساعدتك اليوم؟\n\n"
    "Ask me anything about:\n"
    "- Programs & Courses\n"
    "- Admission & Requirements\n"
    "- Fees & Registration\n"
    "- Facilities & Fleet\n"
    "- Contact Information\n\n"
    "⚠️ AI assistant. For official decisions, contact the department directly.\n"
    "⚠️ مساعد ذكاء اصطناعي. للقرارات الرسمية، اتصل بالقسم مباشرة."
)

NO_MATCH_MSG = (
    "Thank you for your question.\n"
    "شكرًا على سؤالك.\n\n"
    "I couldn't find a specific answer. Try asking about:\n"
    "لم أتمكن من إيجاد إجابة محددة. حاول السؤال عن:\n\n"
    "- Programs / البرامج\n"
    "- Admission / القبول\n"
    "- Fees / الرسوم\n"
    "- Contact / الاتصال\n"
    "- Facilities / المرافق\n\n"
    "Type 'menu' for options.\n"
    "اكتب 'menu' للخيارات."
)


async def process_message(payload: dict):
    """Background task: process incoming WhatsApp message and reply."""
    try:
        log_webhook("inbound", "whatsapp_registration", payload)

        msg = parse_incoming_message(payload)
        if not msg:
            return

        phone = msg["from"]
        content = msg.get("content", "").strip()
        msg_type = msg.get("type", "text")

        logger.info(f"Message from {phone}: {content[:100]}")

        user = get_or_create_user(phone, msg.get("name"))
        conv = get_or_create_conversation(user["id"], "whatsapp_registration")

        save_message(
            conversation_id=conv["id"],
            direction="inbound",
            content=content,
            message_type=msg_type,
            whatsapp_message_id=msg.get("message_id"),
        )

        # Generate response
        ai_intent = None
        ai_confidence = None
        ai_matched_faq_id = None

        if content.lower() in GREETING_TRIGGERS:
            reply = WELCOME_MSG
            ai_intent = "greeting"
        else:
            # All queries go through KB (vector + keyword search)
            kb_results = await search_kb(content, "whatsapp_registration")
            kb_reply = format_kb_response(kb_results)

            if kb_reply:
                reply = kb_reply
                ai_intent = "kb_match"
                ai_confidence = min(kb_results[0]["score"] / 10.0, 1.0)
                ai_matched_faq_id = kb_results[0]["id"]
            else:
                reply = NO_MATCH_MSG
                ai_intent = "no_match"
                ai_confidence = 0.0

        # Send reply
        result = await send_text_message(phone, reply)

        wa_msg_id = None
        if "messages" in result:
            wa_msg_id = result["messages"][0].get("id")

        save_message(
            conversation_id=conv["id"],
            direction="outbound",
            content=reply,
            message_type="text",
            whatsapp_message_id=wa_msg_id,
            ai_confidence=ai_confidence,
            ai_intent=ai_intent,
            ai_matched_faq_id=ai_matched_faq_id,
        )

        log_webhook("outbound", "whatsapp_registration", result, status_code=200)

    except Exception as e:
        logger.error(f"Error processing message: {e}", exc_info=True)


@router.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request, background_tasks: BackgroundTasks):
    """Receive incoming WhatsApp messages from 360dialog."""
    payload = await request.json()
    background_tasks.add_task(process_message, payload)
    return {"status": "received"}


@router.get("/webhook/whatsapp")
async def whatsapp_webhook_verify(request: Request):
    """Webhook verification (if needed by provider)."""
    return {"status": "ok"}
