export interface AssigneeDetails {
  id: string;
  email?: string;
  full_name?: string;
  role_name?: string;
}

export interface GeoAlert {
  id: string;
  tenant_id: string;
  user_id: string;
  customer_name?: string;
  risk_profile_id?: string;
  alert_type: string;
  severity: string;
  status: string;
  ip_address: string;
  location: string;
  geolocation_record_id: string;
  risk_score: number;
  risk_factors: string;
  assignee?: AssigneeDetails;
  jurisdiction?: string;
  notes?: string;
  resolution?: string;
  created_at: string;
  updated_at: string;
}

export interface GeoLog {
  id: string;
  tenant_id: string;
  user_id: string;
  performed_by: string;
  action: string;
  resource: string;
  resource_id: string;
  severity: string;
  description: string;
  created_at: string;
  ipAddress?: string;
  location?: string;
  metaData?: string;
}

export interface GeoLocationRecord {
  id: string;
  tenant_id: string;
  user_id: string;
  ip_address: string;
  country: string;
  country_iso: string;
  latitude: string;
  longitude: string;
  timezone: string;
  is_vpn: boolean,
  is_proxy: boolean,
  is_tor: boolean,
  is_hosting?: boolean,
  is_anonymizer?: boolean,
  risk_score: number,
  risk_level: string,
  provider: string,
  provider_response: string;
  created_at: string;
  event_type: string;
  device_id?: string;
  user_agent?: string;
}

export type ComplianceStatus = 'allowed' | 'restricted' | 'blocked' | 'sanctioned';

export interface GeoJurisdiction {
  id: string;
  tenant_id: string;
  country_name: string;
  country_iso: string;
  status: ComplianceStatus;
  risk_level: string;
  requires_kyc: boolean;
  requires_edd: boolean;
  allow_login: boolean;
  allow_transactions: boolean;
  allow_registration: boolean;
  notes?: string;
  regulatory_body?: string;
  created_at: string;
  updated_at: string;
}

