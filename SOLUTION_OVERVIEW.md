# Solution Overview
## Stewart AI Platform — AI Ideathon 2026

---

## What We Built

**Stewart AI** is a title insurance intelligence platform that uses Google's Gemini AI to automate document analysis, provide instant policy answers, and deliver standardized risk scoring — all deployed live on Google Cloud Run.

**Live Demo:** https://stewart-ai-219046022543.us-central1.run.app

---

## Three Core Capabilities

### 1. 📄 Document Intelligence
Upload any title document — deed, lien, title commitment, mortgage, survey — in any format (PDF, image, scanned, handwritten photo). The platform:

- **Extracts text** using iText7 for digital PDFs, or **Gemini Vision API** for scanned/handwritten documents
- **Identifies document type** (Deed, Mortgage, Lien, Title Commitment, Closing Disclosure, etc.)
- **Extracts key entities**: Grantor, Grantee, Property Address, Legal Description, Amounts, Dates
- **Identifies title defects**: liens, encumbrances, boundary disputes — each with severity (Low/Medium/High) and a suggested curative action
- **Assigns a risk level**: Low, Medium, or High with a written explanation
- **Automatically feeds** the result into the Risk Dashboard (Intelligence Loop)
- **Auto-ingests** the analyzed document into the knowledge base so future chat queries can reference it

All analysis is done by **Gemini 2.5 Flash** in JSON mode at temperature=0.3 for consistent, structured output.

---

### 2. 💬 AI Chat Assistant (RAG-Powered)
An intelligent assistant that answers questions about title insurance, Stewart policies, and real estate closings — grounded in Stewart's actual knowledge base.

**How it works (RAG — Retrieval-Augmented Generation):**

1. User asks a question (e.g., *"What are the requirements for solar panel properties?"*)
2. The question is converted to a **768-dimensional vector** using `gemini-embedding-001`
3. **Cosine similarity search** finds the top-5 most relevant chunks from the knowledge base
4. Those chunks are injected into the Gemini prompt as context
5. **Gemini 2.5 Flash** generates an answer grounded in the retrieved context
6. The response includes **source citations** (document name + excerpt + relevance score)
7. The full conversation is persisted to the database with the last 6 messages used for context continuity

**Knowledge Base:** Pre-seeded with 10 Stewart policy documents covering underwriting guidelines, state-specific requirements, lien types, and closing procedures. Users can upload additional documents at any time — they are chunked (1000 chars, 200-char overlap), embedded, and immediately searchable.

---

### 3. 📊 Risk Assessment Dashboard
Two complementary risk systems:

**A. AI-Powered On-Demand Assessment**
Enter property details (state, county, property type, transaction type, purchase price, loan amount) and receive:
- Overall risk: Low / Medium / High
- Numeric risk score: 0–100
- Risk factors broken down by category: Geographic, Transaction, Market, Legal
- Actionable recommendations

**B. Aggregated Analytics Dashboard**
2,000 synthetic risk records seeded on startup (fixed seed=42 for reproducibility) across 30 US states, with realistic risk modifiers:
- Florida (base 60), California (55), Louisiana (55) — highest risk states
- Minnesota (22), Ohio (25), Indiana (27) — lowest risk states
- Foreclosure transactions: +20 risk points
- Short Sale: +15 risk points
- Vacant Land: +10 risk points
- Claim probability = risk score ÷ 200

Dashboard shows: total records, average risk score, high/medium/low distribution (doughnut chart), risk by state (bar chart), claim rate %, and a scrollable state-by-state breakdown.

---

## The Intelligence Loop

What makes this more than three separate features is the **Intelligence Loop**:

```
Upload Document
      ↓
Gemini Vision/Text Analysis
      ↓
Structured Result (entities, defects, risk level)
      ↓
┌─────────────────────────────────────┐
│  Auto-create Risk Record            │  → Risk Dashboard updates
│  Auto-ingest into Knowledge Base    │  → Chat can now answer about it
└─────────────────────────────────────┘
```

Every document analyzed automatically enriches both the risk analytics and the chat knowledge base — without any manual steps.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **LLM** | Gemini 2.5 Flash | Document analysis, chat answers, risk assessment |
| **Embeddings** | gemini-embedding-001 | 768-dim vectors for semantic search |
| **Vision** | Gemini multimodal API | OCR for images, scanned PDFs, handwritten docs |
| **Backend** | .NET 9 / ASP.NET Core | Clean Architecture — Domain, Application, Infrastructure, API |
| **Database** | SQLite + EF Core | 5 tables: DocumentAnalyses, KnowledgeChunks, RiskRecords, Conversations, ConversationMessages |
| **Frontend** | React 18 + TypeScript + Vite | TanStack Router, Shadcn UI, Tailwind CSS, Chart.js |
| **Container** | Docker (3-stage build) | Node 22 (React build) → .NET SDK 9 (publish) → ASP.NET 9 (runtime) |
| **Cloud** | GCP Cloud Run | Auto-scales 0→10 instances, port 8080, HTTPS |
| **CI/CD** | GCP Cloud Build + Artifact Registry | Triggered on git push to main |
| **Auth** | GCP API Key | Restricted to Generative Language API, injected as env var |

---

## What Makes This Different from Just Using Gemini

| | Gemini Direct | Stewart AI Platform |
|---|---|---|
| Domain knowledge | Generic | Stewart policies pre-loaded |
| Document persistence | Upload every time | Upload once, query forever |
| Structured output | Free-form text | JSON: entities, defects, risk score |
| Risk aggregation | None | 2000-record dashboard, state heatmap |
| Audit trail | None | Every decision logged with timestamp |
| Source citations | None | Document name + excerpt + relevance score |
| Multimodal routing | Manual | Auto-detects image vs PDF vs text |
| Intelligence loop | None | Doc analysis → risk record + KB auto-ingest |
| Retry on rate limit | None | Exponential backoff: 5s → 15s → 30s |

---

## Metrics & Audit Trail

The **Metrics page** provides enterprise-grade visibility:
- Total documents analyzed, broken down by type and risk level
- Recent document processing history (filename, type, risk, timestamp, vision flag)
- Recent chat conversations
- Knowledge base document inventory
- Processing statistics

Every AI decision is stored in SQLite with the raw AI response, extracted text, and full analysis — providing a complete audit trail for compliance.

---

## Deployment

The platform is deployed and live. The API key is stored as a Cloud Run environment variable (`GCP__ApiKey`) — never in source code. The `appsettings.Development.json` file (which contains the local dev key) is excluded from Git via `.gitignore`.

On cold start, the platform automatically:
1. Creates the SQLite database schema (EF Core migrations)
2. Seeds 2,000 synthetic risk records
3. Seeds the knowledge base with 10 policy documents (skips if already seeded — idempotent)

---

## Summary

Stewart AI transforms title insurance document processing from a slow, manual, inconsistent workflow into a fast, intelligent, auditable system — built on Google's latest AI models, deployed on GCP, and designed specifically for Stewart's domain.

**Live:** https://stewart-ai-219046022543.us-central1.run.app  
**Code:** GitHub repository (submitted separately)
