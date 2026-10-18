"use server";

import axios from "axios";
import type {
  AuditLogsResponse,
  AuditLogsQueryParams,
  AuditLogRecord,
} from "@/types/audit/audit.types";
import { convertObjectKeysToCamelCase } from "@/utils/convertObjectKeysToCamelCase";
import { Response } from "@/types/response.types";
import { auth, createServerAxios } from "@/utils/axios_server";
import { APPLICATION } from "@/constants/application";

const buildQueryString = (params?: AuditLogsQueryParams) => {
  if (!params) {
    return "";
  }

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === "all"
    ) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry === undefined || entry === null || entry === "") {
          return;
        }
        searchParams.append(key, String(entry));
      });
      return;
    }

    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

const isHtmlPayload = (value: string) => {
  return /<(!doctype|html|head|body|meta|link|script|style|div|span|title)\b/i.test(
    value,
  );
};

const normalizeErrorMessage = (value: string) => {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return undefined;
  }
  if (isHtmlPayload(normalized)) {
    return undefined;
  }
  return normalized.length > 300
    ? `${normalized.slice(0, 300)}...`
    : normalized;
};

const getErrorMessageFromPayload = (payload: unknown) => {
  if (typeof payload === "string") {
    return normalizeErrorMessage(payload);
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.error === "string") {
      return normalizeErrorMessage(record.error);
    }
    if (typeof record.message === "string") {
      return normalizeErrorMessage(record.message);
    }
    if (Array.isArray(record.errors) && record.errors.length > 0) {
      const firstError = record.errors[0];
      if (typeof firstError === "string") {
        return normalizeErrorMessage(firstError);
      }
      if (firstError && typeof firstError === "object") {
        const errorRecord = firstError as Record<string, unknown>;
        if (typeof errorRecord.message === "string") {
          return normalizeErrorMessage(errorRecord.message);
        }
      }
    }
  }

  return undefined;
};

const getAxiosErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    if (typeof error.response?.status === "number") {
      if (error.response.status >= 500) {
        return fallback;
      }
    }
    const messageFromPayload = getErrorMessageFromPayload(error.response?.data);
    if (messageFromPayload?.trim()) {
      return messageFromPayload.trim();
    }
    if (error.message) {
      return normalizeErrorMessage(error.message) ?? fallback;
    }
  }

  if (error instanceof Error && error.message) {
    return normalizeErrorMessage(error.message) ?? fallback;
  }

  return fallback;
};

export async function getAuditLogs(
  params?: AuditLogsQueryParams,
): Promise<Response<AuditLogsResponse>> {
  try {
    const session = await auth();
    // For system users, don't pass tenant_id to allow cross-tenant audit log viewing
    const isSystemUser = session?.user?.user_type === "system";
    const tenantId = isSystemUser ? "" : (session?.user?.tenant_id as string);
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      tenantId, session?.user?.user_type,
    );

    const queryParams: AuditLogsQueryParams = {
      limit: 50,
      offset: 0,
      ...(params ?? {}),
    };

    const queryString = buildQueryString(queryParams);
    const response = await axiosInstance.get(`api/v1/audit/logs${queryString}`);

    console.log("Audit logs response:", response);

    const camelCasedData = convertObjectKeysToCamelCase(response.data);

    return {
      success: true,
      data: {
        logs: camelCasedData.data || [],
        pagination: {
          limit: camelCasedData.limit || 50,
          offset: camelCasedData.offset || 0,
          total: camelCasedData.total || 0,
        },
      } as AuditLogsResponse,
      message: "Audit logs fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    const message = getAxiosErrorMessage(error, "Failed to fetch audit logs");
    return {
      success: false,
      data: {
        logs: [],
        pagination: {
          limit: 50,
          offset: 0,
          total: 0,
        },
      },
      message,
    };
  }
}

export async function getAuditLogById(
  id: string,
): Promise<Response<AuditLogRecord>> {
  try {
    const session = await auth();
    // For system users, don't pass tenant_id to allow cross-tenant audit log viewing
    const isSystemUser = session?.user?.user_type === "system";
    const tenantId = isSystemUser ? "" : (session?.user?.tenant_id as string);
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      tenantId, session?.user?.user_type,
    );

    const response = await axiosInstance.get(`api/v1/audit/logs/${id}`);

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data || response.data,
    );

    return {
      success: true,
      data: camelCasedData,
      message: "Audit log fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching audit log:", error);
    const message = getAxiosErrorMessage(error, "Failed to fetch audit log");
    return {
      success: false,
      data: {} as AuditLogRecord,
      message,
    };
  }
}
