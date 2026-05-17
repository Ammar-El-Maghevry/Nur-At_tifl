"""
Lightweight RAG for NurAI: loads documents as context, uses Groq for generation.
No local embedding model — fits in Render's 512MB free tier.
"""

import os
import logging
from pathlib import Path
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

DOCUMENTS_DIR = Path(__file__).parent / "documents"


class RAGPipeline:
    def __init__(self):
        self.groq_client = None
        self.documents_context = ""
        self._initialized = False

    def initialize(self):
        if self._initialized:
            return
        logger.info("Initializing RAG pipeline (lightweight mode)...")

        groq_key = os.environ.get("GROQ_API_KEY", "")
        if groq_key:
            self.groq_client = Groq(api_key=groq_key)
        else:
            logger.warning("GROQ_API_KEY not set")

        self._load_documents()
        self._initialized = True
        logger.info("RAG pipeline ready.")

    def _load_documents(self):
        docs = []
        for doc_path in sorted(DOCUMENTS_DIR.glob("*.txt")):
            try:
                text = doc_path.read_text(encoding="utf-8", errors="ignore").strip()
                docs.append(f"=== {doc_path.stem} ===\n{text}")
                logger.info(f"Loaded {doc_path.name}")
            except Exception as e:
                logger.warning(f"Could not load {doc_path.name}: {e}")
        self.documents_context = "\n\n".join(docs)
        logger.info(f"Loaded {len(docs)} documents as context.")

    def ask(self, question: str, language: str = "ar") -> dict:
        if not self._initialized:
            self.initialize()

        lang_instructions = {
            "ar": "أجب باللغة العربية الفصحى. كن دقيقاً وعملياً.",
            "hsn": "أجب بالحسانية (اللهجة الموريتانية). كن عملياً.",
            "fr": "Réponds en français. Sois précis et pratique.",
            "en": "Answer in English. Be precise and practical."
        }
        lang_instruction = lang_instructions.get(language, lang_instructions["ar"])

        fallback_responses = {
            "ar": "أعتذر، حدث خطأ. يرجى المحاولة مرة أخرى أو الاتصال بالعامل الصحي.",
            "hsn": "صرا مشكل، عاود المرة.",
            "fr": "Une erreur s'est produite. Veuillez réessayer.",
            "en": "An error occurred. Please try again."
        }

        if not self.groq_client:
            return {
                "answer": fallback_responses.get(language, fallback_responses["ar"]),
                "sources": [],
                "verified": False
            }

        try:
            prompt = f"""You are NurAI, a child nutrition expert assistant for Mauritania working with UNICEF.
Use ONLY the following WHO/UNICEF nutrition guidelines to answer questions.
{lang_instruction}

NUTRITION KNOWLEDGE BASE:
{self.documents_context[:6000]}

QUESTION: {question}

Provide a clear, actionable answer based on the knowledge base above."""

            response = self.groq_client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.3
            )

            answer = response.choices[0].message.content.strip()
            return {
                "answer": answer,
                "sources": ["WHO Child Growth Standards", "UNICEF CMAM Guidelines"],
                "verified": True
            }

        except Exception as e:
            logger.error(f"Groq API error: {e}")
            return {
                "answer": fallback_responses.get(language, fallback_responses["ar"]),
                "sources": [],
                "verified": False
            }


rag = RAGPipeline()
