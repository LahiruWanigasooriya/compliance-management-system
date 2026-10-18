'use server';

import { Response } from '@/types/response.types';
import { convertObjectKeysToCamelCase } from '@/utils/convertObjectKeysToCamelCase';
import {
  CustomerRiskDashboardResponse,
  CustomerProfileDetailResponse,
} from '@/types/customer-risk.types';
// import { auth } from '@/auth';
import { auth, createServerAxios } from '@/utils/axios_server';
import { APPLICATION } from '@/constants/application';

export async function getRiskDashboardMetrics(
  params?: Record<string, string | number | undefined | null>
): Promise<Response<CustomerRiskDashboardResponse>> {
  try {
    const queryParams = params
      ? new URLSearchParams(params as Record<string, string>).toString()
      : '';

    const session = await auth();

    console.log('Session in getRiskDashboardMetrics:', session);
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );

    const response = await axiosInstance.get(
      `api/v1/risk-dashboard/metrics${queryParams ? `?${queryParams}` : ''}`
    );

    // Check if response has success wrapper or returns data directly
    const rawData = response.data?.data || response.data;
    const camelCasedData = convertObjectKeysToCamelCase(rawData || {});

    // If API returns data directly (no success wrapper), consider it successful if we have data
    const isSuccessful =
      response.data?.success !== undefined
        ? response.data.success
        : camelCasedData && Object.keys(camelCasedData).length > 0;

    return {
      success: isSuccessful,
      data: {
        data: camelCasedData,
        metadata: response.data?.metadata,
        timestamp: response.data?.timestamp,
      } as CustomerRiskDashboardResponse,
      message:
        response.data?.message ??
        'Risk dashboard metrics retrieved successfully',
    };
  } catch (error) {
    console.error('Error fetching risk dashboard metrics:', error);
    return {
      success: false,
      data: {} as CustomerRiskDashboardResponse,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to fetch risk dashboard metrics',
    };
  }
}

export const getRiskDashboardProfileById = async (
  id: string
): Promise<Response<CustomerProfileDetailResponse>> => {
  try {
    const session = await auth();

    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );

    const response = await axiosInstance.get(
      `api/v1/risk-dashboard/profiles/${id}`
    );

    // Return the data as-is (snake_case) since types expect snake_case
    return {
      success: true,
      data: response.data as CustomerProfileDetailResponse,
      message: 'Profile fetched successfully',
    };
  } catch (error: unknown) {
    console.error('Error fetching risk dashboard profile:', error);

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };

      return {
        success: false,
        data: {} as CustomerProfileDetailResponse,
        message:
          axiosError.response?.data?.message ||
          axiosError.message ||
          'Failed to fetch profile',
      };
    }

    return {
      success: false,
      data: {} as CustomerProfileDetailResponse,
      message: 'Failed to fetch profile',
    };
  }
};

export interface ExportProfilesFilters {
  format: 'csv' | 'json' | 'pdf';
  risk_category?: string;
  entity_type?: string;
  status?: string;
  date_preset?: string;
}

export interface ExportResponse {
  base64: string;
  mimeType: string;
}

export async function exportRiskProfiles(
  filters: ExportProfilesFilters
): Promise<Response<ExportResponse | null>> {
  try {
    const session = await auth();

    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );

    const params: Record<string, any> = {
      format: filters.format,
    };

    if (filters.risk_category) params.risk_category = filters.risk_category;
    if (filters.entity_type) params.entity_type = filters.entity_type;
    if (filters.status) params.status = filters.status;
    if (filters.date_preset) params.date_preset = filters.date_preset;

    const response = await axiosInstance.get(
      'api/v1/risk-dashboard/export/profiles',
      {
        params,
        responseType: 'arraybuffer',
      }
    );

    // Convert ArrayBuffer to base64 for serialization across server/client boundary
    const base64 = Buffer.from(response.data).toString('base64');

    // Determine MIME type based on format
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      csv: 'text/csv',
      json: 'application/json',
    };

    return {
      success: true,
      data: {
        base64,
        mimeType: mimeTypes[filters.format] || 'application/octet-stream',
      },
      message: 'Profiles exported successfully',
    };
  } catch (error) {
    console.error('Error exporting risk profiles:', error);
    return {
      success: false,
      data: null,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to export risk profiles',
    };
  }
}

