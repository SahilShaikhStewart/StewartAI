# 🧠 Stewart Title Intelligence Platform

> **Stewart India TBS AI Ideathon 2026** — Team Entry  
> AI-powered title insurance platform with Document Intelligence, Knowledge Assistant, Risk Dashboard, and Platform Metrics

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Features](#features)
- [Demo Data](#demo-data)
- [Deployment](#deployment)
- [Team](#team)

---

## Overview

The **Stewart Title Intelligence Platform** is a unified web application that demonstrates AI-powered features for the title insurance industry. Built for the Stewart India TBS AI Ideathon 2026, it showcases how generative AI can transform document processing, knowledge management, and risk assessment.

### Key Features

1. **🏠 Landing Page** — Animated hero with 3D scroll effect, before/after comparison slider, intelligence loop diagram, and Stewart brand gradient design
2. **📄 Document Intelligence** — Upload title documents (PDFs, images, handwritten docs) for AI-powered analysis, entity extraction, defect detection, and risk assessment
3. **💬 Knowledge Assistant** — RAG-based chatbot trained on 10 title insurance knowledge documents, providing sourced answers with citations and relevance scores
4. **📊 Risk Dashboard** — AI-driven risk analytics with interactive charts, state-level risk data, and real-time risk assessment form
5. **📈 Platform Metrics** — Real-time audit trail showing all AI operations, processing times, model versions, and system health

All AI features are powered by **Google Gemini 2.5 Flash** (text generation) and **Gemini Embedding** (vector embeddings) via REST API.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    StewartAI.Web                         │
│          React 19 + Vite + TanStack Router              │
│  (Landing | Documents | Chat | Risk | Metrics)          │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST (Axios)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    StewartAI.Api                         │
│              ASP.NET Core 9 Web API                     │
│         Controllers + Middleware + CORS                  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│                 StewartAI.Application                    │
│     Services + DTOs + Business Logic                    │
│  (DocumentAnalysis | Chat/RAG | Risk | KnowledgeBase)   │
└──────────┬───────────────────────────┬──────────────────┘
           │                           │
           ▼                           ▼
┌──────────────────────┐  ┌───────────────────────────────┐
│  StewartAI.Domain    │  │  StewartAI.Infrastructure     │
│  Entities + Models   │  │  EF Core + SQLite DbContext   │
│  Exceptions          │  │                               │
└──────────────────────┘  └───────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│              Google Cloud Platform                       │
│  Gemini 2.5 Flash  |  Gemini Embedding                  │
│  (gemini-embedding-001)                                 │
└─────────────────────────────────────────────────────────┘
```

**Pattern**: Clean Architecture (4-project solution)  
**Inspired by**: SignersChoice.Files multi-project structure

---

## Project Structure

```
StewartAI/
├── StewartAI.sln                    # .NET Solution file
├── Dockerfile                       # Multi-stage Docker build (Node + .NET)
├── .gitignore                       # .NET + Node.js ignores
├── .dockerignore                    # Docker build exclusions
├── README.md                        # This file
├── DEPLOY.md                        # GCP Cloud Run deployment guide
├── GCP_SETUP_GUIDE.md               # Google Cloud API key setup
│
├── StewartAI.Domain/                # 🏛️ Domain Layer (no dependencies)
│   ├── Entities/                    # DocumentAnalysis, Conversation, KnowledgeChunk, RiskRecord
│   ├── Models/Gemini/               # GeminiRequest, GeminiResponse
│   └── Exceptions/                  # BusinessException, NotFoundException
│
├── StewartAI.Infrastructure/        # 🔧 Infrastructure Layer
│   └── Persistence/
│       └── AppDbContext.cs           # EF Core DbContext (SQLite)
│
├── StewartAI.Application/           # ⚙️ Application Layer (business logic)
│   ├── DTOs/
│   │   ├── Documents/               # DocumentAnalysisResponse, ExtractedEntity, TitleDefect
│   │   ├── Chat/                    # ChatRequest/Response, SourceCitation, ConversationHistory
│   │   └── Risk/                    # RiskAssessmentRequest/Response, RiskSummary, StateRisk
│   └── Services/
│       ├── GeminiService.cs         # Google Gemini API client (text + vision + embeddings)
│       ├── DocumentAnalysisService  # PDF/image parsing + AI analysis + multimodal vision
│       ├── ChatService.cs           # RAG pipeline (embed → search → generate)
│       ├── KnowledgeBaseService.cs  # Document chunking + vector storage + auto-seed
│       └── RiskService.cs           # AI risk assessment + synthetic data generation
│
├── StewartAI.Api/                   # 🌐 API Layer (ASP.NET Core 9)
│   ├── Controllers/
│   │   ├── DocumentAnalysisController.cs  # POST /api/documents/analyze, demo docs
│   │   ├── ChatController.cs              # POST /api/chat, knowledge base seed
│   │   ├── RiskController.cs              # POST /api/risk/assess, seed data
│   │   └── HealthController.cs            # GET /api/health, metrics, Gemini check
│   ├── SeedData/
│   │   ├── KnowledgeBase/           # 10 title insurance knowledge documents
│   │   └── DemoDocuments/           # 3 sample documents for one-click analysis
│   ├── Middleware/
│   │   └── ExceptionHandlingMiddleware.cs
│   ├── ServiceRegistration.cs       # DI container setup
│   ├── Program.cs                   # App entry point (auto-seeds KB on startup)
│   └── appsettings.json             # Configuration (GCP, SQLite, CORS)
│
└── StewartAI.Web/                   # 💻 Frontend (React 19 + Vite 7)
    ├── package.json                 # Dependencies
    ├── vite.config.ts               # Vite config (port 3000, @ alias)
    ├── tailwind.config.ts           # Tailwind + Stewart brand colors (#003366)
    ├── tsconfig.json                # TypeScript config
    ├── components.json              # Shadcn UI config (new-york style)
    ├── index.html                   # HTML entry point
    └── src/
        ├── main.tsx                 # React entry point
        ├── App.tsx                  # TanStack Router (5 routes)
        ├── styles/index.css         # Tailwind + Stewart theme CSS variables
        ├── types/api.ts             # TypeScript types (mirrors backend DTOs)
        ├── lib/
        │   ├── utils.ts             # cn(), formatDate(), getRiskColor()
        │   └── api/                 # Axios API client modules
        │       ├── client.ts        # Base Axios instance → localhost:5264
        │       ├── documents.ts     # documentsApi.analyze(), getDemoDocuments()
        │       ├── chat.ts          # chatApi.ask(), seedKnowledgeBase()
        │       ├── risk.ts          # riskApi.assess(), getSummary(), seedData()
        │       └── health.ts        # healthApi.check(), getMetrics()
        ├── components/
        │   ├── layout/              # Header (nav), MainLayout (gradient shell)
        │   └── ui/                  # Shadcn components + custom animations
        │       ├── container-scroll-animation.tsx  # 3D scroll hero effect
        │       ├── animated-hero.tsx               # Animated stat counters
        │       ├── feature-comparison.tsx          # Before/after slider
        │       └── ...                             # 12+ Shadcn components
        └── app/
            ├── home/                # Landing page (hero, comparison, features, loop)
            ├── documents/           # DocumentAnalysisPage (upload + demo docs + results)
            ├── chat/                # ChatPage (RAG chatbot with deduplicated sources)
            ├── dashboard/           # RiskDashboardPage (charts + assessment form)
            └── metrics/             # MetricsPage (audit trail + processing stats)
```

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| .NET | 9.0 | Runtime |
| ASP.NET Core | 9.0 | Web API framework |
| Entity Framework Core | 9.0 | ORM (SQLite) |
| iText7 | 9.1.0 | PDF text extraction |
| Google Gemini | 2.5 Flash | AI text generation + multimodal vision |
| Gemini Embedding | gemini-embedding-001 | Vector embeddings for RAG |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework |
| Vite | 7.3 | Build tool + dev server |
| TypeScript | 5.9 | Type safety |
| TanStack Router | 1.143 | Client-side routing |
| TanStack React Query | 5.90 | Server state management |
| Shadcn UI | new-york | Component library (Radix + Tailwind) |
| Tailwind CSS | 3.4 | Utility-first CSS |
| Framer Motion | 12.6 | Scroll animations + transitions |
| Chart.js | 4.5 | Dashboard charts (Doughnut, Bar) |
| Axios | 1.13 | HTTP client |
| Lucide React | 0.562 | Icons |

---

## Getting Started

### Prerequisites
- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js 20+](https://nodejs.org/) (with npm)
- [Google Cloud API Key](./GCP_SETUP_GUIDE.md) (for AI features)

### 1. Clone the repo
```bash
git clone https://github.com/SahilShaikhStewart/StewartAI.git
cd StewartAI
```

### 2. Backend Setup
```bash
cd StewartAI.Api
dotnet restore

# Add your GCP API key (create this file — it's gitignored)
# Create appsettings.Development.json:
# {
#   "GCP": {
#     "ApiKey": "YOUR_GEMINI_API_KEY_HERE"
#   }
# }

dotnet run
```
Backend starts at **http://localhost:5264**  
Swagger UI at **http://localhost:5264/swagger**

> **Note:** The knowledge base auto-seeds 10 title insurance documents on first startup.

### 3. Frontend Setup (new terminal)
```bash
cd StewartAI.Web
npm install
npm run dev
```
Frontend starts at **http://localhost:3000** (auto-opens browser)

### 4. Open the app
Navigate to **http://localhost:3000** — you'll see the landing page with:
- **Home** → Animated landing page with problem statement, comparison slider, and feature overview
- **Documents** → Upload PDFs/images for AI analysis (or use one-click demo documents)
- **Knowledge Assistant** → Chat with the AI about title insurance (seed the knowledge base first)
- **Risk Dashboard** → View risk analytics and run assessments (seed demo data first)
- **Metrics** → Real-time audit trail of all AI operations

---

## API Endpoints

### Document Analysis
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/analyze` | Upload & analyze a document (PDF, image, handwritten) |
| `GET` | `/api/documents` | List all analyses |
| `GET` | `/api/documents/{id}` | Get specific analysis |
| `GET` | `/api/documents/demo` | List available demo documents |
| `POST` | `/api/documents/demo/analyze/{fileName}` | Analyze a demo document by name |

### Chat / Knowledge Assistant
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Send message (RAG pipeline) |
| `GET` | `/api/chat/history` | List conversations |
| `GET` | `/api/chat/history/{id}` | Get conversation |
| `POST` | `/api/chat/knowledge-base/ingest` | Ingest document into KB |
| `GET` | `/api/chat/knowledge-base/stats` | KB statistics |
| `POST` | `/api/chat/knowledge-base/seed` | Seed KB with 10 title insurance docs |

### Risk Dashboard
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/risk/assess` | AI risk assessment |
| `GET` | `/api/risk/summary` | Aggregated risk summary |
| `GET` | `/api/risk/by-state` | Risk scores by state |
| `POST` | `/api/risk/seed` | Seed synthetic demo data |

### Health & Metrics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | API health check |
| `GET` | `/api/health/metrics` | Platform metrics (documents, chats, risks, processing times) |
| `GET` | `/api/health/gemini` | Gemini API connectivity check |
| `GET` | `/api/health/embedding` | Embedding API connectivity check |

---

## Features

### 🏠 Landing Page
- Animated 3D scroll hero with Stewart branding
- Before/after comparison slider (manual process vs. AI-powered)
- Scrolling marquee with industry statistics
- Intelligence loop diagram (Upload → AI Analyzes → Results → Auto-ingests for RAG)
- Stewart blue gradient design (`#003366` → transparent)
- Glass-morphism card effects with backdrop blur

### 📄 Document Intelligence
- Drag-and-drop upload (PDF, images, handwritten documents)
- **Multimodal vision**: Gemini analyzes photos and scanned handwritten docs directly
- AI-powered document classification (deed, title commitment, survey, mortgage, etc.)
- Entity extraction (names, addresses, legal descriptions, dates, amounts)
- Title defect detection with severity levels (Critical, High, Medium, Low)
- Risk assessment with detailed explanation
- **3 one-click demo documents** for instant presentations:
  - Sample Warranty Deed
  - Sample Title Commitment
  - Sample Mortgage / Deed of Trust
- Analysis history with quick-access sidebar

### 💬 Knowledge Assistant (RAG)
- Conversational AI chatbot with Stewart branding
- RAG pipeline: chunk → embed → cosine similarity → context injection
- Source citations with relevance scores (deduplicated per document)
- **10 pre-built knowledge documents** covering:
  - Title insurance fundamentals
  - Common title defects
  - Underwriting guidelines
  - Closing process & escrow
  - State-specific requirements
  - Lien types & priority
  - Fraud prevention & red flags
  - RON & digital closings
  - Real estate closing documents
  - Compliance & regulatory framework
- Knowledge base ingestion (PDF/TXT upload)
- Conversation history
- Suggested questions for quick start

### 📊 Risk Dashboard
- Summary cards (total records, avg risk, high risk count, claim rate)
- Doughnut chart (risk distribution by level)
- Bar chart (top risk states)
- State risk table with color-coded badges
- AI risk assessment form (state, county, property type, transaction type, price, notes)
- Seed demo data button for instant presentations

### 📈 Platform Metrics & Audit Trail
- Real-time system health monitoring
- Document analysis statistics (total, by type, vision vs. text)
- Chat/RAG statistics (conversations, messages, knowledge chunks)
- Risk assessment statistics (total, by risk level)
- Processing time tracking for all AI operations
- Gemini model version display
- Auto-refresh capability

---

## Demo Data

The platform includes built-in demo data for presentations:

### Knowledge Base (auto-seeds on startup)
10 comprehensive title insurance documents in `StewartAI.Api/SeedData/KnowledgeBase/`:
- `01-title-insurance-fundamentals.txt`
- `02-common-title-defects.txt`
- `03-underwriting-guidelines.txt`
- `04-closing-process-and-escrow.txt`
- `05-state-specific-requirements.txt`
- `06-lien-types-and-priority.txt`
- `07-fraud-prevention-and-red-flags.txt`
- `08-ron-and-digital-closings.txt`
- `09-real-estate-closing-documents.txt`
- `10-compliance-and-regulatory-framework.txt`

### Demo Documents (one-click analyze)
3 sample title documents in `StewartAI.Api/SeedData/DemoDocuments/`:
- `sample-warranty-deed.txt`
- `sample-title-commitment.txt`
- `sample-mortgage-deed-of-trust.txt`

### Risk Data (seed via UI button)
Synthetic risk records across all 50 US states with varied risk levels, property types, and transaction types.

---

## Deployment

### GCP Cloud Run (Production)

See [DEPLOY.md](./DEPLOY.md) for detailed step-by-step instructions.

**Quick deploy (5 commands):**
```bash
# 1. Set project
gcloud config set project YOUR_PROJECT_ID

# 2. Enable APIs
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# 3. Build with Cloud Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/stewart-ai

# 4. Deploy to Cloud Run
gcloud run deploy stewart-ai \
  --image gcr.io/YOUR_PROJECT_ID/stewart-ai \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --set-env-vars "GCP__ApiKey=YOUR_GEMINI_API_KEY,ASPNETCORE_ENVIRONMENT=Production"

# 5. Get URL
gcloud run services describe stewart-ai --region us-central1 --format="value(status.url)"
```

### Local Docker Testing
```bash
docker build -t stewart-ai .
docker run -p 8080:8080 -e GCP__ApiKey=YOUR_KEY -e ASPNETCORE_ENVIRONMENT=Production stewart-ai
# Open http://localhost:8080
```

### Database
- **Development**: SQLite (file-based, auto-created)
- **Production**: SQLite (ephemeral on Cloud Run, auto-seeds on startup)
- Knowledge base auto-seeds 10 documents on every startup — no manual setup needed

---

*Built for the Stewart India TBS AI Ideathon 2026*
