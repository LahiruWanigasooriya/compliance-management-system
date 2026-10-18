// types/rbac.ts

export type Permission = {
  feature: string;
  actions: string[]; // e.g., ['read', 'write', 'delete']
};

export type Role = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  permissions: Permission[];
  inheritedFrom?: string[]; // IDs of roles this inherits from
};

export type FraudAlert = {
  id: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'New' | 'Investigating' | 'Resolved';
  amount: number;
  timestamp: string;
  aiFlagged: boolean;
};

export type AuditLog = {
  id: string;
  action: string;
  user: string;
  role: string;
  timestamp: string;
  details: string;
};

export type TempAccessRequest = {
  id: string;
  user: string;
  requestedRole: string;
  duration: string; // e.g., "4h"
  status: 'Active' | 'Expired' | 'Revoked';
  startTime: string;
  expiryTime: string;
};