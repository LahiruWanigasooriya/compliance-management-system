"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Customer } from "@/types/customer-risk.types";
import { CustomerRiskControls } from "./CustomerRiskControls";
import CustomerRiskList from "./CustomerRiskList";
import RiskSummaryCards from "./RiskSummaryCards";
import RiskDistribution from "./RiskDistribution";
import { ICONS } from "@/constants/constants";
import {
  RiskDashboardProfile,
  RiskDashboardFilters,
} from "@/actions/cases.actions";
import {
  exportRiskProfiles,
  ExportProfilesFilters,
} from "@/actions/customer-risk.actions";
import {
  calculateAccountAge,
  formatCurrency,
  capitalizeRiskLevel,
  formatKYCStatus,
  formatLastActivity,
  formatCustomerStatus,
  formatCreatedDate,
} from "./utils";
import PaginationControls from "@/components/ui/PaginationControls";
import { useTenant } from "@/components/providers/tenant.provider";
import {
  useCustomerRiskMetrics,
  useCustomerRiskProfiles,
} from "@/hooks/useCustomerRisk";
import { usePermissions } from "@/hooks/usepermissions";
import { Button } from "@/components/ui/button";

interface CustomerRiskPageClientProps {} // eslint-disable-line @typescript-eslint/no-empty-object-type

