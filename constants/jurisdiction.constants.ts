import { Jurisdiction } from "../types/jurisdiction.types";

export const MOCK_JURISDICTIONS: Jurisdiction[] = [
  { id: 'j1', name: 'United States (California)', status: 'Compliant', appliedRulesCount: 2, region: 'NA', relatedRuleIds: ['r1', 'r2'] },
  { id: 'j2', name: 'United Kingdom', status: 'Compliant', appliedRulesCount: 1, region: 'EU', relatedRuleIds: ['r1'] },
  { id: 'j3', name: 'North Korea', status: 'Non-Compliant', appliedRulesCount: 5, region: 'APAC', relatedRuleIds: ['r1', 'r2', 'r3', 'r4', 'r5'] },
  { id: 'j4', name: 'Germany', status: 'Unknown', appliedRulesCount: 0, region: 'EU', relatedRuleIds: [] },
  { id: 'j5', name: 'France', status: 'Compliant', appliedRulesCount: 1, region: 'EU', relatedRuleIds: ['r3'] },
  { id: 'j6', name: 'Iran', status: 'Non-Compliant', appliedRulesCount: 3, region: 'ME', relatedRuleIds: ['r1', 'r4', 'r5'] },
  { id: 'j7', name: 'Canada', status: 'Compliant', appliedRulesCount: 1, region: 'NA', relatedRuleIds: ['r2'] },
  { id: 'j8', name: 'Japan', status: 'Compliant', appliedRulesCount: 0, region: 'APAC', relatedRuleIds: [] },
  { id: 'j9', name: 'Brazil', status: 'Unknown', appliedRulesCount: 0, region: 'SA', relatedRuleIds: [] },
  { id: 'j10', name: 'Australia', status: 'Compliant', appliedRulesCount: 1, region: 'APAC', relatedRuleIds: ['r3'] },
  { id: 'j11', name: 'Russia', status: 'Non-Compliant', appliedRulesCount: 4, region: 'EU/ASIA', relatedRuleIds: ['r1', 'r2', 'r3', 'r4'] },
  { id: 'j12', name: 'Singapore', status: 'Compliant', appliedRulesCount: 0, region: 'APAC', relatedRuleIds: [] },
];