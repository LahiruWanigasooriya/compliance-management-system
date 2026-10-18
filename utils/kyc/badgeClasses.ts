import { ScreeningStatus } from "@/enums/aml/screeningStatus";
import { AlertStatus } from "@/enums/kyc/AlertStatus";
import { KycStatus } from "@/enums/kyc/kycStatus";

const defaultStatusClasses =
  "bg-gray-100 text-gray-700 border-gray-300 capitalize dark:bg-[#011A04] dark:text-slate-300 dark:border-[#373c4a]";

export const getStatusBadgeClasses = (status: string) => {
  const styles: Record<string, string> = {
    // KYC Statuses
    // [KycStatus.REVIEW_PENDING]:
    //   "bg-orange-100 text-orange-700 border-orange-300 capitalize dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
    [KycStatus.UNKNOWN]:
      "bg-blue-100 text-blue-700 border-blue-300 capitalize dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
    [KycStatus.ACCEPTED]:
      "bg-green-100 text-green-700 border-green-300 capitalize dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    [KycStatus.DECLINED]:
      "bg-red-100 text-red-700 border-red-300 capitalize dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",

    // Alert Statuses
    [AlertStatus.IN_PROGRESS]:
      "bg-sky-100 text-sky-700 border-sky-300 capitalize dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700",
    [AlertStatus.ESCALATED]:
      "bg-red-100 text-red-700 border-red-300 capitalize dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
    [AlertStatus.RESOLVED]:
      "bg-green-100 text-green-700 border-green-300 capitalize dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    [AlertStatus.CLOSED]:
      "bg-gray-100 text-gray-700 border-gray-300 capitalize dark:bg-[#011A04] dark:text-slate-300 dark:border-[#373c4a]",

    // Screening Statuses
    [ScreeningStatus.PENDING]:
      "bg-yellow-100 text-yellow-700 border-yellow-300 capitalize dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
    [ScreeningStatus.ACTIVE]:
      "bg-green-100 text-green-700 border-green-300 capitalize dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    [ScreeningStatus.ARCHIVED]:
      "bg-gray-100 text-gray-700 border-gray-300 capitalize dark:bg-[#011A04] dark:text-slate-300 dark:border-[#373c4a]",
    [ScreeningStatus.FLAGGED]:
      "bg-orange-100 text-orange-700 border-orange-300 capitalize dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
    [ScreeningStatus.CLEARED]:
      "bg-blue-100 text-blue-700 border-blue-300 capitalize dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  };

  return `flex items-center justify-center px-2.5 py-1 rounded-full text-xs border uppercase max-w-fit ${
    styles[status.toLowerCase() as keyof typeof styles] ?? defaultStatusClasses
  }`;
};

export const getRiskBadgeClasses = (
  risk: string,
  withBorder: boolean = true,
) => {
  const styles: Record<string, string> = {
    low: withBorder
      ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
      : "text-green-600 dark:text-green-400",
    medium: withBorder
      ? "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700"
      : "text-yellow-600 dark:text-yellow-400",
    high: withBorder
      ? "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700"
      : "text-orange-600 dark:text-orange-400",
    critical: withBorder
      ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
      : "text-red-600 dark:text-red-400",
    "": withBorder
      ? "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700"
      : "text-gray-600 dark:text-gray-400",
  };
  const normalizedRisk = risk?.toLowerCase() ?? "";
  return withBorder
    ? `px-2.5 py-1 rounded-full text-xs border uppercase max-w-fit ${
        styles[normalizedRisk] ?? defaultStatusClasses
      }`
    : `${styles[normalizedRisk] ?? defaultStatusClasses}`;
};

export const getScoreBadgeClasses = () => {
  return "px-2.5 py-1 bg-violet-200 border border-violet-500 text-violet-500 uppercase rounded-full text-xs font-semibold";
};

export const getCategoryBadgeClasses = () => {
  return "px-2.5 py-1 bg-blue-100 text-blue-700 border border-blue-300 rounded-full text-xs font-semibold dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 uppercase max-w-fit";
};

export const getGeoAlertTypeBadgeClasses = () => {
  return "px-2.5 py-1 bg-blue-100 text-blue-700 border border-blue-300 rounded-full text-xs font-semibold dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 uppercase max-w-fit";
};

export const getActiveBadgeClasses = (isActive: boolean) => {
  return `px-2 py-1 text-xs font-medium rounded-full border uppercase max-w-fit ${
    isActive
      ? "bg-green-50/50 text-green-700 border-green-300"
      : "bg-red-50/50 text-red-700 border-red-300"
  }`;
};
