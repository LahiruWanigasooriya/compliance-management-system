"use server";

// import axiosInstance from "@/utils/axios";
import type {
  ChangePasswordData,
  LoginSessionsApiResponse,
  MfaMethodsResponse,
  NotificationPreferences,
  NotificationPreferencesApiResponse,
  ProfileApiResponse,
  UpdateNotificationPreferencesData,
  UpdatePreferencesData,
  UpdateProfileData,
  UserPreferences,
} from "@/types/profile.types";
import { convertObjectKeysToCamelCase } from "@/utils/convertObjectKeysToCamelCase";
import type { Response } from "@/types/response.types";
// import { auth } from "@/auth";
import { auth, createServerAxios } from "@/utils/axios_server";
import { APPLICATION } from "@/constants/application";

/**
 * Server action to get user profile
 * Uses /api/v1/users/me for admin/system users
 */
export async function getProfile(): Promise<
  Response<ProfileApiResponse | null>
> {
  try {
    const session = await auth()

    const axiosInstance = createServerAxios(session?.accessToken as string, session?.user?.tenant_id as string, session?.user?.user_type);
    const response = await axiosInstance.get("/api/v1/users/me");

    const rawData = response.data.data ?? response.data;
    const camelCasedData = convertObjectKeysToCamelCase(rawData);

    // Map user response to ProfileApiResponse format
    const profileData: ProfileApiResponse = {
      id: camelCasedData.id || "",
      tenantId: camelCasedData.tenantId || "",
      email: camelCasedData.email || "",
      fullName: camelCasedData.fullName || "",
      phone: camelCasedData.phone || "",
      image: camelCasedData.image || "",
      roleId: camelCasedData.roleId || "",
      role: camelCasedData.role || {
        id: camelCasedData.roleId || "",
        tenantId: camelCasedData.tenantId || "",
        roleName: camelCasedData.roleName || "",
        privileges: "[]",
        createdAt: "",
        updatedAt: "",
      },
      status: camelCasedData.status || "active",
      riskLevel: camelCasedData.riskLevel || "low",
      createdAt: camelCasedData.createdAt || "",
      updatedAt: camelCasedData.updatedAt || "",
    };

    return {
      success: true,
      data: profileData,
      message: "Profile fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching profile:", error);

    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : "Failed to fetch profile",
    };
  }
}

/**
 * Server action to get MFA methods
 */
export async function getMfaMethods(): Promise<
  Response<MfaMethodsResponse | null>
> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(session?.accessToken as string, session?.user?.tenant_id as string, session?.user?.user_type);
    const response = await axiosInstance.get("/api/v1/mfa/methods");

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data ?? response.data
    );

    return {
      success: true,
      data: camelCasedData as MfaMethodsResponse,
      message: response.data?.message || "MFA methods fetched successfully",
    };
  } catch (error: any) {
    console.error("Error fetching MFA methods:", error);

    return {
      success: false,
      data: null,
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch MFA methods",
    };
  }
}

/**
 * Server action to get user login sessions
 * Uses /api/v1/users/me/sessions for all user types
 */
export async function getLoginSessions(): Promise<
  Response<LoginSessionsApiResponse | null>
> {
  try {
    const session = await auth();

    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string)
    );
    const response = await axiosInstance.get("/api/v1/auth/sessions");

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data ?? response.data
    );

    const sessionsResponse =
      camelCasedData as Partial<LoginSessionsApiResponse>;
    const sessions = Array.isArray(sessionsResponse.sessions)
      ? sessionsResponse.sessions
      : [];
    const count =
      typeof sessionsResponse.count === "number"
        ? sessionsResponse.count
        : sessions.length;

    return {
      success: true,
      data: { count, sessions },
      message: response.data?.message || "Login sessions fetched successfully",
    };
  } catch (error: any) {
    console.error("Error fetching login sessions:", error);

    // Return empty sessions on error
    return {
      success: true,
      data: { count: 0, sessions: [] },
      message: "Login sessions not available",
    };
  }
}

/**
 * Server action to get user preferences
 * Uses user-profile-service for preference management
 */
export async function getPreferences(): Promise<
  Response<UserPreferences | null>
> {
  const defaultPreferences: UserPreferences = {
    language: "en",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    numberFormat: "1,234.56",
  };

  try {
    const session = await auth();

    // For system users, don't send tenant context for user preferences
    // System users have their own user record, not in any tenant
    const isSystemUser = session?.user?.user_type === "system";
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      isSystemUser ? "" : (session?.user?.tenant_id as string),
      session?.user?.user_type
    );
    const response = await axiosInstance.get("/api/v1/users/preferences");

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data ?? response.data
    );

    return {
      success: true,
      data: camelCasedData as UserPreferences,
      message: response.data?.message || "Preferences fetched successfully",
    };
  } catch (error: any) {
    console.error("Error fetching preferences:", error);

    // Return default preferences on error
    return {
      success: true,
      data: defaultPreferences,
      message: "Using default preferences",
    };
  }
}

/**
 * Server action to update user preferences
 * Uses user-profile-service for preference management
 */
