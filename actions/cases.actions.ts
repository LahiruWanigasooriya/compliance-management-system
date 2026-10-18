'use server';

// import { auth } from '@/auth';
import { APPLICATION } from '@/constants/application';
// import axiosInstance from '@/utils/axios';
import {
  CasesResponse,
  CasesOverview,
  CreateCasePayload,
  Case,
  CaseFilters,
  UpdateCasePayload,
  CreateNotePayload,
  UpdateNotePayload,
  CreateEvidencePayload,
  UpdateEvidencePayload,
  CreateCommentPayload,
  UpdateCommentPayload,
  AddSpectatorPayload,
  RemoveSpectatorPayload,
  Note,
  Evidence,
  Comment,
  Spectator,
  HeatmapDataPoint,
  WorklogTimelineResponse,
  EvidenceRequest,
  CreateEvidenceRequestInput,
  CreateEvidenceRequestResponse,
  EvidenceRequestListResponse,
  EvidenceRequestFilters,
} from '@/types/cases.types';
import { Response } from '@/types/response.types';
import { auth, createServerAxios } from '@/utils/axios_server';

export interface RiskDashboardProfile {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  customer_id: string;
  account_number: string;
  entity_type: string;
  customer_status: string;
  customer_tier: string;
  date_of_establishment: string;
  full_name: string;
  date_of_birth: string;
  primary_phone_number: string;
  email_address: string;
  residential_address: string;
  country_of_residence: string;
  total_transactions: number;
  total_volume: number;
  flagged_transactions: number;
  risk_score: number;
  risk_category: string;
  previous_risk_score: number;
  previous_risk_category: string;
  watchlist_matches: any;
  screening_status: string;
  is_pep: boolean;
  has_adverse_media: boolean;
  has_sanctions: boolean;
  requires_edd: boolean;
  edd_notes: string;
  kyc_status: string;
  identification_type: string;
  identification_number: string;
  id_issuing_country: string;
  location: string;
  location_compliance: string;
  is_synthetic: boolean;
  synthetic_score: number;
  synthetic_flags: any;
  synthetic_status: string;
}

export interface ComplianceOfficer {
  id: string;
  full_name: string;
  email?: string;
  role?: string;
}

export interface TenantUser {
  id: string;
  full_name: string;
  email: string;
  role?: string;
  status?: string;
}

// Get tenant users
export const getTenantUsers = async (
  tenantId: string,
): Promise<Response<TenantUser[]>> => {
  try {
    const session = await auth();

    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      tenantId,
      session?.user?.user_type,
    );
    const response = await axiosInstance.get('/api/v1/users', {
      params: {
        user_type: 'tenant',
        tenant_id: tenantId,
      },
    });

    const users = response.data.users ?? response.data.data ?? response.data ?? [];
    const usersArray = Array.isArray(users) ? users : [];

    return {
      success: true,
      data: usersArray,
      message: 'Tenant users fetched successfully',
    };
  } catch (error: any) {
    console.error('Error fetching tenant users:', error);

    return {
      success: false,
      data: [],
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch tenant users',
    };
  }
};

// Get all cases
export const getCases = async (
  tenantId?: string,
  page: number = 1,
  pageSize: number = 10,
  filters?: CaseFilters,
): Promise<CasesResponse> => {
  const params: Record<string, any> = {
    page,
    limit: pageSize,
  };

  // Add filter parameters if provided
  if (filters) {
    if (filters.status && filters.status.length > 0) {
      params.status = filters.status.join(',');
    }
    if (filters.category && filters.category.length > 0) {
      params.category = filters.category.join(',');
    }
    if (filters.priority && filters.priority.length > 0) {
      params.priority = filters.priority.join(',');
    }
    if (filters.assigned_for && filters.assigned_for.length > 0) {
      params.assigned_for = filters.assigned_for.join(',');
    }
    if (filters.risk_level && filters.risk_level.length > 0) {
      params.risk_level = filters.risk_level.join(',');
    }
    if (filters.search) {
      params.search = filters.search;
    }
    if (filters.fromDate) {
      params.fromDate = filters.fromDate;
    }
    if (filters.toDate) {
      params.toDate = filters.toDate;
    }
    if (filters.order_by) {
      params.order_by = filters.order_by;
    }
    if (filters.sort) {
      params.sort = filters.sort;
    }
  }
  const session = await auth();

  console.log('Session in ssr cases:', session);
  const axiosInstance = createServerAxios(
    session?.accessToken as string,
    session?.user?.tenant_id as string,
    session?.user?.user_type,
  );
  const response = await axiosInstance.get('api/v1/cases', {
    params,
  });
  return response.data;
};

