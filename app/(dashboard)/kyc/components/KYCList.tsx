"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DatePicker, Select } from "antd";
import { ChevronDown, RefreshCw } from "lucide-react";
import { ICONS, TIME_RANGES } from "@/constants/constants";
import { KycStatus } from "@/enums/kyc/kycStatus";
import { convertDate } from "@/utils/convertDate";
import { getStatusBadgeClasses } from "@/utils/kyc/badgeClasses";
import { VerificationStage } from "@/enums/kyc/verificationStage";
import { KYCProof, KYCRecord } from "@/types/kyc/kyc.types";
import Loader from "@/components/ui/loader/Loader";
import LoadingOverlay from "@/components/layout/LoadingOverlay";
import PaginationControls, {
  getSafePage,
  getTotalPages,
} from "@/components/ui/PaginationControls";

import CopyableText from "@/components/common/copyable-text/CopyableText";
import SummaryCard from "@/components/layout/SummaryCard";
import { useTenant } from "@/components/providers/tenant.provider";
import MaintenanceNotice from "@/components/common/MaintenanceNotice";
import SavedFilterManager from "@/components/common/SavedFilterManager";
import { useKYCRecords, useKYCOverview } from "@/hooks/useKYC";
import { getStatusWithIcon, getStatusOptionLabel } from "@/utils/statusHelpers";

const verificationStageConfigs = [
  {
    label: "ID",
    booleanKey: "idVerified" as const,
    stage: VerificationStage.ID_VERIFICATION,
    proofTypes: ["document", "passport", "id_card", "identity"],
  },
  {
    label: "Address",
    booleanKey: "addressVerified" as const,
    stage: VerificationStage.ADDRESS_VERIFICATION,
    proofTypes: ["address", "utility", "proof_of_address"],
  },
  {
    label: "Face",
    booleanKey: "faceVerified" as const,
    stage: VerificationStage.FACE_VERIFICATION,
    proofTypes: ["face", "selfie", "biometric"],
  },
] as const;

const isProofMarkedVerified = (proof?: KYCProof) => {
  if (!proof) {
    return false;
  }

  if (proof.verified) {
    return true;
  }

  const status = proof.status?.toString().toLowerCase() ?? "";
  return /complete|verified|accepted|approved/i.test(status);
};

const parseBooleanish = (value: unknown) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes") {
      return true;
    }
    if (normalized === "false" || normalized === "0" || normalized === "no") {
      return false;
    }
  }
  if (typeof value === "number") {
    return value > 0;
  }
  return undefined;
};

const resolveVerificationStatus = (
  record: KYCRecord,
  config: (typeof verificationStageConfigs)[number],
) => {
  const flag = record[config.booleanKey] as unknown;
  const boolFlag = parseBooleanish(flag);
  if (typeof boolFlag === "boolean") {
    return boolFlag;
  }

  const matchingProof = record.proofs?.find((proof) => {
    const normalizedType = (proof.type ?? "").toLowerCase();
    return config.proofTypes.some((type) => normalizedType.includes(type));
  });

  return isProofMarkedVerified(matchingProof);
};

const getVerificationSteps = (record: KYCRecord) =>
  verificationStageConfigs.map((config) => ({
    label: config.label,
    verified: resolveVerificationStatus(record, config),
    stage: config.stage,
  }));

const KYC_TIME_RANGE_OPTIONS = [
  ...TIME_RANGES,
  { value: "custom", label: "Custom Range" },
];

