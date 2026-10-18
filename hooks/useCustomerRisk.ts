'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getRiskDashboardMetrics,
  getRiskDashboardProfileById,
} from '@/actions/customer-risk.actions';
import { getRiskDashboardProfiles, RiskDashboardFilters } from '@/actions/cases.actions';
import { CustomerProfileDetailResponse } from '@/types/customer-risk.types';
import { useTenant } from '@/components/providers/tenant.provider';

// Query key factory - includes tenant for proper cache scoping
export const customerRiskKeys = {
  all: ['customer-risk'] as const,
  metrics: (tenantId?: string) => [...customerRiskKeys.all, 'metrics', tenantId] as const,
  profiles: (filters: RiskDashboardFilters, tenantId?: string) => [...customerRiskKeys.all, 'profiles', filters, tenantId] as const,
  profile: (id: string, tenantId?: string) => [...customerRiskKeys.all, 'profile', id, tenantId] as const,
};

// Polling interval in milliseconds (30 seconds)
const POLLING_INTERVAL = 30 * 1000;

// ============================================
// Customer Risk Metrics Hook
// ============================================

export interface UseCustomerRiskMetricsOptions {
  enabled?: boolean;
  pollingInterval?: number;
}

export function useCustomerRiskMetrics({
  enabled = true,
  pollingInterval = POLLING_INTERVAL,
}: UseCustomerRiskMetricsOptions = {}) {
  const queryClient = useQueryClient();
  const { selectedTenantId } = useTenant();

  const query = useQuery({
    queryKey: customerRiskKeys.metrics(selectedTenantId),
    queryFn: async () => {
      const response = await getRiskDashboardMetrics();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch risk metrics');
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
    queryClient.invalidateQueries({ queryKey: customerRiskKeys.metrics(selectedTenantId) });
  };

  return {
    data: query.data,
    metrics: query.data?.data,
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
// Customer Risk Profiles Hook
// ============================================

export interface UseCustomerRiskProfilesOptions {
  filters: RiskDashboardFilters;
  enabled?: boolean;
  pollingInterval?: number;
}

export function useCustomerRiskProfiles({
  filters,
  enabled = true,
  pollingInterval = POLLING_INTERVAL,
}: UseCustomerRiskProfilesOptions) {
  const queryClient = useQueryClient();
  const { selectedTenantId } = useTenant();

  const query = useQuery({
    queryKey: customerRiskKeys.profiles(filters, selectedTenantId),
    queryFn: async () => {
      const response = await getRiskDashboardProfiles(filters);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch risk profiles');
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
    queryClient.invalidateQueries({ queryKey: customerRiskKeys.profiles(filters, selectedTenantId) });
  };

  return {
    data: query.data,
    profiles: query.data?.profiles || [],
    pagination: query.data ? {
      total: query.data.total,
      page: query.data.page,
      pageSize: query.data.page_size,
      totalPages: query.data.total_pages,
    } : null,
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
// Customer Profile Detail Hook
// ============================================

export interface UseCustomerProfileOptions {
  profileId: string;
  initialData?: CustomerProfileDetailResponse | null;
  enabled?: boolean;
  pollingInterval?: number;
}

export function useCustomerProfile({
  profileId,
  initialData,
  enabled = true,
  pollingInterval = POLLING_INTERVAL,
}: UseCustomerProfileOptions) {
  const queryClient = useQueryClient();
  const { selectedTenantId, hasSwitchedTenant } = useTenant();

  // Only use initialData on first mount before any tenant switch
  const effectiveInitialData = hasSwitchedTenant ? undefined : initialData ?? undefined;

  const query = useQuery({
    queryKey: customerRiskKeys.profile(profileId, selectedTenantId),
    queryFn: async () => {
      const response = await getRiskDashboardProfileById(profileId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch customer profile');
      }
      return response.data;
    },
    initialData: effectiveInitialData,
    enabled: enabled && !!profileId && !!selectedTenantId,
    refetchInterval: pollingInterval,
    refetchIntervalInBackground: false,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: customerRiskKeys.profile(profileId, selectedTenantId) });
  };

  return {
    data: query.data,
    profile: query.data?.profile,
    caseSummary: query.data?.case_summary,
    alertSummary: query.data?.alert_summary,
    riskFactors: query.data?.risk_factors,
    riskHistory: query.data?.risk_history,
    geolocationSummary: query.data?.geolocation_summary,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isRefetching: query.isRefetching,
    isError: query.isError,
    error: query.error,
    dataUpdatedAt: query.dataUpdatedAt,
    refresh,
  };
}
