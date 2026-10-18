import { AlertStatus } from "@/enums/kyc/AlertStatus";
import { KYCRecord } from "./kyc.types";
import { AssignedUser } from "../user.types";

export interface KYCAlertsRecord {
  id: string;
  kycId: string;
  kyc: KYCRecord;
  tenantId: string;
  alertType: string;
  alertText: string;
  risk: string;
  assignedFor: string | null;
  assignedUser?: AssignedUser;
  reason?: string;
  status: AlertStatus;
  createdAt: string;
  updatedAt: string;
}

export interface KYCAlertsRecordsResponse {
  alerts: KYCAlertsRecord[];
  pagination: {
    limit: number;
    page: number;
    total: number;
  };
  total: number;
}
