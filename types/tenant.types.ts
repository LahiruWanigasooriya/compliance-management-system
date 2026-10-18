// Geolocation Configuration
export interface GeolocationConfig {
  provider?: "geoip2" | "minfraud" | "database";
  enableVpnCheck?: boolean;
  enableRiskScore?: boolean;
  locationShareBaseUrl?: string;
  notificationWebhookUrl?: string;
  webhookSecret?: string;
}

// AML Risk Thresholds
export interface AMLRiskThresholds {
  critical?: number;
  high?: number;
  medium?: number;
}

// AML Alert Settings
export interface AMLAlertSettings {
  createCase?: boolean;
  notifyComplianceTeam?: boolean;
  blockTransaction?: boolean;
  requireManualReview?: boolean;
  alertRecipients?: string[];
}

// AML Screening Configuration
export interface AMLConfig {
  enabled?: boolean;
  autoScreenOnboarding?: boolean;
  filters?: string[];
  countries?: string[];
  matchScore?: string;
  enableFuzzyMatch?: boolean;
  enableAliasSearch?: boolean;
  rcaSearch?: boolean;
  riskThresholds?: AMLRiskThresholds;
  alertSettings?: AMLAlertSettings;
  escalateReasons?: string[];
  resolveReasons?: string[];
  closeReasons?: string[];
  inProgressReasons?: string[];
}

// KYC Document Types
export type KYCDocumentType =
  | "ID_CARD"
  | "PASSPORT"
  | "DRIVING_LICENSE"
  | "RESIDENCE_PERMIT"
  | "UTILITY_BILL"
  | "BANK_STATEMENT";

// KYC Verification Configuration
export interface KYCConfig {
  isDocumentVerificationRequired?: boolean;
  isFaceVerificationRequired?: boolean;
  isAddressVerificationRequired?: boolean;
  isAgeVerificationRequired?: boolean;
  minAge?: number;
  maxAge?: number;
  requiredDocumentCount?: number;
  criticalRiskScore?: number;
  highRiskScore?: number;
  mediumRiskScore?: number;
  supportedDocumentTypes?: KYCDocumentType[];
  callbackUrl?: string;
}

export interface TenantSettings {
  // Security Settings
  enableMfa?: boolean;
  maxLoginAttempts?: number;
  accountLockoutDuration?: number;

  // Session Settings
  sessionTimeout?: number;
  accessTokenTtl?: number;
  refreshTokenTtl?: number;

  // Password Policy
  passwordMinLength?: number;
  passwordRequireUpper?: boolean;
  passwordRequireLower?: boolean;
  passwordRequireNumber?: boolean;
  passwordRequireSpecial?: boolean;
  passwordExpiryDays?: number;

  // Compliance & Audit
  auditLogRetentionDays?: number;
  dataRetentionDays?: number;

  // Feature Flags
  enableGeolocation?: boolean;
  enableFraudDetection?: boolean;
  enableAmlScreening?: boolean;
  enableKycVerification?: boolean;
  enableGptQuery?: boolean;

  // Notification Settings
  enableEmailNotifications?: boolean;
  enableSmsNotifications?: boolean;

  // Rate Limiting
  apiRateLimitPerMinute?: number;

  // Nested Configurations
  geolocationConfig?: GeolocationConfig;
  amlSettings?: AMLConfig;
  kycConfig?: KYCConfig;
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  url?: string;
  industry?: string;
  plan: "starter" | "professional" | "enterprise";
  status: "active" | "suspended" | "inactive";
  apiKey?: string;
  settings?: TenantSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTenantData {
  name: string;
  subdomain: string;
  industry?: string;
  plan?: "starter" | "professional" | "enterprise";
  adminEmail: string;
}

export interface UpdateTenantData {
  id: string;
  name?: string;
  industry?: string;
  plan?: "starter" | "professional" | "enterprise";
  status?: "active" | "suspended" | "inactive";
}

export interface GetTenantsParams {
  page?: number;
  limit?: number;
}

export interface TenantStats {
  totalUsers: number;
  activeUsers: number;
  apiCallsToday: number;
  apiCallsMonth: number;
  lastActivity?: string;
}

// AML Filter options available in the system
export const AML_FILTER_OPTIONS = [
  { value: "sanction", label: "Sanctions" },
  { value: "warning", label: "Warnings" },
  { value: "fitness-probity", label: "Fitness & Probity" },
  { value: "pep", label: "PEP (All)" },
  { value: "pep-class-1", label: "PEP Class 1" },
  { value: "pep-class-2", label: "PEP Class 2" },
  { value: "pep-class-3", label: "PEP Class 3" },
  { value: "pep-class-4", label: "PEP Class 4" },
  { value: "adverse-media", label: "Adverse Media (All)" },
  { value: "adverse-media-terrorism", label: "Adverse Media - Terrorism" },
  { value: "adverse-media-general", label: "Adverse Media - General" },
  { value: "adverse-media-narcotics", label: "Adverse Media - Narcotics" },
  { value: "adverse-media-fraud", label: "Adverse Media - Fraud" },
  { value: "adverse-media-financial-crime", label: "Adverse Media - Financial Crime" },
];

// Common countries for AML screening
export const AML_COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "SG", label: "Singapore" },
  { value: "HK", label: "Hong Kong" },
  { value: "JP", label: "Japan" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "CH", label: "Switzerland" },
  { value: "NL", label: "Netherlands" },
  { value: "IE", label: "Ireland" },
  { value: "LU", label: "Luxembourg" },
];

// KYC Document Type Options
export const KYC_DOCUMENT_OPTIONS: { value: KYCDocumentType; label: string }[] = [
  { value: "ID_CARD", label: "ID Card" },
  { value: "PASSPORT", label: "Passport" },
  { value: "DRIVING_LICENSE", label: "Driving License" },
  { value: "RESIDENCE_PERMIT", label: "Residence Permit" },
  { value: "UTILITY_BILL", label: "Utility Bill" },
  { value: "BANK_STATEMENT", label: "Bank Statement" },
];
