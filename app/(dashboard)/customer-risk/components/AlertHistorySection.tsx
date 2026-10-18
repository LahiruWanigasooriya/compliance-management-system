"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ICONS } from "@/constants/constants";
import { CustomerAlert, AlertCategory, CaseStatus } from "@/types/customer-risk.types";

interface AlertHistorySectionProps {
  alerts: CustomerAlert[];
}

const AlertHistorySection = ({ alerts }: AlertHistorySectionProps) => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<AlertCategory | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus | "all">("all");
  const [showAll, setShowAll] = useState(false);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate category summaries
  const categorySummary = useMemo(() => {
    const categories: AlertCategory[] = ["Watchlist Screening", "Fraud", "Geolocation", "KYC Verification"];
    return categories.map((category) => {
      const categoryAlerts = alerts.filter((a) => a.category === category);
      return {
        category,
        totalCount: categoryAlerts.length,
        activeCount: categoryAlerts.filter((a) => a.status === "Active").length,
        underReviewCount: categoryAlerts.filter((a) => a.status === "Under Review").length,
        resolvedCount: categoryAlerts.filter((a) => a.status === "Resolved" || a.status === "Resolved: False Positive").length,
      };
    });
  }, [alerts]);

  // Filter alerts based on selections
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesCategory = selectedCategory === "all" || alert.category === selectedCategory;
      const matchesStatus = selectedStatus === "all" || alert.status === selectedStatus;
      return matchesCategory && matchesStatus;
    });
  }, [alerts, selectedCategory, selectedStatus]);

  const displayedAlerts = showAll ? filteredAlerts : filteredAlerts.slice(0, 5);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case "High":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "Low":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: CaseStatus) => {
    switch (status) {
      case "Active":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case "Under Review":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "Blocked":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "Resolved":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "Resolved: False Positive":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    }
  };

  const getCategoryIcon = (category: AlertCategory) => {
    switch (category) {
      case "Watchlist Screening":
        return <ICONS.Shield size={16} />;
      case "Fraud":
        return <ICONS.AlertTriangle size={16} />;
      case "Geolocation":
        return <ICONS.MapPin size={16} />;
      case "KYC Verification":
        return <ICONS.UserCheck size={16} />;
      default:
        return <ICONS.AlertCircle size={16} />;
    }
  };

  const handleViewAlert = (alert: CustomerAlert) => {
    // Navigate to respective dashboard based on category
    switch (alert.category) {
      case "Fraud":
        router.push("/fraud-alerts");
        break;
      case "Geolocation":
        router.push("/geolocation/alerts");
        break;
      case "KYC Verification":
        router.push("/kyc");
        break;
      case "Watchlist Screening":
        router.push("/watchlist");
        break;
      default:
        break;
    }
  };

  return (
    <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <ICONS.History size={20} />
        Alert & Case History
      </h2>

      {/* Category Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {categorySummary.map((summary) => (
          <button
            key={summary.category}
            onClick={() => setSelectedCategory(selectedCategory === summary.category ? "all" : summary.category)}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              selectedCategory === summary.category
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-panel-border hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {getCategoryIcon(summary.category)}
              <span className="text-xs font-medium truncate">{summary.category}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-xl font-bold">{summary.totalCount}</span>
              {summary.activeCount > 0 && (
                <span className="text-xs text-red-600 font-medium">{summary.activeCount} active</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["all", "Active", "Under Review", "Blocked", "Resolved"].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status as CaseStatus | "all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              selectedStatus === status
                ? "bg-[#1A5276] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {status === "all" ? "All Statuses" : status}
          </button>
        ))}
      </div>

      {/* Alert List */}
      {filteredAlerts.length === 0 ? (
        <div className="text-center py-8">
          <ICONS.CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
          <p className="text-sm text-muted-foreground">No alerts found for the selected filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 border border-panel-border rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(alert.category)}
                  <span className="font-medium">{alert.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(alert.status)}`}>
                    {alert.status}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>

              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>{alert.category}</span>
                  <span>Created: {formatDateTime(alert.createdAt)}</span>
                  {alert.assignedTo && <span>Assigned: {alert.assignedTo}</span>}
                </div>
                <button
                  onClick={() => handleViewAlert(alert)}
                  className="text-blue-600 hover:underline font-medium cursor-pointer"
                >
                  View Details
                </button>
              </div>

              {alert.resolutionNotes && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                  <span className="font-medium text-green-700 dark:text-green-300">Resolution: </span>
                  <span className="text-green-600 dark:text-green-400">{alert.resolutionNotes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {filteredAlerts.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-4 text-center text-sm text-blue-600 hover:underline cursor-pointer"
        >
          {showAll ? "Show Less" : `View All (${filteredAlerts.length} alerts)`}
        </button>
      )}
    </div>
  );
};

export default AlertHistorySection;
