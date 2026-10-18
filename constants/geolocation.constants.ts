import { AlertSeverity, AlertTypes } from "@/types/geolocation.types";

export const severityOrder: Array<keyof AlertSeverity> = [
  "critical",
  "high",
  "medium",
  "low",
];

export const alertTypeLabels: Record<keyof AlertTypes, string> = {
  anonymization_detected: "Anonymization Detected",
  anonymization_tool_detected: "Anonymization Tool Detected",
  geofence_violation: "Geofence Violation",
  high_risk_country: "High Risk Country",
  high_risk_login: "High Risk Login",
  impossible_travel: "Impossible Travel",
  location_change_alert: "Location Change Alert",
  location_spoofing: "Location Spoofing",
  proxy_detected: "Proxy Detected",
  sanctioned_region: "Sanctioned Region",
  tor_detected: "TOR Detected",
  vpn_detected: "VPN Detected",
};

export const getStatusBadgeClasses = (status: string) => {
  const styles = {
    pending:
      "bg-yellow-100 text-yellow-700 border-yellow-300  dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
    in_progress:
      "bg-green-100 text-green-700 border-green-300  dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    closed: "bg-red-100 text-red-700 border-red-300  dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
    resolved: "bg-blue-100 text-blue-700 border-blue-300  dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
    escalated:
      "bg-orange-100 text-orange-700 border-orange-300  dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
  };
  return `px-2.5 py-1 rounded-full text-xs border ${
    styles[status as keyof typeof styles]
  }`;
};

export const getRiskBadgeClasses = (risk: string) => {
  const styles = {
    low: "bg-green-100 text-green-700 border-green-300  dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-300  dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
    high: "bg-orange-100 text-orange-700 border-orange-300  dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
    critical: "bg-red-100 text-red-700 border-red-300  dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
  };
  return `px-2.5 py-1 rounded-full text-xs border ${
    styles[risk as keyof typeof styles]
  }`;
};

export type Alert = {
  id: string;
  status: string;
  riskLevel: string;
  alertType: string;
  rule: string;
  customerName: string;
  customerType: string;
  location: string;
  ipAddress: string;
  dateAdded: string;
  assignedDetails: string;
  jurisdiction: string;
  riskScore: number;
  notes: string;
};

export const alerts: Alert[] = [
  {
    id: "GC-3215",
    status: "Pending",
    riskLevel: "High",
    alertType: "Geofencing",
    rule: "Blocked Transactions",
    customerName: "John Doe",
    customerType: "Individual",
    location: "Colombo",
    ipAddress: "0.0.0.0/32",
    dateAdded: "2025-10-10 14:30:00",
    assignedDetails: "ff",
    riskScore: 32,
    jurisdiction: "gd",
    notes: "fff",
  },
  {
    id: "GC-5204",
    status: "In Progress",
    riskLevel: "Low",
    alertType: "Device Switching",
    rule: "Sudden Device Change",
    customerName: "Multan Sultan",
    customerType: "Corporate",
    location: "US",
    ipAddress: "192.161.13.4/24",
    dateAdded: "2025-10-11 14:30:00",
    assignedDetails: "ff",
    riskScore: 54,
    jurisdiction: "gd",
    notes: "fff",
  },
  {
    id: "GC-7812",
    status: "Closed",
    riskLevel: "Critical",
    alertType: "Proxy",
    rule: "Blocked VPN Access Attempt",
    customerName: "Sharjah Warriors",
    customerType: "Individual",
    location: "New york",
    ipAddress: "70.5.2.5/32",
    dateAdded: "2025-10-12 14:30:00",
    assignedDetails: "ff",
    riskScore: 72,
    jurisdiction: "gd",
    notes: "fff",
  },
  {
    id: "GC-7031",
    status: "Resolved",
    riskLevel: "Medium",
    alertType: "Geofencing",
    rule: "Impossible Travel",
    customerName: "Deccan Chargers",
    customerType: "Individual",
    location: "Texsas",
    ipAddress: "212.12.22.5/32",
    dateAdded: "2025-10-13 14:30:00",
    assignedDetails: "ff",
    riskScore: 92,
    jurisdiction: "gd",
    notes: "fff",
  },
  {
    id: "GC-4904",
    status: "Escalated",
    riskLevel: "Medium",
    alertType: "Unrecognized Device",
    rule: "Device-Based Alerts",
    customerName: "Freddy Silva",
    customerType: "Corporate",
    location: "US",
    ipAddress: "0.0.0.0/32",
    dateAdded: "2025-10-14 14:30:00",
    assignedDetails: "ff",
    riskScore: 38,
    jurisdiction: "gd",
    notes: "fff",
  },
  {
    id: "GC-1004",
    status: "Pending",
    riskLevel: "Low",
    alertType: "Unrecognized Device",
    rule: "Device-Based Alerts",
    customerName: "Alzzari Joseph",
    customerType: "Corporate",
    location: "US",
    ipAddress: "0.0.0.0/32",
    dateAdded: "2025-10-14 14:30:00",
    assignedDetails: "ff",
    riskScore: 38,
    jurisdiction: "gd",
    notes: "fff",
  },
];

export const alertCategories = [
  { id: "1", label: "Geo fencing", value: "3" },
  { id: "2", label: "Spoofing", value: "3" },
  { id: "3", label: "VPN/Proxy", value: "3" },
  { id: "4", label: "Anonymization Tool", value: "3" },
  { id: "5", label: "Anonymization Alerts", value: "3" },
  { id: "6", label: "Device Switching", value: "3" },
  { id: "7", label: "New/Unrecognized device", value: "3" },
  { id: "8", label: "Fingerprint Mismatch", value: "3" },
  { id: "9", label: "High Risk IP", value: "3" },
  { id: "10", label: "Repeat violations", value: "3" },
];

export const geoCustomers = [
  {
    id: "C001",
    name: "Customer A",
    lat: 6.9271,
    lng: 79.8612,
  },
  {
    id: "C002",
    name: "Customer B",
    lat: 6.915,
    lng: 79.872,
  },
  {
    id: "C003",
    name: "Customer C",
    lat: 6.935,
    lng: 79.85,
  },
];
