"use server";

import { Response } from "@/types/response.types";
import {
  Notification,
  NotificationsResponse,
  NotificationQueryParams,
  UnreadCountResponse,
} from "@/types/notification.types";
import { auth, createServerAxios } from "@/utils/axios_server";
import { USER_TYPES } from "@/constants/application";

/**
 * Fetch notifications for the current user
 */
export async function getNotifications(
  params?: NotificationQueryParams
): Promise<Response<NotificationsResponse>> {
  try {
    const session = await auth();
    const isSystem = session?.user?.user_type === USER_TYPES.SYSTEM;
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      isSystem ? "" : (session?.user?.tenant_id as string),
      session?.user?.user_type,
      session?.user?.id || undefined
    );

    const response = await axiosInstance.get("/api/v1/notifications", {
      params: {
        limit: params?.limit || 20,
        offset: params?.offset || 0,
        is_read: params?.is_read !== undefined ? String(params.is_read) : undefined,
      },
    });

    return {
      success: true,
      data: response.data,
      message: "Notifications fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return {
      success: false,
      data: { data: [], pagination: { total: 0, limit: 20, offset: 0 } },
      message:
        error instanceof Error ? error.message : "Failed to fetch notifications",
    };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<Response<UnreadCountResponse>> {
  try {
    const session = await auth();
    const isSystem = session?.user?.user_type === USER_TYPES.SYSTEM;
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      isSystem ? "" : (session?.user?.tenant_id as string),
      session?.user?.user_type,
      session?.user?.id || undefined
    );

    const response = await axiosInstance.get("/api/v1/notifications/unread-count");

    return {
      success: true,
      data: response.data,
      message: "Unread count fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return {
      success: false,
      data: { unread_count: 0 },
      message:
        error instanceof Error ? error.message : "Failed to fetch unread count",
    };
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<Response<Notification>> {
  try {
    const session = await auth();
    const isSystem = session?.user?.user_type === USER_TYPES.SYSTEM;
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      isSystem ? "" : (session?.user?.tenant_id as string),
      session?.user?.user_type,
      session?.user?.id || undefined
    );

    const response = await axiosInstance.put(
      `/api/v1/notifications/${notificationId}/read`
    );

    return {
      success: true,
      data: response.data,
      message: "Notification marked as read",
    };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return {
      success: false,
      data: {} as Notification,
      message:
        error instanceof Error
          ? error.message
          : "Failed to mark notification as read",
    };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<Response<{ count: number }>> {
  try {
    const session = await auth();
    const isSystem = session?.user?.user_type === USER_TYPES.SYSTEM;
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      isSystem ? "" : (session?.user?.tenant_id as string),
      session?.user?.user_type,
      session?.user?.id || undefined
    );

    const response = await axiosInstance.put("/api/v1/notifications/read-all");

    return {
      success: true,
      data: response.data,
      message: "All notifications marked as read",
    };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return {
      success: false,
      data: { count: 0 },
      message:
        error instanceof Error
          ? error.message
          : "Failed to mark all notifications as read",
    };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string
): Promise<Response<void>> {
  try {
    const session = await auth();
    const isSystem = session?.user?.user_type === USER_TYPES.SYSTEM;
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      isSystem ? "" : (session?.user?.tenant_id as string),
      session?.user?.user_type,
      session?.user?.id || undefined
    );

    await axiosInstance.delete(`/api/v1/notifications/${notificationId}`);

    return {
      success: true,
      data: undefined,
      message: "Notification deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return {
      success: false,
      data: undefined,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete notification",
    };
  }
}
