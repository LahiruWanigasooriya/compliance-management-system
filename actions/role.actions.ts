"use server";

import { convertObjectKeysToCamelCase } from "@/utils/convertObjectKeysToCamelCase";
import type { Response } from "@/types/response.types";
import { PrivilegeLevel } from "./privilege.level.actions";
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

export interface Role {
  id: string;
  tenantId: string;
  roleName: string;
  description?: string;
  privilegeLevelId: string;
  privilegeLevel?: PrivilegeLevel;
  privileges: Privilege[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  roleName: string;
  privilegeLevelId: string;
  description?: string;
}

export interface UpdateRoleRequest {
  roleName: string;
  privilegeLevelId: string;
  description?: string;
}

export interface CheckPermissionRequest {
  roleId: string;
  resourceName: string;
  action: string;
}

export interface CheckPermissionResponse {
  allowed: boolean;
}

export interface RolesApiResponse {
  roles: Role[];
  count: number;
}

export interface SingleRoleApiResponse {
  id: string;
  tenantId: string;
  roleName: string;
  privilegeLevelId: string;
  privileges: Privilege[];
  createdAt: string;
  updatedAt: string;
}

// Helper to extract backend error message
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

// Create Role
export const createRole = async (
  roleName: string,
  privilegeLevelId: string,
  description?: string,
): Promise<Response<SingleRoleApiResponse | null>> => {
  console.log("Creating role with:", {
    roleName,
    description,
    privilegeLevelId,
  });
  try {
    // Log the exact request being sent
    console.log("Request payload:", {
      role_name: roleName,
      description,
      privilege_level_id: privilegeLevelId,
    });

    const axiosInstance = await getAxios();
    const response = await axiosInstance.post(
      "/api/v1/roles/",
      { role_name: roleName, privilege_level_id: privilegeLevelId },
    );

    // Check if response has success flag
    if (response.data.success === false) {
      console.error("Backend returned success: false", response.data);
      return {
        success: false,
        data: null,
        message:
          response.data.error ||
          response.data.message ||
          "Failed to create role",
      };
    }

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data ?? response.data,
    );

    return {
      success: true,
      data: camelCasedData as SingleRoleApiResponse,
      message: response.data.message || "Role created successfully",
    };
  } catch (error: any) {
    console.error("Error object:", error);
    console.error("Error response:", error.response);

    return {
      success: false,
      data: null,
      message: getApiErrorMessage(error),
    };
  }
};

// Update Role
export const updateRole = async (
  roleId: string,
  roleName: string,
  privilegeLevelId: string,
  description?: string,
): Promise<Response<SingleRoleApiResponse | null>> => {
  console.log("Updating role with:", {
    roleName,
    description,
    privilegeLevelId,
  });
  try {
    const axiosInstance = await getAxios();
    const response = await axiosInstance.put(
      `/api/v1/roles/${roleId}`,
      {
        role_name: roleName,
        description,
        privilege_level_id: privilegeLevelId,
      },
    );

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data ?? response.data,
    );

    return {
      success: true,
      data: camelCasedData as SingleRoleApiResponse,
      message: "Role updated successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      message: getApiErrorMessage(error),
    };
  }
};

// Get Role by ID
export const getRole = async (
  roleId: string,
): Promise<Response<SingleRoleApiResponse | null>> => {
  try {
    const axiosInstance = await getAxios();
    const response = await axiosInstance.get(`/api/v1/roles/${roleId}`);

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data ?? response.data,
    );

    return {
      success: true,
      data: (camelCasedData as SingleRoleApiResponse) ?? null,
      message: "Role fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching role:", error);

    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Failed to fetch role",
    };
  }
};

// Get All Roles
export const getAllRoles = async (): Promise<Response<RolesApiResponse | null>> => {
  try {
    const axiosInstance = await getAxios();
    const response = await axiosInstance.get("/api/v1/roles");

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data ?? response.data,
    );

    return {
      success: true,
      data: (camelCasedData as RolesApiResponse) ?? null,
      message: "Roles fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching roles:", error);

    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Failed to fetch roles",
    };
  }
};

// Delete Role
export const deleteRole = async (
  roleId: string,
): Promise<Response<{ message: string; roleId: string } | null>> => {
  try {
    const axiosInstance = await getAxios();
    const response = await axiosInstance.delete(`/api/v1/roles/${roleId}`);

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data ?? response.data,
    );

    return {
      success: true,
      data: camelCasedData as { message: string; roleId: string },
      message: "Role deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting role:", error);

    // Get the specific error message from the backend
    const errorMessage = getApiErrorMessage(error);

    // Log detailed error info for debugging
    if (error.response?.data) {
      console.error("Backend error response:", error.response.data);
    }

    return {
      success: false,
      data: null,
      message: errorMessage,
    };
  }
};

// Check Permission
export const checkPermission = async (
  roleId: string,
  resourceName: string,
  action: string,
): Promise<Response<CheckPermissionResponse | null>> => {
  try {
    const axiosInstance = await getAxios();
    const response = await axiosInstance.post(
      "/api/v1/roles/check-permission",
      {
        role_id: roleId,
        resource_name: resourceName,
        action: action,
      },
    );

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data ?? response.data,
    );

    return {
      success: true,
      data: (camelCasedData as CheckPermissionResponse) ?? null,
      message: "Permission check completed",
    };
  } catch (error) {
    console.error("Error checking permission:", error);

    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : "Failed to check permission",
    };
  }
};

// Get Role by Name (helper function if needed)
export const getRoleByName = async (
  roleName: string,
): Promise<Response<SingleRoleApiResponse | null>> => {
  try {
    // Note: This endpoint might not exist in the provided backend
    // You may need to filter from getAllRoles or implement this on the backend
    const allRoles = await getAllRoles();

    if (!allRoles.success || !allRoles.data) {
      return {
        success: false,
        data: null,
        message: "Failed to fetch roles",
      };
    }

    const role = allRoles.data.roles.find((r) => r.roleName === roleName);

    if (!role) {
      return {
        success: false,
        data: null,
        message: "Role not found",
      };
    }

    return {
      success: true,
      data: role,
      message: "Role found successfully",
    };
  } catch (error) {
    console.error("Error fetching role by name:", error);

    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : "Failed to fetch role by name",
    };
  }
};

// Get Roles by Privilege Level ID
export const getRolesByPrivilegeLevelId = async (
  privilegeLevelId: string,
): Promise<Response<Role[] | null>> => {
  try {
    // Note: This endpoint might not exist in the provided backend
    // You may need to filter from getAllRoles or implement this on the backend
    const allRoles = await getAllRoles();

    if (!allRoles.success || !allRoles.data) {
      return {
        success: false,
        data: null,
        message: "Failed to fetch roles",
      };
    }

    const filteredRoles = allRoles.data.roles.filter(
      (r) => r.privilegeLevelId === privilegeLevelId,
    );

    return {
      success: true,
      data: filteredRoles,
      message: "Roles filtered successfully",
    };
  } catch (error) {
    console.error("Error fetching roles by privilege level:", error);

    return {
      success: false,
      data: null,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch roles by privilege level",
    };
  }
};
