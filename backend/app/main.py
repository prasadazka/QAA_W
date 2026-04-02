from fastapi import FastAPI

app = FastAPI(title="QAA AI Chatbot API", version="0.1.0")


@app.get("/")
async def root():
    return {"service": "QAA AI Chatbot API", "version": "0.1.0"}


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "qaa-chatbot-api"}
