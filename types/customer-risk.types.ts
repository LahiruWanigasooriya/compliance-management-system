// Customer Risk Types - Extended types for Customer Risk Dashboard

export type RiskCategory = 'Critical' | 'High' | 'Medium' | 'Low';
export type EntityType = 'Individual' | 'Corporate' | 'Joint Account' | 'Minor';
export type CustomerStatus = 'Active' | 'Dormant' | 'Deactive' | 'Suspended';
export type LocationCompliance = 'Compliant' | 'Non-Compliant' | 'Unknown';
export type KYCStatus =
  | 'Complete'
  | 'Incomplete'
  | 'Under Review'
  | 'Pending'
  | 'Expired';
export type ScreeningStatus =
  | 'Clear'
  | 'Potential Match'
  | 'True Positive'
  | 'False Positive';
export type CaseStatus =
  | 'Active'
  | 'Under Review'
  | 'Blocked'
  | 'Resolved'
  | 'Resolved: False Positive';
export type AlertCategory =
  | 'Watchlist Screening'
  | 'Fraud'
  | 'Geolocation'
  | 'KYC Verification';

// Base customer fields shared between Individual and Corporate
export interface BaseCustomerRisk {
  id: string;
  tenantId: string;
  customerId: string;
  accountNumber: string;
  entityType: EntityType;
  customerStatus: CustomerStatus;
  customerTier: string;
  dateOfEstablishment: string;
  lastRecordedActivity: string | null;
  createdAt: string;
  updatedAt: string;

  // Contact
  primaryPhoneNumber: string;
  emailAddress: string;
  residentialAddress: string;
  countryOfResidence: string;

  // Risk Data
  riskScore: number;
  riskCategory: RiskCategory;
  previousRiskScore: number;
  previousRiskCategory: RiskCategory;
  riskLastCalculated: string | null;

  // Transaction Data
  totalTransactions: number;
  totalVolume: number;
  flaggedTransactions: number;

  // Watchlist Data
  watchlistMatches: WatchlistMatch[] | null;
  screeningStatus: ScreeningStatus;
  isPep: boolean;
  pepDetails?: PEPDetails;
  hasAdverseMedia: boolean;
  adverseMediaDetails?: AdverseMediaDetails;
  hasSanctions: boolean;
  sanctionsDetails?: SanctionsDetails;
  requiresEdd: boolean;
  eddNotes: string;
  eddDocuments?: EDDDocument[];

  // KYC Data
  kycStatus: KYCStatus;
  kycCompletionStage: number; // 0-100 percentage
  kycChecklist: KYCChecklistItem[];
  identificationType: string;
  identificationNumber: string;
  idIssuingCountry: string;
  idIssueDate: string | null;
  idExpiryDate: string | null;

  // Location Data
  location: string;
  locationCompliance: LocationCompliance;

  // Synthetic Profile Detection
  isSyntheticProfile: boolean;
  syntheticScore?: number;
  syntheticStatus?: string;
  syntheticAnomalies?: string[];
}

// Individual Customer specific fields
export interface IndividualCustomer extends BaseCustomerRisk {
  entityType: 'Individual' | 'Joint Account' | 'Minor';

  // Personal Information
  fullName: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  gender: string;

  // Employment & Income
  occupation: string;
  employerName: string;
  employmentType: 'Salaried' | 'Self-employed' | 'Unemployed';
  businessSector?: string;
  monthlyIncomeRange: string;
  sourceOfFunds: string;
  sourceOfWealth: string;

  // Guardian (for Minor type)
  guardianName?: string;
  guardianRelationship?: string;
}

// Corporate Customer specific fields
export interface CorporateCustomer extends BaseCustomerRisk {
  entityType: 'Corporate';

  // Business Information
  businessName: string;
  registrationNumber: string;
  countryOfIncorporation: string;
  dateOfIncorporation: string;
  legalForm: string; // Ltd, Partnership, NGO, Trust, etc.
  natureOfBusiness: string;
  registeredAddress: string;
  operatingAddress: string;
  taxIdVatNumber: string;
  annualTurnover: string;

  // People
  directors: Director[];
  authorizedSignatories: AuthorizedSignatory[];
  beneficialOwners?: BeneficialOwner[];

  // Account Data
  accountType: string; // Savings, Current, Loan, Investment
  accountOpeningDate: string;
  accountStatus: string;
  linkedAccounts?: string[];

