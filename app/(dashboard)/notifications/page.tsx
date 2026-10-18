"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  BellOff,
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/hooks/useNotifications";
import {
  Notification,
  getNotificationType,
} from "@/types/notification.types";
import { cn } from "@/lib/utils";
import {
  NOTIFICATION_CONFIG,
  SEVERITY_STYLES,
  isSystemNotificationType,
  getNotificationNavigationPath,
} from "@/lib/notification.config";
import { deleteNotification } from "@/actions/notification.actions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth.provider";
import { useTenant } from "@/components/providers/tenant.provider";

type FilterType = "all" | "unread" | "read";

// Group notifications by date
function groupNotificationsByDate(notifications: Notification[]) {
  const groups: { label: string; notifications: Notification[] }[] = [];
  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const older: Notification[] = [];

  notifications.forEach((notification) => {
    const date = new Date(notification.created_at);
    if (isToday(date)) {
      today.push(notification);
    } else if (isYesterday(date)) {
      yesterday.push(notification);
    } else {
      older.push(notification);
    }
  });

  if (today.length > 0) groups.push({ label: "Today", notifications: today });
  if (yesterday.length > 0)
    groups.push({ label: "Yesterday", notifications: yesterday });
  if (older.length > 0) groups.push({ label: "Earlier", notifications: older });

  return groups;
}

