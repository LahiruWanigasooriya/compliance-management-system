"use client";

import { useRouter } from "next/navigation";
import { ICONS } from "@/constants/constants";
import { RiskFactor } from "@/types/customer-risk.types";

interface RiskFactorsTableProps {
  riskFactors: RiskFactor[];
  profileId?: string;
}

const MAX_DISPLAY_FACTORS = 5;

export default function RiskFactorsTable({ riskFactors, profileId }: RiskFactorsTableProps) {
  const router = useRouter();

  if (!riskFactors || riskFactors.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <ICONS.BarChart size={20} />
          Risk Factors
        </h2>
        <div className="text-center py-8 text-muted-foreground">
          No risk factors have been identified for this profile.
        </div>
      </div>
    );
  }

  const hasMoreFactors = riskFactors.length > MAX_DISPLAY_FACTORS;
  const displayFactors = hasMoreFactors ? riskFactors.slice(0, MAX_DISPLAY_FACTORS) : riskFactors;

  const handleViewMore = () => {
    if (profileId) {
      router.push(`/customer-risk/${profileId}/risk-factors`);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-red-600 dark:text-red-400";
    if (score >= 60) return "text-orange-600 dark:text-orange-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-red-100 dark:bg-red-900/20";
    if (score >= 60) return "bg-orange-100 dark:bg-orange-900/20";
    if (score >= 40) return "bg-yellow-100 dark:bg-yellow-900/20";
    return "bg-green-100 dark:bg-green-900/20";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${hour12}:${minutes} ${ampm}`;
  };

  const formatFactorType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ICONS.BarChart size={20} />
          Risk Factors
        </h2>
        <div className="text-sm text-muted-foreground">
          {riskFactors.length} factor{riskFactors.length !== 1 ? "s" : ""} identified
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-panel-border">
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                Factor Type
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                Factor Name
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">
                Score
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">
                Weight
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                Source
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                Last Evaluated
              </th>
            </tr>
          </thead>
          <tbody>
            {displayFactors.map((factor, index) => (
              <tr
                key={factor.id || index}
                className="border-b border-panel-border hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <td className="py-3 px-4">
                  <span className="text-sm font-medium text-foreground">
                    {formatFactorType(factor.factor_type)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <span className="text-sm text-foreground">{factor.factor_name}</span>
                    {factor.details && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {factor.details}
                      </p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold ${getScoreBgColor(
                      factor.score
                    )} ${getScoreColor(factor.score)}`}
                  >
                    {factor.score.toFixed(1)}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-sm font-medium text-foreground">
                    {factor.weight.toFixed(2)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-muted-foreground">
                    {factor.source_service}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(factor.last_evaluated)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMoreFactors && (
        <div className="mt-4 flex items-center justify-center">
          <button
            onClick={handleViewMore}
            className="flex items-center cursor-pointer gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            View All {riskFactors.length} Risk Factors
            <ICONS.ChevronRight size={16} />
          </button>
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <ICONS.Info size={18} className="text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">About Risk Factors</p>
            <p>
              Risk factors are individual components that contribute to the overall risk score.
              Each factor has a score (0-100) and a weight that determines its impact on the final risk score.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
