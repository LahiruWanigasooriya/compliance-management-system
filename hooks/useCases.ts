'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCases, getCasesOverview, getCaseById } from '@/actions/cases.actions';
import { CaseFilters, Case, CasesOverview } from '@/types/cases.types';
import { useTenant } from '@/components/providers/tenant.provider';

// Query key factory - includes tenant for proper cache scoping
export const casesKeys = {
  all: ['cases'] as const,
  list: (filters: CaseFilters, page: number, pageSize: number, tenantId?: string) =>
    [...casesKeys.all, 'list', { filters, page, pageSize }, tenantId] as const,
  overview: (tenantId?: string) => [...casesKeys.all, 'overview', tenantId] as const,
  detail: (id: string, tenantId?: string) => [...casesKeys.all, 'detail', id, tenantId] as const,
};

// Polling interval in milliseconds (30 seconds)
const POLLING_INTERVAL = 30 * 1000;

// ============================================
// Cases List Hook
// ============================================

export interface UseCasesListOptions {
  filters?: CaseFilters;
  page?: number;
  pageSize?: number;
  initialCases?: Case[];
  initialTotalPages?: number;
  initialTotalRecords?: number;
  enabled?: boolean;
  pollingInterval?: number;
}

export function useCasesList({
  filters = {},
  page = 1,
  pageSize = 10,
  initialCases,
  initialTotalPages,
  initialTotalRecords,
  enabled = true,
  pollingInterval = POLLING_INTERVAL,
}: UseCasesListOptions = {}) {
  const queryClient = useQueryClient();
  const { selectedTenantId, hasSwitchedTenant } = useTenant();

  // Only use initialData on first mount before any tenant switch
  const effectiveInitialData = hasSwitchedTenant
    ? undefined
    : initialCases
      ? {
          cases: initialCases,
          totalPages: initialTotalPages || 1,
          totalRecords: initialTotalRecords || 0,
        }
      : undefined;

  const query = useQuery({
    queryKey: casesKeys.list(filters, page, pageSize, selectedTenantId),
    queryFn: async () => {
      const response = await getCases(undefined, page, pageSize, filters);
      return {
        cases: response.cases || [],
        totalPages: response.total_pages || 1,
        totalRecords: response.total || 0,
      };
    },
    initialData: effectiveInitialData,
    enabled: enabled && !!selectedTenantId,
    refetchInterval: pollingInterval,
    refetchIntervalInBackground: false,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: casesKeys.list(filters, page, pageSize, selectedTenantId) });
  };

  return {
    cases: query.data?.cases || [],
    totalPages: query.data?.totalPages || 1,
    totalRecords: query.data?.totalRecords || 0,
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
// Cases Overview Hook
// ============================================

export interface UseCasesOverviewOptions {
  initialData?: CasesOverview | null;
  enabled?: boolean;
  pollingInterval?: number;
}

export function useCasesOverview({
  initialData,
  enabled = true,
  pollingInterval = POLLING_INTERVAL,
}: UseCasesOverviewOptions = {}) {
  const queryClient = useQueryClient();
  const { selectedTenantId, hasSwitchedTenant } = useTenant();

  // Only use initialData on first mount before any tenant switch
  const effectiveInitialData = hasSwitchedTenant ? undefined : initialData ?? undefined;

  const query = useQuery({
    queryKey: casesKeys.overview(selectedTenantId),
    queryFn: async () => {
      return await getCasesOverview();
    },
    initialData: effectiveInitialData,
    enabled: enabled && !!selectedTenantId,
    refetchInterval: pollingInterval,
    refetchIntervalInBackground: false,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: casesKeys.overview(selectedTenantId) });
  };

  return {
    overview: query.data ?? null,
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
// Case Detail Hook
// ============================================

export interface UseCaseDetailOptions {
  caseId: string;
  initialData?: Case | null;
  enabled?: boolean;
  pollingInterval?: number;
}

export function useCaseDetail({
  caseId,
  initialData,
  enabled = true,
  pollingInterval = POLLING_INTERVAL,
}: UseCaseDetailOptions) {
  const queryClient = useQueryClient();
  const { selectedTenantId, hasSwitchedTenant } = useTenant();

  // Only use initialData on first mount before any tenant switch
  const effectiveInitialData = hasSwitchedTenant ? undefined : initialData ?? undefined;

  const query = useQuery({
    queryKey: casesKeys.detail(caseId, selectedTenantId),
    queryFn: async () => {
      return await getCaseById(caseId);
    },
    initialData: effectiveInitialData,
    enabled: enabled && !!caseId && !!selectedTenantId,
    refetchInterval: pollingInterval,
    refetchIntervalInBackground: false,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: casesKeys.detail(caseId, selectedTenantId) });
  };

  // Invalidate both the detail and list when case is updated
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: casesKeys.all });
  };

  return {
    caseData: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isRefetching: query.isRefetching,
    isError: query.isError,
    error: query.error,
    dataUpdatedAt: query.dataUpdatedAt,
    refresh,
    invalidateAll,
  };
}
