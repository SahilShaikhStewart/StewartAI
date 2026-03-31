# Architecture Design — Stewart AI Platform
## Stewart India TBS AI Ideathon 2026

> **Verified against source code** — all diagrams cross-checked with actual implementation.

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph Users["👥 Users"]
        UA[Title Examiner]
        UB[Underwriter]
        UC[Field Agent]
    end

    subgraph Frontend["🖥️ Frontend — React + Vite + TypeScript"]
        F1[🏠 Home / Landing Page]
        F2[📄 Document Intelligence]
        F3[💬 AI Chat Assistant]
        F4[📊 Risk Dashboard]
        F5[📈 Metrics & Audit Trail]
    end

    subgraph Backend["⚙️ Backend — .NET 9 Clean Architecture"]
        B1[DocumentAnalysisController]
        B2[ChatController]
        B3[RiskController]
        B4[HealthController]
    end

    subgraph AppLayer["🧠 Application Layer — Services"]
        S1[DocumentAnalysisService]
        S2[ChatService]
        S3[KnowledgeBaseService]
        S4[RiskService]
        S5[GeminiService]
    end

    subgraph Data["🗄️ Data Layer"]
        DB[(SQLite Database)]
        KB[Knowledge Base\nVector Store]
        SD[Seed Data\n10 Policy TXT Files]
    end

    subgraph GCP["☁️ Google Cloud Platform"]
        GR[Cloud Run\nAuto-scaling Container]
        GAI[Gemini 2.5 Flash\nMultimodal LLM]
        GEM[gemini-embedding-001\nVector Embeddings\n(768-dim)]
        GCB[Cloud Build\nCI/CD Pipeline]
        GAR[Artifact Registry\nDocker Images]
    end

    UA & UB & UC --> Frontend
    Frontend --> Backend
    Backend --> AppLayer
    AppLayer --> Data
    AppLayer --> GCP
    S5 --> GAI
    S5 --> GEM
    GR --> Backend
    GCB --> GAR --> GR
```

---

## 2. RAG (Retrieval-Augmented Generation) Flow

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant C as 💬 Chat UI
    participant CS as ChatService
    participant KB as KnowledgeBaseService
    participant GS as GeminiService
    participant DB as 🗄️ Database
    participant AI as 🤖 Gemini 2.5 Flash

    U->>C: "What are solar panel requirements?"
    C->>CS: AskAsync(question)
    CS->>KB: SearchAsync(question, topK=5)
    KB->>GS: GenerateEmbeddingAsync(question)
    GS->>AI: gemini-embedding-001 API call
    AI-->>GS: 768-dim vector
    GS-->>KB: queryEmbedding[]
    KB->>DB: Load all knowledge chunks
    DB-->>KB: chunks with embeddings
    KB->>KB: CosineSimilarity(query, each chunk)
    KB-->>CS: Top 5 relevant chunks + sources
    CS->>GS: GenerateContentAsync(prompt + context)
    GS->>AI: Gemini 2.5 Flash API call
    AI-->>GS: Grounded response
    GS-->>CS: AI answer
    CS-->>C: Response + source citations
    C-->>U: Answer with document sources shown
```

---

## 3. Document Intelligence Flow

```mermaid
flowchart TD
    A[📁 User Uploads Document] --> B{File Type?}

    B -->|PDF| C[Extract Text\nPdfPig Library]
    B -->|TXT / DOC| D[Read Text Stream]
    B -->|JPG / PNG\nScanned / Handwritten| E[🔍 Gemini Vision API\nOCR + Image Understanding]

    C --> F[Extracted Text]
    D --> F
    E --> F

    F --> G[Build Analysis Prompt\nTitle Insurance Context]
    G --> H[🤖 Gemini 2.5 Flash\nJSON Response Mode]

    H --> I[Parse AI Response]
    I --> J[Structured Output]

    J --> K[📋 Extracted Entities\nGrantor, Grantee, Amounts]
    J --> L[⚠️ Title Defects\nLiens, Encumbrances, Disputes]
    J --> M[🎯 Risk Score\n0-100 + Low/Medium/High]
    J --> N[💡 Recommendations\nActionable next steps]

    K & L & M & N --> O[Save to Database\nAudit Trail]
    O --> P[Display Results in UI]
    O --> Q[Create Risk Record\nfor Dashboard Analytics]
```

---

## 4. Risk Assessment Engine

