'use server';

import { auth, createServerAxios } from '@/utils/axios_server';
import { SearchResponse } from '@/utils/search.types';

export const performGlobalSearch = async (
  query: string
): Promise<SearchResponse> => {
  try {
    if (!query.trim()) {
      return {
        results: [],
        total_count: 0,
        query: '',
        limit: 20,
        offset: 0,
      };
    }

    // Get auth context
    const authContext = await auth();
    
    if (!authContext.accessToken) {
      throw new Error('No access token available');
    }

    // Create axios instance with proper auth
    const axiosInstance = createServerAxios(
      authContext.accessToken,
      authContext.user.tenant_id,
      authContext.user.user_type,
      authContext.user.id || undefined
    );

    const response = await axiosInstance.get<SearchResponse>(
      `/api/v1/search?q=${encodeURIComponent(query)}`
    );

    return response.data;
  } catch (error) {
    console.error('Server-side search error:', error);
    return {
      results: [],
      total_count: 0,
      query,
      limit: 20,
      offset: 0,
    };
  }
};
