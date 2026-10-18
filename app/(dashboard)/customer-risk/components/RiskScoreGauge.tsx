"use client";

import { RiskCategory } from "@/types/customer-risk.types";

interface RiskScoreGaugeProps {
  score: number;
  category: RiskCategory;
  previousScore?: number;
}

const RiskScoreGauge = ({ score, category, previousScore }: RiskScoreGaugeProps) => {
  const getScoreColor = () => {
    if (score >= 80) return { primary: "#dc2626", secondary: "#fecaca" }; // red
    if (score >= 60) return { primary: "#ea580c", secondary: "#fed7aa" }; // orange
    if (score >= 40) return { primary: "#ca8a04", secondary: "#fef08a" }; // yellow
    return { primary: "#16a34a", secondary: "#bbf7d0" }; // green
  };

  const colors = getScoreColor();
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const scoreDiff = previousScore ? score - previousScore : 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={colors.secondary}
            strokeWidth="8"
            className="dark:opacity-30"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={colors.primary}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color: colors.primary }}>
            {score}
          </span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            category === "Critical"
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
              : category === "High"
              ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
              : category === "Medium"
              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
          }`}
        >
          {category} Risk
        </span>
        {scoreDiff !== 0 && (
          <div className={`mt-2 text-sm font-medium ${scoreDiff > 0 ? "text-red-600" : "text-green-600"}`}>
            {scoreDiff > 0 ? "+" : ""}
            {scoreDiff} from previous
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskScoreGauge;