export async function exportSingleProfile(
  profileId: string,
  format: 'csv' | 'json' | 'pdf'
): Promise<Response<ExportResponse | null>> {
  try {
    const session = await auth();

    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );

    const response = await axiosInstance.get(
      'api/v1/risk-dashboard/export/profile',
      {
        params: {
          profile_id: profileId,
          format,
        },
        responseType: 'arraybuffer',
      }
    );

    // Convert ArrayBuffer to base64 for serialization across server/client boundary
    const base64 = Buffer.from(response.data).toString('base64');

    // Determine MIME type based on format
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      csv: 'text/csv',
      json: 'application/json',
    };

    return {
      success: true,
      data: {
        base64,
        mimeType: mimeTypes[format] || 'application/octet-stream',
      },
      message: 'Profile exported successfully',
    };
  } catch (error) {
    console.error('Error exporting profile:', error);
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : 'Failed to export profile',
    };
  }
}

// ============================================
// EDD Request Actions
// ============================================

import type {
  EDDRequest,
  CreateEDDRequest,
  UpdateEDDRequest,
  EDDRequestFilter,
  EDDRequestSummary,
  EDDRequestListResponse,
  GeolocationHistoryFilter,
  GeolocationHistoryResponse,
  GeolocationSummaryAPI,
  AlertHistoryFilter,
  AlertHistoryResponse,
} from '@/types/customer-risk.types';

export async function createEDDRequest(
  profileId: string,
  data: CreateEDDRequest
): Promise<Response<EDDRequest>> {
  try {
    const session = await auth();

    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );

    const response = await axiosInstance.post(
      `api/v1/risk-dashboard/edd-requests?profile_id=${profileId}`,
      data
    );

    return {
      success: true,
      data: response.data as EDDRequest,
      message: 'EDD request created successfully',
    };
  } catch (error: any) {
    console.error('Error creating EDD request:', error);

    // Extract backend error message if available
    const backendMessage =
      error?.response?.data?.error || error?.response?.data?.message;
    const errorMessage =
      backendMessage || error?.message || 'Failed to create EDD request';

    return {
      success: false,
      data: {} as EDDRequest,
      message: errorMessage,
    };
  }
}

export async function getEDDRequests(
  filter: EDDRequestFilter
): Promise<Response<EDDRequestListResponse>> {
  try {
    const session = await auth();

    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );

    const params: Record<string, any> = {
      profile_id: filter.profile_id,
    };

    if (filter.status && filter.status.length > 0) {
      params.status = filter.status;
    }
    if (filter.document_type && filter.document_type.length > 0) {
      params.document_type = filter.document_type;
    }
    if (filter.start_date) params.start_date = filter.start_date;
    if (filter.end_date) params.end_date = filter.end_date;
    if (filter.limit) params.limit = filter.limit;
    if (filter.offset) params.offset = filter.offset;

    const response = await axiosInstance.get(
      'api/v1/risk-dashboard/edd-requests',
      { params }
    );

    return {
      success: true,
      data: response.data as EDDRequestListResponse,
      message: 'EDD requests retrieved successfully',
    };
  } catch (error) {
    console.error('Error fetching EDD requests:', error);
    return {
      success: false,
      data: { records: [], total: 0, limit: 0, offset: 0 },
      message:
        error instanceof Error ? error.message : 'Failed to fetch EDD requests',
    };
  }
}

export async function getEDDRequest(
  requestId: string
): Promise<Response<EDDRequest>> {
  try {
    const session = await auth();

    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );

    const response = await axiosInstance.get(
      `api/v1/risk-dashboard/edd-requests/${requestId}`
    );

    return {
      success: true,
      data: response.data as EDDRequest,
      message: 'EDD request retrieved successfully',
    };
  } catch (error) {
    console.error('Error fetching EDD request:', error);
    return {
      success: false,
      data: {} as EDDRequest,
      message:
        error instanceof Error ? error.message : 'Failed to fetch EDD request',
    };
  }
}

export async function updateEDDRequest(
  requestId: string,
  data: UpdateEDDRequest
): Promise<Response<EDDRequest>> {
  try {
    const session = await auth();

    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );

    const response = await axiosInstance.patch(
      `api/v1/risk-dashboard/edd-requests/${requestId}`,
      data
    );

    return {
      success: true,
      data: response.data as EDDRequest,
      message: 'EDD request updated successfully',
    };
  } catch (error) {
    console.error('Error updating EDD request:', error);
    return {
      success: false,
      data: {} as EDDRequest,
      message:
        error instanceof Error ? error.message : 'Failed to update EDD request',
    };
  }
}

