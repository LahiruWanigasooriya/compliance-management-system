//////////////////////////////////////////////////////////////////////////////////////////////// Organization and Tenant constants

import { OrganizationSettings, SelectOption } from '../types/sysconfig.types';

export const TIMEZONES: SelectOption[] = [
  { label: '(UTC-08:00) Pacific Time', value: 'pst' },
  { label: '(UTC-05:00) Eastern Time', value: 'est' },
  { label: '(UTC+00:00) UTC', value: 'utc' },
  { label: '(UTC+01:00) London', value: 'gmt' },
  { label: '(UTC+05:30) India Standard Time', value: 'ist' },
];

export const REGIONS: SelectOption[] = [
  { label: 'North America (NA)', value: 'na' },
  { label: 'Europe (EU)', value: 'eu' },
  { label: 'Asia Pacific (APAC)', value: 'apac' },
];

export const LANGUAGES: SelectOption[] = [
  { label: 'English (US)', value: 'en-US' },
  { label: 'English (UK)', value: 'en-GB' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
];

export const DATE_FORMATS: SelectOption[] = [
  { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
];

export const DEFAULT_ORG_SETTINGS: OrganizationSettings = {
  profile: {
    name: 'Acme Corp',
    contactEmail: 'admin@acmecorp.com',
    contactPhone: '+1 (555) 123-4567',
    website: 'https://acmecorp.com',
    address: '123 Innovation Dr, Tech City, TC 90210',
  },
  branding: {
    logoUrl: null,
    primaryColor: '#3b82f6', // Tailwind blue-500
    secondaryColor: '#1e293b', // Tailwind slate-800
  },
  localization: {
    timezone: 'utc',
    region: 'na',
    language: 'en-US',
    dateFormat: 'MM/DD/YYYY',
  },
};



//////////////////////////////////////////////////////////////////////////////////////////////// Compliance and Policy Configuration Constants

import { ComplianceRule, RetentionPolicy, AlertHistory } from '../types/sysconfig.types';

export const COMPLIANCE_RULES_MOCK: ComplianceRule[] = [
  {
    id: '1',
    name: 'High Value Transaction',
    status: 'ACTIVE',
    category: 'TRANSACTION',
    threshold: 10000,
    alertCount: 15,
    lastTriggered: '2023-10-25T14:30:00Z',
  },
  {
    id: '2',
    name: 'Suspicious Login Velocity',
    status: 'PAUSED',
    category: 'SECURITY',
    threshold: 5,
    alertCount: 3,
    lastTriggered: '2023-10-24T09:15:00Z',
  },
  {
    id: '3',
    name: 'OFAC Watchlist Check',
    status: 'ACTIVE',
    category: 'REGULATORY',
    threshold: 0,
    alertCount: 1,
    lastTriggered: '2023-10-20T11:00:00Z',
  }
];

export const RETENTION_POLICIES_MOCK: RetentionPolicy[] = [
  {
    id: '1',
    dataType: 'AUDIT_LOGS',
    retentionPeriodDays: 90,
    regulatoryMinimumDays: 30,
    lastUpdated: '2023-09-01T10:00:00Z'
  },
  {
    id: '2',
    dataType: 'TRANSACTIONS',
    retentionPeriodDays: 1825, // 5 years
    regulatoryMinimumDays: 1825,
    lastUpdated: '2023-01-15T08:30:00Z'
  },
  {
    id: '3',
    dataType: 'USER_DATA',
    retentionPeriodDays: 365,
    regulatoryMinimumDays: 0,
    lastUpdated: '2023-10-01T12:00:00Z'
  },
  {
    id: '4',
    dataType: 'COMPLIANCE_RECORDS',
    retentionPeriodDays: 2555, // 7 years
    regulatoryMinimumDays: 1825,
    lastUpdated: '2023-05-20T16:45:00Z'
  }
];

export const ALERT_HISTORY_MOCK: AlertHistory[] = [
  {
    id: '101',
    ruleId: '1',
    timestamp: '2023-10-25T14:30:00Z',
    transactionId: 'TXN-998877',
    outcome: 'FLAGGED',
    details: 'Transaction amount $12,500 exceeded threshold $10,000'
  },
  {
    id: '102',
    ruleId: '1',
    timestamp: '2023-10-25T14:28:00Z',
    transactionId: 'TXN-998876',
    outcome: 'BLOCKED',
    details: 'Transaction amount $50,000 exceeded hard limit'
  }
];


//////////////////////////////////////////////////////////////////////////////////////////////// Alert and Notifications Constants

import { AlertSettingsState, ChannelType, NotificationFrequency } from "../types/sysconfig.types";
import { Mail, MessageSquare, Bell } from "lucide-react";

export const FREQUENCY_OPTIONS: { value: NotificationFrequency; label: string }[] = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'daily', label: 'Daily Digest' },
  { value: 'weekly', label: 'Weekly Summary' },
];

