"use server";

import axios from "axios";
// import axiosInstance from "@/utils/axios";
import type {
  KYCAlertsRecord,
  KYCAlertsRecordsResponse,
} from "@/types/kyc/alerts.types";
import { convertObjectKeysToCamelCase } from "@/utils/convertObjectKeysToCamelCase";
import { Response } from "@/types/response.types";
import { AlertStatus } from "@/enums/kyc/AlertStatus";
// import { auth } from "@/auth";
import { auth, createServerAxios } from "@/utils/axios_server";
import { APPLICATION } from "@/constants/application";
import {
  KYCOverview,
  KYCPreferences,
  KYCProofDocument,
  KYCRecord,
  KYCRecordsResponse,
  KYCStatusUpdatePayload,
} from "@/types/kyc/kyc.types";

export type KYCRecordsQueryParams = Record<
  string,
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>
>;

const buildQueryString = (params?: KYCRecordsQueryParams) => {
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

const toDate = new Date().toISOString();
const fromDate = new Date();
fromDate.setDate(fromDate.getDate() - 7);
const fromDateISO = fromDate.toISOString();

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

const formatKycStatusError = (rawMessage: string) => {
  const normalized = rawMessage.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return rawMessage;
  }
  const simplified = normalized.toLowerCase();
  if (simplified === "reason required" || simplified === "reason is required") {
    return "Reason is required";
  }
  const sentence = normalized.replace(/[_-]+/g, " ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
};

export async function getKYCRequests(
  params?: KYCRecordsQueryParams,
): Promise<Response<KYCRecordsResponse>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );

    const queryParams: KYCRecordsQueryParams = {
      page: 1,
      limit: 10,
      ...(params ?? {}),
    };
    if (queryParams.sort_by === undefined) {
      queryParams.sort_by = "created_at";
    }
    if (queryParams.sort === undefined) {
      queryParams.sort = "asc";
    }
    const queryString = buildQueryString(queryParams);

    console.log("chk test response1", `api/v1/kyc/requests${queryString}`);
    const response = await axiosInstance.get(
      `api/v1/kyc/requests${queryString}`,
    );

    console.log("chk test response2", response);
    const camelCasedData = convertObjectKeysToCamelCase(
      response.data || response.data.data,
    );
    console.log("chk test camelCasedData", camelCasedData);

    return {
      success: true,
      data: {
        kyc: camelCasedData.data,
        pagination: camelCasedData.pagination,
      } as KYCRecordsResponse,
      message: "KYC requests fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching KYC requests:", error);
    const message = getAxiosErrorMessage(error, "Failed to fetch KYC requests");
    return {
      success: false,
      data: {
        kyc: [],
        pagination: {
          limit: 0,
          page: 0,
          total: 0,
          totalPages: 0,
        },
      },
      message,
    };
  }
}

export async function getKYCRequestById(
  id: string,
): Promise<Response<KYCRecord>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );
    console.log("chk `api/v1/kyc/requests/${id}`", `api/v1/kyc/requests/${id}`);
    const response = await axiosInstance.get(`api/v1/kyc/requests/${id}`);

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data || response.data,
    );

    return {
      success: true,
      data: camelCasedData as KYCRecord,
      message: "KYC request fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching KYC request:", error);
    const message = getAxiosErrorMessage(error, "Failed to fetch KYC request");
    return {
      success: false,
      data: {} as KYCRecord,
      message,
    };
  }
}

export async function getKYCAlertsRecords(
  params: KYCRecordsQueryParams = { page: 1, limit: 10 },
): Promise<Response<KYCAlertsRecordsResponse>> {
  try {
    const queryParams = {
      ...params,
      fromDate: params.fromDate || fromDateISO,
      toDate: params.toDate || toDate,
    };
    const session = await auth();

    console.log("Session in getKYCAlertsRecords:", session);
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );

    const queryString = buildQueryString(queryParams);
    const response = await axiosInstance.get(`api/v1/kyc/alerts${queryString}`);

    console.log("chk response alt", response);
    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data || response.data,
    );

    console.log("chk camelCasedData alt", camelCasedData);
    return {
      success: true,
      data: camelCasedData as KYCAlertsRecordsResponse,
      message: "KYC records fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching KYC records:", error);
    const message = getAxiosErrorMessage(error, "Failed to fetch KYC records");
    return {
      success: false,
      data: {
        alerts: [],
        pagination: {
          limit: 0,
          page: 0,
          total: 0,
        },
        total: 0,
      },
      message,
    };
  }
}

