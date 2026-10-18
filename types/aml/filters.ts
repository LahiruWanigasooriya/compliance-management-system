type Filter = {
  code: string;
  name: string;
  category: string;
  description: string;
};

type Country = {
  code: string;
  name: string;
};

type TenantSettings = {
  enabled: boolean;
  autoScreenOnboarding: boolean;
  filters: string[];
  countries: string[];
  matchScore: string;
  enableFuzzyMatch: boolean;
  enableAliasSearch: boolean;
  rcaSearch: boolean;
  riskThresholds: {
    critical: number;
    high: number;
    medium: number;
  };
  alertSettings: {
    createCase: boolean;
    notifyComplianceTeam: boolean;
    blockTransaction: boolean;
    requireManualReview: boolean;
    alertRecipients: string[];
  };
  escalateReasons: string[];
  resolveReasons: string[];
  closeReasons: string[];
  inProgressReasons: string[];
};

type RiskLevelOption = {
  value: string;
  label: string;
  description: string;
};


export type ReviewStatus = "pending_review" | "in_progress" | "closed" | "escalated" | "resolved";
type ReviewStatusOption = {
  value: ReviewStatus | string;
  label: string;
  description: string;
};

type ScreeningStatusOption = {
  value: string;
  label: string;
  description: string;
};

type TimeFilterOption = {
  value: string;
  label: string;
  description: string;
};

export type FilterData = {
  filters: Filter[];
  countries: Country[];
  tenantSettings: TenantSettings;
  riskLevelOptions: RiskLevelOption[];
  reviewStatusOptions: ReviewStatusOption[];
  screeningStatusOptions: ScreeningStatusOption[];
  timeFilterOptions: TimeFilterOption[];
};
