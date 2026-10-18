"use server";

// import axiosInstance from "@/utils/axios";
import axios from "axios";
import { Buffer } from "buffer";
import { Response } from "@/types/response.types";
import { convertObjectKeysToCamelCase } from "@/utils/convertObjectKeysToCamelCase";
import { FiltersResponse } from "@/types/aml/service.types";
import { AMLDashboardResponse } from "@/types/aml/dashboardWatchlist.types";
import {
  AMLInternalWatchlistResponse,
  AMLInternalWatchlistsResponse,
  AMLScreeningResponse,
  AMLScreeningsResponse,
} from "@/types/aml/screening";
// import { auth } from "@/auth";
import { auth, createServerAxios } from "@/utils/axios_server";
import { APPLICATION } from "@/constants/application";
import { getFilenameFromDisposition } from "@/utils/getFilenameFromDisposition";
import { ReviewStatus } from "@/types/aml/filters";

type Primitive = string | number | boolean | null | undefined | bigint | symbol;

function createEmpty<T extends Primitive | object>(): T {
  return new Proxy(
    {},
    {
      get: () => undefined,
    },
  ) as T;
}

const emptyFiltersResponse = createEmpty<FiltersResponse>();
const emptyDashboardResponse = createEmpty<AMLDashboardResponse>();
const emptyAML = createEmpty<AMLScreeningsResponse>();
const emptyInternalWatchlistsResponse =
  createEmpty<AMLInternalWatchlistsResponse>();
const emptyInternalWatchlistResponse =
  createEmpty<AMLInternalWatchlistResponse>();
const emptyScreeningResponse = createEmpty<AMLScreeningResponse>();
const emptyExportPdfResponse = createEmpty<{
  filename: string;
  content: string;
  contentType?: string;
}>();

const isHtmlPayload = (value: string) => {
  return /<(!doctype|html|head|body|meta|link|script|style|div|span|title)\b/i.test(
    value,
  );
};

const sanitizeMessage = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || isHtmlPayload(trimmed)) {
    return undefined;
  }
  return trimmed;
};

const formatErrorMessage = (error: string): string => {
  if (error.includes("tenant not found") || error.includes("tenant service")) {
    return "Service temporarily unavailable. Please try again later.";
  }
  if (error.includes("connection refused") || error.includes("dial tcp")) {
    return "Unable to connect to service. Please try again later.";
  }
  if (error.includes("timeout") || error.includes("timed out")) {
    return "Request timed out. Please try again.";
  }
  if (error.includes("unauthorized") || error.includes("401")) {
    return "Authentication required. Please log in again.";
  }
  if (error.includes("forbidden") || error.includes("403")) {
    return "You don't have permission to access this resource.";
  }
  if (error.includes("failed to verify assigned user: user not found") || error.includes("404")) {
    return "Failed to verify assigned user: user not found.";
  }
  if (error.includes("not found") || error.includes("404")) {
    return "The requested resource was not found.";
  }
  return error;
};

const getBackendErrorMessage = (payload: unknown) => {
  if (typeof payload === "string") {
    const sanitized = sanitizeMessage(payload);
    return sanitized ? formatErrorMessage(sanitized) : sanitized;
  }

  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  const errorValue = record.error ?? record.Error;

  if (typeof errorValue === "string") {
    const sanitized = sanitizeMessage(errorValue);
    return sanitized ? formatErrorMessage(sanitized) : sanitized;
  }

  if (errorValue && typeof errorValue === "object") {
    const errorRecord = errorValue as Record<string, unknown>;
    const errorMessage = errorRecord.message ?? errorRecord.Message;
    if (typeof errorMessage === "string") {
      const sanitized = sanitizeMessage(errorMessage);
      return sanitized ? formatErrorMessage(sanitized) : sanitized;
    }
  }

  const message = record.message ?? record.Message;
  if (typeof message === "string") {
    const sanitized = sanitizeMessage(message);
    return sanitized ? formatErrorMessage(sanitized) : sanitized;
  }

  return undefined;
};

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return getBackendErrorMessage(error.response?.data?.error?.message) ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return getBackendErrorMessage(error);
};

const buildQueryString = (
  params?: Record<string, string | number | undefined | null>,
) => {
  const normalized = params ?? {};
  const entries = Object.entries(normalized).reduce(
    (acc, [key, value]) => {
      if (value === undefined || value === null) {
        return acc;
      }
      return { ...acc, [key]: `${value}` };
    },
    {} as Record<string, string>,
  );
  return new URLSearchParams(entries).toString();
};

export async function getSupportedFiltersAndCountries(): Promise<
  Response<FiltersResponse | null>
