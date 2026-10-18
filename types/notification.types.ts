// Notification types for the frontend

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  message: string;
  channel: string;
  status: string;
  severity: NotificationSeverity;
  notification_type?: string;
  is_read: boolean;
  read_at?: string;
  metadata?: NotificationMetadata;
  sent_at?: string;
  created_at: string;
}

export type NotificationSeverity = 'low' | 'normal' | 'high' | 'critical';

export type NotificationType =
  | 'alert_assigned'
  | 'case_assigned'
  | 'kyc_status_updated'
  | 'aml_alert_created'
  | 'geolocation_risk_detected'
  | 'fraud_alert_created'
  | 'mfa_verification'
  | 'location_request_created'
  | 'security_alert'
  | 'device_verification'
  | 'password_reset'
  | 'user_registration'
  | 'system_notification'
  | 'default';

export interface NotificationMetadata {
  alert_id?: string;
  alert_type?: string;
  severity?: string;
  risk_score?: number;
  ip_address?: string;
  assigned_by?: string;
  case_id?: string;
  case_title?: string;
  case_type?: string;
  priority?: string;
  verification_id?: string;
  user_id?: string;
  request_id?: string;
  [key: string]: unknown;
}

export interface NotificationsResponse {
  data: Notification[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface NotificationQueryParams {
  is_read?: boolean; // true = read, false = unread, undefined = all
  limit?: number;
  offset?: number;
}

// Valid notification types from backend
const VALID_NOTIFICATION_TYPES: NotificationType[] = [
  'alert_assigned',
  'case_assigned',
  'kyc_status_updated',
  'aml_alert_created',
  'geolocation_risk_detected',
  'fraud_alert_created',
  'mfa_verification',
  'location_request_created',
  'security_alert',
  'device_verification',
  'password_reset',
  'user_registration',
  'system_notification',
];

// Helper to extract notification type from notification_type field, metadata or title
export function getNotificationType(notification: Notification): NotificationType {
  // First check the notification_type field from backend
  if (notification.notification_type) {
    const type = notification.notification_type as NotificationType;
    if (VALID_NOTIFICATION_TYPES.includes(type)) {
      return type;
    }
  }

  // Check metadata for notification_type (persisted by backend)
  const metadataType = notification.metadata?.notification_type as string | undefined;
  if (metadataType) {
    // Map backend notification_type values to frontend types
    if (metadataType === 'password_reset' || metadataType === 'password_reset_otp' || metadataType === 'password_reset_success') {
      return 'password_reset';
    }
    if (metadataType === 'security_alert' || metadataType === 'device_verification') {
      return 'security_alert';
    }
    if (metadataType === 'user_registration' || metadataType === 'tenant_admin_invite') {
      return 'user_registration';
    }
    const mapped = metadataType as NotificationType;
    if (VALID_NOTIFICATION_TYPES.includes(mapped)) {
      return mapped;
    }
  }

  // Fallback to inferring from metadata and title
  const metadata = notification.metadata;
  const title = (notification.title || '').toLowerCase();

  if (metadata?.alert_id && (title.includes('geolocation alert') || title.includes('alert assigned'))) {
    return 'alert_assigned';
  }
  if (metadata?.case_id && title.includes('case')) {
    return 'case_assigned';
  }
  if (title.includes('kyc') || metadata?.verification_id) {
    return 'kyc_status_updated';
  }
  if (title.includes('aml')) {
    return 'aml_alert_created';
  }
  if (title.includes('geolocation risk') || title.includes('risk detected')) {
    return 'geolocation_risk_detected';
  }
  if (title.includes('fraud')) {
    return 'fraud_alert_created';
  }
  if (title.includes('mfa') || title.includes('verification')) {
    return 'mfa_verification';
  }
  if (title.includes('location request') || metadata?.request_id) {
    return 'location_request_created';
  }

  // Title-based fallbacks for system notification types
  if (title.includes('security') || title.includes('new device')) {
    return 'security_alert';
  }
  if (title.includes('password')) {
    return 'password_reset';
  }
  if (title.includes('welcome') || title.includes('registration')) {
    return 'user_registration';
  }

  return 'default';
}
