import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.webhook import router as webhook_router
from app.api.kb import router as kb_router
from app.admin.api import router as admin_api_router
from app.core.config import settings

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(title="QAA AI Chatbot API", version="0.1.0")

# CORS — allow frontend origins
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(webhook_router, tags=["webhook"])
app.include_router(kb_router)
app.include_router(admin_api_router, tags=["admin"])


@app.get("/")
async def root():
    return {"service": "QAA AI Chatbot API", "version": "0.1.0", "environment": settings.ENVIRONMENT}


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "qaa-chatbot-api"}
