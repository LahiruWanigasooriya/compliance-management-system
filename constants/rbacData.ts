// constants/rbacData.ts
import { Role, FraudAlert, AuditLog, TempAccessRequest } from '../types/rbac';

export const MOCK_ROLES: Role[] = [
  {
    id: 'R001', // <--- MAKE SURE THIS EXISTS
    name: 'Super Admin',
    description: 'Full system access with ability to manage roles.',
    createdAt: '2024-01-01',
    updatedAt: '2024-03-10',
    permissions: [{ feature: 'All', actions: ['All'] }],
  },
  {
    id: 'R002', // <--- MAKE SURE THIS EXISTS
    name: 'Compliance Officer',
    description: 'Focus on SARs, Fraud Cases, and Reporting.',
    createdAt: '2024-01-05',
    updatedAt: '2024-02-15',
    permissions: [
      { feature: 'Fraud', actions: ['view', 'edit'] },
      { feature: 'SARs', actions: ['create', 'submit_draft'] },
    ],
    inheritedFrom: ['R003'],
  },
  {
    id: 'R003', // <--- MAKE SURE THIS EXISTS
    name: 'Risk Analyst',
    description: 'Basic view access for monitoring.',
    createdAt: '2024-02-01',
    updatedAt: '2024-02-01',
    permissions: [{ feature: 'Fraud', actions: ['view'] }],
  },
];

export const MOCK_ALERTS: FraudAlert[] = [
  { id: 'F-1029', severity: 'Critical', status: 'New', amount: 15000, timestamp: '10 mins ago', aiFlagged: true },
  { id: 'F-1030', severity: 'High', status: 'Investigating', amount: 4500, timestamp: '1 hour ago', aiFlagged: false },
  { id: 'F-1031', severity: 'Low', status: 'Resolved', amount: 120, timestamp: 'Yesterday', aiFlagged: true },
];

export const MOCK_LOGS: AuditLog[] = [
  { id: 'L-991', action: 'Role Update', user: 'AdminUser', role: 'Super Admin', timestamp: '2024-03-12 10:00', details: 'Updated Compliance Officer permissions' },
  { id: 'L-992', action: 'SAR Submission', user: 'JaneDoe', role: 'Compliance', timestamp: '2024-03-12 09:45', details: 'Submitted SAR #9921' },
];

export const MOCK_TEMP_ACCESS: TempAccessRequest[] = [
  { id: 'TA-01', user: 'John Smith', requestedRole: 'Manager', duration: '4h', status: 'Active', startTime: '14:00', expiryTime: '18:00' },
  { id: 'TA-02', user: 'Alice Brown', requestedRole: 'Admin', duration: '1h', status: 'Expired', startTime: '09:00', expiryTime: '10:00' },
];