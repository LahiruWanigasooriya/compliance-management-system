"use client";

import { useState, useEffect, useMemo } from "react";
import { ICONS } from "@/constants/constants";
import { getCaseHistory, CaseHistoryRecord } from "@/actions/customer-risk.actions";
import CopyableText from "@/components/common/copyable-text/CopyableText";
import LoadingOverlay from "@/components/layout/LoadingOverlay";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { getStatusOptionLabel } from "@/utils/statusHelpers";

const CASE_HISTORY_STATUS_PLACEHOLDER = "All Status";
const CASE_HISTORY_STATUS_OPTIONS = [
  { value: "status_all", label: CASE_HISTORY_STATUS_PLACEHOLDER },
  { value: "pending_review", label: "Pending Review" },
  { value: "in_progress", label: "In Progress" },
  { value: "escalated", label: "Escalated" },
  { value: "sar_filed", label: "SAR Filed" },
  { value: "closed", label: "Closed" },
];

const CASE_HISTORY_CATEGORY_PLACEHOLDER = "All Categories";
const CASE_HISTORY_CATEGORY_OPTIONS = [
  { value: "category_all", label: CASE_HISTORY_CATEGORY_PLACEHOLDER },
  { value: "watchlist", label: "Watchlist" },
  { value: "fraud", label: "Fraud" },
  { value: "geolocation", label: "Geolocation" },
  { value: "kyc", label: "KYC" },
];

interface CaseHistorySectionProps {
  profileId: string;
}

export default function CaseHistorySection({ profileId }: CaseHistorySectionProps) {
  const [cases, setCases] = useState<CaseHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showAll, setShowAll] = useState(false);
  const currentCategoryOption = useMemo(
    () =>
      CASE_HISTORY_CATEGORY_OPTIONS.find(
        (option) =>
          option.value ===
          (selectedCategory ? selectedCategory.toLowerCase() : "category_all"),
      ),
    [selectedCategory],
  );
  const currentStatusOption = useMemo(
    () =>
      CASE_HISTORY_STATUS_OPTIONS.find(
        (option) =>
          option.value === (selectedStatus ? selectedStatus : "status_all"),
      ),
    [selectedStatus],
  );

  const fetchCases = async () => {
    setLoading(true);
    try {
      const filter: any = {
        profile_id: profileId,
        limit: showAll ? 100 : 10,
      };

      if (selectedCategory) filter.category = [selectedCategory];
      if (selectedStatus) filter.status = [selectedStatus];

      const response = await getCaseHistory(filter);

      if (response.success) {
        setCases(response.data.records);
      }
    } catch (error) {
      console.error("Error fetching case history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [profileId, selectedCategory, selectedStatus, showAll]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending_review":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300";
      case "in_progress":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300";
      case "escalated":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-300";
      case "sar_filed":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300";
      case "closed":
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "watchlist":
        return <ICONS.Shield size={16} />;
      case "fraud":
        return <ICONS.AlertTriangle size={16} />;
      case "geolocation":
        return <ICONS.MapPin size={16} />;
      case "kyc":
        return <ICONS.FileText size={16} />;
      default:
        return <ICONS.FileText size={16} />;
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const displayedCases = showAll ? cases : cases.slice(0, 5);

  if (loading && cases.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <ICONS.Briefcase size={20} />
          Case History
        </h2>
        <div className="relative py-8 min-h-[100px]">
          <LoadingOverlay loadingText="Loading case history..." />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
      {/* Header with Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ICONS.Briefcase size={20} />
          Case History
        </h2>
        <div className="flex items-center gap-2">
          <Select
            value={selectedCategory || "category_all"}
            onValueChange={(value) =>
              setSelectedCategory(
                value && value !== "category_all" ? value : "",
              )
            }
          >
            <SelectTrigger className="w-fit rounded-lg border border-panel-border px-3 text-sm font-semibold text-foreground">
              <SelectValue placeholder={CASE_HISTORY_CATEGORY_PLACEHOLDER}>
                {currentCategoryOption
                  ? currentCategoryOption.label
                  : CASE_HISTORY_CATEGORY_PLACEHOLDER}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-card border border-panel-border z-50">
              {CASE_HISTORY_CATEGORY_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedStatus || "status_all"}
            onValueChange={(value) =>
              setSelectedStatus(value && value !== "status_all" ? value : "")
            }
          >
            <SelectTrigger className="w-fit rounded-lg border border-panel-border px-3 text-sm font-semibold text-foreground">
              <SelectValue placeholder={CASE_HISTORY_STATUS_PLACEHOLDER}>
                {currentStatusOption
                  ? getStatusOptionLabel(
                      currentStatusOption.value,
                      currentStatusOption.label,
                    )
                  : CASE_HISTORY_STATUS_PLACEHOLDER}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-card border border-panel-border z-50">
              {CASE_HISTORY_STATUS_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  {getStatusOptionLabel(option.value, option.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {cases.length === 0 ? (
        <div className="text-center py-12">
          <ICONS.Briefcase size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-muted-foreground">No cases found for this profile</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {displayedCases.map((caseRecord) => (
              <div
                key={caseRecord.id}
                className="p-4 border border-panel-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2">
                    <div className="mt-1">{getCategoryIcon(caseRecord.category)}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">
                          <CopyableText
                            text={caseRecord.case_number}
                            textClassName="font-semibold text-foreground"
                          />
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(
                            caseRecord.category
                          )}`}
                        >
                          {caseRecord.category}
                        </span>
                      </div>
                      <p className="text-sm text-foreground font-medium">
                        {caseRecord.title}
                      </p>
                      {caseRecord.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {caseRecord.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(
                        caseRecord.priority
                      )}`}
                    >
                      {caseRecord.priority}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                        caseRecord.status
                      )}`}
                    >
                      {formatStatus(caseRecord.status)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(caseRecord.created_at)}</p>
                  </div>
                  {caseRecord.resolved_at && (
                    <div>
                      <p className="text-muted-foreground">Resolved</p>
                      <p className="font-medium">{formatDate(caseRecord.resolved_at)}</p>
                    </div>
                  )}
                  {caseRecord.assigned_to && (
                    <div>
                      <p className="text-muted-foreground">Assigned To</p>
                      <p className="font-medium">{caseRecord.assigned_to}</p>
                    </div>
                  )}
                  {caseRecord.source_service && (
                    <div>
                      <p className="text-muted-foreground">Source</p>
                      <p className="font-medium">{caseRecord.source_service}</p>
                    </div>
                  )}
                </div>

                {caseRecord.notes && (
                  <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      <span className="font-semibold">Notes: </span>
                      {caseRecord.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {cases.length > 5 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-sm text-primary hover:underline"
              >
                {showAll ? "Show Less" : `Show All Cases (${cases.length})`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Helper function for category colors
function getCategoryColor(category: string) {
  switch (category.toLowerCase()) {
    case "watchlist":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300";
    case "fraud":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-300";
    case "geolocation":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300";
    case "kyc":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300";
  }
}
