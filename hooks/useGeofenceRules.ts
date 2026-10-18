'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/components/providers/tenant.provider';
import {
  getGeofenceRules,
  createGeofenceRule,
  updateGeofenceRule,
  deleteGeofenceRule,
  activateGeofenceRule,
  deactivateGeofenceRule,
  testGeofenceRule,
  getSanctionsList,
  screenCountryForSanctions,
  createJurisdiction,
  updateJurisdiction,
  deleteJurisdiction,
  getSanctions,
  createSanction,
  updateSanction,
  deleteSanction,
} from '@/actions/geolocation.actions';
import {
  CreateGeofenceRuleInput,
  UpdateGeofenceRuleInput,
  TestGeofenceRuleInput,
  CreateJurisdictionInput,
  UpdateJurisdictionInput,
  CreateSanctionInput,
  UpdateSanctionInput,
  SanctionedCountryRecord,
} from '@/types/geolocation.types';
import { toast } from 'sonner';

// Query key factories
export const geofenceRuleKeys = {
  all: ['geofence-rules'] as const,
  list: (params?: { active?: boolean; sort_by?: string }, tenantId?: string) =>
    [...geofenceRuleKeys.all, 'list', params, tenantId] as const,
  detail: (ruleId: string, tenantId?: string) =>
    [...geofenceRuleKeys.all, 'detail', ruleId, tenantId] as const,
};

export const sanctionsKeys = {
  all: ['sanctions'] as const,
  list: (tenantId?: string) => [...sanctionsKeys.all, 'list', tenantId] as const,
  screen: (countryIso: string, tenantId?: string) =>
    [...sanctionsKeys.all, 'screen', countryIso, tenantId] as const,
};

export const jurisdictionKeys = {
  all: ['jurisdictions'] as const,
  list: (tenantId?: string) => [...jurisdictionKeys.all, 'list', tenantId] as const,
};

// Polling interval
const POLLING_INTERVAL = 60 * 1000; // 60 seconds

export function useGeofenceRules(params?: { active?: boolean; sort_by?: string }) {
  const { selectedTenantId, isSwitchingTenant } = useTenant();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isFetching,
    isRefetching,
    error,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: geofenceRuleKeys.list(params, selectedTenantId ?? undefined),
    queryFn: async () => {
      const response = await getGeofenceRules(params);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    refetchInterval: POLLING_INTERVAL,
    refetchOnWindowFocus: true,
    enabled: !isSwitchingTenant,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateGeofenceRuleInput) => {
      const response = await createGeofenceRule(input);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: geofenceRuleKeys.all });
      toast.success('Geofence rule created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create geofence rule');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ ruleId, input }: { ruleId: string; input: UpdateGeofenceRuleInput }) => {
      const response = await updateGeofenceRule(ruleId, input);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: geofenceRuleKeys.all });
      toast.success('Geofence rule updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update geofence rule');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const response = await deleteGeofenceRule(ruleId);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: geofenceRuleKeys.all });
      toast.success('Geofence rule deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete geofence rule');
    },
  });

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const response = await activateGeofenceRule(ruleId);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: geofenceRuleKeys.all });
      toast.success('Geofence rule activated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to activate geofence rule');
    },
  });

  // Deactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const response = await deactivateGeofenceRule(ruleId);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: geofenceRuleKeys.all });
      toast.success('Geofence rule deactivated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to deactivate geofence rule');
    },
  });

  // Test mutation
  const testMutation = useMutation({
    mutationFn: async ({ ruleId, input }: { ruleId: string; input: TestGeofenceRuleInput }) => {
      const response = await testGeofenceRule(ruleId, input);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to test geofence rule');
    },
  });

  // Ensure rules is always an array
  const rules = Array.isArray(data?.rules) ? data.rules : [];

  return {
    rules,
    total: data?.total ?? 0,
    loading: isLoading,
    isFetching,
    isRefetching,
    error,
    dataUpdatedAt,
    refresh: refetch,
    // Mutations
    createRule: createMutation.mutateAsync,
    updateRule: updateMutation.mutateAsync,
    deleteRule: deleteMutation.mutateAsync,
    activateRule: activateMutation.mutateAsync,
    deactivateRule: deactivateMutation.mutateAsync,
    testRule: testMutation.mutateAsync,
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isActivating: activateMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
    isTesting: testMutation.isPending,
  };
}

