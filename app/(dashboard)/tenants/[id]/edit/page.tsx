"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Loader2,
  Building2,
  Shield,
  Save,
  MapPin,
  UserCheck,
  Bell,
  FileSearch,
  Key,
  Clock,
  Lock,
  Globe,
  AlertTriangle,
  Plus,
  X,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  getTenantById,
  updateTenant,
  getTenantSettings,
  updateTenantSettings,
} from "@/actions/tenant.actions";
import type {
  Tenant,
  TenantSettings,
  AMLConfig,
  KYCConfig,
  GeolocationConfig,
  KYCDocumentType,
} from "@/types/tenant.types";
import {
  AML_FILTER_OPTIONS,
  AML_COUNTRY_OPTIONS,
  KYC_DOCUMENT_OPTIONS,
} from "@/types/tenant.types";
import LoadingOverlay from "@/components/layout/LoadingOverlay";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  industry: z.string().optional(),
  status: z.enum(["active", "suspended", "inactive"]),
});

type FormValues = z.infer<typeof formSchema>;

const INDUSTRIES = [
  "Financial Services",
  "Banking",
  "Insurance",
  "Healthcare",
  "Technology",
  "Retail",
  "Manufacturing",
  "Real Estate",
  "Legal",
  "Government",
  "Education",
  "Other",
];

type TabType = "details" | "security" | "aml" | "kyc" | "geolocation" | "notifications";

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "details", label: "Organization", icon: Building2 },
  { id: "security", label: "Security", icon: Shield },
  { id: "aml", label: "AML Screening", icon: FileSearch },
  { id: "kyc", label: "KYC Verification", icon: UserCheck },
  { id: "geolocation", label: "Geolocation", icon: MapPin },
  { id: "notifications", label: "Notifications & API", icon: Bell },
];

