"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";
import ComplianceMetricsPanel from "@/components/dashboard/ComplianceMetricsPanel";
// import HighRiskCustomersPanel from "@/components/dashboard/CustomerRisk/HighRiskCustomersPanel";
import WatchlistMatchesPanel from "@/components/dashboard/CustomerRisk/WatchlistMatchesPanel";
import SummaryCard from "@/components/layout/SummaryCard";
import QuickMetricsBar from "@/components/dashboard/QuickMetricsBar";
import QuickStatsPanel from "@/components/dashboard/QuickStatsPanel";
import SystemConfigSummary from "@/components/dashboard/SystemConfigSummary";
import { ICONS, TIME_RANGES } from "@/constants/constants";
import {
  ComplianceRiskDashboard,
  HighRiskCustomerSummary,
  TIME_RANGE_MAP,
} from "@/types/dashboard.types";
import {
  exportDashboard,
  exportAlerts,
  exportHighRiskCustomers,
} from "@/actions/dashboard.actions";
import LoadingOverlay from "@/components/layout/LoadingOverlay";
import { useDashboard } from "@/hooks/useDashboard";
import { useTenant } from "@/components/providers/tenant.provider";
import { usePermissions } from "@/hooks/usepermissions";
interface DashboardPageClientProps {
  initialData: ComplianceRiskDashboard | null;
}