> {
  try {
    const session = await auth();

    // console.log("Session in getSupportedFiltersAndCountries:", session);
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );
    
    console.log("chk response fil 1", "api/v1/aml/supported-filters-countries");
    
    const response = await axiosInstance.get(
      "api/v1/aml/supported-filters-countries",
    );
    
    console.log("chk response fil 2", response);
    
    const payload = response.data;
    if (payload?.success === false) {
      return {
        success: false,
        data: emptyFiltersResponse,
        message: getBackendErrorMessage(payload),
      };
    }

    const camelCasedData = convertObjectKeysToCamelCase(payload ?? {});

    return {
      success: payload?.success ?? true,
      data: {
        data: camelCasedData.data,
        metadata: camelCasedData.metadata,
        timestamp: camelCasedData.timestamp,
      } as FiltersResponse,
      message: payload?.message,
    };
  } catch (error: any) {
    console.log("chk error====2", error.response.data.error.message);
    return {
      success: false,
      data: emptyFiltersResponse,
      message: getErrorMessage(error),
    };
  }
}

export async function getAMLDashboardStatistics(
  params?: Record<string, string | number | undefined | null>,
): Promise<Response<AMLDashboardResponse | null>> {
  try {
    const queryParams = buildQueryString({
      ...params,
    });

    const session = await auth();

    console.log("Session in getSupportedFiltersAndCountries:", session);
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );

    console.log("chk queryParams dash", params);
    const response = await axiosInstance.get(
      `api/v1/aml/dashboard/statistics?${queryParams}`,
    );

    console.log(
      "chk response dash",
      `api/v1/aml/dashboard/statistics?${queryParams}`,
      response.data.data,
    );
    const payload = response.data;
    if (payload?.success === false) {
      return {
        success: false,
        data: emptyDashboardResponse,
        message: getBackendErrorMessage(payload),
      };
    }

    const camelCasedData = convertObjectKeysToCamelCase(payload ?? {});

    return {
      success: payload?.success ?? true,
      data: {
        data: camelCasedData.data,
        metadata: camelCasedData.metadata,
        timestamp: camelCasedData.timestamp,
      } as AMLDashboardResponse,
      message: payload?.message,
    };
  } catch (error) {
    return {
      success: false,
      data: emptyDashboardResponse,
      message: getErrorMessage(error),
    };
  }
}

export async function getAMLScreenings(
  params?: Record<string, string | number | undefined | null>,
): Promise<Response<AMLScreeningsResponse | null>> {
  try {
    console.log("chk paramss", params);
    const queryParams = buildQueryString({
      ...params,
    });

    const session = await auth();

    console.log("Session in getSupportedFiltersAndCountries:", session);
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );

    console.log("chk queryParams s", `${queryParams}`);
    console.log("chk response", `api/v1/aml/screenings?${queryParams}`);
    const response = await axiosInstance.get(
      `api/v1/aml/screenings?${queryParams}`,
    );

    console.log("chk response aml", response);

    const payload = response.data;
    if (payload?.success === false) {
      return {
        success: false,
        data: emptyAML,
        message: getBackendErrorMessage(payload),
      };
    }

    const camelCasedData = convertObjectKeysToCamelCase(payload ?? {});

    return {
      success: payload?.success ?? true,
      data: {
        ...camelCasedData.data,
        ...camelCasedData.metadata,
        timestamp: camelCasedData.timestamp,
      } as AMLScreeningsResponse,
      message: payload?.message,
    };
  } catch (error) {
    return {
      success: false,
      data: emptyAML,
      message: getErrorMessage(error),
    };
  }
}

export async function getAMLInternalWatchlist(
  params?: Record<string, string | number | undefined | null>,
): Promise<Response<AMLInternalWatchlistsResponse | null>> {
  try {
    const queryParams = buildQueryString({
      ...params,
    });

    const session = await auth();

    console.log("Session in getSupportedFiltersAndCountries:", session);
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );

    console.log("chk queryParams INT", queryParams);
    const response = await axiosInstance.get(
      `api/v1/aml/internal-watchlist?${queryParams}`,
    );

    console.log("chk response", response);
    const payload = response.data;
    if (payload?.success === false) {
      return {
        success: false,
        data: emptyInternalWatchlistsResponse,
        message: getBackendErrorMessage(payload),
      };
    }

    const camelCasedData = convertObjectKeysToCamelCase(payload ?? {});

    return {
      success: payload?.success ?? true,
      data: {
        screenings: camelCasedData.data.entries,
        ...camelCasedData.metadata,
        timestamp: camelCasedData.timestamp,
      } as AMLInternalWatchlistsResponse,
      message: payload?.message,
    };
  } catch (error) {
    return {
      success: false,
      data: emptyInternalWatchlistsResponse,
      message: getErrorMessage(error),
    };
  }
}

