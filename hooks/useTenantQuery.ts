"use client";

import { useQuery, useQueryClient, UseQueryOptions, QueryKey } from "@tanstack/react-query";
import { useTenant } from "@/components/providers/tenant.provider";

/**
 * Options for useTenantQuery
 * Extends React Query options with tenant-specific options
 */
export interface TenantQueryOptions<TData, TError = Error>
  extends Omit<UseQueryOptions<TData, TError, TData, QueryKey>, "queryKey" | "queryFn"> {
  /** Base query key (tenant ID will be appended automatically) */
  queryKey: QueryKey;
  /** Query function that fetches data */
  queryFn: () => Promise<TData>;
  /** Initial data from SSR - will be ignored after tenant switch */
  initialData?: TData;
}

/**
 * Tenant-aware query hook that automatically:
 * - Includes tenant ID in query keys for proper cache scoping
 * - Ignores initialData after tenant has been switched
 * - Provides consistent behavior across all data fetching hooks
 * - Queries run during tenant switch so overlay waits for completion
 */
export function useTenantQuery<TData, TError = Error>({
  queryKey,
  queryFn,
  initialData,
  enabled = true,
  ...options
}: TenantQueryOptions<TData, TError>) {
  const { selectedTenantId, hasSwitchedTenant } = useTenant();
  const queryClient = useQueryClient();

  // Build tenant-scoped query key
  const tenantQueryKey = [...queryKey, selectedTenantId];

  // Only use initialData before any tenant switch has occurred
  const effectiveInitialData = hasSwitchedTenant ? undefined : initialData;

  const query = useQuery<TData, TError>({
    queryKey: tenantQueryKey,
    queryFn,
    initialData: effectiveInitialData,
    enabled: enabled && !!selectedTenantId,
    ...options,
  });

  // Manual refresh function using the tenant-scoped key
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: tenantQueryKey });
  };

  return {
    ...query,
    refresh,
    tenantQueryKey,
  };
}

/**
 * Hook to create tenant-scoped query keys
 * Useful when you need to manually invalidate queries
 */
export function useTenantQueryKey(baseKey: QueryKey): QueryKey {
  const { selectedTenantId } = useTenant();
  return [...baseKey, selectedTenantId];
}

/**
 * Hook to invalidate all queries for the current tenant
 */
export function useInvalidateTenantQueries() {
  const { selectedTenantId } = useTenant();
  const queryClient = useQueryClient();

  return (baseKey?: QueryKey) => {
    if (baseKey) {
      queryClient.invalidateQueries({ queryKey: [...baseKey, selectedTenantId] });
    } else {
      // Invalidate all queries - they all include tenant ID
      queryClient.invalidateQueries();
    }
  };
}
