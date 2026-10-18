"use client";
import DataCard from "@/components/common/data-card/DataCard";
import { createAuditLogColumns } from "./tables/AuditLogColumns";
import { DataTable } from "@/components/common/table/DataTable";
import { useEffect, useState } from "react";
import { ICONS } from "@/constants/constants";
import PaginationControls, {
  getTotalPages,
} from "@/components/ui/PaginationControls";
import { useGeoLocationLogs } from "@/hooks/useGeolocationLogs";
import { GeoLog, GetGeoParams } from "@/types/geolocation.types";
import LoadingOverlay from "@/components/layout/LoadingOverlay";
import GeoAuditLogPopupModal from "./modals/GeoAuditLogPopupModal";
import EmptyResult from "@/components/common/empty-result/EmptyResult";
import GeoAuditExportModal from "./modals/GeoAuditExportModal";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { useTenant } from "@/components/providers/tenant.provider";
import { usePermissions } from "@/hooks/usepermissions";
import GeoAuditLogFilterModal from "./modals/GeoAuditLogFilterModal";
import { FilterProps } from "@/types/common.types";
import FilterArea from "@/components/ui/filter-area";
import { getDateFromTimeFrame } from "@/utils/format";

const GeolocationAuditLogsPage = () => {
  const [sortKey, setSortKey] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isLogPopupOpen, setIsLogPopupOpen] = useState<boolean>(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterProps[]>([]);
  const [selectedLog, setSelectedLog] = useState<GeoLog | null>();
  const [pageSize, setPageSize] = useState(10);
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [queryParams, setQueryParams] = useState<GetGeoParams>({
    page: 1,
    limit: pageSize,
  });
  const {
    geoLogs,
    loading,
    currentPage,
    total,
    isFetching,
    isRefetching,
    dataUpdatedAt,
    refresh,
    downloadAllGeoAuditLogsMutation,
  } = useGeoLocationLogs(queryParams, setQueryParams);
  const { isSwitchingTenant } = useTenant();

  const handleViewLog = (log: GeoLog) => {
    setSelectedLog(log);
    setIsLogPopupOpen(true);
  };

  const handleSort = (key: string, direction: "asc" | "desc") => {
    setSortKey(key);
    setSortDirection(direction);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setQueryParams({ page: 1, limit: pageSize, search: query });
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== "") {
        handleSearch(searchQuery);
      } else {
        setQueryParams({ page: 1, limit: pageSize });
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleFiltersClick = () => {
    setShowFilterModal(true);
  };

  const handleApplyFilters = (filters: {
    severityType: string;
    resourceType: string;
    timeFrame: string;
    selectedUser: string;
    selectedUserName: string;
  }) => {
    const newFilters: FilterProps[] = [];
    const filterParams: GetGeoParams = {};
    if (filters.severityType) {
      newFilters.push({
        id: "severityType",
        type: "severityType",
        label: "Severity Type",
        value: filters.severityType,
        displayValue: filters.severityType,
      });
      filterParams.severity = filters.severityType;
    }
    if (filters.resourceType) {
      newFilters.push({
        id: "resourceType",
        type: "resourceType",
        label: "Resource Type",
        value: filters.resourceType,
        displayValue: filters.resourceType,
      });
      filterParams.resource = filters.resourceType;
    }
    if (filters.timeFrame) {
      newFilters.push({
        id: "timeFrame",
        type: "timeFrame",
        label: "Time Frame",
        value: filters.timeFrame,
        displayValue: filters.timeFrame,
      });
      filterParams.date_from = getDateFromTimeFrame(filters.timeFrame);
    }
    if (filters.selectedUser) {
      newFilters.push({
        id: "selectedUser",
        type: "selectedUser",
        label: "Performed By",
        value: filters.selectedUser,
        displayValue: filters.selectedUserName,
      });
      filterParams.performed_by = filters.selectedUser;
    }
    setAppliedFilters(newFilters);
    setQueryParams({ page: 1, limit: pageSize, ...filterParams });
  };

  const handleRemoveFilter = (filterId: string) => {
    const updatedFilters = appliedFilters.filter(
      (filter) => filter.id !== filterId,
    );
    setAppliedFilters(updatedFilters);

    const filterParams: GetGeoParams = {};

    updatedFilters.forEach((filter) => {
      if (filter.type === "severityType") {
        filterParams.severity = filter.value as string;
      } else if (filter.type === "resourceType") {
        filterParams.resource = filter.value as string;
      } else if (filter.type === "timeFrame") {
        filterParams.date_from = getDateFromTimeFrame(filter.value as string);
      } else if (filter.type === "selectedUser") {
        filterParams.performed_by = filter.value as string;
      }
    });
    if (
      !filterParams.severity &&
      !filterParams.resource &&
      !filterParams.date_from &&
      !filterParams.performed_by
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

  const handleExport = async (type: "csv" | "json" | "pdf") => {
    if (type === "pdf") {
      console.warn("PDF export not supported here");
      return;
    }
    setExporting(true);
    try {
      await downloadAllGeoAuditLogsMutation.mutateAsync({ type });
      toast.success("Geo audit logs report downloaded successfully.");
      setShowExportModal(false);
    } catch (error) {
      console.error("Downloading geo audit log report failed", error);
      toast.error("Unable to download all geo audit logs report.");
    } finally {
      setExporting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setQueryParams((prev) => ({ ...prev, limit: size }));
  };

  const columns = createAuditLogColumns(handleViewLog);
  const permissions = usePermissions();
  // Don't show individual page loader during tenant switch - the global overlay handles it
  if (loading && !isSwitchingTenant) {
    return (
      <LoadingOverlay
        className="-inset-4!"
        loadingText="Loading Geo Location Logs..."
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 md:gap-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">
              Geolocation Audit Logs
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-muted-foreground text-sm dark:text-gray-400">
                Track and monitor all geolocation-related system activities
              </p>
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
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={isFetching}
              className="p-2 rounded-lg border border-panel-border bg-card hover:bg-card/70 transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh data"
            >
              <RefreshCw
                size={16}
                className={`text-muted-foreground ${isFetching ? "animate-spin" : ""}`}
              />
            </button>
            {/* <span className="text-xs font-medium px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-[#1A5276] dark:text-blue-300 rounded-lg">
              {total} Total Logs
            </span> */}
            {permissions.canExportGEO && (
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-all text-sm font-medium shadow-sm cursor-pointer"
              >
                <ICONS.Download size={16} />
                <span>Export</span>
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-card rounded-xl border border-panel-border shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <ICONS.Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Log ID, User, Action..."
                className="w-full bg-card border border-panel-border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleFiltersClick}
                className="flex items-center gap-2 px-4 py-2 cursor-pointer border border-panel-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-foreground bg-card shadow-sm"
              >
                <ICONS.Filter size={16} />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </div>
        {appliedFilters.length > 0 && (
          <FilterArea
            appliedFilters={appliedFilters}
            handleRemoveFilter={handleRemoveFilter}
            handleClearAllFilters={handleClearAllFilters}
          />
        )}
        {/* Table Section */}
        {geoLogs &&
        (geoLogs.length > 0 ||
          appliedFilters.length > 0 ||
          searchQuery !== "") ? (
          <>
            {geoLogs.length > 0 && (
              <div className="bg-card rounded-xl border border-panel-border shadow-sm overflow-hidden">
                {/* Mobile Card View */}
                <div className="flex flex-col gap-4 p-4 md:hidden">
                  <div className="flex justify-between text-sm font-medium text-foreground items-center pb-2 border-b border-panel-border">
                    <span>Results</span>
                    <span className="text-muted-foreground">
                      {`${(currentPage - 1) * pageSize + 1} - ${Math.min(
                        currentPage * pageSize,
                        total,
                      )} of ${total}`}
                    </span>
                  </div>
                  {geoLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-card rounded-lg border border-panel-border p-4 hover:shadow-sm transition-all"
                    >
                      <DataCard
                        data={log}
                        columns={columns}
                        isLastRowCentered={true}
                        isFirstRowNormal={true}
                      />
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-auto">
                  <DataTable
                    data={geoLogs}
                    columns={columns}
                    sortable={false}
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                  />
                </div>

                {/* Pagination */}
                <div className="border-t border-panel-border p-4">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={getTotalPages(total, pageSize)}
                    pageSize={pageSize}
                    totalRecords={total}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    className="shadow-none border-none p-0"
                  />
                </div>
              </div>
            )}

            {geoLogs.length === 0 &&
              (appliedFilters.length > 0 || searchQuery !== "") && (
                <div className="bg-card rounded-xl border border-panel-border shadow-sm p-12">
                  <EmptyResult
                    title="No Matched Geo Audit Logs Found"
                    description="No records match your current search. Try adjusting your search."
                    icon={
                      <ICONS.FileText
                        className="mx-auto text-muted-foreground mb-4"
                        size={48}
                      />
                    }
                  />
                </div>
              )}
          </>
        ) : (
          <div className="bg-card rounded-xl border border-panel-border shadow-sm p-12">
            <EmptyResult
              title="No Audit Logs Found"
              description="There are no geolocation audit logs to display"
              icon={
                <ICONS.FileText
                  className="mx-auto text-muted-foreground mb-4"
                  size={48}
                />
              }
            />
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {isLogPopupOpen && selectedLog && (
        <GeoAuditLogPopupModal
          isOpen={isLogPopupOpen}
          onClose={() => setIsLogPopupOpen(false)}
          selectedLog={selectedLog}
        />
      )}
      <GeoAuditExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        exporting={exporting}
      />
      {showFilterModal && (
        <GeoAuditLogFilterModal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onApplyFilters={handleApplyFilters}
          currentFilters={appliedFilters}
        />
      )}
    </>
  );
};

export default GeolocationAuditLogsPage;