export async function fetchWatchlistEntry(
  id: string,
): Promise<Response<AMLInternalWatchlistResponse | null>> {
  try {
    const session = await auth();

    console.log("Session in getSupportedFiltersAndCountries:", session);
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );
    const response = await axiosInstance.get(
      `/api/v1/aml/internal-watchlist/${id}`,
    );

    console.log("chk response", `/api/v1/aml/internal-watchlist/${id}`);

    const payload = response.data;
    if (payload?.success === false) {
      return {
        success: false,
        data: emptyInternalWatchlistResponse,
        message: getBackendErrorMessage(payload),
      };
    }

    const camelCasedData = convertObjectKeysToCamelCase(payload ?? {});

    return {
      success: payload?.success ?? true,
      message: payload?.message,
      data: {
        screening: camelCasedData.data,
        metadata: camelCasedData.metadata,
        timestamp: camelCasedData.timestamp,
      } as AMLInternalWatchlistResponse,
    };
  } catch (error) {
    return {
      success: false,
      data: emptyInternalWatchlistResponse,
      message: getErrorMessage(error),
    };
  }
}

export async function fetchScreeningByReference(
  reference: string,
): Promise<Response<AMLScreeningResponse | null>> {
  try {
    const session = await auth();

    console.log("Session in getSupportedFiltersAndCountries:", session);
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );
    const response = await axiosInstance.get(
      `/api/v1/aml/screenings/${reference}`,
    );

    console.log("chk response", `/api/v1/aml/screenings/${reference}`);

    const payload = response.data;
    if (payload?.success === false) {
      return {
        success: false,
        data: emptyScreeningResponse,
        message: getBackendErrorMessage(payload),
      };
    }

    const camelCasedData = convertObjectKeysToCamelCase(payload ?? {});

    return {
      success: payload?.success ?? true,
      message: payload?.message,
      data: {
        screening: camelCasedData.data,
        metadata: camelCasedData.metadata,
        timestamp: camelCasedData.timestamp,
      } as AMLScreeningResponse,
    };
  } catch (error) {
    return {
      success: false,
      data: emptyScreeningResponse,
      message: getErrorMessage(error),
    };
  }
}

export async function exportAMLScreeningsPdf(
  params?: Record<string, string | number | undefined | null>,
  source: "screenings" | "internal" = "screenings",
): Promise<
  Response<{ filename: string; content: string; contentType?: string } | null>
> {
  try {
    const queryParams = buildQueryString({
      ...params,
    });
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );

    const endpoint =
      source === "internal"
        ? "api/v1/aml/internal-watchlist/export"
        : "api/v1/aml/screenings/export";

    const response = await axiosInstance.get(`${endpoint}?${queryParams}`, {
      responseType: "arraybuffer",
    });

    const disposition = response.headers["content-disposition"] ?? "";
    const defaultFilename =
      source === "internal"
        ? `aml-internal-${new Date().toISOString()}`
        : `aml-screenings-${new Date().toISOString()}`;
    const filename =
      getFilenameFromDisposition(disposition, defaultFilename) ??
      defaultFilename;

    const base64 = Buffer.from(response.data).toString("base64");

    return {
      success: true,
      data: {
        filename,
        content: base64,
        contentType: response.headers["content-type"],
      },
    };
  } catch (error) {
    return {
      success: false,
      data: emptyExportPdfResponse,
      message: getErrorMessage(error) ?? "Failed to export AML PDF.",
    };
  }
}

export async function submitScreeningReview(
  reference: string,
  payload: {
    review_status?: ReviewStatus;
    review_notes?: string;
    review_decision?: string;
    assigned_for?: string;
  },
): Promise<Response<null>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string) ,
      session?.user?.user_type,
    );
    console.log("chk test url", `/api/v1/aml/screenings/${reference}/review`);
    console.log("chk test payload", payload);

    const response = await axiosInstance.put(
      `/api/v1/aml/screenings/${reference}/review`,
      payload,
    );

    console.log("chk test response", response);
    const message =
      response?.data?.message ??
      "Watchlist screening review request submitted successfully.";

    return {
      success: true,
      data: null,
      message,
    };
  } catch (error: any) {
    console.log("chk test error", error.response.data);
    return {
      success: false,
      data: null,
      message: getErrorMessage(error) ?? "Failed to submit review.",
    };
  }
}

export async function uploadInternalWatchlistCSV(
  file: File,
): Promise<Response<null>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string),
      session?.user?.user_type,
    );

    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post(
      '/api/v1/aml/internal-watchlist/bulk-upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    const message =
      response?.data?.message ??
      "Internal watchlist CSV uploaded successfully.";

    return {
      success: true,
      data: null,
      message,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      message: getErrorMessage(error) ?? "Failed to upload CSV file.",
    };
  }
}
