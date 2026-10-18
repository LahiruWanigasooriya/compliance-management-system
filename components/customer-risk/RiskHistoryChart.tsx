"use client";

import { ICONS } from "@/constants/constants";
import { RiskHistoryItem } from "@/types/customer-risk.types";

interface RiskHistoryChartProps {
  riskHistory: RiskHistoryItem[];
}

export default function RiskHistoryChart({ riskHistory }: RiskHistoryChartProps) {
  if (!riskHistory || riskHistory.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <ICONS.TrendingUp size={20} />
          Risk Score History
        </h2>
        <div className="text-center py-8 text-muted-foreground">
          No risk history available for this profile.
        </div>
      </div>
    );
  }

  // Sort by date (oldest first for timeline)
  const sortedHistory = [...riskHistory].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const maxScore = 100;
  const minScore = 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return "#ef4444"; // red-500
    if (score >= 60) return "#f97316"; // orange-500
    if (score >= 40) return "#eab308"; // yellow-500
    return "#22c55e"; // green-500
  };

  const getRiskCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300";
    }
  };

  return (
    <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ICONS.TrendingUp size={20} />
          Risk Score History
        </h2>
        <div className="text-sm text-muted-foreground">
          {sortedHistory.length} {sortedHistory.length === 1 ? "record" : "records"}
        </div>
      </div>

      {/* Line Chart */}
      <div className="mb-6">
        <div className="relative h-64 bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-muted-foreground py-4">
            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
            <span>0</span>
          </div>

          {/* Chart area */}
          <div className="ml-12 h-full relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="border-t border-gray-200 dark:border-gray-700"></div>
              ))}
            </div>

            {/* Line and points */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              {/* Line path */}
              <polyline
                points={sortedHistory
                  .map((item, index) => {
                    const x = (index / (sortedHistory.length - 1)) * 100;
                    const y = 100 - ((item.risk_score - minScore) / (maxScore - minScore)) * 100;
                    return `${x}%,${y}%`;
                  })
                  .join(" ")}
                stroke="#3b82f6"
                strokeWidth="2"
                fill="none"
              />

              {/* Area fill */}
              <polygon
                points={`0%,100% ${sortedHistory
                  .map((item, index) => {
                    const x = (index / (sortedHistory.length - 1)) * 100;
                    const y = 100 - ((item.risk_score - minScore) / (maxScore - minScore)) * 100;
                    return `${x}%,${y}%`;
                  })
                  .join(" ")} 100%,100%`}
                fill="url(#gradient)"
                opacity="0.2"
              />

              {/* Gradient definition */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Data points */}
              {sortedHistory.map((item, index) => {
                const x = (index / (sortedHistory.length - 1)) * 100;
                const y = 100 - ((item.risk_score - minScore) / (maxScore - minScore)) * 100;
                return (
                  <circle
                    key={index}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill={getRiskColor(item.risk_score)}
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer hover:r-6 transition-all"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* X-axis labels */}
        <div className="ml-12 mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{formatDate(sortedHistory[0].date)}</span>
          {sortedHistory.length > 2 && sortedHistory.length % 2 === 1 && (
            <span>{formatDate(sortedHistory[Math.floor(sortedHistory.length / 2)].date)}</span>
          )}
          <span>{formatDate(sortedHistory[sortedHistory.length - 1].date)}</span>
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Timeline</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sortedHistory.slice().reverse().map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getRiskColor(item.risk_score) }}
                ></div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(item.date)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Score changed to {item.risk_score}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold" style={{ color: getRiskColor(item.risk_score) }}>
                  {item.risk_score}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRiskCategoryColor(
                    item.risk_category
                  )}`}
                >
                  {item.risk_category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-muted-foreground">Low (0-39)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-muted-foreground">Medium (40-59)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-muted-foreground">High (60-79)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-muted-foreground">Critical (80-100)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
