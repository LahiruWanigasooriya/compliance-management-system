"use client";
import { Suspense, useState } from "react";
import { fraudData, aiMetrics } from "../../constants/constants";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { toast } from "sonner";
import ChatBubble from "@/components/chat/ChatBubble";
import { useAuth } from "@/components/providers/auth.provider";
import { useTenant } from "@/components/providers/tenant.provider";
import TenantLoadingOverlay from "@/components/layout/TenantLoadingOverlay";
import { getTenantSettings } from "@/actions/config.actions";
import { useQuery } from "@tanstack/react-query";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/hooks/useNotifications";
import { Notification, getNotificationType } from "@/types/notification.types";
import { useRouter } from "next/navigation";
import {
  isSystemNotificationType,
  getNotificationNavigationPath,
} from "@/lib/notification.config";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isSystemUser } = useAuth();
  const { switchState, selectedTenantId, setSelectedTenantId } = useTenant();
  const router = useRouter();

  // Fetch tenant settings to check if GPT query is enabled
  const { data: settingsData } = useQuery({
    queryKey: ["tenant-settings", selectedTenantId],
    queryFn: () => getTenantSettings(selectedTenantId),
    enabled: !!selectedTenantId,
  });

  // Notification hooks
  const { data: notificationsData, isLoading: isLoadingNotifications } = useNotifications({ limit: 10 });
  const { data: unreadCountData } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  // Show overlay during all switch states except idle
  const showTenantOverlay = switchState !== "idle";

  useInactivityLogout({
    timeout: 48 * 60 * 60 * 1000, // 48 hours
    onInactive: () => {
      toast.error("Session expired due to inactivity");
    },
    enabled: true,
  });

  // Handle notification click - navigate to relevant page based on type
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }

    const type = getNotificationType(notification);

    // For system users, switch to the notification's tenant before navigating
    // to a tenant-specific page (skip for system-level notification types)
    if (
      isSystemUser &&
      !isSystemNotificationType(type) &&
      notification.tenant_id &&
      notification.tenant_id !== selectedTenantId
    ) {
      setSelectedTenantId(notification.tenant_id);
    }

    const path = getNotificationNavigationPath(type, notification.metadata) || "/notifications";
    router.push(path);
  };

  // Handle mark all as read
  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
  };

  return (
    <div className="flex w-full flex-col h-screen items-center overflow-hidden overflow-y-auto dark:bg-[#051A18]">
      {showTenantOverlay && <TenantLoadingOverlay />}
      <AppHeader
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        notifications={notificationsData?.data || []}
        unreadCount={unreadCountData?.unread_count || 0}
        isLoadingNotifications={isLoadingNotifications}
        onMarkAllRead={handleMarkAllRead}
        onNotificationClick={handleNotificationClick}
      />

      <div className="flex w-full">
        <Suspense fallback={<div className="p-4">Loading navigation...</div>}>
          <Sidebar
            sidebarOpen={sidebarOpen}
            fraudData={fraudData}
            aiMetrics={aiMetrics}
          />
        </Suspense>

        <main
          className={`min-h-screen justify-between flex flex-col ${
            sidebarOpen ? "ml-63" : "ml-19"
          } flex-1 overflow-y-auto pt-16 transition-all duration-200`}
        >
          <div className="bg-background dark:bg-[#051A18]">
            <div className="p-4 w-full max-w-[1920px] mx-auto bg-background text-gray-900 font-sans dark:bg-[#051A18] dark:text-[#e9f3ee]">
              {children}
            </div>
          </div>
        </main>
      </div>
      <ChatBubble enableGptQuery={settingsData?.enable_gpt_query ?? true} />
    </div>
  );
}