export function useSanctionsList() {
  const { selectedTenantId, isSwitchingTenant } = useTenant();

  const {
    data,
    isLoading,
    isFetching,
    error,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: sanctionsKeys.list(selectedTenantId ?? undefined),
    queryFn: async () => {
      const response = await getSanctionsList();
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    refetchInterval: POLLING_INTERVAL * 5, // 5 minutes - sanctions change rarely
    refetchOnWindowFocus: true,
    enabled: !isSwitchingTenant,
  });

  // Screen country mutation
  const screenMutation = useMutation({
    mutationFn: async (countryIso: string) => {
      const response = await screenCountryForSanctions(countryIso);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to screen country');
    },
  });

  // Transform sanctioned_countries from map to array
  // API returns: { "CU": ["OFAC"], "IR": ["OFAC", "EU", "UN"], ... }
  // We need: [{ country_iso: "CU", sanction_sources: ["OFAC"], ... }, ...]
  const sanctionedCountries = useMemo(() => {
    const countriesData = data?.sanctioned_countries;
    if (!countriesData || typeof countriesData !== 'object') return [];

    // If it's already an array, use it directly
    if (Array.isArray(countriesData)) return countriesData;

    // Country names mapping for display
    const countryNames: Record<string, string> = {
      CU: 'Cuba',
      IR: 'Iran',
      KP: 'North Korea',
      SY: 'Syria',
      VE: 'Venezuela',
      BY: 'Belarus',
      RU: 'Russia',
      MM: 'Myanmar/Burma',
      SO: 'Somalia',
      LY: 'Libya',
      YE: 'Yemen',
      CF: 'Central African Republic',
      SD: 'Sudan',
      SS: 'South Sudan',
    };

    // Transform map to array
    return Object.entries(countriesData).map(([iso, sources]) => ({
      country_iso: iso,
      country_name: countryNames[iso] || iso,
      sanction_sources: Array.isArray(sources) ? sources : [],
      programs: [],
      sanction_level: (Array.isArray(sources) && sources.length >= 2) ? 'comprehensive' : 'partial',
    }));
  }, [data?.sanctioned_countries]);

  return {
    sanctionedCountries,
    totalCount: data?.total_count ?? Object.keys(data?.sanctioned_countries || {}).length,
    sources: Array.isArray(data?.sources) ? data.sources : [],
    loading: isLoading,
    isFetching,
    error,
    dataUpdatedAt,
    refresh: refetch,
    screenCountry: screenMutation.mutateAsync,
    isScreening: screenMutation.isPending,
  };
}

export function useJurisdictionMutations() {
  const queryClient = useQueryClient();

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateJurisdictionInput) => {
      const response = await createJurisdiction(input);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jurisdictionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['geo-jurisdictions'] }); // Also invalidate existing hook
      toast.success('Jurisdiction created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create jurisdiction');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ jurisdictionId, input }: { jurisdictionId: string; input: UpdateJurisdictionInput }) => {
      const response = await updateJurisdiction(jurisdictionId, input);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jurisdictionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['geo-jurisdictions'] });
      toast.success('Jurisdiction updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update jurisdiction');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (jurisdictionId: string) => {
      const response = await deleteJurisdiction(jurisdictionId);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jurisdictionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['geo-jurisdictions'] });
      toast.success('Jurisdiction deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete jurisdiction');
    },
  });

  return {
    createJurisdiction: createMutation.mutateAsync,
    updateJurisdiction: updateMutation.mutateAsync,
    deleteJurisdiction: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Sanctions CRUD hook
export const sanctionsCrudKeys = {
  all: ['sanctions-crud'] as const,
  list: (params?: Record<string, unknown>, tenantId?: string) =>
    [...sanctionsCrudKeys.all, 'list', params, tenantId] as const,
  detail: (id: string, tenantId?: string) =>
    [...sanctionsCrudKeys.all, 'detail', id, tenantId] as const,
};

export function useSanctions(params?: {
  country_iso?: string;
  source?: string;
  level?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}) {
  const { selectedTenantId, isSwitchingTenant } = useTenant();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isFetching,
    isRefetching,
    error,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: sanctionsCrudKeys.list(params, selectedTenantId ?? undefined),
    queryFn: async () => {
      const response = await getSanctions(params);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    refetchOnWindowFocus: true,
    enabled: !isSwitchingTenant,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateSanctionInput) => {
      const response = await createSanction(input);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sanctionsCrudKeys.all });
      queryClient.invalidateQueries({ queryKey: sanctionsCrudKeys.all }); // Invalidate list endpoint too
      toast.success('Sanction created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create sanction');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ sanctionId, input }: { sanctionId: string; input: UpdateSanctionInput }) => {
      const response = await updateSanction(sanctionId, input);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sanctionsCrudKeys.all });
      toast.success('Sanction updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update sanction');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (sanctionId: string) => {
      const response = await deleteSanction(sanctionId);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sanctionsCrudKeys.all });
      toast.success('Sanction deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete sanction');
    },
  });

  // Ensure sanctions is always an array
  const sanctions: SanctionedCountryRecord[] = Array.isArray(data?.sanctions) ? data.sanctions : [];

  return {
    sanctions,
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 100,
    loading: isLoading,
    isFetching,
    isRefetching,
    error,
    dataUpdatedAt,
    refresh: refetch,
    // Mutations
    createSanction: createMutation.mutateAsync,
    updateSanction: updateMutation.mutateAsync,
    deleteSanction: deleteMutation.mutateAsync,
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