export async function getKYCAlertRecordById(
  id: string,
): Promise<Response<KYCAlertsRecord>> {
  try {
    const session = await auth();

    console.log("Session in getKYCAlertRecordById:", session);
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );
    const response = await axiosInstance.get(`api/v1/kyc/alerts/${id}`);

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data || response.data,
    );
    // const camelCasedData = convertObjectKeysToCamelCase({
    //   id: id,
    //   user_id: "35d279cf-8baa-4faa-bb65-95f3628fcbe3",
    //   forward_reference: "123456780",
    //   tenant_id: "tnt_test_1766054766",
    //   first_name: "",
    //   middle_name: "",
    //   last_name: "",
    //   dob: "",
    //   full_address: "",
    //   address_verified: false,
    //   document:
    //     "https://eprints.cs.univie.ac.at/8483/1/RAID_2025_Careless_Whisper_Exploiting_Silent__Gabriel%20Gegenhuber.pdf",
    //   document_additional_proof:
    //     "https://developers.shuftipro.com/assets/images/real_ID_card_back_side-c4593f8821df3e6abbfb43b35442af84.png",
    //   document_two:
    //     "https://developers.shuftipro.com/assets/images/real_ID_card-0f84231e66784fffb6412c4e78592a7f.png",
    //   document_two_additional_proof:
    //     "https://developers.shuftipro.com/assets/images/real_ID_card_back_side-c4593f8821df3e6abbfb43b35442af84.png",
    //   email: "nimsara@gmail.com",
    //   declined_reason: "",
    //   warnings: "",
    //   callback_url: "https://api-dev.vesant.ai/api/v1/kyc/shufti-callback",
    //   redirect_url: "",
    //   status: KycStatus.PENDING,
    //   location: "",
    //   risk: "low",
    //   created_at: "2025-12-22T07:18:32.299269Z",
    //   updated_at: "2025-12-22T07:18:32.299269Z",
    // });

    return {
      success: true,
      data: camelCasedData as KYCAlertsRecord,
      message: "KYC records fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching KYC records:", error);
    const message = getAxiosErrorMessage(error, "Failed to fetch KYC records");
    return {
      success: false,
      data: {} as KYCAlertsRecord,
      message,
    };
  }
}

export async function getKYCProofs(
  kycId: string,
): Promise<Response<KYCProofDocument[]>> {
  try {
    const session = await auth();

    console.log("Session in getKYCProofs:", session);
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );
    const response = await axiosInstance.get(`api/v1/kyc/proofs/${kycId}`);
    const payload = response.data;

    if (Array.isArray(payload)) {
      return {
        success: true,
        data: payload as KYCProofDocument[],
        message: "KYC proofs fetched successfully",
      };
    }

    return {
      success: false,
      data: [],
      message:
        typeof payload?.error === "string"
          ? payload.error
          : "Failed to fetch KYC proofs",
    };
  } catch (error) {
    console.error("Error fetching KYC proofs:", error);
    const message = getAxiosErrorMessage(error, "Failed to fetch KYC proofs");
    return {
      success: false,
      data: [],
      message,
    };
  }
}

export async function getKYCOverview(
  params: KYCRecordsQueryParams = {},
  options?: { omitDateRange?: boolean },
): Promise<Response<KYCOverview>> {
  try {
    const queryParams = options?.omitDateRange
      ? { ...params }
      : {
          ...params,
          fromDate: params.fromDate || fromDateISO,
          toDate: params.toDate || toDate,
        };

    const queryString = buildQueryString(queryParams);
    const session = await auth();

    console.log("Session in getKYCOverview:", session);
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );
    const response = await axiosInstance.get(
      `api/v1/kyc/overview${queryString}`,
    );

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data || response.data,
    );

    return {
      success: true,
      data: camelCasedData as KYCOverview,
      message: "KYC overview fetched successfully",
    };
  } catch (error) {
    console.error("chk kyc Error fetching KYC overview:", error);
    const message = getAxiosErrorMessage(error, "Failed to fetch KYC overview");
    return {
      success: false,
      data: {} as KYCOverview,
      message,
    };
  }
}

