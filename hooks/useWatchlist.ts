'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAMLScreenings,
  getAMLInternalWatchlist,
  getAMLDashboardStatistics,
  getSupportedFiltersAndCountries,
} from '@/actions/aml.actions';
import { getUsers } from '@/actions/user.actions';
import { useTenant } from '@/components/providers/tenant.provider';

// Query params type for watchlist
export type WatchlistQueryParams = Record<string, string | number | undefined | null>;

// Query key factory - includes tenant for proper cache scoping
export const watchlistKeys = {
  all: ['watchlist'] as const,
  screenings: (params: WatchlistQueryParams, tenantId?: string) =>
    [...watchlistKeys.all, 'screenings', params, tenantId] as const,
  internalWatchlist: (params: WatchlistQueryParams, tenantId?: string) =>
    [...watchlistKeys.all, 'internal', params, tenantId] as const,
  dashboardStats: (params?: Record<string, string | number | undefined | null>, tenantId?: string) =>
    [...watchlistKeys.all, 'dashboard', params, tenantId] as const,
  filters: (tenantId?: string) =>
    [...watchlistKeys.all, 'filters', tenantId] as const,
  users: (tenantId?: string) =>
    [...watchlistKeys.all, 'users', tenantId] as const,
};

// Polling interval in milliseconds (30 seconds)
const POLLING_INTERVAL = 30 * 1000;

// ============================================
// Watchlist Screenings Hook
// ============================================

export interface UseWatchlistScreeningsOptions {
  params?: WatchlistQueryParams;
  enabled?: boolean;
  pollingInterval?: number;
}

export function useWatchlistScreenings({
  params = {},
  enabled = true,
  pollingInterval = POLLING_INTERVAL,
}: UseWatchlistScreeningsOptions = {}) {
  const queryClient = useQueryClient();
  const { selectedTenantId } = useTenant();

  const query = useQuery({
    queryKey: watchlistKeys.screenings(params, selectedTenantId),
    queryFn: async () => {
      const response = await getAMLScreenings(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch watchlist screenings');
      }
      return response.data;
    },
    enabled: enabled && !!selectedTenantId,
    refetchInterval: pollingInterval,
    refetchIntervalInBackground: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: watchlistKeys.screenings(params, selectedTenantId) });
  };

  return {
    data: query.data,
    screenings: query.data?.screenings || [],
    pagination: (query.data as any)?.pagination ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isRefetching: query.isRefetching,
    isError: query.isError,
    error: query.error,
    dataUpdatedAt: query.dataUpdatedAt,
    refresh,
  };
}

// ============================================
// Internal Watchlist Hook
// ============================================

export interface UseInternalWatchlistOptions {
  params?: WatchlistQueryParams;
  enabled?: boolean;
  pollingInterval?: number;
}

export function useInternalWatchlist({
  params = {},
  enabled = true,
  pollingInterval = POLLING_INTERVAL,
}: UseInternalWatchlistOptions = {}) {
  const queryClient = useQueryClient();
  const { selectedTenantId } = useTenant();

  const query = useQuery({
    queryKey: watchlistKeys.internalWatchlist(params, selectedTenantId),
    queryFn: async () => {
      const response = await getAMLInternalWatchlist(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch internal watchlist');
      }
      return response.data;
    },
    enabled: enabled && !!selectedTenantId,
    refetchInterval: pollingInterval,
    refetchIntervalInBackground: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: watchlistKeys.internalWatchlist(params, selectedTenantId) });
  };

  return {
    data: query.data,
    screenings: query.data?.screenings || [],
    pagination: (query.data as any)?.pagination ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isRefetching: query.isRefetching,
    isError: query.isError,
    error: query.error,
    dataUpdatedAt: query.dataUpdatedAt,
    refresh,
  };
}

// ============================================
// Watchlist Dashboard Stats Hook
// ============================================

export interface UseWatchlistDashboardOptions {
  params?: Record<string, string | number | undefined | null>;
  enabled?: boolean;
  pollingInterval?: number;
}

export function useWatchlistDashboard({
  params = {},
  enabled = true,
  pollingInterval = POLLING_INTERVAL,
}: UseWatchlistDashboardOptions = {}) {
  const queryClient = useQueryClient();
  const { selectedTenantId } = useTenant();

  const query = useQuery({
    queryKey: watchlistKeys.dashboardStats(params, selectedTenantId),
    queryFn: async () => {
      const response = await getAMLDashboardStatistics(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch watchlist dashboard statistics');
      }
      return response.data;
    },
    enabled: enabled && !!selectedTenantId,
    refetchInterval: pollingInterval,
    refetchIntervalInBackground: false,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: watchlistKeys.dashboardStats(params, selectedTenantId) });
  };

  return {
    dashboardStats: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isRefetching: query.isRefetching,
    isError: query.isError,
    error: query.error,
    dataUpdatedAt: query.dataUpdatedAt,
    refresh,
  };
}

// ============================================
// Watchlist Filters Hook
// ============================================

export interface UseWatchlistFiltersOptions {
  enabled?: boolean;
}

export function useWatchlistFilters({
  enabled = true,
}: UseWatchlistFiltersOptions = {}) {
  const { selectedTenantId } = useTenant();

  const query = useQuery({
    queryKey: watchlistKeys.filters(selectedTenantId),
    queryFn: async () => {
      const response = await getSupportedFiltersAndCountries();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch watchlist filters');
      }
      return response.data;
    },
    enabled: enabled && !!selectedTenantId,
    staleTime: 5 * 60 * 1000, // Filters don't change often, cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    filtersResponse: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

// ============================================
// Users Hook (for assignee dropdown)
// ============================================

export interface UseWatchlistUsersOptions {
  enabled?: boolean;
  limit?: number;
}

export function useWatchlistUsers({
  enabled = true,
  limit = 100,
}: UseWatchlistUsersOptions = {}) {
  const { selectedTenantId } = useTenant();

  const query = useQuery({
    queryKey: watchlistKeys.users(selectedTenantId),
    queryFn: async () => {
      const response = await getUsers({ limit });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch users');
      }
      return response.data;
    },
    enabled: enabled && !!selectedTenantId,
    staleTime: 5 * 60 * 1000, // Users don't change often, cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
