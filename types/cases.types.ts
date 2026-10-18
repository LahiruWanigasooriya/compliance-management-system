export type CasePriority = "critical" | "high" | "medium" | "low";
export type CaseStatus =
  | "pending_review"
  | "in_progress"
  | "escalated"
  | "closed"
  | "resolved"
  | "reopened"
  | "open"
  | "sar_filed";
export type CaseCategory =
  | "kyc"
  | "aml"
  | "fraud"
  | "other"
  | "geo"
  | "sar"
  | "ctr";
export type CaseSourceType =
  | "kyc_alert"
  | "aml_alert"
  | "fraud_alert"
  | "manual"
  | "system";
export type AlertStatus = "pending" | "escalated" | "resolved" | "dismissed";
export type WorklogType =
  | "comment_added"
  | "status_changed"
  | "priority_changed"
  | "assigned_changed"
  | "category_changed"
  | "risk_score_changed"
  | "evidence_added"
  | "spectator_added"
  | "spectator_removed"
  | "case_resolved"
  | "case_escalated";

export interface Customer {
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
  last_recorded_activity: string | null;
  full_name: string;
  date_of_birth: string | null;
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
  risk_last_calculated: string | null;
  watchlist_matches: any | null;
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
  id_issue_date: string | null;
  id_expiry_date: string | null;
  location: string;
  location_compliance: string;
}

export interface AssignedUser {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  phone: string;
  image: string;
  role_id: string;
  status: string;
  risk_level: string;
  created_at: string;
  updated_at: string;
}

export interface AlertSource {
  id: string;
  kyc_id?: string;
  tenant_id: string;
  alert_text: string;
  risk: string;
  assigned_for: string;
  reason?: string;
  status: AlertStatus;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  tenant_id: string;
  user_id: string;
  customer: Customer;
  source_type?: CaseSourceType;
  source_reference?: string;
  assigned_for: string;
  assigned_user: AssignedUser;
  spectators: Spectator[] | null;
  category: CaseCategory;
  priority: CasePriority;
  title: string;
  description: string;
  risk_category?: string;
  risk_score: number;
  status: CaseStatus;
  notes: Note[] | null;
  comments: Comment[] | null;
  evidences: Evidence[] | null;
  source?: AlertSource;
  sla_ends: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
  resolution_note?: string;
  closed_by?: string;
}

export interface CasesResponse {
  cases: Case[];
  current_page: number;
  total: number;
  total_pages: number;
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type SortField = "created_at" | "priority" | "status" | "category" | "risk_category";
export type SortOrder = "ASC" | "DESC";

export interface CaseFilters {
  status?: CaseStatus[];
  category?: CaseCategory[];
  priority?: CasePriority[];
  assigned_for?: string[];
  risk_level?: RiskLevel[];
  search?: string;
  fromDate?: string;
  toDate?: string;
  sort?: SortField;
  order_by?: SortOrder;
}

export interface CasesOverview {
  active_cases: number;
  critical_cases: number;
  sar_filed: number;
  resolution_rate: number;
  pending_in_review: number;
  in_progress: number;
  escalated: number;
  closed: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface CreateCasePayload {
  user_id: string;
  assigned_for: string;
  spectator: string[];
  category: "kyc" | "fraud" | "geo" | "aml" | "sar" | "ctr";
  priority: "low" | "medium" | "high";
  risk_category: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  // risk_score: number;
}

export interface UpdateCasePayload {
  title?: string;
  description?: string;
  priority?: CasePriority;
  category?: CaseCategory;
  assigned_for?: string;
  risk_score?: number;
  status?: CaseStatus;
}

export interface Note {
  id: string;
  author: string;
  author_user?: AssignedUser;
  case_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface Evidence {
  id: string;
  case_id: string;
  document_name?: string;
  uploaded_by: string;
  s3_key?: string;
  content_type: string;
  size: number;
  status?: string;
  type?: string;
  priority?: string;
  due_date?: string;
  link?: string;
  uploaded_at?: string;
  updated_at?: string;
  created_at: string;
  evidence?: string; 
}

export interface EvidenceWithUrl {
  id: string;
  evidence: string; // presigned URL
}

export interface Comment {
  id: string;
  author: string;
  author_user?: AssignedUser;
  case_id: string;
  comment: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Spectator {
  id: string;
  case_id: string;
  user_id: string;
  spectator: AssignedUser;
  created_at: string;
}

export type WorklogEntryType =
  | "case_created"
  | "comment_added"
  | "status_changed"
  | "priority_changed"
  | "assigned_changed"
  | "category_changed"
  | "risk_score_changed"
  | "evidence_added"
  | "note_added"
  | "spectator_added"
  | "spectator_removed"
  | "case_resolved"
  | "case_escalated"
  | "case_closed"
  | "case_reopened";

export interface WorklogEntry {
  id: string;
  case_id: string;
  tenant_id: string;
  user_id: string;
  user: AssignedUser;
  type: WorklogType | WorklogEntryType;
  title: string;
  content: Record<string, unknown>;
  related_user_id?: string | null;
  related_user?: AssignedUser;
  related_evidence_id?: string | null;
  is_public: boolean;
  created_at: string;
}

export interface WorklogTimelinePagination {
  page: number;
  page_size: number;
  total_pages: number;
}

export interface WorklogTimelineResponse {
  pagination: WorklogTimelinePagination;
  total_count: number;
  worklogs: WorklogEntry[];
}

export interface CreateNotePayload {
  case_id: string;
  note: string;
}

export interface UpdateNotePayload {
  id: string;
  note: string;
}

export interface CreateEvidencePayload {
  case_id: string;
  evidence: string; // base64 encoded file
}

export interface UpdateEvidencePayload {
  evidence_id: string;
  evidence: string; // base64 encoded file
}

export interface CreateCommentPayload {
  case_id: string;
  comment: string;
  parent_id?: string;
}

export interface UpdateCommentPayload {
  comment_id: string;
  comment: string;
}

export interface AddSpectatorPayload {
  case_id: string;
  user_id: string;
}

export interface RemoveSpectatorPayload {
  case_id: string;
  user_id: string;
}

export interface HeatmapDataPoint {
  location: string;
  risk_category: string;
  count: number;
}

// Evidence Request Types
export type EvidenceRequestStatus = 'pending' | 'uploaded';
export type EvidenceRequestPriority = 'low' | 'medium' | 'high';

export interface EvidenceRequestRecipient {
  email: string;
  first_name: string;
}

export interface EvidenceRequest {
  id: string;
  tenant_id: string;
  case_id: string;
  document_name: string;
  uploaded_by?: string;
  s3_key?: string;
  content_type?: string;
  size?: number;
  status: EvidenceRequestStatus;
  type?: string;
  priority?: EvidenceRequestPriority;
  due_date?: string;
  uploaded_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateEvidenceRequestInput {
  case_id: string;
  document_name: string;
  priority: EvidenceRequestPriority;
  due_date: string; // ISO date string, must be in the future
  request_from: EvidenceRequestRecipient[];
}

export interface CreateEvidenceRequestResponse {
  evidence: EvidenceRequest;
  message: string;
}

export interface EvidenceRequestListResponse {
  evidences: EvidenceRequest[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface EvidenceRequestFilters {
  case_id?: string;
  status?: EvidenceRequestStatus;
  page?: number;
  limit?: number;
}