export async function getKYCPreferences(): Promise<Response<KYCPreferences>> {
  try {
    const session = await auth();

    console.log("Session in getKYCPreferences:", session);
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );
    const response = await axiosInstance.get("api/v1/kyc/preferences");

    // Keep data in snake_case format as returned by API
    const data = response.data.data || response.data;

    return {
      success: true,
      data: data as KYCPreferences,
      message: "KYC preferences fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching KYC preferences:", error);
    const message = getAxiosErrorMessage(
      error,
      "Failed to fetch KYC preferences",
    );
    return {
      success: false,
      data: {} as KYCPreferences,
      message,
    };
  }
}

export async function updateKYCPreferences(
  payload: Partial<KYCPreferences>,
): Promise<Response<KYCPreferences>> {
  try {
    const session = await auth();

    console.log("Session in updateKYCPreferences:", session);
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );

    // Transform approve_kyc_reasons to reasons for API
    const transformedPayload = {
      ...payload,
      // Rename approve_kyc_reasons to reasons if it exists
      ...(payload.approve_kyc_reasons && {
        reasons: payload.approve_kyc_reasons,
      }),
    };

    // Remove the old field name before sending
    if (transformedPayload.approve_kyc_reasons) {
      delete (transformedPayload as any).approve_kyc_reasons;
    }

    const response = await axiosInstance.put(
      "api/v1/kyc/preferences",
      transformedPayload,
    );

    // Keep data in snake_case format as returned by API
    const data = response.data.data || response.data;

    return {
      success: true,
      data: data as KYCPreferences,
      message: "KYC preferences updated successfully",
    };
  } catch (error) {
    console.error("Error updating KYC preferences:", error);
    const message = getAxiosErrorMessage(
      error,
      "Failed to update KYC preferences",
    );
    return {
      success: false,
      data: {} as KYCPreferences,
      message,
    };
  }
}

export async function updateKYCStatus(
  payload: KYCStatusUpdatePayload,
): Promise<Response<unknown>> {
  try {
    const session = await auth();

    console.log("Session in update KYC status:", session);
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );
    const response = await axiosInstance.put("api/v1/kyc/status", payload);

    console.log("chk response", response);
    return {
      success: true,
      data: response.data,
      message: response.data?.message ?? "KYC status updated successfully",
    };
  } catch (error) {
    console.error("Error updating KYC status:", error);
    const message = getAxiosErrorMessage(error, "Failed to update KYC status");
    return {
      success: false,
      data: null,
      message: formatKycStatusError(message),
    };
  }
}

export async function updateAlertStatus({
  alertId,
  status,
  reason,
  assigneeForId,
}: {
  alertId: string;
  status?: AlertStatus;
  reason?: string;
  assigneeForId?: string;
}): Promise<Response<unknown>> {
  try {
    const session = await auth();

    console.log("Session in update alert status:", session);
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type,
    );

    let response;
    console.log("chk payload test ", {
      assigned_for: assigneeForId,
      status,
      reason,
    });
    if (assigneeForId) {
      response = await axiosInstance.put(`api/v1/kyc/alerts/${alertId}`, {
        assigned_for: assigneeForId,
        status,
        reason,
      });
    }

    response = await axiosInstance.put(`api/v1/kyc/alerts/${alertId}`, {
      status,
      reason,
    });

    let displayMessage = response.data?.message;

    if (!displayMessage) {
      displayMessage = assigneeForId
        ? "Alert assignee updated successfully"
        : "Alert status updated successfully";
    }

    return {
      success: true,
      data: response.data,
      message: displayMessage,
    };
  } catch (error) {
    console.error("Error updating alert status:", error);
    const message = getAxiosErrorMessage(
      error,
      "Failed to update alert status",
    );
    return {
      success: false,
      data: null,
      message,
    };
  }
}
