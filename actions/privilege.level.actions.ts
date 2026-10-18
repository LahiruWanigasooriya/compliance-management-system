// privilege.level.actions.ts
"use server";

import { convertObjectKeysToCamelCase } from "@/utils/convertObjectKeysToCamelCase";
import type { Response } from "@/types/response.types";
import { auth, createServerAxios } from "@/utils/axios_server";
import { APPLICATION } from "@/constants/application";

export interface Privilege {
  resource: string;
  actions: Action[];
}

export interface Action {
  create: boolean;
  get: boolean;
  update: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
  query: boolean;
  escalate: boolean;
}

export interface PrivilegeLevel {
  id: string;
  tenantId: string;
  levelValue: number;
  inheritanceGroup?: string;
  privileges: Privilege[];
  createdAt: string;
  updatedAt: string;
}

const getApiErrorMessage = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return "An unexpected error occurred";
};

// Helper to get server-side Axios instance with proper user type handling
async function getAxios() {
  const session = await auth();
  return createServerAxios(
    session?.accessToken as string,
    (session?.user?.tenant_id as string) ,
    session?.user?.user_type,
  );
}

// Create Privilege Level - NOW WITH INHERITANCE GROUP
export const createPrivilegeLevel = async (
  levelValue: number,
  privileges: Privilege[],
  inheritanceGroup: string = "business"
): Promise<Response<any>> => {
  console.log("=== CREATE PRIVILEGE LEVEL ===");
  console.log("Level Value:", levelValue);
  console.log("Inheritance Group:", inheritanceGroup);
  console.log("Privileges:", privileges);

  try {
    const requestBody = {
      level_value: levelValue,
      inheritance_group: inheritanceGroup,
      privileges: privileges,
    };

    const axiosInstance = await getAxios();
    const response = await axiosInstance.post(
      "/api/v1/privilege-level",
      requestBody
    );

    if (response.data.success === false) {
      return {
        success: false,
        data: null,
        message:
          response.data.error ||
          response.data.message ||
          "Failed to create privilege level",
      };
    }

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data ?? response.data,
    );

    return {
      success: true,
      data: camelCasedData,
      message: response.data.message || "Privilege level created successfully",
    };
  } catch (error: any) {
    console.error("Create Error:", error);
    console.error("Error Response:", error.response?.data);
    return {
      success: false,
      data: null,
      message: getApiErrorMessage(error),
    };
  }
};

export const updatePrivilegeLevel = async (
  privilegeLevelId: string,
  levelValue: number,
  privileges: Privilege[],
  inheritanceGroup: string = "business"
): Promise<Response<any>> => {
  console.log("=== UPDATE PRIVILEGE LEVEL ===");
  console.log("Privilege Level ID:", privilegeLevelId);
  console.log("Level Value:", levelValue);
  console.log("Inheritance Group:", inheritanceGroup);
  console.log("Privileges:", privileges);

  try {
    const requestBody = {
      level_value: levelValue,
      inheritance_group: inheritanceGroup,
      privileges: privileges,
    };

    const axiosInstance = await getAxios();
    const response = await axiosInstance.put(
      `/api/v1/privilege-level/${privilegeLevelId}`,
      requestBody
    );

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data ?? response.data,
    );

    return {
      success: true,
      data: camelCasedData,
      message: "Privilege level updated successfully",
    };
  } catch (error: any) {
    console.error("Update Error:", error);
    console.error("Error Response:", error.response?.data);
    return {
      success: false,
      data: null,
      message: getApiErrorMessage(error),
    };
  }
};

export const getPrivilegeLevel = async (
  privilegeLevelId: string
): Promise<Response<any>> => {
  try {
    const axiosInstance = await getAxios();
    const response = await axiosInstance.get(
      `/api/v1/privilege-level/${privilegeLevelId}`
    );

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data ?? response.data,
    );

    return {
      success: true,
      data: camelCasedData,
      message: "Privilege level fetched successfully",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : getApiErrorMessage(error),
    };
  }
};

export const getAllPrivilegeLevels = async (): Promise<Response<PrivilegeLevel[] | null>> => {
  try {
    const axiosInstance = await getAxios();
    const response = await axiosInstance.get("/api/v1/privilege-level");

    const rawData = response.data.data ?? response.data;
    const privilegeLevelsArray =
      rawData.privilege_levels || rawData.privilegeLevels || [];

    if (!Array.isArray(privilegeLevelsArray)) {
      console.warn(
        "Expected privilege_levels array but got:",
        privilegeLevelsArray,
      );
      return {
        success: false,
        data: null,
        message: "Invalid privilege levels data format",
      };
    }

    const camelCasedData = privilegeLevelsArray.map((item: any) =>
      convertObjectKeysToCamelCase(item),
    );

    return {
      success: true,
      data: camelCasedData as PrivilegeLevel[],
      message: "Privilege levels fetched successfully",
    };
  } catch (error: any) {
    console.error("Error fetching privilege levels:", error);
    return {
      success: false,
      data: null,
      message: getApiErrorMessage(error),
    };
  }
};

export const deletePrivilegeLevel = async (
  privilegeLevelId: string
): Promise<Response<{ message: string; privilegeLevelId: string } | null>> => {
  try {
    const axiosInstance = await getAxios();
    const response = await axiosInstance.delete(
      `/api/v1/privilege-level/${privilegeLevelId}`
    );

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data ?? response.data,
    );

    return {
      success: true,
      data: camelCasedData as { message: string; privilegeLevelId: string },
      message: "Privilege level deleted successfully",
    };
  } catch (error: any) {
    console.error("Error Response Data:", error.response?.data);

    return {
      success: false,
      data: null,
      message: getApiErrorMessage(error),
    };
  }
};

export const getPrivilegeLevelByValue = async (
  levelValue: number
): Promise<Response<any>> => {
  try {
    const allLevels = await getAllPrivilegeLevels();

    if (!allLevels.success || !allLevels.data) {
      return {
        success: false,
        data: null,
        message: "Failed to fetch privilege levels",
      };
    }

    const level = allLevels.data.find((l) => l.levelValue === levelValue);

    if (!level) {
      return {
        success: false,
        data: null,
        message: "Privilege level not found",
      };
    }

    return {
      success: true,
      data: level,
      message: "Privilege level found successfully",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : getApiErrorMessage(error),
    };
  }
};
