//////////////////////////////////////////////////////////////////////////////////////////////// Organization and Tenant types

export interface OrganizationProfile {
  name: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  address: string;
}

export interface BrandingSettings {
  logoUrl: string | null; // Use string for preview URL
  primaryColor: string;
  secondaryColor: string;
}

export interface LocalizationSettings {
  timezone: string;
  region: string;
  language: string;
  dateFormat: string;
}

export interface OrganizationSettings {
  profile: OrganizationProfile;
  branding: BrandingSettings;
  localization: LocalizationSettings;
}

export interface SelectOption {
  label: string;
  value: string;
}

//////////////////////////////////////////////////////////////////////////////////////////////// Compliance and Policy Configuration types


export type RuleStatus = 'ACTIVE' | 'PAUSED';
export type RuleCategory = 'FRAUD' | 'SECURITY' | 'TRANSACTION' | 'REGULATORY';
export type AlertOutcome = 'FLAGGED' | 'BLOCKED' | 'REVIEW';
export type DataType = 'AUDIT_LOGS' | 'TRANSACTIONS' | 'USER_DATA' | 'COMPLIANCE_RECORDS';

export interface ComplianceRule {
  id: string;
  name: string;
  status: RuleStatus;
  category: RuleCategory;
  threshold: number;
  alertCount: number;
  lastTriggered: string; // ISO Date String
}

export interface AlertHistory {
  id: string;
  ruleId: string;
  timestamp: string;
  transactionId: string;
  outcome: AlertOutcome;
  details: string;
}

export interface RetentionPolicy {
  id: string;
  dataType: DataType;
  retentionPeriodDays: number;
  regulatoryMinimumDays: number;
  lastUpdated: string; // ISO Date String
}


//////////////////////////////////////////////////////////////////////////////////////////////// Alert and Notifications Types

export type NotificationFrequency = 'immediate' | 'daily' | 'weekly';

export type ChannelType = 'email' | 'sms' | 'in_app';

export interface ChannelConfig {
  id: ChannelType;
  label: string;
  enabled: boolean;
  frequency: NotificationFrequency;
}

export interface TimeWindow {
  start: string; // Format "HH:mm"
  end: string;   // Format "HH:mm"
  enabled: boolean;
}

export interface AlertSettingsState {
  channels: Record<ChannelType, ChannelConfig>;
  activeHours: TimeWindow;
  quietHours: TimeWindow;
}

//////////////////////////////////////////////////////////////////////////////////////////////// Monitoring and Audit Types

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'maintenance';

export interface SystemMetric {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  change?: number; // percentage change
  trend: 'up' | 'down' | 'neutral';
  status: HealthStatus;
}

export interface ServiceStatus {
  id: string;
  name: string;
  category: 'API' | 'Database' | 'AI Model' | 'Security';
  uptime: string;
  latency: string;
  status: HealthStatus;
}

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  source: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  resultStatus: 'success' | 'failure' | 'pending';
  details?: string;
}

export type ExportFormat = 'PDF' | 'CSV' | 'JSON';

//////////////////////////////////////////////////////////////////////////////////////////////// System Health Dashboard Types

export type ServiceType = 'API' | 'Database' | 'Security' | 'AI Model' | 'Gateway';

export type ServiceHealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

export interface SystemHealthMetrics {
  system_uptime: number;
  avg_response_time_ms: number;
  error_rate: number;
  sla_compliance: number;
  last_updated_at: string;
}

export interface ServiceHealthInfo {
  component_name: string;
  display_name: string;
  type: ServiceType;
  uptime: number;
  latency_ms: number;
  status: ServiceHealthStatus;
  last_health_check: string;
}

export interface SystemHealthDashboardData {
  metrics: SystemHealthMetrics;
  services: ServiceHealthInfo[];
  generated_at: string;
}

//////////////////////////////////////////////////////////////////////////////////////////////// Tenant Settings Types

export interface GeolocationConfig {
  provider: string;
  enable_vpn_check: boolean;
  enable_risk_score: boolean;
  location_share_base_url: string;
}

export interface RiskThresholds {
  critical: number;
  high: number;
  medium: number;
}

export interface AlertSettings {
  create_case: boolean;
  notify_compliance_team: boolean;
  block_transaction: boolean;
  require_manual_review: boolean;
  alert_recipients: string[];
}

export interface AMLScreeningConfig {
  enabled: boolean;
  auto_screen_onboarding: boolean;
  filters: string[];
  countries: string[];
  match_score: string;
  enable_fuzzy_match: boolean;
  enable_alias_search: boolean;
  rca_search: boolean;
  risk_thresholds: RiskThresholds;
  alert_settings: AlertSettings;
  escalate_reasons: string[];
  resolve_reasons: string[];
  close_reasons: string[];
  in_progress_reasons: string[];
}

export interface KYCConfig {
  is_document_verification_required: boolean;
  is_face_verification_required: boolean;
  is_address_verification_required: boolean;
  is_age_verification_required: boolean;
  min_age: number;
  max_age: number;
  required_document_count: number;
  critical_risk_score: number;
  high_risk_score: number;
  medium_risk_score: number;
}

export interface TenantSettings {
  // Security Settings
  enable_mfa: boolean;
  max_login_attempts: number;
  account_lockout_duration: number;

  // Session Settings
  session_timeout: number;
  access_token_ttl: number;
  refresh_token_ttl: number;

  // Password Policy
  password_min_length: number;
  password_require_upper: boolean;
  password_require_lower: boolean;
  password_require_number: boolean;
  password_require_special: boolean;
  password_expiry_days: number;

  // Compliance & Audit
  audit_log_retention_days: number;
  data_retention_days: number;

  // Feature Flags
  enable_geolocation: boolean;
  enable_fraud_detection: boolean;
  enable_aml_screening: boolean;
  enable_kyc_verification: boolean;
  enable_gpt_query: boolean;

  // Notification Settings
  enable_email_notifications: boolean;
  enable_sms_notifications: boolean;

  // Rate Limiting
  api_rate_limit_per_minute: number;

  // Nested Configs
  geolocation_config: GeolocationConfig;
  aml_screening_config: AMLScreeningConfig;
  kyc_config: KYCConfig;
}