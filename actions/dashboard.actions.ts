'use server';

import { auth, createServerAxios } from '@/utils/axios_server';
import { Response } from '@/types/response.types';
import {
  ComplianceRiskDashboard,
  RiskOverview,
  AlertsBreakdown,
  CasesMetrics,
  ComplianceMetrics,
  KPIMetrics,
  HighRiskCustomerSummary,
  WatchlistMatchesSummary,
  QuickStatsSummary,
  SystemStatusInfo,
  CaseTrendAnalysis,
  TimeRange,
  TIME_RANGE_MAP,
  DashboardExportRequest,
  DashboardExportResponse,
  HighRiskCustomersResponse,
} from '@/types/dashboard.types';
import { SystemHealthDashboardData } from '@/types/sysconfig.types';

/**
 * Get the complete compliance and risk dashboard data
 */
export const getComplianceRiskDashboard = async (
  timeRange: string = '24h',
): Promise<Response<ComplianceRiskDashboard>> => {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );

    const apiTimeRange = TIME_RANGE_MAP[timeRange] || 'last_24_hours';

    const response = await axiosInstance.get('/api/v1/analytics/dashboard', {
      params: { time_range: apiTimeRange },
    });

    return {
      success: true,
      data: response.data,
      message: 'Dashboard data fetched successfully',
    };
  } catch (error: any) {
    console.error('Error fetching compliance risk dashboard:', error);
    return {
      success: false,
      data: null as any,
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch dashboard data',
    };
  }
};

/**
 * Get risk overview (overall risk score and trend)
 */
export const getRiskOverview = async (
  timeRange: string = '24h',
): Promise<Response<RiskOverview>> => {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );

    const apiTimeRange = TIME_RANGE_MAP[timeRange] || 'last_24_hours';

    const response = await axiosInstance.get(
      '/api/v1/analytics/dashboard/risk-overview',
      {
        params: { time_range: apiTimeRange },
      },
    );

    return {
      success: true,
      data: response.data,
      message: 'Risk overview fetched successfully',
    };
  } catch (error: any) {
    console.error('Error fetching risk overview:', error);
    return {
      success: false,
      data: null as any,
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch risk overview',
    };
  }
};

/**
 * Get alerts breakdown (pending alerts with criticality)
 */
export const getAlertsBreakdown = async (
  timeRange: string = '24h',
): Promise<Response<AlertsBreakdown>> => {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );

    const apiTimeRange = TIME_RANGE_MAP[timeRange] || 'last_24_hours';

    const response = await axiosInstance.get(
      '/api/v1/analytics/dashboard/alerts-breakdown',
      {
        params: { time_range: apiTimeRange },
      },
    );

    return {
      success: true,
      data: response.data,
      message: 'Alerts breakdown fetched successfully',
    };
  } catch (error: any) {
    console.error('Error fetching alerts breakdown:', error);
    return {
      success: false,
      data: null as any,
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch alerts breakdown',
    };
  }
};

/**
 * Get cases metrics (active cases with status)
 */
export const getCasesMetrics = async (
  timeRange: string = '24h',
): Promise<Response<CasesMetrics>> => {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );

    const apiTimeRange = TIME_RANGE_MAP[timeRange] || 'last_24_hours';

    const response = await axiosInstance.get(
      '/api/v1/analytics/dashboard/cases-metrics',
      {
        params: { time_range: apiTimeRange },
      },
    );

    return {
      success: true,
      data: response.data,
      message: 'Cases metrics fetched successfully',
    };
  } catch (error: any) {
    console.error('Error fetching cases metrics:', error);
    return {
      success: false,
      data: null as any,
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch cases metrics',
    };
  }
};

/**
 * Get compliance metrics (compliance score and rate)
 */
export const getComplianceMetrics = async (
  timeRange: string = '24h',
): Promise<Response<ComplianceMetrics>> => {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );

    const apiTimeRange = TIME_RANGE_MAP[timeRange] || 'last_24_hours';

    const response = await axiosInstance.get(
      '/api/v1/analytics/dashboard/compliance-metrics',
      {
        params: { time_range: apiTimeRange },
      },
    );

    return {
      success: true,
      data: response.data,
      message: 'Compliance metrics fetched successfully',
    };
  } catch (error: any) {
    console.error('Error fetching compliance metrics:', error);
    return {
      success: false,
      data: null as any,
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch compliance metrics',
    };
  }
};

