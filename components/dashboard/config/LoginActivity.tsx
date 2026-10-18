"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X, Info, Activity } from "lucide-react";
import { getAuditLogs } from "@/actions/config.actions";

interface LoginActivity {
  userId: string;
  username: string;
  loginTimestamp: string;
  ipAddress: string;
  device: string;
  loginStatus: "Success" | "Failed";
  sessionDuration: string;
}

interface Filters {
  startDate: string;
  endDate: string;
  userId: string;
  loginStatus: string;
}

const LoginActivityComponent = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [loginActivities, setLoginActivities] = useState<LoginActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const recordsPerPage = 10;

  // Filter states
  const [filters, setFilters] = useState<Filters>({
    startDate: "",
    endDate: "",
    userId: "",
    loginStatus: "",
  });

  // Fetch login activities from API
  useEffect(() => {
    const fetchLoginActivities = async () => {
      try {
        setLoadingActivities(true);
        const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;

        if (!tenantId) {
          throw new Error("Tenant ID is not configured");
        }

        // Use getAuditLogs action with options
        const result = await getAuditLogs(
          {
            limit: 50,
            offset: 0,
          },
          tenantId,
        );

        const data = result.data || [];

        // Transform API response to match our UI structure
        const transformedData: LoginActivity[] = data.map((log: any) => {
          const statusCode = log.status_code || 200;
          const loginStatus = statusCode === 200 ? "Success" : "Failed";

          // Handle IP address - can be empty or comma-separated
          const ipAddress = log.ip_address?.trim() || "N/A";

          // Handle device - use user_agent if available, otherwise service_name
          let device = "N/A";
          if (log.user_agent?.trim()) {
            device = log.user_agent;
          } else if (log.service_name?.trim()) {
            device = log.service_name;
          }

          return {
            userId: log.user_id?.substring(0, 8) || "N/A", // Show first 8 chars of UUID
            username: log.username || "Unknown",
            loginTimestamp: formatTimestamp(log.created_at),
            ipAddress,
            device,
            loginStatus,
            sessionDuration: "-",
          };
        });

        setLoginActivities(transformedData);
      } catch (error) {
        console.error("Error fetching login activities:", error);
        setLoginActivities([]);
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchLoginActivities();
  }, []);

  // Format ISO timestamp to readable format (MM-DD-YYYY HH:MM:SS AM/PM)
  const formatTimestamp = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = String(hours % 12 || 12).padStart(2, "0");

      return `${month}-${day}-${year} ${displayHours}:${minutes}:${seconds} ${ampm}`;
    } catch (error) {
      return isoString;
    }
  };

  // Parse date from timestamp string (MM-DD-YYYY HH:MM:SS AM/PM)
  const parseDate = (timestamp: string) => {
    const [datePart] = timestamp.split(" ");
    const [month, day, year] = datePart.split("-");
    return new Date(`${year}-${month}-${day}`);
  };

  // Filter login activities based on applied filters
  const filteredActivities = loginActivities.filter((activity) => {
    // Filter by date range
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      const activityDate = parseDate(activity.loginTimestamp);
      if (activityDate < startDate) return false;
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      const activityDate = parseDate(activity.loginTimestamp);
      if (activityDate > endDate) return false;
    }

    // Filter by user ID
    if (
      filters.userId &&
      !activity.userId.toLowerCase().includes(filters.userId.toLowerCase())
    ) {
      return false;
    }

    // Filter by login status
    if (filters.loginStatus && activity.loginStatus !== filters.loginStatus) {
      return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredActivities.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = filteredActivities.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const clearFilter = (key: keyof Filters) => {
    setFilters((prev) => ({ ...prev, [key]: "" }));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      userId: "",
      loginStatus: "",
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  const getAppliedFilters = () => {
    const applied = [];
    if (filters.startDate)
      applied.push({
        key: "startDate" as const,
        label: `From: ${filters.startDate}`,
      });
    if (filters.endDate)
      applied.push({
        key: "endDate" as const,
        label: `To: ${filters.endDate}`,
      });
    if (filters.userId)
      applied.push({
        key: "userId" as const,
        label: `User: ${filters.userId}`,
      });
    if (filters.loginStatus)
      applied.push({
        key: "loginStatus" as const,
        label: `Status: ${filters.loginStatus}`,
      });
    return applied;
  };

  return (
    <div className="bg-card rounded-xl  shadow-sm">
      {/* Login Activity Section */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Login Activity
              </h2>
              <p className="text-xs text-prime-foreground">
                View login sessions and detect suspicious behavior
              </p>
            </div>
          </div>
        </div>
      </div>
      <div>
        {/* Immutability Banner */}
        <div className="bg-emerald-50/50 mx-6 rounded-lg border border-emerald-100 p-4 flex items-start space-x-3">
          <div className="bg-emerald-100 p-1.5 rounded-md">
            <Info size={18} className="text-emerald-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-900">
              Audit Trail Protection
            </p>
            <p className="text-xs text-emerald-700/80 mt-1 leading-relaxed">
              These login activity records are immutable. They cannot be edited
              or deleted to maintain the true data records without modifications
              as required by compliance regulations.
            </p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="p-6 bg-card border-b w-full border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-prime-foreground mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5276] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-prime-foreground mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5276] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-prime-foreground mb-2">
                User ID
              </label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => handleFilterChange("userId", e.target.value)}
                placeholder="Search by User ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5276] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-prime-foreground mb-2">
                Login Status
              </label>
              <select
                value={filters.loginStatus}
                onChange={(e) =>
                  handleFilterChange("loginStatus", e.target.value)
                }
                className="w-full px-3 py-2 border bg-card border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5276] text-sm"
              >
                <option value="">All</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Applied Filters Display */}
          {hasActiveFilters && (
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm font-medium text-prime-foreground">
                Applied Filters:
              </span>
              {getAppliedFilters().map((filter) => (
                <span
                  key={filter.key}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-300"
                >
                  {filter.label}
                  <button
                    onClick={() => clearFilter(filter.key)}
                    className="ml-2 hover:text-blue-900"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              <button
                onClick={clearAllFilters}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition-all"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loadingActivities ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-card mb-4">
              <div className="animate-spin">
                <Activity size={32} className="text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Loading login activities...
            </h3>
            <p className="text-sm text-prime-foreground">
              Please wait while we fetch your data from the server.
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            {filteredActivities.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-card mb-4">
                  <AlertTriangle size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No records found
                </h3>
                <p className="text-sm text-prime-foreground mb-4">
                  No login activities match your selected criteria. Try
                  adjusting your filters.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-all text-sm font-medium"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto border-collapse ">
                    <thead className="bg-card">
                      <tr>
                        <th className="px-3 2xl:px-5 py-3 text-left text-xs font-semibold text-prime-foreground uppercase tracking-wider">
                          User ID & Username
                        </th>
                        <th className="px-3 2xl:px-5 py-3 text-left text-xs font-semibold text-prime-foreground uppercase tracking-wider">
                          Login Timestamp
                        </th>
                        <th className="px-3 2xl:px-5 py-3 text-left text-xs font-semibold text-prime-foreground uppercase tracking-wider">
                          IP Address
                        </th>
                        <th className="px-3 2xl:px-5 py-3 text-left text-xs font-semibold text-prime-foreground uppercase tracking-wider">
                          Device
                        </th>
                        <th className="px-3 2xl:px-5 py-3 text-left text-xs font-semibold text-prime-foreground uppercase tracking-wider">
                          Login Status
                        </th>
                        <th className="px-3 2xl:px-5 py-3 text-left text-xs font-semibold text-prime-foreground uppercase tracking-wider">
                          Session Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {currentRecords.map((activity, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-card transition-colors"
                        >
                          <td className="px-2 2xl:px-5 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-foreground">
                              {activity.userId}
                            </div>
                            <div className="text-sm text-prime-foreground">
                              {activity.username}
                            </div>
                          </td>
                          <td className="px-3 2xl:px-5 py-4 text-sm text-foreground">
                            {(() => {
                              const [datePart, timePart, ampmPart] =
                                activity.loginTimestamp.split(" ");
                              return (
                                <div className="flex flex-col leading-tight">
                                  <span className="font-medium">
                                    {datePart}
                                  </span>
                                  <span className="text-xs text-prime-foreground">
                                    {timePart} {ampmPart}
                                  </span>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-3 2xl:px-5 py-4 text-sm text-foreground">
                            <div className="flex flex-col leading-tight">
                              {activity.ipAddress
                                .split(",")
                                .map((ip) => ip.trim())
                                .filter(Boolean)
                                .map((ip, idx) => (
                                  <span key={`${ip}-${idx}`}>{ip}</span>
                                ))}
                            </div>
                          </td>
                          <td className="px-3 2xl:px-5 py-4 whitespace-nowrap text-sm text-foreground max-w-37 truncate">
                            {activity.device}
                          </td>
                          <td className="px-3 2xl:px-5 py-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                activity.loginStatus === "Success"
                                  ? "bg-green-100 text-green-700 border-green-300"
                                  : "bg-red-100 text-red-700 border-red-300"
                              }`}
                            >
                              {activity.loginStatus}
                            </span>
                          </td>
                          <td className="px-3 2xl:px-5 py-4 whitespace-nowrap text-sm text-foreground">
                            {activity.sessionDuration}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-3 2xl:px-5 py-4 border-t border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-prime-foreground text-center sm:text-left">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredActivities.length)} of{" "}
                    {filteredActivities.length} records
                    {hasActiveFilters &&
                      ` (filtered from ${loginActivities.length} total)`}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          currentPage === 1
                            ? "bg-card text-foreground cursor-not-allowed"
                            : "bg-card text-prime-foreground hover:bg-border border border-gray-300"
                        }`}
                      >
                        First
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          currentPage === 1
                            ? "bg-card text-gray-400 cursor-not-allowed"
                            : "bg-card text-prime-foreground hover:bg-border border border-gray-300"
                        }`}
                      >
                        Previous
                      </button>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap justify-center">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              currentPage === page
                                ? "bg-[#1A5276] text-white shadow-md"
                                : "bg-card text-prime-foreground hover:bg-border border border-gray-300"
                            }`}
                          >
                            {page}
                          </button>
                        ),
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          currentPage === totalPages
                            ? "bg-card text-gray-400 cursor-not-allowed"
                            : "bg-card text-prime-foreground hover:bg-border border border-gray-300"
                        }`}
                      >
                        Next
                      </button>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          currentPage === totalPages
                            ? "bg-card text-gray-400 cursor-not-allowed"
                            : "bg-card text-prime-foreground hover:bg-border border border-gray-300"
                        }`}
                      >
                        Last
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LoginActivityComponent;