export const CustomerRiskPageClient = ({}: CustomerRiskPageClientProps) => {
  const router = useRouter();
  const { selectedTenantId } = useTenant();
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [filters, setFilters] = useState<RiskDashboardFilters>({
    limit: 10,
    page: 1,
  });

  // Use React Query for metrics with polling
  const {
    metrics,
    isRefetching: isMetricsRefetching,
    dataUpdatedAt: metricsUpdatedAt,
    refresh: refreshMetrics,
  } = useCustomerRiskMetrics({
    pollingInterval: 30000,
  });
  const permissions = usePermissions();

  // Use React Query for profiles with polling
  const {
    profiles,
    pagination,
    isFetching: isProfilesFetching,
    isRefetching: isProfilesRefetching,
    dataUpdatedAt: profilesUpdatedAt,
    refresh: refreshProfiles,
  } = useCustomerRiskProfiles({
    filters,
    pollingInterval: 30000,
  });

  const loading = isProfilesFetching && profiles.length === 0;
  const isRefetching = isMetricsRefetching || isProfilesRefetching;
  const lastUpdated = Math.max(metricsUpdatedAt, profilesUpdatedAt);

  // Reset filters when tenant changes
  useEffect(() => {
    setFilters({ limit: 10, page: 1 });
  }, [selectedTenantId]);

  const mapProfileToCustomer = (profile: RiskDashboardProfile): Customer => ({
    id: profile.id || "N/A",
    customer_id: profile.customer_id || "N/A",
    customerName: profile.full_name || "Unknown",
    accountNumber: profile.account_number || "N/A",
    riskScore: profile.risk_score || 0,
    riskLevel: capitalizeRiskLevel(profile.risk_category || "low"),
    customerType:
      profile.entity_type === "individual" ? "Individual" : "Corporate",
    customerStatus: formatCustomerStatus(profile.customer_status || "active"),
    jurisdiction: profile.country_of_residence || "Unknown",
    accountAge: calculateAccountAge(profile.created_at),
    createdAt: formatCreatedDate(profile.created_at),
    transactionCount: profile.total_transactions || 0,
    transactionVolume: formatCurrency(profile.total_volume || 0),
    flaggedTransactions: profile.flagged_transactions || 0,
    kycStatus: formatKYCStatus(profile.kyc_status || ""),
    lastActivity: formatLastActivity(profile.updated_at),
    pep: profile.is_pep || false,
    sanctioned: profile.has_sanctions || false,
    adverseMedia: profile.has_adverse_media || false,
    watchlistMatches: Array.isArray(profile.watchlist_matches)
      ? profile.watchlist_matches.length
      : typeof profile.watchlist_matches === "number"
        ? profile.watchlist_matches
        : 0,
    isSynthetic: profile.is_synthetic || false,
    syntheticScore: profile.synthetic_score || 0,
  });

  const customers = profiles.map(mapProfileToCustomer);

  const handleRefresh = () => {
    refreshMetrics();
    refreshProfiles();
  };

  const handleFilterChange = useCallback(
    (newFilters: RiskDashboardFilters) => {
      setFilters({ ...newFilters, page: 1, limit: filters.limit || 10 });
    },
    [filters.limit],
  );

  const handlePageChange = useCallback((newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setFilters((prev) => ({ ...prev, page: 1, limit: newPageSize }));
  }, []);

  const handleExport = async (format: "csv" | "json" | "pdf") => {
    setExporting(true);
    setShowExportModal(false);
    try {
      const exportFilters: ExportProfilesFilters = {
        format,
        risk_category: filters.risk_category,
        entity_type: filters.entity_type,
        status: filters.status,
        date_preset: filters.date_preset,
      };

      const response = await exportRiskProfiles(exportFilters);

      if (response.success && response.data) {
        // Convert base64 to Blob on client side
        const byteCharacters = atob(response.data.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: response.data.mimeType });

        // Create download link
        const url = globalThis.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `risk-profiles-${new Date().toISOString().split("T")[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        globalThis.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting profiles:", error);
    } finally {
      setExporting(false);
    }
  };

  const handleViewProfile = (customerId: string) => {
    router.push(`/customer-risk/${customerId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">
            Customer Risk Profiles
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-muted-foreground text-sm dark:text-gray-400">
              Real-time monitoring of customer risk profiles
            </p>
            {lastUpdated > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {isRefetching && (
                  <RefreshCw size={10} className="animate-spin" />
                )}
                <span className="hidden sm:inline">
                  Updated {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Manual refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isRefetching}
            className="p-2 rounded-lg border border-panel-border bg-card hover:bg-card/70 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw
              size={16}
              className={`text-muted-foreground ${isRefetching ? "animate-spin" : ""}`}
            />
          </button>
          {permissions.canExportCRPC && (
            <button
              onClick={() => setShowExportModal(true)}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors text-sm font-medium shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
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

      {/* Summary Cards */}
      {metrics ? (
        <div className="space-y-4">
          <RiskSummaryCards
            metrics={metrics}
            totalCustomers={
              metrics.totalCriticalProfiles +
              metrics.totalHighProfiles +
              metrics.totalMediumProfiles +
              metrics.totalLowProfiles
            }
          />

          {/* Risk Distribution Overview */}
          <RiskDistribution metrics={metrics} />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-panel-border shadow-sm p-8">
          <p className="text-center text-muted-foreground">
            Unable to load risk metrics. Please try again later.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Controls (Search, Filters) */}
        <CustomerRiskControls
          onFilterChange={handleFilterChange}
          loading={loading}
        />

        {/* Customer List */}
        <CustomerRiskList
          customers={customers}
          onViewProfile={handleViewProfile}
          loading={loading}
        />

        {/* Pagination Controls */}
        {customers.length > 0 && pagination && (
          <PaginationControls
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalRecords={pagination.total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>

      {/* Export Modal */}
      {permissions.canExportCRPC && showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-panel-border shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Export Profiles
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ICONS.X size={20} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Select the format to export customer risk profiles:
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
                <Button
                  key={format}
                  onClick={async () => {
                    await handleExport(format);
                  }}
                  disabled={exporting}
                  variant="ghost"
                  className="w-full justify-start border border-panel-border bg-card text-foreground px-4 py-3 hover:bg-card/70 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon size={20} className="text-muted-foreground" />
                  <span className="text-foreground font-medium">
                    Export as {label}
                  </span>
                </Button>
              ))}
            </div>
            {exporting && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Exporting...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
