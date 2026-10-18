"use client";
import { ICONS } from "@/constants/constants";
import { alertTypeLabels } from "@/constants/geolocation.constants";
import { Suspense, useEffect, useState } from "react";
import GeoLocationFilterModal from "./modals/GeoLocationFilterModal";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FilterArea from "@/components/ui/filter-area";
import { FilterProps } from "@/types/common.types";
import { AlertTypes, GeoAlert, GetGeoParams } from "@/types/geolocation.types";
import {
  formatLocation,
  parseNotes,
  getDateFromTimeFrame,
  toParamString,
} from "@/utils/format";
import { convertDate } from "@/utils/convertDate";
import { Calendar, ChevronDown, RefreshCw } from "lucide-react";
import PaginationControls, {
  getTotalPages,
} from "@/components/ui/PaginationControls";
import { toast } from "sonner";
import { useGeoLocation } from "@/hooks/useGeolocationAlerts";
import EmptyResult from "@/components/common/empty-result/EmptyResult";
import LoadingOverlay from "@/components/layout/LoadingOverlay";
import CopyableText from "@/components/common/copyable-text/CopyableText";
import GeoConfirmationModal from "./modals/GeoConfirmationModal";
import GeoExportModal from "./modals/GeoExportModal";
import SavedFilterManager from "@/components/common/SavedFilterManager";
import { SavedFilter } from "@/types/filter.types";
import { useTenant } from "@/components/providers/tenant.provider";
import { usePermissions } from "@/hooks/usepermissions";
import Loader from "@/components/ui/loader/Loader";
import {
  getGeoAlertTypeBadgeClasses,
  getRiskBadgeClasses,
  getScoreBadgeClasses,
  getStatusBadgeClasses,
} from "@/utils/kyc/badgeClasses";
import { getStatusWithIcon } from "@/utils/statusHelpers";

const GeolocationAlertPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] =
    useState<boolean>(false);
  const [selectedAlert, setSelectedAlert] = useState<GeoAlert | null>();
  const [appliedFilters, setAppliedFilters] = useState<Array<FilterProps>>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showAllAlertTypes, setShowAllAlertTypes] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState(10);
  const [metricsTimeRange, setMetricsTimeRange] = useState("30d");
  const [queryParams, setQueryParams] = useState<GetGeoParams>({
    page: 1,
    limit: pageSize,
  });

  const timeRangeOptions = [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
  ];

  const {
    geoAlerts: alerts,
    total,
    currentPage,
    geoAlertMetrics,
    downloadAllGeoAlertsMutation,
    loading,
    metricsLoading,
    updateGeoAlertStatusMutation,
    isFetching,
    isRefetching,
    dataUpdatedAt,
    refresh,
  } = useGeoLocation(queryParams, setQueryParams, undefined, metricsTimeRange);
  const { isSwitchingTenant } = useTenant();
  const permissions = usePermissions();
  const filterState = {
    searchTerm,
    selectedRiskLevel: appliedFilters
      .filter((f) => f.type === "riskLevel")
      .map((f) => f.value as string),
    selectedCategory: appliedFilters
      .filter((f) => f.type === "jurisdictionType")
      .map((f) => f.value as string),
    selectedStatus: appliedFilters
      .filter((f) => f.type === "alertStatus")
      .map((f) => f.value as string),
    selectedTimeRange: appliedFilters.find((f) => f.type === "alertTimeFrame")
      ?.value as string,
    selectedAssignedFor: appliedFilters
      .filter((f) => f.type === "alertStatus")
      .map((f) => f.value as string),
  };

  const filterSetters = {
    setSearchTerm,
  };
  const applySavedGeoFilter = (savedFilter: SavedFilter) => {
    const nextFilters: {
      riskLevels: string[];
      alertStatuses: string[];
      jurisdictionTypes: string[];
      alertTimeFrame: string;
      alertAssignees: string[];
    } = {
      riskLevels: [],
      alertStatuses: [],
      jurisdictionTypes: [],
      alertTimeFrame: "",
      alertAssignees: [],
    };

    savedFilter.values.forEach((v) => {
      switch (v.field) {
        case "risk_level":
          nextFilters.riskLevels = v.value as string[];
          break;

        case "status":
          nextFilters.alertStatuses = v.value as string[];
          break;

        case "jurisdiction":
          nextFilters.jurisdictionTypes = v.value as string[];
          break;

        case "time_filter":
          nextFilters.alertTimeFrame = v.value as string;
          break;

        case "assigned_for":
          nextFilters.alertAssignees = v.value as string[];
      }
    });

    handleApplyFilters(nextFilters);
  };

  const handleFiltersClick = () => {
    setIsFilterModalOpen(true);
  };

  const handleViewAlertDetails = (alert: GeoAlert) => {
    router.push(`/geolocation/alerts/${alert.id}`);
  };

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    setQueryParams({ page: 1, limit: pageSize, search: query });
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== "") {
        handleSearch(searchTerm);
      } else {
        setQueryParams({ page: 1, limit: pageSize });
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleExport = async (type: "pdf" | "csv" | "json") => {
    setExporting(true);
    try {
      await downloadAllGeoAlertsMutation.mutateAsync({ type });
      toast.success("Geo alerts report downloaded successfully.");
      setShowExportModal(false);
    } catch (error) {
      console.error("Downloading geo alert report failed", error);
      toast.error("Unable to download all geo alerts report.");
    } finally {
      setExporting(false);
    }
  };

  const handleRemoveFilter = (filterId: string) => {
    const updatedFilters = appliedFilters.filter(
      (filter) => filter.id !== filterId,
    );
    setAppliedFilters(updatedFilters);

    const filterParams: GetGeoParams = {};

    updatedFilters.forEach((filter) => {
      const value = toParamString(filter.value);
      if (filter.type === "alertAssignee") {
        filterParams.assigned_to_list = value;
      } else if (filter.type === "riskLevel") {
        filterParams.severities = value;
      } else if (filter.type === "alertStatus") {
        filterParams.statuses = value;
      } else if (filter.type === "jurisdictionType") {
        filterParams.jurisdiction_categories = value;
      } else if (filter.type === "alertTimeFrame") {
        filterParams.date_from = getDateFromTimeFrame(value);
      }
    });
    if (
      !filterParams.statuses &&
      !filterParams.severities &&
      !filterParams.assigned_to_list &&
      !filterParams.date_from &&
      !filterParams.jurisdiction_categories
    ) {
      setQueryParams({ page: 1, limit: pageSize });
    } else {
      setQueryParams({ page: 1, limit: pageSize, ...filterParams });
    }
  };

  const handleClearAllFilters = () => {
    setAppliedFilters([]);
    setQueryParams({ page: 1, limit: pageSize });
  };

  const handleApplyFilters = (filters: {
    alertAssignees: string[];
    alertAssigneeNames?: string[];
    riskLevels: string[];
    alertStatuses: string[];
    jurisdictionTypes: string[];
    alertTimeFrame: string;
  }) => {
    const newFilters: FilterProps[] = [];
    const filterParams: GetGeoParams = {};
    if (filters.alertAssignees && filters.alertAssignees.length > 0) {
      newFilters.push({
        id: "alertAssignee",
        type: "alertAssignee",
        label: "Alert Assignee",
        value: filters.alertAssignees,
        displayValue: filters.alertAssigneeNames?.join(", ") ?? "",
      });
      filterParams.assigned_to_list = filters.alertAssignees.join(",");
    }
    if (filters.riskLevels && filters.riskLevels.length > 0) {
      newFilters.push({
        id: "riskLevel",
        type: "riskLevel",
        label: "Risk Level",
        value: filters.riskLevels,
        displayValue: filters.riskLevels.join(", "),
      });
      filterParams.severities = filters.riskLevels.join(",");
    }
    if (filters.alertStatuses && filters.alertStatuses.length > 0) {
      newFilters.push({
        id: "alertStatus",
        type: "alertStatus",
        label: "Alert Status",
        value: filters.alertStatuses,
        displayValue: filters.alertStatuses.join(", "),
      });
      filterParams.statuses = filters.alertStatuses.join(",");
    }
    if (filters.jurisdictionTypes && filters.jurisdictionTypes.length > 0) {
      newFilters.push({
        id: "jurisdictionType",
        type: "jurisdictionType",
        label: "Jurisdiction Type",
        value: filters.jurisdictionTypes,
        displayValue: filters.jurisdictionTypes.join(", "),
      });
      filterParams.jurisdiction_categories = filters.jurisdictionTypes.join(",");
    }
    if (filters.alertTimeFrame) {
      newFilters.push({
        id: "alertTimeFrame",
        type: "alertTimeFrame",
        label: "Alert Time Frame",
        value: filters.alertTimeFrame,
        displayValue: filters.alertTimeFrame,
      });
      filterParams.date_from = getDateFromTimeFrame(filters.alertTimeFrame);
    }
    setAppliedFilters(newFilters);
    setQueryParams({ page: 1, limit: pageSize, ...filterParams });
  };

  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setQueryParams((prev) => ({ ...prev, limit: size }));
  };

  const handleUpdateAlertStatus = async (id: string) => {
    try {
      await updateGeoAlertStatusMutation.mutateAsync({
        alertId: id,
        status: "in_progress",
      });
      toast.success(`Geo alert ${id} status updated successfully.`);
    } catch (error) {
      console.error("Updating geo alert status failed", error);
      toast.error("Unable to update geo alert status.");
    } finally {
      setIsConfirmationModalOpen(false);
    }
  };

  // Don't show individual page loader during tenant switch - the global overlay handles it
  if (metricsLoading && !isSwitchingTenant) {
    return (
      <LoadingOverlay
        className="-inset-4!"
        loadingText="Loading Geo Location Alerts..."
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">
              Geolocation Alerts
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-muted-foreground text-sm dark:text-gray-400">
                Monitor customer alerts and prevent suspicious behavior
              </p>
              |
              {dataUpdatedAt > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  {isRefetching && (
                    <RefreshCw size={10} className="animate-spin" />
                  )}
                  <span className="hidden sm:inline">
                    Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
                  </span>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              onClick={refresh}
              disabled={isFetching}
              className="p-2 cursor-pointer rounded-lg border border-panel-border bg-card hover:bg-card/70 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw
                size={16}
                className={`text-muted-foreground ${isFetching ? "animate-spin" : ""}`}
              />
            </button>
            <div className="relative">
              <select
                value={metricsTimeRange}
                onChange={(e) => setMetricsTimeRange(e.target.value)}
                className="appearance-none pl-9 pr-8 py-2 rounded-lg border border-panel-border bg-card text-sm font-medium text-foreground cursor-pointer hover:bg-card/70 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {timeRangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <ChevronDown
                size={16}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>
            {permissions.canExportGEO && (
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2 cursor-pointer rounded-lg transition-colors text-sm font-medium text-white dark:text-gray-100 bg-[#1A5276] hover:bg-[#001F3F] dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <ICONS.Download size={16} />
                <span>Export</span>
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Alerts */}
          <div className="bg-card rounded-xl border border-panel-border shadow-sm p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Alerts
                </p>
                <p className="text-4xl font-bold text-blue-600">
                  {geoAlertMetrics?.TotalAlerts ?? 0}
                </p>
              </div>
              <div className="h-14 w-14 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-none rounded-xl flex items-center justify-center">
                <ICONS.Bell className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-1.5">
              <span
                className={`max-w-full! flex! justify-center! item-center! ${getRiskBadgeClasses("critical")}`}
              >
                Critical: {geoAlertMetrics?.AlertsBySeverity?.critical ?? 0}
              </span>
              <span
                className={`max-w-full! flex! justify-center! item-center! ${getRiskBadgeClasses("high")}`}
              >
                High: {geoAlertMetrics?.AlertsBySeverity?.high ?? 0}
              </span>
              <span
                className={`max-w-full! flex! justify-center! item-center! ${getRiskBadgeClasses("medium")}`}
              >
                Medium: {geoAlertMetrics?.AlertsBySeverity?.medium ?? 0}
              </span>
              <span
                className={`max-w-full! flex! justify-center! item-center! ${getRiskBadgeClasses("low")}`}
              >
                Low: {geoAlertMetrics?.AlertsBySeverity?.low ?? 0}
              </span>
            </div>
          </div>

          {/* Blocked Transactions */}
          <div className="bg-card rounded-xl border border-panel-border shadow-sm p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Blocked Transactions
                </p>
                <p className="text-4xl font-bold text-yellow-600">
                  {geoAlertMetrics?.BlockedTransactions ?? 0}
                </p>
              </div>
              <div className="h-14 w-14 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-none rounded-xl flex items-center justify-center">
                <ICONS.ShieldAlert className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-muted-foreground">
              <ICONS.Globe size={14} className="mr-1.5" />
              <span>From all jurisdictions</span>
            </div>
          </div>

          {/* High-Risk Logins */}
          <div className="bg-card rounded-xl border border-panel-border shadow-sm p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-muted-foreground">
                  High-Risk Logins
                </p>
                <p className="text-4xl font-bold text-orange-600">
                  {geoAlertMetrics?.HighRiskLogins ?? 0}
                </p>
              </div>
              <div className="h-14 w-14 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-none rounded-xl flex items-center justify-center">
                <ICONS.AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                VPN/Proxy detected
              </span>
              <span className="text-xs font-medium px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded">
                {geoAlertMetrics?.VPNDetections ?? 0} VPN
              </span>
            </div>
          </div>

          {/* Critical Violations */}
          <div className="bg-card rounded-xl border border-panel-border shadow-sm p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Critical Violations
                </p>
                <p className="text-4xl font-bold text-red-600">
                  {geoAlertMetrics?.CriticalAlerts ?? 0}
                </p>
              </div>
              <div className="h-14 w-14 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-none rounded-xl flex items-center justify-center">
                <ICONS.AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Severe breaches
              </span>
              <span className="text-xs font-medium px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded">
                {geoAlertMetrics?.ImpossibleTravel ?? 0} Travel
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-panel-border shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Alert Categories
            </h2>
            {Object.entries(alertTypeLabels).length > 4 && (
              <button
                onClick={() => setShowAllAlertTypes(!showAllAlertTypes)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#1A5276] hover:text-[#143F5C] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 dark:text-gray-400 rounded-lg transition-all cursor-pointer"
              >
                <span>
                  {showAllAlertTypes
                    ? "Show Less"
                    : `+${Object.entries(alertTypeLabels).length - 4} More`}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${
                    showAllAlertTypes ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(alertTypeLabels)
              .map(([type, label]) => ({
                type,
                label,
                count:
                  geoAlertMetrics?.AlertsByType[type as keyof AlertTypes] ?? 0,
              }))
              .sort((a, b) => b.count - a.count)
              .slice(0, showAllAlertTypes ? undefined : 4)
              .map(({ type, label, count }, index) => {
                const colors = [
                  {
                    bg: "bg-red-50 dark:bg-red-900/20",
                    text: "text-red-600",
                    border: "border-red-200 dark:border-red-800",
                  },
                  {
                    bg: "bg-orange-50 dark:bg-orange-900/20",
                    text: "text-orange-600",
                    border: "border-orange-200 dark:border-orange-800",
                  },
                  {
                    bg: "bg-yellow-50 dark:bg-yellow-900/20",
                    text: "text-yellow-600",
                    border: "border-yellow-200 dark:border-yellow-800",
                  },
                  {
                    bg: "bg-blue-50 dark:bg-blue-900/20",
                    text: "text-blue-600",
                    border: "border-blue-200 dark:border-blue-800",
                  },
                  {
                    bg: "bg-purple-50 dark:bg-purple-900/20",
                    text: "text-purple-600",
                    border: "border-purple-200 dark:border-purple-800",
                  },
                  {
                    bg: "bg-green-50 dark:bg-green-900/20",
                    text: "text-green-600",
                    border: "border-green-200 dark:border-green-800",
                  },
                  {
                    bg: "bg-indigo-50 dark:bg-indigo-900/20",
                    text: "text-indigo-600",
                    border: "border-indigo-200 dark:border-indigo-800",
                  },
                  {
                    bg: "bg-pink-50 dark:bg-pink-900/20",
                    text: "text-pink-600",
                    border: "border-pink-200 dark:border-pink-800",
                  },
                ];
                const color = colors[index % colors.length];

                return (
                  <div
                    key={type}
                    className={`rounded-lg p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200  transition-all hover:shadow-sm`}
                  >
                    <div className="text-xs font-medium text-muted-foreground mb-2 line-clamp-1">
                      {label}
                    </div>
                    <div className={`text-2xl font-bold ${color.text}`}>
                      {count}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {geoAlertMetrics?.TotalAlerts &&
                      geoAlertMetrics.TotalAlerts > 0
                        ? `${((count / geoAlertMetrics.TotalAlerts) * 100).toFixed(1)}%`
                        : "0%"}{" "}
                      of total
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-card rounded-xl border border-panel-border shadow-sm p-4 mb-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <ICONS.Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-gray-500"
                  size={18}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by Alert ID, User ID..."
                  className="w-full bg-card border border-panel-border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-ring"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleFiltersClick}
                  className={`flex items-center gap-2 px-4 py-2 cursor-pointer border border-panel-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-gray-700 dark:text-gray-100 bg-white dark:bg-slate-800 shadow-sm ${
                    appliedFilters.length > 0
                      ? "bg-gray-50 dark:bg-slate-700"
                      : ""
                  }`}
                >
                  <ICONS.Filter size={16} />
                  <span>Filters</span>
                </button>
              </div>
            </div>
            <SavedFilterManager
              className="mt-3 flex flex-wrap items-center gap-2"
              filterState={filterState}
              filterSetters={filterSetters}
              clearSignal={appliedFilters.length}
              filterType="geo"
              onFilterApplied={(filter) => {
                if (filter) {
                  applySavedGeoFilter(filter);
                } else {
                  handleClearAllFilters();
                }
              }}
            />
          </div>
          {appliedFilters.length > 0 && (
            <FilterArea
              appliedFilters={appliedFilters}
              handleRemoveFilter={handleRemoveFilter}
              handleClearAllFilters={handleClearAllFilters}
            />
          )}
          {loading ? (
            <div className="bg-card rounded-xl border border-panel-border shadow-sm p-12 text-center text-muted-foreground  dark:text-gray-400">
              <div className="flex gap-5 justify-center items-center space-x-2">
                <Loader />
                Loading Geo Alert records...
              </div>
            </div>
          ) : (
            <>
              {alerts &&
              (alerts.length > 0 ||
                appliedFilters.length > 0 ||
                searchTerm !== "") ? (
                <>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      {alerts?.map((alert) => {
                        const infoFields = [
                          {
                            label: "Assigned Name & Role",
                            value: alert.assignee
                              ? `${alert.assignee?.full_name} - ${alert.assignee?.role_name?.replace("_", " ")}`
                              : "Unassigned",
                          },
                          {
                            label: "Risk Score",
                            value: Math.min(alert.risk_score, 100),
                          },
                          {
                            label: "Jurisdiction Impact",
                            value: alert.jurisdiction ?? "No",
                          },
                          {
                            label: "Risk Factors",
                            value: alert.risk_factors,
                          },
                        ];
                        return (
                          <div
                            key={alert.id}
                            className="bg-card rounded-xl border border-panel-border shadow-sm p-5 hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 flex-wrap gap-2 mb-2">
                                  <span className="text-foreground font-semibold text-lg">
                                    <CopyableText text={alert.id} truncate />
                                  </span>
                                  <span
                                    className={getStatusBadgeClasses(
                                      alert.status,
                                    )}
                                  >
                                    {getStatusWithIcon(alert.status)}
                                  </span>
                                  <span
                                    className={`${getRiskBadgeClasses(
                                      alert.severity,
                                    )}`}
                                  >
                                    {alert.severity}
                                  </span>
                                  <span className={getScoreBadgeClasses()}>
                                    Score: {Math.min(alert.risk_score, 100)}
                                  </span>
                                  <span
                                    className={getGeoAlertTypeBadgeClasses()}
                                  >
                                    {
                                      alertTypeLabels[
                                        alert.alert_type as keyof AlertTypes
                                      ]
                                    }
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                  {alert.customer_name &&
                                    (alert.risk_profile_id ? (
                                      <Link
                                        href={`/customer-risk/${alert.risk_profile_id}`}
                                        className="text-foreground font-semibold text-sm flex items-center gap-1.5"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <ICONS.User
                                          size={14}
                                          className="text-muted-foreground"
                                        />
                                        {alert.customer_name}
                                        <ICONS.ExternalLink
                                          size={12}
                                          className="text-muted-foreground"
                                        />
                                      </Link>
                                    ) : (
                                      <span className="text-foreground font-semibold text-sm flex items-center gap-1.5">
                                        <ICONS.User
                                          size={14}
                                          className="text-muted-foreground"
                                        />
                                        {alert.customer_name}
                                      </span>
                                    ))}
                                  <span className="text-muted-foreground text-xs">
                                    <CopyableText
                                      text={alert.user_id}
                                      textClassName="text-muted-foreground font-medium text-xs"
                                      iconClassName="!translate-y-0.25"
                                    />
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground flex-wrap gap-y-1">
                              <span className="flex items-center">
                                <ICONS.Building size={14} className="mr-1" />
                                Individual
                              </span>
                              <span className="flex items-center">
                                <ICONS.MapPin size={14} className="mr-1" />
                                {formatLocation(alert.location)}
                              </span>
                              <span className="flex items-center">
                                <ICONS.Network size={14} className="mr-1" />
                                {alert.ip_address}
                              </span>
                              <span className="flex items-center">
                                <ICONS.Clock size={14} className="mr-1" />
                                Created:{" "}
                                {convertDate(
                                  alert.created_at,
                                  "YYYY-MM-DD HH:mm:ss",
                                )}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 mb-2">
                              {infoFields.map((field) => (
                                <div
                                  key={field.label}
                                  className="bg-card rounded-lg p-3 border border-panel-border"
                                >
                                  <div className="text-muted-foreground text-xs mb-1 font-medium">
                                    {field.label}
                                  </div>
                                  <div className="text-gray-900 text-sm dark:text-slate-100">
                                    {field.label === "Risk Factors"
                                      ? (() => {
                                          const notes = parseNotes(field.value);
                                          return notes.length > 0 ? (
                                            <ul className="list-disc pl-5 space-y-1">
                                              {notes.map((note, index) => (
                                                <li key={index}>{note}</li>
                                              ))}
                                            </ul>
                                          ) : (
                                            "-"
                                          );
                                        })()
                                      : (field.value ?? "-")}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                onClick={() => handleViewAlertDetails(alert)}
                                className="px-4 py-2 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] cursor-pointer transition-all text-sm font-medium flex items-center gap-2 shadow-sm dark:bg-[#2a5a5f] dark:hover:bg-[#1f4648]"
                              >
                                <ICONS.Eye size={16} />
                                <span>View Details</span>
                              </button>
                              {permissions.canEditGEO &&
                                alert.status === "pending" && (
                                  <button
                                    onClick={() => {
                                      setIsConfirmationModalOpen(true);
                                      setSelectedAlert(alert);
                                    }}
                                    className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-800 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 cursor-pointer transition-all text-sm font-medium flex items-center gap-2"
                                  >
                                    <ICONS.CheckSquare size={16} />
                                    <span>Start Review</span>
                                  </button>
                                )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {alerts.length > 0 && (
                      <PaginationControls
                        currentPage={currentPage}
                        totalPages={getTotalPages(total, pageSize)}
                        pageSize={pageSize}
                        totalRecords={total}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                      />
                    )}
                  </div>
                  {alerts.length === 0 &&
                    (appliedFilters.length > 0 || searchTerm !== "") && (
                      <EmptyResult
                        title="No Matched Geo Alerts Found"
                        description="No records match your current filters. Try adjusting your search or filter criteria."
                      />
                    )}
                </>
              ) : (
                <EmptyResult
                  title="No Geo Alerts Found"
                  description="There are no Geolocation alerts to display"
                />
              )}
            </>
          )}
        </div>
      </div>
      {isFilterModalOpen && (
        <GeoLocationFilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApplyFilters={handleApplyFilters}
          currentFilters={appliedFilters}
        />
      )}
      {isConfirmationModalOpen && selectedAlert && (
        <GeoConfirmationModal
          onCancel={() => {
            setIsConfirmationModalOpen(false);
            setSelectedAlert(null);
          }}
          onConfirm={() => handleUpdateAlertStatus(selectedAlert.id)}
          isLoading={updateGeoAlertStatusMutation.isPending}
        />
      )}
      <GeoExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        exporting={exporting}
      />
    </>
  );
};

// Wrap the page in Suspense to satisfy Next.js requirements for searchParams/router hooks
const GeolocationAlertPageWithSuspense = () => (
  <Suspense fallback={<div className="p-6">Loading geolocation alerts...</div>}>
    <GeolocationAlertPage />
  </Suspense>
);

export default GeolocationAlertPageWithSuspense;
