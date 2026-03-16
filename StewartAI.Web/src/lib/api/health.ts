import type { HealthResponse } from '@/types/api';

import { apiClient } from './client';

export const healthApi = {
    /** Check API health */
    check: async (): Promise<HealthResponse> => {
        const { data } = await apiClient.get<HealthResponse>('/health');
        return data;
    },
};
