# 🧠 Stewart Title Intelligence Platform

> **Stewart India TBS AI Ideathon 2026** — Team Entry  
> AI-powered title insurance platform with Document Intelligence, Knowledge Assistant, and Risk Dashboard

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Features](#features)
- [Deployment](#deployment)
- [Team](#team)

---

## Overview

The **Stewart Title Intelligence Platform** is a unified web application that demonstrates 3 AI-powered features for the title insurance industry:

1. **📄 Document Intelligence** — Upload title documents (PDFs) for AI-powered analysis, entity extraction, defect detection, and risk assessment
2. **💬 Knowledge Assistant** — RAG-based chatbot trained on title insurance knowledge, providing sourced answers with citations
3. **📊 Risk Dashboard** — AI-driven risk analytics with interactive charts, state-level risk heatmap, and real-time risk assessment

All AI features are powered by **Google Gemini 1.5 Flash** via REST API.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    StewartAI.Web                         │
│          React 19 + Vite + TanStack Router              │
│     (Document Analysis | Chat | Risk Dashboard)         │
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
│  Exceptions          │  │  (Cloud SQL PostgreSQL prod)  │
└──────────────────────┘  └───────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│              Google Cloud Platform                       │
│  Gemini 1.5 Flash API  |  Vertex AI Embeddings         │
│  (text-embedding-004)                                   │
└─────────────────────────────────────────────────────────┘
```

**Pattern**: Clean Architecture (4-project solution)  
**Inspired by**: SignersChoice.Files multi-project structure

---

## Project Structure

```
StewartAI/
├── StewartAI.sln                    # .NET Solution file
├── .gitignore                       # .NET + Node.js ignores
├── README.md                        # This file
├── GCP_SETUP_GUIDE.md               # Google Cloud setup instructions
│
├── StewartAI.Domain/                # 🏛️ Domain Layer (no dependencies)
│   ├── Entities/                    # DocumentAnalysis, Conversation, KnowledgeChunk, RiskRecord
│   ├── Models/Gemini/               # GeminiRequest, GeminiResponse
│   └── Exceptions/                  # BusinessException, NotFoundException
│
├── StewartAI.Infrastructure/        # 🔧 Infrastructure Layer
│   └── Persistence/
│       └── AppDbContext.cs           # EF Core DbContext (SQLite / PostgreSQL)
│
├── StewartAI.Application/           # ⚙️ Application Layer (business logic)
│   ├── DTOs/
│   │   ├── Documents/               # DocumentAnalysisRequest/Response, ExtractedEntity, TitleDefect
│   │   ├── Chat/                    # ChatRequest/Response, SourceCitation, ConversationHistory
│   │   └── Risk/                    # RiskAssessmentRequest/Response, RiskSummary, StateRisk
│   └── Services/
│       ├── GeminiService.cs         # Google Gemini API client + embeddings
│       ├── DocumentAnalysisService  # PDF parsing (iText7) + AI analysis
│       ├── ChatService.cs           # RAG pipeline (embed → search → generate)
│       ├── KnowledgeBaseService.cs  # Document chunking + vector storage
│       └── RiskService.cs           # AI risk assessment + synthetic data
│
├── StewartAI.Api/                   # 🌐 API Layer (ASP.NET Core 9)
│   ├── Controllers/
│   │   ├── DocumentAnalysisController.cs  # POST /api/documents/analyze, GET /api/documents
│   │   ├── ChatController.cs              # POST /api/chat, GET /api/chat/history
│   │   ├── RiskController.cs              # POST /api/risk/assess, GET /api/risk/summary
│   │   └── HealthController.cs            # GET /api/health
│   ├── Middleware/
│   │   └── ExceptionHandlingMiddleware.cs
│   ├── ServiceRegistration.cs       # DI container setup
│   ├── Program.cs                   # App entry point
│   ├── Dockerfile                   # Multi-stage Docker build
│   └── appsettings.json             # Configuration (GCP, SQLite, CORS)
│
└── StewartAI.Web/                   # 💻 Frontend (React 19 + Vite 7)
    ├── package.json                 # Dependencies
    ├── vite.config.ts               # Vite config (port 3000, @ alias)
    ├── tailwind.config.ts           # Tailwind + Stewart brand colors
    ├── tsconfig.json                # TypeScript config
    ├── components.json              # Shadcn UI config (new-york style)
    ├── index.html                   # HTML entry point
    └── src/
        ├── main.tsx                 # React entry point
        ├── App.tsx                  # TanStack Router (3 routes)
        ├── styles/index.css         # Tailwind + Stewart theme CSS variables
        ├── types/api.ts             # TypeScript types (mirrors backend DTOs)
        ├── lib/
        │   ├── utils.ts             # cn(), formatDate(), getRiskColor()
        │   └── api/                 # Axios API client modules
        │       ├── client.ts        # Base Axios instance → localhost:5264
        │       ├── documents.ts     # documentsApi.analyze(), getAll()
        │       ├── chat.ts          # chatApi.ask(), ingestDocument()
        │       ├── risk.ts          # riskApi.assess(), getSummary(), getByState()
        │       └── health.ts        # healthApi.check()
        ├── components/
        │   ├── layout/              # Header (nav), MainLayout (shell)
        │   └── ui/                  # 12 Shadcn components (button, card, badge, etc.)
        └── app/
            ├── documents/           # DocumentAnalysisPage (PDF upload + results)
            ├── chat/                # ChatPage (RAG chatbot with sources)
            └── dashboard/           # RiskDashboardPage (charts + assessment form)
```

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| .NET | 9.0 | Runtime |
| ASP.NET Core | 9.0 | Web API framework |
| Entity Framework Core | 9.0 | ORM (SQLite local, PostgreSQL prod) |
| iText7 | 9.1.0 | PDF text extraction |
| Google Gemini | 1.5 Flash | AI text generation |
| Vertex AI | text-embedding-004 | Vector embeddings for RAG |

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

### 3. Frontend Setup (new terminal)
```bash
cd StewartAI.Web
npm install
npm run dev
```
Frontend starts at **http://localhost:3000** (auto-opens browser)

### 4. Open the app
Navigate to **http://localhost:3000** — you'll see the Stewart AI Platform with 3 tabs:
- **Document Analysis** → Upload PDFs for AI analysis
- **Knowledge Assistant** → Chat with the AI about title insurance
- **Risk Dashboard** → View risk analytics and run assessments

---

## API Endpoints

### Document Analysis
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/analyze` | Upload & analyze a PDF (multipart/form-data) |
| `GET` | `/api/documents` | List all analyses |
| `GET` | `/api/documents/{id}` | Get specific analysis |

### Chat / Knowledge Assistant
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Send message (RAG pipeline) |
| `GET` | `/api/chat/history` | List conversations |
| `GET` | `/api/chat/history/{id}` | Get conversation |
| `POST` | `/api/chat/knowledge-base/ingest` | Ingest document into KB |
| `GET` | `/api/chat/knowledge-base/stats` | KB statistics |

### Risk Dashboard
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/risk/assess` | AI risk assessment |
| `GET` | `/api/risk/summary` | Aggregated risk summary |
| `GET` | `/api/risk/by-state` | Risk scores by state |
| `POST` | `/api/risk/seed` | Seed synthetic demo data |

### Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | API health check |

---

## Features

### 📄 Document Intelligence
- Drag-and-drop PDF upload
- AI-powered document classification (deed, title commitment, survey, etc.)
- Entity extraction (names, addresses, legal descriptions, dates)
- Title defect detection with severity levels
- Risk assessment with explanation
- Analysis history

### 💬 Knowledge Assistant (RAG)
- Conversational AI chatbot
- RAG pipeline: chunk → embed → cosine similarity → context injection
- Source citations with relevance scores
- Knowledge base ingestion (PDF/TXT)
- Conversation history
- Suggested questions

### 📊 Risk Dashboard
- Summary cards (total records, avg risk, high risk count, claim rate)
- Doughnut chart (risk distribution)
- Bar chart (top risk states)
- State risk table with sortable columns
- AI risk assessment form (state, county, property type, transaction type, price)
- Seed demo data button for presentations

---

## Deployment

### GCP Cloud Run (Production)
See [GCP_SETUP_GUIDE.md](./GCP_SETUP_GUIDE.md) for detailed instructions.

```bash
# Build and push Docker image
cd StewartAI.Api
docker build -t gcr.io/YOUR_PROJECT_ID/stewartai-api .
docker push gcr.io/YOUR_PROJECT_ID/stewartai-api

# Deploy to Cloud Run
gcloud run deploy stewartai-api \
  --image gcr.io/YOUR_PROJECT_ID/stewartai-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Team

| Name | Role |
|---|---|
| Sahil Shaikh | Full-Stack Developer (.NET + React) |
| TBD | Backend Developer (.NET + SSMS) |
| TBD | Frontend Developer (React) |

---

*Built for the Stewart India TBS AI Ideathon 2026*
