import logging
from fastapi import APIRouter, Request, BackgroundTasks
from app.services.whatsapp import (
    parse_incoming_message,
    send_text_message,
    send_interactive_buttons,
    send_interactive_list,
)
from app.services.conversation import (
    get_or_create_user,
    get_or_create_conversation,
    get_conversation_history,
    escalate_conversation,
    create_escalation_ticket,
    save_message,
    log_webhook,
)
from app.services.knowledge_base import search_kb
from app.services.llm import generate_response

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Triggers ─────────────────────────────────────────────────
GREETING_TRIGGERS = {
    "hi", "hello", "hey", "start", "menu", "main menu",
    "مرحبا", "السلام عليكم", "مرحبًا", "هلا",
}

ESCALATION_TRIGGERS = {
    "agent", "human", "speak to agent", "talk to human",
    "real person", "representative", "support",
    "موظف", "شخص حقيقي", "أريد التحدث مع شخص", "دعم",
}

ESCALATION_MSG = (
    "Your conversation has been forwarded to our team.\n"
    "A representative will contact you shortly.\n\n"
    "تم تحويل محادثتك إلى فريقنا.\n"
    "سيتواصل معك أحد الممثلين قريبًا.\n\n"
    "Thank you for your patience! 🙏\n"
    "شكرًا لصبرك!"
)

ALREADY_ESCALATED_MSG = (
    "Your conversation is already with our team.\n"
    "Please wait, a representative will respond soon.\n\n"
    "محادثتك بالفعل مع فريقنا.\n"
    "يرجى الانتظار، سيرد عليك أحد الممثلين قريبًا."
)

WELCOME_BODY = (
    "Welcome to Qatar Aeronautical Academy! ✈️\n"
    "مرحبًا بكم في أكاديمية قطر للطيران!\n\n"
    "How can I help you today?\n"
    "كيف يمكنني مساعدتك اليوم?"
)

WELCOME_BUTTONS = [
    {"id": "menu_programs", "title": "Programs & Courses"},
    {"id": "menu_admission", "title": "Admission & Fees"},
    {"id": "menu_contact", "title": "Contact Us"},
]

CONTACT_MSG = (
    "Qatar Aeronautical Academy\n"
    "أكاديمية قطر للطيران\n\n"
    "Phone / الهاتف:\n"
    "+974 4440 8888\n\n"
    "Admissions / القبول:\n"
    "+974 4440 8873\n"
    "+974 4440 8858\n"
    "+974 4440 8869\n\n"
    "Email / البريد الإلكتروني:\n"
    "Info@qaa.edu.qa\n\n"
    "Address / العنوان:\n"
    "Al Khulaifat Area, Doha, Qatar\n"
    "P.O. Box 4050\n\n"
    "Type 'menu' for more options.\n"
    "اكتب 'menu' للمزيد من الخيارات."
)

MORE_INFO_BUTTONS = [
    {"id": "menu_about", "title": "About QAA"},
    {"id": "menu_facilities", "title": "Facilities & Fleet"},
    {"id": "menu_careers", "title": "Careers & More"},
]

# ── Menu Definitions ─────────────────────────────────────────

PROGRAMS_SECTIONS = [
    {
        "title": "Academic Programs",
        "rows": [
            {"id": "q_pilot", "title": "Pilot Training", "description": "MPL & CPL programs"},
            {"id": "q_ame", "title": "Aircraft Maintenance", "description": "EASA Part 147 - B1/B2"},
            {"id": "q_atc", "title": "Air Traffic Control", "description": "ICAO standard ATC"},
            {"id": "q_meteo", "title": "Meteorology", "description": "2.5-year WMO diploma"},
            {"id": "q_dispatch", "title": "Flight Dispatch", "description": "6-month program"},
            {"id": "q_airport", "title": "Airport Operations", "description": "6-month management"},
        ],
    },
    {
        "title": "Other Programs",
        "rows": [
            {"id": "q_foundation", "title": "Foundation Program", "description": "Physics, Math, English"},
            {"id": "q_english", "title": "English & IELTS", "description": "Language courses & testing"},
            {"id": "q_icao", "title": "ICAO Short Courses", "description": "TRAINAIR PLUS courses"},
        ],
    },
]

ADMISSION_SECTIONS = [
    {
        "title": "Admission",
        "rows": [
            {"id": "q_apply", "title": "How to Apply", "description": "Application process"},
            {"id": "q_requirements", "title": "Requirements", "description": "Grades, documents, age"},
            {"id": "q_documents", "title": "Documents Needed", "description": "ID, certificates, photos"},
            {"id": "q_international", "title": "International Students", "description": "Extra requirements"},
            {"id": "q_medical", "title": "Medical Examination", "description": "Class I, III medical"},
        ],
    },
    {
        "title": "Fees & Support",
        "rows": [
            {"id": "q_fees", "title": "Course Fees", "description": "Tuition by program"},
            {"id": "q_scholarships", "title": "Scholarships", "description": "Financial aid options"},
            {"id": "q_accommodation", "title": "Accommodation", "description": "Housing & meals"},
            {"id": "q_intake", "title": "Intake Periods", "description": "Sep & Jan intakes"},
        ],
    },
]

