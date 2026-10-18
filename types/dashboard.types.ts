// Time range options for dashboard filters
export type TimeRange =
  | 'last_hour'
  | 'last_24_hours'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days';

// Trend direction for metrics
export type TrendDirection = 'upward' | 'downward' | 'stable';

// Alert criticality levels
export type AlertCriticality = 'elevated' | 'high' | 'medium' | 'low';

// Watchlist types
export type WatchlistType =
  | 'ofac_sanctions'
  | 'eu_sanctions'
  | 'un_sanctions'
  | 'fatf_sanctions'
  | 'pep_database'
  | 'terrorist_financing'
  | 'adverse_media'
  | 'internal_watchlist';

// System status
export type SystemStatusType = 'online' | 'offline';

// Risk Overview - Overall risk score and trend
export interface RiskOverview {
  overall_risk_score: number;
  trend_direction: TrendDirection;
  trend_percentage: number;
  previous_score: number;
  last_calculated_at: string;
  risk_level: string; // low, medium, high, critical
}

// Alerts Breakdown - Pending alerts with criticality
export interface AlertsBreakdown {
  total_alerts: number;
  total_pending: number;
  by_criticality: Record<AlertCriticality, number>;
  elevated_count: number;
  high_risk_count: number;
  medium_count: number;
  low_risk_count: number;
  last_updated_at: string;
}

// Cases Metrics - Active cases with status
export interface CasesMetrics {
  total_active: number;
  escalated_cases: number;
  pending_review: number;
  in_progress: number;
  last_updated_at: string;
  sar_filed_count: number;
  sar_filed_submissions: number;
}

// Compliance Metrics - Compliance score and rate
export interface ComplianceMetrics {
  overall_score: number;
  score_trend_direction: TrendDirection;
  score_trend_percentage: number;
  compliance_rate: number;
  rate_change_vs_last_month: number;
  last_updated_at: string;
}

// KPI Metrics - Key performance indicators
export interface KPIMetrics {
  average_resolution_time_hours: number;
  false_positive_rate: number;
  total_resolved_cases: number;
  last_updated_at: string;
}

// High Risk Customer Summary
export interface HighRiskCustomerSummary {
  customer_id: string;
  customer_name: string;
  risk_status: string;
  risk_score: number;
  alert_count: number;
  last_updated_at: string;
}

// Watchlist Matches Summary
export interface WatchlistMatchesSummary {
  total_matches: number;
  by_type: Record<WatchlistType, number>;
  ofac_sanctions: number;
  eu_sanctions: number;
  un_sanctions: number;
  fatf_sanctions: number;
  pep_database: number;
  terrorist_financing: number;
  adverse_media: number;
  internal_watchlist: number;
  last_updated_at: string;
}

// Quick Stats Summary
export interface QuickStatsSummary {
  high_risk_customer_count: number;
  high_risk_customer_percentage: number;
  total_customers: number;
  watchlist_matches: number;
  kyc_updates_due: number;
  peer_analyses: number;
  last_updated_at: string;
}

// System Status Info
export interface SystemStatusInfo {
  status: SystemStatusType;
  last_checked_at: string;
}

// Case Trend Analysis
export interface CaseTrendAnalysis {
  cases_opened_this_month: number;
  cases_closed_this_month: number;
  average_closure_speed_hours: number;
  closure_rate_percentage: number;
  last_updated_at: string;
}

// Complete Compliance Risk Dashboard Response
export interface ComplianceRiskDashboard {
  tenant_id: string;
  time_range: TimeRange;
  risk_overview: RiskOverview | null;
  alerts_breakdown: AlertsBreakdown | null;
  cases_metrics: CasesMetrics | null;
  compliance_metrics: ComplianceMetrics | null;
  kpi_metrics: KPIMetrics | null;
  high_risk_customers: HighRiskCustomerSummary[];
  watchlist_matches: WatchlistMatchesSummary | null;
  quick_stats: QuickStatsSummary | null;
  system_status: SystemStatusInfo | null;
  case_trends: CaseTrendAnalysis | null;
  generated_at: string;
}

// Dashboard Export Request
export interface DashboardExportRequest {
  time_range: TimeRange;
  format: 'pdf' | 'csv' | 'json';
  sections?: string[];
}

// Dashboard Export Response
export interface DashboardExportResponse {
  export_id: string;
  tenant_id: string;
  format: string;
  status: string;
  file_path?: string;
  download_url?: string;
  created_at: string;
}

// High Risk Customers Response
export interface HighRiskCustomersResponse {
  high_risk_customers: HighRiskCustomerSummary[];
  total: number;
}

// Map frontend time range values to API time range values
export const TIME_RANGE_MAP: Record<string, TimeRange> = {
  '1h': 'last_hour',
  '24h': 'last_24_hours',
  '7d': 'last_7_days',
  '30d': 'last_30_days',
  '90d': 'last_90_days',
};
