"use client";
// TODO: REMOVE USE CLIENT ONEC IT MOVED TO SSR
import SummaryCard from "@/components/layout/SummaryCard";
import { ICONS, TIME_RANGES } from "@/constants/constants";
import { useMemo, useState } from "react";

const AuditCompliance = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d");
  const [selectedType, setSelectedType] = useState("all");

  const auditRecords = useMemo(
    () => [
      {
        id: "AUD-2025-145",
        auditType: "SAR Filing Review",
        status: "In Progress",
        auditor: "Regulatory Agency",
        requestDate: "2025-10-08 09:00:00",
        dueDate: "2025-10-22 17:00:00",
        priority: "High",
        documentsRequested: 45,
        documentsProvided: 32,
        findingsCount: 3,
        complianceScore: 87,
      },
      {
        id: "AUD-2025-144",
        auditType: "KYC Verification",
        status: "Completed",
        auditor: "Internal Audit Team",
        requestDate: "2025-10-01 10:30:00",
        dueDate: "2025-10-10 17:00:00",
        priority: "Medium",
        documentsRequested: 120,
        documentsProvided: 120,
        findingsCount: 2,
        complianceScore: 92,
      },
      {
        id: "AUD-2025-143",
        auditType: "Transaction Monitoring",
        status: "Pending Response",
        auditor: "External Auditor",
        requestDate: "2025-10-05 14:15:00",
        dueDate: "2025-10-19 17:00:00",
        priority: "High",
        documentsRequested: 78,
        documentsProvided: 45,
        findingsCount: 5,
        complianceScore: 78,
      },
      {
        id: "AUD-2025-142",
        auditType: "AML Program Review",
        status: "Completed",
        auditor: "FinCEN",
        requestDate: "2025-09-15 11:00:00",
        dueDate: "2025-10-05 17:00:00",
        priority: "Critical",
        documentsRequested: 200,
        documentsProvided: 200,
        findingsCount: 1,
        complianceScore: 95,
      },
      {
        id: "AUD-2025-141",
        auditType: "CTR Filing Audit",
        status: "Overdue",
        auditor: "Regulatory Agency",
        requestDate: "2025-09-20 09:30:00",
        dueDate: "2025-10-08 17:00:00",
        priority: "Critical",
        documentsRequested: 65,
        documentsProvided: 40,
        findingsCount: 8,
        complianceScore: 65,
      },
    ],
    []
  );

  const stats = useMemo(() => {
    const total = auditRecords.length;
    const inProgress = auditRecords.filter(
      (a) => a.status === "In Progress" || a.status === "Pending Response"
    ).length;
    const completed = auditRecords.filter(
      (a) => a.status === "Completed"
    ).length;
    const overdue = auditRecords.filter((a) => a.status === "Overdue").length;
    const avgScore = Math.round(
      auditRecords.reduce((sum, a) => sum + a.complianceScore, 0) /
        auditRecords.length
    );

    return { total, inProgress, completed, overdue, avgScore };
  }, [auditRecords]);

  const filteredRecords = useMemo(() => {
    return auditRecords.filter((record) => {
      const matchesType =
        selectedType === "all" || record.auditType === selectedType;
      return matchesType;
    });
  }, [auditRecords, selectedType]);

  const getStatusBadgeClasses = (status: string) => {
    const styles = {
      "In Progress":
        "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700",
      "Pending Response":
        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700",
      Completed:
        "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700",
      Overdue:
        "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700",
    };
    return `px-2.5 py-1 rounded-full text-xs font-semibold border ${
      styles[status as keyof typeof styles]
    }`;
  };

  const getPriorityBadgeClasses = (priority: string) => {
    const styles = {
      Low: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600",
      Medium:
        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700",
      High: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700",
      Critical:
        "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700",
    };
    return `px-2.5 py-1 rounded-full text-xs font-semibold border ${
      styles[priority as keyof typeof styles]
    }`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className=" ">
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Audit Compliance
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Ensure adherence to compliance standards and regulations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-4 py-2 border border-panel-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-white dark:bg-slate-800 text-foreground dark:text-gray-100 text-sm font-medium shadow-sm"
          >
            {TIME_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors text-sm font-medium shadow-sm">
            <ICONS.FileText size={16} />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <SummaryCard
          title="Total Audits"
          value={stats.total}
          mainColor="blue"
          icon={ICONS.FileText}
          bottomLabel="Active audits"
        />
        <SummaryCard
          title="In Progress"
          value={stats.inProgress}
          mainColor="yellow"
          icon={ICONS.Clock}
          bottomLabel="Pending completion"
        />
        <SummaryCard
          title="Completed"
          value={stats.completed}
          mainColor="green"
          icon={ICONS.CheckCircle}
          bottomLabel="Successfully closed"
        />
        <SummaryCard
          title="Avg Score"
          value={`${stats.avgScore}%`}
          mainColor="purple"
          icon={ICONS.TrendingUp}
          bottomLabel="Compliance rating"
        />
      </div>

      {/* Audit Performance Overview */}
      <div className="bg-card rounded-xl border border-panel-border shadow-sm p-4 mb-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Audit Performance Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="bg-card rounded-lg p-3 border border-panel-border">
            <div className="text-primary-foreground text-xs mb-1 font-medium">
              Document Completion
            </div>
            <div className="text-foreground font-bold text-lg">
              {Math.round(
                (auditRecords.reduce((sum, a) => sum + a.documentsProvided, 0) /
                  auditRecords.reduce(
                    (sum, a) => sum + a.documentsRequested,
                    0
                  )) *
                  100
              )}
              %
            </div>
            <div className="text-muted-foreground text-xs mt-1">
              Overall rate
            </div>
          </div>
          <div className="bg-card rounded-lg p-3 border border-panel-border">
            <div className="text-primary-foreground text-xs mb-1 font-medium">
              Total Findings
            </div>
            <div className="text-foreground font-bold text-lg">
              {auditRecords.reduce((sum, a) => sum + a.findingsCount, 0)}
            </div>
            <div className="text-orange-600 text-xs mt-1 font-semibold">
              Requires attention
            </div>
          </div>
          <div className="bg-card rounded-lg p-3 border border-panel-border">
            <div className="text-primary-foreground text-xs mb-1 font-medium">
              Overdue Items
            </div>
            <div className="text-foreground font-bold text-lg">
              {stats.overdue}
            </div>
            <div className="text-red-600 text-xs mt-1 font-semibold">
              Immediate action
            </div>
          </div>
          <div className="bg-card rounded-lg p-3 border border-panel-border">
            <div className="text-primary-foreground text-xs mb-1 font-medium">
              Success Rate
            </div>
            <div className="text-foreground font-bold text-lg">
              {Math.round((stats.completed / stats.total) * 100)}%
            </div>
            <div className="text-green-600 text-xs mt-1 font-semibold">
              On-time completion
            </div>
          </div>
          <div className="bg-card rounded-lg p-3 border border-panel-border">
            <div className="text-primary-foreground text-xs mb-1 font-medium">
              Avg Response Time
            </div>
            <div className="text-foreground font-bold text-lg">3.2d</div>
            <div className="text-muted-foreground text-xs mt-1">
              Days to respond
            </div>
          </div>
        </div>
      </div>

      {/* Audit Type Filters */}
      <div className="bg-card rounded-xl border border-panel-border shadow-sm p-4 mb-4">
        <div className="flex gap-2 flex-wrap">
          {[
            "all",
            "SAR Filing Review",
            "KYC Verification",
            "Transaction Monitoring",
            "AML Program Review",
            "CTR Filing Audit",
          ].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${
                selectedType === type
                  ? "bg-[#1A5276] text-white shadow-md"
                  : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-800/90 border border-panel-border shadow-sm"
              }`}
            >
              {type === "all" ? "All Audits" : type}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Records List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-12 space-y-3">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="bg-card rounded-xl border border-panel-border shadow-sm p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 flex-wrap gap-2 mb-2">
                    <span className="text-foreground font-semibold text-lg">
                      {record.id}
                    </span>
                    <span className={getStatusBadgeClasses(record.status)}>
                      {record.status.toUpperCase()}
                    </span>
                    <span className={getPriorityBadgeClasses(record.priority)}>
                      Priority: {record.priority}
                    </span>
                  </div>
                  <h3 className="text-foreground font-semibold text-base mb-2">
                    {record.auditType}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center">
                      <ICONS.User size={14} className="mr-1" />
                      {record.auditor}
                    </span>
                    <span className="flex items-center">
                      <ICONS.Calendar size={14} className="mr-1" />
                      Requested: {record.requestDate}
                    </span>
                    <span className="flex items-center">
                      <ICONS.Clock size={14} className="mr-1" />
                      Due: {record.dueDate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <div className="bg-card rounded-lg p-3 border border-panel-border">
                  <div className="text-primary-foreground text-xs mb-1 font-medium">
                    Documents Requested
                  </div>
                  <div className="text-foreground font-bold text-lg">
                    {record.documentsRequested}
                  </div>
                </div>
                <div className="bg-card rounded-lg p-3 border border-panel-border">
                  <div className="text-primary-foreground text-xs mb-1 font-medium">
                    Documents Provided
                  </div>
                  <div className="text-foreground font-bold text-lg">
                    {record.documentsProvided}
                  </div>
                  <div className="text-muted-foreground text-xs mt-1">
                    {Math.round(
                      (record.documentsProvided / record.documentsRequested) *
                        100
                    )}
                    % complete
                  </div>
                </div>
                <div className="bg-card rounded-lg p-3 border border-panel-border">
                  <div className="text-primary-foreground text-xs mb-1 font-medium">
                    Findings
                  </div>
                  <div className="text-foreground font-bold text-lg">
                    {record.findingsCount}
                  </div>
                </div>
                <div className="bg-card rounded-lg p-3 border border-panel-border">
                  <div className="text-primary-foreground text-xs mb-1 font-medium">
                    Compliance Score
                  </div>
                  <div
                    className={`font-bold text-lg ${getScoreColor(
                      record.complianceScore
                    )}`}
                  >
                    {record.complianceScore}%
                  </div>
                </div>
                <div className="bg-card rounded-lg p-3 border border-panel-border">
                  <div className="text-primary-foreground text-xs mb-1 font-medium">
                    Progress
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-[#1A5276] h-2 rounded-full"
                      style={{
                        width: `${
                          (record.documentsProvided /
                            record.documentsRequested) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button className="px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-all text-sm font-medium flex items-center gap-2 shadow-sm">
                  <ICONS.Eye size={16} />
                  <span>View Details</span>
                </button>
                {record.status !== "Completed" && (
                  <>
                    <button className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-800 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-all text-sm font-medium flex items-center space-x-1.5">
                      <ICONS.Upload size={16} />
                      <span>Upload Documents</span>
                    </button>
                    {record.status === "Overdue" && (
                      <button className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-all text-sm font-medium">
                        Urgent Response
                      </button>
                    )}
                  </>
                )}
                {record.findingsCount > 0 && (
                  <button className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/40 transition-all text-sm font-medium">
                    View Findings
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuditCompliance;
