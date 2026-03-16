// ─── Document Analysis ───────────────────────────────────────────────────────

export interface DocumentAnalysisResponse {
    id: string;
    fileName: string;
    documentType: string;
    riskLevel: string;
    summary: string;
    entities: ExtractedEntity[];
    defects: TitleDefect[];
    riskExplanation: string;
    analyzedAt: string;
}

export interface ExtractedEntity {
    type: string;
    value: string;
}

export interface TitleDefect {
    description: string;
    severity: string;
    suggestedAction: string;
}

// ─── Chat / Knowledge Assistant ──────────────────────────────────────────────

export interface ChatRequest {
    message: string;
    conversationId?: string;
}

export interface ChatResponse {
    conversationId: string;
    answer: string;
    sources: SourceCitation[];
    timestamp: string;
}

export interface SourceCitation {
    documentName: string;
    excerpt: string;
    relevanceScore: number;
}

export interface ConversationHistoryResponse {
    conversationId: string;
    messages: ChatMessage[];
    createdAt: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface KnowledgeBaseStats {
    totalChunks: number;
}

export interface IngestResponse {
    message: string;
    totalChunks: number;
}

export interface KnowledgeSeedResult {
    filesProcessed: number;
    filesSkipped: number;
    totalChunks: number;
    processedFiles: string[];
    skippedFiles: string[];
    errors: string[];
}

// ─── Risk Dashboard ──────────────────────────────────────────────────────────

export interface RiskAssessmentRequest {
    state: string;
    county: string;
    propertyType: string;
    transactionType: string;
    purchasePrice: number;
    loanAmount: number;
    additionalContext?: string;
}

export interface RiskAssessmentResponse {
    overallRisk: string;
    riskScore: number;
    summary: string;
    riskFactors: RiskFactor[];
    recommendations: string[];
    assessedAt: string;
}

export interface RiskFactor {
    category: string;
    description: string;
    impact: string;
}

export interface RiskSummaryResponse {
    totalRecords: number;
    averageRiskScore: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    claimCount: number;
    claimRate: number;
}

export interface StateRiskResponse {
    state: string;
    stateCode: string;
    riskScore: number;
    totalFiles: number;
    claimCount: number;
    claimRate: number;
}

// ─── Health ──────────────────────────────────────────────────────────────────

export interface HealthResponse {
    status: string;
    timestamp: string;
    version: string;
}
