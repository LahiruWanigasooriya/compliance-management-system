"use server";

import { auth, createServerAxios } from "@/utils/axios_server";
import { Response } from "@/types/response.types";
import { convertObjectKeysToCamelCase, convertObjectKeysToSnakeCase } from "@/utils/convertObjectKeysToCamelCase";
import { revalidatePath } from "next/cache";
import type {
  Tenant,
  CreateTenantData,
  UpdateTenantData,
  GetTenantsParams,
  TenantSettings,
  TenantStats,
} from "@/types/tenant.types";

// --- Helper to get Axios Instance ---
async function getAxios() {
  const session = await auth();
  return createServerAxios(
    session?.accessToken as string,
    session?.user?.tenant_id as string,
    session?.user?.user_type
  );
}

/**
 * Fetch all tenants with pagination
 */
export async function getTenants(
  params: GetTenantsParams = {}
): Promise<Response<Tenant[] | null>> {
  try {
    const { page = 1, limit = 100 } = params;
    const offset = (page - 1) * limit;

    const axios = await getAxios();
    const response = await axios.get("/api/v1/tenants", {
      params: { limit, offset },
    });

    const rawData = response.data.data ?? response.data;
    const camelCasedData = convertObjectKeysToCamelCase(rawData);

    let tenantListRaw: any[] = [];
    if (Array.isArray(camelCasedData)) {
      tenantListRaw = camelCasedData;
    } else if (camelCasedData && Array.isArray((camelCasedData as any).data)) {
      tenantListRaw = (camelCasedData as any).data;
    } else if (
      camelCasedData &&
      Array.isArray((camelCasedData as any).tenants)
    ) {
      tenantListRaw = (camelCasedData as any).tenants;
    } else {
      tenantListRaw = [];
    }

    // Filter out system tenant
    const tenants: Tenant[] = tenantListRaw
      .filter((t: any) => t.id !== "_system")
      .map((t: any) => ({
        id: t.id || t.ID,
        name: t.name || t.Name || "Unknown Tenant",
        subdomain: t.subdomain || t.Subdomain || "",
        url: t.url || t.Url || "",
        industry: t.industry || t.Industry || "",
        plan: t.plan || t.Plan || "starter",
        status: t.status || t.Status || "active",
        apiKey: t.apiKey || t.api_key || "",
        settings: t.settings || t.Settings || {},
        createdAt: t.createdAt || t.created_at,
        updatedAt: t.updatedAt || t.updated_at,
      }));

    // Extract pagination metadata
    const totalCandidates = [
      (camelCasedData as any)?.total,
      (camelCasedData as any)?.totalCount,
      (camelCasedData as any)?.total_records,
      (camelCasedData as any)?.meta?.total,
      (camelCasedData as any)?.pagination?.total,
    ];

    const metaTotal = totalCandidates.find((v) => typeof v === "number") as
      | number
      | undefined;

    return {
      success: true,
      data: tenants,
      message: "Tenants fetched successfully",
      pagination: {
        total: metaTotal ?? tenants.length,
        page,
        page_size: limit,
        total_pages: Math.ceil((metaTotal ?? tenants.length) / limit),
      },
    } as any;
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : "Failed to fetch tenants",
    };
  }
}

/**
 * Get a single tenant by ID
 */
export async function getTenantById(
  tenantId: string
): Promise<Response<Tenant | null>> {
  try {
    const axios = await getAxios();
    const response = await axios.get(`/api/v1/tenants/${tenantId}`);

    const rawData = response.data.data ?? response.data;
    const t = convertObjectKeysToCamelCase(rawData) as any;

    const tenant: Tenant = {
      id: t.id || t.ID,
      name: t.name || t.Name || "Unknown Tenant",
      subdomain: t.subdomain || t.Subdomain || "",
      url: t.url || t.Url || "",
      industry: t.industry || t.Industry || "",
      plan: t.plan || t.Plan || "starter",
      status: t.status || t.Status || "active",
      apiKey: t.apiKey || t.api_key || "",
      settings: t.settings || t.Settings || {},
      createdAt: t.createdAt || t.created_at,
      updatedAt: t.updatedAt || t.updated_at,
    };

    return {
      success: true,
      data: tenant,
      message: "Tenant fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching tenant:", error);
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : "Failed to fetch tenant",
    };
  }
}

/**
 * Create a new tenant
 */
