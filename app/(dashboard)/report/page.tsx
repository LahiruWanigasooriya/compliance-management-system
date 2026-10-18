"use client";
// TODO: REMOVE USE CLIENT ONEC IT MOVED TO SSR
import { ICONS, TIME_RANGES } from "@/constants/constants";
import { useMemo, useState } from "react";

const Report = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d");
  const [selectedReportType, setSelectedReportType] = useState("all");

  const reports = [
    {
      id: "RPT-2025-001",
      reportName: "Q4 2025 SAR Filing Report",
      reportType: "SAR Summary",
      status: "Completed",
      generatedDate: "2025-10-10 09:00:00",
      generatedBy: "Sarah Mitchell",
      period: "Q4 2025",
      format: "PDF",
      fileSize: "2.4 MB",
      recordsIncluded: 145,
      downloadCount: 8,
    },
    {
      id: "RPT-2025-002",
      reportName: "Weekly Transaction Monitoring",
      reportType: "Transaction Analysis",
      status: "In Progress",
      generatedDate: "2025-10-10 08:30:00",
      generatedBy: "John Anderson",
      period: "Oct 3-10, 2025",
      format: "Excel",
      fileSize: "5.7 MB",
      recordsIncluded: 3421,
      downloadCount: 0,
    },
    {
      id: "RPT-2025-003",
      reportName: "High Risk Customer Review",
      reportType: "Risk Assessment",
      status: "Completed",
      generatedDate: "2025-10-09 16:45:00",
      generatedBy: "Maria Rodriguez",
      period: "September 2025",
      format: "PDF",
      fileSize: "1.8 MB",
      recordsIncluded: 67,
      downloadCount: 15,
    },
    {
      id: "RPT-2025-004",
      reportName: "Regulatory Audit Trail",
      reportType: "Audit Log",
      status: "Scheduled",
      generatedDate: "2025-10-11 00:00:00",
      generatedBy: "System",
      period: "September 2025",
      format: "CSV",
      fileSize: "N/A",
      recordsIncluded: 0,
      downloadCount: 0,
    },
    {
      id: "RPT-2025-005",
      reportName: "CTR Submission Summary",
      reportType: "CTR Report",
      status: "Completed",
      generatedDate: "2025-10-08 14:20:00",
      generatedBy: "David Chen",
      period: "Q3 2025",
      format: "XML",
      fileSize: "892 KB",
      recordsIncluded: 234,
      downloadCount: 5,
    },
    {
      id: "RPT-2025-006",
      reportName: "AML Compliance Effectiveness",
      reportType: "Compliance Metrics",
      status: "Failed",
      generatedDate: "2025-10-07 11:15:00",
      generatedBy: "Michael Wong",
      period: "Q4 2025",
      format: "PDF",
      fileSize: "N/A",
      recordsIncluded: 0,
      downloadCount: 0,
    },
  ];

  const stats = useMemo(() => {
    const total = reports.length;
    const completed = reports.filter((r) => r.status === "Completed").length;
    const inProgress = reports.filter((r) => r.status === "In Progress").length;
    const scheduled = reports.filter((r) => r.status === "Scheduled").length;

    return { total, completed, inProgress, scheduled };
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesType =
        selectedReportType === "all" ||
        report.reportType === selectedReportType;
      return matchesType;
    });
  }, [reports, selectedReportType]);

  const getStatusBadgeClasses = (status: string) => {
    const styles = {
      Completed: "bg-green-100 text-green-700 border-green-300",
      "In Progress": "bg-blue-100 text-blue-700 border-blue-300",
      Scheduled: "bg-purple-100 text-purple-700 border-purple-300",
      Failed: "bg-red-100 text-red-700 border-red-300",
    };
    return `px-2.5 py-1 rounded-full text-xs font-semibold border ${
      styles[status as keyof typeof styles]
    }`;
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "PDF":
        return <ICONS.FileText size={16} className="text-red-500" />;
      case "Excel":
        return <ICONS.FileText size={16} className="text-green-500" />;
      case "CSV":
        return <ICONS.FileText size={16} className="text-blue-500" />;
      case "XML":
        return <ICONS.FileText size={16} className="text-orange-500" />;
      default:
        return <ICONS.FileText size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="">
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report</h1>
          <p className="text-gray-600 text-sm mt-0.5">
            Generate and view compliance reports
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-600 bg-white text-gray-900 text-sm font-medium"
          >
            {TIME_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-colors text-sm font-medium">
            <ICONS.Plus size={16} />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* <SummaryCard
                            title="Total Reports"
                            value={stats.total}
                            mainColor="blue"
                            icon={ICONS.FileText || ICONS.File}
                            bottomLabel="All time reports"
                        />
                        <SummaryCard
                            title="Completed"
                            value={stats.completed}
                            mainColor="green"
                            icon={ICONS.CheckCircle || ICONS.Check}
                            bottomLabel="Ready for download"
                        />
                        <SummaryCard
                            title="In Progress"
                            value={stats.inProgress}
                            mainColor="blue"
                            icon={ICONS.Clock}
                            bottomLabel="Currently generating"
                        />
                        <SummaryCard
                            title="Scheduled"
                            value={stats.scheduled}
                            mainColor="purple"
                            icon={ICONS.Calendar}
                            bottomLabel="Upcoming reports"
                        /> */}
      </div>

      {/* Report Type Categories */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Report Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <ICONS.AlertTriangle size={20} className="text-red-600" />
              <span className="text-gray-900 font-bold text-lg">24</span>
            </div>
            <div className="text-gray-600 text-xs font-medium">SAR Reports</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <ICONS.DollarSign size={20} className="text-green-600" />
              <span className="text-gray-900 font-bold text-lg">18</span>
            </div>
            <div className="text-gray-600 text-xs font-medium">CTR Reports</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <ICONS.Activity size={20} className="text-blue-600" />
              <span className="text-gray-900 font-bold text-lg">42</span>
            </div>
            <div className="text-gray-600 text-xs font-medium">Analytics</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <ICONS.Shield size={20} className="text-purple-600" />
              <span className="text-gray-900 font-bold text-lg">15</span>
            </div>
            <div className="text-gray-600 text-xs font-medium">Audit Logs</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <ICONS.TrendingUp size={20} className="text-orange-600" />
              <span className="text-gray-900 font-bold text-lg">31</span>
            </div>
            <div className="text-gray-600 text-xs font-medium">
              Risk Reports
            </div>
          </div>
        </div>
      </div>

      {/* Report Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="flex gap-2 flex-wrap">
          {[
            "all",
            "SAR Summary",
            "CTR Report",
            "Transaction Analysis",
            "Risk Assessment",
            "Audit Log",
            "Compliance Metrics",
          ].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedReportType(type)}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${
                selectedReportType === type
                  ? "bg-[#1A5276] text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
              }`}
            >
              {type === "all" ? "All Reports" : type}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-12 space-y-3">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 flex-wrap gap-2 mb-2">
                    <span className="text-gray-900 font-semibold text-lg">
                      {report.id}
                    </span>
                    <span className={getStatusBadgeClasses(report.status)}>
                      {report.status.toUpperCase()}
                    </span>
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 border border-blue-300 rounded-full text-xs font-semibold">
                      {report.reportType}
                    </span>
                  </div>
                  <h3 className="text-gray-900 font-semibold text-base mb-2">
                    {report.reportName}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 flex-wrap">
                    <span className="flex items-center">
                      <ICONS.User size={14} className="mr-1" />
                      {report.generatedBy}
                    </span>
                    <span className="flex items-center">
                      <ICONS.Clock size={14} className="mr-1" />
                      {report.generatedDate}
                    </span>
                    <span className="flex items-center">
                      <ICONS.Calendar size={14} className="mr-1" />
                      Period: {report.period}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-gray-600 text-xs mb-1 font-medium">
                    Format
                  </div>
                  <div className="flex items-center space-x-2">
                    {getFormatIcon(report.format)}
                    <span className="text-gray-900 font-semibold text-sm">
                      {report.format}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-gray-600 text-xs mb-1 font-medium">
                    File Size
                  </div>
                  <div className="text-gray-900 font-semibold text-sm">
                    {report.fileSize}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-gray-600 text-xs mb-1 font-medium">
                    Records
                  </div>
                  <div className="text-gray-900 font-semibold text-sm">
                    {report.recordsIncluded.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-gray-600 text-xs mb-1 font-medium">
                    Downloads
                  </div>
                  <div className="text-gray-900 font-semibold text-sm">
                    {report.downloadCount}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-gray-600 text-xs mb-1 font-medium">
                    Status
                  </div>
                  <div
                    className={`font-semibold text-sm ${
                      report.status === "Completed"
                        ? "text-green-600"
                        : report.status === "In Progress"
                        ? "text-blue-600"
                        : report.status === "Scheduled"
                        ? "text-purple-600"
                        : "text-red-600"
                    }`}
                  >
                    {report.status}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                {report.status === "Completed" && (
                  <>
                    <button className="px-4 py-2 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-all text-sm font-medium flex items-center space-x-1.5">
                      <ICONS.Download size={16} />
                      <span>Download</span>
                    </button>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium flex items-center space-x-1.5">
                      <ICONS.Eye size={16} />
                      <span>Preview</span>
                    </button>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium flex items-center space-x-1.5">
                      <ICONS.Share2 size={16} />
                      <span>Share</span>
                    </button>
                  </>
                )}
                {report.status === "In Progress" && (
                  <button className="px-4 py-2 bg-blue-100 text-blue-700 border border-blue-300 rounded-lg text-sm font-medium">
                    Generating...
                  </button>
                )}
                {report.status === "Scheduled" && (
                  <button className="px-4 py-2 bg-purple-100 text-purple-700 border border-purple-300 rounded-lg hover:bg-purple-200 transition-all text-sm font-medium">
                    Edit Schedule
                  </button>
                )}
                {report.status === "Failed" && (
                  <button className="px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded-lg hover:bg-red-200 transition-all text-sm font-medium">
                    Retry Generation
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

export default Report;
