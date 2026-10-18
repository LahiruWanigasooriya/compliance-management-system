import { Rule } from "../types/rules.types";

export const MOCK_RULES: Rule[] = [
  { 
    id: 'r1', 
    name: 'Global Sanctions List Block', 
    type: 'Transaction Blocking', 
    status: 'Active', 
    description: 'Blocks all transactions originating from sanctioned countries.',
    restrictedJurisdictionIds: ['j3', 'j6', 'j11'] 
  },
  { 
    id: 'r2', 
    name: 'High Risk Login Check', 
    type: 'Login Restriction', 
    status: 'Active', 
    description: 'Requires 2FA for logins from high-risk regions.',
    restrictedJurisdictionIds: ['j1', 'j3', 'j7', 'j11']
  },
  { 
    id: 'r3', 
    name: 'GDPR Data Compliance', 
    type: 'Session Restriction', 
    status: 'Inactive', 
    description: 'Ensures session data is not stored permanently for EU visitors.',
    restrictedJurisdictionIds: ['j2', 'j5', 'j10', 'j11']
  },
  { 
    id: 'r4', 
    name: 'Crypto Transaction Ban', 
    type: 'Transaction Blocking', 
    status: 'Active', 
    description: 'Prevents cryptocurrency based transactions.',
    restrictedJurisdictionIds: ['j3', 'j6', 'j11']
  },
  { 
    id: 'r5', 
    name: 'Embargoed Goods Filter', 
    type: 'Transaction Blocking', 
    status: 'Active', 
    description: 'Filters carts containing embargoed SKUs.',
    restrictedJurisdictionIds: ['j3', 'j6']
  },
];