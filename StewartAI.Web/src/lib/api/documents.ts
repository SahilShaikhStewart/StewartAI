import type { DocumentAnalysisResponse } from '@/types/api';

import { apiClient } from './client';

export interface DemoDocument {
    fileName: string;
    displayName: string;
    sizeBytes: number;
}

/** Supported file extensions for document analysis */
export const SUPPORTED_EXTENSIONS = ['.pdf', '.txt', '.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.gif'];

/** Accept string for file input elements */
export const FILE_ACCEPT = '.pdf,.txt,.jpg,.jpeg,.png,.webp,.tiff,.tif,.gif';

/** Check if a file is an image type */
export const isImageFile = (fileName: string): boolean => {
    const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.gif'];
    return imageExts.some((ext) => fileName.toLowerCase().endsWith(ext));
};

export const documentsApi = {
    /** Upload and analyze a document (PDF, TXT, or image) */
    analyze: async (file: File): Promise<DocumentAnalysisResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const { data } = await apiClient.post<DocumentAnalysisResponse>(
            '/documents/analyze',
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 180000, // 3 min — images via Vision API can take longer
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

    /** List available demo documents */
    getDemoDocuments: async (): Promise<DemoDocument[]> => {
        const { data } = await apiClient.get<DemoDocument[]>('/documents/demo');
        return data;
    },

    /** Analyze a built-in demo document */
    analyzeDemoDocument: async (fileName: string): Promise<DocumentAnalysisResponse> => {
        const { data } = await apiClient.post<DocumentAnalysisResponse>(
            `/documents/demo/analyze/${encodeURIComponent(fileName)}`,
            null,
            { timeout: 120000 }
        );
        return data;
    },
};
