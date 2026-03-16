import type {
    RiskAssessmentRequest,
    RiskAssessmentResponse,
    RiskSummaryResponse,
    StateRiskResponse,
} from '@/types/api';

import { apiClient } from './client';

export const riskApi = {
    /** Assess risk for a property transaction */
    assess: async (request: RiskAssessmentRequest): Promise<RiskAssessmentResponse> => {
        const { data } = await apiClient.post<RiskAssessmentResponse>('/risk/assess', request);
        return data;
    },

    /** Get aggregated risk summary */
    getSummary: async (): Promise<RiskSummaryResponse> => {
        const { data } = await apiClient.get<RiskSummaryResponse>('/risk/summary');
        return data;
    },

    /** Get risk scores by state (for heatmap/chart) */
    getByState: async (): Promise<StateRiskResponse[]> => {
        const { data } = await apiClient.get<StateRiskResponse[]>('/risk/by-state');
        return data;
    },

    /** Seed synthetic risk data */
    seedData: async (): Promise<{ message: string }> => {
        const { data } = await apiClient.post<{ message: string }>('/risk/seed');
        return data;
    },
};
