'use client';

import { useQuery } from '@tanstack/react-query';
import { getKYCOverview } from '@/actions/kyc.actions';
import { getRiskDashboardProfiles, getCasesOverview } from '@/actions/cases.actions';
import { getGeoAlertMetrics } from '@/actions/geolocation.actions';
import { getAMLDashboardStatistics } from '@/actions/aml.actions';
import { useTenant } from '@/components/providers/tenant.provider';

// Query key factory - includes tenant for proper cache scoping
export const sidebarCountsKeys = {
  all: ['sidebar-counts'] as const,
  kyc: (tenantId?: string) => [...sidebarCountsKeys.all, 'kyc', tenantId] as const,
  watchlist: (tenantId?: string) => [...sidebarCountsKeys.all, 'watchlist', tenantId] as const,
  customers: (tenantId?: string) => [...sidebarCountsKeys.all, 'customers', tenantId] as const,
  cases: (tenantId?: string) => [...sidebarCountsKeys.all, 'cases', tenantId] as const,
  geolocation: (tenantId?: string) => [...sidebarCountsKeys.all, 'geolocation', tenantId] as const,
};

// Longer stale time for sidebar counts - they don't need to refresh as often
const STALE_TIME = 60 * 1000; // 1 minute
const POLLING_INTERVAL = 60 * 1000; // Poll every minute

/**
 * Hook for fetching all sidebar counts efficiently
 * Uses React Query with longer cache times since these are summary counts
 * Includes tenant ID in query keys for proper cache scoping
 */
export function useSidebarCounts() {
  const { selectedTenantId } = useTenant();

  // KYC pending alerts count
  const kycQuery = useQuery({
    queryKey: sidebarCountsKeys.kyc(selectedTenantId),
    queryFn: async () => {
      const response = await getKYCOverview({}, { omitDateRange: true });
      if (response.success && typeof response.data?.pendingAlerts === 'number') {
        return response.data.pendingAlerts;
      }
      return null;
    },
    staleTime: STALE_TIME,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    enabled: !!selectedTenantId,
  });

  // Watchlist/AML critical risk count
  const watchlistQuery = useQuery({
    queryKey: sidebarCountsKeys.watchlist(selectedTenantId),
    queryFn: async () => {
      const response = await getAMLDashboardStatistics({ time_filter: 'all' });
      if (response.success && typeof response.data?.data?.criticalRisk === 'number') {
        return response.data.data.criticalRisk;
      }
      return null;
    },
    staleTime: STALE_TIME,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    enabled: !!selectedTenantId,
  });

  // Total customers count
  const customersQuery = useQuery({
    queryKey: sidebarCountsKeys.customers(selectedTenantId),
    queryFn: async () => {
      const response = await getRiskDashboardProfiles();
      if (response.success && typeof response.data?.total === 'number') {
        return response.data.total;
      }
      return null;
    },
    staleTime: STALE_TIME,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    enabled: !!selectedTenantId,
  });

  // Active cases count
  const casesQuery = useQuery({
    queryKey: sidebarCountsKeys.cases(selectedTenantId),
    queryFn: async () => {
      const overview = await getCasesOverview();
      if (overview?.active_cases !== undefined) {
        return overview.active_cases;
      }
      return null;
    },
    staleTime: STALE_TIME,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    enabled: !!selectedTenantId,
  });

  // Pending geolocation alerts count
  const geoQuery = useQuery({
    queryKey: sidebarCountsKeys.geolocation(selectedTenantId),
    queryFn: async () => {
      const response = await getGeoAlertMetrics();
      if (response.success && typeof response.data?.AlertsByStatus?.pending === 'number') {
        return response.data.AlertsByStatus.pending;
      }
      return null;
    },
    staleTime: STALE_TIME,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    enabled: !!selectedTenantId,
  });

  return {
    kycPendingCount: kycQuery.data ?? null,
    watchlistPendingCount: watchlistQuery.data ?? null,
    totalCustomers: customersQuery.data ?? null,
    activeCases: casesQuery.data ?? null,
    pendingGeoAlertCount: geoQuery.data ?? null,
    isLoading: kycQuery.isLoading || watchlistQuery.isLoading || customersQuery.isLoading || casesQuery.isLoading || geoQuery.isLoading,
  };
}