// Get cases overview
export const getCasesOverview = async (
  tenantId?: string,
): Promise<CasesOverview> => {
  const session = await auth();

  console.log('Session in ssr:', session);
  const axiosInstance = createServerAxios(
    session?.accessToken as string,
    session?.user?.tenant_id as string,
    session?.user?.user_type,
  );
  const response = await axiosInstance.get('api/v1/cases/overview');

  // Flatten the response to match CasesOverview type
  const { overview, riskCounts } = response.data;
  return {
    ...overview,
    ...riskCounts,
  };
};

// Create a new case
export const createCase = async (
  payload: CreateCasePayload,
  tenantId?: string,
): Promise<Case> => {
  try {
    const session = await auth();

    console.log('Session in ssr:', session);
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );
    const response = await axiosInstance.post('api/v1/cases', payload);
    return response.data;
  } catch (e: any) {
    throw Error(e?.response?.data?.error || e?.message);
  }
};

// Get a single case by ID
export const getCaseById = async (
  caseId: string,
  tenantId?: string,
): Promise<Case> => {
  const session = await auth();

  console.log('Session in ssr:', session);
  const axiosInstance = createServerAxios(
    session?.accessToken as string,
    session?.user?.tenant_id as string,
    session?.user?.user_type,
  );
  const response = await axiosInstance.get(`api/v1/cases/${caseId}`);
  return response.data;
};

// Update case status
export const updateCaseStatus = async (
  caseId: string,
  status: string,
  resolution_note?: string,
  assigned_for?: string,
): Promise<Case> => {
  const session = await auth();

  console.log('Session in ssr:', session);
  const axiosInstance = createServerAxios(
    session?.accessToken as string,
    session?.user?.tenant_id as string,
    session?.user?.user_type,
  );
  const payload: {
    status: string;
    resolution_note: string;
    assigned_for?: string;
  } = {
    status,
    resolution_note: resolution_note || '',
  };
  if (assigned_for) {
    payload.assigned_for = assigned_for;
  }
  const response = await axiosInstance.patch(
    `api/v1/cases/status/${caseId}`,
    payload,
  );
  return response.data;
};

// Get risk dashboard profiles with filters
export interface RiskDashboardFilters {
  search?: string;
  risk_category?: string;
  entity_type?: string;
  status?: string;
  location_compliance?: string;
  location?: string; // Searchable location filter (country, city, region)
  kyc_status?: string;
  is_pep?: boolean | string;
  has_sanctions?: boolean | string;
  requires_edd?: boolean | string;
  is_synthetic?: boolean | string;
  synthetic_status?: string;
  date_preset?: string;
  date_field?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  limit?: number;
}

