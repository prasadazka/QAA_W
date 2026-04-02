import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

VERTEX_URL = (
    f"https://{settings.GCP_REGION}-aiplatform.googleapis.com/v1/"
    f"projects/{settings.GCP_PROJECT_ID}/locations/{settings.GCP_REGION}/"
    f"publishers/google/models/{settings.EMBEDDING_MODEL}:predict"
)


async def _get_access_token() -> str:
    """Get GCP access token from metadata server (Cloud Run) or local gcloud."""
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


async def get_embeddings(texts: list[str]) -> list[list[float]]:
    """Batch embed via Vertex AI. Respects EMBEDDING_BATCH_SIZE config."""
    if not texts:
        return []

    token = await _get_access_token()
    all_embeddings = []

    for i in range(0, len(texts), settings.EMBEDDING_BATCH_SIZE):
        batch = texts[i : i + settings.EMBEDDING_BATCH_SIZE]
        payload = {
            "instances": [{"content": t} for t in batch],
            "parameters": {"outputDimensionality": settings.EMBEDDING_DIMENSIONS},
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                VERTEX_URL,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=settings.EMBEDDING_API_TIMEOUT,
            )

        if resp.status_code != 200:
            logger.error(f"Vertex AI error: {resp.status_code} {resp.text}")
            raise RuntimeError(f"Embedding API error: {resp.status_code}")

        data = resp.json()
        all_embeddings.extend(
            pred["embeddings"]["values"] for pred in data["predictions"]
        )

    return all_embeddings


async def get_embedding(text: str) -> list[float]:
    """Embed a single text string."""
    results = await get_embeddings([text])
    return results[0]
