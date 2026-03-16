import type { DocumentAnalysisResponse } from '@/types/api';

import { apiClient } from './client';

export const documentsApi = {
    /** Upload and analyze a PDF document */
    analyze: async (file: File): Promise<DocumentAnalysisResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const { data } = await apiClient.post<DocumentAnalysisResponse>(
            '/documents/analyze',
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 120000, // 2 min for large PDFs
            }
        );
        return data;
    },

    /** Get a specific analysis by ID */
    getById: async (id: string): Promise<DocumentAnalysisResponse> => {
        const { data } = await apiClient.get<DocumentAnalysisResponse>(`/documents/${id}`);
        return data;
    },

    /** List all document analyses */
    getAll: async (): Promise<DocumentAnalysisResponse[]> => {
        const { data } = await apiClient.get<DocumentAnalysisResponse[]>('/documents');
        return data;
    },
};
