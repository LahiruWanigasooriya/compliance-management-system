"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWebSocket, WebSocketStatus } from "@/hooks/useWebSocket";
import { useAuth } from "./auth.provider";
import {
  Notification,
  getNotificationType,
  NotificationType,
} from "@/types/notification.types";
import { Bell, X, ExternalLink } from "lucide-react";
import { APPLICATION } from "@/constants/application";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";
import { useTenant } from "./tenant.provider";
import {
  NOTIFICATION_CONFIG,
  SEVERITY_STYLES,
  isSystemNotificationType,
  getNotificationNavigationPath,
} from "@/lib/notification.config";

interface NotificationContextValue {
  wsStatus: WebSocketStatus;
  reconnect: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

// Custom notification toast component
interface NotificationToastProps {
  notification: Notification;
  type: NotificationType;
  onView: () => void;
  onDismiss: () => void;
}

function NotificationToast({ notification, type, onView, onDismiss }: NotificationToastProps) {
  const config = NOTIFICATION_CONFIG[type];
  const Icon = config.icon;
  const severityStyle = SEVERITY_STYLES[notification.severity] || SEVERITY_STYLES.normal;

  return (
    <div className="w-[380px] bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              New Notification
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        "px-4 py-3 border-l-4",
        severityStyle.border
      )}>
        <div className="flex gap-3">
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0",
              config.bgColor
            )}
          >
            <Icon className={cn("h-5 w-5", config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {config.label}
              </span>
              {notification.severity !== "normal" && notification.severity !== "low" && (
                <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", severityStyle.badge)}>
                  {severityStyle.text}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
              {notification.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
              {notification.message}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onView}
          className="w-full flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors py-1"
        >
          View Details
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isSystemUser } = useAuth();
  const { selectedTenantId } = useTenant();
  const queryClient = useQueryClient();
  const processedIds = useRef<Set<string>>(new Set());

  // Build WebSocket URL
  // - For tenant users: include tenant_id
  // - For system users: include is_system=true (they receive notifications from all tenants)
  const wsUrl = useMemo(() => {
    // Don't connect if no user logged in
    if (!user?.id) {
      return "";
    }

    // For tenant users, require tenant_id
    if (!isSystemUser && !user?.tenant_id) {
      return "";
    }

    // Get the base URL and convert to WebSocket protocol
    const baseUrl = APPLICATION.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "";
    let wsBase = baseUrl
      .replace("https://", "wss://")
      .replace("http://", "ws://");

    // Remove trailing slash if present
    if (wsBase.endsWith("/")) {
      wsBase = wsBase.slice(0, -1);
    }

    if (isSystemUser) {
      // System users connect with is_system=true to receive notifications from all tenants
      return `${wsBase}/ws?user_id=${encodeURIComponent(user.id)}&is_system=true`;
    } else {
      // Tenant users connect with their tenant_id
      return `${wsBase}/ws?tenant_id=${encodeURIComponent(
        user.tenant_id!
      )}&user_id=${encodeURIComponent(user.id)}`;
    }
  }, [user?.id, user?.tenant_id, isSystemUser]);

  // Handle incoming WebSocket message
  const handleMessage = useCallback(
    (data: unknown) => {
      // Validate that we have a proper notification object
      if (!data || typeof data !== 'object') {
        console.warn('Invalid notification data received:', data);
        return;
      }

      const notification = data as Notification;

      // Validate required fields
      if (!notification.id || !notification.title) {
        console.warn('Notification missing required fields:', notification);
        return;
      }

      // Avoid processing duplicate notifications
      if (processedIds.current.has(notification.id)) {
        return;
      }
      processedIds.current.add(notification.id);

      // Keep set size manageable
      if (processedIds.current.size > 100) {
        const ids = Array.from(processedIds.current);
        processedIds.current = new Set(ids.slice(-50));
      }

      // Invalidate notification queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });

      // Show toast notification
      const type = getNotificationType(notification);
      const navPath = getNotificationNavigationPath(type, notification.metadata) || "/notifications";

      // Show custom toast with enhanced visibility
      toast.custom(
        (t) => (
          <NotificationToast
            notification={notification}
            type={type}
            onView={() => {
              toast.dismiss(t);
              // For system users, switch tenant cookie before hard navigation
              // so the new page loads under the correct tenant context
              if (
                isSystemUser &&
                !isSystemNotificationType(type) &&
                notification.tenant_id &&
                notification.tenant_id !== selectedTenantId
              ) {
                Cookies.set("X-Tenant-ID", notification.tenant_id, { path: "/" });
              }
              window.location.href = navPath;
            }}
            onDismiss={() => toast.dismiss(t)}
          />
        ),
        {
          duration: 8000,
          position: "top-right",
        }
      );
    },
    [queryClient, isSystemUser, selectedTenantId]
  );

  // Handle WebSocket connection
  const handleOpen = useCallback(() => {
    console.log("Notification WebSocket connected");
  }, []);

  const handleClose = useCallback(() => {
    console.log("Notification WebSocket disconnected");
  }, []);

  const handleError = useCallback((error: Event) => {
    console.error("Notification WebSocket error:", error);
  }, []);

  // Connect to WebSocket
  const { status, reconnect } = useWebSocket({
    url: wsUrl,
    onMessage: handleMessage,
    onOpen: handleOpen,
    onClose: handleClose,
    onError: handleError,
    reconnectAttempts: 10,
    reconnectInterval: 5000,
    enabled: !!wsUrl,
  });

  return (
    <NotificationContext.Provider value={{ wsStatus: status, reconnect }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within NotificationProvider"
    );
  }
  return context;
}
