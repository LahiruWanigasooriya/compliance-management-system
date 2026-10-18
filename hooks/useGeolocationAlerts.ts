"use client"
import { downloadAllGeoAlertsReport, getGeoAlertById, getGeoAlertMetrics, getGeoAlerts, updateGeoAlertAction, updateGeoAlertStatus } from "@/actions/geolocation.actions";
import { useTenant } from "@/components/providers/tenant.provider";
import { GeoAlert, GeoAlertMetrics, GeoAlertNotes, GeoAlertsResponse, GeoAlertUpdateResponse, GetGeoParams } from "@/types/geolocation.types";
import { Response } from "@/types/response.types";
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";

// Query key factory - includes tenant for proper cache scoping
export const geoAlertKeys = {
    all: ['geo-alerts'] as const,
    list: (params?: GetGeoParams, tenantId?: string) => [...geoAlertKeys.all, 'list', params, tenantId] as const,
    detail: (alertId: string, tenantId?: string) => [...geoAlertKeys.all, 'detail', alertId, tenantId] as const,
    metrics: (timeRange: string, tenantId?: string) => [...geoAlertKeys.all, 'metrics', timeRange, tenantId] as const,
};

// Polling interval in milliseconds (30 seconds)
const POLLING_INTERVAL = 30 * 1000;

interface UseGeoLocationReturn {
    geoAlerts: GeoAlert[];
    loading: boolean;
    isFetching: boolean;
    isRefetching: boolean;
    error: string | null;
    metricError: string | null;
    total: number;
    currentPage: number;
    params?: GetGeoParams;
    setParams?: (params: GetGeoParams) => void;
    useGeoAlertById: (alertId: string) => UseQueryResult<Response<GeoAlert>>;
    updateGeoAlertStatusMutation: ReturnType<typeof useMutation<Response<GeoAlertUpdateResponse>, Error, { alertId: string; status: string; }>>;
    geoAlertMetrics: GeoAlertMetrics | null;
    metricsLoading: boolean;
    downloadAllGeoAlertsMutation: ReturnType<typeof useMutation<Blob, Error, { type: string }>>;
    actionGeoAlertMutation: ReturnType<typeof useMutation<Response<GeoAlertUpdateResponse>, Error, { alertId: string; action: string; notes: GeoAlertNotes }>>;
    dataUpdatedAt: number;
    refresh: () => void;
}

export const useGeoLocation = (
    params?: GetGeoParams,
    setParams?: (params: GetGeoParams) => void,
    pollingInterval: number = POLLING_INTERVAL,
    metricsTimeRange: string = "30d"
): UseGeoLocationReturn => {
    const { selectedTenantId } = useTenant();
    const queryClient = useQueryClient();

    const {
        data: geoAlertsData,
        isLoading,
        isFetching,
        isRefetching,
        error: queryError,
        dataUpdatedAt,
    } = useQuery<GeoAlertsResponse>({
        queryKey: geoAlertKeys.list(params, selectedTenantId),
        queryFn: async () => {
            const res = await getGeoAlerts(params);
            if (!res.success) throw new Error(res.message);
            return res.data;
        },
        staleTime: 10 * 1000,
        refetchInterval: pollingInterval,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
        enabled: !!selectedTenantId,
    });

    const {
        data: geoMetricsData,
        isLoading: isGeoMetricsLoading,
        error: MetricsError,
    } = useQuery<GeoAlertMetrics>({
        queryKey: geoAlertKeys.metrics(metricsTimeRange, selectedTenantId),
        queryFn: async () => {
            const res = await getGeoAlertMetrics(metricsTimeRange);
            if (!res.success) {
                throw new Error(res.message);
            }
            return res.data;
        },
        staleTime: 10 * 1000,
        refetchInterval: pollingInterval,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
        enabled: !!selectedTenantId,
    });

    const useGeoAlertById = (alertId: string) => {
        return useQuery({
            queryKey: geoAlertKeys.detail(alertId, selectedTenantId),
            queryFn: () => getGeoAlertById(alertId),
            enabled: !!alertId && !!selectedTenantId,
            staleTime: 10 * 1000,
            refetchOnWindowFocus: true,
        })
    }

    const updateGeoAlertStatusMutation = useMutation({
        mutationFn: ({ alertId, status }: { alertId: string; status: string; }) =>
            updateGeoAlertStatus(alertId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: geoAlertKeys.all });
        },
    });

    const actionGeoAlertMutation = useMutation({
        mutationFn: ({ alertId, action, notes }: { alertId: string; action: string; notes: GeoAlertNotes }) => updateGeoAlertAction(alertId, action, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: geoAlertKeys.all });
        },
    });

    const downloadAllGeoAlertsMutation = useMutation<Blob, Error, {type: string}>({
        mutationFn: ({type}) => downloadAllGeoAlertsReport({format: type }),
        onSuccess: (blob, variables) => {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `all-geo-alerts-report.${variables.type.toLowerCase()}`;
            link.click();
            URL.revokeObjectURL(link.href);
        }
    });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: geoAlertKeys.list(params, selectedTenantId) });
        queryClient.invalidateQueries({ queryKey: geoAlertKeys.metrics(metricsTimeRange, selectedTenantId) });
    };

    return {
        geoAlerts: geoAlertsData?.alerts ?? [],
        total: geoAlertsData?.total ?? 0,
        currentPage: geoAlertsData?.page ?? 1,
        loading: isLoading,
        isFetching,
        isRefetching,
        error: queryError?.message ?? null,
        metricError: MetricsError?.message ?? null,
        params,
        setParams: setParams ?? (() => {}),
        geoAlertMetrics: geoMetricsData ?? null,
        metricsLoading: isGeoMetricsLoading,
        useGeoAlertById,
        updateGeoAlertStatusMutation,
        downloadAllGeoAlertsMutation,
        actionGeoAlertMutation,
        dataUpdatedAt,
        refresh,
    }
}