export interface RiskDashboardProfilesResponse {
  profiles: RiskDashboardProfile[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const getRiskDashboardProfiles = async (
  filters?: RiskDashboardFilters,
): Promise<Response<RiskDashboardProfilesResponse>> => {
  try {
    const session = await auth();

    console.log('Session in ssr:', session);
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );

    // Build query parameters from filters
    const params: Record<string, any> = {};
    if (filters) {
      if (filters.search) params.search = filters.search;
      if (filters.risk_category) params.risk_category = filters.risk_category;
      if (filters.entity_type) params.entity_type = filters.entity_type;
      if (filters.status) params.status = filters.status;
      if (filters.location_compliance)
        params.location_compliance = filters.location_compliance;
      if (filters.location) params.location = filters.location;
      if (filters.kyc_status) params.kyc_status = filters.kyc_status;
      if (filters.is_pep !== undefined) params.is_pep = filters.is_pep;
      if (filters.has_sanctions !== undefined)
        params.has_sanctions = filters.has_sanctions;
      if (filters.requires_edd !== undefined)
        params.requires_edd = filters.requires_edd;
      if (filters.is_synthetic !== undefined)
        params.is_synthetic = filters.is_synthetic;
      if (filters.synthetic_status)
        params.synthetic_status = filters.synthetic_status;
      if (filters.date_preset) params.date_preset = filters.date_preset;
      if (filters.date_field) params.date_field = filters.date_field;
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.sort_order) params.sort_order = filters.sort_order;

      // Backend uses offset/limit, convert from page/limit
      const limit = filters.limit || 10;
      const page = filters.page || 1;
      const offset = (page - 1) * limit;

      params.limit = limit;
      params.offset = offset;
    }

    const response = await axiosInstance.get(
      '/api/v1/risk-dashboard/profiles',
      { params },
    );

    const profiles =
      response.data.profiles ?? response.data.data ?? response.data ?? [];

    const profilesArray = Array.isArray(profiles) ? profiles : [];

    // Calculate pagination metadata
    const limit = filters?.limit || 10;
    const page = filters?.page || 1;
    const total = response.data.total || profilesArray.length;
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        profiles: profilesArray,
        total,
        page,
        page_size: limit,
        total_pages: totalPages,
      },
      message: 'Profiles fetched successfully',
    };
  } catch (error: any) {
    console.error('Error fetching risk dashboard profiles:', error);

    return {
      success: false,
      data: {
        profiles: [],
        total: 0,
        page: 1,
        page_size: 10,
        total_pages: 0,
      },
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch profiles',
    };
  }
};

// Get compliance officers
export const getComplianceOfficers = async (): Promise<
  Response<ComplianceOfficer[]>
> => {
  try {
    const session = await auth();

    console.log('Session in ssr:', session);
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );
    const response = await axiosInstance.get('/api/v1/users', {
      params: {
        role: 'compliance_officer',
      },
    });

    const officers =
      response.data.users ?? response.data.data ?? response.data ?? [];

    const officersArray = Array.isArray(officers) ? officers : [];

    return {
      success: true,
      data: officersArray,
      message: 'Compliance officers fetched successfully',
    };
  } catch (error: any) {
    console.error('Error fetching compliance officers:', error);

    return {
      success: false,
      data: [],
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch compliance officers',
    };
  }
};

// Update case
export const updateCase = async (
  caseId: string,
  payload: UpdateCasePayload,
  tenantId?: string,
): Promise<Case> => {
  const session = await auth();
  const finalTenantId = tenantId || (session?.user?.tenant_id as string);

  console.log('Session in ssr:', session);
  console.log('Update case - caseId:', caseId);
  console.log('Update case - payload:', payload);
  console.log('Update case - tenantId:', finalTenantId);
  console.log(
    'Update case - accessToken:',
    session?.accessToken ? 'Present' : 'Missing',
  );

  const axiosInstance = createServerAxios(
    session?.accessToken as string,
    finalTenantId,
  );

  try {
    const response = await axiosInstance.put(`api/v1/cases/${caseId}`, payload);
    console.log('Update case - success:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Update case - error:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      url: error?.config?.url,
      method: error?.config?.method,
      headers: error?.config?.headers,
    });
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Failed to update case';
    throw new Error(errorMessage);
  }
};

// Notes
export const createNote = async (
  payload: CreateNotePayload,
  tenantId?: string,
): Promise<Note> => {
  const session = await auth();

  const axiosInstance = createServerAxios(
    session?.accessToken as string,
    tenantId || (session?.user?.tenant_id as string),
    session?.user?.user_type,
  );
  const response = await axiosInstance.post('api/v1/cases/note', payload);
  return response.data;
};

export const updateNote = async (
  payload: UpdateNotePayload,
  tenantId?: string,
): Promise<Note> => {
  const session = await auth();

  const axiosInstance = createServerAxios(
    session?.accessToken as string,
    tenantId || (session?.user?.tenant_id as string),
    session?.user?.user_type,
  );
  const response = await axiosInstance.put('api/v1/cases/note', payload);
  return response.data;
};

// Evidence
export const getEvidences = async (
  caseId: string,
  tenantId?: string,
): Promise<Evidence[]> => {
  const session = await auth();

  const axiosInstance = createServerAxios(
    session?.accessToken as string,
    tenantId || (session?.user?.tenant_id as string),
    session?.user?.user_type,
  );
  const response = await axiosInstance.get(`api/v1/cases/evidence/${caseId}`);
  return response.data;
};

