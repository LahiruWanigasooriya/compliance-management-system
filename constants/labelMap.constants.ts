import { AlertStatus } from "@/enums/kyc/AlertStatus";
import { KycStatus } from "@/enums/kyc/kycStatus";
import { ReviewStatus } from "@/enums/aml/reviewStatus";
import { ICONS } from "@/constants/constants";

export const LABEL_MAP: Record<string, { icon: any; color: string }> = {
  // Alert Statuses
  [AlertStatus.PENDING.toLowerCase()]: {
    icon: ICONS.Clock,
    color: "text-amber-500",
  },
  [AlertStatus.IN_PROGRESS.toLowerCase()]: {
    icon: ICONS.Activity,
    color: "text-blue-500",
  },
  [AlertStatus.ESCALATED.toLowerCase()]: {
    icon: ICONS.ArrowUpRight,
    color: "text-red-500",
  },
  [AlertStatus.RESOLVED.toLowerCase()]: {
    icon: ICONS.CheckCircle,
    color: "text-emerald-500",
  },
  [AlertStatus.CLOSED.toLowerCase()]: {
    icon: ICONS.XCircle,
    color: "text-slate-500",
  },
  // KYC Statuses
  [KycStatus.ACCEPTED.toLowerCase()]: {
    icon: ICONS.CheckCircle,
    color: "text-emerald-500",
  },
  [KycStatus.DECLINED.toLowerCase()]: {
    icon: ICONS.XCircle,
    color: "text-red-500",
  },
  // Watchlist/Screening Review Statuses
  [ReviewStatus.PENDING_REVIEW.toLowerCase()]: {
    icon: ICONS.Clock,
    color: "text-amber-500",
  },
  [ReviewStatus.IN_PROGRESS.toLowerCase()]: {
    icon: ICONS.Activity,
    color: "text-blue-500",
  },
  [ReviewStatus.ESCALATED.toLowerCase()]: {
    icon: ICONS.ArrowUpRight,
    color: "text-red-500",
  },
  [ReviewStatus.RESOLVED.toLowerCase()]: {
    icon: ICONS.CheckCircle,
    color: "text-emerald-500",
  },
  [ReviewStatus.CLOSED.toLowerCase()]: {
    icon: ICONS.XCircle,
    color: "text-slate-500",
  },
  // Additional common statuses
  reviewed: {
    icon: ICONS.CheckCircle,
    color: "text-emerald-500",
  },
  active: {
    icon: ICONS.Activity,
    color: "text-emerald-500",
  },
};
