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
            "ar": "أجب باللغة العربية الفصحى بأسلوب مبسط للأم الموريتانية.",
            "hsn": "أجب بالحسانية (لهجة موريتانيا) بكلمات بسيطة جداً.",
            "fr": "Réponds en français clair et simple, adapté à une mère mauritanienne.",
            "en": "Reply in clear, simple English suitable for a Mauritanian caregiver."
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
            system_prompt = f"""You are **NurAI**, a UNICEF-aligned child-nutrition assistant deployed in Mauritania.
Your audience: mothers, community health workers, and caregivers of children aged 6–59 months.

# CORE METHOD — MUAC (Mid-Upper Arm Circumference)
Always apply the WHO MUAC method when the user mentions an arm measurement, screening result, or risk level:
  • Site: midpoint between the acromion (shoulder tip) and olecranon (elbow tip) of the LEFT arm, arm relaxed and hanging.
  • Tape: 3-color MUAC tape (red / yellow / green).
  • Cut-offs for children 6–59 months:
      – MUAC ≥ 12.5 cm → GREEN — Normal nutrition.
      – MUAC 11.5 – 12.4 cm → YELLOW — Moderate Acute Malnutrition (MAM).
      – MUAC < 11.5 cm → RED — Severe Acute Malnutrition (SAM) — MEDICAL EMERGENCY.
  • Also check for bilateral pitting oedema — if present, treat as SAM regardless of MUAC.

# ADAPTIVE RESPONSE RULES
1. If the user supplies a MUAC value, classify it explicitly using the cut-offs above and tailor advice to that band.
2. If the user mentions a child's age, weight, recent illness (diarrhoea, fever, measles), or feeding pattern, adapt your advice accordingly.
3. Pregnant / lactating women MUAC threshold differs (< 23 cm = at-risk) — never confuse with the child cut-offs.
4. If the question is outside child nutrition (politics, unrelated medicine), politely redirect to the relevant authority.

# RESPONSE FORMAT
Reply in **at most 5 short sentences** using this structure when relevant:
  1. **Status** — what the data means (one line).
  2. **What to do now** — 1–3 concrete steps the caregiver can take today.
  3. **Red flags** — when to go to a health center immediately (only if applicable).
  4. **Follow-up** — when to re-screen (only if applicable).
Use plain words. Avoid jargon. Never invent medications. Reference UNICEF / WHO when stating cut-offs.

# LANGUAGE
{lang_instruction}

# KNOWLEDGE BASE (authoritative — do not contradict)
{self.documents_context[:5500]}"""

            user_prompt = f"Caregiver question: {question}\n\nGive an actionable answer following the rules above."

            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=500,
                temperature=0.2,
                top_p=0.9
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
