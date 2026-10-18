"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { ICONS } from "@/constants/constants";
import SummaryCard from "@/components/layout/SummaryCard";
import {
  Case,
  CasesOverview,
  CaseFilters,
  CaseStatus,
  CaseCategory,
  CasePriority,
} from "@/types/cases.types";
import { CaseStatusPanel, CaseRiskPanel, CaseHeatmap } from "@/components/case";
import { CaseControls } from "@/components/case/CaseControls";
import { CaseListWrapper } from "@/components/case/CaseListWrapper";
import { NewCaseWrapper } from "@/components/case/NewCaseWrapper";
import PaginationControls from "@/components/ui/PaginationControls";
import { getCases } from "@/actions/cases.actions";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { usePermissions } from "@/hooks/usepermissions";
import { useCasesList, useCasesOverview } from "@/hooks/useCases";
import { Button } from "@/components/ui/button";

interface CasePageClientProps {
  cases: Case[];
  overview: CasesOverview | null;
  totalPages: number;
  totalRecords: number;
  searchParams: {
    page?: string;
    pageSize?: string;
    search?: string;
    status?: string;
    category?: string;
    priority?: string;
    assigned_for?: string;
    risk_level?: string;
    fromDate?: string;
    toDate?: string;
    sort?: string;
    order_by?: string;
  };
}
type CaseAction = "create" | "escalate" | "export";

// TODO: Replace with actual user ID from auth context
const userId = "d9d1c108-f677-49b4-9ccd-ae97a6dd6a24";