export async function createTenant(
  data: CreateTenantData
): Promise<Response<Tenant | null>> {
  try {
    const payload = {
      name: data.name,
      subdomain: data.subdomain,
      industry: data.industry || "",
      plan: data.plan || "starter",
      admin_email: data.adminEmail,
    };

    const axios = await getAxios();
    const response = await axios.post("/api/v1/admin/tenants", payload);

    const rawData = response.data.data ?? response.data;
    const t = convertObjectKeysToCamelCase(rawData) as any;

    const tenant: Tenant = {
      id: t.id || t.ID,
      name: t.name || t.Name,
      subdomain: t.subdomain || t.Subdomain,
      url: t.url || t.Url || "",
      industry: t.industry || t.Industry || "",
      plan: t.plan || t.Plan || "starter",
      status: t.status || t.Status || "active",
      apiKey: t.apiKey || t.api_key || "",
      settings: t.settings || t.Settings || {},
      createdAt: t.createdAt || t.created_at,
      updatedAt: t.updatedAt || t.updated_at,
    };

    revalidatePath("/config");

    return {
      success: true,
      data: tenant,
      message: "Tenant created successfully",
    };
  } catch (error: any) {
    console.error("Error creating tenant:", error);
    const errorMessage =
      error?.response?.data?.error ||
      error?.message ||
      "Failed to create tenant";
    return {
      success: false,
      data: null,
      message: errorMessage,
    };
  }
}

/**
 * Update an existing tenant
 */
export async function updateTenant(
  data: UpdateTenantData
): Promise<Response<Tenant | null>> {
  try {
    const payload: any = {};
    if (data.name) payload.name = data.name;
    if (data.industry !== undefined) payload.industry = data.industry;
    if (data.plan) payload.plan = data.plan;
    if (data.status) payload.status = data.status;

    const axios = await getAxios();
    const response = await axios.put(`/api/v1/tenants/${data.id}`, payload);

    const rawData = response.data.data ?? response.data;
    const t = convertObjectKeysToCamelCase(rawData) as any;

    const tenant: Tenant = {
      id: t.id || t.ID,
      name: t.name || t.Name,
      subdomain: t.subdomain || t.Subdomain,
      url: t.url || t.Url || "",
      industry: t.industry || t.Industry || "",
      plan: t.plan || t.Plan || "starter",
      status: t.status || t.Status || "active",
      apiKey: t.apiKey || t.api_key || "",
      settings: t.settings || t.Settings || {},
      createdAt: t.createdAt || t.created_at,
      updatedAt: t.updatedAt || t.updated_at,
    };

    revalidatePath("/config");

    return {
      success: true,
      data: tenant,
      message: "Tenant updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating tenant:", error);
    const errorMessage =
      error?.response?.data?.error ||
      error?.message ||
      "Failed to update tenant";
    return {
      success: false,
      data: null,
      message: errorMessage,
    };
  }
}

/**
 * Delete a tenant
 */
export async function deleteTenant(
  tenantId: string
): Promise<Response<null>> {
  try {
    const axios = await getAxios();
    await axios.delete(`/api/v1/tenants/${tenantId}`);

    revalidatePath("/config");

    return {
      success: true,
      data: null,
      message: "Tenant deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting tenant:", error);
    const errorMessage =
      error?.response?.data?.error ||
      error?.message ||
      "Failed to delete tenant";
    return {
      success: false,
      data: null,
      message: errorMessage,
    };
  }
}

/**
 * Suspend a tenant
 */
export async function suspendTenant(
  tenantId: string
): Promise<Response<Tenant | null>> {
  return updateTenant({ id: tenantId, status: "suspended" });
}

/**
 * Activate a tenant
 */
export async function activateTenant(
  tenantId: string
): Promise<Response<Tenant | null>> {
  return updateTenant({ id: tenantId, status: "active" });
}

/**
 * Get tenant settings
 */
export async function getTenantSettings(
  tenantId: string
): Promise<Response<TenantSettings | null>> {
  try {
    const axios = await getAxios();
    const response = await axios.get(`/api/v1/tenants/${tenantId}/settings`);

    const rawData = response.data.data ?? response.data;
    const settings = convertObjectKeysToCamelCase(rawData) as TenantSettings;

    return {
      success: true,
      data: settings,
      message: "Tenant settings fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching tenant settings:", error);
    return {
      success: false,
      data: null,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch tenant settings",
    };
  }
}

/**
 * Update tenant settings
 */
export async function updateTenantSettings(
  tenantId: string,
  settings: Partial<TenantSettings>
): Promise<Response<TenantSettings | null>> {
  try {
    const axios = await getAxios();
    // Convert camelCase keys to snake_case for the backend API
    const snakeCaseSettings = convertObjectKeysToSnakeCase(settings);
    const response = await axios.put(
      `/api/v1/tenants/${tenantId}/settings`,
      snakeCaseSettings
    );

    const rawData = response.data.data ?? response.data;
    const updatedSettings = convertObjectKeysToCamelCase(
      rawData
    ) as TenantSettings;

    revalidatePath("/config");

    return {
      success: true,
      data: updatedSettings,
      message: "Tenant settings updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating tenant settings:", error);
    const errorMessage =
      error?.response?.data?.error ||
      error?.message ||
      "Failed to update tenant settings";
    return {
      success: false,
      data: null,
      message: errorMessage,
    };
  }
}