# Map list item IDs to KB search queries
MENU_QUERIES = {
    "q_pilot": "Tell me about the pilot training program",
    "q_ame": "Tell me about aircraft maintenance engineering",
    "q_atc": "Tell me about the Air Traffic Control program",
    "q_meteo": "Tell me about the Meteorology program",
    "q_dispatch": "Tell me about Flight Dispatch",
    "q_airport": "Tell me about Airport Operations Management",
    "q_foundation": "What is the Foundation Program",
    "q_english": "Does QAA offer English language courses",
    "q_icao": "What ICAO short courses does QAA offer",
    "q_apply": "How do I apply to QAA",
    "q_requirements": "What are the admission requirements",
    "q_documents": "What documents are needed for admission",
    "q_international": "What are the requirements for international students",
    "q_medical": "What medical examination is required",
    "q_fees": "What are the course fees at QAA",
    "q_scholarships": "Are there scholarships available",
    "q_accommodation": "Does QAA have accommodation or housing",
    "q_intake": "What are the intake periods",
}

NO_MATCH_MSG = (
    "Thank you for your question.\n"
    "شكرًا على سؤالك.\n\n"
    "I couldn't find a specific answer.\n"
    "لم أتمكن من إيجاد إجابة محددة.\n\n"
    "Type 'menu' for options or ask your question differently.\n"
    "اكتب 'menu' للخيارات أو اسأل بطريقة مختلفة."
)


def _detect_language(text: str) -> str:
    arabic_chars = sum(1 for c in text if '\u0600' <= c <= '\u06FF')
    return "ar" if arabic_chars > len(text) * 0.3 else "en"


def _build_kb_context(results: list[dict]) -> str:
    parts = []
    for r in results:
        parts.append(f"Q: {r['question_en']}\nA: {r['answer_en']}")
    return "\n\n".join(parts)


