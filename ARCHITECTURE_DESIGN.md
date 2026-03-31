# Architecture Design — Stewart AI Platform
## Stewart India TBS AI Ideathon 2026

---

## 1. Full Stack Architecture

```mermaid
graph TB
    subgraph Users["Users"]
        UA[Title Examiner]
        UB[Underwriter]
        UC[Field Agent]
    end

    subgraph Frontend["Frontend — React 18 + Vite + TypeScript + Shadcn UI"]
        F1[Document Intelligence Page]
        F2[AI Chat Assistant Page]
        F3[Risk Dashboard Page]
        F4[Metrics and Audit Trail Page]
    end

    subgraph Backend[".NET 9 Clean Architecture — Cloud Run port 8080"]
        B1[DocumentAnalysisController]
        B2[ChatController]
        B3[RiskController]
        S1[DocumentAnalysisService]
        S2[ChatService + KnowledgeBaseService]
        S3[RiskService]
        S4[GeminiService]
        DB[(SQLite Database\n5 tables)]
    end

    subgraph GCP["Google Cloud Platform"]
        CR[Cloud Run\nauto-scale 0 to 10 instances]
        GAI[Gemini 2.5 Flash\nText, Vision, JSON mode]
        GEM[gemini-embedding-001\n768-dim Vector Embeddings]
        CB[Cloud Build + Artifact Registry\n3-stage Docker build]
    end

    UA & UB & UC -->|HTTPS| Frontend
    Frontend -->|REST API| Backend
    Backend --> DB
    S4 -->|generateContent API| GAI
    S4 -->|embedContent API| GEM
    CB -->|deploy| CR
    CR --> Backend
```

---

## 2. Document Intelligence Flow

```mermaid
flowchart TD
    A[User Uploads Document] --> B{File Type?}

    B -->|PDF with text| C[iText7 PDF Extraction]
    B -->|PDF less than 50 chars extracted| E[Gemini Vision API\nOCR + Image Understanding]
    B -->|JPG or PNG| E
    B -->|TXT| D[Read Text Stream]

    C & D & E --> F[Extracted Text]
    F --> G[Build Analysis Prompt\nTitle Insurance Expert Context]
    G --> H[Gemini 2.5 Flash\nJSON Response Mode]

    H --> I[Structured AI Output]
    I --> J[Risk Score 0-100\nLow or Medium or High]
    I --> K[Extracted Entities\nGrantor, Grantee, Amounts]
    I --> L[Title Defects\nLiens, Encumbrances, Disputes]
    I --> M[Recommendations]

    J & K & L & M --> N[Save to SQLite\nAudit Trail]
    N --> O[Auto-create Risk Record\nfor Dashboard Analytics]
    N --> P[Auto-ingest into Knowledge Base\nfor future RAG queries]
```

---

## 3. RAG Chat Flow

```mermaid
sequenceDiagram
    participant U as User
    participant CS as ChatService
    participant KB as KnowledgeBaseService
    participant GS as GeminiService
    participant DB as SQLite
    participant AI as Gemini AI

    U->>CS: Ask question
    CS->>KB: SearchAsync(question, topK=5)
    KB->>GS: GenerateEmbeddingAsync(question)
    GS->>AI: gemini-embedding-001 API call
    AI-->>GS: 768-dim vector
    KB->>DB: Load all knowledge chunks
    DB-->>KB: chunks with stored embeddings
    KB->>KB: CosineSimilarity for each chunk
    KB-->>CS: Top 5 relevant chunks + sources
    CS->>GS: GenerateContentAsync(question + context)
    GS->>AI: Gemini 2.5 Flash API call
    AI-->>GS: Grounded answer
    CS-->>U: Answer + source citations
```

---

## Summary

| Capability | Implementation |
|---|---|
| **Multimodal AI** | Gemini 2.5 Flash processes text + images in one API call |
| **Semantic Search** | gemini-embedding-001 creates 768-dim vectors, cosine similarity finds relevant chunks |
| **RAG** | Top-5 knowledge base chunks injected into every chat prompt |
| **Intelligence Loop** | Document analysis auto-creates risk record AND auto-ingests into knowledge base |
| **Scalability** | Cloud Run scales from 0 to 10 instances automatically |
| **Audit Trail** | Every AI decision saved to SQLite with timestamp and metadata |
| **Clean Architecture** | 4-layer: Domain, Application, Infrastructure, API |

---

*Live Demo: https://stewart-ai-219046022543.us-central1.run.app*
