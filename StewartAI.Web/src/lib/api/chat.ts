import type {
    ChatRequest,
    ChatResponse,
    ConversationHistoryResponse,
    IngestResponse,
    KnowledgeBaseStats,
} from '@/types/api';

import { apiClient } from './client';

export const chatApi = {
    /** Send a message to the AI Knowledge Assistant */
    ask: async (request: ChatRequest): Promise<ChatResponse> => {
        const { data } = await apiClient.post<ChatResponse>('/chat', request);
        return data;
    },

    /** Get list of conversation histories */
    getHistory: async (): Promise<ConversationHistoryResponse[]> => {
        const { data } = await apiClient.get<ConversationHistoryResponse[]>('/chat/history');
        return data;
    },

    /** Get a specific conversation */
    getConversation: async (conversationId: string): Promise<ConversationHistoryResponse> => {
        const { data } = await apiClient.get<ConversationHistoryResponse>(
            `/chat/history/${conversationId}`
        );
        return data;
    },

    /** Ingest a document into the knowledge base */
    ingestDocument: async (file: File): Promise<IngestResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const { data } = await apiClient.post<IngestResponse>(
            '/chat/knowledge-base/ingest',
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 120000,
            }
        );
        return data;
    },

    /** Get knowledge base stats */
    getKnowledgeBaseStats: async (): Promise<KnowledgeBaseStats> => {
        const { data } = await apiClient.get<KnowledgeBaseStats>('/chat/knowledge-base/stats');
        return data;
    },
};
