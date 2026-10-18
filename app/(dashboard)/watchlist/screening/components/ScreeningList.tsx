"use client";

import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, RefreshCw } from "lucide-react";
import { DatePicker, Select } from "antd";
import SummaryCard from "@/components/layout/SummaryCard";
import { ICONS } from "@/constants/constants";
import { AMLDashboardResponse } from "@/types/aml/dashboardWatchlist.types";
import { Screening } from "@/types/aml/screening";
import type { User } from "@/types/user.types";
import { getNameByCode } from "@/utils/aml/getNameByCode";
import {
  getRiskBadgeClasses,
  getStatusBadgeClasses,
  getCategoryBadgeClasses,
} from "@/utils/kyc/badgeClasses";
import { toast } from "sonner";
import Loader from "@/components/ui/loader/Loader";
import PaginationControls, {
  getSafePage,
  getTotalPages,
} from "@/components/ui/PaginationControls";
import { exportAMLScreeningsPdf } from "@/actions/aml.actions";
import SavedFilterManager from "@/components/common/SavedFilterManager";
import { convertDate } from "@/utils/convertDate";
import LoadingOverlay from "@/components/layout/LoadingOverlay";
import downloadFile from "@/utils/downloadFile";
import { normalizeTimeFilterParams } from "@/utils/normalizeTimeFilterParams";
import CopyableText from "@/components/common/copyable-text/CopyableText";
import { useTenant } from "@/components/providers/tenant.provider";
import MaintenanceNotice from "@/components/common/MaintenanceNotice";
import {
  useWatchlistScreenings,
  useWatchlistDashboard,
  useWatchlistFilters,
  useWatchlistUsers,
} from "@/hooks/useWatchlist";
import { usePermissions } from "@/hooks/usepermissions";
import { getStatusWithIcon, getStatusOptionLabel } from "@/utils/statusHelpers";

