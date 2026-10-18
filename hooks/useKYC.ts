'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getKYCRequests,
  getKYCAlertsRecords,
  getKYCOverview,
  KYCRecordsQueryParams,
} from '@/actions/kyc.actions';
import { getUsers } from '@/actions/user.actions';
import { useTenant } from '@/components/providers/tenant.provider';

// Query key factory - includes tenant for proper cache scoping
export const kycKeys = {
  all: ['kyc'] as const,
  records: (params: KYCRecordsQueryParams, tenantId?: string) => [...kycKeys.all, 'records', params, tenantId] as const,
  alerts: (params: KYCRecordsQueryParams, tenantId?: string) => [...kycKeys.all, 'alerts', params, tenantId] as const,
  overview: (params?: KYCRecordsQueryParams, tenantId?: string) => [...kycKeys.all, 'overview', params, tenantId] as const,
  users: (tenantId?: string) => [...kycKeys.all, 'users', tenantId] as const,
};

// Polling interval in milliseconds (30 seconds)
const POLLING_INTERVAL = 30 * 1000;

// ============================================
// KYC Records Hook
// ============================================

export interface UseKYCRecordsOptions {
  params?: KYCRecordsQueryParams;
  enabled?: boolean;
  pollingInterval?: number;
}

export function useKYCRecords({
  params = {},
  enabled = true,
  pollingInterval = POLLING_INTERVAL,
}: UseKYCRecordsOptions = {}) {
  const queryClient = useQueryClient();
  const { selectedTenantId } = useTenant();

  const query = useQuery({
    queryKey: kycKeys.records(params, selectedTenantId),
    queryFn: async () => {
      const response = await getKYCRequests(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch KYC records');
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
    queryClient.invalidateQueries({ queryKey: kycKeys.records(params, selectedTenantId) });
  };

  return {
    data: query.data,
    records: query.data?.kyc || [],
    pagination: query.data?.pagination ?? null,
    total: query.data?.pagination?.total ?? 0,
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
// KYC Alerts Hook
// ============================================

export interface UseKYCAlertsOptions {
  params?: KYCRecordsQueryParams;
  enabled?: boolean;
  pollingInterval?: number;
}

export function useKYCAlerts({
  params = {},
  enabled = true,
  pollingInterval = POLLING_INTERVAL,
}: UseKYCAlertsOptions = {}) {
  const queryClient = useQueryClient();
  const { selectedTenantId } = useTenant();

  const query = useQuery({
    queryKey: kycKeys.alerts(params, selectedTenantId),
    queryFn: async () => {
      const response = await getKYCAlertsRecords(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch KYC alerts');
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
    queryClient.invalidateQueries({ queryKey: kycKeys.alerts(params, selectedTenantId) });
  };

  return {
    data: query.data,
    alerts: query.data?.alerts || [],
    pagination: query.data?.pagination ?? null,
    total: query.data?.total ?? 0,
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
// KYC Overview Hook
// ============================================

export interface UseKYCOverviewOptions {
  params?: KYCRecordsQueryParams;
  omitDateRange?: boolean;
  enabled?: boolean;
  pollingInterval?: number;
}

export function useKYCOverview({
  params = {},
  omitDateRange = false,
  enabled = true,
  pollingInterval = POLLING_INTERVAL,
}: UseKYCOverviewOptions = {}) {
  const queryClient = useQueryClient();
  const { selectedTenantId } = useTenant();

  const query = useQuery({
    queryKey: kycKeys.overview(params, selectedTenantId),
    queryFn: async () => {
      const response = await getKYCOverview(params, { omitDateRange });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch KYC overview');
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
    queryClient.invalidateQueries({ queryKey: kycKeys.overview(params, selectedTenantId) });
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
// Users Hook (for assignee dropdown)
// ============================================

export interface UseUsersOptions {
  enabled?: boolean;
}

export function useUsers({
  enabled = true,
}: UseUsersOptions = {}) {
  const { selectedTenantId } = useTenant();

  const query = useQuery({
    queryKey: kycKeys.users(selectedTenantId),
    queryFn: async () => {
      const response = await getUsers();
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