  // Regulatory Reporting
  sarsFiledCount: number;
  ctrsFiledCount: number;
  mtlsFiledCount: number;
}

export type CustomerRiskProfile = IndividualCustomer | CorporateCustomer;

// Supporting Types
export interface Director {
  name: string;
  position: string;
  nationality: string;
  appointmentDate: string;
}

export interface AuthorizedSignatory {
  name: string;
  designation: string;
  signatureAuthority: string;
}

export interface BeneficialOwner {
  name: string;
  ownershipPercentage: number;
  nationality: string;
}

export interface WatchlistMatch {
  id: string;
  source: string;
  matchingField: string;
  matchScore: number;
  matchDate: string;
  status: ScreeningStatus;
}

export interface PEPDetails {
  country: string;
  source: string;
  position: string;
  relationshipType?: string;
}

export interface AdverseMediaDetails {
  source: string;
  headline: string;
  date: string;
  severity: RiskCategory;
}

export interface SanctionsDetails {
  country: string;
  source: string;
  listName: string;
  addedDate: string;
}

export interface EDDDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  downloadUrl?: string;
}

export interface KYCChecklistItem {
  id: string;
  name: string;
  completed: boolean;
  completedAt?: string;
}

// Geolocation Types
export interface GeolocationEvent {
  id: string;
  timestamp: string;

  // Location Data
  ipAddress: string;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  asn: string;
  ispOrganization: string;
  proxyType: 'VPN' | 'TOR' | 'Hosting Provider' | 'Public Proxy' | 'None';
  geolocationAccuracyRadius: number;

  // Device Data
  deviceIdentifier: string;
  deviceType: string;
  operatingSystem: string;
  browserName: string;
  browserVersion: string;
  browserFingerprint: string;

  // Risk Assessment
  riskScore: number;

  // Change Indicators
  countryChanged: boolean;
  regionChanged: boolean;
  cityChanged: boolean;
  deviceChanged: boolean;
  proxyTypeChanged: boolean;
  riskScoreIncreased: boolean;
}

export interface GeolocationSummary {
  complianceScore: number;
  recentAddresses: string[];
  recentIps: string[];
  recentDeviceUuids: string[];
  anonymizerAttempts: AnonymizerAttempt[];
}

export interface AnonymizerAttempt {
  id: string;
  timestamp: string;
  type: string;
  ipAddress: string;
  blocked: boolean;
}