export default function KYCList() {
  const searchParams = useSearchParams();
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const [customRange, setCustomRange] = useState<[string, string]>(["", ""]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"created_at" | "updated_at">(
    "created_at",
  );
  const { selectedTenantId, isSwitchingTenant } = useTenant();
  const router = useRouter();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [savedFilterClearSignal, setSavedFilterClearSignal] = useState(0);

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam) {
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => {
        if (statusParam === "all") {
          setSelectedStatus([]);
        } else {
          setSelectedStatus(statusParam.split(","));
        }
      });
    }
    const pageParam = searchParams.get("page");
    if (pageParam) {
      queueMicrotask(() => {
        setCurrentPage(parseInt(pageParam) || 1);
      });
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
    // { label: "Review Pending", value: KycStatus.REVIEW_PENDING },
    { label: "Accepted", value: KycStatus.ACCEPTED },
    { label: "Declined", value: KycStatus.DECLINED },
  ];

  const normalizedSearch = debouncedSearchTerm.trim();

  const filterState = {
    searchTerm: searchTerm,
    selectedStatus,
    selectedTimeRange,
    customRange,
  };

  const filterSetters = {
    setSearchTerm: setSearchTerm,
    setSelectedStatus,
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
      return { fromDate: customRange[0], toDate: customRange[1] };
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

  const customRangeIncomplete =
    selectedTimeRange === "custom" && (!customRange[0] || !customRange[1]);

  const queryParams = useMemo(
    () => ({
      status: selectedStatus.length === 0 ? "all" : selectedStatus.join(","),
      search: normalizedSearch || undefined,
      fromDate: selectedDateRange?.fromDate,
      toDate: selectedDateRange?.toDate,
      page: currentPage,
      limit: pageSize,
      sort_by: sortBy,
      sort: sortOrder,
    }),
    [
      currentPage,
      normalizedSearch,
      pageSize,
      selectedDateRange,
      selectedStatus,
      sortBy,
      sortOrder,
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
    records: kycRecords,
    pagination,
    total: totalRecords,
    isFetching: isFetchingRecords,
    isRefetching: isRefetchingRecords,
    isError: hasRecordsError,
    dataUpdatedAt: recordsUpdatedAt,
    refresh: refreshRecords,
  } = useKYCRecords({
    params: queryParams,
    enabled: !customRangeIncomplete,
  });

  const { overview: overviewStats, refresh: refreshOverview } = useKYCOverview({
    params: overviewParams,
    enabled: !customRangeIncomplete && !!selectedDateRange,
  });

  const handleRefresh = () => {
    refreshRecords();
    refreshOverview();
  };

  useEffect(() => {
    // Use queueMicrotask to avoid synchronous setState in effect
    queueMicrotask(() => {
      setCurrentPage(1);
    });
  }, [
    normalizedSearch,
    selectedStatus,
    selectedTimeRange,
    customRange,
    selectedTenantId,
  ]);

  const handleReviewClick = (kycId: string) => {
    router.push(`/kyc/${kycId}?from=kyc-master`);
  };

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
      selectedTimeRange !== "7d"
    );
  }, [debouncedSearchTerm, selectedStatus, selectedTimeRange]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedStatus([]);
    setSelectedTimeRange("7d");
    setCustomRange(["", ""]);
    setCurrentPage(1);
    setSavedFilterClearSignal((prev) => prev + 1);
  };

  const fallbackStatusCounts = useMemo(() => {
    const counts = { accepted: 0, declined: 0, pending: 0 };
    // const pendingStatuses = new Set([KycStatus.PENDING, KycStatus.REVIEW_PENDING]);

    kycRecords.forEach((record) => {
      if (record.status === KycStatus.ACCEPTED) {
        counts.accepted += 1;
        return;
      }
      if (record.status === KycStatus.DECLINED) {
        counts.declined += 1;
        return;
      }
      // if (pendingStatuses.has(record.status)) {
      //   counts.pending += 1;
      // }
    });

    return counts;
  }, [kycRecords]);

  const masterStats = useMemo(
    () => ({
      total: overviewStats?.total ?? kycRecords.length,
      accepted: overviewStats?.approved ?? fallbackStatusCounts.accepted,
      declined: overviewStats?.rejected ?? fallbackStatusCounts.declined,
      pending: overviewStats?.pending ?? fallbackStatusCounts.pending,
    }),
    [kycRecords.length, overviewStats, fallbackStatusCounts],
  );

  // const statusHighlights = [
  //   {
  //     label: "KYC Pending",
  //     count: masterStats.pending ?? 0,
  //     Icon: ICONS.Clock,
  //     iconClass: "text-yellow-600 dark:text-yellow-400",
  //   },
  //   {
  //     label: "KYC Accepted/Verified",
  //     count: masterStats.accepted ?? 0,
  //     Icon: ICONS.CheckCircle,
  //     iconClass: "text-emerald-600 dark:text-emerald-400",
  //   },
  //   {
  //     label: "KYC Declined/Rejected",
  //     count: masterStats.declined ?? 0,
  //     Icon: ICONS.XCircle,
  //     iconClass: "text-red-600 dark:text-red-400",
  //   },
  // ];

  const KYC_MASTER_NAV_KEY = "kyc-master:sidebar-nav";
  const [showSidebarLoader, setShowSidebarLoader] = useState(() => {
    const fromSidebar = sessionStorage.getItem(KYC_MASTER_NAV_KEY) === "true";
    if (fromSidebar) {
      sessionStorage.removeItem(KYC_MASTER_NAV_KEY);
      return true;
    }
    return false;
  });

  const effectiveTotalRecords = totalRecords || pagination?.total || 0;
  const totalPages = getTotalPages(effectiveTotalRecords, pageSize);
  const currentPageSafe = getSafePage(currentPage, totalPages);

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
      queueMicrotask(() => {
        setShowSidebarLoader(false);
      });
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
          loadingText="Loading KYC data..."
        />
      </div>
    );
  }

  if (hasRecordsError) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <MaintenanceNotice />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">
            KYC Master View
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5 dark:text-gray-400">
            Tenant master list covering every status so you can review KYC
            requests end-to-end.
          </p>
          {recordsUpdatedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {new Date(recordsUpdatedAt).toLocaleTimeString()}
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
          </div>
          <div className="relative inline-block">
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
              size="large"
              format="YYYY-MM-DD"
              onChange={handleCustomRangeChange}
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
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-4">
        <SummaryCard
          title="Total KYC Records"
          value={masterStats.total}
          mainColor="blue"
          icon={ICONS.Users}
        />
        <SummaryCard
          title="Pending KYC Records"
          value={masterStats.pending}
          mainColor="yellow"
          icon={ICONS.Clock}
        />
        <SummaryCard
          title="Approved KYC Records"
          value={masterStats.accepted}
          mainColor="green"
          icon={ICONS.CheckCircle}
        />
        {/* <SummaryCard
          title="High Risk"
          value={masterStats.declined}
          mainColor="red"
          icon={ICONS.AlertTriangle}
        /> */}
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
              placeholder="Search by KYC ID, Customer Name, or Reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card border border-panel-border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent  dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-ring"
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Select
              mode="multiple"
              size="small"
              placeholder="Status"
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ minWidth: 110 }}
              options={statusOptions.map((option) => ({
                label: getStatusOptionLabel(option.value, option.label),
                value: option.value,
              }))}
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
          filterType="kyc"
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
                  }}
                  className="px-4 py-2 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-colors dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            kycRecords.map((record: KYCRecord) => {
              const customerName = [record.firstName, record.lastName]
                .filter(Boolean)
                .join(" ")
                .trim();
              const verificationSteps = getVerificationSteps(record);
              const nextVerificationStage =
                verificationSteps.find((step) => !step.verified)?.stage ??
                "Completed";
              // const documentStatus = getDocumentStatus(record.proofs);

              return (
                <div
                  key={record.id}
                  className="bg-card rounded-xl border border-panel-border shadow-sm p-5 hover:shadow-md transition-all "
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 flex-wrap gap-2 mb-2">
                        <span className="text-foreground font-semibold text-lg dark:text-gray-100">
                          <CopyableText text={record?.id} truncate />
                        </span>
                        <span className={getStatusBadgeClasses(record.status)}>
                          {getStatusWithIcon(record.status)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground flex-wrap dark:text-gray-400">
                        <span className="flex items-center">
                          <ICONS.Clock size={14} className="mr-1" />
                          {convertDate(record.createdAt, "YYYY-MM-DD HH:mm:ss")}
                        </span>
                        <span className="flex items-center">
                          <ICONS.FileText size={14} className="mr-1" />
                          {record.proofs.length} Documents
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-card rounded-lg p-3 border border-panel-border dark:bg-slate-800">
                      <div className="text-muted-foreground text-xs mb-1 font-medium dark:text-gray-400">
                        Customer Name
                      </div>
                      <div className="text-foreground font-semibold text-sm capitalize dark:text-gray-100 mb-2">
                        {customerName || "Unknown Customer"}
                      </div>
                      <div className="text-muted-foreground text-xs uppercase dark:text-gray-400">
                        <CopyableText
                          text={record?.forwardReference}
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
                          documentStatus.isComplete
                            ? "text-green-600 dark:text-green-400"
                            : "text-yellow-600 dark:text-yellow-300"
                        }`}
                      >
                        {documentStatus.label}
                      </div>
                    </div> */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 dark:border-[#373c4a] dark:bg-[#04440b4f]">
                      <div className="text-gray-600 text-xs mb-1 font-medium dark:text-slate-400">
                        Verification Progress
                      </div>
                      <div className="flex items-center space-x-2">
                        {verificationSteps.map((item) => (
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

                  <div className="flex justify-end space-x-2">
                    <button
                      className="px-4 py-2 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-all text-sm font-medium flex items-center space-x-1.5 cursor-pointer dark:bg-[#2a5a5f] dark:hover:bg-[#1f4648]"
                      onClick={() => handleReviewClick(record.id)}
                    >
                      <ICONS.Eye size={16} />
                      <span>Review KYC</span>
                    </button>
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
    </div>
  );
}
