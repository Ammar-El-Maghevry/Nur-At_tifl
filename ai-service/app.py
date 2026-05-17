"""
NurAI Python AI Service — FastAPI
Endpoints: POST /analyze (MUAC detection), POST /chat (RAG Q&A)
"""

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from muac_detector import analyze_image
from rag_pipeline import rag

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting NurAI AI Service...")
    try:
        rag.initialize()
        logger.info("RAG pipeline initialized successfully.")
    except Exception as e:
        logger.error(f"RAG initialization error (service still starts): {e}")
    yield
    logger.info("NurAI AI Service shutting down.")


app = FastAPI(
    title="NurAI AI Service",
    description="Child malnutrition detection and nutrition Q&A for Mauritania",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    question: str
    language: str = "ar"


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]
    verified: bool = True


class AnalyzeResponse(BaseModel):
    muac_value: float | None
    risk_level: str
    confidence: float
    advice: str
    arabic_advice: str
    arm_detected: bool
    detection_method: str


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "NurAI AI Service",
        "version": "1.0.0",
        "rag_ready": rag._initialized
    }


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_muac(file: UploadFile = File(...)):
    """
    Analyze an image to detect MUAC and classify malnutrition risk.
    Accepts any image format (JPEG, PNG, WebP).
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        # Allow anyway — be lenient for demo
        logger.warning(f"Non-image content type: {file.content_type}, processing anyway")

    try:
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")

        if len(image_bytes) > 20 * 1024 * 1024:  # 20MB limit
            raise HTTPException(status_code=400, detail="Image too large (max 20MB)")

        logger.info(f"Analyzing image: {file.filename}, size: {len(image_bytes)} bytes")
        result = analyze_image(image_bytes)
        muac_display = f"{result['muac_value']}cm" if result['muac_value'] is not None else "N/A"
        logger.info(f"Analysis result: MUAC={muac_display}, Risk={result['risk_level']}, Method={result['detection_method']}")

        return AnalyzeResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Answer nutrition questions using RAG pipeline (WHO/UNICEF documents + Groq LLM).
    Supports Arabic (ar), Hassaniya (hsn), French (fr), English (en).
    """
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    question = request.question.strip()[:1000]  # Limit question length
    language = request.language if request.language in ["ar", "hsn", "fr", "en"] else "ar"

    logger.info(f"Chat request: language={language}, question={question[:80]}...")

    try:
        result = rag.ask(question, language)
        return ChatResponse(
            answer=result["answer"],
            sources=result["sources"],
            verified=True
        )
    except Exception as e:
        logger.error(f"Chat failed: {e}", exc_info=True)
        fallback = {
            "ar": "أعتذر، حدث خطأ. يرجى المحاولة مرة أخرى أو الاتصال بالعامل الصحي.",
            "hsn": "صرا مشكل، عاود المرة.",
            "fr": "Une erreur s'est produite. Veuillez réessayer.",
            "en": "An error occurred. Please try again."
        }
        return ChatResponse(
            answer=fallback.get(request.language, fallback["ar"]),
            sources=[],
            verified=False
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", os.environ.get("AI_SERVICE_PORT", 8001)))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