/**
 * Get tenant statistics (user count, API calls, etc.)
 */
export async function getTenantStats(
  tenantId: string
): Promise<Response<TenantStats | null>> {
  try {
    const axios = await getAxios();
    const response = await axios.get(`/api/v1/tenants/${tenantId}/stats`);

    const rawData = response.data.data ?? response.data;
    const stats = convertObjectKeysToCamelCase(rawData) as TenantStats;

    return {
      success: true,
      data: stats,
      message: "Tenant stats fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching tenant stats:", error);
    return {
      success: false,
      data: null,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch tenant stats",
    };
  }
}

/**
 * Regenerate API key for a tenant
 */
export async function regenerateApiKey(
  tenantId: string
): Promise<Response<{ apiKey: string } | null>> {
  try {
    const axios = await getAxios();
    const response = await axios.post(`/api/v1/tenants/${tenantId}/regenerate-api-key`);

    const rawData = response.data.data ?? response.data;
    const result = convertObjectKeysToCamelCase(rawData) as { apiKey: string };

    revalidatePath(`/tenants/${tenantId}`);

    return {
      success: true,
      data: result,
      message: "API key regenerated successfully",
    };
  } catch (error: any) {
    console.error("Error regenerating API key:", error);
    const errorMessage =
      error?.response?.data?.error ||
      error?.message ||
      "Failed to regenerate API key";
    return {
      success: false,
      data: null,
      message: errorMessage,
    };
  }
}

/**
 * Get audit logs for a specific tenant
 */
export async function getTenantAuditLogs(
  tenantId: string,
  params: { limit?: number; offset?: number } = {}
): Promise<Response<{ logs: any[]; pagination: { total: number; limit: number; offset: number } } | null>> {
  try {
    const { limit = 10, offset = 0 } = params;
    const axios = await getAxios();
    const response = await axios.get(`/api/v1/audit/logs`, {
      params: { tenant_id: tenantId, limit, offset },
    });

    const rawData = response.data;
    const camelCasedData = convertObjectKeysToCamelCase(rawData);

    return {
      success: true,
      data: {
        logs: camelCasedData.data || [],
        pagination: {
          total: camelCasedData.total || 0,
          limit: camelCasedData.limit || limit,
          offset: camelCasedData.offset || offset,
        },
      },
      message: "Audit logs fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching tenant audit logs:", error);
    return {
      success: false,
      data: null,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch audit logs",
    };
  }
}

// User types for tenant user management
export interface TenantUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  roleId: string;
  roleName: string;
  status: string;
  userType: string;
  createdAt: string;
  updatedAt: string;
  image?: string;
}

export interface TenantUsersResponse {
  users: TenantUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Get users for a specific tenant
 */
export async function getTenantUsers(
  tenantId: string,
  params: { page?: number; limit?: number; search?: string; status?: string } = {}
): Promise<Response<TenantUsersResponse | null>> {
  try {
    const { page = 1, limit = 10, search, status } = params;
    const axios = await getAxios();
    const response = await axios.get(`/api/v1/users`, {
      params: { tenant_id: tenantId, page, limit, search, status },
    });

    const rawData = response.data;
    const camelCasedData = convertObjectKeysToCamelCase(rawData) as any;

    return {
      success: true,
      data: {
        users: camelCasedData.users || [],
        total: camelCasedData.total || 0,
        page: camelCasedData.page || page,
        limit: camelCasedData.limit || limit,
        totalPages: camelCasedData.totalPages || 1,
      },
      message: "Users fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching tenant users:", error);
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : "Failed to fetch users",
    };
  }
}

/**
 * Update user status (active/suspended)
 */
export async function updateTenantUserStatus(
  tenantId: string,
  userId: string,
  status: "active" | "suspended"
): Promise<Response<TenantUser | null>> {
  try {
    const axios = await getAxios();
    const response = await axios.patch(`/api/v1/users/${userId}`, {
      status,
    }, {
      headers: { "X-Tenant-ID": tenantId },
    });

    const rawData = response.data;
    const user = convertObjectKeysToCamelCase(rawData) as TenantUser;

    return {
      success: true,
      data: user,
      message: `User ${status === "active" ? "activated" : "suspended"} successfully`,
    };
  } catch (error: any) {
    console.error("Error updating user status:", error);
    return {
      success: false,
      data: null,
      message: error?.response?.data?.error || "Failed to update user status",
    };
  }
}