async def _answer_from_kb(
    query: str, language: str = "en", history: list[dict] = None,
) -> tuple[str, str, float, str]:
    """Search KB + LLM → (reply, intent, confidence, faq_id)."""
    kb_results = await search_kb(query)

    if not kb_results:
        return NO_MATCH_MSG, "no_match", 0.0, None

    kb_context = _build_kb_context(kb_results)
    confidence = min(kb_results[0]["score"] / 10.0, 1.0)
    faq_id = kb_results[0]["id"]

    llm_reply = await generate_response(query, kb_context, language, conversation_history=history)
    if llm_reply:
        return llm_reply, "llm_response", confidence, faq_id

    return kb_results[0]["answer_en"], "kb_fallback", confidence, faq_id


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
        button_id = msg.get("button_id", "")
        list_id = msg.get("list_id", "")

        logger.info(f"Message from {phone}: type={msg_type} content={content[:80]} btn={button_id} list={list_id}")

        user = get_or_create_user(phone, msg.get("name"))
        conv = get_or_create_conversation(user["id"], "whatsapp_registration")

        save_message(
            conversation_id=conv["id"],
            direction="inbound",
            content=content,
            message_type=msg_type,
            whatsapp_message_id=msg.get("message_id"),
        )

        ai_intent = None
        ai_confidence = None
        ai_matched_faq_id = None
        reply_text = None

        # ── 0. Already escalated → inform user ─────────────
        if conv["status"] in ("waiting_agent", "agent_handling") and content.lower() not in GREETING_TRIGGERS:
            await send_text_message(phone, ALREADY_ESCALATED_MSG)
            save_message(
                conversation_id=conv["id"], direction="outbound",
                content=ALREADY_ESCALATED_MSG, message_type="text",
                ai_intent="escalated_reminder",
            )
            return

        # ── 0b. Escalation request → hand over ─────────────
        if content.lower() in ESCALATION_TRIGGERS:
            context = escalate_conversation(conv["id"], user["id"], reason=content)
            create_escalation_ticket(conv["id"], user["id"], "whatsapp_registration", content, content)
            logger.info(f"Escalation for {phone}: {context['escalation_reason']}")
            result = await send_text_message(phone, ESCALATION_MSG)
            ai_intent = "escalation"
            reply_text = ESCALATION_MSG

            wa_msg_id = None
            if isinstance(result, dict) and "messages" in result:
                wa_msg_id = result["messages"][0].get("id")

            save_message(
                conversation_id=conv["id"], direction="outbound",
                content=reply_text, message_type="text",
                whatsapp_message_id=wa_msg_id, ai_intent=ai_intent,
            )
            log_webhook("outbound", "whatsapp_registration", result, status_code=200)
            return

        # Fetch conversation history for LLM context
        history = get_conversation_history(conv["id"], limit=10)

        # ── 1. Greeting → Welcome buttons ────────────────────
        if content.lower() in GREETING_TRIGGERS:
            result = await send_interactive_buttons(phone, WELCOME_BODY, WELCOME_BUTTONS)
            ai_intent = "greeting"
            reply_text = WELCOME_BODY

        # ── 2. Menu button clicks → List menus ───────────────
        elif button_id == "menu_programs":
            result = await send_interactive_list(
                phone,
                "Choose a program to learn more:\nاختر برنامجاً لمعرفة المزيد:",
                "View Programs",
                PROGRAMS_SECTIONS,
            )
            ai_intent = "menu_programs"
            reply_text = "[Programs menu]"

        elif button_id == "menu_admission":
            result = await send_interactive_list(
                phone,
                "Choose a topic:\nاختر موضوعاً:",
                "View Options",
                ADMISSION_SECTIONS,
            )
            ai_intent = "menu_admission"
            reply_text = "[Admission menu]"

        elif button_id == "menu_contact":
            await send_text_message(phone, CONTACT_MSG)
            result = await send_interactive_buttons(
                phone,
                "Want to know more about QAA?\nهل تريد معرفة المزيد عن الأكاديمية؟",
                MORE_INFO_BUTTONS,
            )
            ai_intent = "contact_info"
            reply_text = CONTACT_MSG

        elif button_id == "menu_about":
            language = _detect_language(content)
            reply_text, ai_intent, ai_confidence, ai_matched_faq_id = await _answer_from_kb(
                "What is Qatar Aeronautical Academy", language, history,
            )
            result = await send_text_message(phone, reply_text)

        elif button_id == "menu_facilities":
            language = _detect_language(content)
            reply_text, ai_intent, ai_confidence, ai_matched_faq_id = await _answer_from_kb(
                "What are the campus facilities and aircraft fleet", language, history,
            )
            result = await send_text_message(phone, reply_text)

        elif button_id == "menu_careers":
            language = _detect_language(content)
            reply_text, ai_intent, ai_confidence, ai_matched_faq_id = await _answer_from_kb(
                "What career opportunities are available after graduation", language, history,
            )
            result = await send_text_message(phone, reply_text)

        # ── 3. List item selection → KB + LLM answer ─────────
        elif list_id and list_id in MENU_QUERIES:
            query = MENU_QUERIES[list_id]
            language = _detect_language(content)
            reply_text, ai_intent, ai_confidence, ai_matched_faq_id = await _answer_from_kb(query, language, history)
            result = await send_text_message(phone, reply_text)

        # ── 4. Free text → KB + LLM answer ──────────────────
        else:
            language = _detect_language(content)
            reply_text, ai_intent, ai_confidence, ai_matched_faq_id = await _answer_from_kb(content, language, history)
            result = await send_text_message(phone, reply_text)

        # ── Save outbound message ────────────────────────────
        wa_msg_id = None
        if isinstance(result, dict) and "messages" in result:
            wa_msg_id = result["messages"][0].get("id")

        save_message(
            conversation_id=conv["id"],
            direction="outbound",
            content=reply_text or "[interactive]",
            message_type="interactive" if ai_intent and ai_intent.startswith("menu") else "text",
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


@router.post("/webhook/resolve-escalation/{conversation_id}")
async def resolve_escalation(conversation_id: str):
    """Agent marks escalation as resolved → bot resumes for this user."""
    from app.core.database import get_db
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "UPDATE conversations SET status = 'active' WHERE id = %s AND status IN ('waiting_agent', 'agent_handling')",
            (conversation_id,),
        )
        if cur.rowcount == 0:
            return {"status": "not_found", "message": "No escalated conversation found"}
    return {"status": "resolved", "conversation_id": conversation_id}


@router.get("/webhook/escalated")
async def list_escalated():
    """List all conversations waiting for an agent."""
    from app.core.database import get_db
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """SELECT c.id, c.status, c.created_at, u.phone_number, u.display_name
               FROM conversations c
               JOIN users u ON u.id = c.user_id
               WHERE c.status IN ('waiting_agent', 'agent_handling')
               ORDER BY c.created_at DESC
               LIMIT 50"""
        )
        rows = cur.fetchall()
    return [
        {
            "conversation_id": str(r[0]),
            "status": r[1],
            "created_at": str(r[2]),
            "phone": r[3],
            "name": r[4],
        }
        for r in rows
    ]
