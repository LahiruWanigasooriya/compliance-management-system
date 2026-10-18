"use client"
import { downloadAllGeoAuditLogsReport, getGeoLogs } from "@/actions/geolocation.actions";
import { useTenant } from "@/components/providers/tenant.provider";
import { GeoLog, GeoLogsResponse, GetGeoParams } from "@/types/geolocation.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query key factory - includes tenant for proper cache scoping
export const geoLogsKeys = {
    all: ['geo-logs'] as const,
    list: (params: GetGeoParams, tenantId?: string) => [...geoLogsKeys.all, 'list', params, tenantId] as const,
};

// Polling interval in milliseconds (30 seconds)
const POLLING_INTERVAL = 30 * 1000;

interface UseGeoLocationLogsReturn {
    geoLogs: GeoLog[];
    loading: boolean;
    isFetching: boolean;
    isRefetching: boolean;
    error: string | null;
    total: number;
    currentPage: number;
    params: GetGeoParams;
    setParams: (params: GetGeoParams) => void;
    dataUpdatedAt: number;
    refresh: () => void;
    downloadAllGeoAuditLogsMutation: ReturnType<typeof useMutation<Blob, Error, { type: string }>>;
}

export const useGeoLocationLogs = (
    params: GetGeoParams,
    setParams: (params: GetGeoParams) => void,
    pollingInterval: number = POLLING_INTERVAL
): UseGeoLocationLogsReturn => {
    const { selectedTenantId } = useTenant();
    const queryClient = useQueryClient();

    const {
        data: geoLogsData,
        isLoading,
        isFetching,
        isRefetching,
        error: queryError,
        dataUpdatedAt,
    } = useQuery<GeoLogsResponse>({
        queryKey: geoLogsKeys.list(params, selectedTenantId),
        queryFn: async () => {
            const res = await getGeoLogs(params);
            if (!res.success) throw new Error(res.message);
            return res.data;
        },
        staleTime: 10 * 1000,
        refetchInterval: pollingInterval,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
        enabled: !!selectedTenantId,
    });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: geoLogsKeys.list(params, selectedTenantId) });
    };

    const downloadAllGeoAuditLogsMutation = useMutation<Blob, Error, {type: string}>({
        mutationFn: ({type}) => downloadAllGeoAuditLogsReport({format: type }),
        onSuccess: (blob, variables) => {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `all-geo-audit-logs-report.${variables.type.toLowerCase()}`;
            link.click();
            URL.revokeObjectURL(link.href);
        }
    });
    

    return {
        geoLogs: geoLogsData?.logs ?? [],
        total: geoLogsData?.total ?? 0,
        currentPage: geoLogsData?.page ?? 1,
        loading: isLoading,
        isFetching,
        isRefetching,
        error: queryError?.message ?? null,
        params,
        setParams: setParams ?? (() => {}),
        dataUpdatedAt,
        refresh,
        downloadAllGeoAuditLogsMutation
    }
}