// Helper function to check if notification is a digest
const isDigestNotification = (notification: Notification) => {
  return (
    notification.metadata?.frequency === "weekly_summary" ||
    notification.metadata?.frequency === "daily_digest"
  );
};

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isSystemUser } = useAuth();
  const { selectedTenantId, setSelectedTenantId } = useTenant();
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pageSize = 10;

  const {
    data: notificationsData,
    isLoading,
    refetch,
  } = useNotifications({
    limit: pageSize,
    offset: (page - 1) * pageSize,
    is_read: filter === "all" ? undefined : filter === "read",
  });

  const { data: unreadCountData } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = notificationsData?.data || [];
  const totalCount = notificationsData?.pagination?.total || 0;
  const unreadCount = unreadCountData?.unread_count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const groupedNotifications = groupNotificationsByDate(notifications);

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isToday(date)) {
        return formatDistanceToNow(date, { addSuffix: true });
      }
      if (isYesterday(date)) {
        return `Yesterday at ${format(date, "h:mm a")}`;
      }
      return format(date, "MMM d, yyyy 'at' h:mm a");
    } catch {
      return dateString;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleNotificationClick = (notification: Notification) => {
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

    // Navigate to the relevant page (system types resolve to /notifications,
    // which is the current page, so no navigation needed for those)
    const path = getNotificationNavigationPath(type, notification.metadata);
    if (path && path !== "/notifications") {
      router.push(path);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead.mutate(undefined, {
      onSuccess: () => {
        toast.success("All notifications marked as read");
      },
    });
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    const result = await deleteNotification(notificationId);
    if (result.success) {
      toast.success("Notification deleted");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
    } else {
      toast.error("Failed to delete notification");
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    markAsRead.mutate(notificationId, {
      onSuccess: () => {
        toast.success("Marked as read");
      },
    });
  };

  const renderNotificationIcon = (notification: Notification) => {
    const type = getNotificationType(notification);
    const config = NOTIFICATION_CONFIG[type];
    const Icon = config.icon;

    return (
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0",
          config.bgColor,
          notification.is_read && "opacity-60"
        )}
      >
        <Icon className={cn("h-5 w-5", config.color)} />
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-medium bg-primary text-white rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "disabled:opacity-50"
              )}
            >
              <RefreshCw
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
              />
              Refresh
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAllAsRead.isPending}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  "text-primary hover:bg-primary/10",
                  "disabled:opacity-50"
                )}
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Inbox className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {unreadCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Unread</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalCount - unreadCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Read</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {(
              [
                { key: "all", label: "All", icon: Inbox },
                { key: "unread", label: "Unread", icon: Bell },
                { key: "read", label: "Read", icon: CheckCircle },
              ] as const
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  setFilter(key);
                  setPage(1);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  filter === key
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {key === "unread" && unreadCount > 0 && (
                  <span
                    className={cn(
                      "ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full",
                      filter === key
                        ? "bg-primary text-white"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {totalCount > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)}{" "}
            of {totalCount}
          </span>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Loading notifications...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              {filter === "unread" ? (
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              ) : (
                <BellOff className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {filter === "unread"
                ? "All caught up!"
                : filter === "read"
                  ? "No read notifications"
                  : "No notifications yet"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[200px]">
              {filter === "unread"
                ? "You've read all your notifications."
                : filter === "read"
                  ? "Notifications you've read will appear here."
                  : "When you receive notifications, they'll show up here."}
            </p>
          </div>
        ) : (
          <>
            {groupedNotifications.map((group) => (
              <div key={group.label}>
                {/* Date Group Header */}
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      {group.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({group.notifications.length})
                    </span>
                  </div>
                </div>

                {/* Notifications in group */}
                {group.notifications.map((notification, index) => {
                  const type = getNotificationType(notification);
                  const config = NOTIFICATION_CONFIG[type];
                  const severityStyle =
                    SEVERITY_STYLES[notification.severity] ||
                    SEVERITY_STYLES.normal;
                  const isDigest = isDigestNotification(notification);
                  const cleanMessage = isDigest
                    ? notification.message
                    .replace(/---+/g, "").trim()
                    .replace(/\n\s*\n\s*\n+/g, '\n\n')
                    : notification.message;

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "relative px-4 py-3 cursor-pointer transition-all duration-200 group",
                        "hover:bg-gray-50 dark:hover:bg-slate-800/50",
                        "border-l-4",
                        severityStyle.border,
                        !notification.is_read &&
                          "bg-primary/5 dark:bg-primary/10",
                        index !== group.notifications.length - 1 &&
                          "border-b border-gray-100 dark:border-gray-800",
                        isDigest && "py-4",
                      )}
                    >
                      <div className="flex gap-3">
                        {renderNotificationIcon(notification)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                  {config.label}
                                </span>
                                {notification.severity !== "normal" &&
                                  notification.severity !== "low" && (
                                    <span
                                      className={cn(
                                        "text-[10px] font-medium px-1.5 py-0.5 rounded",
                                        severityStyle.badge
                                      )}
                                    >
                                      {severityStyle.text}
                                    </span>
                                  )}
                              </div>
                              <p
                                className={cn(
                                  "text-sm font-medium leading-snug",
                                  notification.is_read
                                    ? "text-gray-600 dark:text-gray-400"
                                    : "text-gray-900 dark:text-white"
                                )}
                              >
                                {notification.title}
                              </p>

                              {/* Message display with conditional formatting */}
                              {isDigest ? (
                                <div className="mt-0.5">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-line leading-relaxed">
                                    {cleanMessage}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                              )}

                              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                                {formatTime(notification.created_at)}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.is_read && (
                                <button
                                  onClick={(e) =>
                                    handleMarkAsRead(e, notification.id)
                                  }
                                  className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                  title="Mark as read"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDelete(e, notification.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {!notification.is_read && (
                              <span className="flex-shrink-0 h-2.5 w-2.5 rounded-full bg-primary mt-1" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

          </>
        )}
      </div>

      {/* Pagination - Always visible when there are notifications */}
      {totalCount > 0 && (
        <div className="mt-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                "text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
                "hover:bg-gray-50 dark:hover:bg-gray-800",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page
              </span>
              <div className="flex items-center gap-1">
                {totalPages <= 7 ? (
                  // Show all pages if 7 or fewer
                  Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={cn(
                        "w-8 h-8 text-sm font-medium rounded-lg transition-colors",
                        page === i + 1
                          ? "bg-primary text-white"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))
                ) : (
                  // Show truncated pagination for more pages
                  <>
                    <button
                      onClick={() => setPage(1)}
                      className={cn(
                        "w-8 h-8 text-sm font-medium rounded-lg transition-colors",
                        page === 1
                          ? "bg-primary text-white"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      1
                    </button>
                    {page > 3 && (
                      <span className="px-1 text-gray-400">...</span>
                    )}
                    {Array.from({ length: 3 }, (_, i) => {
                      const pageNum = Math.min(
                        Math.max(page - 1 + i, 2),
                        totalPages - 1
                      );
                      if (pageNum <= 1 || pageNum >= totalPages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={cn(
                            "w-8 h-8 text-sm font-medium rounded-lg transition-colors",
                            page === pageNum
                              ? "bg-primary text-white"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {page < totalPages - 2 && (
                      <span className="px-1 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => setPage(totalPages)}
                      className={cn(
                        "w-8 h-8 text-sm font-medium rounded-lg transition-colors",
                        page === totalPages
                          ? "bg-primary text-white"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                of {totalPages}
              </span>
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                "text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
                "hover:bg-gray-50 dark:hover:bg-gray-800",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