export const CHANNEL_META: Record<ChannelType, { icon: any; description: string }> = {
  email: {
    icon: Mail,
    description: 'Receive alerts directly to your registered email address.',
  },
  sms: {
    icon: MessageSquare,
    description: 'Get urgent alerts via text message to your phone.',
  },
  in_app: {
    icon: Bell,
    description: 'Show notifications within the application dashboard.',
  },
};

export const DEFAULT_SETTINGS: AlertSettingsState = {
  channels: {
    email: { id: 'email', label: 'Email Notifications', enabled: true, frequency: 'immediate' },
    sms: { id: 'sms', label: 'SMS Notifications', enabled: false, frequency: 'immediate' },
    in_app: { id: 'in_app', label: 'In-App Notifications', enabled: true, frequency: 'immediate' },
  },
  activeHours: {
    start: '09:00',
    end: '18:00',
    enabled: true,
  },
  quietHours: {
    start: '22:00',
    end: '07:00',
    enabled: false,
  }
};


//////////////////////////////////////////////////////////////////////////////////////////////// Monitoring and Audit Constants

import { Alert, AuditLog, ServiceStatus, SystemMetric } from "../types/sysconfig.types";

export const METRICS_DATA: SystemMetric[] = [
  { id: 'uptime', label: 'System Uptime', value: 99.98, unit: '%', change: 0.01, trend: 'up', status: 'healthy' },
  { id: 'latency', label: 'Avg Response Time', value: 145, unit: 'ms', change: -12, trend: 'down', status: 'healthy' },
  { id: 'error_rate', label: 'Error Rate', value: 0.05, unit: '%', change: 0.02, trend: 'up', status: 'warning' },
  { id: 'sla', label: 'SLA Compliance', value: 100, unit: '%', trend: 'neutral', status: 'healthy' },
];

export const SERVICE_STATUS_DATA: ServiceStatus[] = [
  { id: 'api_gw', name: 'API Gateway', category: 'API', uptime: '99.99%', latency: '45ms', status: 'healthy' },
  { id: 'ai_core', name: 'AI Prediction Engine', category: 'AI Model', uptime: '98.50%', latency: '420ms', status: 'warning' },
  { id: 'db_main', name: 'Primary Database', category: 'Database', uptime: '100%', latency: '12ms', status: 'healthy' },
  { id: 'sec_scanner', name: 'Threat Detection', category: 'Security', uptime: '100%', latency: 'N/A', status: 'healthy' },
];

export const RECENT_ALERTS: Alert[] = [
  { id: '1', severity: 'critical', message: 'High latency detected in AI Model Inference', timestamp: '2023-10-27 10:45 AM', source: 'AI Engine' },
  { id: '2', severity: 'medium', message: 'Unusual login attempts from IP 192.168.x.x', timestamp: '2023-10-27 09:12 AM', source: 'Security' },
  { id: '3', severity: 'low', message: 'Daily backup completed successfully', timestamp: '2023-10-27 04:00 AM', source: 'System' },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'log-001', timestamp: '2023-10-27 11:30:22', user: 'admin@sys.com', action: 'Update Config', resource: 'Firewall Rules', resultStatus: 'success' },
  { id: 'log-002', timestamp: '2023-10-27 11:15:10', user: 'j.doe@sys.com', action: 'Delete User', resource: 'User ID: 554', resultStatus: 'failure' },
  { id: 'log-003', timestamp: '2023-10-27 10:45:00', user: 'system', action: 'Auto-Scale', resource: 'Compute Node', resultStatus: 'success' },
  { id: 'log-004', timestamp: '2023-10-27 09:20:45', user: 'admin@sys.com', action: 'Export Report', resource: 'Audit Logs', resultStatus: 'success' },
  { id: 'log-005', timestamp: '2023-10-26 18:00:00', user: 'm.scott@sys.com', action: 'Login', resource: 'Dashboard', resultStatus: 'success' },
];