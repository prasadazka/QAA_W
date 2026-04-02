import os
from dotenv import load_dotenv

load_dotenv()


def _int(key: str, default: int) -> int:
    return int(os.getenv(key, str(default)))


def _float(key: str, default: float) -> float:
    return float(os.getenv(key, str(default)))


class Settings:
    ENVIRONMENT = os.getenv("ENVIRONMENT", "dev")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"

    # Database
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "qaa_dev")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    CLOUD_SQL_INSTANCE = os.getenv("CLOUD_SQL_INSTANCE", "")
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}",
    )

    # WhatsApp 360dialog
    WHATSAPP_API_URL = os.getenv("WHATSAPP_API_URL", "https://waba-v2.360dialog.io")
    WHATSAPP_API_KEY = os.getenv("WHATSAPP_API_KEY", "")

    # GCP
    GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "qaaw-492106")
    GCP_REGION = os.getenv("GCP_REGION", "me-central1")
    GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "")

    # RAG — Embedding
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-004")
    EMBEDDING_DIMENSIONS = _int("EMBEDDING_DIMENSIONS", 768)
    EMBEDDING_BATCH_SIZE = _int("EMBEDDING_BATCH_SIZE", 250)
    EMBEDDING_API_TIMEOUT = _float("EMBEDDING_API_TIMEOUT", 30.0)

    # RAG — Chunking
    CHUNK_SIZE = _int("CHUNK_SIZE", 500)
    CHUNK_MIN_LENGTH = _int("CHUNK_MIN_LENGTH", 20)
    CHUNK_MAX_KEYWORDS = _int("CHUNK_MAX_KEYWORDS", 8)

    # RAG — Search
    SIMILARITY_THRESHOLD = _float("SIMILARITY_THRESHOLD", 0.5)
    SEARCH_RESULT_LIMIT = _int("SEARCH_RESULT_LIMIT", 3)
    DEFAULT_CHANNEL = os.getenv("DEFAULT_CHANNEL", "whatsapp_registration")

    # RAG — LLM (Gemini)
    LLM_MODEL = os.getenv("LLM_MODEL", "gemini-2.5-flash")
    LLM_REGION = os.getenv("LLM_REGION", "us-central1")
    LLM_TEMPERATURE = _float("LLM_TEMPERATURE", 0.3)
    LLM_MAX_TOKENS = _int("LLM_MAX_TOKENS", 512)
    LLM_API_TIMEOUT = _float("LLM_API_TIMEOUT", 15.0)

    # Admin / Auth
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "qaa-dev-secret-change-in-prod")
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRY_HOURS = _int("JWT_EXPIRY_HOURS", 24)
    ADMIN_DEFAULT_EMAIL = os.getenv("ADMIN_DEFAULT_EMAIL", "admin@qaa.edu.qa")
    ADMIN_DEFAULT_PASSWORD = os.getenv("ADMIN_DEFAULT_PASSWORD", "")


settings = Settings()
