import { Spectator } from "@/types/cases.types";

/**
 * Check if a user is a spectator in a case
 * @param spectators - Array of spectators from the case
 * @param userId - The current user's ID to check
 * @returns true if the user is a spectator, false otherwise
 */
export const isSpectator = (
  spectators: Spectator[] | null | undefined,
  userId: string | undefined
): boolean => {
  if (!spectators || !userId) return false;
  return spectators.some((spectator) => spectator.user_id === userId);
};

export const getSeverityColor = (severity: string) => {
  const colors = {
    Critical: "bg-gray-900 dark:bg-emerald-600 text-white ",
    High: "bg-gray-700 dark:bg-emerald-700 text-gray-100  ",
    Medium: "bg-gray-500 dark:bg-emerald-800 text-gray-200",
    Low: "bg-gray-300 dark:bg-emerald-950 text-gray-200 ",
  };
  return colors[severity as keyof typeof colors] || colors["Low"];
};

export const getStatusColor = (status: string) => {
  const colors = {
    "Pending Review": "bg-gray-500 dark:bg-emerald-800 text-white",
    Submitted: "bg-gray-500 dark:bg-emerald-700 text-white ",
    Draft: "bg-gray-400 dark:bg-emerald-900 text-white",
    Approved: "bg-gray-600 dark:bg-emerald-800 text-white dark:text-gray-100",
    "Under Investigation":
      "bg-gray-400 dark:bg-emerald-700 text-gray-900 dark:text-gray-100",
    Escalated: "bg-black dark:bg-emerald-950 text-white dark:text-gray-100",
    "Pending Approval":
      "bg-gray-300 dark:bg-emerald-800 text-gray-800 dark:text-gray-100",
    Cleared: "bg-gray-500 dark:bg-emerald-700 text-white dark:text-gray-100",
  };
  return colors[status as keyof typeof colors] || colors["Draft"];
};

export const getRiskIndicatorColor = (score: number) => {
  if (score >= 90) return "text-black dark:text-emerald-300";
  if (score >= 70) return "text-gray-800 dark:text-emerald-200";
  if (score >= 50) return "text-gray-700 dark:text-emerald-300";
  return "text-gray-600 dark:text-emerald-400";
};

export const getTrendColor = (trend: string) => {
  if (trend.includes("+")) return "text-black dark:text-emerald-300";
  if (trend.includes("-")) return "text-gray-600 dark:text-emerald-400";
  return "text-gray-500 dark:text-emerald-400";
};

export const getQuickStatBgColor = (stat: string) => {
  switch (stat) {
    case "High-Risk Customers":
    case "Blocked Transactions":
      return "border-gray-500 dark:border-slate-700";
    case "Watchlist Matches":
    case "Peer Analyses":
      return "text-gray-700 dark:text-gray-300 border-gray-400 dark:border-slate-700";
    case "Blocked Amount":
    case "KYC Updates Due":
      return "text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-700";
    default:
      return "text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700";
  }
};
