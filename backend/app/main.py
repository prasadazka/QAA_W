import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.webhook import router as webhook_router
from app.api.kb import router as kb_router
from app.core.config import settings

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(title="QAA AI Chatbot API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(webhook_router, tags=["webhook"])
app.include_router(kb_router)


@app.get("/")
async def root():
    return {"service": "QAA AI Chatbot API", "version": "0.1.0", "environment": settings.ENVIRONMENT}


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "qaa-chatbot-api"}
