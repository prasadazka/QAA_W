import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_URL = (
    f"https://{settings.LLM_REGION}-aiplatform.googleapis.com/v1/"
    f"projects/{settings.GCP_PROJECT_ID}/locations/{settings.LLM_REGION}/"
    f"publishers/google/models/{settings.LLM_MODEL}:generateContent"
)

SYSTEM_PROMPT = """You are the official AI assistant for Qatar Aeronautical Academy (QAA).

ROLE:
- Answer questions about QAA using ONLY the provided context
- Be professional, concise, and helpful
- If the context doesn't contain the answer, say so honestly

RESPONSE FORMAT (WhatsApp):
- Reply in English first, then Arabic translation below
- Use plain text only — no markdown, no headers, no bold, no bullets with #
- Use simple bullet points with • or - for lists
- Keep answers under 300 words
- Add line breaks for readability
- Never include raw section numbers like "1.1" or "## headers"

TONE:
- Welcoming and professional
- Represent QAA's motto: "Excellence Becomes Reality"
- For official decisions (admission, fees, certification), always direct users to contact QAA directly

LANGUAGE:
- Detect user language: if Arabic, lead with Arabic then English
- If English, lead with English then Arabic
- Always provide both languages

STRICT RULES:
- NEVER make up information not in the context
- NEVER include markdown formatting in the reply
- If asked about something outside QAA, politely redirect
- Add disclaimer for official/legal matters"""


async def _get_access_token() -> str:
    """Get GCP access token from metadata server or local gcloud."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "http://metadata.google.internal/computeMetadata/v1/"
                "instance/service-accounts/default/token",
                headers={"Metadata-Flavor": "Google"},
                timeout=5.0,
            )
            if resp.status_code == 200:
                return resp.json()["access_token"]
    except Exception:
        pass

    import subprocess
    result = subprocess.run(
        ["gcloud", "auth", "print-access-token"],
        capture_output=True, text=True, timeout=10,
    )
    return result.stdout.strip()


async def generate_response(
    user_query: str,
    kb_context: str,
    language: str = "auto",
    conversation_history: list[dict] = None,
) -> str:
    """Generate a formatted WhatsApp reply using Gemini with conversation memory."""
    token = await _get_access_token()

    # Build multi-turn contents from conversation history
    contents = []
    if conversation_history:
        for msg in conversation_history[-8:]:  # Last 8 messages max
            if msg.get("content") and msg["content"] not in ("[interactive]", ""):
                contents.append({
                    "role": "user" if msg["role"] == "user" else "model",
                    "parts": [{"text": msg["content"]}],
                })

    # Current user message with KB context
    user_message = (
        f"User question: {user_query}\n\n"
        f"Context from knowledge base:\n{kb_context}\n\n"
        f"User language hint: {language}"
    )
    contents.append({
        "role": "user",
        "parts": [{"text": user_message}],
    })

    payload = {
        "contents": contents,
        "systemInstruction": {
            "parts": [{"text": SYSTEM_PROMPT}]
        },
        "generationConfig": {
            "temperature": settings.LLM_TEMPERATURE,
            "maxOutputTokens": settings.LLM_MAX_TOKENS,
            "topP": 0.9,
        },
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            GEMINI_URL,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=settings.LLM_API_TIMEOUT,
        )

    if resp.status_code != 200:
        logger.error(f"Gemini error: {resp.status_code} {resp.text}")
        return None

    data = resp.json()
    candidates = data.get("candidates", [])
    if not candidates:
        return None

    return candidates[0]["content"]["parts"][0]["text"].strip()


async def generate_summary(prompt: str) -> str | None:
    """Generate a plain-text summary using Gemini (no WhatsApp formatting)."""
    token = await _get_access_token()

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "systemInstruction": {
            "parts": [{"text": "You are an internal assistant that writes brief, clear summaries for support agents. Write in plain English only. No Arabic. No markdown. No bullet points. Just 2-3 concise sentences."}]
        },
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 200,
            "topP": 0.9,
        },
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            GEMINI_URL,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=settings.LLM_API_TIMEOUT,
        )

    if resp.status_code != 200:
        logger.error(f"Gemini summary error: {resp.status_code} {resp.text}")
        return None

    data = resp.json()
    candidates = data.get("candidates", [])
    if not candidates:
        return None

    return candidates[0]["content"]["parts"][0]["text"].strip()
