import logging
from fastapi import APIRouter, Request, BackgroundTasks
from app.services.whatsapp import parse_incoming_message, send_text_message
from app.services.conversation import (
    get_or_create_user,
    get_or_create_conversation,
    save_message,
    log_webhook,
)

logger = logging.getLogger(__name__)
router = APIRouter()

WELCOME_MSG = (
    "Welcome to Qatar Aeronautical Academy! 🎓\n"
    "مرحبًا بكم في أكاديمية قطر للطيران!\n\n"
    "How can I help you today?\n"
    "كيف يمكنني مساعدتك اليوم؟\n\n"
    "Type your question or choose:\n"
    "1️⃣ Programs & Courses\n"
    "2️⃣ Admission Requirements\n"
    "3️⃣ Fees & Scholarships\n"
    "4️⃣ Application Process\n"
    "5️⃣ Contact Us\n\n"
    "⚠️ This is an AI assistant. For official decisions, contact the department directly.\n"
    "⚠️ هذا مساعد ذكاء اصطناعي. للقرارات الرسمية، اتصل بالقسم مباشرة."
)

MENU_RESPONSES = {
    "1": "📚 *Programs & Courses*\n\nQAA offers:\n• Commercial Pilot License (CPL)\n• Private Pilot License (PPL)\n• Aircraft Maintenance Engineering\n• Air Traffic Control\n• Aviation Management\n\nWhich program interests you? Type the name or ask any question.",
    "2": "📋 *Admission Requirements*\n\nGeneral requirements:\n• High school certificate (minimum 70%)\n• Valid ID/Passport\n• Medical fitness certificate\n• English proficiency (IELTS 5.0+)\n• Age: 17-35 years\n\nFor specific program requirements, type the program name.",
    "3": "💰 *Fees & Scholarships*\n\nFee details vary by program. Scholarships available for Qatari nationals.\n\nFor detailed fee structure, please contact:\n📧 registration@qaa.edu.qa\n📞 +974 4454 0000",
    "4": "📝 *Application Process*\n\n1. Visit qaa.edu.qa\n2. Fill online application form\n3. Submit required documents\n4. Take entrance exam\n5. Medical examination\n6. Receive admission decision\n\nApplication portal: qaa.edu.qa/apply",
    "5": "📞 *Contact Us*\n\n🏢 Qatar Aeronautical Academy\n📍 Doha, Qatar\n📧 info@qaa.edu.qa\n📞 +974 4454 0000\n🌐 qaa.edu.qa\n\n🕐 Office Hours: Sun-Thu, 7:00 AM - 4:00 PM",
}


async def process_message(payload: dict):
    """Background task: process incoming WhatsApp message and reply."""
    try:
        # Log raw webhook
        log_webhook("inbound", "whatsapp_registration", payload)

        # Parse the message
        msg = parse_incoming_message(payload)
        if not msg:
            logger.info("No message in webhook payload (status update or other event)")
            return

        phone = msg["from"]
        content = msg.get("content", "").strip()
        msg_type = msg.get("type", "text")

        logger.info(f"Message from {phone}: {content[:100]}")

        # Get or create user & conversation
        user = get_or_create_user(phone, msg.get("name"))
        conv = get_or_create_conversation(user["id"], "whatsapp_registration")

        # Save inbound message
        save_message(
            conversation_id=conv["id"],
            direction="inbound",
            content=content,
            message_type=msg_type,
            whatsapp_message_id=msg.get("message_id"),
        )

        # Generate response
        if content.lower() in ("hi", "hello", "hey", "start", "menu", "مرحبا", "السلام عليكم", "مرحبًا"):
            reply = WELCOME_MSG
        elif content in MENU_RESPONSES:
            reply = MENU_RESPONSES[content]
        else:
            # For now, echo back with a helpful message
            # This is where AI/KB lookup will plug in later
            reply = (
                "Thank you for your question.\n"
                "شكرًا على سؤالك.\n\n"
                "I'm still learning! A human agent will be able to help you soon.\n"
                "ما زلت أتعلم! سيتمكن موظف بشري من مساعدتك قريبًا.\n\n"
                "Type 'menu' to see options.\n"
                "اكتب 'menu' لعرض الخيارات."
            )

        # Send reply
        result = await send_text_message(phone, reply)

        # Save outbound message
        wa_msg_id = None
        if "messages" in result:
            wa_msg_id = result["messages"][0].get("id")

        save_message(
            conversation_id=conv["id"],
            direction="outbound",
            content=reply,
            message_type="text",
            whatsapp_message_id=wa_msg_id,
        )

        # Log outbound
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