const WATCHLIST_STAT_CARDS: Array<{
  key: Extract<
    keyof AMLDashboardResponse["data"],
    "totalEntries" | "highRisk" | "active" | "criticalRisk" | "recentMatches"
  >;
  title: string;
  mainColor: "blue" | "orange" | "red" | "green";
  icon: (typeof ICONS)[keyof typeof ICONS];
  bottomLabel?: string;
  customTrend?: (data: AMLDashboardResponse["data"]) => {
    trend: string;
    trendColor: "red" | "green" | "orange";
  };
}> = [
  {
    key: "totalEntries",
    title: "Total Entries",
    mainColor: "blue",
    icon: ICONS.List,
    bottomLabel: "Screening items",
  },
  {
    key: "highRisk",
    title: "High Risk",
    mainColor: "orange",
    icon: ICONS.CheckCircle,
    bottomLabel: "Needs immediate attention",
  },
  {
    key: "criticalRisk",
    title: "Critical Risk",
    mainColor: "red",
    icon: ICONS.AlertTriangle,
    bottomLabel: "Immediate action required",
  },
  // {
  //   key: "active",
  //   title: "Active",
  //   mainColor: "green",
  //   icon: ICONS.CheckCircle,
  //   bottomLabel: "Currently monitored",
  // },
  {
    key: "recentMatches",
    title: "Recent Matches",
    mainColor: "green",
    icon: ICONS.Target,
    bottomLabel: "Triggered alerts",
    customTrend: (data) => {
      const trend = data.trendData.recentMatches;
      const symbol = trend.change > 0 ? "+" : "";
      return {
        trend: `${symbol}${trend.change}`,
        trendColor: trend.isPositiveTrend ? "red" : "green",
      };
    },
  },
];
export default function ScreeningList() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const [customRange, setCustomRange] = useState<[string, string]>(["", ""]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string[]>([]);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedReviewStatus, setSelectedReviewStatus] = useState<string[]>(
    [],
  );
  const [selectedAssignedFor, setSelectedAssignedFor] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [savedFilterClearSignal, setSavedFilterClearSignal] = useState(0);
  const [assigneeDetails, setAssigneeDetails] = useState<
    Record<string, AssigneeDetails>
  >({});
  const [showAllCategories, setShowAllCategories] = useState(false);
  const { selectedTenantId, isSwitchingTenant } = useTenant();

  const normalizedSearch = debouncedSearchTerm.trim();

  // Build query params for React Query
  const queryParams = useMemo(() => {
    const timeParams = normalizeTimeFilterParams({
      time_filter: selectedTimeRange,
      start_date: customRange[0],
      end_date: customRange[1],
    });

    // Don't fetch if custom range is incomplete
    const customRangeIncomplete =
      selectedTimeRange === "custom" && (!customRange[0] || !customRange[1]);
    if (customRangeIncomplete) {
      return null;
    }

    return {
      search: normalizedSearch || undefined,
      category:
        selectedCategory.length > 0 ? selectedCategory.join(",") : undefined,
      risk_level:
        selectedRiskLevel.length > 0 ? selectedRiskLevel.join(",") : undefined,
      status: selectedStatus.length > 0 ? selectedStatus.join(",") : undefined,
      review_status:
        selectedReviewStatus.length > 0
          ? selectedReviewStatus.join(",")
          : undefined,
      assigned_for:
        selectedAssignedFor.length > 0
          ? selectedAssignedFor.join(",")
          : undefined,
      page: currentPage,
      limit: pageSize,
      ...timeParams,
      start_date: customRange[0] || undefined,
      end_date: customRange[1] || undefined,
    };
  }, [
    selectedCategory,
    selectedRiskLevel,
    selectedStatus,
    selectedReviewStatus,
    selectedCountry,
    selectedAssignedFor,
    normalizedSearch,
    selectedTimeRange,
    currentPage,
    pageSize,
    customRange,
  ]);

  const dashboardParams = useMemo(() => {
    return normalizeTimeFilterParams({
      time_filter: selectedTimeRange,
      start_date: customRange[0],
      end_date: customRange[1],
    });
  }, [selectedTimeRange, customRange]);

  // React Query hooks with polling
  const {
    screenings: entries,
    pagination,
    isLoading: isLoadingScreenings,
    isFetching: isFetchingRecords,
    isRefetching,
    isError: isScreeningsError,
    dataUpdatedAt,
    refresh: refreshScreenings,
  } = useWatchlistScreenings({
    params: queryParams ?? {},
    enabled: queryParams !== null,
  });

  const {
    dashboardStats,
    isLoading: isLoadingDashboard,
    isError: isDashboardError,
  } = useWatchlistDashboard({
    params: dashboardParams,
  });

  const {
    filtersResponse,
    isLoading: isLoadingFilters,
    isError: isFiltersError,
  } = useWatchlistFilters({});

  const { users } = useWatchlistUsers({});

  const initialLoading =
    isLoadingScreenings || isLoadingDashboard || isLoadingFilters;
  const hasError = isScreeningsError || isDashboardError || isFiltersError;

  // Build assignee details map when entries change
  useEffect(() => {
    if (entries.length > 0) {
      setAssigneeDetails(buildAssigneeDetailsMap(entries));
    }
  }, [entries]);

  type AssigneeDetails = { name: string; role: string };

  const buildAssigneeDetailsMap = (
    list: Screening[],
  ): Record<string, AssigneeDetails> =>
    list.reduce<Record<string, AssigneeDetails>>((acc, entry) => {
      const name = entry.assignUser?.fullName ?? "";
      const roleName = entry.assignUser?.role?.roleName ?? "";
      if (name || roleName) {
        acc[entry.reference] = { name, role: roleName };
      }
      return acc;
    }, {});

  const handleTimeRangeChange = (value: string, range?: [string, string]) => {
    console.log(
      range ? "Selected custom range:" : "Selected time range:",
      range ?? value,
    );
    if (value === "custom" && !range) {
      setCustomRange(["", ""]);
    }
  };

  const filterState = {
    searchTerm: searchTerm,
    selectedCategory,
    selectedCountry,
    selectedRiskLevel,
    selectedStatus,
    selectedReviewStatus,
    selectedAssignedFor,
    selectedTimeRange,
    customRange,
  };

  const filterSetters = {
    setSearchTerm: setSearchTerm,
    setSelectedCategory,
    setSelectedCountry,
    setSelectedRiskLevel,
    setSelectedStatus,
    setSelectedReviewStatus,
    setSelectedAssignedFor,
    setSelectedTimeRange,
    setCustomRange,
  };

  const dashboardData = dashboardStats?.data;
  const allCategories = filtersResponse?.data.filters || [];
  const allCountries = filtersResponse?.data.countries || [];
  const allRiskLevels = filtersResponse?.data.riskLevelOptions || [];
  const allReviewStatuses = filtersResponse?.data.reviewStatusOptions || [];
  const tenantCategories = filtersResponse?.data.tenantSettings.filters || [];
  const tenantCountries = filtersResponse?.data.tenantSettings.countries || [];
  const timeFilterOptions = filtersResponse?.data.timeFilterOptions || [];

  const filteredEntries = entries;

  const totalRecords = pagination?.total ?? entries.length;
  const totalPages = getTotalPages(totalRecords, pageSize);
  const currentPageSafe = getSafePage(currentPage, totalPages);
  const permissions = usePermissions();

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
      selectedCategory.length > 0 ||
      selectedCountry.length > 0 ||
      selectedRiskLevel.length > 0 ||
      selectedStatus.length > 0 ||
      selectedReviewStatus.length > 0 ||
      selectedAssignedFor.length > 0 ||
      selectedTimeRange !== "7d"
    );
  }, [
    debouncedSearchTerm,
    selectedCategory,
    selectedCountry,
    selectedRiskLevel,
    selectedStatus,
    selectedReviewStatus,
    selectedAssignedFor,
    selectedTimeRange,
  ]);

  const handleClearFilters = () => {
    setShowSidebarLoader(false);
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedCategory([]);
    setSelectedCountry([]);
    setSelectedRiskLevel([]);
    setSelectedStatus([]);
    setSelectedReviewStatus([]);
    setSelectedAssignedFor([]);
    setSelectedTimeRange("7d");
    setCurrentPage(1);
    setSavedFilterClearSignal((prev) => prev + 1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [
    normalizedSearch,
    selectedRiskLevel,
    selectedStatus,
    selectedCategory,
    selectedCountry,
    selectedReviewStatus,
    selectedAssignedFor,
    selectedTimeRange,
    selectedTenantId,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const router = useRouter();

  const handleViewDetails = (entry: Screening) => {
    router.push(`/watchlist/screening/${entry.reference}`);
  };

  const handleReviewSubmitted = (
    reference: string,
    status: string,
    reviewNote: string,
  ) => {
    // Refresh the list to get the updated data
    refreshScreenings();
  };

  const handleAssigneeUpdated = (reference: string, user: User | null) => {
    // Update the assignee details cache
    setAssigneeDetails((prev) => {
      const updated = { ...prev };
      if (user) {
        updated[reference] = {
          name: user.name,
          role: user.role,
        };
      } else {
        delete updated[reference];
      }
      return updated;
    });

    // Refresh the list to get the updated data
    refreshScreenings();
  };

  const getDisplayedAssigneeName = (entry: Screening) =>
    assigneeDetails[entry.reference]?.name ||
    entry.assignUser?.fullName ||
    "Unassigned";

  const getDisplayedRole = (entry: Screening) =>
    assigneeDetails[entry.reference]?.role ||
    entry.assignUser?.role?.roleName ||
    "Unassigned";

  const renderAssigneeBadge = (entry: Screening) => {
    const displayedName = getDisplayedAssigneeName(entry);
    if (displayedName === "Unassigned") {
      return null;
    }
    const displayedRole = getDisplayedRole(entry);
    return (
      <div className="flex items-center space-x-4 text-sm text-muted-foreground flex-wrap dark:text-gray-400 border border-border bg-card w-fit px-2.5 py-1 rounded-lg">
        <span className="flex items-center capitalize gap-1">
          <ICONS.Pin size={14} className="" />
          <span className="flex items-center capitalize gap-2">
            <b>Assignee:</b>
            {displayedName} ({displayedRole})
          </span>
        </span>
      </div>
    );
  };

  const buildExportFilters = () => {
    const params: Record<string, string | undefined> = {
      search: normalizedSearch || undefined,
      category:
        selectedCategory.length > 0 ? selectedCategory.join(",") : undefined,
      risk_level:
        selectedRiskLevel.length > 0 ? selectedRiskLevel.join(",") : undefined,
      status: selectedStatus.length > 0 ? selectedStatus.join(",") : undefined,
      review_status:
        selectedReviewStatus.length > 0
          ? selectedReviewStatus.join(",")
          : undefined,
      assigned_for:
        selectedAssignedFor.length > 0
          ? selectedAssignedFor.join(",")
          : undefined,
      jurisdiction:
        selectedCountry.length > 0 ? selectedCountry.join(",") : undefined,
    };

    const timeParams = normalizeTimeFilterParams({
      time_filter: selectedTimeRange,
      start_date: customRange[0],
      end_date: customRange[1],
    });

    return {
      ...params,
      ...timeParams,
    };
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
      const params = { ...buildExportFilters(), format };
      const filteredParams = Object.entries(params).reduce(
        (acc, [key, value]) => {
          if (value) {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, string>,
      );
      const response = await exportAMLScreeningsPdf(
        filteredParams,
        "screenings",
      );

      if (!response.success || !response.data) {
        throw new Error(response.message ?? "Failed to export AML report.");
      }

      const binaryString = atob(response.data.content);
      const buffer = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i += 1) {
        buffer[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([buffer], {
        type: response.data.contentType ?? "application/octet-stream",
      });

      downloadFile(blob, response.data.filename, response.data.contentType);

      toast.success("AML export started.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to export AML report. Please try again.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const WATCHLIST_SCREENINGS_NAV_KEY = "watchlist-screenings:sidebar-nav";
  const [showSidebarLoader, setShowSidebarLoader] = useState(() => {
    const fromSidebar =
      sessionStorage.getItem(WATCHLIST_SCREENINGS_NAV_KEY) === "true";
    if (fromSidebar) {
      sessionStorage.removeItem(WATCHLIST_SCREENINGS_NAV_KEY);
      return true;
    }
    return false;
  });

  // useEffect(() => {
  //   const fromSidebar =
  //     sessionStorage.getItem(WATCHLIST_SCREENINGS_NAV_KEY) === "true";
  //   if (fromSidebar) {
  //     setShowSidebarLoader(true);
  //     sessionStorage.removeItem(WATCHLIST_SCREENINGS_NAV_KEY);
  //   }
  // }, []);

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
    // entries.length === 0 &&
    !isSwitchingTenant &&
    !hasActiveFilters &&
    // !isActive &&
    showSidebarLoader
  ) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <LoadingOverlay
          className="-inset-4!"
          loadingText="Loading screening data..."
        />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <MaintenanceNotice />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* {showSidebarLoader && isFetchingRecords && (
        <LoadingOverlay
          className="-inset-4!"
          loadingText="Loading Watchlist..."
        />
      )} */}
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            Watchlist Screenings
          </h1>
          <p className="text-gray-600 text-sm mt-0.5 dark:text-slate-400">
            Monitor and manage your screening items
          </p>
          {dataUpdatedAt > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {isRefetching && <RefreshCw size={10} className="animate-spin" />}
              <span className="hidden sm:inline">
                Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
              </span>
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {/* Manual refresh button */}
          <button
            onClick={refreshScreenings}
            disabled={isFetchingRecords}
            className="p-2 rounded-lg border border-panel-border bg-card hover:bg-card/70 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw
              size={16}
              className={`text-muted-foreground ${isFetchingRecords ? "animate-spin" : ""}`}
            />
          </button>
          {selectedTimeRange === "custom" && (
            <DatePicker.RangePicker
              value={
                customRange[0] && customRange[1]
                  ? [dayjs(customRange[0]), dayjs(customRange[1])]
                  : undefined
              }
              size="large"
              format="YYYY-MM-DD"
              onChange={(values) => {
                if (!values || !values[0] || !values[1]) {
                  const clearedRange: [string, string] = ["", ""];
                  setCustomRange(clearedRange);
                  handleTimeRangeChange("custom", clearedRange);
                  return;
                }
                const nextRange: [string, string] = [
                  values[0].format("YYYY-MM-DD"),
                  values[1].format("YYYY-MM-DD"),
                ];
                setCustomRange(nextRange);
                handleTimeRangeChange("custom", nextRange);
              }}
              aria-label="Custom date range"
              className="px-3 py-1.5 border-none border-gray-300 bg-white text-sm font-medium text-gray-900 focus-within:!ring-0 focus-within:ring-gray-600 dark:border-[#373c4a] dark:bg-[#011613] dark:text-slate-100"
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
                  handleTimeRangeChange(value);
                }
              }}
              disabled={isFetchingRecords}
              className="appearance-none px-4 py-2 pr-10 border border-panel-border rounded-lg focus:outline-none focus:ring-2 focus:ring-white bg-card-second text-foreground text-sm font-medium shadow-sm cursor-pointer disabled:opacity-50"
            >
              {timeFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
          {permissions.canExportWatchlist && (
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
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {WATCHLIST_STAT_CARDS.map((config) => {
          const value = dashboardData?.[config.key] ?? 0;
          const trendInfo = dashboardData
            ? config.customTrend?.(dashboardData)
            : undefined;

          return (
            <SummaryCard
              key={config.key}
              title={config.title}
              value={value}
              mainColor={config.mainColor}
              icon={config.icon}
              bottomLabel={config.bottomLabel}
              {...(trendInfo
                ? {
                    trend: trendInfo.trend,
                    trendColor: trendInfo.trendColor,
                  }
                : {})}
            />
          );
        })}
      </div>

      {/* Screening Categories */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 dark:border-[#373c4a] dark:bg-[#011613]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Screening Categories
          </h2>
          {dashboardStats?.data.categories &&
            dashboardStats.data.categories.length > 5 && (
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#1A5276] hover:text-[#143F5C] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg cursor-pointer transition-all duration-500"
              >
                {showAllCategories
                  ? "Show Less"
                  : `+${dashboardStats.data.categories.length - 5} More`}
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${
                    showAllCategories ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {dashboardStats?.data.categories
            .slice(0, showAllCategories ? undefined : 5)
            .map((cat) => (
              <div
                key={cat.category}
                className="bg-gray-50 rounded-lg p-3 border dark:bg-[#011A04]"
              >
                <div className="text-xs mb-1 text-gray-600 dark:text-slate-400">
                  {cat.categoryDisplay}
                </div>
                <div className="text-lg font-bold dark:text-slate-100">
                  {cat.count}
                </div>
                <div
                  className={`text-xs font-semibold mt-1 ${getRiskBadgeClasses(
                    cat.riskLevel,
                    false,
                  )}`}
                >
                  {cat.riskLevel.toUpperCase()} {cat.riskLevel !== "" && "RISK"}
                </div>
              </div>
            ))}
          {/* <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 dark:border-[#373c4a] dark:bg-[#011A04]">
            <div className="text-gray-600 text-xs mb-1 font-medium dark:text-slate-400">
              OFAC Sanctions
            </div>
            <div className="text-gray-900 font-bold text-lg dark:text-slate-100">
              {
                initialEntries.filter(
                  (entry) => entry.listType === "OFAC Sanctions"
                ).length
              }
            </div>
            <div className="text-red-600 text-xs mt-1 font-semibold dark:text-red-400">
              Critical
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 dark:border-[#373c4a] dark:bg-[#011A04]">
            <div className="text-gray-600 text-xs mb-1 font-medium dark:text-slate-400">
              PEP Database
            </div>
            <div className="text-gray-900 font-bold text-lg dark:text-slate-100">
              {
                initialEntries.filter(
                  (entry) => entry.listType === "PEP Database"
                ).length
              }
            </div>
            <div className="text-orange-600 text-xs mt-1 font-semibold dark:text-orange-400">
              High Risk
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 dark:border-[#373c4a] dark:bg-[#011A04]">
            <div className="text-gray-600 text-xs mb-1 font-medium dark:text-slate-400">
              Terrorist Financing
            </div>
            <div className="text-gray-900 font-bold text-lg dark:text-slate-100">
              {
                initialEntries.filter(
                  (entry) => entry.listType === "Terrorist Financing"
                ).length
              }
            </div>
            <div className="text-red-600 text-xs mt-1 font-semibold dark:text-red-400">
              Critical
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 dark:border-[#373c4a] dark:bg-[#011A04]">
            <div className="text-gray-600 text-xs mb-1 font-medium dark:text-slate-400">
              Adverse Media
            </div>
            <div className="text-gray-900 font-bold text-lg dark:text-slate-100">
              {
                initialEntries.filter(
                  (entry) => entry.listType === "Adverse Media"
                ).length
              }
            </div>
            <div className="text-yellow-600 text-xs mt-1 font-semibold dark:text-yellow-400">
              Medium Risk
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 dark:border-[#373c4a] dark:bg-[#011A04]">
            <div className="text-gray-600 text-xs mb-1 font-medium dark:text-slate-400">
              Internal Watchlist
            </div>
            <div className="text-gray-900 font-bold text-lg dark:text-slate-100">
              {
                initialEntries.filter(
                  (entry) => entry.listType === "Internal Watchlist"
                ).length
              }
            </div>
            <div className="text-orange-600 text-xs mt-1 font-semibold dark:text-orange-400">
              High Risk
            </div>
          </div> */}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 mb-4 dark:border-[#373c4a] dark:bg-[#011613]">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <ICONS.Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by ID or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1A5276] focus:border-transparent dark:border-[#373c4a] dark:bg-[#011613] dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-[#4b7f84]"
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Select
              mode="multiple"
              size="large"
              placeholder="Categories"
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ minWidth: 120 }}
            >
              {[...tenantCategories].map((category) => (
                <Select.Option key={category} value={category}>
                  {getNameByCode(allCategories, category)}
                </Select.Option>
              ))}
            </Select>
            <Select
              mode="multiple"
              size="large"
              placeholder="Countries"
              value={selectedCountry}
              onChange={setSelectedCountry}
              style={{ minWidth: 120 }}
            >
              {[...tenantCountries].map((category) => (
                <Select.Option key={category} value={category}>
                  {getNameByCode(allCountries, category)}
                </Select.Option>
              ))}
            </Select>
            <Select
              mode="multiple"
              size="large"
              placeholder="Risk Level"
              value={selectedRiskLevel}
              onChange={setSelectedRiskLevel}
              style={{ minWidth: 120 }}
            >
              {allRiskLevels.map((risk) => (
                <Select.Option key={risk.value} value={risk.value}>
                  {risk.label}
                </Select.Option>
              ))}
            </Select>
            {/* <Select
              mode="multiple"
              size="large"
              placeholder="Status"
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ minWidth: 120 }}
            >
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
            </Select> */}
            <Select
              mode="multiple"
              size="large"
              placeholder="Review Status"
              value={selectedReviewStatus}
              onChange={setSelectedReviewStatus}
              style={{ minWidth: 120 }}
            >
              {allReviewStatuses.map((reviewStatus) => (
                <Select.Option
                  key={reviewStatus.value}
                  value={reviewStatus.value}
                >
                  {getStatusOptionLabel(reviewStatus.value, reviewStatus.label)}
                </Select.Option>
              ))}
            </Select>
            <Select
              mode="multiple"
              size="large"
              placeholder="Assigned To"
              value={selectedAssignedFor}
              onChange={setSelectedAssignedFor}
              style={{ minWidth: 120 }}
            >
              {/* <Select.Option value="unassigned">Unassigned</Select.Option> */}
              {users.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name}
                </Select.Option>
              ))}
            </Select>
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
        />
      </div>

      {/* Screening Entries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-12 space-y-3">
          {isFetchingRecords ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center text-gray-600 dark:border-[#373c4a] dark:bg-[#011613] dark:text-slate-400">
              <div className="flex gap-5 justify-center items-center space-x-2">
                <Loader />
                Loading screening data...
              </div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center dark:border-[#373c4a] dark:bg-[#011613]">
              <ICONS.FileText
                className="mx-auto text-gray-400 mb-4 dark:text-slate-500"
                size={48}
              />
              <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-slate-100">
                No Screening Entries Found
              </h3>
              <p className="text-gray-600 mb-4 dark:text-slate-400">
                No entries match your current filters. Try adjusting your search
                or filter criteria.
              </p>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const assigneeBadge = renderAssigneeBadge(entry);
              return (
                <div
                  key={entry.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all dark:border-[#373c4a] dark:bg-[#011613]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 flex-wrap gap-2 mb-2">
                        <span className="text-gray-900 font-semibold text-lg dark:text-slate-100">
                          <CopyableText text={entry.reference} truncate />
                        </span>
                        {/* <span className={getStatusBadgeClasses(entry.status)}>
                          {entry.status.toUpperCase()}
                        </span> */}
                        <span
                          className={getStatusBadgeClasses(entry.reviewStatus)}
                        >
                          {getStatusWithIcon(
                            getNameByCode(
                              allReviewStatuses,
                              entry.reviewStatus,
                            ) || "N/A",
                          )}
                        </span>
                        <span className={getRiskBadgeClasses(entry.riskLevel)}>
                          Risk:{" "}
                          {getNameByCode(allRiskLevels, entry.riskLevel) ||
                            "N/A"}
                        </span>
                        <span className={getCategoryBadgeClasses()}>
                          {entry.categoryDisplay}
                        </span>
                      </div>
                      {entry.customerId ? (
                        <Link
                          href={`/customer-risk/${entry.customerId}`}
                          className="text-gray-900 font-semibold text-base mb-2 dark:text-slate-100 inline-flex items-center gap-1"
                        >
                          <span>
                            {entry.fullName ||
                              `${entry.firstName} ${entry.lastName}`}
                          </span>
                          <ICONS.ExternalLink
                            size={16}
                            className="text-gray-400 dark:text-slate-300"
                          />
                        </Link>
                      ) : (
                        <div className="text-gray-900 font-semibold text-base mb-2 dark:text-slate-100 inline-flex items-center gap-1 opacity-70">
                          <span>
                            {entry.fullName ||
                              `${entry.firstName} ${entry.lastName}`}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-600 flex-wrap dark:text-slate-400">
                        <span className="flex items-center">
                          <ICONS.Building size={14} className="mr-1" />
                          {entry.entityType}
                        </span>
                        <span className="flex items-center">
                          <ICONS.MapPin size={14} className="mr-1" />
                          {entry.country || "N/A"}
                        </span>
                        <span className="flex items-center">
                          <ICONS.Clock size={14} className="mr-1" />
                          Added:{" "}
                          {convertDate(entry.addedDate, "YYYY-MM-DD HH:mm:ss")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 dark:border-[#373c4a] dark:bg-[#011A04]">
                      <div className="text-gray-600 text-xs mb-1 font-medium dark:text-slate-400">
                        Match Count
                      </div>
                      <div className="text-gray-900 font-bold text-lg dark:text-slate-100">
                        {entry.matchCount}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 dark:border-[#373c4a] dark:bg-[#011A04]">
                      <div className="text-gray-600 text-xs mb-1 font-medium dark:text-slate-400">
                        Last Match
                      </div>
                      <div className="text-gray-900 text-sm dark:text-slate-100">
                        {entry.lastMatch}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 md:col-span-2 dark:border-[#373c4a] dark:bg-[#011A04]">
                      <div className="text-gray-600 text-xs mb-1 font-medium dark:text-slate-400">
                        Notes
                      </div>
                      <div className="text-gray-900 text-sm dark:text-slate-100">
                        {entry.notes || "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between space-x-2">
                    <div className="flex-1">{assigneeBadge}</div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/watchlist/screening/${entry.reference}`}
                        className="px-4 py-2 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-all text-sm font-medium flex items-center space-x-1.5 cursor-pointer dark:bg-[#2a5a5f] dark:hover:bg-[#1f4648]"
                      >
                        <ICONS.Eye size={16} />
                        <span>View Details</span>
                      </Link>
                      {entry.matchCount > 0 && (
                        <Link
                          href={`/watchlist/screening/matches/${entry.reference}`}
                          className="px-4 py-2 cursor-pointer bg-orange-100 text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-200 transition-all text-sm font-medium dark:border-orange-700 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/40 inline-flex items-center space-x-1.5"
                        >
                          <ICONS.Eye size={16} />
                          <span>View Matches</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {entries.length > 0 && (
        <PaginationControls
          currentPage={currentPageSafe}
          totalPages={totalPages}
          pageSize={pageSize}
          totalRecords={totalRecords}
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
                Export Screenings
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors dark:text-slate-400 dark:hover:text-slate-100"
              >
                <ICONS.X size={20} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4 dark:text-slate-400">
              Select the format to export watchlist screenings:
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