```mermaid
flowchart LR
    subgraph Input["📥 Input Parameters"]
        I1[State / County]
        I2[Property Type\nResidential / Commercial]
        I3[Transaction Type\nPurchase / Refinance / Foreclosure]
        I4[Purchase Price]
        I5[Loan Amount]
        I6[Additional Context]
    end

    subgraph AI["🤖 Gemini AI Analysis"]
        P1[Build Risk Prompt\nTitle Insurance Expert Role]
        P2[Gemini 2.5 Flash\ntemp=0.3 for consistency]
        P3[JSON Response Parsing]
    end

    subgraph Output["📤 Risk Output"]
        O1[Overall Risk\nLow / Medium / High]
        O2[Risk Score\n0-100 numeric]
        O3[Risk Factors\nGeographic / Transaction / Market / Legal]
        O4[Recommendations\nActionable steps]
        O5[Summary\n2-3 sentence analysis]
    end

    subgraph Dashboard["📊 Aggregated Analytics"]
        D1[2000 Synthetic Records\nSeeded on startup]
        D2[Risk by State\nHeatmap visualization]
        D3[Claim Rate\nHistorical trends]
        D4[Risk Distribution\nLow / Medium / High pie chart]
    end

    Input --> AI
    AI --> Output
    Output --> Dashboard
```

---

## 5. GCP Cloud Infrastructure

```mermaid
graph TB
    subgraph Internet["🌐 Internet"]
        DEV[Developer\ngit push]
        USER[End User\nBrowser]
    end

    subgraph GCP["☁️ Google Cloud Platform — Project: stewart-ai"]
        subgraph CICD["🔄 CI/CD Pipeline"]
            GH[GitHub Repository\nmain branch]
            CB[Cloud Build\nDockerfile build]
            AR[Artifact Registry\nDocker image store]
        end

        subgraph Runtime["🚀 Runtime"]
            CR[Cloud Run Service\nstewart-ai\nauto-scale 0→10 instances]
            subgraph Container["🐳 Docker Container"]
                NET[.NET 9 API\nport 8080]
                REACT[React SPA\nstatic files served by API]
                DB[(SQLite\nephemeral storage)]
            end
        end

        subgraph AI_APIs["🤖 Google Generative Language API"]
            GEM25[gemini-2.5-flash\nMultimodal LLM\nText + Vision + JSON mode]
            EMB[gemini-embedding-001\nVector Embeddings\n768 dimensions]
        end

        subgraph Security["🔒 Security"]
            IAM[IAM Service Account\nCloud Run identity]
            APIKEY[GCP API Key\nRestricted to:\nGenerative Language API\nStored as Cloud Run env var]
        end
    end

    DEV -->|git push| GH
    GH -->|trigger on main| CB
    CB -->|3-stage docker build\nnode:22 + dotnet:9 + aspnet:9| AR
    AR -->|deploy new revision| CR
    USER -->|HTTPS :443| CR
    CR -->|port 8080| Container
    NET -->|POST generateContent\n?key=API_KEY| GEM25
    NET -->|POST embedContent\n?key=API_KEY| EMB
    IAM --> CR
    APIKEY -->|injected via\nenv var GCP__ApiKey| NET
```

---

## 6. Clean Architecture — Code Structure

```mermaid
graph TB
    subgraph Domain["🏛️ StewartAI.Domain\n(Entities & Interfaces)"]
        E1[RiskRecord Entity]
        E2[DocumentAnalysis Entity]
        E3[KnowledgeChunk Entity]
        E4[Conversation Entity]
    end

    subgraph Application["🧠 StewartAI.Application\n(Business Logic)"]
        S1[RiskService]
        S2[DocumentAnalysisService]
        S3[KnowledgeBaseService]
        S4[ChatService]
        S5[GeminiService]
        D1[DTOs / Request & Response Models]
    end

    subgraph Infrastructure["🔧 StewartAI.Infrastructure\n(Data Access)"]
        DB[AppDbContext\nEntity Framework Core]
        SQLITE[(SQLite Database)]
        SEED[SeedData\n10 Policy Documents]
    end

    subgraph API["🌐 StewartAI.Api\n(HTTP Layer)"]
        C1[DocumentAnalysisController]
        C2[ChatController]
        C3[RiskController]
        C4[HealthController]
        MW[Middleware\nError Handling, Logging]
        STATIC[Static Files\nReact SPA]
    end

    subgraph Web["🖥️ StewartAI.Web\n(React Frontend)"]
        P1[DocumentAnalysisPage]
        P2[ChatPage]
        P3[RiskDashboardPage]
        P4[MetricsPage]
        P5[HomePage]
        API_CLIENT[Axios API Client]
    end

    Web -->|HTTP REST| API
    API --> Application
    Application --> Domain
    Application --> Infrastructure
    Infrastructure --> Domain
```

---

## 7. Data Flow — End to End

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant UI as 🖥️ React UI
    participant API as ⚙️ .NET API
    participant SVC as 🧠 Service Layer
    participant DB as 🗄️ SQLite
    participant GCP as 🤖 Gemini AI

    Note over U,GCP: Document Analysis Flow

    U->>UI: Upload title document (PDF/Image)
    UI->>API: POST /api/documents/analyze (multipart)
    API->>SVC: DocumentAnalysisService.AnalyzeDocumentAsync()

    alt Image File (JPG/PNG)
        SVC->>GCP: GenerateContentFromImageAsync(bytes, mimeType)
        GCP-->>SVC: OCR text + visual understanding
    else Text/PDF File
        SVC->>SVC: ExtractTextFromPdf() or ReadStream()
    end

    SVC->>GCP: GenerateContentAsync(analysisPrompt, JSON mode)
    GCP-->>SVC: Structured JSON response
    SVC->>SVC: ParseAiResponse() → DocumentAnalysisResponse
    SVC->>DB: Save DocumentAnalysis entity
    SVC->>DB: Save RiskRecord entity
    SVC-->>API: DocumentAnalysisResponse
    API-->>UI: 200 OK + JSON
    UI-->>U: Display risk score, entities, defects, recommendations
