import axiosInstance from "@/utils/axios";

// Login Activity / Audit Logs
export const getAuditLogs = async (
  options?: {
    limit?: number;
    offset?: number;
    start_date?: string;
    end_date?: string;
    user_id?: string;
    event_type?: string;
  },
  tenantId?: string
) => {
  const params = new URLSearchParams();
  if (options?.limit) params.append("limit", options.limit.toString());
  if (options?.offset) params.append("offset", options.offset.toString());
  if (options?.start_date) params.append("start_date", options.start_date);
  if (options?.end_date) params.append("end_date", options.end_date);
  if (options?.user_id) params.append("user_id", options.user_id);
  if (options?.event_type) params.append("event_type", options.event_type);

  const response = await axiosInstance.get(
    `api/v1/audit/logs?${params.toString()}`,
    {
      headers: {
        "x-tenant-id": tenantId,
      },
    }
  );
  return response.data;
};

// Get Tenant Settings
export const getTenantSettings = async (tenantId?: string) => {
  const response = await axiosInstance.get(`api/v1/tenant/settings`, {
    headers: {
      "x-tenant-id": tenantId,
    },
  });
  return response.data;
};

// Update Tenant Settings
export const updateTenantSettings = async (
  settings: any,
  tenantId?: string
) => {
  const response = await axiosInstance.put(`api/v1/tenant/settings`, settings, {
    headers: {
      "x-tenant-id": tenantId,
    },
  });
  return response.data;
};
