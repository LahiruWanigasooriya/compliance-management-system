"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  Filter,
  FileText,
  Calendar,
  User,
  Activity,
  Zap,
  Database,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Tooltip } from "@/components/common/Tooltip";
import { getAuditLogs, getAuditLogById } from "../../../actions/audit.actions";
import type { AuditLogRecord } from "../../../types/audit/audit.types";
import { ExportFormat } from "../../../types/sysconfig.types";
import { formatText } from "@/utils/convertObjectKeysToCamelCase";
import { AuditLogViewModal } from "./AuditLogViewModal";
import Loader from "@/components/ui/loader/Loader";
import { ICONS } from "@/constants/constants";
import PaginationControls from "@/components/ui/PaginationControls";

const truncateText = (text: string, maxLength: number = 30): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

export const AuditLogManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [10, 20, 50, 100];

  useEffect(() => {
    fetchAuditLogs();
  }, [offset, pageSize]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAuditLogs({ limit: pageSize, offset });
      if (response.success) {
        setAuditLogs(response.data.logs);
        setTotal(response.data.pagination.total);
      } else {
        setError(response.message || "Failed to fetch audit logs");
        setAuditLogs([]);
      }
    } catch (err) {
      setError("Failed to fetch audit logs");
      setAuditLogs([]);
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLog = async (logId: string) => {
    setModalLoading(true);
    setModalOpen(true);
    try {
      const response = await getAuditLogById(logId);
      if (response.success) {
        setSelectedLog(response.data);
      } else {
        console.error("Failed to fetch log details:", response.message);
        setSelectedLog(null);
      }
    } catch (err) {
      console.error("Error fetching audit log:", err);
      setSelectedLog(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedLog(null);
  };

  // Filter Logic
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.eventType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "success" &&
        log.statusCode >= 200 &&
        log.statusCode < 300) ||
      (statusFilter === "failure" && log.statusCode >= 400);

    return matchesSearch && matchesStatus;
  });

  // Mock Export Handler
  const handleExport = (format: ExportFormat) => {
    alert(`Exporting ${filteredLogs.length} logs as ${format}...`);
    // Actual implementation would trigger file generation here
  };

  const handlePrevious = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - pageSize));
    }
  };

  const handleNext = () => {
    if (offset + pageSize < total) {
      setOffset(offset + pageSize);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setOffset(0); // Reset to first page when changing page size
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "error":
        return "bg-orange-100 text-orange-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "info":
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return "bg-green-100 text-green-800";
    } else if (statusCode >= 400) {
      return "bg-red-100 text-red-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  if (error && !loading && auditLogs.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-3 text-red-500" size={40} />
          <h3 className="font-semibold text-red-600 mb-1">
            Error Loading Logs
          </h3>
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={() => {
              setOffset(0);
              fetchAuditLogs();
            }}
            className="mt-4 px-4 py-2 bg-[#164e87] text-primary-foreground rounded-lg hover:bg-[#133f6d] transition-colors text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 mb-4 dark:border-[#373c4a] dark:bg-[#011613]">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <ICONS.Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by user, action, event type or resource..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1A5276] focus:border-transparent dark:border-[#373c4a] dark:bg-[#011613] dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-[#4b7f84]"
            />
          </div>
          <div className="relative">
            <select
              className="appearance-none pl-9 pr-8 py-3 text-sm border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer disabled:opacity-50"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              disabled={loading}
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              size={16}
            />
          </div>
          <div className="group relative">
            <button
              className={`flex items-center space-x-1.5 px-4 py-3 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-colors text-sm font-medium ${filteredLogs.length === 0 ? "opacity-50 cursor-not-allowed" : " cursor-not-allowed"}`}
              disabled={loading || filteredLogs.length === 0}
            >
              <Download size={16} /> Export
            </button>
            {/* Dropdown for Export */}
            <div className="absolute right-0 mt-2 w-32 bg-card rounded-lg shadow-xl border border-border hidden  z-10">
              <button
                onClick={() => handleExport("PDF")}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-card/80 text-foreground border-b border-border last:border-b-0"
              >
                PDF
              </button>
              <button
                onClick={() => handleExport("CSV")}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-card/80 text-foreground border-b border-border last:border-b-0"
              >
                CSV
              </button>
              <button
                onClick={() => handleExport("JSON")}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-card/80 text-foreground"
              >
                JSON
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          {/* Desktop Table */}
          <table className="w-full text-left text-sm hidden md:table">
            <thead className="text-muted-foreground border-b border-border sticky top-0 bg-secondary dark:bg-secondary whitespace-nowrap font-semibold text-white">
              <tr>
                <th className="px-3 py-3 font-medium ">
                  <div className="flex items-center gap-2">
                    <User size={14} /> UserID
                  </div>
                </th>
                <th className="px-3 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <Activity size={14} /> Event Type
                  </div>
                </th>
                <th className="px-3 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <Zap size={14} /> Action
                  </div>
                </th>
                <th className="px-3 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <Database size={14} /> Resource
                  </div>
                </th>
                <th className="px-3 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} /> Status
                  </div>
                </th>
                <th className="px-3 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} /> Severity
                  </div>
                </th>
                <th className="px-3 py-3 font-medium">
                  <div className="flex items-center gap-2 justify-end">
                    <Calendar size={14} /> Timestamp
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader size="28" stroke="4" speed="3.5" />
                      <span>Loading audit logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-card/80 transition-colors group cursor-pointer"
                    onClick={() => handleViewLog(log.id)}
                  >
                    <td className="px-3 py-2.5 text-foreground ">
                      <Tooltip
                        text={log.userId || "N/A"}
                        position="top"
                        maxLength={25}
                      >
                        <span className="inline-block max-w-xs truncate">
                          {truncateText(log.userId || "N/A", 25)}
                        </span>
                      </Tooltip>
                    </td>
                    <td className="px-3 py-2.5 text-foreground">
                      <span className=" items-center p-2 text-nowrap rounded-full text-xs font-medium bg-purple-100 text-purple-800 ">
                        {formatText(log.eventType) || "N/A"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-foreground">
                      <Tooltip
                        text={formatText(log.action) || "N/A"}
                        position="top"
                        maxLength={20}
                      >
                        <span className="flex items-center gap-2">
                          <span className="inline-block max-w-xs truncate">
                            {truncateText(formatText(log.action), 20) || "N/A"}
                          </span>
                        </span>
                      </Tooltip>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {formatText(log.resource) || "N/A"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getStatusColor(
                          log.statusCode,
                        )}`}
                      >
                        {log.statusCode || "N/A"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getSeverityColor(
                          log.severity,
                        )}`}
                      >
                        {formatText(log.severity) || "N/A"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs whitespace-nowrap flex justify-end">
                      {new Date(log.createdAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    <FileText
                      size={40}
                      className="mx-auto mb-3 text-muted-foreground"
                    />
                    <p className="font-medium">No logs found</p>
                    <p className="text-sm mt-1">
                      {searchTerm || statusFilter !== "all"
                        ? "Try adjusting your filters"
                        : "No audit logs available"}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 px-4">
            {loading ? (
              <div className="py-12 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader size="28" stroke="4" speed="3.5" />
                  <span>Loading audit logs...</span>
                </div>
              </div>
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className=""
                  onClick={() => handleViewLog(log.id)}
                >
                  {/* Username */}
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                      <User size={12} className="inline mr-1" /> Username
                    </p>
                    <Tooltip
                      text={log.username || "N/A"}
                      position="top"
                      maxLength={25}
                    >
                      <p className="text-sm font-medium text-foreground truncate">
                        {truncateText(log.username || "N/A", 25)}
                      </p>
                    </Tooltip>
                  </div>
                  {/* Event Type & Action */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                        <Activity size={12} className="inline mr-1" /> Event
                        Type
                      </p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {formatText(log.eventType) || "N/A"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                        <Zap size={12} className="inline mr-1" /> Action
                      </p>
                      <Tooltip
                        text={formatText(log.action) || "N/A"}
                        position="top"
                        maxLength={20}
                      >
                        <p className="text-sm text-foreground truncate">
                          {truncateText(formatText(log.action), 20) || "N/A"}
                        </p>
                      </Tooltip>
                    </div>
                  </div>
                  {/* Resource & Status Code */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                        <Database size={12} className="inline mr-1" /> Resource
                      </p>
                      <p className="text-sm text-foreground">
                        {formatText(log.resource) || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                        <CheckCircle size={12} className="inline mr-1" /> Status
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          log.statusCode,
                        )}`}
                      >
                        {log.statusCode || "N/A"}
                      </span>
                    </div>
                  </div>
                  {/* Severity & Timestamp */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                        <AlertTriangle size={12} className="inline mr-1" />{" "}
                        Severity
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
                          log.severity,
                        )}`}
                      >
                        {formatText(log.severity) || "N/A"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                        <Calendar size={12} className="inline mr-1" /> Time
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {new Date(log.createdAt || "N/A").toLocaleString(
                          "en-US",
                          {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <FileText
                  size={40}
                  className="mx-auto mb-3 text-muted-foreground"
                />
                <p className="font-medium">No logs found</p>
                <p className="text-sm mt-1">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "No audit logs available"}
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Footer / Pagination */}

        {/* Audit Log View Modal */}
        <AuditLogViewModal
          isOpen={modalOpen}
          log={selectedLog}
          loading={modalLoading}
          onClose={handleCloseModal}
        />
      </div>
      <PaginationControls
        currentPage={Math.floor(offset / pageSize) + 1}
        totalPages={Math.ceil(total / pageSize)}
        pageSize={pageSize}
        totalRecords={total}
        onPageChange={(page) => setOffset((page - 1) * pageSize)}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={pageSizeOptions}
        className="mt-0 border-0 border-t border-border rounded-none shadow-none"
      />
    </>
  );
};
