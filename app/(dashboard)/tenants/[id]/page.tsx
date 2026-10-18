"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Globe,
  Shield,
  Key,
  Copy,
  Check,
  Loader2,
  Pencil,
  Power,
  PlayCircle,
  Users,
  Clock,
  CheckCircle,
  FileSearch,
  UserCheck,
  MapPin,
  Bell,
  Lock,
  ExternalLink,
  Activity,
  Zap,
  Database,
  RefreshCw,
  ScrollText,
  AlertCircle,
  Info,
  AlertTriangle,
  BarChart3,
  Download,
  UserPlus,
  Search,
  TrendingUp,
} from "lucide-react";
import type { Tenant, TenantSettings, TenantStats } from "@/types/tenant.types";
import {
  getTenantById,
  getTenantSettings,
  getTenantStats,
  getTenantAuditLogs,
  getTenantUsers,
  getTenantAnalytics,
  getTenantRoles,
  updateTenantUserStatus,
  inviteTenantUser,
  exportTenantData,
  activateTenant,
  suspendTenant,
  regenerateApiKey,
  type TenantUser,
  type TenantAnalytics,
} from "@/actions/tenant.actions";
import { toast } from "sonner";
import LoadingOverlay from "@/components/layout/LoadingOverlay";
import ConfirmationModal from "@/components/common/ConfirmationModal";

