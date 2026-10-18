"use client";
// TODO: REMOVE USE CLIENT ONEC IT MOVED TO SSR
import SummaryCard from "@/components/layout/SummaryCard";
import { ICONS, TIME_RANGES } from "@/constants/constants";
import { useMemo, useState } from "react";

const FraudAlerts = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const alerts = [
    {
      id: "TXN-2024-001",
      timestamp: "2024-10-10 14:23:15",
      riskLevel: "critical",
      amount: "$45,230",
      sender: "John Anderson",
      recipient: "Unknown Entity",
      type: "Wire Transfer",
      location: "Lagos, Nigeria",
      violations: [
        "Structuring behavior",
        "High-risk jurisdiction",
        "Rapid frequency",
      ],
      aiScore: 94,
      status: "pending",
    },
    {
      id: "TXN-2024-002",
      timestamp: "2024-10-10 13:45:22",
      riskLevel: "high",
      amount: "$12,500",
      sender: "Sarah Mitchell",
      recipient: "Crypto Exchange",
      type: "ACH Transfer",
      location: "Moscow, Russia",
      violations: ["Crypto-to-fiat conversion", "Pattern matching"],
      aiScore: 87,
      status: "pending",
    },
    {
      id: "TXN-2024-003",
      timestamp: "2024-10-10 12:15:08",
      riskLevel: "medium",
      amount: "$8,750",
      sender: "David Chen",
      recipient: "Business Account",
      type: "SWIFT",
      location: "Beijing, China",
      violations: ["Large cash transaction"],
      aiScore: 72,
      status: "under-review",
    },
    {
      id: "TXN-2024-004",
      timestamp: "2024-10-10 11:30:45",
      riskLevel: "high",
      amount: "$23,400",
      sender: "Maria Rodriguez",
      recipient: "Shell Company",
      type: "Wire Transfer",
      location: "Panama City, Panama",
      violations: ["Money laundering pattern", "Rapid frequency"],
      aiScore: 89,
      status: "escalated",
    },
    {
      id: "TXN-2024-005",
      timestamp: "2024-10-10 10:15:30",
      riskLevel: "critical",
      amount: "$67,890",
      sender: "Ahmed Hassan",
      recipient: "Offshore Account",
      type: "Wire Transfer",
      location: "Dubai, UAE",
      violations: ["Structuring behavior", "High-risk jurisdiction"],
      aiScore: 96,
      status: "pending",
    },
    {
      id: "TXN-2024-006",
      timestamp: "2024-10-10 09:42:18",
      riskLevel: "low",
      amount: "$3,250",
      sender: "Emily Parker",
      recipient: "Family Member",
      type: "ACH Transfer",
      location: "New York, USA",
      violations: ["Unusual transaction time"],
      aiScore: 45,
      status: "approved",
    },
  ];

  const alertStats = useMemo(() => {
    const critical = alerts.filter((a) => a.riskLevel === "critical").length;
    const high = alerts.filter((a) => a.riskLevel === "high").length;
    const pending = alerts.filter((a) => a.status === "pending").length;
    const avgScore = Math.round(
      alerts.reduce((sum, a) => sum + a.aiScore, 0) / alerts.length
    );

    return { critical, high, pending, avgScore, total: alerts.length };
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesFilter =
        selectedFilter === "all" || alert.riskLevel === selectedFilter;
      const matchesSearch =
        alert.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.recipient.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [alerts, selectedFilter, searchTerm]);

  const getRiskBadgeClasses = (level: string) => {
    const styles = {
      critical: "bg-red-100 text-red-700 border-red-300",
      high: "bg-orange-100 text-orange-700 border-orange-300",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
      low: "bg-green-100 text-green-700 border-green-300",
    };
    return `px-2.5 py-1 rounded-full text-xs font-semibold border ${
      styles[level as keyof typeof styles]
    }`;
  };

  const getStatusBadgeClasses = (status: string) => {
    const styles = {
      pending: "bg-red-100 text-red-700 border-red-300",
      "under-review": "bg-yellow-100 text-yellow-700 border-yellow-300",
      escalated: "bg-orange-100 text-orange-700 border-orange-300",
      approved: "bg-green-100 text-green-700 border-green-300",
    };
    return `px-2.5 py-1 rounded-full text-xs font-semibold border ${
      styles[status as keyof typeof styles]
    }`;
  };

  const handleBulkAction = (action: string) => {
    console.log(`Performing ${action} on ${selectedAlerts.length} alerts`);
    setSelectedAlerts([]);
  };

  const toggleSelectAll = () => {
    if (selectedAlerts.length === filteredAlerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(filteredAlerts.map((a) => a.id));
    }
  };

  return (
    <div className="">
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fraud Alert List</h1>
          <p className="text-gray-600 text-sm mt-0.5">
            Real-time monitoring of flagged transactions • Last updated: 2m ago
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
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="flex items-center space-x-1.5 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            <ICONS.Filter size={16} />
            <span>Filters</span>
          </button>
          <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-colors text-sm font-medium">
            <ICONS.Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <SummaryCard
          title="Total Alerts"
          value={alertStats.total}
          mainColor="blue"
          icon={ICONS.AlertTriangle}
          trend={null}
          bottomLabel={`${alertStats.pending} pending review`}
          bottomBadge={null}
        />
        <SummaryCard
          title="Critical Risk"
          value={alertStats.critical}
          mainColor="red"
          icon={ICONS.AlertCircle}
          trend="+3"
          trendColor="red"
          bottomLabel="Requires immediate action"
          bottomBadge={null}
        />
        <SummaryCard
          title="High Priority"
          value={alertStats.high}
          mainColor="orange"
          icon={ICONS.Bell}
          trend="+2"
          trendColor="orange"
          bottomLabel="Under investigation"
          bottomBadge={null}
        />
        <SummaryCard
          title="Avg AI Score"
          value={alertStats.avgScore}
          mainColor="green"
          icon={ICONS.TrendingUp}
          trend="+5%"
          trendColor="green"
          bottomLabel="Detection accuracy"
          bottomBadge={null}
        />
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <ICONS.Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by Transaction ID, Customer Name, or Recipient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1A5276] focus:border-transparent"
            />
          </div>

          {/* Risk Level Filter */}
          <div className="flex gap-2 flex-wrap">
            {["all", "critical", "high", "medium", "low"].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedFilter(level)}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${
                  selectedFilter === level
                    ? "bg-[#1A5276] text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedAlerts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
            <span className="text-gray-900 font-medium flex items-center">
              <ICONS.CheckCircle size={18} className="mr-2 text-blue-600" />
              {selectedAlerts.length} alert
              {selectedAlerts.length > 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleBulkAction("approve")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium flex items-center space-x-1.5"
              >
                <ICONS.CheckCircle size={16} />
                <span>Approve All</span>
              </button>
              <button
                onClick={() => handleBulkAction("escalate")}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all text-sm font-medium flex items-center space-x-1.5"
              >
                <ICONS.AlertTriangle size={16} />
                <span>Escalate All</span>
              </button>
              <button
                onClick={() => handleBulkAction("dismiss")}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-medium flex items-center space-x-1.5"
              >
                <ICONS.XCircle size={16} />
                <span>Dismiss All</span>
              </button>
              <button
                onClick={() => setSelectedAlerts([])}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all text-sm font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Main Alert List - Full Width */}
        <div className="lg:col-span-12 space-y-3">
          {/* Select All Header */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    selectedAlerts.length === filteredAlerts.length &&
                    filteredAlerts.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-[#1A5276] focus:ring-[#1A5276]"
                />
                <span className="text-sm font-medium text-gray-700">
                  Select All ({filteredAlerts.length} alerts)
                </span>
              </label>
              <span className="text-sm text-gray-600">
                Showing {filteredAlerts.length} of {alerts.length} alerts
              </span>
            </div>
          </div>

          {/* Alert Cards */}
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedAlerts.includes(alert.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAlerts([...selectedAlerts, alert.id]);
                      } else {
                        setSelectedAlerts(
                          selectedAlerts.filter((id) => id !== alert.id)
                        );
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-[#1A5276] focus:ring-[#1A5276] mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 flex-wrap gap-2">
                      <span className="text-gray-900 font-semibold text-lg">
                        {alert.id}
                      </span>
                      <span className={getRiskBadgeClasses(alert.riskLevel)}>
                        {alert.riskLevel.toUpperCase()}
                      </span>
                      <span className={getStatusBadgeClasses(alert.status)}>
                        {alert.status.toUpperCase().replace("-", " ")}
                      </span>
                      <span className="px-2.5 py-1 bg-purple-100 text-purple-700 border border-purple-300 rounded-full text-xs font-semibold">
                        AI: {alert.aiScore}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 flex-wrap">
                      <span className="flex items-center">
                        <ICONS.Clock size={14} className="mr-1" />
                        {alert.timestamp}
                      </span>
                      <span className="flex items-center">
                        <ICONS.MapPin size={14} className="mr-1" />
                        {alert.location}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-gray-600 text-xs mb-1 font-medium">
                    Amount
                  </div>
                  <div className="text-gray-900 font-bold text-lg flex items-center">
                    <ICONS.DollarSign
                      size={18}
                      className="mr-1 text-green-600"
                    />
                    {alert.amount}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-gray-600 text-xs mb-1 font-medium">
                    Sender
                  </div>
                  <div className="text-gray-900 font-semibold flex items-center text-sm">
                    <ICONS.User size={16} className="mr-1 text-blue-600" />
                    {alert.sender}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-gray-600 text-xs mb-1 font-medium">
                    Type
                  </div>
                  <div className="text-gray-900 font-semibold flex items-center text-sm">
                    <ICONS.TrendingUp
                      size={16}
                      className="mr-1 text-purple-600"
                    />
                    {alert.type}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-gray-600 text-xs mb-2 font-medium">
                  AML Rule Violations:
                </div>
                <div className="flex flex-wrap gap-2">
                  {alert.violations.map((violation, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium"
                    >
                      {violation}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 flex-wrap gap-2">
                <button className="px-4 py-2 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-all text-sm font-medium flex items-center space-x-1.5">
                  <ICONS.Eye size={16} />
                  <span>View Details</span>
                </button>
                <button className="px-4 py-2 bg-orange-100 text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-200 transition-all text-sm font-medium flex items-center space-x-1.5">
                  <ICONS.AlertTriangle size={16} />
                  <span>Escalate</span>
                </button>
                <button className="px-4 py-2 bg-green-100 text-green-700 border border-green-300 rounded-lg hover:bg-green-200 transition-all text-sm font-medium flex items-center space-x-1.5">
                  <ICONS.CheckCircle size={16} />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          ))}

          {/* No Results State */}
          {filteredAlerts.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <ICONS.AlertCircle
                size={48}
                className="mx-auto text-gray-400 mb-4"
              />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No alerts found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FraudAlerts;
