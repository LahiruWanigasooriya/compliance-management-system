'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getComplianceRiskDashboard } from '@/actions/dashboard.actions';
import { ComplianceRiskDashboard } from '@/types/dashboard.types';
import { useTenant } from '@/components/providers/tenant.provider';

// Query key factory - includes tenant for proper cache scoping
export const dashboardKeys = {
  all: ['dashboard'] as const,
  compliance: (timeRange: string, tenantId?: string) => [...dashboardKeys.all, 'compliance', timeRange, tenantId] as const,
};

// Polling interval in milliseconds (30 seconds)
const POLLING_INTERVAL = 30 * 1000;

export interface UseDashboardOptions {
  timeRange: string;
  initialData?: ComplianceRiskDashboard | null;
  enabled?: boolean;
  pollingInterval?: number;
}

/**
 * React Query hook for fetching and polling compliance risk dashboard data
 * Includes tenant ID in query key to properly scope cache per tenant
 * Uses centralized hasSwitchedTenant from provider to handle initialData
 */
export function useDashboard({
  timeRange,
  initialData,
  enabled = true,
  pollingInterval = POLLING_INTERVAL,
}: UseDashboardOptions) {
  const queryClient = useQueryClient();
  const { selectedTenantId, hasSwitchedTenant } = useTenant();

  // Only use initialData on first mount before any tenant switch
  // Once a tenant switch has occurred, initialData is stale and should be ignored
  const effectiveInitialData = hasSwitchedTenant ? undefined : initialData ?? undefined;

  const query = useQuery({
    queryKey: dashboardKeys.compliance(timeRange, selectedTenantId),
    queryFn: async () => {
      const response = await getComplianceRiskDashboard(timeRange);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch dashboard data');
      }
      return response.data;
    },
    initialData: effectiveInitialData,
    enabled: enabled && !!selectedTenantId,
    refetchInterval: pollingInterval,
    refetchIntervalInBackground: false, // Only poll when tab is active
    staleTime: 10 * 1000, // Consider data stale after 10 seconds
    refetchOnWindowFocus: true,
  });

  // Manual refresh function
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.compliance(timeRange, selectedTenantId) });
  };

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching,
    dataUpdatedAt: query.dataUpdatedAt,
    refresh,
  };
}
