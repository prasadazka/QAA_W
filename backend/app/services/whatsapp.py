import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

API_URL = settings.WHATSAPP_API_URL
API_KEY = settings.WHATSAPP_API_KEY
HEADERS = {
    "D360-API-KEY": API_KEY,
    "Content-Type": "application/json",
}


async def send_text_message(to: str, text: str) -> dict:
    """Send a text message via 360dialog WhatsApp API."""
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to,
        "type": "text",
        "text": {"body": text},
    }
    async with httpx.AsyncClient(verify=False) as client:
        response = await client.post(
            f"{API_URL}/messages",
            headers=HEADERS,
            json=payload,
            timeout=15.0,
        )
        result = response.json()
        logger.info(f"WhatsApp send to {to}: status={response.status_code}")
        return result


async def send_interactive_buttons(to: str, body: str, buttons: list[dict]) -> dict:
    """Send interactive button message. buttons = [{"id": "btn_1", "title": "Option 1"}, ...]"""
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {"text": body},
            "action": {
                "buttons": [
                    {"type": "reply", "reply": {"id": b["id"], "title": b["title"]}}
                    for b in buttons[:3]  # WhatsApp max 3 buttons
                ]
            },
        },
    }
    async with httpx.AsyncClient(verify=False) as client:
        response = await client.post(
            f"{API_URL}/messages",
            headers=HEADERS,
            json=payload,
            timeout=15.0,
        )
        return response.json()


async def send_interactive_list(to: str, body: str, button_text: str, sections: list[dict]) -> dict:
    """Send interactive list message for menu navigation."""
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to,
        "type": "interactive",
        "interactive": {
            "type": "list",
            "body": {"text": body},
            "action": {
                "button": button_text,
                "sections": sections,
            },
        },
    }
    async with httpx.AsyncClient(verify=False) as client:
        response = await client.post(
            f"{API_URL}/messages",
            headers=HEADERS,
            json=payload,
            timeout=15.0,
        )
        return response.json()


def parse_incoming_message(payload: dict) -> dict | None:
    """Parse 360dialog webhook payload and extract message details."""
    try:
        entry = payload.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])

        if not messages:
            return None

        msg = messages[0]
        contact = value.get("contacts", [{}])[0]

        result = {
            "from": msg.get("from", ""),
            "message_id": msg.get("id", ""),
            "timestamp": msg.get("timestamp", ""),
            "type": msg.get("type", "text"),
            "name": contact.get("profile", {}).get("name", ""),
        }

        if msg["type"] == "text":
            result["content"] = msg.get("text", {}).get("body", "")
        elif msg["type"] == "interactive":
            interactive = msg.get("interactive", {})
            if interactive.get("type") == "button_reply":
                result["content"] = interactive.get("button_reply", {}).get("title", "")
                result["button_id"] = interactive.get("button_reply", {}).get("id", "")
            elif interactive.get("type") == "list_reply":
                result["content"] = interactive.get("list_reply", {}).get("title", "")
                result["list_id"] = interactive.get("list_reply", {}).get("id", "")
        elif msg["type"] == "audio":
            result["media_id"] = msg.get("audio", {}).get("id", "")
            result["content"] = "[voice message]"
        elif msg["type"] == "image":
            result["media_id"] = msg.get("image", {}).get("id", "")
            result["content"] = msg.get("image", {}).get("caption", "[image]")
        elif msg["type"] == "document":
            result["media_id"] = msg.get("document", {}).get("id", "")
            result["content"] = msg.get("document", {}).get("filename", "[document]")
        else:
            result["content"] = f"[{msg['type']}]"

        return result

    except (KeyError, IndexError) as e:
        logger.error(f"Failed to parse webhook payload: {e}")
        return None
