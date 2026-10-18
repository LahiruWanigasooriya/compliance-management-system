import {
  Bell,
  MapPin,
  Briefcase,
  Shield,
  AlertTriangle,
  UserCheck,
  Navigation,
  ShieldAlert,
  CheckCircle,
  KeyRound,
  UserPlus,
} from "lucide-react";
import type { NotificationType, NotificationMetadata } from "@/types/notification.types";

// --- Icon / colour config shared by dropdown, toast, and full page ---

export interface NotificationTypeConfig {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
}

export const NOTIFICATION_CONFIG: Record<NotificationType, NotificationTypeConfig> = {
  alert_assigned: {
    icon: MapPin,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    label: "Alert Assigned",
  },
  case_assigned: {
    icon: Briefcase,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    label: "Case Assigned",
  },
  kyc_status_updated: {
    icon: UserCheck,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    label: "KYC Updated",
  },
  aml_alert_created: {
    icon: Shield,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    label: "AML Alert",
  },
  geolocation_risk_detected: {
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    label: "Risk Detected",
  },
  fraud_alert_created: {
    icon: ShieldAlert,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    label: "Fraud Alert",
  },
  mfa_verification: {
    icon: CheckCircle,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    label: "MFA Verification",
  },
  location_request_created: {
    icon: Navigation,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
    label: "Location Request",
  },
  security_alert: {
    icon: ShieldAlert,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    label: "Security Alert",
  },
  device_verification: {
    icon: Shield,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    label: "Device Verification",
  },
  password_reset: {
    icon: KeyRound,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    label: "Password Reset",
  },
  user_registration: {
    icon: UserPlus,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    label: "Registration",
  },
  system_notification: {
    icon: Bell,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    label: "System",
  },
  default: {
    icon: Bell,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    label: "Notification",
  },
};

// --- Severity styles ---

export interface SeverityStyle {
  border: string;
  badge: string;
  text: string;
}

export const SEVERITY_STYLES: Record<string, SeverityStyle> = {
  critical: {
    border: "border-l-red-500",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    text: "Critical",
  },
  high: {
    border: "border-l-orange-500",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    text: "High",
  },
  normal: {
    border: "border-l-blue-500",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    text: "Normal",
  },
  low: {
    border: "border-l-gray-400",
    badge: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    text: "Low",
  },
};

// --- Navigation helpers ---

/** Notification types that are system-level (not tied to a specific tenant). */
export const SYSTEM_NOTIFICATION_TYPES: readonly NotificationType[] = [
  "security_alert",
  "device_verification",
  "password_reset",
  "user_registration",
  "system_notification",
] as const;

/** Returns true when the notification type is system-level (no tenant context needed). */
export function isSystemNotificationType(type: NotificationType): boolean {
  return (SYSTEM_NOTIFICATION_TYPES as readonly string[]).includes(type);
}

/**
 * Resolves the client-side path to navigate to when a notification is clicked.
 * Returns `null` for system-level types that should stay on the current page
 * (used by the full notifications page where no redirect is needed).
 */
export function getNotificationNavigationPath(
  type: NotificationType,
  metadata?: NotificationMetadata,
): string | null {
  switch (type) {
    case "alert_assigned":
    case "geolocation_risk_detected":
      return metadata?.alert_id
        ? `/geolocation/alerts/${metadata.alert_id}`
        : "/geolocation/alerts";
    case "case_assigned":
      return metadata?.case_id
        ? `/cases/${metadata.case_id}`
        : "/cases";
    case "kyc_status_updated":
      return "/kyc";
    case "aml_alert_created":
      return "/aml";
    case "location_request_created":
      return "/customer-risk";
    case "security_alert":
    case "device_verification":
    case "password_reset":
    case "user_registration":
    case "system_notification":
      return "/notifications";
    default:
      return "/notifications";
  }
}