```

---

## 8. Technology Stack Summary

```mermaid
mindmap
  root((Stewart AI\nPlatform))
    Frontend
      React 18
      TypeScript
      Vite Build Tool
      TanStack Router
      Shadcn UI Components
      Tailwind CSS
      Chart.js Visualizations
      Axios HTTP Client
    Backend
      .NET 9 ASP.NET Core
      Clean Architecture
      Entity Framework Core
      SQLite Database
      PdfPig PDF Library
      Dependency Injection
    AI & ML
      Gemini 2.5 Flash LLM
      gemini-embedding-001
      RAG Architecture
      Vector Embeddings
      Cosine Similarity Search
      Multimodal Vision OCR
    Infrastructure
      Google Cloud Run
      Docker Multi-stage Build
      Cloud Build CI/CD
      Artifact Registry
      IAM Security
      Auto-scaling 0-10
    Patterns
      Clean Architecture
      Repository Pattern
      CQRS-lite DTOs
      Dependency Injection
      Middleware Pipeline
```

---

## 9. Security Architecture

```mermaid
flowchart TD
    subgraph External["🌐 External"]
        USER[Browser User]
        GAPI[Google AI APIs]
    end

    subgraph CloudRun["☁️ Cloud Run"]
        HTTPS[HTTPS Termination\nTLS 1.3]
        MW[Middleware Pipeline\nError Handling]
        API[.NET 9 API]
    end

    subgraph Secrets["🔒 Secrets Management"]
        ENV[Environment Variables\nCloud Run Config]
        APIKEY[GCP API Key\nRestricted to Generative Language API]
    end

    subgraph Data["🗄️ Data"]
        DB[(SQLite\nEphemeral - No PII stored)]
        NODOC[Documents NOT stored\nAnalyzed in-memory only]
    end

    USER -->|HTTPS only| HTTPS
    HTTPS --> MW --> API
    API -->|API Key in header| GAPI
    ENV --> APIKEY
    APIKEY --> API
    API --> DB
    API --> NODOC

    style NODOC fill:#e8f5e9,stroke:#4caf50
    style APIKEY fill:#fff3e0,stroke:#ff9800
```

---

## 10. Deployment Architecture

```mermaid
flowchart LR
    subgraph Dev["💻 Development"]
        CODE[Code Changes\nVS Code]
        LOCAL[Local Run\ndotnet run + npm dev]
    end

    subgraph GitHub["📦 GitHub"]
        REPO[Repository\nmain branch]
        PR[Pull Request\nCode Review]
    end

    subgraph GCP_Build["🔨 GCP Cloud Build"]
        TRIGGER[Build Trigger\non push to main]
        DOCKER[Docker Build\nMulti-stage\nStage 1: npm build React\nStage 2: dotnet publish\nStage 3: runtime image]
        PUSH[Push to\nArtifact Registry]
    end

    subgraph GCP_Run["🚀 GCP Cloud Run"]
        DEPLOY[Deploy new revision]
        TRAFFIC[Traffic split\n100% to new revision]
        SCALE[Auto-scale\n0 to 10 instances\nbased on requests]
    end

    CODE --> LOCAL
    CODE -->|git push| REPO
    REPO --> TRIGGER
    TRIGGER --> DOCKER
    DOCKER --> PUSH
    PUSH --> DEPLOY
    DEPLOY --> TRAFFIC
    TRAFFIC --> SCALE
```

---

## Summary: What the Architecture Achieves

| Capability | How |
|---|---|
| **Multimodal AI** | Gemini 2.5 Flash processes text + images in one API call |
| **Semantic Search** | gemini-embedding-001 creates 768-dim vectors, cosine similarity finds relevant chunks |
| **RAG** | Knowledge base chunks retrieved and injected into every chat prompt |
| **Scalability** | Cloud Run scales from 0 to 10 instances automatically |
| **Zero Downtime Deploy** | Cloud Build → Artifact Registry → Cloud Run revision rollout |
| **No Data Leakage** | Documents analyzed in-memory, never persisted to disk |
| **Audit Trail** | Every AI decision saved to SQLite with timestamp and metadata |
| **Clean Code** | 4-layer Clean Architecture: Domain → Application → Infrastructure → API |

---

*Architecture designed for Stewart India TBS AI Ideathon 2026*  
*Live Demo: https://stewart-ai-219046022543.us-central1.run.app*
