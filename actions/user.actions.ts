"use server";

import { convertObjectKeysToCamelCase } from "@/utils/convertObjectKeysToCamelCase";
import type { Response } from "@/types/response.types";
import type { User } from "@/types/user.types";
import { auth, createServerAxios } from "@/utils/axios_server"; // <--- CORRECT IMPORT
import { APPLICATION } from "@/constants/application";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// --- Types ---

export interface Role {
  id: string | number;
  name: string;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
}

export interface UpdateUserData {
  id: string;
  name: string;
  role: string;
  status: "active" | "inactive" | "suspended";
}

export interface GetUsersParams {
  search?: string;
  roleName?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// --- Helper to get Axios Instance ---
async function getAxios() {
  const session = await auth();
  return createServerAxios(
    session?.accessToken as string,
    (session?.user?.tenant_id as string),
    session?.user?.user_type,
  );
}

// --- Actions ---

/**
 * Server action to fetch available roles
 */
export async function getRoles(
  tenantId?: string,
): Promise<Response<Role[] | null>> {
  try {
    const axios = await getAxios(); // Get server-safe axios
    const response = await axios.get("/api/v1/roles");

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data ?? response.data,
    );

    let rawRoles: any[] = [];
    if (Array.isArray(camelCasedData)) {
      rawRoles = camelCasedData;
    } else if (camelCasedData && Array.isArray((camelCasedData as any).data)) {
      rawRoles = (camelCasedData as any).data;
    } else if (camelCasedData && Array.isArray((camelCasedData as any).roles)) {
      rawRoles = (camelCasedData as any).roles;
    } else {
      rawRoles = [];
    }

    const safeRoles: Role[] = rawRoles.map((r: any) => ({
      id: r.id,
      name: r.roleName || r.role_name || r.name || "Unknown Role",
    }));

    return {
      success: true,
      data: safeRoles,
      message: "Roles fetched successfully",
    };
  } catch (error: any) {
    console.error("Error fetching roles:", error);
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : "Failed to fetch roles",
    };
  }
}

/**
 * Server action to get user list
 */
export async function getUsers(
  params: GetUsersParams = {},
  tenantId?: string,
): Promise<Response<User[] | null>> {
  try {
    const {
      search = "",
      roleName = "",
      status = "",
      page = 1,
      limit = 100,
    } = params;

    const axios = await getAxios();
    const response = await axios.get("/api/v1/users", {
      params: {
        search,
        role: roleName, // Updated param name for new endpoint
        status,
        page,
        limit,
      },
    });

    const rawData = response.data.data ?? response.data;
    const camelCasedData = convertObjectKeysToCamelCase(rawData);

    let userListRaw: any[] = [];
    if (Array.isArray(camelCasedData)) {
      userListRaw = camelCasedData;
    } else if (camelCasedData && Array.isArray((camelCasedData as any).data)) {
      userListRaw = (camelCasedData as any).data;
    } else if (camelCasedData && Array.isArray((camelCasedData as any).users)) {
      userListRaw = (camelCasedData as any).users;
    } else if (camelCasedData && Array.isArray((camelCasedData as any).items)) {
      userListRaw = (camelCasedData as any).items;
    } else {
      userListRaw = [];
    }

    const users: User[] = userListRaw.map((u: any) => ({
      id: u.id,
      name: u.fullName || u.name || "Unknown User",
      email: u.email,
      role: u.roleName || u.role || "User",
      status: u.status || "inactive",
      lastLogin: u.lastLoginAt ? u.lastLoginAt : null,
      mfaEnabled: Boolean(u.isMfaEnabled || u.mfaEnabled),
      permissions: u.permissions || [],
      phone: u.phone,
    }));

    // Attempt to extract pagination metadata from the response
    const totalCandidates = [
      (camelCasedData as any)?.total,
      (camelCasedData as any)?.totalCount,
      (camelCasedData as any)?.total_records,
      (camelCasedData as any)?.meta?.total,
      (camelCasedData as any)?.pagination?.total,
      (camelCasedData as any)?.count,
    ];

    const pageCandidates = [
      (camelCasedData as any)?.page,
      (camelCasedData as any)?.current_page,
      (camelCasedData as any)?.meta?.page,
      (camelCasedData as any)?.pagination?.page,
    ];

    const pageSizeCandidates = [
      (camelCasedData as any)?.page_size,
      (camelCasedData as any)?.limit,
      (camelCasedData as any)?.per_page,
      (camelCasedData as any)?.meta?.page_size,
      (camelCasedData as any)?.pagination?.page_size,
    ];

    const metaTotal = totalCandidates.find((v) => typeof v === "number") as
      | number
      | undefined;
    const metaPage = pageCandidates.find((v) => typeof v === "number") as
      | number
      | undefined;
    const metaPageSize = pageSizeCandidates.find(
      (v) => typeof v === "number",
    ) as number | undefined;
    const metaTotalPages =
      (camelCasedData as any)?.total_pages ||
      (camelCasedData as any)?.totalPages;

    return {
      success: true,
      data: users,
      message: "Users fetched successfully",

      pagination: {
        total: metaTotal,
        page: metaPage,
        page_size: metaPageSize,
        total_pages: metaTotalPages,
      },
    } as any;
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Failed to fetch users",
    };
  }
}

/**
 * Get User By ID
 */
