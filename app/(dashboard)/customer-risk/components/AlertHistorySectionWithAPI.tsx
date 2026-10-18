"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ICONS } from "@/constants/constants";
import { getAlertHistory } from "@/actions/customer-risk.actions";
import type { AlertHistoryAPI } from "@/types/customer-risk.types";
import LoadingOverlay from "@/components/layout/LoadingOverlay";

interface AlertHistorySectionWithAPIProps {
  profileId: string;
}

const AlertHistorySectionWithAPI = ({ profileId }: AlertHistorySectionWithAPIProps) => {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertHistoryAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<string | "all">("all");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchAlertHistory = async () => {
      setLoading(true);
      try {
        const response = await getAlertHistory({
          profile_id: profileId,
          limit: 50,
        });

        if (response.success && response.data.records) {
          setAlerts(response.data.records);
        }
      } catch (error) {
        console.error("Error fetching alert history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlertHistory();
  }, [profileId]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate type summaries
  const typeSummary = useMemo(() => {
    const types = ["fraud", "aml", "geo", "kyc", "watchlist"];
    return types.map((type) => {
      const typeAlerts = alerts.filter((a) => a.alert_type === type);
      return {
        type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
        totalCount: typeAlerts.length,
        activeCount: typeAlerts.filter((a) => a.status === "active").length,
        underReviewCount: typeAlerts.filter((a) => a.status === "under_review").length,
        resolvedCount: typeAlerts.filter((a) => a.status === "resolved" || a.status === "false_positive").length,
      };
    });
  }, [alerts]);

  // Filter alerts based on selections
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesType = selectedType === "all" || alert.alert_type === selectedType;
      const matchesStatus = selectedStatus === "all" || alert.status === selectedStatus;
      return matchesType && matchesStatus;
    });
  }, [alerts, selectedType, selectedStatus]);

  const displayedAlerts = showAll ? filteredAlerts : filteredAlerts.slice(0, 5);

  const getSeverityColor = (severity: string) => {
    const normalized = severity.toLowerCase();
    switch (normalized) {
      case "critical":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case "high":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "low":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case "under_review":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "resolved":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "false_positive":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "watchlist":
        return <ICONS.Shield size={16} />;
      case "fraud":
        return <ICONS.AlertTriangle size={16} />;
      case "geo":
        return <ICONS.MapPin size={16} />;
      case "kyc":
        return <ICONS.UserCheck size={16} />;
      case "aml":
        return <ICONS.DollarSign size={16} />;
      default:
        return <ICONS.AlertCircle size={16} />;
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <ICONS.History size={20} />
          Alert History
        </h2>
        <div className="relative py-12 min-h-[120px]">
          <LoadingOverlay loadingText="Loading alert history..." />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <ICONS.History size={20} />
        Alert History
      </h2>

      {/* Type Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {typeSummary.map((summary) => (
          <button
            key={summary.type}
            onClick={() => setSelectedType(selectedType === summary.type ? "all" : summary.type)}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              selectedType === summary.type
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-panel-border hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {getTypeIcon(summary.type)}
              <span className="text-xs font-medium truncate">{summary.label}</span>
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
        {["all", "active", "under_review", "resolved", "false_positive"].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              selectedStatus === status
                ? "bg-[#1A5276] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {status === "all" ? "All Statuses" : formatStatus(status)}
          </button>
        ))}
      </div>

      {/* Alert List */}
      {filteredAlerts.length === 0 ? (
        <div className="text-center py-8">
          <ICONS.CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
          <p className="text-sm text-muted-foreground">
            {alerts.length === 0 ? "No alert history available" : "No alerts found for the selected filters"}
          </p>
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
                  {getTypeIcon(alert.alert_type)}
                  <span className="font-medium">{alert.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(alert.status)}`}>
                    {formatStatus(alert.status)}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>

              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    {getTypeIcon(alert.alert_type)}
                    {alert.alert_type.toUpperCase()}
                  </span>
                  <span>Created: {formatDateTime(alert.created_at)}</span>
                  {alert.source_service && <span>Source: {alert.source_service}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {alert.linked_case_id && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs">
                      Case Linked
                    </span>
                  )}
                  <span className="font-medium">Risk: {alert.risk_score}</span>
                </div>
              </div>

              {alert.notes && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                  <span className="font-medium">Notes: </span>
                  <span className="text-muted-foreground">{alert.notes}</span>
                </div>
              )}

              {alert.resolved_at && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                  <span className="font-medium text-green-700 dark:text-green-300">
                    Resolved: {formatDateTime(alert.resolved_at)}
                  </span>
                  {alert.resolved_by && (
                    <span className="text-green-600 dark:text-green-400 ml-2">
                      by {alert.resolved_by}
                    </span>
                  )}
                  {alert.resolution && (
                    <span className="ml-2 px-2 py-0.5 bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200 rounded text-xs">
                      {formatStatus(alert.resolution)}
                    </span>
                  )}
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

export default AlertHistorySectionWithAPI;