export const createEvidence = async (
  payload: CreateEvidencePayload,
  tenantId?: string,
): Promise<Evidence> => {
  const session = await auth();

  const axiosInstance = createServerAxios(
    session?.accessToken as string,
    tenantId || (session?.user?.tenant_id as string),
    session?.user?.user_type,
  );
  const response = await axiosInstance.post('api/v1/cases/evidence', payload);
  return response.data;
};

export const uploadEvidenceFile = async (
  evidenceId: string,
  base64Data: string,
  tenantId?: string,
): Promise<Evidence> => {
  const session = await auth();

  const axiosInstance = createServerAxios(
    session?.accessToken as string,
    tenantId || (session?.user?.tenant_id as string),
    session?.user?.user_type,
  );
  try {
    const response = await axiosInstance.put(
      'api/v1/cases/evidence/request/upload',
      {
        evidence_id: evidenceId,
        evidence: base64Data,
      },
    );
    return response.data;
  } catch (error: any) {
    console.error('uploadEvidenceFile error', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      url: error?.config?.url,
      method: error?.config?.method,
      headers: error?.config?.headers,
    });
    throw error;
  }
};

export const updateEvidence = async (
  payload: UpdateEvidencePayload,
  tenantId?: string,
): Promise<Evidence> => {
  const session = await auth();

  const axiosInstance = createServerAxios(
    session?.accessToken as string,
    tenantId || (session?.user?.tenant_id as string),
    session?.user?.user_type,
  );
  const response = await axiosInstance.put('api/v1/cases/evidence', payload);
  return response.data;
};

// Comments
export const getComments = async (
  caseId: string,
  tenantId?: string,
): Promise<Comment[]> => {
  const session = await auth();

  const axiosInstance = createServerAxios(
    session?.accessToken as string,
    tenantId || (session?.user?.tenant_id as string),
    session?.user?.user_type,
  );
  const response = await axiosInstance.get(`api/v1/cases/comments/${caseId}`);
  return response.data;
};

export const createComment = async (
  payload: CreateCommentPayload,
  tenantId?: string,
): Promise<Comment> => {
  const session = await auth();

  const axiosInstance = createServerAxios(
    session?.accessToken as string,
    tenantId || (session?.user?.tenant_id as string),
    session?.user?.user_type,
  );
  const response = await axiosInstance.post('api/v1/cases/comments', payload);
  return response.data;
};

export const updateComment = async (
  commentId: string,
  payload: { comment: string },
  tenantId?: string,
): Promise<Comment> => {
  const session = await auth();

  const axiosInstance = createServerAxios(
    session?.accessToken as string,
    tenantId || (session?.user?.tenant_id as string),
    session?.user?.user_type,
  );
  const response = await axiosInstance.put(
    `api/v1/cases/comments/${commentId}`,
    payload,
  );
  return response.data;
};

// Spectators
export const addSpectator = async (
  payload: AddSpectatorPayload,
  tenantId?: string,
): Promise<Spectator> => {
  const session = await auth();

  const axiosInstance = createServerAxios(
    session?.accessToken as string,
    tenantId || (session?.user?.tenant_id as string),
    session?.user?.user_type,
  );
  try {
    const response = await axiosInstance.post(
      'api/v1/cases/spectator',
      payload,
    );
    return response.data;
  } catch (error: any) {
    console.error('Error adding spectator:', error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Failed to add spectator';
    throw new Error(errorMessage);
  }
};

export const removeSpectator = async (
  payload: RemoveSpectatorPayload,
  tenantId?: string,
): Promise<void> => {
  const session = await auth();

  const axiosInstance = createServerAxios(
    session?.accessToken as string,
    tenantId || (session?.user?.tenant_id as string),
    session?.user?.user_type,
  );
  try {
    await axiosInstance.delete('api/v1/cases/spectator', {
      data: payload,
    });
  } catch (error: any) {
    console.error('Error removing spectator:', error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Failed to remove spectator';
    throw new Error(errorMessage);
  }
};

// Get cases heatmap data
export const getCasesHeatmap = async (): Promise<HeatmapDataPoint[]> => {
  try {
    const session = await auth();

    console.log('Session in ssr:', session);
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );
    const response = await axiosInstance.get('api/v1/cases/heatmap');
    return response.data || [];
  } catch (error: any) {
    console.error('Error fetching heatmap data:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      url: error?.config?.url,
    });
    throw error;
  }
};

