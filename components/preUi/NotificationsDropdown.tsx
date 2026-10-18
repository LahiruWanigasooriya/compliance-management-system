"use client";

import React from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Notification,
  getNotificationType,
} from "@/types/notification.types";
import { cn } from "@/lib/utils";
import { NOTIFICATION_CONFIG, SEVERITY_STYLES } from "@/lib/notification.config";

interface NotificationsDropdownProps {
  notifications: Notification[];
  onMarkAllRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
  onViewAll?: () => void;
  isLoading?: boolean;
}

const NotificationsDropdown = ({
  notifications,
  onMarkAllRead,
  onNotificationClick,
  onViewAll,
  isLoading,
}: NotificationsDropdownProps) => {
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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
    <div className="absolute right-0 top-full mt-2 w-[400px] bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 z-50 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-primary text-white rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && onMarkAllRead && (
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Check className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Loading notifications...
          </p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            All caught up!
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[200px]">
            You have no new notifications. Check back later for updates.
          </p>
        </div>
      ) : (
        <>
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.slice(0, 8).map((notification, index) => {
              const type = getNotificationType(notification);
              const config = NOTIFICATION_CONFIG[type];
              const severityStyle =
                SEVERITY_STYLES[notification.severity] || SEVERITY_STYLES.normal;

              return (
                <div
                  key={notification.id}
                  onClick={() => onNotificationClick?.(notification)}
                  className={cn(
                    "relative px-4 py-3 cursor-pointer transition-all duration-200",
                    "hover:bg-gray-50 dark:hover:bg-slate-800/50",
                    "border-l-4",
                    severityStyle.border,
                    !notification.is_read && "bg-primary/5 dark:bg-primary/10",
                    index !== notifications.slice(0, 8).length - 1 &&
                      "border-b border-gray-100 dark:border-gray-800"
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
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <span className="flex-shrink-0 h-2.5 w-2.5 rounded-full bg-primary mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {onViewAll && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onViewAll}
                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors py-1"
              >
                View All Notifications
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NotificationsDropdown;