export async function getEDDSummary(
  profileId: string
): Promise<Response<EDDRequestSummary>> {
  try {
    const session = await auth();

    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );

    const response = await axiosInstance.get(
      `api/v1/risk-dashboard/edd-summary?profile_id=${profileId}`
    );

    return {
      success: true,
      data: response.data as EDDRequestSummary,
      message: 'EDD summary retrieved successfully',
    };
  } catch (error) {
    console.error('Error fetching EDD summary:', error);
    return {
      success: false,
      data: {
        total_requests: 0,
        pending_requests: 0,
        submitted_requests: 0,
        approved_requests: 0,
        rejected_requests: 0,
        expired_requests: 0,
        cancelled_requests: 0,
      },
      message:
        error instanceof Error ? error.message : 'Failed to fetch EDD summary',
    };
  }
}

// ============================================
// Geolocation History Actions
// ============================================

export async function getGeolocationHistory(
  filter: GeolocationHistoryFilter
): Promise<Response<GeolocationHistoryResponse>> {
  try {
    const session = await auth();

    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );

    const params: Record<string, any> = {
      profile_id: filter.profile_id,
    };

    if (filter.start_date) params.start_date = filter.start_date;
    if (filter.end_date) params.end_date = filter.end_date;
    if (filter.date_preset) params.date_preset = filter.date_preset;
    if (filter.event_type && filter.event_type.length > 0) {
      params.event_type = filter.event_type;
    }
    if (filter.risk_level && filter.risk_level.length > 0) {
      params.risk_level = filter.risk_level;
    }
    if (filter.country_iso) params.country_iso = filter.country_iso;
    if (filter.is_anonymizer !== undefined) {
      params.is_anonymizer = filter.is_anonymizer;
    }
    if (filter.limit) params.limit = filter.limit;
    if (filter.offset) params.offset = filter.offset;

    const response = await axiosInstance.get(
      'api/v1/risk-dashboard/geolocation-history',
      { params }
    );

    return {
      success: true,
      data: response.data as GeolocationHistoryResponse,
      message: 'Geolocation history retrieved successfully',
    };
  } catch (error: any) {
    console.error('Error fetching geolocation history:', error);

    const backendMessage =
      error?.response?.data?.error || error?.response?.data?.message;
    const errorMessage =
      backendMessage || error?.message || 'Failed to fetch geolocation history';

    return {
      success: false,
      data: { records: [], total: 0, limit: 0, offset: 0 },
      message: errorMessage,
    };
  }
}

export async function getGeolocationSummary(
  profileId: string
): Promise<Response<GeolocationSummaryAPI>> {
  try {
    const session = await auth();

    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );

    const response = await axiosInstance.get(
      `api/v1/risk-dashboard/geolocation-summary?profile_id=${profileId}`
    );

    return {
      success: true,
      data: response.data as GeolocationSummaryAPI,
      message: 'Geolocation summary retrieved successfully',
    };
  } catch (error: any) {
    console.error('Error fetching geolocation summary:', error);

    const backendMessage =
      error?.response?.data?.error || error?.response?.data?.message;
    const errorMessage =
      backendMessage || error?.message || 'Failed to fetch geolocation summary';

    return {
      success: false,
      data: {
        recent_locations: [],
        recent_ips: [],
        recent_devices: [],
        anonymizer_attempts: [],
        total_records: 0,
        location_changes: 0,
        country_changes: 0,
        anonymizer_count: 0,
        unique_countries: 0,
        unique_devices: 0,
      },
      message: errorMessage,
    };
  }
}

// ============================================
// Export Geolocation History Actions
// ============================================

export interface ExportGeolocationFilter {
  profile_id: string;
  format: 'csv' | 'json' | 'pdf';
  date_preset?: string;
  limit?: number;
}

export interface ExportGeolocationResponse {
  base64: string;
  mimeType: string;
}