// Helper to format hours to days
const formatResolutionTime = (hours: number): string => {
  if (hours < 24) {
    return `${Math.round(hours)} hours`;
  }
  const days = Math.round(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""}`;
};

// Helper to format trend percentage
const formatTrend = (percentage: number, direction: string): string => {
  const sign =
    direction === "upward" ? "+" : direction === "downward" ? "-" : "";
  return `${sign}${Math.abs(percentage).toFixed(1)}%`;
};

// Map API high risk customers to component format
const mapHighRiskCustomers = (customers: HighRiskCustomerSummary[]) => {
  return customers.map((c) => ({
    name: c.customer_name,
    id: c.customer_id,
    peerGroup: "N/A",
    riskLevel: c.risk_status === "critical" ? "Critical" : "High",
    score: c.risk_score,
    alerts: c.alert_count,
    lastActivity: new Date(c.last_updated_at).toLocaleDateString(),
  }));
};

export const DashboardPageClient = ({
  initialData,
}: DashboardPageClientProps) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expandedMetrics, setExpandedMetrics] = useState(false);
  const [exportType, setExportType] = useState<
    "dashboard" | "alerts" | "high-risk-customers"
  >("dashboard");

  // Use React Query with polling for real-time updates
  const {
    data: dashboardData,
    isFetching,
    isRefetching,
    dataUpdatedAt,
    refresh,
  } = useDashboard({
    timeRange: selectedTimeRange,
    initialData,
    pollingInterval: 30000, // 30 seconds
  });
  const { isSwitchingTenant } = useTenant();

  // Track if this is the initial mount to avoid unnecessary refresh
  const isInitialMount = useRef(true);

  // Refresh data when time range changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimeRange]);

  const isPending = isFetching && !dashboardData;

  // Handle time range change
  const handleTimeRangeChange = useCallback((newTimeRange: string) => {
    setSelectedTimeRange(newTimeRange);
  }, []);
  const permissions = usePermissions();

  // Handle export
  const handleExport = async (format: "pdf" | "csv" | "json") => {
    setExporting(true);
    setShowExportModal(false);

    try {
      const timeRange = TIME_RANGE_MAP[selectedTimeRange] || "last_24_hours";
      const dateStr = new Date().toISOString().split("T")[0];

      let response;
      let filename: string;

      // Call appropriate export function based on export type
      switch (exportType) {
        case "alerts":
          response = await exportAlerts(format);
          filename = `analytics_alerts_${dateStr}`;
          break;
        case "high-risk-customers":
          response = await exportHighRiskCustomers(format);
          filename = `high_risk_customers_${dateStr}`;
          break;
        case "dashboard":
        default:
          response = await exportDashboard({
            time_range: timeRange,
            format,
          });
          filename = `compliance_risk_dashboard_${dateStr}`;
          break;
      }

      if (response.success && response.data) {
        if (format === "json") {
          // For JSON, create a downloadable file from the response data
          const blob = new Blob([JSON.stringify(response.data, null, 2)], {
            type: "application/json",
          });
          const url = globalThis.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${filename}.json`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          globalThis.URL.revokeObjectURL(url);
        } else {
          // For PDF/CSV, decode base64 and download
          const { base64, mimeType } = response.data as {
            base64: string;
            mimeType: string;
          };
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          const url = globalThis.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${filename}.${format}`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          globalThis.URL.revokeObjectURL(url);
        }
      } else {
        console.error("Export failed:", response.message);
      }
    } catch (error) {
      console.error("Error exporting:", error);
    } finally {
      setExporting(false);
    }
  };

  // Prepare data for components
  const riskOverview = dashboardData?.risk_overview;
  const alertsBreakdown = dashboardData?.alerts_breakdown;
  const casesMetrics = dashboardData?.cases_metrics;
  const complianceMetrics = dashboardData?.compliance_metrics;
  const kpiMetrics = dashboardData?.kpi_metrics;
  const highRiskCustomers = dashboardData?.high_risk_customers || [];
  const watchlistMatches = dashboardData?.watchlist_matches;
  const quickStats = dashboardData?.quick_stats;
  const systemStatus = dashboardData?.system_status;
  const caseTrends = dashboardData?.case_trends;

  // Map data for existing components
  const fraudData = {
    riskScore: riskOverview?.overall_risk_score || 0,
    riskLevel: riskOverview?.risk_level
      ? riskOverview.risk_level.charAt(0).toUpperCase() +
        riskOverview.risk_level.slice(1)
      : "Low",
    riskTrend: riskOverview
      ? formatTrend(riskOverview.trend_percentage, riskOverview.trend_direction)
      : "0.0%",
    pendingAlerts: alertsBreakdown?.total_pending || 0,
    activeCases: casesMetrics?.total_active || 0,
    escalatedCases: casesMetrics?.escalated_cases || 0,
    complianceScore: complianceMetrics?.overall_score || 0,
    sarFiledCount: casesMetrics?.sar_filed_count || 0,
    sarFiledSubmissions: casesMetrics?.sar_filed_submissions || 0,
    avgResolutionTime: kpiMetrics
      ? formatResolutionTime(kpiMetrics.average_resolution_time_hours)
      : "0 days",
    falsePositiveRate: kpiMetrics
      ? `${kpiMetrics.false_positive_rate.toFixed(1)}%`
      : "0.0%",
    resolvedCases: kpiMetrics?.total_resolved_cases || 0,
    highRiskCustomers: quickStats?.high_risk_customer_count || 0,
    totalCustomers: quickStats?.total_customers || 0,
    watchlistMatches: quickStats?.watchlist_matches || 0,
    kycUpdatesRequired: quickStats?.kyc_updates_due || 0,
    peerGroupAnalyses: quickStats?.peer_analyses || 0,
  };

  const aiMetrics = {
    accuracy: 0,
  };

  const mappedHighRiskCustomers = mapHighRiskCustomers(highRiskCustomers);

  const mappedWatchlistMatches = watchlistMatches
    ? [
        { type: "OFAC Sanctions", count: watchlistMatches.ofac_sanctions },
        { type: "EU Sanctions", count: watchlistMatches.eu_sanctions },
        { type: "UN Sanctions", count: watchlistMatches.un_sanctions },
        { type: "FATF Sanctions", count: watchlistMatches.fatf_sanctions },
        { type: "PEP Database", count: watchlistMatches.pep_database },
        {
          type: "Terrorist Financing",
          count: watchlistMatches.terrorist_financing,
        },
        { type: "Adverse Media", count: watchlistMatches.adverse_media },
        {
          type: "Internal Watchlist",
          count: watchlistMatches.internal_watchlist,
        },
      ]
    : [];

  const complianceMetricsData = {
    customerScreeningRate: 0,
    auditScore: 0,
  };

  const geoRiskData: any[] = [];
  const transactionTypes: any[] = [];

  return (
    <div className="">
      {/* Header */}
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">
            Compliance & Risk Dashboard
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-muted-foreground text-sm dark:text-gray-400">
              Real-time compliance monitoring and risk assessment
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
        <div className="flex items-center space-x-2">
          {/* Manual refresh button */}
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
          <div className="relative inline-block">
            <select
              value={selectedTimeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              disabled={isPending}
              className="appearance-none px-4 py-2 pr-10 border border-panel-border rounded-lg focus:outline-none focus:ring-2 focus:ring-white bg-card-second text-foreground text-sm font-medium shadow-sm cursor-pointer disabled:opacity-50"
            >
              {TIME_RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
          {permissions.canExportDasboard && (
            <button
              onClick={() => setShowExportModal(true)}
              disabled={exporting}
              className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Loading overlay - don't show during tenant switch as global overlay handles it */}
      {isPending && !isSwitchingTenant && (
        <LoadingOverlay
          className="fixed z-50"
          loadingText="Updating dashboard..."
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 items-start">
        <SummaryCard
          title="Overall Risk Score"
          value={`${Number.parseFloat(fraudData.riskScore.toFixed(2))}%`}
          mainColor="orange"
          icon={ICONS.AlertTriangle}
          trend={fraudData.riskTrend}
          trendColor={
            riskOverview?.trend_direction === "upward"
              ? "red"
              : riskOverview?.trend_direction === "downward"
                ? "green"
                : "gray"
          }
          bottomLabel={`${fraudData.riskLevel} Risk`}
          expandedContent={
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Risk Assessment</span>
                <span
                  className={`font-medium px-2 py-0.5 rounded ${
                    fraudData.riskLevel === "Critical"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : fraudData.riskLevel === "High"
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}
                >
                  {fraudData.riskLevel}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(fraudData.riskScore, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Score indicates overall portfolio risk exposure
              </p>
            </div>
          }
        />

        <SummaryCard
          title="Pending Alerts"
          value={fraudData.pendingAlerts}
          mainColor="red"
          icon={ICONS.Bell}
          trend={null}
          trendColor="red"
          bottomLabel="Require attention"
          expandedContent={
            <div className="space-y-2">
              {[
                {
                  label: "Elevated",
                  count: alertsBreakdown?.elevated_count || 0,
                  color: "bg-red-500",
                },
                {
                  label: "High",
                  count: alertsBreakdown?.high_risk_count || 0,
                  color: "bg-orange-500",
                },
                {
                  label: "Medium",
                  count: alertsBreakdown?.medium_count || 0,
                  color: "bg-yellow-500",
                },
                {
                  label: "Low",
                  count: alertsBreakdown?.low_risk_count || 0,
                  color: "bg-blue-500",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-sm text-muted-foreground flex-1">
                    {item.label}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {item.count}
                  </span>
                  <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{
                        width: `${fraudData.pendingAlerts > 0 ? (item.count / fraudData.pendingAlerts) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          }
        />

        <SummaryCard
          title="Active Cases"
          value={fraudData.activeCases}
          mainColor="blue"
          icon={ICONS.Briefcase}
          trend={null}
          trendColor="blue"
          bottomLabel="Under investigation"
          expandedContent={
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {fraudData.activeCases}
                  </p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {fraudData.escalatedCases}
                  </p>
                  <p className="text-xs text-muted-foreground">Escalated</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Resolution Time</span>
                <span className="font-medium text-foreground">
                  {fraudData.avgResolutionTime}
                </span>
              </div>
            </div>
          }
        />

        <SummaryCard
          title="Compliance Score"
          value={`${Number.parseFloat(fraudData.complianceScore.toFixed(2))}%`}
          mainColor="green"
          icon={ICONS.CheckCircle}
          trend={
            complianceMetrics
              ? formatTrend(
                  complianceMetrics.score_trend_percentage,
                  complianceMetrics.score_trend_direction,
                )
              : "0.0%"
          }
          trendColor={
            complianceMetrics?.score_trend_direction === "upward"
              ? "green"
              : complianceMetrics?.score_trend_direction === "downward"
                ? "red"
                : "gray"
          }
          bottomLabel={`SAR Filed: ${fraudData.sarFiledCount}`}
          expandedContent={
            <div className="space-y-3">
              <div className="relative pt-1">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Overall Score</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {fraudData.complianceScore.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(fraudData.complianceScore, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">SAR Submissions</span>
                <span className="font-medium text-foreground">
                  {fraudData.sarFiledSubmissions}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {fraudData.complianceScore >= 90
                  ? "Excellent compliance posture"
                  : fraudData.complianceScore >= 70
                    ? "Good standing, minor improvements needed"
                    : "Action required to improve compliance"}
              </p>
            </div>
          }
        />
      </div>

      {/* Quick Metrics Bar */}
      <div className="mb-4">
        <QuickMetricsBar
          fraudData={fraudData}
          aiMetrics={aiMetrics}
          // systemStatus={systemStatus?.status || 'online'}
        />
      </div>

      {/* High Risk Customers Panel */}
      {/* <div className="mb-4">
        <HighRiskCustomersPanel
          highRiskCustomers={mappedHighRiskCustomers}
          totalHighRisk={fraudData.highRiskCustomers}
        />
      </div> */}

      {/* Quick Stats and Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <QuickStatsPanel fraudData={fraudData} />
        <WatchlistMatchesPanel
          watchlistMatches={mappedWatchlistMatches}
          watchlistData={watchlistMatches}
        />
      </div>

      {/* Compliance Metrics Panel */}
      <div className="mb-4">
        <ComplianceMetricsPanel
          complianceMetrics={complianceMetricsData}
          geoRiskData={geoRiskData}
          transactionTypes={transactionTypes}
          fraudData={fraudData}
          expandedMetrics={expandedMetrics}
          setExpandedMetrics={setExpandedMetrics}
          caseTrends={caseTrends}
          complianceRate={complianceMetrics?.compliance_rate}
          rateChangeVsLastMonth={complianceMetrics?.rate_change_vs_last_month}
          alertsBreakdown={alertsBreakdown}
          casesMetrics={casesMetrics}
        />
      </div>

      {/* System Config Summary */}
      <div>
        <SystemConfigSummary />
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-panel-border shadow-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Export Data
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ICONS.X size={20} />
              </button>
            </div>

            {/* Export Type Selection */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Select what to export:
              </p>
              <div className="flex gap-2 flex-wrap">
                {[
                  {
                    type: "dashboard" as const,
                    label: "Dashboard",
                    icon: ICONS.BarChart,
                  },
                  {
                    type: "alerts" as const,
                    label: "Alerts",
                    icon: ICONS.Bell,
                  },
                  {
                    type: "high-risk-customers" as const,
                    label: "High Risk Customers",
                    icon: ICONS.Users,
                  },
                ].map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => setExportType(type)}
                    className={`flex items-center cursor-pointer gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium ${
                      exportType === type
                        ? "bg-[#1A5276] dark:bg-blue-600 text-white border-transparent"
                        : "bg-card border-panel-border text-foreground hover:bg-card/70"
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <p className="text-sm text-muted-foreground mb-2">
              Select export format:
            </p>
            <div className="space-y-2">
              {[
                {
                  format: "csv" as const,
                  label: "CSV",
                  description: "Spreadsheet compatible format",
                },
                {
                  format: "json" as const,
                  label: "JSON",
                  description: "Machine-readable format",
                },
                {
                  format: "pdf" as const,
                  label: "PDF",
                  description: "Printable report format",
                },
              ].map(({ format, label, description }) => (
                <button
                  key={format}
                  onClick={async () => {
                    await handleExport(format);
                  }}
                  disabled={exporting}
                  className="w-full px-4 py-3 cursor-pointer bg-card border border-panel-border rounded-lg hover:bg-card/70 transition-all text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <ICONS.FileText
                      size={20}
                      className="text-muted-foreground"
                    />
                    <div>
                      <span className="text-foreground font-medium block">
                        Export as {label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {description}
                      </span>
                    </div>
                  </div>
                  <ICONS.Download size={16} className="text-muted-foreground" />
                </button>
              ))}
            </div>
            {exporting && (
              <div className="mt-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Exporting...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPageClient;
