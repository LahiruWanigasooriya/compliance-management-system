"use client";

import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DatePicker, Select } from "antd";
import { ChevronDown, RefreshCw } from "lucide-react";
import { ICONS } from "@/constants/constants";
import { InternalWatchlistEntry } from "@/types/aml/screening";
import { getNameByCode } from "@/utils/aml/getNameByCode";
import {
  getCategoryBadgeClasses,
  getRiskBadgeClasses,
  getStatusBadgeClasses,
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
import { calculateAge } from "@/utils/calculateAge";
import {
  useInternalWatchlist,
  useWatchlistFilters,
} from "@/hooks/useWatchlist";
import { usePermissions } from "@/hooks/usepermissions";
import { getStatusWithIcon, getStatusOptionLabel } from "@/utils/statusHelpers";

export default function InternalWatchlistList() {
  const router = useRouter();
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const [customRange, setCustomRange] = useState<[string, string]>(["", ""]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string[]>([]);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string[]>([]);
  const [selectedReviewStatus, setSelectedReviewStatus] = useState<string[]>(
    [],
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isExporting, setIsExporting] = useState(false);
  const [savedFilterClearSignal, setSavedFilterClearSignal] = useState(0);
  const { selectedTenantId, isSwitchingTenant } = useTenant();
  const WATCHLIST_INTERNAL_NAV_KEY = "watchlist-internal:sidebar-nav";
  const [showSidebarLoader, setShowSidebarLoader] = useState(() => {
    const fromSidebar =
      sessionStorage.getItem(WATCHLIST_INTERNAL_NAV_KEY) === "true";
    if (fromSidebar) {
      sessionStorage.removeItem(WATCHLIST_INTERNAL_NAV_KEY);
      return true;
    }
    return false;
  });

  // useEffect(() => {
  //   const fromSidebar =
  //     sessionStorage.getItem(WATCHLIST_INTERNAL_NAV_KEY) === "true";
  //   if (fromSidebar) {
  //     setShowSidebarLoader(true);
  //     sessionStorage.removeItem(WATCHLIST_INTERNAL_NAV_KEY);
  //   }
  // }, []);

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
      // review_status:
      //   selectedReviewStatus.length > 0
      //     ? selectedReviewStatus.join(",")
      //     : undefined,
      jurisdiction:
        selectedCountry.length > 0 ? selectedCountry.join(",") : undefined,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      ...timeParams,
      start_date: customRange[0] || undefined,
      end_date: customRange[1] || undefined,
    };
  }, [
    selectedCategory,
    selectedRiskLevel,
    selectedCountry,
    // selectedReviewStatus,
    normalizedSearch,
    selectedTimeRange,
    currentPage,
    pageSize,
    customRange,
  ]);

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
  } = useInternalWatchlist({
    params: queryParams ?? {},
    enabled: queryParams !== null,
  });

  const {
    filtersResponse,
    isLoading: isLoadingFilters,
    isError: isFiltersError,
  } = useWatchlistFilters({});

  const initialLoading = isLoadingScreenings || isLoadingFilters;
  const hasError = isScreeningsError || isFiltersError;

  const handleTimeRangeChange = (value: string, range?: [string, string]) => {
    if (value === "custom" && !range) {
      setCustomRange(["", ""]);
    }
  };

  const filterState = {
    searchTerm: searchTerm,
    selectedCategory,
    selectedCountry,
    selectedRiskLevel,
    selectedReviewStatus,
    selectedTimeRange,
    customRange,
  };

  const filterSetters = {
    setSearchTerm: setSearchTerm,
    setSelectedCategory,
    setSelectedCountry,
    setSelectedRiskLevel,
    setSelectedReviewStatus,
    setSelectedTimeRange,
    setCustomRange,
  };

  const allCategories = filtersResponse?.data.filters || [];
  const allCountries = filtersResponse?.data.countries || [];
  const allRiskLevels = filtersResponse?.data.riskLevelOptions || [];
  const allReviewStatuses = filtersResponse?.data.reviewStatusOptions || [];
  const tenantCategories = filtersResponse?.data.tenantSettings.filters || [];
  const tenantCountries = filtersResponse?.data.tenantSettings.countries || [];
  const timeFilterOptions = filtersResponse?.data.timeFilterOptions || [];
  const permissions = usePermissions();
  const filteredEntries = entries;

  const totalRecords = pagination?.total ?? entries.length;
  const totalPages = getTotalPages(totalRecords, pageSize);
  const currentPageSafe = getSafePage(currentPage, totalPages);

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
      selectedReviewStatus.length > 0 ||
      selectedTimeRange !== "7d"
    );
  }, [
    debouncedSearchTerm,
    selectedCategory,
    selectedCountry,
    selectedRiskLevel,
    selectedReviewStatus,
    selectedTimeRange,
  ]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedCategory([]);
    setSelectedCountry([]);
    setSelectedRiskLevel([]);
    setSelectedReviewStatus([]);
    setSelectedTimeRange("7d");
    setCurrentPage(1);
    setSavedFilterClearSignal((prev) => prev + 1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [
    normalizedSearch,
    selectedRiskLevel,
    selectedCategory,
    selectedCountry,
    selectedReviewStatus,
    selectedTimeRange,
    selectedTenantId,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const buildExportFilters = () => {
    const params: Record<string, string | undefined> = {
      search: normalizedSearch || undefined,
      category:
        selectedCategory.length > 0 ? selectedCategory.join(",") : undefined,
      risk_level:
        selectedRiskLevel.length > 0 ? selectedRiskLevel.join(",") : undefined,
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
      const response = await exportAMLScreeningsPdf(filteredParams, "internal");

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

      toast.success("Internal watchlist export started.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to export internal watchlist report. Please try again.",
      );
    } finally {
      setIsExporting(false);
    }
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
          loadingText="Loading internal watchlist data..."
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
          loadingText="Loading Internal Watchlist..."
        />
      )} */}
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            Internal Watchlist
          </h1>
          <p className="text-gray-600 text-sm mt-0.5 dark:text-slate-400">
            Monitor and manage your internal watchlist items
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
        <div className="flex items-center space-x-2 gap-2">
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
              onClick={() => handleExport("csv")}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {WATCHLIST_STAT_CARDS.map((config) => {
          const value = dashboardData?.[config.key] ?? 0;
          const trendInfo = dashboardData ? config.customTrend?.(dashboardData) : undefined;

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
      </div> */}

      {/* Internal Watchlist Categories */}
      {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 dark:border-[#373c4a] dark:bg-[#011613]">
        <h2 className="text-lg font-semibold text-gray-900 mb-3 dark:text-slate-100">
          Internal Watchlist Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {dashboardStats?.data.categories.map((cat) => (
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
        </div>
      </div> */}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 dark:border-[#373c4a] dark:bg-[#011613]">
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
              placeholder="Review Status"
              value={selectedReviewStatus}
              onChange={setSelectedReviewStatus}
              style={{ minWidth: 120 }}
              allowClear
            >
              <Select.Option value="pending_review">
                {getStatusOptionLabel("pending_review", "Pending Review")}
              </Select.Option>
              <Select.Option value="reviewed">
                {getStatusOptionLabel("reviewed", "Reviewed")}
              </Select.Option>
            </Select> */}
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
          filterType="aml-watchlist"
        />
      </div>

      {/* Internal Watchlist Entries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-12 space-y-3">
          {isFetchingRecords ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center text-gray-600 dark:border-[#373c4a] dark:bg-[#011613] dark:text-slate-400">
              <div className="flex gap-5 justify-center items-center space-x-2">
                <Loader />
                Loading internal watchlist data...
              </div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center dark:border-[#373c4a] dark:bg-[#011613]">
              <ICONS.FileText
                className="mx-auto text-gray-400 mb-4 dark:text-slate-500"
                size={48}
              />
              <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-slate-100">
                No Internal Watchlist Entries Found
              </h3>
              <p className="text-gray-600 mb-4 dark:text-slate-400">
                No entries match your current filters. Try adjusting your search
                or filter criteria.
              </p>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              return (
                <div
                  key={entry.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all dark:border-[#373c4a] dark:bg-[#011613]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 flex-wrap gap-2 mb-2">
                        <span className="text-gray-900 font-semibold text-lg dark:text-slate-100">
                          <CopyableText text={entry.id} truncate />
                        </span>
                        {/* <span
                          className={getStatusBadgeClasses(
                            entry.reviewedAt ? "reviewed" : "pending_review",
                          )}
                        >
                          {getStatusWithIcon(
                            entry.reviewedAt ? "reviewed" : "pending_review",
                          )}
                        </span> */}
                        <span className={getRiskBadgeClasses(entry.riskLevel)}>
                          Risk:{" "}
                          {getNameByCode(allRiskLevels, entry.riskLevel) ||
                            "N/A"}
                        </span>
                        <span className={getCategoryBadgeClasses()}>
                          {entry.category}
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
                          Individual
                        </span>
                        <span className="flex items-center">
                          <ICONS.MapPin size={14} className="mr-1" />
                          {entry.country || "N/A"}
                        </span>
                        <span className="flex items-center">
                          <ICONS.Clock size={14} className="mr-1" />
                          Added:{" "}
                          {convertDate(entry.createdAt, "YYYY-MM-DD HH:mm:ss")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 dark:border-[#373c4a] dark:bg-[#011A04]">
                      <div className="text-gray-600 text-xs mb-1 font-medium dark:text-slate-400">
                        Date of Birth
                      </div>
                      <div className="text-gray-900 text-sm dark:text-slate-100">
                        {entry.dob
                          ? convertDate(entry.dob, "Month Day, Year")
                          : "DOB not provided"}{" "}
                        <span className="font-semibold">
                          {entry.dob && `(Age: ${calculateAge(entry.dob)})`}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 dark:border-[#373c4a] dark:bg-[#011A04]">
                      <div className="text-gray-600 text-xs mb-1 font-medium dark:text-slate-400">
                        Reason
                      </div>
                      <div className="text-gray-900 text-sm dark:text-slate-100">
                        {entry.reason || "N/A"}
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
                  <div className="flex justify-end space-x-2">
                    <button
                      className="px-4 py-2 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-all text-sm font-medium flex items-center space-x-1.5 cursor-pointer dark:bg-[#2a5a5f] dark:hover:bg-[#1f4648]"
                      onClick={() =>
                        router.push(`/watchlist/internal/${entry.id}`)
                      }
                    >
                      <ICONS.Eye size={16} />
                      <span>View Details</span>
                    </button>
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
    </div>
  );
}
