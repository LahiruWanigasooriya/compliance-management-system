"use server";

import axios from "axios";
import { APPLICATION } from "@/constants/application";
import { Response } from "@/types/response.types";
import {
  CreateSavedFilterPayload,
  SavedFilter,
  SavedFiltersList,
  UpdateSavedFilterPayload,
} from "@/types/filter.types";
import { convertObjectKeysToCamelCase } from "@/utils/convertObjectKeysToCamelCase";
import { auth, createServerAxios } from "@/utils/axios_server";

const emptySavedFiltersList: SavedFiltersList = {
  count: 0,
  filters: [],
};

const emptySavedFilter: SavedFilter = {
  id: "",
  type: "",
  names: [],
  values: [],
};

const buildQueryString = (
  params?: Record<string, string | number | undefined | null>,
) => {
  const normalized = params ?? {};
  const entries = Object.entries(normalized).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (value === undefined || value === null) {
        return acc;
      }
      return { ...acc, [key]: `${value}` };
    },
    {},
  );
  return new URLSearchParams(entries).toString();
};

const getBackendErrorMessage = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }
  const record = payload as Record<string, unknown>;
  const errorValue = record.error ?? record.Error;
  if (typeof errorValue === "string") {
    return errorValue;
  }
  const message = record.message ?? record.Message;
  if (typeof message === "string") {
    return message;
  }
  return undefined;
};

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return (
      getBackendErrorMessage(error.response?.data) ??
      error.message ??
      "Request failed"
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return getBackendErrorMessage(error) ?? "An unexpected error occurred.";
};

const buildBaseAxios = async () => {
  const session = await auth();
  const axiosInstance = createServerAxios(
    session?.accessToken as string,
    session?.user?.tenant_id as string,
    session?.user?.user_type,
    session?.user?.id as string,
  );
  return axiosInstance;
};

export async function getSavedFilters(
  type = "aml",
): Promise<Response<SavedFiltersList | null>> {
  try {
    const axiosInstance = await buildBaseAxios();

    axiosInstance.interceptors.request.use((req) => {
      console.log("chk fltiiii get Sending Headers:", req.headers);
      return req;
    });


    const queryString = buildQueryString({ type });
    const url = `/api/v1/user-filters${queryString ? `?${queryString}` : ""}`;

    
    console.log("chk fltiiii get url:", url);
    const response = await axiosInstance.get(url);
    const payload = response.data;
    console.log("chk fltiiii get response:", payload);

    if (payload?.success === false) {
      return {
        success: false,
        data: emptySavedFiltersList,
        message:
          payload?.message ??
          getBackendErrorMessage(payload) ??
          "Unable to load saved filters.",
      };
    }

    const camelCased = convertObjectKeysToCamelCase(payload ?? {});
    const payloadData = (camelCased.data ??
      camelCased) as Partial<SavedFiltersList>;

    return {
      success: camelCased.success ?? true,
      data: {
        ...emptySavedFiltersList,
        ...payloadData,
      },
      message: payload?.message,
    };
  } catch (error: any) {
    console.log("chk error3", error.response?.data);
    return {
      success: false,
      data: emptySavedFiltersList,
      message: getErrorMessage(error),
    };
  }
}

export async function createSavedFilter(
  payload: CreateSavedFilterPayload,
): Promise<Response<SavedFilter | null>> {
  try {
    console.log("chk fltiiii post payload 2", "payload", payload);
    const axiosInstance = await buildBaseAxios();

    axiosInstance.interceptors.request.use((req) => {
      console.log("chk fltiiii post Sending Headers:", req.headers);
      return req;
    });

    const response = await axiosInstance.post("/api/v1/user-filters/create", payload);
    console.log("chk fltiiii post 3response", "response", response.data);
    const respPayload = response.data;
    console.log("chk fltiiii post respPayload?.success", respPayload?.success);

    if (respPayload?.success === false) {
      return {
        success: false,
        data: emptySavedFilter,
        message:
          respPayload?.message ??
          getBackendErrorMessage(respPayload) ??
          "Unable to save filter.",
      };
    }

    const camelCased = convertObjectKeysToCamelCase(respPayload ?? {});
    const payloadData = (camelCased.data ?? camelCased) as Partial<SavedFilter>;

    return {
      success: camelCased.success ?? true,
      data: {
        ...emptySavedFilter,
        ...payloadData,
      },
      message: respPayload?.message,
    };
  } catch (error) {
    console.log("chk fltiiii errrr");
    return {
      success: false,
      data: emptySavedFilter,
      message: getErrorMessage(error),
    };
  }
}

export async function updateSavedFilter(
  filterId: string,
  payload: UpdateSavedFilterPayload,
): Promise<Response<SavedFilter | null>> {
  try {
    const axiosInstance = await buildBaseAxios();
    const response = await axiosInstance.put(
      `/api/v1/user-filters/${filterId}`,
      payload,
    );
    const respPayload = response.data;

    if (respPayload?.success === false) {
      return {
        success: false,
        data: emptySavedFilter,
        message:
          respPayload?.message ??
          getBackendErrorMessage(respPayload) ??
          "Unable to update filter.",
      };
    }

    const camelCased = convertObjectKeysToCamelCase(respPayload ?? {});
    const payloadData = (camelCased.data ?? camelCased) as Partial<SavedFilter>;

    return {
      success: camelCased.success ?? true,
      data: {
        ...emptySavedFilter,
        ...payloadData,
      },
      message: respPayload?.message,
    };
  } catch (error) {
    return {
      success: false,
      data: emptySavedFilter,
      message: getErrorMessage(error),
    };
  }
}

export async function deleteSavedFilter(
  filterId: string,
): Promise<Response<null>> {
  try {
    const axiosInstance = await buildBaseAxios();
    const response = await axiosInstance.delete(
      `/api/v1/user-filters/${filterId}`,
    );
    const respPayload = response.data;

    if (respPayload?.success === false) {
      return {
        success: false,
        data: null,
        message:
          respPayload?.message ??
          getBackendErrorMessage(respPayload) ??
          "Unable to delete filter.",
      };
    }

    return {
      success: true,
      data: null,
      message: respPayload?.message ?? "Filter deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: getErrorMessage(error),
    };
  }
}
