import { useMemo, useState } from "react";
import { ICONS, TIME_RANGES } from "../constants/constants";
import SummaryCard from "./layout/SummaryCard";

const ComplianceRules = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const rules = [
    {
      id: "RULE-001",
      ruleName: "High-Value Transaction Threshold",
      category: "Transaction Monitoring",
      status: "Active",
      riskLevel: "High",
      threshold: "$10,000",
      alertsTriggered: 1243,
      lastTriggered: "2025-10-10 14:45:00",
      accuracy: 87,
      falsePositiveRate: 13,
      description: "Flags transactions exceeding $10,000 for manual review",
    },
    {
      id: "RULE-002",
      ruleName: "Structuring Pattern Detection",
      category: "Pattern Recognition",
      status: "Active",
      riskLevel: "Critical",
      threshold: "3+ txns < $10K in 24h",
      alertsTriggered: 234,
      lastTriggered: "2025-10-10 13:20:00",
      accuracy: 92,
      falsePositiveRate: 8,
      description:
        "Detects potential structuring to avoid reporting thresholds",
    },
    {
      id: "RULE-003",
      ruleName: "High-Risk Jurisdiction Check",
      category: "Geographic Risk",
      status: "Active",
      riskLevel: "High",
      threshold: "FATF Tier 3 Countries",
      alertsTriggered: 567,
      lastTriggered: "2025-10-10 14:30:00",
      accuracy: 95,
      falsePositiveRate: 5,
      description: "Monitors transactions involving high-risk jurisdictions",
    },
    {
      id: "RULE-004",
      ruleName: "Rapid Fund Movement",
      category: "Velocity Check",
      status: "Paused",
      riskLevel: "Medium",
      threshold: ">5 transactions in 1 hour",
      alertsTriggered: 892,
      lastTriggered: "2025-10-09 18:15:00",
      accuracy: 78,
      falsePositiveRate: 22,
      description: "Identifies unusually rapid transaction sequences",
    },
    {
      id: "RULE-005",
      ruleName: "Crypto-to-Fiat Conversion",
      category: "Crypto Monitoring",
      status: "Active",
      riskLevel: "High",
      threshold: ">$5,000",
      alertsTriggered: 445,
      lastTriggered: "2025-10-10 12:10:00",
      accuracy: 89,
      falsePositiveRate: 11,
      description: "Monitors large cryptocurrency to fiat conversions",
    },
    {
      id: "RULE-006",
      ruleName: "Sanctions List Match",
      category: "Watchlist Screening",
      status: "Active",
      riskLevel: "Critical",
      threshold: "OFAC/UN Match",
      alertsTriggered: 45,
      lastTriggered: "2025-10-10 11:50:00",
      accuracy: 98,
      falsePositiveRate: 2,
      description: "Blocks transactions matching sanctions lists",
    },
    {
      id: "RULE-007",
      ruleName: "PEP Transaction Review",
      category: "Enhanced Due Diligence",
      status: "Active",
      riskLevel: "High",
      threshold: "Any PEP transaction",
      alertsTriggered: 178,
      lastTriggered: "2025-10-10 10:30:00",
      accuracy: 91,
      falsePositiveRate: 9,
      description: "Enhanced monitoring for Politically Exposed Persons",
    },
    {
      id: "RULE-008",
      ruleName: "Round Dollar Amount Detection",
      category: "Pattern Recognition",
      status: "Testing",
      riskLevel: "Low",
      threshold: "Exact multiples of $1000",
      alertsTriggered: 1567,
      lastTriggered: "2025-10-10 14:00:00",
      accuracy: 65,
      falsePositiveRate: 35,
      description: "Flags suspicious round-number transactions",
    },
  ];

  const stats = useMemo(() => {
    const total = rules.length;
    const active = rules.filter((r) => r.status === "Active").length;
    const critical = rules.filter((r) => r.riskLevel === "Critical").length;
    const totalAlerts = rules.reduce((sum, r) => sum + r.alertsTriggered, 0);
    const avgAccuracy = Math.round(
      rules.reduce((sum, r) => sum + r.accuracy, 0) / rules.length
    );

    return { total, active, critical, totalAlerts, avgAccuracy };
  }, [rules]);

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const matchesCategory =
        selectedCategory === "all" || rule.category === selectedCategory;
      return matchesCategory;
    });
  }, [rules, selectedCategory]);

  const getStatusBadgeClasses = (status: string) => {
    const styles = {
      Active: "bg-green-100 text-green-700 border-green-300",
      Paused: "bg-yellow-100 text-yellow-700 border-yellow-300",
      Testing: "bg-blue-100 text-blue-700 border-blue-300",
      Inactive: "bg-gray-100 text-gray-700 border-gray-300",
    };
    return `px-2.5 py-1 rounded-full text-xs font-semibold border ${
      styles[status as keyof typeof styles]
    }`;
  };

  const getRiskBadgeClasses = (risk: string) => {
    const styles = {
      Low: "bg-green-100 text-green-700 border-green-300",
      Medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
      High: "bg-orange-100 text-orange-700 border-orange-300",
      Critical: "bg-red-100 text-red-700 border-red-300",
    };
    return `px-2.5 py-1 rounded-full text-xs font-semibold border ${
      styles[risk as keyof typeof styles]
    }`;
  };

  return (
    <div className="">
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Rules</h1>
          <p className="text-gray-600 text-sm mt-0.5">
            Manage and enforce compliance rules effectively
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-colors text-sm font-medium">
            <ICONS.Plus size={16} />
            <span>Create Rule</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <SummaryCard
          title="Total Rules"
          value={stats.total}
          mainColor="blue"
          icon={ICONS.Shield}
          bottomLabel="Configured rules"
        />
        <SummaryCard
          title="Active Rules"
          value={stats.active}
          mainColor="green"
          icon={ICONS.CheckCircle}
          bottomLabel="Currently enforcing"
        />
        <SummaryCard
          title="Total Alerts"
          value={`${(stats.totalAlerts / 1000).toFixed(1)}K`}
          mainColor="orange"
          icon={ICONS.AlertTriangle}
          trend="+12%"
          trendColor="orange"
          bottomLabel="Triggered this month"
        />
        <SummaryCard
          title="Avg Accuracy"
          value={`${stats.avgAccuracy}%`}
          mainColor="purple"
          icon={ICONS.TrendingUp}
          bottomLabel="Detection rate"
        />
      </div>

      {/* Rule Performance Overview */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Rule Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1 font-medium">
              Transaction Monitoring
            </div>
            <div className="text-gray-900 font-bold text-lg">
              {
                rules.filter((r) => r.category === "Transaction Monitoring")
                  .length
              }
            </div>
            <div className="text-gray-600 text-xs mt-1">
              {
                rules.filter(
                  (r) =>
                    r.category === "Transaction Monitoring" &&
                    r.status === "Active"
                ).length
              }{" "}
              active
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1 font-medium">
              Pattern Recognition
            </div>
            <div className="text-gray-900 font-bold text-lg">
              {rules.filter((r) => r.category === "Pattern Recognition").length}
            </div>
            <div className="text-gray-600 text-xs mt-1">
              {
                rules.filter(
                  (r) =>
                    r.category === "Pattern Recognition" &&
                    r.status === "Active"
                ).length
              }{" "}
              active
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1 font-medium">
              Watchlist Screening
            </div>
            <div className="text-gray-900 font-bold text-lg">
              {rules.filter((r) => r.category === "Watchlist Screening").length}
            </div>
            <div className="text-gray-600 text-xs mt-1">
              {
                rules.filter(
                  (r) =>
                    r.category === "Watchlist Screening" &&
                    r.status === "Active"
                ).length
              }{" "}
              active
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1 font-medium">
              Geographic Risk
            </div>
            <div className="text-gray-900 font-bold text-lg">
              {rules.filter((r) => r.category === "Geographic Risk").length}
            </div>
            <div className="text-gray-600 text-xs mt-1">
              {
                rules.filter(
                  (r) =>
                    r.category === "Geographic Risk" && r.status === "Active"
                ).length
              }{" "}
              active
            </div>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="flex gap-2 flex-wrap">
          {[
            "all",
            "Transaction Monitoring",
            "Pattern Recognition",
            "Geographic Risk",
            "Watchlist Screening",
            "Crypto Monitoring",
            "Enhanced Due Diligence",
          ].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${
                selectedCategory === category
                  ? "bg-[#1A5276] text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
              }`}
            >
              {category === "all" ? "All Rules" : category}
            </button>
          ))}
        </div>
      </div>

      {/* Rules List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-12 space-y-3">
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 flex-wrap gap-2 mb-2">
                    <span className="text-gray-900 font-semibold text-lg">
                      {rule.id}
                    </span>
                    <span className={getStatusBadgeClasses(rule.status)}>
                      {rule.status.toUpperCase()}
                    </span>
                    <span className={getRiskBadgeClasses(rule.riskLevel)}>
                      Risk: {rule.riskLevel}
                    </span>
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-700 border border-purple-300 rounded-full text-xs font-semibold">
                      {rule.category}
                    </span>
                  </div>
                  <h3 className="text-gray-900 font-semibold text-base mb-2">
                    {rule.ruleName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {rule.description}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 flex-wrap">
                    <span className="flex items-center">
                      <ICONS.Target size={14} className="mr-1" />
                      Threshold: {rule.threshold}
                    </span>
                    <span className="flex items-center">
                      <ICONS.Clock size={14} className="mr-1" />
                      Last: {rule.lastTriggered}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-gray-600 text-xs mb-1 font-medium">
                    Alerts Triggered
                  </div>
                  <div className="text-gray-900 font-bold text-lg">
                    {rule.alertsTriggered.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-gray-600 text-xs mb-1 font-medium">
                    Accuracy Rate
                  </div>
                  <div
                    className={`font-bold text-lg ${
                      rule.accuracy >= 90
                        ? "text-green-600"
                        : rule.accuracy >= 75
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {rule.accuracy}%
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-gray-600 text-xs mb-1 font-medium">
                    False Positive Rate
                  </div>
                  <div
                    className={`font-bold text-lg ${
                      rule.falsePositiveRate <= 10
                        ? "text-green-600"
                        : rule.falsePositiveRate <= 25
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {rule.falsePositiveRate}%
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-gray-600 text-xs mb-1 font-medium">
                    Performance
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-[#1A5276] h-2 rounded-full"
                      style={{ width: `${rule.accuracy}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button className="px-4 py-2 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-all text-sm font-medium flex items-center space-x-1.5">
                  <ICONS.Edit size={16} />
                  <span>Edit Rule</span>
                </button>
                {rule.status === "Active" ? (
                  <button className="px-4 py-2 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-lg hover:bg-yellow-200 transition-all text-sm font-medium">
                    Pause
                  </button>
                ) : rule.status === "Paused" ? (
                  <button className="px-4 py-2 bg-green-100 text-green-700 border border-green-300 rounded-lg hover:bg-green-200 transition-all text-sm font-medium">
                    Activate
                  </button>
                ) : (
                  <button className="px-4 py-2 bg-blue-100 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-200 transition-all text-sm font-medium">
                    Deploy
                  </button>
                )}
                <button className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium">
                  View Analytics
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComplianceRules;