export async function exportGeolocationHistory(
  filter: ExportGeolocationFilter
): Promise<Response<ExportGeolocationResponse | null>> {
  try {
    const session = await auth();

    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );

    const params: Record<string, string | number> = {
      profile_id: filter.profile_id,
      format: filter.format,
    };

    if (filter.date_preset) params.date_preset = filter.date_preset;
    if (filter.limit) params.limit = filter.limit;

    const response = await axiosInstance.get(
      'api/v1/risk-dashboard/export/geolocation-history',
      {
        params,
        responseType: 'arraybuffer',
      }
    );

    // Convert arraybuffer to base64 for serialization
    const base64 = Buffer.from(response.data).toString('base64');
    const mimeType = response.headers['content-type'] ||
      (filter.format === 'pdf' ? 'application/pdf' :
       filter.format === 'json' ? 'application/json' : 'text/csv');

    return {
      success: true,
      data: { base64, mimeType },
      message: 'Geolocation history exported successfully',
    };
  } catch (error: any) {
    console.error('Error exporting geolocation history:', error);

    const backendMessage =
      error?.response?.data?.error || error?.response?.data?.message;
    const errorMessage =
      backendMessage ||
      error?.message ||
      'Failed to export geolocation history';

    return {
      success: false,
      data: null,
      message: errorMessage,
    };
  }
}

// ============================================
// Case History Actions
// ============================================

export interface CaseHistoryFilter {
  profile_id: string;
  category?: string[];
  status?: string[];
  priority?: string[];
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface CaseHistoryRecord {
  id: string;
  profile_id: string;
  case_number: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  source_service: string;
  external_reference: string;
  notes: string;
  assigned_to: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface CaseHistoryResponse {
  records: CaseHistoryRecord[];
  total: number;
  limit: number;
  offset: number;
}

export async function getCaseHistory(
  filter: CaseHistoryFilter
): Promise<Response<CaseHistoryResponse>> {
  try {
    const session = await auth();

    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );

    const params: Record<string, any> = {
      profile_id: filter.profile_id,
    };

    if (filter.category && filter.category.length > 0) {
      params.category = filter.category;
    }
    if (filter.status && filter.status.length > 0) {
      params.status = filter.status;
    }
    if (filter.priority && filter.priority.length > 0) {
      params.priority = filter.priority;
    }
    if (filter.start_date) params.start_date = filter.start_date;
    if (filter.end_date) params.end_date = filter.end_date;
    if (filter.limit) params.limit = filter.limit;
    if (filter.offset) params.offset = filter.offset;

    const response = await axiosInstance.get(
      'api/v1/risk-dashboard/case-history',
      { params }
    );

    return {
      success: true,
      data: response.data as CaseHistoryResponse,
      message: 'Case history retrieved successfully',
    };
  } catch (error: any) {
    console.error('Error fetching case history:', error);

    const backendMessage =
      error?.response?.data?.error || error?.response?.data?.message;
    const errorMessage =
      backendMessage || error?.message || 'Failed to fetch case history';

    return {
      success: false,
      data: { records: [], total: 0, limit: 0, offset: 0 },
      message: errorMessage,
    };
  }
}

// ============================================
// Alert History Actions
// ============================================

export async function getAlertHistory(
  filter: AlertHistoryFilter
): Promise<Response<AlertHistoryResponse>> {
  try {
    const session = await auth();

    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );

    const params: Record<string, any> = {
      profile_id: filter.profile_id,
    };

    if (filter.alert_type && filter.alert_type.length > 0) {
      params.alert_type = filter.alert_type;
    }
    if (filter.severity && filter.severity.length > 0) {
      params.severity = filter.severity;
    }
    if (filter.status && filter.status.length > 0) {
      params.status = filter.status;
    }
    if (filter.start_date) params.start_date = filter.start_date;
    if (filter.end_date) params.end_date = filter.end_date;
    if (filter.limit) params.limit = filter.limit;
    if (filter.offset) params.offset = filter.offset;

    const response = await axiosInstance.get(
      'api/v1/risk-dashboard/alert-history',
      { params }
    );

    return {
      success: true,
      data: response.data as AlertHistoryResponse,
      message: 'Alert history retrieved successfully',
    };
  } catch (error: any) {
    console.error('Error fetching alert history:', error);

    const backendMessage =
      error?.response?.data?.error || error?.response?.data?.message;
    const errorMessage =
      backendMessage || error?.message || 'Failed to fetch alert history';

    return {
      success: false,
      data: { records: [], total: 0, limit: 0, offset: 0 },
      message: errorMessage,
    };
  }
}