export async function getUserById(
  userId: string,
  tenantId?: string,
): Promise<Response<User | null>> {
  try {
    // Note: Reusing getUsers since direct endpoint is missing
    const listResponse = await getUsers({ limit: 100 }, tenantId);

    if (!listResponse.success || !listResponse.data) {
      throw new Error(
        listResponse.message || "Failed to fetch user list for lookup",
      );
    }

    const foundUser = listResponse.data.find((u) => u.id === userId);

    if (!foundUser) {
      return {
        success: false,
        data: null,
        message: "User not found in the provided list",
      };
    }

    return {
      success: true,
      data: foundUser,
      message: "User details fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : "Failed to fetch user details",
    };
  }
}

/**
 * Server action to create a new user
 */
export async function createUser(
  data: CreateUserData,
  tenantId?: string,
): Promise<Response<any | null>> {
  try {
     // Clean phone number - remove all non-numeric characters except +
    const cleanPhone = data.phone 
      ? data.phone.replace(/[\s\-()]/g, '') 
      : '';

    const payload = {
      email: data.email,
      full_name: `${data.firstName} ${data.lastName}`.trim(),
      phone: cleanPhone,
      role_id: data.role,
    };

    const axios = await getAxios();
    const response = await axios.post("/api/v1/users", payload);

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data ?? response.data,
    );

    revalidatePath("/user");

    return {
      success: true,
      data: camelCasedData,
      message: "User created successfully",
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Failed to create user",
    };
  }
}

// --- SPECIFIC UPDATE ACTIONS ---

async function updateUserStatus(userId: string, status: string) {
  const axios = await getAxios();
  return await axios.patch(`/api/v1/users/${userId}`, {
    status: status,
  });
}

async function updateUserRole(userId: string, roleId: string) {
  const axios = await getAxios();
  try {
    const response = await axios.patch(`/api/v1/users/${userId}/role`, {
      role_id: roleId,
    });

    // Safety Check: Did backend return the OLD Role ID?
    const returnedRoleId =
      response.data.user?.role_id || response.data.data?.role_id;
    if (returnedRoleId && returnedRoleId !== roleId) {
      console.warn(
        `[API WARNING] Backend returned OLD Role ID! Requested: ${roleId}, Got: ${returnedRoleId}`,
      );
      throw new Error(
        "Backend refused role update (User might need to be Active first?)",
      );
    }

    return response;
  } catch (error: any) {
    console.error(`[API ERROR] Role update failed!`);
    throw error;
  }
}

/**
 * Server action to update an existing user (Edit Profile)
 */
export async function updateUser(
  data: UpdateUserData,
  tenantId?: string,
): Promise<Response<any | null>> {
  try {
    // 1. Update Role First
    if (data.role) {
      await updateUserRole(data.id, data.role);
    }

    // 2. Update Status Second
    if (data.status) {
      await updateUserStatus(data.id, data.status);
    }

    revalidatePath("/config");
    revalidatePath(`/users/${data.id}`);
    revalidatePath(`/users/${data.id}/edit`);

    return {
      success: true,
      data: null,
      message: "User updated successfully",
    };
  } catch (error) {
    console.error("[updateUser] ❌ Critical Error:", error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Failed to update user",
    };
  }
}

/**
 * Server action to deactivate a user
 */
export async function deactivateUser(
  userId: string,
  tenantId?: string,
): Promise<Response<any | null>> {
  try {
    const response = await updateUserStatus(userId, "inactive"); // or "suspended"

    revalidatePath("/user");

    return {
      success: true,
      data: response.data,
      message: "User deactivated successfully",
    };
  } catch (error) {
    console.error("[deactivateUser] ❌ Error:", error);
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : "Failed to deactivate user",
    };
  }
}

/**
 * Server action to ACTIVATE a user
 */
export async function activateUser(
  userId: string,
  tenantId?: string,
): Promise<Response<any | null>> {
  try {
    const response = await updateUserStatus(userId, "active");

    revalidatePath("/user");

    return {
      success: true,
      data: response.data,
      message: "User activated successfully",
    };
  } catch (error) {
    console.error("[activateUser] ❌ Error:", error);
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : "Failed to activate user",
    };
  }
}

/**
 * Server action to LOGOUT
 */

export async function logoutUser(): Promise<Response<null>> {
  try {
    const session = await auth();
    let apiSuccess = false;
    let hadValidSession = false;

    if (session?.accessToken && session?.refreshToken) {
      hadValidSession = true;
      
      try {
        const axios = createServerAxios(
          session.accessToken as string,
          (session.user?.tenant_id as string),
          session?.user?.user_type,
        );

        await axios.post(
          "/api/v1/auth/logout",
          {
            refresh_token: session.refreshToken as string,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        apiSuccess = true;
      } catch (apiError) {
        console.error("Logout API error:", apiError);
        return {
          success: false,
          data: null,
          message: "Logout failed due to network/server error",
        };
      }
    }

    // Only clear cookies if we had a valid session AND API succeeded
    // OR if we didn't have a valid session (already logged out client-side)
    if ((hadValidSession && apiSuccess) || !hadValidSession) {
      await clearCookies();
      return {
        success: true,
        data: null,
        message: "logout_success",
      };
    } else {
      return {
        success: false,
        data: null,
        message: "Failed to logout from server",
      };
    }
  } catch (error) {
    console.error("Error during logout:", error);   
    return {
      success: false,
      data: null,
      message: "Failed to logout",
    };
  }
}
async function clearCookies(): Promise<void> {
  const cookieStore = await cookies();
  const cookiesToClear = [
    'accessToken', 'refreshToken', 'reset_password_email',
    '__next_hmr_refresh_hash__', 'X-Tenant-ID', 'X-User-ID', 'X-User-Type'
  ];
  
  cookiesToClear.forEach(cookie => cookieStore.delete(cookie));
}