export async function updatePreferences(
  data: UpdatePreferencesData
): Promise<Response<UserPreferences | null>> {
  try {
    const session = await auth();

    // For system users, don't send tenant context for user preferences
    // System users have their own user record, not in any tenant
    const isSystemUser = session?.user?.user_type === "system";
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      isSystemUser ? "" : (session?.user?.tenant_id as string),
      session?.user?.user_type
    );
    const response = await axiosInstance.put("/api/v1/users/preferences", {
      language: data.language,
      timezone: data.timezone,
      date_format: data.dateFormat,
      number_format: data.numberFormat,
    });

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data ?? response.data
    );

    return {
      success: true,
      data: camelCasedData as UserPreferences,
      message: response.data?.message || "Preferences updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating preferences:", error);

    return {
      success: false,
      data: null,
      message:
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update preferences",
    };
  }
}

/**
 * Server action to update user profile contact number
 */
export async function updateProfile(
  data: UpdateProfileData,
  isTenantIdRequired: boolean = true
): Promise<Response<ProfileApiResponse | null>> {
  try {
    const session = await auth()

    const axiosInstance = createServerAxios(session?.accessToken as string, isTenantIdRequired ? session?.user?.tenant_id as string: "", session?.user?.user_type);
    const response = await axiosInstance.put("/api/v1/users/profile", {
      phone: data.phone,
    });

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data ?? response.data
    );

    return {
      success: true,
      data: (camelCasedData as ProfileApiResponse) ?? null,
      message: "Contact number updated successfully",
    };
  } catch (error) {
    console.error("Error updating profile:", error);

    return {
      success: false,
      data: null,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update contact number",
    };
  }
}

/**
 * Server action to upload profile image
 */
export async function uploadProfileImage(
  formData: FormData,
  isTenantIdRequired: boolean = true
): Promise<Response<{ imageUrl: string } | null>> {
  try {
    const session = await auth()

    const axiosInstance = createServerAxios(session?.accessToken as string, isTenantIdRequired ? session?.user?.tenant_id as string : "", session?.user?.user_type);
    const response = await axiosInstance.post(
      "/api/v1/users/profile/image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const imageUrl =
      response.data.data?.image_url ||
      response.data.data?.imageUrl ||
      response.data.image_url ||
      response.data.imageUrl;

    return {
      success: true,
      data: { imageUrl },
      message: "Profile picture uploaded successfully",
    };
  } catch (error: any) {
    console.error("Error uploading profile image:", error?.response?.data);

    return {
      success: false,
      data: null,
      message:
        error?.response?.data?.message || error?.response?.data?.error || 
        error?.message ||
        "Failed to upload profile picture",
    };
  }
}

/**
 * Server action to delete profile image
 */
export async function deleteProfileImage(): Promise<Response<null>> {
  try {
    const session = await auth()

    const axiosInstance = createServerAxios(session?.accessToken as string, session?.user?.tenant_id as string, session?.user?.user_type);
    await axiosInstance.delete("/api/v1/users/profile/image");

    return {
      success: true,
      data: null,
      message: "Profile picture removed successfully",
    };
  } catch (error: any) {
    console.error("Error deleting profile image:", error);

    return {
      success: false,
      data: null,
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Failed to remove profile picture",
    };
  }
}

/**
 * Server action to change user password
 * Uses /api/v1/users/me/password for all user types
 */
export async function changePassword(
  data: ChangePasswordData
): Promise<Response<null>> {
  try {
    const session = await auth();

    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      (session?.user?.tenant_id as string)
    );
    const response = await axiosInstance.put("/api/v1/users/me/password", {
      old_password: data.currentPassword,
      new_password: data.newPassword,
      confirm_password: data.confirmPassword,
    });

    return {
      success: true,
      data: null,
      message: response.data?.message || "Password changed successfully",
    };
  } catch (error: any) {
    console.error("Error changing password:", error);

    return {
      success: false,
      data: null,
      message:
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to change password",
    };
  }
}

/**
 * Server action to get notification preferences
 */
export async function getNotificationPreferences(): Promise<
  Response<NotificationPreferencesApiResponse | null>
> {
  try {
    const session = await auth()

    const axiosInstance = createServerAxios(session?.accessToken as string, session?.user?.tenant_id as string, session?.user?.user_type);
    const response = await axiosInstance.get(
      "/api/v1/notifications/preferences"
    );

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data ?? response.data
    );

    return {
      success: true,
      data: camelCasedData as NotificationPreferencesApiResponse,
      message:
        response.data?.message ||
        "Notification preferences fetched successfully",
    };
  } catch (error: any) {
    console.error("Error fetching notification preferences:", error);

    return {
      success: false,
      data: null,
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch notification preferences",
    };
  }
}

/**
 * Server action to update notification preferences
 */
export async function updateNotificationPreferences(
  data: UpdateNotificationPreferencesData
): Promise<Response<NotificationPreferences | null>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(session?.accessToken as string, session?.user?.tenant_id as string, session?.user?.user_type);
    const response = await axiosInstance.put(
      "/api/v1/notifications/preferences",
      {
        email_notifications: data.emailNotifications,
        sms_notifications: data.smsNotifications,
        in_app_notifications: data.inAppNotifications,
        notification_frequency: data.notificationFrequency,
      }
    );

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data?.preferences ??
      response.data.preferences ??
      response.data
    );

    return {
      success: true,
      data: camelCasedData as NotificationPreferences,
      message:
        response.data?.message ||
        "Notification preferences updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating notification preferences:", error);

    return {
      success: false,
      data: null,
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update notification preferences",
    };
  }
}