/**
 * Invite a new user to the tenant
 */
export async function inviteTenantUser(
  tenantId: string,
  data: { email: string; fullName: string; roleId: string }
): Promise<Response<TenantUser | null>> {
  try {
    const axios = await getAxios();
    const response = await axios.post(`/api/v1/users`, {
      email: data.email,
      full_name: data.fullName,
      role_id: data.roleId,
    }, {
      headers: { "X-Tenant-ID": tenantId },
    });

    const rawData = response.data;
    const user = convertObjectKeysToCamelCase(rawData) as TenantUser;

    return {
      success: true,
      data: user,
      message: "User invited successfully",
    };
  } catch (error: any) {
    console.error("Error inviting user:", error);
    return {
      success: false,
      data: null,
      message: error?.response?.data?.error || "Failed to invite user",
    };
  }
}

// Analytics types
export interface TenantAnalytics {
  apiCallsTimeSeries: { timestamp: string; value: number }[];
  topEndpoints: { endpoint: string; count: number }[];
  errorRate: number;
  totalApiCalls: number;
  avgResponseTime: number;
}

/**
 * Get analytics data for a tenant
 */
export async function getTenantAnalytics(
  tenantId: string,
  timeRange: string = "last_7_days"
): Promise<Response<TenantAnalytics | null>> {
  try {
    const axios = await getAxios();

    // Fetch time series data
    const timeSeriesResponse = await axios.get(`/api/v1/analytics/metrics/timeseries`, {
      params: {
        tenant_id: tenantId,
        metric_name: "api_calls_total",
        time_range: timeRange,
      },
    });

    // Fetch quick stats
    const quickStatsResponse = await axios.get(`/api/v1/analytics/dashboard/quick-stats`, {
      params: { tenant_id: tenantId, time_range: timeRange },
    });

    const timeSeries = convertObjectKeysToCamelCase(timeSeriesResponse.data) as any;
    const quickStats = convertObjectKeysToCamelCase(quickStatsResponse.data) as any;

    return {
      success: true,
      data: {
        apiCallsTimeSeries: timeSeries.dataPoints || timeSeries.data || [],
        topEndpoints: quickStats.topEndpoints || [],
        errorRate: quickStats.errorRate || 0,
        totalApiCalls: quickStats.totalApiCalls || quickStats.totalTransactions || 0,
        avgResponseTime: quickStats.avgResponseTime || 0,
      },
      message: "Analytics fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching tenant analytics:", error);
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : "Failed to fetch analytics",
    };
  }
}

/**
 * Export tenant data for compliance/backup
 */
export async function exportTenantData(
  tenantId: string,
  options: {
    format: "json" | "csv" | "pdf";
    sections: string[];
    includeUsers?: boolean;
    includeAuditLogs?: boolean;
    includeSettings?: boolean;
  }
): Promise<Response<{ exportId: string; status: string } | null>> {
  try {
    const axios = await getAxios();
    const response = await axios.post(`/api/v1/analytics/reports`, {
      tenant_id: tenantId,
      name: `Tenant Data Export - ${new Date().toISOString().split("T")[0]}`,
      report_type: "tenant_data_export",
      format: options.format,
      parameters: {
        sections: options.sections,
        include_users: options.includeUsers ?? true,
        include_audit_logs: options.includeAuditLogs ?? true,
        include_settings: options.includeSettings ?? true,
      },
      async: true,
    });

    const rawData = response.data;
    const result = convertObjectKeysToCamelCase(rawData) as any;

    return {
      success: true,
      data: {
        exportId: result.id || result.exportId,
        status: result.status || "pending",
      },
      message: "Export started successfully",
    };
  } catch (error: any) {
    console.error("Error exporting tenant data:", error);
    return {
      success: false,
      data: null,
      message: error?.response?.data?.error || "Failed to start export",
    };
  }
}

/**
 * Get roles for a tenant (for user invite dropdown)
 */
export async function getTenantRoles(
  tenantId: string
): Promise<Response<{ id: string; roleName: string }[] | null>> {
  try {
    const axios = await getAxios();
    const response = await axios.get(`/api/v1/roles`, {
      headers: { "X-Tenant-ID": tenantId },
    });

    const rawData = response.data;
    const roles = convertObjectKeysToCamelCase(
      Array.isArray(rawData) ? rawData : rawData.roles || rawData.data || []
    ) as { id: string; roleName: string }[];

    return {
      success: true,
      data: roles,
      message: "Roles fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching roles:", error);
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : "Failed to fetch roles",
    };
  }
}
