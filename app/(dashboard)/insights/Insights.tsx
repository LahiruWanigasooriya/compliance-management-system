"use client";
// TODO: REMOVE USE CLIENT ONEC IT MOVED TO SSR

import SummaryCard from "@/components/layout/SummaryCard";
import { ICONS, TIME_RANGES } from "@/constants/constants";
import { useMemo, useState } from "react";

const Insights = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d");

  const insights = {
    trendingPatterns: [
      {
        id: "PAT-001",
        patternName: "Crypto Exchange Surge",
        severity: "High",
        occurrences: 342,
        trend: "+145%",
        description:
          "Significant increase in cryptocurrency exchange transactions from high-risk jurisdictions",
        affectedCustomers: 67,
        recommendation: "Enhanced monitoring of crypto-related transactions",
      },
      {
        id: "PAT-002",
        patternName: "Round Dollar Transactions",
        severity: "Medium",
        occurrences: 1247,
        trend: "+23%",
        description:
          "Unusual pattern of round-dollar amount transactions just below reporting thresholds",
        affectedCustomers: 145,
        recommendation: "Review for potential structuring behavior",
      },
      {
        id: "PAT-003",
        patternName: "Rapid Fund Movement",
        severity: "Critical",
        occurrences: 89,
        trend: "+78%",
        description:
          "Multiple customers showing rapid fund movement through shell companies",
        affectedCustomers: 23,
        recommendation: "Immediate investigation and potential SAR filing",
      },
    ],
    geographicRisks: [
      {
        country: "Cayman Islands",
        riskLevel: "Critical",
        transactionCount: 456,
        volume: "$12.3M",
        change: "+67%",
      },
      {
        country: "Panama",
        riskLevel: "High",
        transactionCount: 789,
        volume: "$8.7M",
        change: "+45%",
      },
      {
        country: "Hong Kong",
        riskLevel: "High",
        transactionCount: 1234,
        volume: "$15.2M",
        change: "+32%",
      },
      {
        country: "UAE",
        riskLevel: "Medium",
        transactionCount: 567,
        volume: "$6.4M",
        change: "+18%",
      },
      {
        country: "Switzerland",
        riskLevel: "Medium",
        transactionCount: 890,
        volume: "$9.8M",
        change: "-5%",
      },
    ],
    topAlertReasons: [
      {
        reason: "High-Value Transaction",
        count: 1243,
        percentage: 35,
        trend: "+12%",
      },
      {
        reason: "Structuring Pattern",
        count: 892,
        percentage: 25,
        trend: "+45%",
      },
      {
        reason: "High-Risk Jurisdiction",
        count: 678,
        percentage: 19,
        trend: "+23%",
      },
      {
        reason: "Velocity Check Failed",
        count: 456,
        percentage: 13,
        trend: "+8%",
      },
      { reason: "Watchlist Match", count: 289, percentage: 8, trend: "+67%" },
    ],
    performanceMetrics: {
      alertResolutionTime: "4.2 hours",
      sarFilingRate: "12%",
      falsePositiveRate: "15%",
      complianceScore: 87,
      caseBacklog: 23,
      activeInvestigations: 45,
    },
  };

  const stats = useMemo(() => {
    const totalPatterns = insights.trendingPatterns.length;
    const criticalPatterns = insights.trendingPatterns.filter(
      (p) => p.severity === "Critical"
    ).length;
    const highRiskCountries = insights.geographicRisks.filter(
      (g) => g.riskLevel === "Critical" || g.riskLevel === "High"
    ).length;
    const complianceScore = insights.performanceMetrics.complianceScore;

    return {
      totalPatterns,
      criticalPatterns,
      highRiskCountries,
      complianceScore,
    };
  }, [insights]);

  const getSeverityBadgeClasses = (severity: string) => {
    const styles = {
      Low: "bg-green-100 text-green-700 border-green-300",
      Medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
      High: "bg-orange-100 text-orange-700 border-orange-300",
      Critical: "bg-red-100 text-red-700 border-red-300",
    };
    return `px-2.5 py-1 rounded-full text-xs font-semibold border ${
      styles[severity as keyof typeof styles]
    }`;
  };

  const getRiskLevelColor = (level: string) => {
    const colors = {
      Critical: "text-red-600",
      High: "text-orange-600",
      Medium: "text-yellow-600",
      Low: "text-green-600",
    };
    return colors[level as keyof typeof colors] || "text-gray-600";
  };

  return (
    <div className="">
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
          <p className="text-gray-600 text-sm mt-0.5">
            Gain valuable insights from your data
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-600 bg-white text-gray-900 text-sm font-medium"
          >
            {TIME_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-colors text-sm font-medium">
            <ICONS.Download size={16} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <SummaryCard
          title="Detected Patterns"
          value={stats.totalPatterns}
          mainColor="blue"
          icon={ICONS.TrendingUp}
          bottomLabel="Active patterns"
        />
        <SummaryCard
          title="Critical Patterns"
          value={stats.criticalPatterns}
          mainColor="red"
          icon={ICONS.AlertTriangle}
          trend="+2"
          trendColor="red"
          bottomLabel="Immediate attention"
        />
        <SummaryCard
          title="High-Risk Countries"
          value={stats.highRiskCountries}
          mainColor="orange"
          icon={ICONS.MapPin}
          bottomLabel="Geographic risks"
        />
        <SummaryCard
          title="Compliance Score"
          value={`${stats.complianceScore}%`}
          mainColor="green"
          icon={ICONS.Shield}
          trend="+5%"
          trendColor="green"
          bottomLabel="Overall performance"
        />
      </div>

      {/* Performance Metrics Overview */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Performance Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1 font-medium">
              Alert Resolution Time
            </div>
            <div className="text-gray-900 font-bold text-lg">
              {insights.performanceMetrics.alertResolutionTime}
            </div>
            <div className="text-green-600 text-xs mt-1 font-semibold">
              -15% from last month
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1 font-medium">
              SAR Filing Rate
            </div>
            <div className="text-gray-900 font-bold text-lg">
              {insights.performanceMetrics.sarFilingRate}
            </div>
            <div className="text-gray-600 text-xs mt-1">Of flagged cases</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1 font-medium">
              False Positive Rate
            </div>
            <div className="text-gray-900 font-bold text-lg">
              {insights.performanceMetrics.falsePositiveRate}
            </div>
            <div className="text-green-600 text-xs mt-1 font-semibold">
              -3% improvement
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1 font-medium">
              Compliance Score
            </div>
            <div className="text-green-600 font-bold text-lg">
              {insights.performanceMetrics.complianceScore}%
            </div>
            <div className="text-green-600 text-xs mt-1 font-semibold">
              +5% from last month
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1 font-medium">
              Case Backlog
            </div>
            <div className="text-orange-600 font-bold text-lg">
              {insights.performanceMetrics.caseBacklog}
            </div>
            <div className="text-orange-600 text-xs mt-1 font-semibold">
              Pending review
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1 font-medium">
              Active Investigations
            </div>
            <div className="text-blue-600 font-bold text-lg">
              {insights.performanceMetrics.activeInvestigations}
            </div>
            <div className="text-gray-600 text-xs mt-1">In progress</div>
          </div>
        </div>
      </div>

      {/* Trending Fraud Patterns */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Trending Fraud Patterns
        </h2>
        <div className="space-y-3">
          {insights.trendingPatterns.map((pattern) => (
            <div
              key={pattern.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 flex-wrap gap-2 mb-2">
                    <span className="text-gray-900 font-semibold text-base">
                      {pattern.patternName}
                    </span>
                    <span className={getSeverityBadgeClasses(pattern.severity)}>
                      {pattern.severity.toUpperCase()}
                    </span>
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 border border-blue-300 rounded-full text-xs font-semibold">
                      {pattern.trend} increase
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {pattern.description}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="bg-white rounded p-2 border border-gray-300">
                  <div className="text-gray-600 text-xs font-medium">
                    Occurrences
                  </div>
                  <div className="text-gray-900 font-bold">
                    {pattern.occurrences}
                  </div>
                </div>
                <div className="bg-white rounded p-2 border border-gray-300">
                  <div className="text-gray-600 text-xs font-medium">
                    Affected Customers
                  </div>
                  <div className="text-gray-900 font-bold">
                    {pattern.affectedCustomers}
                  </div>
                </div>
                <div className="bg-white rounded p-2 border border-gray-300">
                  <div className="text-gray-600 text-xs font-medium">Trend</div>
                  <div className="text-red-600 font-bold">{pattern.trend}</div>
                </div>
              </div>
              <div className="bg-blue-50 rounded p-3 border border-blue-200">
                <div className="text-blue-900 text-xs font-semibold mb-1">
                  Recommendation
                </div>
                <div className="text-blue-800 text-sm">
                  {pattern.recommendation}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Geographic Risk Analysis */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Geographic Risk Analysis
          </h2>
          <div className="space-y-2">
            {insights.geographicRisks.map((geo, idx) => (
              <div
                key={idx}
                className="bg-gray-50 rounded-lg p-3 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <ICONS.MapPin size={16} className="text-gray-600" />
                    <span className="font-semibold text-gray-900">
                      {geo.country}
                    </span>
                    <span
                      className={`text-xs font-semibold ${getRiskLevelColor(
                        geo.riskLevel
                      )}`}
                    >
                      {geo.riskLevel}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      geo.change.startsWith("+")
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {geo.change}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">
                    Transactions:{" "}
                    <span className="text-gray-900 font-semibold">
                      {geo.transactionCount}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    Volume:{" "}
                    <span className="text-gray-900 font-semibold">
                      {geo.volume}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Alert Reasons */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Top Alert Reasons
          </h2>
          <div className="space-y-3">
            {insights.topAlertReasons.map((alert, idx) => (
              <div
                key={idx}
                className="bg-gray-50 rounded-lg p-3 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">
                    {alert.reason}
                  </span>
                  <span className="text-sm font-semibold text-blue-600">
                    {alert.trend}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    {alert.count} alerts
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {alert.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#1A5276] h-2 rounded-full"
                    style={{ width: `${alert.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