export default function EditTenantPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("details");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const currentStatus = watch("status");

  useEffect(() => {
    const fetchTenant = async () => {
      setIsLoading(true);
      try {
        const response = await getTenantById(tenantId);
        if (response.success && response.data) {
          setTenant(response.data);
          reset({
            name: response.data.name,
            industry: response.data.industry || "",
            status: response.data.status,
          });

          const settingsResponse = await getTenantSettings(tenantId);
          if (settingsResponse.success && settingsResponse.data) {
            setSettings(settingsResponse.data);
          }
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
  }, [tenantId, router, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!tenant) return;

    try {
      const response = await updateTenant({
        id: tenant.id,
        name: data.name,
        industry: data.industry,
        status: data.status,
      });

      if (response.success) {
        toast.success("Tenant updated successfully");
        router.push(`/tenants/${tenant.id}`);
      } else {
        toast.error(response.message || "Failed to update tenant");
      }
    } catch (error) {
      console.error("Error updating tenant:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const handleSaveSettings = async (newSettings: Partial<TenantSettings>) => {
    if (!tenant) return;

    try {
      const response = await updateTenantSettings(tenant.id, newSettings);
      if (response.success && response.data) {
        setSettings(response.data);
        toast.success("Settings updated successfully");
      } else {
        toast.error(response.message || "Failed to update settings");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  if (isLoading) {
    return (
      <div className="relative h-96 w-full">
        <LoadingOverlay loadingText="Loading tenant..." />
      </div>
    );
  }

  if (!tenant) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center rounded-lg border border-border bg-muted/50 p-2.5 text-muted-foreground transition-colors hover:bg-muted cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#164e87] to-[#1a5a9e] text-white text-xl font-bold shadow-lg">
                {tenant.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Edit Tenant
                </h1>
                <p className="text-sm text-muted-foreground">
                  Configure settings for{" "}
                  <span className="font-medium">{tenant.name}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm lg:ml-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">ID:</span>
              <span className="font-mono text-xs text-foreground">{tenant.id.slice(0, 16)}...</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
              <Globe size={14} className="text-muted-foreground" />
              <span className="text-foreground">{tenant.subdomain}.vesant.ai</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#164e87] text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Details Tab */}
      {activeTab === "details" && (
        <OrganizationDetailsTab
          register={register}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
          errors={errors}
          isSubmitting={isSubmitting}
          isDirty={isDirty}
          currentStatus={currentStatus}
          router={router}
        />
      )}

      {/* Security Tab */}
      {activeTab === "security" && settings && (
        <SecuritySettingsTab settings={settings} onSave={handleSaveSettings} />
      )}

      {/* AML Tab */}
      {activeTab === "aml" && settings && (
        <AMLSettingsTab settings={settings} onSave={handleSaveSettings} />
      )}

      {/* KYC Tab */}
      {activeTab === "kyc" && settings && (
        <KYCSettingsTab settings={settings} onSave={handleSaveSettings} />
      )}

      {/* Geolocation Tab */}
      {activeTab === "geolocation" && settings && (
        <GeolocationSettingsTab settings={settings} onSave={handleSaveSettings} />
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && settings && (
        <NotificationsAPITab settings={settings} onSave={handleSaveSettings} />
      )}
    </div>
  );
}

// ============================================================================
// Organization Details Tab
// ============================================================================
function OrganizationDetailsTab({
  register,
  handleSubmit,
  onSubmit,
  errors,
  isSubmitting,
  isDirty,
  currentStatus,
  router,
}: {
  register: any;
  handleSubmit: any;
  onSubmit: any;
  errors: any;
  isSubmitting: boolean;
  isDirty: boolean;
  currentStatus: string;
  router: any;
}) {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">
          Organization Details
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("name")}
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-[#164e87] focus:outline-none focus:ring-1 focus:ring-[#164e87]"
            />
            {errors.name && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Industry
            </label>
            <select
              {...register("industry")}
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground focus:border-[#164e87] focus:outline-none focus:ring-1 focus:ring-[#164e87]"
            >
              <option value="">Select an industry</option>
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register("status")}
              className={`w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-1 ${
                currentStatus === "active"
                  ? "border-green-300 bg-green-50 text-green-800 focus:border-green-500 focus:ring-green-500 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300"
                  : currentStatus === "suspended"
                  ? "border-red-300 bg-red-50 text-red-800 focus:border-red-500 focus:ring-red-500 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300"
                  : "border-yellow-300 bg-yellow-50 text-yellow-800 focus:border-yellow-500 focus:ring-yellow-500 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300"
              }`}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/30 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="flex items-center gap-2 rounded-lg bg-[#164e87] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#133f6d] disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// Security Settings Tab
// ============================================================================
function SecuritySettingsTab({
  settings,
  onSave,
}: {
  settings: TenantSettings;
  onSave: (settings: Partial<TenantSettings>) => Promise<void>;
}) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key: keyof TenantSettings) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleChange = (key: keyof TenantSettings, value: number | boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(localSettings);
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Authentication */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground flex items-center gap-2">
          <Shield size={20} className="text-[#164e87]" />
          Authentication & Access
        </h2>

        <div className="space-y-6">
          <ToggleSetting
            label="Multi-Factor Authentication"
            description="Require MFA for all users in this tenant"
            enabled={localSettings.enableMfa ?? false}
            onToggle={() => handleToggle("enableMfa")}
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <NumberSetting
              label="Max Login Attempts"
              description="Before account lockout"
              value={localSettings.maxLoginAttempts ?? 5}
              onChange={(v) => handleChange("maxLoginAttempts", v)}
              min={1}
              max={100}
            />

            <NumberSetting
              label="Lockout Duration"
              description="Minutes"
              value={localSettings.accountLockoutDuration ?? 15}
              onChange={(v) => handleChange("accountLockoutDuration", v)}
              min={0}
              max={1440}
            />

            <NumberSetting
              label="Session Timeout"
              description="Minutes"
              value={localSettings.sessionTimeout ?? 60}
              onChange={(v) => handleChange("sessionTimeout", v)}
              min={1}
              max={43200}
            />
          </div>
        </div>
      </div>

      {/* Token Settings */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground flex items-center gap-2">
          <Key size={20} className="text-[#164e87]" />
          Token Configuration
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <NumberSetting
            label="Access Token TTL"
            description="Seconds (60-86400)"
            value={localSettings.accessTokenTtl ?? 3600}
            onChange={(v) => handleChange("accessTokenTtl", v)}
            min={60}
            max={86400}
          />

          <NumberSetting
            label="Refresh Token TTL"
            description="Seconds (3600-31536000)"
            value={localSettings.refreshTokenTtl ?? 604800}
            onChange={(v) => handleChange("refreshTokenTtl", v)}
            min={3600}
            max={31536000}
          />
        </div>
      </div>

      {/* Password Policy */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground flex items-center gap-2">
          <Lock size={20} className="text-[#164e87]" />
          Password Policy
        </h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <NumberSetting
              label="Minimum Length"
              description="Characters (6-128)"
              value={localSettings.passwordMinLength ?? 8}
              onChange={(v) => handleChange("passwordMinLength", v)}
              min={6}
              max={128}
            />

            <NumberSetting
              label="Password Expiry"
              description="Days (0 = never)"
              value={localSettings.passwordExpiryDays ?? 90}
              onChange={(v) => handleChange("passwordExpiryDays", v)}
              min={0}
              max={365}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ToggleSetting
              label="Uppercase"
              description="A-Z required"
              enabled={localSettings.passwordRequireUpper ?? true}
              onToggle={() => handleToggle("passwordRequireUpper")}
              compact
            />
            <ToggleSetting
              label="Lowercase"
              description="a-z required"
              enabled={localSettings.passwordRequireLower ?? true}
              onToggle={() => handleToggle("passwordRequireLower")}
              compact
            />
            <ToggleSetting
              label="Number"
              description="0-9 required"
              enabled={localSettings.passwordRequireNumber ?? true}
              onToggle={() => handleToggle("passwordRequireNumber")}
              compact
            />
            <ToggleSetting
              label="Special"
              description="!@#$ required"
              enabled={localSettings.passwordRequireSpecial ?? true}
              onToggle={() => handleToggle("passwordRequireSpecial")}
              compact
            />
          </div>
        </div>
      </div>

      {/* Data Retention */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground flex items-center gap-2">
          <Clock size={20} className="text-[#164e87]" />
          Data Retention
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <NumberSetting
            label="Audit Log Retention"
            description="Days (1-3650)"
            value={localSettings.auditLogRetentionDays ?? 365}
            onChange={(v) => handleChange("auditLogRetentionDays", v)}
            min={1}
            max={3650}
          />

          <NumberSetting
            label="Data Retention"
            description="Days (1-3650)"
            value={localSettings.dataRetentionDays ?? 2555}
            onChange={(v) => handleChange("dataRetentionDays", v)}
            min={1}
            max={3650}
          />
        </div>
      </div>

      <SaveButton isSaving={isSaving} onSave={handleSave} />
    </div>
  );
}

// ============================================================================
// AML Settings Tab
// ============================================================================
function AMLSettingsTab({
  settings,
  onSave,
}: {
  settings: TenantSettings;
  onSave: (settings: Partial<TenantSettings>) => Promise<void>;
}) {
  const [localSettings, setLocalSettings] = useState<TenantSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);

  const amlConfig = localSettings.amlSettings || {};

  const updateAmlConfig = (updates: Partial<AMLConfig>) => {
    setLocalSettings((prev) => ({
      ...prev,
      amlSettings: {
        ...prev.amlSettings,
        ...updates,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({
      enableAmlScreening: localSettings.enableAmlScreening,
      amlSettings: localSettings.amlSettings,
    });
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Main Toggle */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSearch size={24} className="text-[#164e87]" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                AML Screening
              </h2>
              <p className="text-sm text-muted-foreground">
                Anti-Money Laundering screening for customers and transactions
              </p>
            </div>
          </div>
          <ToggleSwitch
            enabled={localSettings.enableAmlScreening ?? false}
            onToggle={() =>
              setLocalSettings((prev) => ({
                ...prev,
                enableAmlScreening: !prev.enableAmlScreening,
              }))
            }
          />
        </div>
      </div>

      {localSettings.enableAmlScreening && (
        <>
          {/* General Settings */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="mb-6 text-md font-semibold text-foreground">
              General Settings
            </h3>

            <div className="space-y-4">
              <ToggleSetting
                label="Auto-Screen on Onboarding"
                description="Automatically screen new customers during onboarding"
                enabled={amlConfig.autoScreenOnboarding ?? true}
                onToggle={() =>
                  updateAmlConfig({
                    autoScreenOnboarding: !amlConfig.autoScreenOnboarding,
                  })
                }
              />

              <ToggleSetting
                label="Fuzzy Matching"
                description="Enable fuzzy name matching for better detection"
                enabled={amlConfig.enableFuzzyMatch ?? true}
                onToggle={() =>
                  updateAmlConfig({
                    enableFuzzyMatch: !amlConfig.enableFuzzyMatch,
                  })
                }
              />

              <ToggleSetting
                label="Alias Search"
                description="Search aliases and AKAs"
                enabled={amlConfig.enableAliasSearch ?? true}
                onToggle={() =>
                  updateAmlConfig({
                    enableAliasSearch: !amlConfig.enableAliasSearch,
                  })
                }
              />

              <ToggleSetting
                label="RCA Search"
                description="Relative Case Analysis search"
                enabled={amlConfig.rcaSearch ?? false}
                onToggle={() =>
                  updateAmlConfig({ rcaSearch: !amlConfig.rcaSearch })
                }
              />
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Match Score Threshold (0-100)
              </label>
              <input
                type="number"
                value={amlConfig.matchScore ?? "80"}
                onChange={(e) => updateAmlConfig({ matchScore: e.target.value })}
                min={0}
                max={100}
                className="w-32 rounded-lg border border-border bg-card px-4 py-2 text-foreground focus:border-[#164e87] focus:outline-none focus:ring-1 focus:ring-[#164e87]"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Minimum score to flag a potential match
              </p>
            </div>
          </div>

          {/* Screening Filters */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="mb-4 text-md font-semibold text-foreground">
              Screening Filters
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Select which databases to screen against
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {AML_FILTER_OPTIONS.map((filter) => (
                <label
                  key={filter.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={(amlConfig.filters || []).includes(filter.value)}
                    onChange={(e) => {
                      const current = amlConfig.filters || [];
                      if (e.target.checked) {
                        updateAmlConfig({ filters: [...current, filter.value] });
                      } else {
                        updateAmlConfig({
                          filters: current.filter((f) => f !== filter.value),
                        });
                      }
                    }}
                    className="rounded border-border text-[#164e87] focus:ring-[#164e87]"
                  />
                  <span className="text-sm text-foreground">{filter.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Countries */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="mb-4 text-md font-semibold text-foreground">
              Target Countries
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Countries to include in screening
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {AML_COUNTRY_OPTIONS.map((country) => (
                <label
                  key={country.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={(amlConfig.countries || []).includes(country.value)}
                    onChange={(e) => {
                      const current = amlConfig.countries || [];
                      if (e.target.checked) {
                        updateAmlConfig({
                          countries: [...current, country.value],
                        });
                      } else {
                        updateAmlConfig({
                          countries: current.filter((c) => c !== country.value),
                        });
                      }
                    }}
                    className="rounded border-border text-[#164e87] focus:ring-[#164e87]"
                  />
                  <span className="text-sm text-foreground">{country.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Risk Thresholds */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="mb-4 text-md font-semibold text-foreground">
              Risk Thresholds
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Number of hits to trigger each risk level
            </p>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                  <AlertTriangle size={16} />
                  Critical
                </label>
                <input
                  type="number"
                  value={amlConfig.riskThresholds?.critical ?? 5}
                  onChange={(e) =>
                    updateAmlConfig({
                      riskThresholds: {
                        ...amlConfig.riskThresholds,
                        critical: parseInt(e.target.value) || 5,
                      },
                    })
                  }
                  min={1}
                  className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-foreground dark:border-red-800 dark:bg-red-900/20 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400">
                  <AlertTriangle size={16} />
                  High
                </label>
                <input
                  type="number"
                  value={amlConfig.riskThresholds?.high ?? 3}
                  onChange={(e) =>
                    updateAmlConfig({
                      riskThresholds: {
                        ...amlConfig.riskThresholds,
                        high: parseInt(e.target.value) || 3,
                      },
                    })
                  }
                  min={1}
                  className="w-full rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-foreground dark:border-orange-800 dark:bg-orange-900/20 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  <Info size={16} />
                  Medium
                </label>
                <input
                  type="number"
                  value={amlConfig.riskThresholds?.medium ?? 1}
                  onChange={(e) =>
                    updateAmlConfig({
                      riskThresholds: {
                        ...amlConfig.riskThresholds,
                        medium: parseInt(e.target.value) || 1,
                      },
                    })
                  }
                  min={1}
                  className="w-full rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-foreground dark:border-yellow-800 dark:bg-yellow-900/20 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                />
              </div>
            </div>
          </div>

          {/* Alert Settings */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="mb-4 text-md font-semibold text-foreground">
              Alert & Action Settings
            </h3>

            <div className="space-y-4">
              <ToggleSetting
                label="Create Case Automatically"
                description="Auto-create case for flagged customers"
                enabled={amlConfig.alertSettings?.createCase ?? true}
                onToggle={() =>
                  updateAmlConfig({
                    alertSettings: {
                      ...amlConfig.alertSettings,
                      createCase: !amlConfig.alertSettings?.createCase,
                    },
                  })
                }
              />

              <ToggleSetting
                label="Notify Compliance Team"
                description="Send notifications to compliance team"
                enabled={amlConfig.alertSettings?.notifyComplianceTeam ?? true}
                onToggle={() =>
                  updateAmlConfig({
                    alertSettings: {
                      ...amlConfig.alertSettings,
                      notifyComplianceTeam:
                        !amlConfig.alertSettings?.notifyComplianceTeam,
                    },
                  })
                }
              />

              <ToggleSetting
                label="Block Transactions"
                description="Block transactions for flagged customers"
                enabled={amlConfig.alertSettings?.blockTransaction ?? false}
                onToggle={() =>
                  updateAmlConfig({
                    alertSettings: {
                      ...amlConfig.alertSettings,
                      blockTransaction:
                        !amlConfig.alertSettings?.blockTransaction,
                    },
                  })
                }
              />

              <ToggleSetting
                label="Require Manual Review"
                description="Require manual review for all flagged entries"
                enabled={amlConfig.alertSettings?.requireManualReview ?? true}
                onToggle={() =>
                  updateAmlConfig({
                    alertSettings: {
                      ...amlConfig.alertSettings,
                      requireManualReview:
                        !amlConfig.alertSettings?.requireManualReview,
                    },
                  })
                }
              />
            </div>

            {/* Alert Recipients */}
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Alert Recipients
              </label>
              <EmailListInput
                emails={amlConfig.alertSettings?.alertRecipients || []}
                onChange={(emails) =>
                  updateAmlConfig({
                    alertSettings: {
                      ...amlConfig.alertSettings,
                      alertRecipients: emails,
                    },
                  })
                }
              />
            </div>
          </div>
        </>
      )}

      <SaveButton isSaving={isSaving} onSave={handleSave} />
    </div>
  );
}

// ============================================================================
// KYC Settings Tab
// ============================================================================
function KYCSettingsTab({
  settings,
  onSave,
}: {
  settings: TenantSettings;
  onSave: (settings: Partial<TenantSettings>) => Promise<void>;
}) {
  const [localSettings, setLocalSettings] = useState<TenantSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);

  const kycConfig = localSettings.kycConfig || {};

  const updateKycConfig = (updates: Partial<KYCConfig>) => {
    setLocalSettings((prev) => ({
      ...prev,
      kycConfig: {
        ...prev.kycConfig,
        ...updates,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({
      enableKycVerification: localSettings.enableKycVerification,
      kycConfig: localSettings.kycConfig,
    });
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Main Toggle */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCheck size={24} className="text-[#164e87]" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                KYC Verification
              </h2>
              <p className="text-sm text-muted-foreground">
                Know Your Customer identity verification settings
              </p>
            </div>
          </div>
          <ToggleSwitch
            enabled={localSettings.enableKycVerification ?? false}
            onToggle={() =>
              setLocalSettings((prev) => ({
                ...prev,
                enableKycVerification: !prev.enableKycVerification,
              }))
            }
          />
        </div>
      </div>

      {localSettings.enableKycVerification && (
        <>
          {/* Verification Requirements */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="mb-6 text-md font-semibold text-foreground">
              Verification Requirements
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ToggleSetting
                label="Document Verification"
                description="Require ID document verification"
                enabled={kycConfig.isDocumentVerificationRequired ?? true}
                onToggle={() =>
                  updateKycConfig({
                    isDocumentVerificationRequired:
                      !kycConfig.isDocumentVerificationRequired,
                  })
                }
              />

              <ToggleSetting
                label="Face Verification"
                description="Require face/selfie verification"
                enabled={kycConfig.isFaceVerificationRequired ?? true}
                onToggle={() =>
                  updateKycConfig({
                    isFaceVerificationRequired:
                      !kycConfig.isFaceVerificationRequired,
                  })
                }
              />

              <ToggleSetting
                label="Address Verification"
                description="Require proof of address"
                enabled={kycConfig.isAddressVerificationRequired ?? false}
                onToggle={() =>
                  updateKycConfig({
                    isAddressVerificationRequired:
                      !kycConfig.isAddressVerificationRequired,
                  })
                }
              />

              <ToggleSetting
                label="Age Verification"
                description="Verify age requirements"
                enabled={kycConfig.isAgeVerificationRequired ?? false}
                onToggle={() =>
                  updateKycConfig({
                    isAgeVerificationRequired:
                      !kycConfig.isAgeVerificationRequired,
                  })
                }
              />
            </div>
          </div>

          {/* Age Settings */}
          {kycConfig.isAgeVerificationRequired && (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <h3 className="mb-4 text-md font-semibold text-foreground">
                Age Requirements
              </h3>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <NumberSetting
                  label="Minimum Age"
                  description="Years"
                  value={kycConfig.minAge ?? 18}
                  onChange={(v) => updateKycConfig({ minAge: v })}
                  min={0}
                  max={100}
                />

                <NumberSetting
                  label="Maximum Age"
                  description="Years (0 = no limit)"
                  value={kycConfig.maxAge ?? 0}
                  onChange={(v) => updateKycConfig({ maxAge: v })}
                  min={0}
                  max={150}
                />
              </div>
            </div>
          )}

          {/* Document Settings */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="mb-4 text-md font-semibold text-foreground">
              Document Settings
            </h3>

            <div className="mb-6">
              <NumberSetting
                label="Required Document Count"
                description="Number of documents required"
                value={kycConfig.requiredDocumentCount ?? 1}
                onChange={(v) => updateKycConfig({ requiredDocumentCount: v })}
                min={1}
                max={5}
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-foreground">
                Supported Document Types
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {KYC_DOCUMENT_OPTIONS.map((doc) => (
                  <label
                    key={doc.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={(kycConfig.supportedDocumentTypes || []).includes(
                        doc.value
                      )}
                      onChange={(e) => {
                        const current = kycConfig.supportedDocumentTypes || [];
                        if (e.target.checked) {
                          updateKycConfig({
                            supportedDocumentTypes: [
                              ...current,
                              doc.value,
                            ] as KYCDocumentType[],
                          });
                        } else {
                          updateKycConfig({
                            supportedDocumentTypes: current.filter(
                              (d) => d !== doc.value
                            ),
                          });
                        }
                      }}
                      className="rounded border-border text-[#164e87] focus:ring-[#164e87]"
                    />
                    <span className="text-sm text-foreground">{doc.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Score Thresholds */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="mb-4 text-md font-semibold text-foreground">
              Risk Score Thresholds
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Score thresholds for risk classification (0-100)
            </p>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                  <AlertTriangle size={16} />
                  Critical Risk Score
                </label>
                <input
                  type="number"
                  value={kycConfig.criticalRiskScore ?? 90}
                  onChange={(e) =>
                    updateKycConfig({
                      criticalRiskScore: parseInt(e.target.value) || 90,
                    })
                  }
                  min={0}
                  max={100}
                  className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-foreground dark:border-red-800 dark:bg-red-900/20 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400">
                  <AlertTriangle size={16} />
                  High Risk Score
                </label>
                <input
                  type="number"
                  value={kycConfig.highRiskScore ?? 70}
                  onChange={(e) =>
                    updateKycConfig({
                      highRiskScore: parseInt(e.target.value) || 70,
                    })
                  }
                  min={0}
                  max={100}
                  className="w-full rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-foreground dark:border-orange-800 dark:bg-orange-900/20 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  <Info size={16} />
                  Medium Risk Score
                </label>
                <input
                  type="number"
                  value={kycConfig.mediumRiskScore ?? 40}
                  onChange={(e) =>
                    updateKycConfig({
                      mediumRiskScore: parseInt(e.target.value) || 40,
                    })
                  }
                  min={0}
                  max={100}
                  className="w-full rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-foreground dark:border-yellow-800 dark:bg-yellow-900/20 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                />
              </div>
            </div>
          </div>

          {/* Callback URL */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="mb-4 text-md font-semibold text-foreground">
              Webhook Configuration
            </h3>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Callback URL
              </label>
              <input
                type="url"
                value={kycConfig.callbackUrl ?? ""}
                onChange={(e) =>
                  updateKycConfig({ callbackUrl: e.target.value })
                }
                placeholder="https://your-api.com/kyc/webhook"
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-[#164e87] focus:outline-none focus:ring-1 focus:ring-[#164e87]"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                URL to receive KYC verification results
              </p>
            </div>
          </div>
        </>
      )}

      <SaveButton isSaving={isSaving} onSave={handleSave} />
    </div>
  );
}

// ============================================================================
// Geolocation Settings Tab
// ============================================================================
function GeolocationSettingsTab({
  settings,
  onSave,
}: {
  settings: TenantSettings;
  onSave: (settings: Partial<TenantSettings>) => Promise<void>;
}) {
  const [localSettings, setLocalSettings] = useState<TenantSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);

  const geoConfig = localSettings.geolocationConfig || {};

  const updateGeoConfig = (updates: Partial<GeolocationConfig>) => {
    setLocalSettings((prev) => ({
      ...prev,
      geolocationConfig: {
        ...prev.geolocationConfig,
        ...updates,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({
      enableGeolocation: localSettings.enableGeolocation,
      enableFraudDetection: localSettings.enableFraudDetection,
      enableGptQuery: localSettings.enableGptQuery,
      geolocationConfig: localSettings.geolocationConfig,
    });
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Geolocation Toggle */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin size={24} className="text-[#164e87]" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Geolocation Services
              </h2>
              <p className="text-sm text-muted-foreground">
                Location-based verification and fraud prevention
              </p>
            </div>
          </div>
          <ToggleSwitch
            enabled={localSettings.enableGeolocation ?? false}
            onToggle={() =>
              setLocalSettings((prev) => ({
                ...prev,
                enableGeolocation: !prev.enableGeolocation,
              }))
            }
          />
        </div>
      </div>

      {localSettings.enableGeolocation && (
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="mb-6 text-md font-semibold text-foreground">
            Geolocation Configuration
          </h3>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Provider
              </label>
              <select
                value={geoConfig.provider ?? "geoip2"}
                onChange={(e) =>
                  updateGeoConfig({
                    provider: e.target.value as GeolocationConfig["provider"],
                  })
                }
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground focus:border-[#164e87] focus:outline-none focus:ring-1 focus:ring-[#164e87]"
              >
                <option value="geoip2">GeoIP2 (MaxMind)</option>
                <option value="minfraud">MinFraud</option>
                <option value="database">Local Database</option>
              </select>
            </div>

            <ToggleSetting
              label="VPN/Proxy Detection"
              description="Detect and flag VPN or proxy usage"
              enabled={geoConfig.enableVpnCheck ?? true}
              onToggle={() =>
                updateGeoConfig({ enableVpnCheck: !geoConfig.enableVpnCheck })
              }
            />

            <ToggleSetting
              label="Risk Scoring"
              description="Calculate location-based risk scores (requires MinFraud)"
              enabled={geoConfig.enableRiskScore ?? false}
              onToggle={() =>
                updateGeoConfig({ enableRiskScore: !geoConfig.enableRiskScore })
              }
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Location Share Base URL
              </label>
              <input
                type="url"
                value={geoConfig.locationShareBaseUrl ?? ""}
                onChange={(e) =>
                  updateGeoConfig({ locationShareBaseUrl: e.target.value })
                }
                placeholder="https://your-frontend.com"
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-[#164e87] focus:outline-none focus:ring-1 focus:ring-[#164e87]"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Base URL for location verification links
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Configuration */}
      {localSettings.enableGeolocation && (
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="mb-6 text-md font-semibold text-foreground flex items-center gap-2">
            <Bell size={18} className="text-[#164e87]" />
            Push Notification Webhook
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Configure webhook to receive push notifications for location requests and compliance alerts on your platform.
          </p>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Notification Webhook URL
              </label>
              <input
                type="url"
                value={geoConfig.notificationWebhookUrl ?? ""}
                onChange={(e) =>
                  updateGeoConfig({ notificationWebhookUrl: e.target.value })
                }
                placeholder="https://your-api.com/webhooks/vesant-notifications"
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-[#164e87] focus:outline-none focus:ring-1 focus:ring-[#164e87]"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                URL to receive push notifications (location requests, alerts, etc.)
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Webhook Secret
              </label>
              <input
                type="password"
                value={geoConfig.webhookSecret ?? ""}
                onChange={(e) =>
                  updateGeoConfig({ webhookSecret: e.target.value })
                }
                placeholder="Enter a secure secret for signature verification"
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-[#164e87] focus:outline-none focus:ring-1 focus:ring-[#164e87] font-mono"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Secret used to sign webhook payloads (HMAC-SHA256). Store this securely on your server.
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="flex items-start gap-3">
                <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Webhook Signature Verification</p>
                  <p>
                    Each webhook request includes an <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">X-Webhook-Signature</code> header
                    with the format <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">sha256=&lt;hmac&gt;</code>.
                    Verify this signature using your webhook secret to ensure requests are authentic.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Features */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h3 className="mb-6 text-md font-semibold text-foreground">
          Additional Features
        </h3>

        <div className="space-y-4">
          <ToggleSetting
            label="Fraud Detection"
            description="Enable advanced fraud detection and risk scoring"
            enabled={localSettings.enableFraudDetection ?? true}
            onToggle={() =>
              setLocalSettings((prev) => ({
                ...prev,
                enableFraudDetection: !prev.enableFraudDetection,
              }))
            }
          />

          <ToggleSetting
            label="GPT Query"
            description="Enable AI-powered query features"
            enabled={localSettings.enableGptQuery ?? false}
            onToggle={() =>
              setLocalSettings((prev) => ({
                ...prev,
                enableGptQuery: !prev.enableGptQuery,
              }))
            }
            premium
          />
        </div>
      </div>

      <SaveButton isSaving={isSaving} onSave={handleSave} />
    </div>
  );
}

// ============================================================================
// Notifications & API Tab
// ============================================================================
function NotificationsAPITab({
  settings,
  onSave,
}: {
  settings: TenantSettings;
  onSave: (settings: Partial<TenantSettings>) => Promise<void>;
}) {
  const [localSettings, setLocalSettings] = useState<TenantSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({
      enableEmailNotifications: localSettings.enableEmailNotifications,
      enableSmsNotifications: localSettings.enableSmsNotifications,
      apiRateLimitPerMinute: localSettings.apiRateLimitPerMinute,
    });
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground flex items-center gap-2">
          <Bell size={20} className="text-[#164e87]" />
          Notification Channels
        </h2>

        <div className="space-y-4">
          <ToggleSetting
            label="Email Notifications"
            description="Send alerts and notifications via email"
            enabled={localSettings.enableEmailNotifications ?? true}
            onToggle={() =>
              setLocalSettings((prev) => ({
                ...prev,
                enableEmailNotifications: !prev.enableEmailNotifications,
              }))
            }
          />

          <ToggleSetting
            label="SMS Notifications"
            description="Send alerts and notifications via SMS"
            enabled={localSettings.enableSmsNotifications ?? false}
            onToggle={() =>
              setLocalSettings((prev) => ({
                ...prev,
                enableSmsNotifications: !prev.enableSmsNotifications,
              }))
            }
          />
        </div>
      </div>

      {/* API Settings */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground flex items-center gap-2">
          <Globe size={20} className="text-[#164e87]" />
          API Configuration
        </h2>

        <div>
          <NumberSetting
            label="API Rate Limit"
            description="Requests per minute (0 = use system default)"
            value={localSettings.apiRateLimitPerMinute ?? 0}
            onChange={(v) =>
              setLocalSettings((prev) => ({
                ...prev,
                apiRateLimitPerMinute: v,
              }))
            }
            min={0}
            max={10000}
          />
        </div>
      </div>

      <SaveButton isSaving={isSaving} onSave={handleSave} />
    </div>
  );
}

// ============================================================================
// Shared Components
// ============================================================================
function ToggleSetting({
  label,
  description,
  enabled,
  onToggle,
  premium,
  compact,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  premium?: boolean;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <ToggleSwitch enabled={enabled} onToggle={onToggle} small />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div>
        <p className="font-medium text-foreground flex items-center gap-2">
          {label}
          {premium && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full dark:bg-purple-900/30 dark:text-purple-300">
              Premium
            </span>
          )}
        </p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ToggleSwitch enabled={enabled} onToggle={onToggle} />
    </div>
  );
}

function ToggleSwitch({
  enabled,
  onToggle,
  small,
}: {
  enabled: boolean;
  onToggle: () => void;
  small?: boolean;
}) {
  const sizeClasses = small ? "h-5 w-9" : "h-6 w-11";
  const knobSize = small ? "h-4 w-4" : "h-5 w-5";
  const translateX = small ? "translate-x-4" : "translate-x-5";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex ${sizeClasses} flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#164e87] focus:ring-offset-2 ${
        enabled ? "bg-[#164e87]" : "bg-gray-200 dark:bg-gray-700"
      }`}
    >
      <span
        className={`pointer-events-none inline-block ${knobSize} transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? translateX : "translate-x-0"
        }`}
      />
    </button>
  );
}

function NumberSetting({
  label,
  description,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground focus:border-[#164e87] focus:outline-none focus:ring-1 focus:ring-[#164e87]"
      />
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function EmailListInput({
  emails,
  onChange,
}: {
  emails: string[];
  onChange: (emails: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState("");

  const addEmail = () => {
    const email = inputValue.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !emails.includes(email)) {
      onChange([...emails, email]);
      setInputValue("");
    }
  };

  const removeEmail = (emailToRemove: string) => {
    onChange(emails.filter((e) => e !== emailToRemove));
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="email"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
          placeholder="compliance@example.com"
          className="flex-1 rounded-lg border border-border bg-card px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-[#164e87] focus:outline-none focus:ring-1 focus:ring-[#164e87]"
        />
        <button
          type="button"
          onClick={addEmail}
          className="flex items-center gap-1 rounded-lg bg-[#164e87] px-4 py-2 text-sm font-medium text-white hover:bg-[#133f6d]"
        >
          <Plus size={16} />
          Add
        </button>
      </div>
      {emails.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {emails.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm text-foreground"
            >
              {email}
              <button
                type="button"
                onClick={() => removeEmail(email)}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SaveButton({
  isSaving,
  onSave,
}: {
  isSaving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="flex justify-end">
      <button
        onClick={onSave}
        disabled={isSaving}
        className="flex items-center gap-2 rounded-lg bg-[#164e87] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#133f6d] disabled:opacity-60 cursor-pointer"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save size={18} />
            Save Settings
          </>
        )}
      </button>
    </div>
  );
}