export interface AlertSeverity {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface AlertTypes {
  anonymization_detected: number,
  anonymization_tool_detected: number,
  geofence_violation: number,
  high_risk_country: number,
  high_risk_login: number,
  impossible_travel: number,
  location_change_alert: number,
  location_spoofing: number,
  proxy_detected: number,
  sanctioned_region: number,
  tor_detected: number,
  vpn_detected: number,
}

export interface AlertStatusTypes {
  closed: number;
  escalated: number;
  in_progress: number;
  pending: number;
  resolved: number;
}
export interface GeoAlertMetrics {
  TotalAlerts: number;
  ActiveAlerts: number;
  CriticalAlerts: number;
  BlockedTransactions: number;
  HighRiskLogins: number;
  VPNDetections: number;
  ImpossibleTravel: number;
  AlertsBySeverity: AlertSeverity;
  AlertsByType: AlertTypes;
  AlertsByStatus: AlertStatusTypes;
  RecentAlerts: GeoAlert[];
}

export interface GeoAlertsResponse {
  alerts: GeoAlert[];
  limit: number;
  page: number;
  total: number;
}

export interface GeoRecordsResponse {
  points: GeoLocationRecord[];
  total: number;
  count: number;
}

export interface GeoAlertUpdateResponse {
  message: string;
}

export interface GeoLogsResponse {
  logs: GeoLog[];
  limit: number;
  page: number;
  total: number;
}

export interface GeoJurisdictionsResponse {
  jurisdictions: GeoJurisdiction[];
  total: number;
}

export interface GetGeoParams {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
  severity?: string;
  date_from?: string;
  date_to?: string;
  jurisdiction_category?: string;
  is_vpn?: boolean;
  is_tor?: boolean;
  is_proxy?: boolean;
  user_id?: string;
  assigned_to?: string;
  resource?: string;
  performed_by?: string;
  severities?: string;
  statuses?: string;
  jurisdiction_categories?: string;
  assigned_to_list?: string;
}

export type AlertAction = "close" | "escalate" | "resolve" | "pending" | "in_progress";

export interface ActionOption {
  id: AlertAction;
  value: AlertAction;
  label: string;
  dropdownValue: string;
}

export interface GeoAlertNotes {
  reason?: string;
  resolution?: string;
  assignee?: string;
}

// Location Request Types
export type LocationRequestStatus = 'pending' | 'sent' | 'completed' | 'expired' | 'cancelled' | 'failed';
export type LocationRequestChannel = 'sms' | 'email' | 'push';

export interface LocationRequest {
  id: string;
  tenant_id: string;
  user_id: string;
  requested_by: string;
  channel: LocationRequestChannel;
  status: LocationRequestStatus;
  reason?: string;
  token_expires_at: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  country?: string;
  country_iso?: string;
  city?: string;
  region?: string;
  formatted_address?: string;
  position_source?: string;
  device_info?: string;
  ip_address?: string;
  user_agent?: string;
  notification_sent_at?: string;
  responded_at?: string;
  viewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLocationRequestInput {
  user_id: string;
  channel: LocationRequestChannel;
  reason?: string;
  email?: string;
  phone?: string;
  expiry_hours?: number;
}

export interface CreateLocationRequestResponse {
  request: LocationRequest;
  share_link: string;
  token_expiry: string;
}

export interface LocationRequestListResponse {
  requests: LocationRequest[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface LocationRequestFilters {
  user_id?: string;
  requested_by?: string;
  status?: LocationRequestStatus;
  channel?: LocationRequestChannel;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// Geofence Rules Types
// ============================================================================

export type GeofenceRuleType = 'allow_list' | 'block_list' | 'risk_threshold';
export type GeofenceAction = 'block' | 'alert' | 'flag' | 'step_up_auth';
export type GeofenceAlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type GeofenceAppliesTo = 'all' | 'login' | 'registration' | 'transaction';

export interface GeofenceRule {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  rule_type: GeofenceRuleType;
  priority: number;
  is_active: boolean;

  // Country/Region filters
  allowed_countries?: string;
  blocked_countries?: string;
  allowed_regions?: string;
  blocked_regions?: string;

  // Anonymizer detection
  block_vpn: boolean;
  block_proxy: boolean;
  block_tor: boolean;
  block_hosting: boolean;

  // Risk threshold
  min_risk_threshold: number;

  // Action configuration
  action: GeofenceAction;
  alert_severity?: GeofenceAlertSeverity;

  // Scope
  applies_to?: GeofenceAppliesTo;
  user_segments?: string;

  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGeofenceRuleInput {
  name: string;
  description?: string;
  rule_type: GeofenceRuleType;
  priority: number;
  is_active?: boolean;

  allowed_countries?: string[];
  blocked_countries?: string[];
  allowed_regions?: string[];
  blocked_regions?: string[];

  block_vpn?: boolean;
  block_proxy?: boolean;
  block_tor?: boolean;
  block_hosting?: boolean;

  min_risk_threshold?: number;

  action: GeofenceAction;
  alert_severity?: GeofenceAlertSeverity;

  applies_to?: GeofenceAppliesTo;
  user_segments?: string[];
}

export interface UpdateGeofenceRuleInput {
  name?: string;
  description?: string;
  rule_type?: GeofenceRuleType;
  priority?: number;
  is_active?: boolean;

  allowed_countries?: string[];
  blocked_countries?: string[];
  allowed_regions?: string[];
  blocked_regions?: string[];

  block_vpn?: boolean;
  block_proxy?: boolean;
  block_tor?: boolean;
  block_hosting?: boolean;

  min_risk_threshold?: number;

  action?: GeofenceAction;
  alert_severity?: GeofenceAlertSeverity;

  applies_to?: GeofenceAppliesTo;
  user_segments?: string[];
}

export interface GeofenceRulesResponse {
  rules: GeofenceRule[];
  total: number;
}

export interface TestGeofenceRuleInput {
  ip_address: string;
  event_type?: string;
}

export interface TestGeofenceRuleResponse {
  rule: GeofenceRule;
  ip_address: string;
  location: {
    country: string;
    country_iso: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    is_vpn?: boolean;
    is_proxy?: boolean;
    is_tor?: boolean;
    is_hosting?: boolean;
  };
  event_type: string;
  evaluation: {
    is_blocked: boolean;
    action: string;
    block_reasons: string[];
  };
}

// ============================================================================
// Jurisdiction Config Types (for CRUD)
// ============================================================================

export interface CreateJurisdictionInput {
  country_iso: string;
  country_name: string;
  status: ComplianceStatus;
  risk_level: string;
  requires_kyc?: boolean;
  requires_edd?: boolean;
  max_transaction_amount?: number;
  allow_login?: boolean;
  allow_transactions?: boolean;
  allow_registration?: boolean;
  notes?: string;
  regulatory_body?: string;
}

export interface UpdateJurisdictionInput {
  status?: ComplianceStatus;
  risk_level?: string;
  requires_kyc?: boolean;
  requires_edd?: boolean;
  max_transaction_amount?: number;
  allow_login?: boolean;
  allow_transactions?: boolean;
  allow_registration?: boolean;
  notes?: string;
  regulatory_body?: string;
}

// ============================================================================
// Sanctions Types
// ============================================================================

export interface SanctionedCountry {
  country_iso: string;
  country_name: string;
  sanction_sources: string[];
  programs: string[];
  sanction_level: 'comprehensive' | 'partial' | 'sectoral';
}

export interface SanctionsListResponse {
  sanctioned_countries: SanctionedCountry[];
  total_count: number;
  sources: string[];
}

export interface SanctionsScreenResponse {
  country_iso: string;
  country_name: string;
  is_sanctioned: boolean;
  sanction_sources?: string[];
  programs?: string[];
  sanction_level?: string;
  recommendations?: string[];
}

// ============================================================================
// Sanctions CRUD Types
// ============================================================================

export type SanctionLevel = 'comprehensive' | 'partial' | 'sectoral';

export interface SanctionedCountryRecord {
  id: string;
  tenant_id: string;
  country_iso: string;
  country_name: string;
  sanction_source: string;
  sanction_level: SanctionLevel;
  programs?: string;
  description?: string;
  effective_date?: string;
  expiry_date?: string;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SanctionedCountriesResponse {
  sanctions: SanctionedCountryRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateSanctionInput {
  country_iso: string;
  country_name: string;
  sanction_source: string;
  sanction_level: SanctionLevel;
  programs?: string[];
  description?: string;
  effective_date?: string;
  expiry_date?: string;
  is_active?: boolean;
}

export interface UpdateSanctionInput {
  country_name?: string;
  sanction_source?: string;
  sanction_level?: SanctionLevel;
  programs?: string[];
  description?: string;
  effective_date?: string;
  expiry_date?: string;
  is_active?: boolean;
}