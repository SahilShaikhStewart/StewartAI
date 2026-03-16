import type { HealthResponse } from '@/types/api';

import { apiClient } from './client';

export interface PlatformMetrics {
    timestamp: string;
    platform: {
        name: string;
        version: string;
        aiModel: string;
        embeddingModel: string;
    };
    documentAnalysis: {
        totalDocuments: number;
        documentsByType: { type: string; count: number }[];
        documentsByRisk: { level: string; count: number }[];
        recentDocuments: {
            id: string;
            fileName: string;
            documentType: string;
            riskLevel: string;
            analyzedAt: string;
            textLength: number;
            isVision: boolean;
        }[];
    };
    knowledgeBase: {
        totalChunks: number;
        uniqueDocuments: number;
        documentNames: string[];
    };
    chat: {
        totalConversations: number;
        totalMessages: number;
        recentConversations: {
            id: string;
            createdAt: string;
            messageCount: number;
        }[];
    };
    risk: {
        totalRiskRecords: number;
        averageRiskScore: number;
        claimCount: number;
        riskByState: { state: string; count: number; avgScore: number }[];
    };
}

export const healthApi = {
    /** Check API health */
    check: async (): Promise<HealthResponse> => {
        const { data } = await apiClient.get<HealthResponse>('/health');
        return data;
    },

    /** Get platform metrics for audit trail / metrics page */
    getMetrics: async (): Promise<PlatformMetrics> => {
        const { data } = await apiClient.get<PlatformMetrics>('/health/metrics');
        return data;
    },
};
