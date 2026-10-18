"use client"
import { getGeoLocationRecords, getGeoLocationRecordsById } from "@/actions/geolocation.actions";
import { useTenant } from "@/components/providers/tenant.provider";
import { GeoLocationRecord, GeoRecordsResponse, GetGeoParams } from "@/types/geolocation.types";
import { Response } from "@/types/response.types";
import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";

// Query key factory - includes tenant for proper cache scoping
export const geoRecordsKeys = {
    all: ['geo-records'] as const,
    list: (params?: GetGeoParams, tenantId?: string) => [...geoRecordsKeys.all, 'list', params, tenantId] as const,
    detail: (recordId: string, tenantId?: string) => [...geoRecordsKeys.all, 'detail', recordId, tenantId] as const,
};

// Polling interval in milliseconds (30 seconds)
const POLLING_INTERVAL = 30 * 1000;

interface UseGeoLocationRecordsReturn {
    geoRecords: GeoLocationRecord[];
    loading: boolean;
    isFetching: boolean;
    isRefetching: boolean;
    error: string | null;
    total: number;
    params?: GetGeoParams;
    setParams?: (params: GetGeoParams) => void;
    useGeoRecordById: (recordId: string) => UseQueryResult<Response<GeoLocationRecord>>;
    dataUpdatedAt: number;
    refresh: () => void;
}

export const useGeoLocationRecord = (
    params?: GetGeoParams,
    setParams?: (params: GetGeoParams) => void,
    pollingInterval: number = POLLING_INTERVAL
): UseGeoLocationRecordsReturn => {
    const { selectedTenantId } = useTenant();
    const queryClient = useQueryClient();

    const {
        data: geoRecordsData,
        isLoading,
        isFetching,
        isRefetching,
        error: queryError,
        dataUpdatedAt,
    } = useQuery<GeoRecordsResponse>({
        queryKey: geoRecordsKeys.list(params, selectedTenantId),
        queryFn: async () => {
            const res = await getGeoLocationRecords(params);
            if (!res.success) throw new Error(res.message);
            return res.data;
        },
        staleTime: 10 * 1000,
        refetchInterval: pollingInterval,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
        enabled: !!selectedTenantId,
    });

    const useGeoRecordById = (recordId: string) => {
        return useQuery({
            queryKey: geoRecordsKeys.detail(recordId, selectedTenantId),
            queryFn: () => getGeoLocationRecordsById(recordId),
            enabled: !!recordId && !!selectedTenantId,
            staleTime: 10 * 1000,
            refetchOnWindowFocus: true,
        })
    }

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: geoRecordsKeys.list(params, selectedTenantId) });
    };

    return {
        geoRecords: geoRecordsData?.points ?? [],
        total: geoRecordsData?.total ?? 0,
        loading: isLoading,
        isFetching,
        isRefetching,
        error: queryError?.message ?? null,
        params,
        setParams: setParams ?? (() => {}),
        useGeoRecordById,
        dataUpdatedAt,
        refresh,
    }
}
