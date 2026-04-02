import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    ENVIRONMENT = os.getenv("ENVIRONMENT", "dev")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"

    # Database
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "qaa_dev")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
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


settings = Settings()
