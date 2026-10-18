import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/actions/notification.actions";
import { NotificationQueryParams } from "@/types/notification.types";

const NOTIFICATIONS_KEY = "notifications";
const UNREAD_COUNT_KEY = "notifications-unread-count";

export function useNotifications(params?: NotificationQueryParams) {
  return useQuery({
    queryKey: [NOTIFICATIONS_KEY, params],
    queryFn: async () => {
      const response = await getNotifications(params);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    refetchInterval: 15000, // Refetch every 15 seconds for better responsiveness
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchOnWindowFocus: true,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: [UNREAD_COUNT_KEY],
    queryFn: async () => {
      const response = await getUnreadCount();
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    refetchInterval: 15000, // Refetch every 15 seconds
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await markNotificationAsRead(notificationId);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await markAllNotificationsAsRead();
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
    },
  });
}