// Alert & Case Types
export interface CustomerAlert {
  id: string;
  customerId: string;
  category: AlertCategory;
  title: string;
  description: string;
  severity: RiskCategory;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface AlertCategorySummary {
  category: AlertCategory;
  totalCount: number;
  activeCount: number;
  underReviewCount: number;
  resolvedCount: number;
}

// Dashboard Overview Types
export interface CustomerRiskOverview {
  totalCustomers: number;
  totalRiskAssociated: number;
  criticalRisk: number;
  criticalRiskTrend: number; // +/- change
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  pepAccounts: number;
  averageRiskScore: number;
}

export interface RiskDistribution {
  category: RiskCategory;
  count: number;
  percentage: number;
}

// Filter Types
export interface CustomerRiskFilters {
  riskLevel: RiskCategory | 'all';
  entityType: EntityType | 'all';
  locationCompliance: LocationCompliance | 'all';
  country: string | 'all';
  customerStatus: CustomerStatus | 'all';
  timeRange: '1h' | '24h' | '7d' | '30d' | '90d';
  searchTerm: string;
}

// Pagination Types
export interface PaginatedCustomerResponse {
  customers: CustomerRiskProfile[];
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
}

// Export Types
export interface CustomerExportOptions {
  format: 'pdf' | 'csv' | 'json';
  includeAlerts: boolean;
  includeCases: boolean;
  includeGeolocation: boolean;
  includeTransactionHistory: boolean;
}

// API Profile Response Type (snake_case from backend)
export interface RiskDashboardProfileAPI {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  customer_id: string;
  account_number: string;
  entity_type: string;
  customer_status: string;
  customer_tier: string;
  date_of_establishment: string;
  full_name: string;
  date_of_birth: string;
  primary_phone_number: string;
  email_address: string;
  residential_address: string;
  country_of_residence: string;
  total_transactions: number;
  total_volume: number;
  flagged_transactions: number;
  risk_score: number;
  risk_category: string;
  previous_risk_score: number;
  previous_risk_category: string;
  watchlist_matches: any;
  screening_status: string;
  is_pep: boolean;
  has_adverse_media: boolean;
  has_sanctions: boolean;
  requires_edd: boolean;
  edd_notes: string;
  kyc_status: string;
  identification_type: string;
  identification_number: string;
  id_issuing_country: string;
  location: string;
  location_compliance: string;
  is_synthetic: boolean;
  synthetic_score: number;
  synthetic_flags: any;
  synthetic_status: string;
}

// Simple Customer display type for table views
export interface Customer {
  id: string;
  customer_id: string;
  customerName: string;
  accountNumber: string;
  riskScore: number;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  customerType: string;
  customerStatus: string; // Active, Dormant, Deactive, Suspended
  jurisdiction: string;
  accountAge: string;
  createdAt: string; // Actual creation date
  transactionCount: number;
  transactionVolume: string;
  flaggedTransactions: number;
  kycStatus: string;
  lastActivity: string;
  pep: boolean;
  sanctioned: boolean;
  adverseMedia: boolean;
  watchlistMatches: number; // Count of watchlist matches
  isSynthetic?: boolean;
  syntheticScore?: number;
}

// API Response Types
export interface RiskDistributionItem {
  category: string;
  count: number;
  percentage: number;
}

export interface SyntheticDistributionItem {
  status: string;
  count: number;
  percentage: number;
}

export interface TrendIndicators {
  criticalTrend: string;
  criticalChange: number;
  highTrend: string;
  highChange: number;
}

export interface RiskMetrics {
  totalActiveProfiles: number;
  totalRiskyProfiles: number;
  totalCriticalProfiles: number;
  totalHighProfiles: number;
  totalMediumProfiles: number;
  totalLowProfiles: number;
  totalPepProfiles: number;
  averageRiskScore: number;
  totalSyntheticProfiles: number;
  totalConfirmedSynthetic: number;
  totalPendingReview: number;
  averageSyntheticScore: number;
  riskDistribution: RiskDistributionItem[] | null;
  syntheticDistribution: SyntheticDistributionItem[] | null;
  trendIndicators: TrendIndicators | null;
}

export interface CustomerRiskDashboardResponse {
  data: RiskMetrics;
  metadata?: {
    timestamp?: string;
    [key: string]: any;
  };
  timestamp?: string;
}

// Detailed Customer Profile Response Types (snake_case to match API)
export interface CaseSummary {
  total_cases: number;
  open_cases: number;
  pending_review_cases: number;
  in_progress_cases: number;
  resolved_cases: number;
  closed_cases: number;
  escalated_cases: number;
  sar_filed_cases: number;
  fraud_cases: number;
  kyc_cases: number;
  geo_cases: number;
  aml_cases: number;
  sar_cases: number;
  ctr_cases: number;
}

export interface AlertSummary {
  total_alerts: number;
  pending_alerts: number;
  in_progress_alerts: number;
  resolved_alerts: number;
  closed_alerts: number;
  escalated_alerts: number;
  fraud_alerts: number;
  aml_alerts: number;
  geo_alerts: number;
  kyc_alerts: number;
  critical_alerts: number;
  high_alerts: number;
  medium_alerts: number;
  low_alerts: number;
}

export interface GeolocationSummaryAPI {
  recent_locations: GeolocationHistoryAPI[];
  recent_ips?: string[];
  recent_devices: DeviceHistoryAPI[];
  anonymizer_attempts: any[];
  total_records: number;
  location_changes: number;
  country_changes: number;
  anonymizer_count: number;
  unique_countries: number;
  unique_devices: number;
}

export interface RiskFactor {
  id: string;
  factor_type: string;
  factor_name: string;
  score: number;
  weight: number;
  source_service: string;
  last_evaluated: string;
  details?: string;
}

export interface RiskHistoryItem {
  date: string;
  risk_score: number;
  risk_category: string;
}

// KYC Overview API Types
export interface KYCChecklistItemAPI {
  id: string;
  name: string;
  completed: boolean;
  completed_at?: string;
}

export interface KYCOverviewAPI {
  kyc_status: string;
  kyc_completion_stage: number;
  kyc_checklist: KYCChecklistItemAPI[];
  identification_type: string;
  identification_number: string;
  id_issuing_country: string;
  id_issue_date?: string;
  id_expiry_date?: string;
}

export interface CustomerProfileDetailResponse {
  profile: RiskDashboardProfileAPI;
  risk_factors: RiskFactor[];
  risk_history: RiskHistoryItem[];
  watchlist_alert_count: number;
  fraud_alert_count: number;
  geolocation_alert_count: number;
  kyc_alert_count: number;
  case_summary: CaseSummary;
  alert_summary: AlertSummary;
  geolocation_summary: GeolocationSummaryAPI;
  kyc_overview?: KYCOverviewAPI;
}

// EDD (Enhanced Due Diligence) Types
export type EDDRequestStatus =
  | 'pending'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export type EDDDocumentType =
  | 'source_of_wealth'
  | 'source_of_funds'
  | 'business_purpose'
  | 'bank_statement'
  | 'tax_return'
  | 'employment_proof'
  | 'address_verification'
  | 'id_verification'
  | 'other';

export type EDDPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface EDDRequest {
  id: string;
  profile_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  status: EDDRequestStatus;
  customer_id: string;
  document_type: EDDDocumentType;
  reason: string;
  description: string;
  priority: EDDPriority;
  requested_by: string;
  requested_by_name: string;
  due_date?: string;
  expires_at?: string;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  reviewed_by_name?: string;
  review_note?: string;
  rejection_reason?: string;
  linked_documents?: string;
  linked_case_id?: string;
}

export interface CreateEDDRequest {
  document_type: EDDDocumentType;
  reason?: string;
  description?: string;
  priority?: EDDPriority;
  due_date?: string;
  linked_case_id?: string;
  requested_by?: string;
  requested_by_name?: string;
}

export interface UpdateEDDRequest {
  status: EDDRequestStatus;
  review_note?: string;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_by_name?: string;
}

export interface EDDRequestFilter {
  profile_id: string;
  status?: EDDRequestStatus[];
  document_type?: EDDDocumentType[];
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface EDDRequestSummary {
  total_requests: number;
  pending_requests: number;
  submitted_requests: number;
  approved_requests: number;
  rejected_requests: number;
  expired_requests: number;
  cancelled_requests: number;
}

export interface EDDRequestListResponse {
  records: EDDRequest[];
  total: number;
  limit: number;
  offset: number;
}

// Geolocation History Types (Backend API format)
export interface GeolocationHistoryAPI {
  id: string;
  profile_id: string;
  tenant_id: string;
  created_at: string;
  ip_address: string;
  country: string;
  country_iso: string;
  city?: string;
  region?: string;
  postal_code?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  is_vpn: boolean;
  is_proxy: boolean;
  is_tor: boolean;
  is_hosting: boolean;
  is_anonymizer: boolean;
  risk_score: number;
  risk_level: string;
  is_compliant: boolean;
  is_blocked: boolean;
  event_type: string;
  device_id?: string;
  session_id?: string;
  is_location_change: boolean;
  is_country_change: boolean;
  is_device_change: boolean;
}

export interface DeviceHistoryAPI {
  id: string;
  profile_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  device_id: string;
  fingerprint?: string;
  platform: string;
  device_type?: string;
  browser?: string;
  browser_version?: string;
  os?: string;
  os_version?: string;
  user_agent?: string;
  is_trusted: boolean;
  trust_score: number;
  first_seen_at: string;
  last_seen_at: string;
  login_count: number;
  last_ip_address?: string;
  last_country?: string;
  last_city?: string;
}

export interface GeolocationHistoryFilter {
  profile_id: string;
  start_date?: string;
  end_date?: string;
  date_preset?: string;
  event_type?: string[];
  risk_level?: string[];
  country_iso?: string;
  is_anonymizer?: boolean;
  limit?: number;
  offset?: number;
}

export interface GeolocationHistoryResponse {
  records: GeolocationHistoryAPI[];
  total: number;
  limit: number;
  offset: number;
}

// Alert History Types (Backend API format)
export interface AlertHistoryAPI {
  id: string;
  profile_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  alert_id: string;
  customer_id: string;
  alert_type: string; // fraud, aml, geo, kyc, watchlist
  severity: string; // low, medium, high, critical
  status: string; // active, under_review, resolved, false_positive
  title: string;
  description: string;
  risk_score: number;
  source_service: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution?: string; // confirmed, false_positive, escalated
  notes?: string;
  linked_case_id?: string;
  metadata?: string; // JSON string
}

export interface AlertHistoryFilter {
  profile_id: string;
  alert_type?: string[];
  severity?: string[];
  status?: string[];
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface AlertHistoryResponse {
  records: AlertHistoryAPI[];
  total: number;
  limit: number;
  offset: number;
}
