"""
RAG Pipeline for NurAI nutrition Q&A.
Uses sentence-transformers for embeddings, ChromaDB for vector storage, Groq LLM for generation.
"""

import os
import logging
import hashlib
from pathlib import Path
from typing import List

from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

DOCUMENTS_DIR = Path(__file__).parent / "documents"
CHROMA_DIR = Path(__file__).parent / "chroma_db"
COLLECTION_NAME = "nurai_nutrition"
EMBED_MODEL = "all-MiniLM-L6-v2"
CHUNK_SIZE = 600
CHUNK_OVERLAP = 100
TOP_K = 5


class RAGPipeline:
    def __init__(self):
        self.embedder = None
        self.chroma_client = None
        self.collection = None
        self.groq_client = None
        self._initialized = False

    def initialize(self):
        if self._initialized:
            return
        logger.info("Initializing RAG pipeline...")

        self.embedder = SentenceTransformer(EMBED_MODEL)

        self.chroma_client = chromadb.PersistentClient(
            path=str(CHROMA_DIR),
            settings=Settings(anonymized_telemetry=False)
        )

        self.collection = self.chroma_client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )

        groq_key = os.environ.get("GROQ_API_KEY", "")
        if groq_key:
            self.groq_client = Groq(api_key=groq_key)
        else:
            logger.warning("GROQ_API_KEY not set — chat will use fallback responses")

        self._load_documents_if_needed()
        self._initialized = True
        logger.info("RAG pipeline ready.")

    def _chunk_text(self, text: str, source: str) -> List[dict]:
        """Split text into overlapping chunks."""
        chunks = []
        start = 0
        chunk_id = 0
        while start < len(text):
            end = min(start + CHUNK_SIZE, len(text))
            chunk = text[start:end].strip()
            if len(chunk) > 50:
                chunks.append({
                    "id": f"{source}_{chunk_id}",
                    "text": chunk,
                    "source": source
                })
                chunk_id += 1
            start += CHUNK_SIZE - CHUNK_OVERLAP
        return chunks

    def _get_documents_hash(self) -> str:
        """Hash all document content to detect changes."""
        combined = ""
        for doc_path in sorted(DOCUMENTS_DIR.glob("*.txt")):
            combined += doc_path.read_text(encoding="utf-8", errors="ignore")
        return hashlib.md5(combined.encode()).hexdigest()

    def _load_documents_if_needed(self):
        """Load documents into ChromaDB only if not already loaded or changed."""
        current_hash = self._get_documents_hash()
        existing_count = self.collection.count()

        # Check if we need to reload
        stored_meta = None
        try:
            if existing_count > 0:
                peek = self.collection.peek(limit=1)
                if peek["metadatas"] and peek["metadatas"][0].get("doc_hash") == current_hash:
                    logger.info(f"ChromaDB already has {existing_count} chunks, skipping reload.")
                    return
        except Exception:
            pass

        logger.info("Loading documents into ChromaDB...")
        if existing_count > 0:
            self.chroma_client.delete_collection(COLLECTION_NAME)
            self.collection = self.chroma_client.create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )

        all_chunks = []
        for doc_path in DOCUMENTS_DIR.glob("*.txt"):
            text = doc_path.read_text(encoding="utf-8", errors="ignore")
            source_name = doc_path.stem
            chunks = self._chunk_text(text, source_name)
            all_chunks.extend(chunks)
            logger.info(f"Loaded {len(chunks)} chunks from {doc_path.name}")

        if not all_chunks:
            logger.warning("No documents found in documents/ directory")
            return

        texts = [c["text"] for c in all_chunks]
        ids = [c["id"] for c in all_chunks]
        metadatas = [{"source": c["source"], "doc_hash": current_hash} for c in all_chunks]

        # Embed in batches
        batch_size = 64
        embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            batch_embeddings = self.embedder.encode(batch, show_progress_bar=False).tolist()
            embeddings.extend(batch_embeddings)

        self.collection.add(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas
        )
        logger.info(f"Indexed {len(all_chunks)} chunks total.")

    def _retrieve_context(self, question: str) -> List[dict]:
        """Find top-K relevant chunks for the question."""
        if self.collection.count() == 0:
            return []

        question_embedding = self.embedder.encode(question).tolist()
        results = self.collection.query(
            query_embeddings=[question_embedding],
            n_results=min(TOP_K, self.collection.count()),
            include=["documents", "metadatas", "distances"]
        )

        chunks = []
        for i, doc in enumerate(results["documents"][0]):
            distance = results["distances"][0][i]
            relevance = round(1 - distance, 3)
            if relevance > 0.2:  # Filter very irrelevant chunks
                chunks.append({
                    "text": doc,
                    "source": results["metadatas"][0][i].get("source", "unknown"),
                    "relevance": relevance
                })
        return chunks

    def _build_prompt(self, question: str, context_chunks: List[dict], language: str) -> str:
        language_instruction = {
            "ar": "Answer in Modern Standard Arabic (العربية الفصحى). Be simple and clear.",
            "hsn": "Answer in Hassaniya Arabic (الحسانية), the dialect spoken in Mauritania. Keep it natural.",
            "fr": "Répondez en français. Soyez clair et simple.",
            "en": "Answer in English. Be clear and simple."
        }.get(language, "Answer in the same language as the question.")

        context_text = "\n\n---\n\n".join([
            f"[Source: {c['source']}]\n{c['text']}"
            for c in context_chunks
        ])

        return f"""You are NurAI, a trusted child nutrition expert for Mauritania, created by UNICEF and WHO guidelines.
Your role is to help mothers understand child nutrition and malnutrition detection.

IMPORTANT RULES:
1. Answer ONLY based on the provided reference documents below
2. If the answer is not in the documents, say "I don't have information on this, please consult your health worker"
3. {language_instruction}
4. Use simple language that mothers with no medical background can understand
5. Be warm, supportive, and encouraging
6. For any emergency signs (child very weak, swelling, unconscious), always say to go to the health center immediately

REFERENCE DOCUMENTS:
{context_text}

QUESTION: {question}

Answer:"""

    def _fallback_answer(self, language: str) -> str:
        answers = {
            "ar": "أعتذر، لا أستطيع الإجابة على هذا السؤال الآن. يرجى استشارة العامل الصحي في منطقتك للحصول على مساعدة متخصصة.",
            "hsn": "مانعرفش نجاوبك على هاد السؤال. روح للمركز الصحي وسول الطبيب.",
            "fr": "Je suis désolé, je ne peux pas répondre à cette question pour le moment. Veuillez consulter un agent de santé.",
            "en": "I'm sorry, I cannot answer this question right now. Please consult your local health worker."
        }
        return answers.get(language, answers["ar"])

    def ask(self, question: str, language: str = "ar") -> dict:
        """Main RAG query: retrieve + generate."""
        if not self._initialized:
            self.initialize()

        context_chunks = self._retrieve_context(question)

        if not context_chunks:
            return {
                "answer": self._fallback_answer(language),
                "sources": [],
                "has_groq": False
            }

        if not self.groq_client:
            # No API key: return best matching chunk as answer
            best = context_chunks[0]["text"]
            return {
                "answer": best[:500] + ("..." if len(best) > 500 else ""),
                "sources": [c["source"] for c in context_chunks],
                "has_groq": False
            }

        prompt = self._build_prompt(question, context_chunks, language)

        try:
            completion = self.groq_client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=600,
                stream=False
            )
            answer = completion.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            answer = self._fallback_answer(language)

        unique_sources = list(dict.fromkeys([c["source"] for c in context_chunks]))
        return {
            "answer": answer,
            "sources": unique_sources,
            "has_groq": True
        }


# Singleton instance
rag = RAGPipeline()