// Get worklog timeline for a case
export const getWorklogTimeline = async (
  caseId: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<WorklogTimelineResponse> => {
  const session = await auth();

  const axiosInstance = createServerAxios(
    session?.accessToken as string,
    (session?.user?.tenant_id as string) || APPLICATION.TENANT_ID,
    session?.user?.user_type,
  );
  const response = await axiosInstance.get(
    `api/v1/cases/worklog/timeline/${caseId}`,
    {
      params: {
        page,
        page_size: pageSize,
      },
    },
  );
  return response.data;
};

export async function createEvidenceRequest(
  input: CreateEvidenceRequestInput,
  tenantId?: string,
): Promise<Response<CreateEvidenceRequestResponse>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      tenantId || (session?.user?.tenant_id as string),
      session?.user?.user_type,
    );

    const response = await axiosInstance.post(
      'api/v1/cases/evidence/request',
      input,
    );
    return {
      success: true,
      data: response.data,
      message: 'Evidence request created successfully',
    };
  } catch (error: any) {
    console.error('Error creating evidence request:', error);
    return {
      success: false,
      data: {} as CreateEvidenceRequestResponse,
      message:
        error.response?.data?.error ||
        error.message ||
        'Failed to create evidence request',
    };
  }
}

export async function getEvidenceRequests(
  filters?: EvidenceRequestFilters,
  tenantId?: string,
): Promise<Response<EvidenceRequestListResponse>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      tenantId || (session?.user?.tenant_id as string),
      session?.user?.user_type,
    );

    const response = await axiosInstance.get('api/v1/cases/evidence/request', {
      params: filters,
    });
    return {
      success: true,
      data: response.data,
      message: 'Evidence requests fetched successfully',
    };
  } catch (error: any) {
    console.error('Error fetching evidence requests:', error);
    return {
      success: false,
      data: {} as EvidenceRequestListResponse,
      message:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch evidence requests',
    };
  }
}

export async function getEvidenceRequestById(
  requestId: string,
  tenantId?: string,
): Promise<Response<EvidenceRequest>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      tenantId || (session?.user?.tenant_id as string),
      session?.user?.user_type,
    );

    const response = await axiosInstance.get(
      `api/v1/cases/evidence/request/${requestId}`,
    );
    return {
      success: true,
      data: response.data,
      message: 'Evidence request fetched successfully',
    };
  } catch (error: any) {
    console.error('Error fetching evidence request:', error);
    return {
      success: false,
      data: {} as EvidenceRequest,
      message:
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch evidence request',
    };
  }
}

export async function cancelEvidenceRequest(
  requestId: string,
  tenantId?: string,
): Promise<Response<{ message: string }>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      tenantId || (session?.user?.tenant_id as string),
      session?.user?.user_type,
    );

    const response = await axiosInstance.post(
      `api/v1/cases/evidence/request/${requestId}/cancel`,
    );
    return {
      success: true,
      data: response.data,
      message: 'Evidence request cancelled successfully',
    };
  } catch (error: any) {
    console.error('Error cancelling evidence request:', error);
    return {
      success: false,
      data: { message: '' },
      message:
        error.response?.data?.error ||
        error.message ||
        'Failed to cancel evidence request',
    };
  }
}

export async function resendEvidenceRequest(
  requestId: string,
  contact: { email?: string; phone?: string },
  tenantId?: string,
): Promise<Response<{ message: string }>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      tenantId || (session?.user?.tenant_id as string),
      session?.user?.user_type,
    );

    const response = await axiosInstance.post(
      `api/v1/cases/evidence/request/${requestId}/resend`,
      contact,
    );
    return {
      success: true,
      data: response.data,
      message: 'Evidence request notification resent successfully',
    };
  } catch (error: any) {
    console.error('Error resending evidence request:', error);
    return {
      success: false,
      data: { message: '' },
      message:
        error.response?.data?.error ||
        error.message ||
        'Failed to resend evidence request',
    };
  }
}
