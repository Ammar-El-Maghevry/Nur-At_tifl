# NurAI — Smart Nutrition Detection for Children

> **Nouakchott AI Build Hackathon 2026 — UNICEF Track**
> Detect child malnutrition in 3 seconds using AI-powered MUAC screening.

---

## What is NurAI?

NurAI is a mobile-first web app that helps Mauritanian mothers detect child malnutrition at home. A mother takes a photo of her child's upper arm → AI measures the MUAC (Mid-Upper Arm Circumference) → classifies malnutrition risk (Normal / Moderate / Severe) → if severe, alerts to the nearest health center. The app also features an AI nutrition chat powered by WHO/UNICEF documents.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (TypeScript, Tailwind CSS, Framer Motion) |
| Backend | Spring Boot 3.2 (Java 17, Spring Security JWT, JPA) |
| Database | SQLite |
| AI Service | Python FastAPI, MediaPipe, OpenCV, ChromaDB, Groq LLM |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |

---

## Quick Start (3 Terminals)

### Prerequisites
- Java 17+
- Python 3.10+
- Node.js 18+
- A free Groq API key from [console.groq.com](https://console.groq.com)

---

### Terminal 1 — AI Service (Python)

```bash
cd ai-service

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate    # Linux/Mac
# OR: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Configure your Groq API key
cp .env.example .env
# Edit .env and set: GROQ_API_KEY=your_key_here

# Start the AI service
python app.py
```

Runs on: **http://localhost:8001**

---

### Terminal 2 — Backend (Spring Boot)

```bash
cd backend

# If Maven is installed (recommended):
mvn spring-boot:run

# OR with the Maven wrapper (downloads Maven automatically):
# Windows:
mvnw.cmd spring-boot:run
# Linux/Mac:
chmod +x mvnw && ./mvnw spring-boot:run
```

> **Install Maven:** Download from https://maven.apache.org/download.cgi and add to PATH.
> On first run, Maven downloads dependencies (~2 minutes). The SQLite database (`nurai.db`) is created automatically with 15 Mauritanian health centers pre-populated.

Runs on: **http://localhost:8080**

---

### Terminal 3 — Frontend (Next.js)

```bash
cd frontend

npm install
npm run dev
```

Runs on: **http://localhost:3000**

---

## Features

### MUAC Screening
- Camera capture or photo upload
- AI measures MUAC using MediaPipe + OpenCV
- Color-coded risk classification: 🟢 Normal (≥12.5cm) · 🟡 Moderate (11.5–12.4cm) · 🔴 Severe (<11.5cm)
- Nutrition advice in Arabic/French
- For severe cases: automatic nearest health center lookup

### AI Nutrition Chat
- RAG pipeline: WHO/UNICEF documents embedded in ChromaDB
- Answers in Arabic, Hassaniya, or French
- "Verified by WHO/UNICEF" badge on all responses
- Groq LLaMA 3 for fast, accurate responses

### Health Centers
- 15 real Mauritanian health centers pre-loaded
- Filter by wilaya
- GPS-based nearest center finder
- One-tap calling

### Child Management
- Track multiple children
- Full screening history per child
- MUAC trend tracking

---

## API Endpoints

### Auth
```
POST /api/auth/register    Register new user
POST /api/auth/login       Login, returns JWT
GET  /api/auth/me          Current user profile
```

### Children
```
GET  /api/children         List user's children
POST /api/children         Add a child
GET  /api/children/{id}    Get child details
```

### Screening
```
POST /api/screening/analyze     Upload image + childId → MUAC result
GET  /api/screening/history     All screenings for current user
GET  /api/screening/history/{childId}   Screenings for specific child
GET  /api/screening/{id}        Single screening result
```

### Chat
```
POST /api/chat/ask    { question, language } → RAG-powered answer
```

### Health Centers
```
GET /api/health-centers              All centers (optional ?wilaya=X)
GET /api/health-centers/nearest?lat=X&lng=Y   5 nearest centers
```

---

## Project Structure

```
nurai/
├── ai-service/               Python FastAPI AI microservice
│   ├── app.py                FastAPI server
│   ├── muac_detector.py      MediaPipe + OpenCV MUAC detection
│   ├── rag_pipeline.py       RAG: embeddings + ChromaDB + Groq
│   ├── documents/            WHO/UNICEF knowledge base (5 files)
│   ├── requirements.txt
│   └── .env.example
│
├── backend/                  Spring Boot REST API
│   ├── src/main/java/com/nurai/
│   │   ├── controller/       REST endpoints (5 controllers)
│   │   ├── service/          Business logic (6 services)
│   │   ├── model/            JPA entities (4 models)
│   │   ├── repository/       Data access (4 repositories)
│   │   ├── security/         JWT auth filter + token provider
│   │   ├── config/           Security, CORS, WebClient config
│   │   └── dto/              Request/response DTOs
│   └── src/main/resources/
│       ├── application.yml   Configuration
│       └── data.sql          Health centers seed data
│
├── frontend/                 Next.js 14 TypeScript app
│   ├── app/
│   │   ├── page.tsx          Landing page (stunning hero)
│   │   ├── login/            Login page
│   │   ├── register/         Registration with language selection
│   │   ├── dashboard/        Main dashboard
│   │   ├── screening/new/    Camera capture + AI analysis
│   │   ├── screening/[id]/   Result detail page
│   │   ├── history/          Screening history
│   │   ├── chat/             AI nutrition chat (WhatsApp-style)
│   │   └── health-centers/   Health center finder
│   ├── components/           Reusable UI components
│   └── services/api.ts       Axios API client
│
└── README.md
```

---

## MUAC Reference

| MUAC | Status | Color | Action |
|------|--------|-------|--------|
| ≥ 12.5 cm | Normal | 🟢 | Continue healthy feeding |
| 11.5–12.4 cm | Moderate | 🟡 | Supplementary feeding, visit health center |
| < 11.5 cm | Severe | 🔴 | **URGENT** — go to health center immediately |

---

## Troubleshooting

**AI service won't start:**
- Ensure Python 3.10+ is installed
- Run `pip install -r requirements.txt` again
- MediaPipe requires Python < 3.12 on some platforms

**Backend won't start:**
- Ensure Java 17+ is installed: `java -version`
- Delete `nurai.db` if you want a fresh start
- Check port 8080 is not in use

**Frontend can't connect to backend:**
- Ensure backend is running on port 8080
- The `next.config.js` proxies `/api/*` requests automatically

**RAG chat gives "service unavailable":**
- Add your GROQ_API_KEY to `ai-service/.env`
- The app works without Groq (returns best-matching document chunk)

---

## Built with ❤️ for Mauritanian Children

This project was built for the Nouakchott AI Build Hackathon 2026, UNICEF Track.
Our mission: make malnutrition screening accessible to every mother in Mauritania.

*"Every child deserves a healthy start — كل طفل يستحق بداية صحية"*
