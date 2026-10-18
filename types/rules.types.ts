export type RuleStatus = 'Active' | 'Inactive';
export type RuleType = 'Transaction Blocking' | 'Session Restriction' | 'Login Restriction';

export interface Rule {
  id: string;
  name: string;
  type: RuleType;
  status: RuleStatus;
  description: string;
  restrictedJurisdictionIds: string[]; // IDs of jurisdictions this rule applies to
}