export const CasePageClient = ({
  cases: initialCases,
  overview: initialOverview,
  totalPages: initialTotalPages,
  totalRecords: initialTotalRecords,
  searchParams,
}: CasePageClientProps) => {
  const router = useRouter();
  const params = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const permissions = usePermissions();
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const currentPage = Number(params.get("page")) || 1;
  const pageSize = Number(params.get("pageSize")) || 10;

  // Build filters from search params
  const filters = useMemo((): CaseFilters => {
    const f: CaseFilters = {};
    if (searchParams.search) f.search = searchParams.search;
    if (searchParams.status) f.status = [searchParams.status as CaseStatus];
    if (searchParams.category)
      f.category = [searchParams.category as CaseCategory];
    if (searchParams.priority)
      f.priority = [searchParams.priority as CasePriority];
    if (searchParams.assigned_for) f.assigned_for = [searchParams.assigned_for];
    if (searchParams.risk_level)
      f.risk_level = [
        searchParams.risk_level as "low" | "medium" | "high" | "critical",
      ];
    if (searchParams.fromDate) f.fromDate = searchParams.fromDate;
    if (searchParams.toDate) f.toDate = searchParams.toDate;
    if (searchParams.sort)
      f.sort = searchParams.sort as
        | "created_at"
        | "priority"
        | "status"
        | "category"
        | "risk_category";
    if (searchParams.order_by)
      f.order_by = searchParams.order_by as "ASC" | "DESC";
    return f;
  }, [searchParams]);

  // Use React Query for cases list with polling
  const {
    cases,
    totalPages,
    totalRecords,
    isRefetching: isCasesRefetching,
    dataUpdatedAt: casesUpdatedAt,
    refresh: refreshCases,
  } = useCasesList({
    filters,
    page: currentPage,
    pageSize,
    initialCases,
    initialTotalPages,
    initialTotalRecords,
    pollingInterval: 30000,
  });

  // Use React Query for overview with polling
  const {
    overview,
    isRefetching: isOverviewRefetching,
    dataUpdatedAt: overviewUpdatedAt,
    refresh: refreshOverview,
  } = useCasesOverview({
    initialData: initialOverview,
    pollingInterval: 30000,
  });

  const isRefetching = isCasesRefetching || isOverviewRefetching;
  const lastUpdated = Math.max(casesUpdatedAt, overviewUpdatedAt);

  const handleRefresh = () => {
    refreshCases();
    refreshOverview();
  };

  const hasActiveFilters =
    searchParams.search ||
    searchParams.status ||
    searchParams.category ||
    searchParams.priority ||
    searchParams.assigned_for ||
    searchParams.risk_level ||
    searchParams.fromDate ||
    searchParams.toDate;

  const updateURL = useCallback(
    (updates: Record<string, string>) => {
      const urlParams = new URLSearchParams(params.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          urlParams.set(key, value);
        } else {
          urlParams.delete(key);
        }
      });

      const newUrl = `/cases?${urlParams.toString()}`;
      router.push(newUrl);
      setTimeout(() => router.refresh(), 0);
    },
    [params, router],
  );

  const handleExport = async (format: "csv" | "json" | "pdf") => {
    setExporting(true);
    setShowExportModal(false);
    try {
      // Fetch all cases without pagination
      const response = await getCases(undefined, 1, 10000);
      const allCases = response.cases || [];

      if (allCases.length === 0) {
        console.warn("No cases to export");
        return;
      }

      // Prepare data for export
      const exportData = allCases.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        status: c.status,
        priority: c.priority,
        category: c.category,
        risk_score: c.risk_score,
        customer_name: c.customer?.full_name || "",
        customer_id: c.customer?.customer_id || "",
        assigned_to: c.assigned_user?.full_name || "",
        created_at: c.created_at,
        updated_at: c.updated_at,
        sla_ends: c.sla_ends,
        closed_at: c.closed_at || "",
        resolution_note: c.resolution_note || "",
      }));

      const filename = `cases-${new Date().toISOString().split("T")[0]}`;

      if (format === "csv") {
        // Convert to CSV
        const headers = Object.keys(exportData[0]);
        const csvRows = [
          headers.join(","),
          ...exportData.map((row) =>
            headers
              .map((header) => {
                const value = row[header as keyof typeof row];
                // Escape quotes and wrap in quotes if contains comma or newline
                const strValue = String(value ?? "");
                if (
                  strValue.includes(",") ||
                  strValue.includes("\n") ||
                  strValue.includes('"')
                ) {
                  return `"${strValue.replace(/"/g, '""')}"`;
                }
                return strValue;
              })
              .join(","),
          ),
        ];
        const blob = new Blob([csvRows.join("\n")], {
          type: "text/csv;charset=utf-8;",
        });
        const url = globalThis.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        globalThis.URL.revokeObjectURL(url);
      } else if (format === "json") {
        // JSON format
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
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
      } else if (format === "pdf") {
        // PDF format using jsPDF
        const doc = new jsPDF({ orientation: "landscape" });

        // Add title
        doc.setFontSize(18);
        doc.text("Cases Export", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        // Prepare table data
        const tableHeaders = [
          "Title",
          "Status",
          "Priority",
          "Category",
          "Risk",
          "Customer",
          "Assigned To",
          "Created",
        ];
        const tableData = exportData.map((row) => [
          row.title?.substring(0, 30) || "",
          row.status || "",
          row.priority || "",
          row.category || "",
          row.risk_score?.toString() || "",
          row.customer_name?.substring(0, 20) || "",
          row.assigned_to?.substring(0, 20) || "",
          row.created_at ? new Date(row.created_at).toLocaleDateString() : "",
        ]);

        autoTable(doc, {
          head: [tableHeaders],
          body: tableData,
          startY: 38,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [26, 82, 118] },
        });

        doc.save(`${filename}.pdf`);
      }
    } catch (error) {
      console.error("Error exporting cases:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="">
      {/* Header */}
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">
            Case Management
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-muted-foreground text-sm dark:text-gray-400">
              Real-time monitoring of flagged transactions and active compliance
              cases
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
          <Button
            onClick={handleRefresh}
            disabled={isRefetching}
            variant="ghost"
            size="icon"
            className="border border-panel-border bg-card hover:bg-card/70 text-muted-foreground"
            title="Refresh data"
          >
            <RefreshCw
              size={16}
              className={`${isRefetching ? "animate-spin" : ""}`}
            />
          </Button>
          {permissions.canExportCase && (
            <Button
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
            </Button>
          )}
          {permissions.canCreateCase && (
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors text-sm font-medium shadow-sm cursor-pointer"
            >
              <ICONS.Plus size={16} />
              <span>New Case</span>
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-4">
        <SummaryCard
          title="Active Cases"
          value={overview?.active_cases?.toString() || "0"}
          mainColor="blue"
          icon={ICONS.Briefcase}
          bottomLabel="Currently under review"
        />
        <SummaryCard
          title="Critical Cases"
          value={overview?.critical_cases?.toString() || "0"}
          mainColor="red"
          icon={ICONS.AlertTriangle}
          bottomLabel="Requires immediate action"
        />
        {/* <SummaryCard
          title="SARs Filed"
          value={overview?.sar_filed?.toString() || '0'}
          mainColor="green"
          icon={ICONS.FileText}
          bottomLabel="Reports submitted to regulator"
        /> */}
        <SummaryCard
          title="Resolution Rate"
          value={
            overview?.resolution_rate ? `${overview.resolution_rate}%` : "0%"
          }
          mainColor="orange"
          icon={ICONS.CheckCircle}
          bottomLabel="Past 30 days"
        />
      </div>

      {/* Status and Risk Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <CaseStatusPanel overview={overview} />
        <CaseRiskPanel overview={overview} />
      </div>

      {/* Geographic Risk Heatmap */}
      <CaseHeatmap className="mb-4" />

      {/* Search and Filters */}
      <CaseControls cases={cases} />

      {/* Layout */}
      {cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 bg-card rounded-xl border border-panel-border">
          <ICONS.Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No Cases Found
          </h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            {hasActiveFilters
              ? "No cases match your current filters or search query. Try adjusting your filters or search terms."
              : "There are no cases in the system yet. Create your first case to get started."}
          </p>
          {!hasActiveFilters && permissions.canCreateCase && (
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors text-sm font-medium"
            >
              <ICONS.Plus size={16} />
              <span>Create First Case</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <CaseListWrapper
            cases={cases}
            canEscalateCase={permissions.canEscalateCase}
          />
          {/* Pagination */}
          {cases.length > 0 && (
            <div className="mt-4">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalRecords={totalRecords}
                onPageChange={(page) => updateURL({ page: page.toString() })}
                onPageSizeChange={(size) =>
                  updateURL({ pageSize: size.toString(), page: "1" })
                }
              />
            </div>
          )}
        </div>
      )}

      {/* New Case Modal */}
      {permissions.canCreateCase && (
        <NewCaseWrapper
          userId={userId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* Export Modal */}
      {permissions.canExportCase && showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-panel-border shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Export Cases
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ICONS.X size={20} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Select the format to export all cases:
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
