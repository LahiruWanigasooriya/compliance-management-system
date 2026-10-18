import { KYCOverview } from "@/types/kyc/kyc.types";

export const defaultOverviewStats: KYCOverview = {
  total: 0,
  pending: 0,
  approved: 0,
  highRisk: 0,
  rejected: 0,
  idVerified: 0,
  addressVerified: 0,
  faceVerified: 0,
  rejections: 0,
  totalAlerts: 0,
  pendingAlerts: 0,
  resolvedAlerts: 0,
};