export default function TenantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isRegeneratingKey, setIsRegeneratingKey] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "analytics" | "export">("overview");

  // Users tab state
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [roles, setRoles] = useState<{ id: string; roleName: string }[]>([]);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  // Analytics tab state
  const [analytics, setAnalytics] = useState<TenantAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState("last_7_days");

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"json" | "csv" | "pdf">("json");

  useEffect(() => {
    const fetchTenant = async () => {
      setIsLoading(true);
      try {
        const response = await getTenantById(tenantId);
        if (response.success && response.data) {
          setTenant(response.data);

          setIsLoadingSettings(true);
          // Fetch settings and stats in parallel
          const [settingsResponse, statsResponse] = await Promise.all([
            getTenantSettings(tenantId),
            getTenantStats(tenantId),
          ]);

          if (settingsResponse.success && settingsResponse.data) {
            setSettings(settingsResponse.data);
          }
          if (statsResponse.success && statsResponse.data) {
            setStats(statsResponse.data);
          }
          setIsLoadingSettings(false);

          // Fetch audit logs
          setIsLoadingAuditLogs(true);
          const auditResponse = await getTenantAuditLogs(tenantId, { limit: 5 });
          if (auditResponse.success && auditResponse.data) {
            setAuditLogs(auditResponse.data.logs);
          }
          setIsLoadingAuditLogs(false);
        } else {
          toast.error("Tenant not found");
          router.push("/tenants");
        }
      } catch (error) {
        console.error("Error fetching tenant:", error);
        toast.error("Failed to load tenant");
      } finally {
        setIsLoading(false);
      }
    };

    if (tenantId) {
      fetchTenant();
    }
  }, [tenantId, router]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleToggleStatus = () => {
    if (!tenant) return;
    setShowConfirmModal(true);
  };

  const handleConfirmToggle = async () => {
    if (!tenant) return;

    const isSuspended =
      tenant.status === "suspended" || tenant.status === "inactive";
    const actionType = isSuspended ? "activate" : "suspend";

    setIsTogglingStatus(true);
    try {
      const response = isSuspended
        ? await activateTenant(tenant.id)
        : await suspendTenant(tenant.id);

      if (response.success && response.data) {
        setTenant(response.data);
        toast.success(`Tenant ${actionType}d successfully`);
      } else {
        toast.error(response.message || `Failed to ${actionType} tenant`);
      }
    } catch (error) {
      toast.error(`An error occurred while trying to ${actionType} tenant.`);
    } finally {
      setIsTogglingStatus(false);
      setShowConfirmModal(false);
    }
  };

  const fetchAuditLogs = async () => {
    setIsLoadingAuditLogs(true);
    try {
      const response = await getTenantAuditLogs(tenantId, { limit: 5 });
      if (response.success && response.data) {
        setAuditLogs(response.data.logs);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setIsLoadingAuditLogs(false);
    }
  };

  const handleRegenerateApiKey = async () => {
    if (!tenant) return;

    setIsRegeneratingKey(true);
    try {
      const response = await regenerateApiKey(tenant.id);
      if (response.success && response.data) {
        setTenant({ ...tenant, apiKey: response.data.apiKey });
        toast.success("API key regenerated successfully");
        // Refresh audit logs to show the new entry
        fetchAuditLogs();
      } else {
        toast.error(response.message || "Failed to regenerate API key");
      }
    } catch (error) {
      toast.error("An error occurred while regenerating the API key.");
    } finally {
      setIsRegeneratingKey(false);
      setShowRegenerateModal(false);
    }
  };

  // Fetch users for the Users tab
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        getTenantUsers(tenantId, { limit: 50, search: userSearch }),
        getTenantRoles(tenantId),
      ]);
      if (usersResponse.success && usersResponse.data) {
        setUsers(usersResponse.data.users);
      }
      if (rolesResponse.success && rolesResponse.data) {
        setRoles(rolesResponse.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch analytics for the Analytics tab
  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const response = await getTenantAnalytics(tenantId, analyticsTimeRange);
      if (response.success && response.data) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Handle tab change
  useEffect(() => {
    if (activeTab === "users" && users.length === 0) {
      fetchUsers();
    } else if (activeTab === "analytics" && !analytics) {
      fetchAnalytics();
    }
  }, [activeTab]);

  // Handle user status toggle
  const handleToggleUserStatus = async (user: TenantUser) => {
    setTogglingUserId(user.id);
    const newStatus = user.status === "active" ? "suspended" : "active";
    try {
      const response = await updateTenantUserStatus(tenantId, user.id, newStatus as "active" | "suspended");
      if (response.success) {
        setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
        toast.success(`User ${newStatus === "active" ? "activated" : "suspended"}`);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Failed to update user status");
    } finally {
      setTogglingUserId(null);
    }
  };

  // Handle invite user
  const handleInviteUser = async (data: { email: string; fullName: string; roleId: string }) => {
    try {
      const response = await inviteTenantUser(tenantId, data);
      if (response.success && response.data) {
        setUsers([response.data, ...users]);
        setShowInviteModal(false);
        toast.success("User invited successfully");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Failed to invite user");
    }
  };

  // Handle data export
  const handleExport = async (sections: string[]) => {
    setIsExporting(true);
    try {
      const response = await exportTenantData(tenantId, {
        format: exportFormat,
        sections,
        includeUsers: true,
        includeAuditLogs: true,
        includeSettings: true,
      });
      if (response.success) {
        toast.success("Export started. You will be notified when it's ready.");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Failed to start export");
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const normalizedStatus = status?.toLowerCase?.() || "";
    if (normalizedStatus === "active") {
      return {
        bg: "bg-green-500",
        text: "text-green-700 dark:text-green-300",
        badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        dot: "bg-green-500",
      };
    }
    if (normalizedStatus === "suspended") {
      return {
        bg: "bg-red-500",
        text: "text-red-700 dark:text-red-300",
        badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        dot: "bg-red-500",
      };
    }
    return {
      bg: "bg-yellow-500",
      text: "text-yellow-700 dark:text-yellow-300",
      badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      dot: "bg-yellow-500",
    };
  };

  if (isLoading) {
    return (
      <div className="relative h-96 w-full">
        <LoadingOverlay loadingText="Loading tenant details..." />
      </div>
    );
  }

  if (!tenant) {
    return null;
  }

  const isSuspended =
    tenant.status === "suspended" || tenant.status === "inactive";
  const statusConfig = getStatusConfig(tenant.status);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Colored accent bar */}
        <div className={`h-1 ${statusConfig.bg}`} />

        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left side - Tenant info */}
            <div className="flex items-start gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center rounded-lg border border-border bg-muted/50 p-2.5 text-muted-foreground transition-colors hover:bg-muted cursor-pointer mt-1"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#164e87] to-[#1a5a9e] text-white text-2xl font-bold shadow-lg">
                  {tenant.name.charAt(0).toUpperCase()}
                </div>

                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-foreground">
                      {tenant.name}
                    </h1>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusConfig.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                      {tenant.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Globe size={14} />
                      {tenant.subdomain}.vesant.ai
                    </span>
                    {tenant.industry && (
                      <span className="flex items-center gap-1.5">
                        <Building2 size={14} />
                        {tenant.industry}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3 lg:ml-auto">
              <button
                onClick={handleToggleStatus}
                disabled={isTogglingStatus}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all cursor-pointer disabled:opacity-60 ${
                  isSuspended
                    ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                    : "border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
                }`}
              >
                {isTogglingStatus ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSuspended ? (
                  <PlayCircle size={18} />
                ) : (
                  <Power size={18} />
                )}
                {isSuspended ? "Activate" : "Suspend"}
              </button>

              <button
                onClick={() => router.push(`/tenants/${tenant.id}/edit`)}
                className="flex items-center gap-2 rounded-lg bg-[#164e87] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#133f6d] hover:shadow-md cursor-pointer"
              >
                <Pencil size={16} />
                Edit Tenant
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-1.5">
        <div className="flex gap-1">
          {[
            { id: "overview" as const, label: "Overview", icon: <Building2 size={16} /> },
            { id: "users" as const, label: "Users", icon: <Users size={16} /> },
            { id: "analytics" as const, label: "Analytics", icon: <BarChart3 size={16} /> },
            { id: "export" as const, label: "Export", icon: <Download size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#164e87] text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={20} />}
          label="Total Users"
          value={stats?.totalUsers?.toString() ?? "-"}
          color="blue"
        />
        <StatCard
          icon={<Activity size={20} />}
          label="API Calls Today"
          value={stats?.apiCallsToday?.toLocaleString() ?? "-"}
          color="green"
        />
        <StatCard
          icon={<Zap size={20} />}
          label="Active Users"
          value={stats?.activeUsers?.toString() ?? "-"}
          color="purple"
        />
        <StatCard
          icon={<Database size={20} />}
          label="Data Retention"
          value={`${settings?.dataRetentionDays ?? 2555} days`}
          color="orange"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Organization & API */}
        <div className="xl:col-span-1 space-y-6">
          {/* Organization Details */}
          <div className="bg-card rounded-xl border border-border shadow-sm">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Building2 size={18} className="text-[#164e87]" />
                Organization Details
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <DetailRow
                label="Tenant ID"
                value={tenant.id}
                mono
                copyable
                onCopy={() => copyToClipboard(tenant.id, "id")}
                copied={copiedField === "id"}
              />
              <DetailRow
                label="Subdomain"
                value={`${tenant.subdomain}.vesant.ai`}
                link={`https://${tenant.subdomain}.vesant.ai`}
              />
              {tenant.industry && (
                <DetailRow label="Industry" value={tenant.industry} />
              )}
              <DetailRow
                label="Created"
                value={
                  tenant.createdAt
                    ? new Date(tenant.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "-"
                }
              />
              {tenant.updatedAt && (
                <DetailRow
                  label="Last Updated"
                  value={new Date(tenant.updatedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                />
              )}
            </div>
          </div>

          {/* API Credentials */}
          {tenant.apiKey && (
            <div className="bg-card rounded-xl border border-border shadow-sm">
              <div className="p-5 border-b border-border">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Key size={18} className="text-[#164e87]" />
                  API Credentials
                </h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="rounded-lg bg-muted/50 p-4 border border-border">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        API Key
                      </p>
                      <p className="font-mono text-sm text-foreground truncate">
                        {tenant.apiKey.substring(0, 20)}...
                        {tenant.apiKey.substring(tenant.apiKey.length - 4)}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(tenant.apiKey!, "apiKey")}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                        copiedField === "apiKey"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-card border border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {copiedField === "apiKey" ? (
                        <>
                          <Check size={14} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowRegenerateModal(true)}
                  disabled={isRegeneratingKey}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2.5 text-sm font-medium text-yellow-700 transition-all hover:bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30 cursor-pointer disabled:opacity-60"
                >
                  {isRegeneratingKey ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  Regenerate API Key
                </button>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-card rounded-xl border border-border shadow-sm">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <ScrollText size={18} className="text-[#164e87]" />
                Recent Activity
              </h2>
            </div>
            <div className="p-5">
              {isLoadingAuditLogs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : auditLogs.length > 0 ? (
                <div className="space-y-3">
                  {auditLogs.map((log, index) => (
                    <AuditLogItem key={log.id || index} log={log} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <ScrollText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Configuration */}
        <div className="xl:col-span-2 space-y-6">
          {isLoadingSettings ? (
            <div className="bg-card rounded-xl border border-border shadow-sm">
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </div>
          ) : settings ? (
            <>
              {/* Enabled Features Card */}
              <div className="bg-card rounded-xl border border-border shadow-sm">
                <div className="p-5 border-b border-border">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Zap size={18} className="text-[#164e87]" />
                    Enabled Features
                  </h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <FeatureCard label="AML Screening" enabled={settings.enableAmlScreening} icon={<FileSearch size={18} />} />
                    <FeatureCard label="KYC Verification" enabled={settings.enableKycVerification} icon={<UserCheck size={18} />} />
                    <FeatureCard label="Geolocation" enabled={settings.enableGeolocation} icon={<MapPin size={18} />} />
                    <FeatureCard label="Fraud Detection" enabled={settings.enableFraudDetection} icon={<Shield size={18} />} />
                    <FeatureCard label="GPT Query" enabled={settings.enableGptQuery} icon={<Zap size={18} />} premium />
                    <FeatureCard label="Email Alerts" enabled={settings.enableEmailNotifications} icon={<Bell size={18} />} />
                    <FeatureCard label="SMS Alerts" enabled={settings.enableSmsNotifications} icon={<Bell size={18} />} />
                  </div>
                </div>
              </div>

              {/* Security & Access Card */}
              <div className="bg-card rounded-xl border border-border shadow-sm">
                <div className="p-5 border-b border-border">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Shield size={18} className="text-[#164e87]" />
                    Security & Access
                  </h2>
                </div>
                <div className="p-5 space-y-6">
                  {/* MFA & Session */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <ConfigCard
                      label="Multi-Factor Auth"
                      value={settings.enableMfa ? "Enabled" : "Disabled"}
                      icon={<Lock size={16} />}
                      status={settings.enableMfa ? "success" : "warning"}
                    />
                    <ConfigCard
                      label="Max Login Attempts"
                      value={String(settings.maxLoginAttempts ?? 5)}
                      icon={<Shield size={16} />}
                    />
                    <ConfigCard
                      label="Session Timeout"
                      value={`${settings.sessionTimeout ?? 60} min`}
                      icon={<Clock size={16} />}
                    />
                    <ConfigCard
                      label="Lockout Duration"
                      value={`${settings.accountLockoutDuration ?? 15} min`}
                      icon={<Lock size={16} />}
                    />
                  </div>

                  {/* Password Policy */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Key size={14} />
                      Password Policy
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      <PolicyItem label="Min Length" value={`${settings.passwordMinLength ?? 8} chars`} />
                      <PolicyItem label="Uppercase" value={settings.passwordRequireUpper ? "Required" : "Optional"} enabled={settings.passwordRequireUpper} />
                      <PolicyItem label="Lowercase" value={settings.passwordRequireLower ? "Required" : "Optional"} enabled={settings.passwordRequireLower} />
                      <PolicyItem label="Numbers" value={settings.passwordRequireNumber ? "Required" : "Optional"} enabled={settings.passwordRequireNumber} />
                      <PolicyItem label="Expiry" value={settings.passwordExpiryDays ? `${settings.passwordExpiryDays} days` : "Never"} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance Features */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AML Screening */}
                <div className="bg-card rounded-xl border border-border shadow-sm">
                  <div className="p-5 border-b border-border">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                      <FileSearch size={18} className="text-[#164e87]" />
                      AML Screening
                    </h2>
                  </div>
                  <div className="p-5">
                    {settings.enableAmlScreening ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <ConfigCard
                            label="Auto-Screen"
                            value={settings.amlSettings?.autoScreenOnboarding ? "Enabled" : "Disabled"}
                            status={settings.amlSettings?.autoScreenOnboarding ? "success" : "neutral"}
                            compact
                          />
                          <ConfigCard
                            label="Match Score"
                            value={`${settings.amlSettings?.matchScore ?? 80}%`}
                            compact
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <ConfigCard
                            label="Fuzzy Match"
                            value={settings.amlSettings?.enableFuzzyMatch ? "Enabled" : "Disabled"}
                            status={settings.amlSettings?.enableFuzzyMatch ? "success" : "neutral"}
                            compact
                          />
                          <ConfigCard
                            label="Countries"
                            value={`${settings.amlSettings?.countries?.length ?? 0} selected`}
                            compact
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <FileSearch className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Not enabled</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* KYC Verification */}
                <div className="bg-card rounded-xl border border-border shadow-sm">
                  <div className="p-5 border-b border-border">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                      <UserCheck size={18} className="text-[#164e87]" />
                      KYC Verification
                    </h2>
                  </div>
                  <div className="p-5">
                    {settings.enableKycVerification ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <ConfigCard
                            label="Document"
                            value={settings.kycConfig?.isDocumentVerificationRequired ? "Required" : "Optional"}
                            status={settings.kycConfig?.isDocumentVerificationRequired ? "success" : "neutral"}
                            compact
                          />
                          <ConfigCard
                            label="Face"
                            value={settings.kycConfig?.isFaceVerificationRequired ? "Required" : "Optional"}
                            status={settings.kycConfig?.isFaceVerificationRequired ? "success" : "neutral"}
                            compact
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <ConfigCard
                            label="Address"
                            value={settings.kycConfig?.isAddressVerificationRequired ? "Required" : "Optional"}
                            status={settings.kycConfig?.isAddressVerificationRequired ? "success" : "neutral"}
                            compact
                          />
                          <ConfigCard
                            label="Min Age"
                            value={settings.kycConfig?.minAge ? `${settings.kycConfig.minAge} years` : "Not set"}
                            compact
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Not enabled</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Geolocation */}
                <div className="bg-card rounded-xl border border-border shadow-sm">
                  <div className="p-5 border-b border-border">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                      <MapPin size={18} className="text-[#164e87]" />
                      Geolocation
                    </h2>
                  </div>
                  <div className="p-5">
                    {settings.enableGeolocation ? (
                      <div className="space-y-3">
                        <ConfigCard
                          label="Provider"
                          value={settings.geolocationConfig?.provider?.toUpperCase() ?? "GEOIP2"}
                          compact
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <ConfigCard
                            label="VPN Detection"
                            value={settings.geolocationConfig?.enableVpnCheck ? "Enabled" : "Disabled"}
                            status={settings.geolocationConfig?.enableVpnCheck ? "success" : "neutral"}
                            compact
                          />
                          <ConfigCard
                            label="Risk Scoring"
                            value={settings.geolocationConfig?.enableRiskScore ? "Enabled" : "Disabled"}
                            status={settings.geolocationConfig?.enableRiskScore ? "success" : "neutral"}
                            compact
                          />
                        </div>
                        <ConfigCard
                          label="Webhook"
                          value={settings.geolocationConfig?.notificationWebhookUrl ? "Configured" : "Not configured"}
                          status={settings.geolocationConfig?.notificationWebhookUrl ? "success" : "neutral"}
                          compact
                        />
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Not enabled</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Data & API */}
                <div className="bg-card rounded-xl border border-border shadow-sm">
                  <div className="p-5 border-b border-border">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                      <Database size={18} className="text-[#164e87]" />
                      Data & API
                    </h2>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 gap-3">
                      <ConfigCard
                        label="Audit Log Retention"
                        value={`${settings.auditLogRetentionDays ?? 365} days`}
                        icon={<Clock size={16} />}
                        compact
                      />
                      <ConfigCard
                        label="Data Retention"
                        value={`${settings.dataRetentionDays ?? 2555} days`}
                        icon={<Database size={16} />}
                        compact
                      />
                      <ConfigCard
                        label="API Rate Limit"
                        value={settings.apiRateLimitPerMinute ? `${settings.apiRateLimitPerMinute}/min` : "Default"}
                        icon={<Activity size={16} />}
                        compact
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-card rounded-xl border border-border shadow-sm p-8 text-center">
              <div className="rounded-lg border border-dashed border-border p-8 text-muted-foreground">
                No settings data available
              </div>
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* Users Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#164e87]/20"
                />
              </div>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 rounded-lg bg-[#164e87] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#133f6d] cursor-pointer"
            >
              <UserPlus size={16} />
              Invite User
            </button>
          </div>

          {/* Users List */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : users.length > 0 ? (
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.filter(u =>
                    !userSearch ||
                    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                    u.fullName?.toLowerCase().includes(userSearch.toLowerCase())
                  ).map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#164e87] to-[#1a5a9e] text-white text-sm font-bold">
                            {user.fullName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.fullName || "-"}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {user.roleName || "User"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-green-500" : "bg-red-500"}`} />
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          disabled={togglingUserId === user.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-60 ${
                            user.status === "active"
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                          }`}
                        >
                          {togglingUserId === user.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : user.status === "active" ? (
                            "Suspend"
                          ) : (
                            "Activate"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p className="text-lg font-medium">No users found</p>
                <p className="text-sm">Invite users to get started</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Time Range Selector */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Usage Analytics</h2>
            <select
              value={analyticsTimeRange}
              onChange={(e) => {
                setAnalyticsTimeRange(e.target.value);
                fetchAnalytics();
              }}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#164e87]/20"
            >
              <option value="last_24_hours">Last 24 Hours</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_90_days">Last 90 Days</option>
            </select>
          </div>

          {isLoadingAnalytics ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : analytics ? (
            <>
              {/* Analytics Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={<Activity size={20} />}
                  label="Total API Calls"
                  value={analytics.totalApiCalls?.toLocaleString() || "0"}
                  color="blue"
                />
                <StatCard
                  icon={<AlertTriangle size={20} />}
                  label="Error Rate"
                  value={`${(analytics.errorRate * 100).toFixed(2)}%`}
                  color={analytics.errorRate > 0.05 ? "orange" : "green"}
                />
                <StatCard
                  icon={<Clock size={20} />}
                  label="Avg Response Time"
                  value={`${analytics.avgResponseTime?.toFixed(0) || 0}ms`}
                  color="purple"
                />
                <StatCard
                  icon={<TrendingUp size={20} />}
                  label="Data Points"
                  value={analytics.apiCallsTimeSeries?.length?.toString() || "0"}
                  color="green"
                />
              </div>

              {/* API Calls Chart Placeholder */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 size={18} className="text-[#164e87]" />
                  API Calls Over Time
                </h3>
                <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg bg-muted/30">
                  {analytics.apiCallsTimeSeries?.length > 0 ? (
                    <div className="w-full h-full p-4">
                      <div className="flex items-end justify-around h-full gap-1">
                        {analytics.apiCallsTimeSeries.slice(-20).map((point, i) => (
                          <div
                            key={i}
                            className="bg-[#164e87] rounded-t w-full max-w-8 hover:bg-[#1a5a9e] transition-colors"
                            style={{
                              height: `${Math.max(10, (point.value / Math.max(...analytics.apiCallsTimeSeries.map(p => p.value))) * 100)}%`,
                            }}
                            title={`${point.value} calls`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No data available for this period</p>
                  )}
                </div>
              </div>

              {/* Top Endpoints */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-[#164e87]" />
                  Most Used Endpoints
                </h3>
                {analytics.topEndpoints?.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topEndpoints.slice(0, 5).map((endpoint, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <span className="font-mono text-sm text-foreground">{endpoint.endpoint}</span>
                        <span className="text-sm font-medium text-muted-foreground">{endpoint.count.toLocaleString()} calls</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No endpoint data available</p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium">No analytics data</p>
              <p className="text-sm">Analytics data will appear once the tenant starts using the API</p>
            </div>
          )}
        </div>
      )}

      {/* Export Tab */}
      {activeTab === "export" && (
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Download size={20} className="text-[#164e87]" />
              Export Tenant Data
            </h2>

            <p className="text-muted-foreground mb-6">
              Export tenant data for compliance audits, backup purposes, or GDPR data requests.
              The export will include configuration, users, and activity logs.
            </p>

            {/* Export Format */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">Export Format</label>
              <div className="flex gap-3">
                {(["json", "csv", "pdf"] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => setExportFormat(format)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      exportFormat === format
                        ? "bg-[#164e87] text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <ExportOptionCard
                icon={<Building2 size={24} />}
                title="Configuration"
                description="Tenant settings, features, and security policies"
                onClick={() => handleExport(["configuration"])}
                isLoading={isExporting}
              />
              <ExportOptionCard
                icon={<Users size={24} />}
                title="Users & Roles"
                description="All user accounts, roles, and permissions"
                onClick={() => handleExport(["users"])}
                isLoading={isExporting}
              />
              <ExportOptionCard
                icon={<ScrollText size={24} />}
                title="Audit Logs"
                description="Complete activity and audit trail"
                onClick={() => handleExport(["audit_logs"])}
                isLoading={isExporting}
              />
            </div>

            {/* Full Export Button */}
            <button
              onClick={() => handleExport(["configuration", "users", "audit_logs"])}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#164e87] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#133f6d] cursor-pointer disabled:opacity-60"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download size={18} />
              )}
              Export All Data
            </button>
          </div>

          {/* GDPR Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800 dark:text-blue-300">GDPR Compliance</h3>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  This export feature helps you comply with data subject access requests (DSARs)
                  and right to data portability requirements under GDPR and similar regulations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <InviteUserModal
          roles={roles}
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteUser}
        />
      )}

      {/* Confirmation Modal */}
      {tenant && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmToggle}
          isLoading={isTogglingStatus}
          title={
            tenant.status === "suspended" || tenant.status === "inactive"
              ? `Activate "${tenant.name}"?`
              : `Suspend "${tenant.name}"?`
          }
          description={
            tenant.status === "suspended" || tenant.status === "inactive"
              ? "This will restore access to the tenant and all its users."
              : "This will temporarily disable access to the tenant and all its users."
          }
          confirmLabel={
            tenant.status === "suspended" || tenant.status === "inactive"
              ? "Activate"
              : "Suspend"
          }
          loadingLabel={
            tenant.status === "suspended" || tenant.status === "inactive"
              ? "Activating..."
              : "Suspending..."
          }
          variant={
            tenant.status === "suspended" || tenant.status === "inactive"
              ? "success"
              : "warning"
          }
          icon={
            tenant.status === "suspended" || tenant.status === "inactive" ? (
              <PlayCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            ) : (
              <Power className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            )
          }
        />
      )}

      {/* API Key Regeneration Modal */}
      <ConfirmationModal
        isOpen={showRegenerateModal}
        onCancel={() => setShowRegenerateModal(false)}
        onConfirm={handleRegenerateApiKey}
        isLoading={isRegeneratingKey}
        title="Regenerate API Key?"
        description="This will invalidate the current API key immediately. Any applications using the old key will stop working. Make sure to update your integrations with the new key."
        confirmLabel="Regenerate"
        loadingLabel="Regenerating..."
        variant="warning"
        icon={<RefreshCw className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />}
      />
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${colorStyles[color]}`}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  copyable,
  onCopy,
  copied,
  link,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
  onCopy?: () => void;
  copied?: boolean;
  link?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#164e87] hover:underline flex items-center gap-1 truncate"
          >
            {value}
            <ExternalLink size={12} />
          </a>
        ) : (
          <span className={`text-sm font-medium text-foreground truncate ${mono ? "font-mono text-xs" : ""}`}>
            {value}
          </span>
        )}
        {copyable && onCopy && (
          <button onClick={onCopy} className="text-muted-foreground hover:text-foreground shrink-0">
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

function FeatureCard({
  label,
  enabled,
  icon,
  premium,
}: {
  label: string;
  enabled?: boolean;
  icon: React.ReactNode;
  premium?: boolean;
}) {
  return (
    <div
      className={`relative rounded-xl border p-4 transition-all ${
        enabled
          ? premium
            ? "border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-900/20"
            : "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20"
          : "border-border bg-muted/30"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${
            enabled
              ? premium
                ? "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400"
                : "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{label}</p>
          <p className={`text-xs ${enabled ? (premium ? "text-purple-600 dark:text-purple-400" : "text-green-600 dark:text-green-400") : "text-muted-foreground"}`}>
            {enabled ? "Enabled" : "Disabled"}
          </p>
        </div>
        {enabled && (
          <CheckCircle
            size={16}
            className={premium ? "text-purple-500" : "text-green-500"}
          />
        )}
      </div>
      {premium && (
        <span className="absolute top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-200 text-purple-700 dark:bg-purple-800 dark:text-purple-300">
          PRO
        </span>
      )}
    </div>
  );
}

function ConfigCard({
  label,
  value,
  icon,
  status,
  compact,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  status?: "success" | "warning" | "neutral";
  compact?: boolean;
}) {
  const statusColors = {
    success: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    neutral: "text-muted-foreground",
  };

  return (
    <div className={`rounded-xl border border-border bg-muted/30 ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="p-1.5 rounded-lg bg-card text-muted-foreground">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className={`${compact ? "text-sm" : "text-base"} font-semibold ${status ? statusColors[status] : "text-foreground"}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function PolicyItem({
  label,
  value,
  enabled,
}: {
  label: string;
  value: string;
  enabled?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-sm font-medium ${enabled === true ? "text-green-600 dark:text-green-400" : enabled === false ? "text-muted-foreground" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function AuditLogItem({ log }: { log: any }) {
  const getSeverityConfig = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "error":
      case "critical":
        return {
          icon: <AlertCircle size={14} />,
          bg: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
        };
      case "warning":
        return {
          icon: <AlertTriangle size={14} />,
          bg: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
        };
      default:
        return {
          icon: <Info size={14} />,
          bg: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
        };
    }
  };

  const severityConfig = getSeverityConfig(log.severity);
  const actionDisplay = log.action?.replace(/_/g, " ") || "Unknown action";

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className={`p-1.5 rounded-lg ${severityConfig.bg}`}>
        {severityConfig.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground capitalize truncate">
          {actionDisplay}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {log.username || "System"} • {log.resource || log.serviceName}
        </p>
      </div>
      <div className="text-xs text-muted-foreground shrink-0">
        {log.createdAt
          ? new Date(log.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-"}
      </div>
    </div>
  );
}

function ExportOptionCard({
  icon,
  title,
  description,
  onClick,
  isLoading,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  isLoading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="flex flex-col items-center text-center p-6 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer disabled:opacity-60 group"
    >
      <div className="p-3 rounded-xl bg-[#164e87]/10 text-[#164e87] mb-4 group-hover:bg-[#164e87]/20 transition-colors">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </button>
  );
}

function InviteUserModal({
  roles,
  onClose,
  onInvite,
}: {
  roles: { id: string; roleName: string }[];
  onClose: () => void;
  onInvite: (data: { email: string; fullName: string; roleId: string }) => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleId, setRoleId] = useState(roles[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !roleId) return;

    setIsSubmitting(true);
    await onInvite({ email, fullName, roleId });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl border border-border shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Invite New User</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#164e87]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#164e87]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Role *
            </label>
            <select
              required
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#164e87]/20"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.roleName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !email || !roleId}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#164e87] text-sm font-semibold text-white hover:bg-[#133f6d] cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Send Invite"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