/**
 * Get KPI metrics (resolution time, false positive rate, resolved cases)
 */
export const getKPIMetrics = async (
  timeRange: string = '24h',
): Promise<Response<KPIMetrics>> => {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );

    const apiTimeRange = TIME_RANGE_MAP[timeRange] || 'last_24_hours';

    const response = await axiosInstance.get(
      '/api/v1/analytics/dashboard/kpi-metrics',
      {
        params: { time_range: apiTimeRange },
      },
    );

    return {
      success: true,
      data: response.data,
      message: 'KPI metrics fetched successfully',
    };
  } catch (error: any) {
    console.error('Error fetching KPI metrics:', error);
    return {
      success: false,
      data: null as any,
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch KPI metrics',
    };
  }
};

/**
 * Get high risk customers
 */
export const getHighRiskCustomers = async (
  limit: number = 10,
): Promise<Response<HighRiskCustomersResponse>> => {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );

    const response = await axiosInstance.get(
      '/api/v1/analytics/dashboard/high-risk-customers',
      {
        params: { limit },
      },
    );

    return {
      success: true,
      data: response.data,
      message: 'High risk customers fetched successfully',
    };
  } catch (error: any) {
    console.error('Error fetching high risk customers:', error);
    return {
      success: false,
      data: { high_risk_customers: [], total: 0 },
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch high risk customers',
    };
  }
};

/**
 * Get watchlist matches
 */
export const getWatchlistMatches = async (
  timeRange: string = '24h',
): Promise<Response<WatchlistMatchesSummary>> => {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );

    const apiTimeRange = TIME_RANGE_MAP[timeRange] || 'last_24_hours';

    const response = await axiosInstance.get(
      '/api/v1/analytics/dashboard/watchlist-matches',
      {
        params: { time_range: apiTimeRange },
      },
    );

    return {
      success: true,
      data: response.data,
      message: 'Watchlist matches fetched successfully',
    };
  } catch (error: any) {
    console.error('Error fetching watchlist matches:', error);
    return {
      success: false,
      data: null as any,
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch watchlist matches',
    };
  }
};

/**
 * Get quick stats summary
 */
export const getQuickStats = async (): Promise<Response<QuickStatsSummary>> => {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );

    const response = await axiosInstance.get(
      '/api/v1/analytics/dashboard/quick-stats',
    );

    return {
      success: true,
      data: response.data,
      message: 'Quick stats fetched successfully',
    };
  } catch (error: any) {
    console.error('Error fetching quick stats:', error);
    return {
      success: false,
      data: null as any,
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch quick stats',
    };
  }
};

/**
 * Get system status
 */
export const getSystemStatus = async (): Promise<
  Response<SystemStatusInfo>
> => {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );

    const response = await axiosInstance.get(
      '/api/v1/analytics/dashboard/system-status',
    );

    return {
      success: true,
      data: response.data,
      message: 'System status fetched successfully',
    };
  } catch (error: any) {
    console.error('Error fetching system status:', error);
    return {
      success: false,
      data: { status: 'offline', last_checked_at: new Date().toISOString() },
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch system status',
    };
  }
};

/**
 * Get case trends
 */
export const getCaseTrends = async (): Promise<Response<CaseTrendAnalysis>> => {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );

    const response = await axiosInstance.get(
      '/api/v1/analytics/dashboard/case-trends',
    );

    return {
      success: true,
      data: response.data,
      message: 'Case trends fetched successfully',
    };
  } catch (error: any) {
    console.error('Error fetching case trends:', error);
    return {
      success: false,
      data: null as any,
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch case trends',
    };
  }
};

/**
 * Export dashboard data (using new GET-based export endpoint)
 */
export const exportDashboard = async (
  request: DashboardExportRequest,
): Promise<
  Response<DashboardExportResponse | { base64: string; mimeType: string }>
> => {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );

    const apiTimeRange =
      TIME_RANGE_MAP[request.time_range as string] || 'last_24_hours';

    // Use GET-based export endpoint with query parameters
    const response = await axiosInstance.get(
      '/api/v1/analytics/export/dashboard',
      {
        params: {
          format: request.format,
          time_range: apiTimeRange,
        },
        responseType: request.format === 'json' ? 'json' : 'arraybuffer',
      },
    );

    if (request.format === 'json') {
      return {
        success: true,
        data: response.data,
        message: 'Dashboard exported successfully',
      };
    }

    // For PDF/CSV, convert to base64 for transfer to client
    const base64 = Buffer.from(response.data).toString('base64');
    const mimeType = request.format === 'pdf' ? 'application/pdf' : 'text/csv';

    return {
      success: true,
      data: { base64, mimeType },
      message: 'Dashboard exported successfully',
    };
  } catch (error: any) {
    console.error('Error exporting dashboard:', error);
    return {
      success: false,
      data: null as any,
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to export dashboard',
    };
  }
};

