import logging
import json
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

# Vertex AI text-embedding endpoint
EMBEDDING_MODEL = "text-embedding-004"
VERTEX_URL = (
    f"https://{settings.GCP_REGION}-aiplatform.googleapis.com/v1/"
    f"projects/{settings.GCP_PROJECT_ID}/locations/{settings.GCP_REGION}/"
    f"publishers/google/models/{EMBEDDING_MODEL}:predict"
)


async def _get_access_token() -> str:
    """Get GCP access token from metadata server (Cloud Run) or local credentials."""
    try:
        # On Cloud Run: use metadata server
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
                headers={"Metadata-Flavor": "Google"},
                timeout=5.0,
            )
            if resp.status_code == 200:
                return resp.json()["access_token"]
    except Exception:
        pass

    # Local: use gcloud
    import subprocess
    result = subprocess.run(
        ["gcloud", "auth", "print-access-token"],
        capture_output=True, text=True, timeout=10,
    )
    return result.stdout.strip()


async def get_embeddings(texts: list[str]) -> list[list[float]]:
    """Get embeddings from Vertex AI text-embedding model.

    Args:
        texts: List of text strings to embed (max 250 per batch).

    Returns:
        List of embedding vectors (768 dimensions each).
    """
    if not texts:
        return []

    token = await _get_access_token()

    instances = [{"content": t} for t in texts]
    payload = {
        "instances": instances,
        "parameters": {"outputDimensionality": 768},
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            VERTEX_URL,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=30.0,
        )

    if resp.status_code != 200:
        logger.error(f"Vertex AI embedding error: {resp.status_code} {resp.text}")
        raise RuntimeError(f"Embedding API error: {resp.status_code}")

    data = resp.json()
    return [pred["embeddings"]["values"] for pred in data["predictions"]]


async def get_embedding(text: str) -> list[float]:
    """Get embedding for a single text."""
    results = await get_embeddings([text])
    return results[0]
