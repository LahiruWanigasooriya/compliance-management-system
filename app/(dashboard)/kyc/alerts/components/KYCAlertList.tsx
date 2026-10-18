"use client";

import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DatePicker, Select } from "antd";
import { ChevronDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import SummaryCard from "@/components/layout/SummaryCard";
import { ICONS, TIME_RANGES } from "@/constants/constants";
import type { KYCAlertsRecord } from "@/types/kyc/alerts.types";
import { convertDate } from "@/utils/convertDate";
import {
  getRiskBadgeClasses,
  getStatusBadgeClasses,
} from "@/utils/kyc/badgeClasses";
import { getKYCAlertsRecords } from "@/actions/kyc.actions";
import { VerificationStage } from "@/enums/kyc/verificationStage";
import { AlertStatus } from "@/enums/kyc/AlertStatus";
import { exportKycRecords } from "@/utils/kyc/exportKycRecords";
import PaginationControls, {
  getSafePage,
  getTotalPages,
} from "@/components/ui/PaginationControls";
import { RiskLevel } from "@/enums/kyc/RiskLavel";
import Loader from "@/components/ui/loader/Loader";
import LoadingOverlay from "@/components/layout/LoadingOverlay";
import { KYCOverview } from "@/types/kyc/kyc.types";
import Link from "next/link";
import { defaultOverviewStats } from "@/constants/kyc.constants";
import { getStatusWithIcon, getStatusOptionLabel } from "@/utils/statusHelpers";
import SavedFilterManager from "@/components/common/SavedFilterManager";
import CopyableText from "@/components/common/copyable-text/CopyableText";
import { useTenant } from "@/components/providers/tenant.provider";
import MaintenanceNotice from "@/components/common/MaintenanceNotice";
import { useKYCAlerts, useKYCOverview, useUsers } from "@/hooks/useKYC";

const KYC_TIME_RANGE_OPTIONS = [
  ...TIME_RANGES,
  { value: "custom", label: "Custom Range" },
];

type AssigneeDetails = {
  name: string;
  role: string;
};

const buildAssigneeDetailsMap = (
  records: KYCAlertsRecord[],
): Record<string, AssigneeDetails> =>
  records.reduce<Record<string, AssigneeDetails>>((acc, record) => {
    const name = record.assignedUser?.fullName ?? "";
    const role =
      record.assignedUser?.role?.roleName ?? record.assignedUser?.roleId ?? "";
    if (name || role) {
      acc[record.id] = { name, role };
    }
    return acc;
  }, {});

export default function KYCAlertList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const [customRange, setCustomRange] = useState<[string, string]>(["", ""]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedRisk, setSelectedRisk] = useState<string[]>([]);
  const [selectedAssignedFor, setSelectedAssignedFor] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"created_at" | "updated_at">(
    "created_at",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [savedFilterClearSignal, setSavedFilterClearSignal] = useState(0);
  const { selectedTenantId, isSwitchingTenant } = useTenant();

  const KYC_ALERTS_NAV_KEY = "kyc-alerts:sidebar-nav";
  const [showSidebarLoader, setShowSidebarLoader] = useState(() => {
    const fromSidebar = sessionStorage.getItem(KYC_ALERTS_NAV_KEY) === "true";
    if (fromSidebar) {
      sessionStorage.removeItem(KYC_ALERTS_NAV_KEY);
      return true;
    }
    return false;
  });

  // useEffect(() => {
  //   const fromSidebar = sessionStorage.getItem(KYC_ALERTS_NAV_KEY) === "true";
  //   if (fromSidebar) {
  //     setShowSidebarLoader(true);
  //     sessionStorage.removeItem(KYC_ALERTS_NAV_KEY);
  //   }
  // }, []);

  // Fetch users for assignee dropdown
  const { users } = useUsers();

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam) {
      if (statusParam === "all") {
        setSelectedStatus([]);
      } else {
        setSelectedStatus(statusParam.split(","));
      }
    }
    const riskParam = searchParams.get("risk");
    if (riskParam) {
      if (riskParam === "all") {
        setSelectedRisk([]);
      } else {
        setSelectedRisk(riskParam.split(","));
      }
    }
    const assignedForParam = searchParams.get("assigned_for");
    if (assignedForParam) {
      if (assignedForParam === "all") {
        setSelectedAssignedFor([]);
      } else {
        setSelectedAssignedFor(assignedForParam.split(","));
      }
    }
    const pageParam = searchParams.get("page");
    if (pageParam) {
      setCurrentPage(parseInt(pageParam) || 1);
    }
  }, [searchParams]);

  const sortByOptions = [
    { label: "Created At", value: "created_at" },
    { label: "Updated At", value: "updated_at" },
  ];

  const sortOrderOptions = [
    { label: "Ascending", value: "asc" },
    { label: "Descending", value: "desc" },
  ];

  const statusOptions = [
    // { label: "All", value: AlertStatus.ALL },
    { label: "Pending", value: AlertStatus.PENDING },
    { label: "In Progress", value: AlertStatus.IN_PROGRESS },
    { label: "Resolved", value: AlertStatus.RESOLVED },
    { label: "Escalated", value: AlertStatus.ESCALATED },
    { label: "Closed", value: AlertStatus.CLOSED },
  ];

  const riskOptions = [
    // { label: "All Risks", value: RiskLevel.ALL },
    { label: "Low", value: RiskLevel.LOW },
    { label: "Medium", value: RiskLevel.MEDIUM },
    { label: "High", value: RiskLevel.HIGH },
    { label: "Critical", value: RiskLevel.CRITICAL },
  ];

  const normalizedSearch = debouncedSearchTerm.trim();
  const filterState = {
    searchTerm: searchTerm,
    selectedRiskLevel: selectedRisk,
    selectedStatus,
    selectedAssignedFor,
    selectedTimeRange,
    customRange,
  };
  const filterSetters = {
    setSearchTerm: setSearchTerm,
    setSelectedRiskLevel: setSelectedRisk,
    setSelectedStatus,
    setSelectedAssignedFor,
    setSelectedTimeRange,
    setCustomRange,
  };

  const handleCustomRangeChange = (
    values: [import("dayjs").Dayjs | null, import("dayjs").Dayjs | null] | null,
  ) => {
    if (!values || !values[0] || !values[1]) {
      setCustomRange(["", ""]);
      return;
    }

    setCustomRange([
      values[0].startOf("day").toISOString(),
      values[1].endOf("day").toISOString(),
    ]);
  };

  const selectedDateRange = useMemo(() => {
    if (selectedTimeRange === "custom") {
      if (!customRange[0] || !customRange[1]) {
        return null;
      }
      return {
        fromDate: customRange[0],
        toDate: customRange[1],
      };
    }

    const now = new Date();
    const rangeMap: Record<string, number> = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
    };

    const offsetMs = rangeMap[selectedTimeRange];
    if (!offsetMs) {
      return null;
    }

    const fromDate = new Date(now.getTime() - offsetMs).toISOString();
    const toDate = now.toISOString();
    return { fromDate, toDate };
  }, [selectedTimeRange, customRange]);

  const queryParams = useMemo(
    () => ({
      status: selectedStatus.length === 0 ? "all" : selectedStatus.join(","),
      risk: selectedRisk.length === 0 ? "all" : selectedRisk.join(","),
      assigned_for:
        selectedAssignedFor.length === 0
          ? "all"
          : selectedAssignedFor.join(","),
      search: normalizedSearch || undefined,
      fromDate: selectedDateRange?.fromDate,
      toDate: selectedDateRange?.toDate,
      page: currentPage,
      limit: pageSize,
      sort_by: sortBy,
      order: sortOrder,
    }),
    [
      currentPage,
      normalizedSearch,
      pageSize,
      selectedDateRange,
      selectedRisk,
      selectedStatus,
      selectedAssignedFor,
      sortBy,
      sortOrder,
    ],
  );

  const exportQueryParams = useMemo(
    () => ({
      status: selectedStatus.length === 0 ? "all" : selectedStatus.join(","),
      risk: selectedRisk.length === 0 ? "all" : selectedRisk.join(","),
      assigned_for:
        selectedAssignedFor.length === 0
          ? "all"
          : selectedAssignedFor.join(","),
      search: normalizedSearch || undefined,
      fromDate: selectedDateRange?.fromDate,
      toDate: selectedDateRange?.toDate,
    }),
    [
      normalizedSearch,
      selectedDateRange,
      selectedRisk,
      selectedStatus,
      selectedAssignedFor,
    ],
  );

  const overviewParams = useMemo(
    () => ({
      fromDate: selectedDateRange?.fromDate,
      toDate: selectedDateRange?.toDate,
    }),
    [selectedDateRange],
  );

  // React Query hooks for data fetching with polling
  const {
    alerts: kycRecords,
    pagination,
    total: totalRecords,
    isLoading: isLoadingAlerts,
    isFetching: isFetchingRecords,
    isRefetching: isRefetchingRecords,
    isError: hasAlertsError,
    dataUpdatedAt: alertsUpdatedAt,
    refresh: refreshAlerts,
  } = useKYCAlerts({
    params: queryParams,
  });

  const { overview: overviewStats, refresh: refreshOverview } = useKYCOverview({
    params: overviewParams,
    enabled: !!selectedDateRange,
  });

  const handleRefresh = () => {
    refreshAlerts();
    refreshOverview();
  };

  // Derive assignee details from records
  const assigneeDetails = useMemo(() => {
    const fromRecords = buildAssigneeDetailsMap(kycRecords);
    return fromRecords;
  }, [kycRecords]);

  const stats = useMemo<KYCOverview>(
    () => overviewStats ?? defaultOverviewStats,
    [overviewStats],
  );

  // Use pagination.total as fallback if top-level total is not available
  const effectiveTotalRecords = totalRecords || pagination?.total || 0;
  const isServerPaginated = pagination
    ? pagination.total > kycRecords.length
    : false;
  const totalPages = getTotalPages(effectiveTotalRecords, pageSize);
  const currentPageSafe = getSafePage(currentPage, totalPages);

  const paginatedRecords = useMemo(() => {
    return kycRecords;
  }, [kycRecords]);

  const getDisplayedAssigneeName = (record: KYCAlertsRecord) =>
    assigneeDetails[record.id]?.name ||
    record.assignedUser?.fullName ||
    "Unassigned";

  const getDisplayedRole = (record: KYCAlertsRecord) =>
    assigneeDetails[record.id]?.role ||
    record.assignedUser?.role?.roleName ||
    "Unassigned";

  const handleReviewClick = (kycId: string) => {
    router.push(`/kyc/alerts/${kycId}?from=alerts`);
  };

  const handleExport = async (format: "pdf" | "csv" | "json") => {
    const customRangeIncomplete =
      selectedTimeRange === "custom" && (!customRange[0] || !customRange[1]);
    if (customRangeIncomplete) {
      toast.error(
        "Please select a full start and end date for custom exports.",
      );
      return;
    }
    setIsExporting(true);
    try {
      let recordsToExport = kycRecords;
      const needsFullFetch =
        isServerPaginated || effectiveTotalRecords > kycRecords.length;

      if (needsFullFetch) {
        const exportLimit = 100;
        const totalPagesToFetch = Math.max(
          1,
          Math.ceil(effectiveTotalRecords / exportLimit),
        );
        const fetchedRecords: KYCAlertsRecord[] = [];

        for (let page = 1; page <= totalPagesToFetch; page += 1) {
          const response = await getKYCAlertsRecords({
            ...exportQueryParams,
            page,
            limit: exportLimit,
          });

          if (!response.success) {
            throw new Error(response.message ?? "Unable to export records.");
          }

          fetchedRecords.push(...response.data.alerts);
        }

        recordsToExport = fetchedRecords;
      }

      // if (recordsToExport.length === 0) {
      //   toast.error("No records available to export.");
      //   return;
      // }
      const uniqueRecords = Array.from(
        new Map(
          recordsToExport.map((record) => [record.kyc.id, record]),
        ).values(),
      );
      await exportKycRecords(uniqueRecords, format);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to export records.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [
    normalizedSearch,
    selectedRisk,
    selectedStatus,
    selectedAssignedFor,
    selectedTimeRange,
    customRange,
    selectedTenantId,
  ]);

  useEffect(() => {
    // Only adjust currentPage when we have actual data loaded
    // This prevents resetting to page 1 during initial load when effectiveTotalRecords is still 0
    if (effectiveTotalRecords > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages, effectiveTotalRecords]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const hasActiveFilters = useMemo(() => {
    return (
      debouncedSearchTerm !== "" ||
      selectedStatus.length > 0 ||
      selectedRisk.length > 0 ||
      selectedAssignedFor.length > 0 ||
      selectedTimeRange !== "7d"
    );
  }, [
    debouncedSearchTerm,
    selectedStatus,
    selectedRisk,
    selectedAssignedFor,
    selectedTimeRange,
  ]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedStatus([]);
    setSelectedRisk([]);
    setSelectedAssignedFor([]);
    setSelectedTimeRange("7d");
    setCustomRange(["", ""]);
    setCurrentPage(1);
    setSavedFilterClearSignal((prev) => prev + 1);
  };

  // const [isActive, setIsActive] = useState(false);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setIsActive(true);
  //   }, 10000); // 10000ms = 10 seconds

  //   // Cleanup function
  //   return () => {
  //     clearTimeout(timer);
  //     setIsActive(false);
  //   };
  // }, []);

  useEffect(() => {
    if (showSidebarLoader && !isFetchingRecords) {
      setShowSidebarLoader(false);
    }
  }, [showSidebarLoader, isFetchingRecords]);

  // Don't show individual page loader during tenant switch - the global overlay handles it
  if (
    isFetchingRecords &&
    kycRecords.length === 0 &&
    !isSwitchingTenant &&
    !hasActiveFilters &&
    // !isActive &&
    showSidebarLoader
  ) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <LoadingOverlay
          className="-inset-4!"
          loadingText="Loading KYC alerts data..."
        />
      </div>
    );
  }

  if (hasAlertsError) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <MaintenanceNotice />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">
            KYC Alerts
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5 dark:text-gray-400">
            Know Your Customer compliance alerts and flags
          </p>
          {alertsUpdatedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {new Date(alertsUpdatedAt).toLocaleTimeString()}
              {isRefetchingRecords && (
                <span className="ml-2 inline-flex items-center">
                  <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                  Updating...
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2 gap-2">
          <button
            onClick={handleRefresh}
            disabled={isFetchingRecords}
            className="flex items-center gap-2 px-3 py-2 border border-panel-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetchingRecords ? "animate-spin" : ""}`}
            />
          </button>
          {/* <div className="relative inline-block">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "created_at" | "updated_at")
              }
              disabled={isFetchingRecords}
              className="appearance-none px-4 py-2 pr-10 border border-panel-border rounded-lg focus:outline-none focus:ring-2 focus:ring-white bg-card-second text-foreground text-sm font-medium shadow-sm cursor-pointer disabled:opacity-50"
            >
              {sortByOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div> */}

          {/* <div className="relative inline-block">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              disabled={isFetchingRecords}
              className="appearance-none px-4 py-2 pr-10 border border-panel-border rounded-lg focus:outline-none focus:ring-2 focus:ring-white bg-card-second text-foreground text-sm font-medium shadow-sm cursor-pointer disabled:opacity-50"
            >
              {sortOrderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div> */}
          {selectedTimeRange === "custom" && (
            <DatePicker.RangePicker
              value={
                customRange[0] && customRange[1]
                  ? [dayjs(customRange[0]), dayjs(customRange[1])]
                  : undefined
              }
              size="large"
              format="YYYY-MM-DD"
              onChange={handleCustomRangeChange}
              aria-label="Custom date range"
              className="px-3 py-1.5 border-none border-gray-300 bg-white text-sm font-medium text-gray-900 focus-within:ring-0! focus-within:ring-gray-600 dark:border-[#373c4a] dark:bg-[#011613] dark:text-slate-100"
              popupClassName="dark:bg-[#011613] dark:text-slate-100"
            />
          )}
          <div className="relative inline-block">
            <select
              value={selectedTimeRange}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedTimeRange(value);
                if (value !== "custom") {
                  setCustomRange(["", ""]);
                }
              }}
              disabled={isFetchingRecords}
              className="appearance-none px-4 py-2 pr-10 border border-panel-border rounded-lg focus:outline-none focus:ring-2 focus:ring-white bg-card-second text-foreground text-sm font-medium shadow-sm cursor-pointer disabled:opacity-50"
            >
              {KYC_TIME_RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            disabled={isExporting}
            className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader
                  size="10"
                  className="h-4 w-4 -translate-y-0.5"
                  lightColor="white"
                  stroke="1"
                />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <ICONS.Download size={16} />
                <span>Export</span>
              </>
            )}
          </button>
          {/* <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-1.5 border border-panel-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring bg-white text-foreground text-sm font-medium dark:bg-slate-800 dark:text-gray-100 dark:focus:ring-ring"
          >
            {TIME_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select> */}
          {/* <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-colors text-sm font-medium">
            <ICONS.UserPlus size={16} />
            <span>New KYC</span>
          </button> */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <SummaryCard
          title="Total Alerts"
          value={stats.totalAlerts}
          mainColor="blue"
          icon={ICONS.Users}
          // bottomLabel="Active customers"
        />
        <SummaryCard
          title="Pending Alerts"
          value={stats.pendingAlerts}
          mainColor="yellow"
          icon={ICONS.Clock}
          // trend="+3"
          // trendColor="yellow"
          // bottomLabel="Awaiting verification"
        />
        <SummaryCard
          title="Resolved Alerts"
          value={stats.resolvedAlerts}
          mainColor="green"
          icon={ICONS.CheckCircle}
          // bottomLabel="Verified customers"
        />
        <SummaryCard
          title="High Risk Alerts"
          value={stats.highRisk}
          mainColor="red"
          icon={ICONS.AlertTriangle}
          // bottomLabel="Enhanced due diligence"
        />
      </div>

      {/* KYC Compliance Checklist Overview */}
      <div className="bg-card rounded-xl border border-panel-border shadow-sm p-4 mb-4 ">
        <h2 className="text-lg font-semibold text-foreground mb-3 dark:text-gray-100">
          KYC Compliance Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-card rounded-lg p-3 border border-panel-border ">
            <div className="text-muted-foreground text-xs mb-1 font-medium dark:text-gray-400">
              Identity Verified
            </div>
            <div className="text-foreground font-bold text-lg dark:text-gray-100">
              {stats.idVerified}/{stats.total}
            </div>
            <div className="text-muted-foreground text-xs mt-1 dark:text-gray-400">
              {(() => {
                const verified = Number(stats.idVerified || 0);
                const total = Number(stats.total || 0);
                const percentage =
                  total === 0 ? NaN : Math.round((verified / total) * 100);

                return isNaN(percentage) ? "- " : `${percentage}% `;
              })()}
              Complete
            </div>
          </div>
          <div className="bg-card rounded-lg p-3 border border-panel-border ">
            <div className="text-muted-foreground text-xs mb-1 font-medium dark:text-gray-400">
              Address Verified
            </div>
            <div className="text-foreground font-bold text-lg dark:text-gray-100">
              {stats.addressVerified}/{stats.total}
            </div>
            <div className="text-muted-foreground text-xs mt-1 dark:text-gray-400">
              {(() => {
                const addressVerified = Number(stats.addressVerified || 0);
                const total = Number(stats.total || 0);
                const percentage =
                  total === 0
                    ? NaN
                    : Math.round((addressVerified / total) * 100);

                return isNaN(percentage) ? "- " : `${percentage}% `;
              })()}
              Complete
            </div>
          </div>
          <div className="bg-card rounded-lg p-3 border border-panel-border ">
            <div className="text-muted-foreground text-xs mb-1 font-medium dark:text-gray-400">
              Face Verified
            </div>
            <div className="text-foreground font-bold text-lg dark:text-gray-100">
              {stats.faceVerified}/{stats.total}
            </div>
            <div className="text-muted-foreground text-xs mt-1 dark:text-gray-400">
              {(() => {
                const faceVerified = Number(stats.faceVerified || 0);
                const total = Number(stats.total || 0);
                const percentage =
                  total === 0 ? NaN : Math.round((faceVerified / total) * 100);

                return isNaN(percentage) ? "- " : `${percentage}% `;
              })()}
              Complete
            </div>
          </div>
          {/* <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1 font-medium">
              Corporate KYC
            </div>
            <div className="text-gray-900 font-bold text-lg">
              {kycRecords.filter((k) => k.customerType === 'Corporate').length}
              {0}
            </div>
            <div className="text-gray-600 text-xs mt-1">
              Enhanced screening required
            </div>
          </div> */}
          {/* <div className="bg-card rounded-lg p-3 border border-panel-border ">
            <div className="text-muted-foreground text-xs mb-1 font-medium dark:text-gray-400">
              Rejections
            </div>
            <div className="text-foreground font-bold text-lg dark:text-gray-100">
              {stats.rejections}
              {kycRecords.filter((k) => k.status === KycStatus.DECLINED).length}
            </div>
          </div> */}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-xl border border-panel-border shadow-sm p-4 mb-4 ">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <ICONS.Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-gray-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by KYC ID, or Customer Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card border border-panel-border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent  dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-ring"
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Select
              mode="multiple"
              size="small"
              placeholder="Risk"
              value={selectedRisk}
              onChange={setSelectedRisk}
              style={{ minWidth: 90 }}
              options={riskOptions.map((option) => ({
                label: option.label,
                value: option.value,
              }))}
            />
            <Select
              mode="multiple"
              size="small"
              placeholder="Status"
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ minWidth: 120 }}
              options={statusOptions.map((option) => ({
                label: getStatusOptionLabel(option.value, option.label),
                value: option.value,
              }))}
            />
            <Select
              mode="multiple"
              size="small"
              placeholder="Assigned To"
              value={selectedAssignedFor}
              onChange={setSelectedAssignedFor}
              style={{ minWidth: 120 }}
              options={[
                // { label: "Unassigned", value: "unassigned" },
                ...users.map((user) => ({
                  label: user.name,
                  value: user.id,
                })),
              ]}
            />
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-3 py-3 cursor-pointer text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-700/50"
              >
                <ICONS.XCircle size={16} />
                Clear Filters
              </button>
            )}
          </div>
        </div>
        <SavedFilterManager
          className="mt-3 flex flex-wrap items-center gap-2"
          filterState={filterState}
          filterSetters={filterSetters}
          clearSignal={savedFilterClearSignal}
          filterType="kyc-alert"
        />
      </div>

      {/* KYC Records List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-12 space-y-3">
          {isFetchingRecords ? (
            <div className="bg-card rounded-xl border border-panel-border shadow-sm p-12 text-center text-muted-foreground  dark:text-gray-400">
              <div className="flex gap-5 justify-center items-center space-x-2">
                <Loader />
                Loading KYC records...
              </div>
            </div>
          ) : kycRecords.length === 0 ? (
            <div className="bg-card rounded-xl border border-panel-border shadow-sm p-12 text-center ">
              <ICONS.FileText
                className="mx-auto text-muted-foreground mb-4 dark:text-gray-500"
                size={48}
              />
              <h3 className="text-lg font-semibold text-foreground mb-2 dark:text-gray-100">
                No KYC Records Found
              </h3>
              <p className="text-muted-foreground mb-4 dark:text-gray-400">
                {kycRecords.length === 0
                  ? "There are no KYC records to display."
                  : "No records match your current filters. Try adjusting your search or filter criteria."}
              </p>
              {kycRecords.length > 0 && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedStatus([]);
                    setSelectedRisk([]);
                    setSelectedAssignedFor([]);
                    setSelectedTimeRange("7d");
                    setCustomRange(["", ""]);
                    setCurrentPage(1);
                    setSavedFilterClearSignal((prev) => prev + 1);
                  }}
                  className="px-4 py-2 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-colors dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            paginatedRecords.map((record: KYCAlertsRecord) => {
              const fullName =
                `${record.kyc.firstName} ${record.kyc.middleName} ${record.kyc.lastName}`.trim();
              const KYCStatusValue = record.kyc.status;
              const AlertStatusValue = record.status;
              const verificationSteps = [
                {
                  label: "ID",
                  verified: record?.kyc.idVerified,
                  stage: VerificationStage.ID_VERIFICATION,
                  order: 0,
                },
                {
                  label: "Address",
                  verified: record?.kyc.addressVerified,
                  stage: VerificationStage.ADDRESS_VERIFICATION,
                  order: 1,
                },
                {
                  label: "Face",
                  verified: record?.kyc.faceVerified,
                  stage: VerificationStage.FACE_VERIFICATION,
                  order: 2,
                },
              ];
              const sortedVerificationSteps = [...verificationSteps].sort(
                (a, b) => {
                  const verifiedDiff = Number(b.verified) - Number(a.verified);
                  return verifiedDiff !== 0 ? verifiedDiff : a.order - b.order;
                },
              );
              const nextVerificationStage =
                sortedVerificationSteps.find((step) => !step.verified)?.stage ??
                "Completed";

              // const isApproved = KYCStatusValue === KycStatus.ACCEPTED;
              // const isKYCPending =
              //   KYCStatusValue === KycStatus.PENDING ||
              //   KYCStatusValue === KycStatus.REVIEW_PENDING;
              // const isKYCRejected = KYCStatusValue === KycStatus.DECLINED;
              // const isKYCAccepted = KYCStatusValue === KycStatus.ACCEPTED;
              // const isKYCUnderReview =
              //   KYCStatusValue === KycStatus.REVIEW_PENDING;

              return (
                <div
                  key={record?.id}
                  className="bg-card rounded-xl border border-panel-border shadow-sm p-5 hover:shadow-md transition-all "
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 flex-wrap gap-2 mb-2">
                        <span className="text-foreground font-semibold text-lg dark:text-gray-100">
                          <CopyableText text={record?.id} truncate />
                        </span>
                        <span
                          className={getStatusBadgeClasses(AlertStatusValue)}
                        >
                          {getStatusWithIcon(AlertStatusValue)}
                        </span>
                        <span className={getStatusBadgeClasses(KYCStatusValue)}>
                          {getStatusWithIcon(KYCStatusValue, {
                            labelPrefix: "KYC:",
                          })}
                        </span>
                        <span
                          className={getRiskBadgeClasses(record?.risk || "")}
                        >
                          Risk: {record?.risk || ""}
                        </span>
                        {/* <span className="px-2.5 py-1 bg-purple-100 text-purple-700 border border-purple-300 rounded-full text-xs font-semibold">
                          Individual
                          {record?.customerType}
                        </span> */}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground flex-wrap dark:text-gray-400">
                        <span className="flex items-center">
                          <ICONS.Clock size={14} className="mr-1" />
                          {convertDate(
                            record?.kyc.createdAt,
                            "YYYY-MM-DD HH:mm:ss",
                          )}
                        </span>
                        <span className="flex items-center">
                          <ICONS.MapPin size={14} className="mr-1" />
                          {record?.kyc.riskProfile?.countryOfResidence ||
                            record.kyc?.riskProfile?.location ||
                            "--"}
                        </span>
                        <span className="flex items-center">
                          <ICONS.FileText size={14} className="mr-1" />
                          {record.kyc.proofs.length} Documents
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-card rounded-lg p-3 border border-panel-border dark:bg-slate-800">
                      <div className="text-muted-foreground text-xs mb-1 font-medium dark:text-gray-400">
                        Customer Name
                      </div>
                      {record?.kyc?.riskProfile?.id ? (
                        <Link
                          href={`/customer-risk/${record?.kyc?.riskProfile?.id}?fromKycAlerts=true`}
                          className="text-gray-900 font-semibold text-base mb-2 dark:text-slate-100 inline-flex items-center gap-1"
                        >
                          <span className="capitalize">{fullName}</span>
                          <ICONS.ExternalLink
                            size={16}
                            className="text-gray-400 dark:text-slate-300"
                          />
                        </Link>
                      ) : (
                        <div className="text-gray-900 font-semibold text-base mb-2 dark:text-slate-100 inline-flex items-center gap-1 opacity-70">
                          <span className="capitalize">{fullName}</span>
                        </div>
                      )}

                      <div className="text-muted-foreground text-xs uppercase dark:text-gray-400">
                        <CopyableText
                          text={record?.kyc.forwardReference}
                          iconClassName="!-translate-y-0"
                        />
                      </div>
                    </div>
                    <div className="bg-card rounded-lg p-3 border border-panel-border capitalize dark:bg-slate-800">
                      <div className="text-muted-foreground text-xs mb-1 font-medium dark:text-gray-400">
                        Verification Stage
                      </div>
                      <div className="text-foreground font-semibold text-sm capitalize dark:text-gray-100">
                        {nextVerificationStage}
                      </div>
                    </div>
                    {/* <div className="bg-card rounded-lg p-3 border border-panel-border dark:bg-slate-800">
                      <div className="text-muted-foreground text-xs mb-1 font-medium dark:text-gray-400">
                        Document Status
                      </div>
                      <div
                        className={`font-semibold text-sm capitalize ${
                          record.kyc.proofs.length ===
                          record.kyc.requiredDocumentCount
                            ? "text-green-600 dark:text-green-400"
                            : "text-yellow-600 dark:text-yellow-300"
                        }`}
                      >
                        {record.kyc.proofs.length ===
                        record.kyc.requiredDocumentCount
                          ? "Complete"
                          : "Incomplete"}
                      </div>
                    </div> */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 dark:border-[#373c4a] dark:bg-[#04440b4f]">
                      <div className="text-gray-600 text-xs mb-1 font-medium dark:text-slate-400">
                        Verification Progress
                      </div>
                      <div className="flex items-center space-x-2">
                        {sortedVerificationSteps.map((item) => (
                          <span
                            key={item.label}
                            className="flex items-center space-x-1.5 text-xs text-gray-600 dark:text-slate-300"
                          >
                            {item.verified ? (
                              <ICONS.CheckCircle
                                size={16}
                                className="text-green-600 dark:text-green-400"
                              />
                            ) : (
                              <ICONS.XCircle
                                size={16}
                                className="text-red-600 dark:text-red-400"
                              />
                            )}
                            <span>{item.label}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between space-x-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground flex-wrap dark:text-gray-400 border border-border bg-card w-fit px-2.5 py-1 rounded-lg">
                        <span className="flex items-center capitalize gap-1">
                          <ICONS.Pin size={14} className="" />
                          <span className="flex items-center capitalize gap-2">
                            <b>Assignee:</b>
                            {getDisplayedAssigneeName(record)} (
                            {getDisplayedRole(record)})
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="px-4 py-2 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-all text-sm font-medium flex items-center space-x-1.5 cursor-pointer dark:bg-[#2a5a5f] dark:hover:bg-[#1f4648]"
                        onClick={() => handleReviewClick(record?.id)}
                      >
                        <ICONS.Eye size={16} />
                        <span>Review KYC</span>
                      </button>
                      {/* {isKYCUnderReview && (
                        <button className="px-4 py-2 bg-orange-100 text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-200 transition-all text-sm font-medium cursor-pointer dark:border-orange-700 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/40">
                          Request Documents
                        </button>
                      )} */}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {!isFetchingRecords && kycRecords.length > 0 && (
        <PaginationControls
          currentPage={currentPageSafe}
          totalPages={totalPages}
          pageSize={pageSize}
          totalRecords={effectiveTotalRecords}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-panel-border shadow-lg p-6 max-w-md w-full mx-4 dark:bg-[#011613] dark:border-[#373c4a]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground dark:text-slate-100">
                Export KYC Records
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors dark:text-slate-400 dark:hover:text-slate-100"
              >
                <ICONS.X size={20} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4 dark:text-slate-400">
              Select the format to export KYC records:
            </p>
            <div className="space-y-2">
              {[
                { format: "csv" as const, label: "CSV", icon: ICONS.FileText },
                {
                  format: "json" as const,
                  label: "JSON",
                  icon: ICONS.FileText,
                },
                { format: "pdf" as const, label: "PDF", icon: ICONS.FileText },
              ].map(({ format, label, icon: Icon }) => (
                <button
                  key={format}
                  onClick={async () => {
                    setShowExportModal(false);
                    await handleExport(format);
                  }}
                  disabled={isExporting}
                  className="w-full cursor-pointer px-4 py-3 bg-card border border-panel-border rounded-lg hover:bg-card/70 transition-all text-left flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[#011A04] dark:border-[#373c4a] dark:hover:bg-[#012208]"
                >
                  <Icon
                    size={20}
                    className="text-muted-foreground dark:text-slate-400"
                  />
                  <span className="text-foreground font-medium dark:text-slate-100">
                    Export as {label}
                  </span>
                </button>
              ))}
            </div>
            {isExporting && (
              <div className="mt-4 text-center text-sm text-muted-foreground dark:text-slate-400">
                Exporting...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