/**
 * Export alerts data
 */
export const exportAlerts = async (
  format: 'csv' | 'json' | 'pdf',
  filters?: {
    severity?: string;
    status?: string;
    metric_name?: string;
    start_time?: string;
    end_time?: string;
    limit?: number;
  },
): Promise<Response<{ base64: string; mimeType: string } | any>> => {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );

    const response = await axiosInstance.get(
      '/api/v1/analytics/export/alerts',
      {
        params: {
          format,
          ...filters,
        },
        responseType: format === 'json' ? 'json' : 'arraybuffer',
      },
    );

    if (format === 'json') {
      return {
        success: true,
        data: response.data,
        message: 'Alerts exported successfully',
      };
    }

    // For PDF/CSV, convert to base64 for transfer to client
    const base64 = Buffer.from(response.data).toString('base64');
    const mimeType = format === 'pdf' ? 'application/pdf' : 'text/csv';

    return {
      success: true,
      data: { base64, mimeType },
      message: 'Alerts exported successfully',
    };
  } catch (error: any) {
    console.error('Error exporting alerts:', error);
    return {
      success: false,
      data: null as any,
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to export alerts',
    };
  }
};

/**
 * Export high-risk customers data
 */
export const exportHighRiskCustomers = async (
  format: 'csv' | 'json' | 'pdf',
  limit: number = 100,
): Promise<Response<{ base64: string; mimeType: string } | any>> => {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );

    const response = await axiosInstance.get(
      '/api/v1/analytics/export/high-risk-customers',
      {
        params: {
          format,
          limit,
        },
        responseType: format === 'json' ? 'json' : 'arraybuffer',
      },
    );

    if (format === 'json') {
      return {
        success: true,
        data: response.data,
        message: 'High-risk customers exported successfully',
      };
    }

    // For PDF/CSV, convert to base64 for transfer to client
    const base64 = Buffer.from(response.data).toString('base64');
    const mimeType = format === 'pdf' ? 'application/pdf' : 'text/csv';

    return {
      success: true,
      data: { base64, mimeType },
      message: 'High-risk customers exported successfully',
    };
  } catch (error: any) {
    console.error('Error exporting high-risk customers:', error);
    return {
      success: false,
      data: null as any,
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to export high-risk customers',
    };
  }
};

/**
 * Export metrics data
 */
export const exportMetrics = async (
  format: 'csv' | 'json' | 'pdf',
  filters?: {
    metrics?: string;
    source?: string;
    start_time?: string;
    end_time?: string;
    limit?: number;
  },
): Promise<Response<{ base64: string; mimeType: string } | any>> => {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );

    const response = await axiosInstance.get(
      '/api/v1/analytics/export/metrics',
      {
        params: {
          format,
          ...filters,
        },
        responseType: format === 'json' ? 'json' : 'arraybuffer',
      },
    );

    if (format === 'json') {
      return {
        success: true,
        data: response.data,
        message: 'Metrics exported successfully',
      };
    }

    // For PDF/CSV, convert to base64 for transfer to client
    const base64 = Buffer.from(response.data).toString('base64');
    const mimeType = format === 'pdf' ? 'application/pdf' : 'text/csv';

    return {
      success: true,
      data: { base64, mimeType },
      message: 'Metrics exported successfully',
    };
  } catch (error: any) {
    console.error('Error exporting metrics:', error);
    return {
      success: false,
      data: null as any,
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to export metrics',
    };
  }
};

/**
 * Get system health dashboard data
 * Returns real-time health metrics for all services
 */
export const getSystemHealthDashboard = async (): Promise<
  Response<SystemHealthDashboardData>
> => {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );

    const response = await axiosInstance.get(
      '/api/v1/analytics/dashboard/system-health',
    );

    return {
      success: true,
      data: response.data,
      message: 'System health data fetched successfully',
    };
  } catch (error: any) {
    console.error('Error fetching system health dashboard:', error);
    return {
      success: false,
      data: null as any,
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch system health data',
    };
  }
};
