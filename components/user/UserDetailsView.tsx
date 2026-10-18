"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  ShieldOff,
  Clock,
  Edit,
  UserCircle,
  Key,
  Activity,
  Hash,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronLeft,
  LogIn,
  LogOut,
  FileText,
  Settings,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "@/types/user.types";
import { getAuditLogs } from "@/actions/audit.actions";
import { AuditLogRecord } from "@/types/audit/audit.types";

interface UserDetailsViewProps {
  user: User;
}

type TabType = "overview" | "permissions" | "activity";

export default function UserDetailsView({ user }: UserDetailsViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [activityLogs, setActivityLogs] = useState<AuditLogRecord[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  // Pagination state for activity
  const [activityPage, setActivityPage] = useState(1);
  const [activityPageSize, setActivityPageSize] = useState(10);
  const [activityTotal, setActivityTotal] = useState(0);

  const isActive = user.status === "active";

  // Fetch user activity when activity tab is selected or pagination changes
  useEffect(() => {
    if (activeTab === "activity") {
      fetchUserActivity();
    }
  }, [activeTab, user.id, activityPage, activityPageSize]);

  const fetchUserActivity = async () => {
    setActivityLoading(true);
    setActivityError(null);
    try {
      const offset = (activityPage - 1) * activityPageSize;
      const response = await getAuditLogs({
        user_id: user.id,
        limit: activityPageSize,
        offset: offset,
      });
      if (response.success) {
        setActivityLogs(response.data.logs || []);
        setActivityTotal(response.data.pagination?.total || 0);
      } else {
        setActivityError(response.message || "Failed to load activity");
      }
    } catch (err) {
      console.error("Failed to fetch user activity:", err);
      setActivityError("Failed to load activity");
    } finally {
      setActivityLoading(false);
    }
  };

  const activityTotalPages = Math.ceil(activityTotal / activityPageSize) || 1;

  const handleActivityPageChange = (page: number) => {
    if (page >= 1 && page <= activityTotalPages) {
      setActivityPage(page);
    }
  };

  const handleActivityPageSizeChange = (size: number) => {
    setActivityPageSize(size);
    setActivityPage(1);
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRoleColorStyles = (role: string) => {
    const normalizedRole = role?.toLowerCase?.() || "";
    if (normalizedRole.includes("admin")) {
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    }
    if (normalizedRole.includes("compliance")) {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    }
    if (normalizedRole.includes("risk")) {
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
    }
    if (normalizedRole.includes("auditor")) {
      return "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300";
    }
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  };

  const getStatusStyles = (status: string) => {
    if (status === "active") {
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    }
    if (status === "suspended" || status === "inactive") {
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    }
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create":
        return <CheckCircle size={12} className="text-green-500" />;
      case "get":
      case "read":
        return <Activity size={12} className="text-blue-500" />;
      case "update":
        return <Edit size={12} className="text-yellow-500" />;
      case "delete":
        return <XCircle size={12} className="text-red-500" />;
      default:
        return <Key size={12} className="text-gray-500" />;
    }
  };

  const getActivityIcon = (eventType: string, action: string) => {
    const type = eventType?.toLowerCase() || "";
    const act = action?.toLowerCase() || "";

    if (type.includes("login") || act.includes("login")) {
      return <LogIn size={18} className="text-white" />;
    }
    if (type.includes("logout") || act.includes("logout")) {
      return <LogOut size={18} className="text-white" />;
    }
    if (act.includes("create") || act.includes("add")) {
      return <CheckCircle size={18} className="text-white" />;
    }
    if (act.includes("update") || act.includes("edit") || act.includes("modify")) {
      return <Edit size={18} className="text-white" />;
    }
    if (act.includes("delete") || act.includes("remove")) {
      return <XCircle size={18} className="text-white" />;
    }
    if (type.includes("settings") || type.includes("config")) {
      return <Settings size={18} className="text-white" />;
    }
    return <FileText size={18} className="text-white" />;
  };

  const getActivityIconStyle = (eventType: string, statusCode: number) => {
    if (statusCode >= 400) {
      return "bg-red-500";
    }
    const type = eventType?.toLowerCase() || "";
    if (type.includes("login")) {
      return "bg-green-500";
    }
    if (type.includes("logout")) {
      return "bg-orange-500";
    }
    if (type.includes("create") || type.includes("add")) {
      return "bg-emerald-500";
    }
    if (type.includes("update") || type.includes("modify")) {
      return "bg-blue-500";
    }
    if (type.includes("delete")) {
      return "bg-red-500";
    }
    return "bg-[#164e87]";
  };

  const formatActivityAction = (action: string) => {
    if (!action) return "Unknown Action";
    return action
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "error":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "info":
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    }
  };

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: UserCircle },
    { id: "permissions" as TabType, label: "Permissions", icon: Shield },
    { id: "activity" as TabType, label: "Activity", icon: Activity },
  ];

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link
          href="/config"
          className="hover:text-foreground transition-colors"
        >
          Settings
        </Link>
        <ChevronRight size={14} />
        <Link
          href="/config"
          className="hover:text-foreground transition-colors"
        >
          User Management
        </Link>
        <ChevronRight size={14} />
        <span className="text-foreground font-medium">{user.name || "User Details"}</span>
      </nav>

      {/* Header Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm mb-6">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-[#164e87] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {getInitials(user.name)}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyles(
                    user.status
                  )}`}
                >
                  {isActive ? (
                    <CheckCircle size={12} />
                  ) : (
                    <XCircle size={12} />
                  )}
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColorStyles(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
                {user.mfaEnabled && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <ShieldCheck size={12} />
                    MFA Enabled
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail size={16} className="text-blue-500 flex-shrink-0" />
                  <span className="truncate">{user.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone size={16} className="text-green-500 flex-shrink-0" />
                  <span>{user.phone || "No phone"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock size={16} className="text-orange-500 flex-shrink-0" />
                  <span className="truncate" title={formatDateTime(user.lastLogin)}>
                    Last login: {formatDateTime(user.lastLogin)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash size={16} className="text-gray-500 flex-shrink-0" />
                  <span className="truncate font-mono text-xs" title={user.id}>
                    {user.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-row lg:flex-col gap-2 flex-shrink-0">
              <Link
                href={`/users/${user.id}/edit`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#164e87] text-white text-sm font-medium rounded-lg hover:bg-[#133f6d] transition-colors"
              >
                <Edit size={16} />
                Edit User
              </Link>
              <button
                onClick={() => router.push("/config")}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-card text-foreground text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Settings
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-border">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-[#164e87] text-[#164e87] bg-blue-50/50 dark:bg-blue-900/10"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Information */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <UserCircle size={20} className="text-blue-500" />
                Account Information
              </h3>
              <dl className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <dt className="text-sm text-muted-foreground">Full Name</dt>
                  <dd className="text-sm font-medium text-foreground">{user.name}</dd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <dt className="text-sm text-muted-foreground">Email Address</dt>
                  <dd className="text-sm font-medium text-foreground">{user.email || "N/A"}</dd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <dt className="text-sm text-muted-foreground">Phone Number</dt>
                  <dd className="text-sm font-medium text-foreground">{user.phone || "N/A"}</dd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <dt className="text-sm text-muted-foreground">User ID</dt>
                  <dd className="text-sm font-mono text-muted-foreground">{user.id}</dd>
                </div>
                <div className="flex justify-between items-center py-2">
                  <dt className="text-sm text-muted-foreground">Account Status</dt>
                  <dd>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusStyles(
                        user.status
                      )}`}
                    >
                      {isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Security Settings */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield size={20} className="text-green-500" />
                Security Settings
              </h3>
              <dl className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <dt className="text-sm text-muted-foreground">Role</dt>
                  <dd>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getRoleColorStyles(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <dt className="text-sm text-muted-foreground">Multi-Factor Authentication</dt>
                  <dd>
                    {user.mfaEnabled ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                        <ShieldCheck size={16} />
                        Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                        <ShieldOff size={16} />
                        Disabled
                      </span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <dt className="text-sm text-muted-foreground">Last Login</dt>
                  <dd className="text-sm text-foreground">{formatDateTime(user.lastLogin)}</dd>
                </div>
                <div className="flex justify-between items-center py-2">
                  <dt className="text-sm text-muted-foreground">Permissions Count</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {user.permissions?.length || 0} resources
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === "permissions" && (
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Key size={20} className="text-purple-500" />
              Access Permissions
            </h3>

            {user.permissions && user.permissions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {user.permissions.map((permission, index) => (
                  <div
                    key={index}
                    className="bg-muted/30 rounded-lg border border-border p-4 hover:border-blue-300 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#164e87] flex items-center justify-center">
                        <Shield size={14} className="text-white" />
                      </div>
                      <h4 className="font-semibold text-foreground capitalize">
                        {permission.resource.replace(/_/g, " ")}
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {permission.actions.map((action, actionIndex) => (
                        <span
                          key={actionIndex}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-card border border-border text-xs font-medium text-muted-foreground"
                        >
                          {getActionIcon(action)}
                          {action === "get" ? "Read" : action.charAt(0).toUpperCase() + action.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Shield size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No Permissions Assigned</p>
                <p className="text-sm mt-1">This user has not been assigned any permissions yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Activity size={20} className="text-orange-500" />
                Recent Activity
              </h3>
              <button
                onClick={fetchUserActivity}
                disabled={activityLoading}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={activityLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            {activityLoading && (
              <div className="flex items-center justify-center py-12">
                <RefreshCw size={24} className="animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading activity...</span>
              </div>
            )}

            {activityError && !activityLoading && (
              <div className="text-center py-12">
                <AlertCircle size={48} className="mx-auto mb-4 text-red-400 opacity-50" />
                <p className="text-lg font-medium text-red-600">{activityError}</p>
                <button
                  onClick={fetchUserActivity}
                  className="mt-4 px-4 py-2 bg-[#164e87] text-white rounded-lg hover:bg-[#133f6d] transition-colors text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            )}

            {!activityLoading && !activityError && activityLogs.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Activity size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No Activity Found</p>
                <p className="text-sm mt-1">This user has no recorded activity yet.</p>
              </div>
            )}

            {!activityLoading && !activityError && activityLogs.length > 0 && (
              <>
                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActivityIconStyle(log.eventType, log.statusCode)}`}>
                        {getActivityIcon(log.eventType, log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">
                            {formatActivityAction(log.action)}
                          </span>
                          <span className="text-muted-foreground">on</span>
                          <span className="font-medium text-foreground capitalize">
                            {log.resource.replace(/_/g, " ")}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityStyle(log.severity)}`}
                          >
                            {log.severity}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDateTime(log.createdAt)}
                          </span>
                          {log.ipAddress && (
                            <span className="font-mono text-xs">{log.ipAddress}</span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              log.statusCode >= 200 && log.statusCode < 300
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {log.statusCode}
                          </span>
                        </div>
                        {log.errorMessage && (
                          <p className="mt-1 text-sm text-red-500">{log.errorMessage}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    <span className="font-medium text-foreground">
                      {(activityPage - 1) * activityPageSize + 1}
                    </span>{" "}
                    -{" "}
                    <span className="font-medium text-foreground">
                      {Math.min(activityPage * activityPageSize, activityTotal)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-foreground">{activityTotal}</span>{" "}
                    activities
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleActivityPageChange(activityPage - 1)}
                      disabled={activityPage === 1 || activityLoading}
                      className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(activityTotalPages, 5) }, (_, i) => {
                        let pageNum: number;
                        if (activityTotalPages <= 5) {
                          pageNum = i + 1;
                        } else if (activityPage <= 3) {
                          pageNum = i + 1;
                        } else if (activityPage >= activityTotalPages - 2) {
                          pageNum = activityTotalPages - 4 + i;
                        } else {
                          pageNum = activityPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handleActivityPageChange(pageNum)}
                            disabled={activityLoading}
                            className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${
                              activityPage === pageNum
                                ? "bg-[#164e87] text-white"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handleActivityPageChange(activityPage + 1)}
                      disabled={activityPage === activityTotalPages || activityLoading}
                      className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows:</span>
                    <select
                      value={activityPageSize}
                      onChange={(e) => handleActivityPageSizeChange(Number(e.target.value))}
                      disabled={activityLoading}
                      className="h-8 px-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#164e87] disabled:opacity-50"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
