export type ComplianceStatus = 'Compliant' | 'Non-Compliant' | 'Unknown';

export interface Jurisdiction {
  id: string;
  name: string; // Country / Region
  status: ComplianceStatus;
  appliedRulesCount: number;
  region: string; // e.g., "NA", "EU", "APAC"
  relatedRuleIds: string[]; // For mapping mock data
}