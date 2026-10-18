"use client"
import { getGeoJurisdictions } from "@/actions/geolocation.actions";
import { useTenant } from "@/components/providers/tenant.provider";
import { GeoJurisdiction, GeoJurisdictionsResponse } from "@/types/geolocation.types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Query key factory - includes tenant for proper cache scoping
export const geoJurisdictionKeys = {
    all: ['geo-jurisdictions'] as const,
    list: (tenantId?: string) => [...geoJurisdictionKeys.all, 'list', tenantId] as const,
};

// Polling interval in milliseconds (60 seconds - jurisdictions change less frequently)
const POLLING_INTERVAL = 60 * 1000;

interface UseGeoJurisdictionsReturn {
    jurisdictions: GeoJurisdiction[];
    loading: boolean;
    isFetching: boolean;
    isRefetching: boolean;
    error: string | null;
    total: number;
    dataUpdatedAt: number;
    refresh: () => void;
}

export const useGeoJurisdictions = (
    pollingInterval: number = POLLING_INTERVAL
): UseGeoJurisdictionsReturn => {
    const { selectedTenantId } = useTenant();
    const queryClient = useQueryClient();

    const {
        data: jurisdictionsData,
        isLoading,
        isFetching,
        isRefetching,
        error: queryError,
        dataUpdatedAt,
    } = useQuery<GeoJurisdictionsResponse>({
        queryKey: geoJurisdictionKeys.list(selectedTenantId),
        queryFn: async () => {
            const res = await getGeoJurisdictions();
            if (!res.success) throw new Error(res.message);
            return res.data;
        },
        staleTime: 30 * 1000,
        refetchInterval: pollingInterval,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
        enabled: !!selectedTenantId,
    });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: geoJurisdictionKeys.list(selectedTenantId) });
    };

    return {
        jurisdictions: jurisdictionsData?.jurisdictions ?? [],
        total: jurisdictionsData?.total ?? 0,
        loading: isLoading,
        isFetching,
        isRefetching,
        error: queryError?.message ?? null,
        dataUpdatedAt,
        refresh,
    }
}
