// components/configuration-settings/rules/SystemSettingsSection.tsx
"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Save,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Globe,
  Shield,
  Loader2,
  Lock,
  Clock,
  Key,
  Bell,
  Database,
  Zap,
  Users,
  FileCheck,
  Search,
  Filter,
  UserCheck,
  X,
  Plus,
  Link2,
} from "lucide-react";
import {
  TenantSettings,
  GeolocationConfig,
  KYCConfig,
  AMLScreeningConfig,
  RiskThresholds,
  AlertSettings,
} from "../../../types/sysconfig.types";
import { KYCPreferences } from "@/types/kyc/kyc.types";
import {
  getTenantSettings,
  updateTenantSettings,
} from "../../../actions/config.actions";
import { getKYCPreferences, updateKYCPreferences } from "@/actions/kyc.actions";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth.provider";
import { useTenant } from "@/components/providers/tenant.provider";
import InternalWatchListUploder from "./InternalWatchListUploder";


// Default values
const defaultGeolocationConfig: GeolocationConfig = {
  provider: "geoip2",
  enable_vpn_check: true,
  enable_risk_score: false,
  location_share_base_url: "",
};

// KYC Config will be fetched from API

const defaultAMLConfig: AMLScreeningConfig = {
  enabled: true,
  auto_screen_onboarding: true,
  filters: ["sanction", "pep", "adverse-media"],
  countries: ["US"],
  match_score: "100",
  enable_fuzzy_match: true,
  enable_alias_search: true,
  rca_search: true,
  risk_thresholds: {
    critical: 5,
    high: 3,
    medium: 1,
  },
  alert_settings: {
    create_case: true,
    notify_compliance_team: true,
    block_transaction: false,
    require_manual_review: true,
    alert_recipients: [],
  },
  escalate_reasons: [],
  resolve_reasons: [],
  close_reasons: [],
  in_progress_reasons: [],
};

// System settings - only core platform settings (no tenant-specific compliance configs)
const defaultSystemSettings: Partial<TenantSettings> = {
  // Security
  enable_mfa: false,
  max_login_attempts: 5,
  account_lockout_duration: 15,
  // Session
  session_timeout: 60,
  access_token_ttl: 3600,
  refresh_token_ttl: 604800,
  // Password
  password_min_length: 8,
  password_require_upper: true,
  password_require_lower: true,
  password_require_number: true,
  password_require_special: true,
  password_expiry_days: 90,
  // Notifications
  enable_email_notifications: true,
  enable_sms_notifications: false,
  // Rate Limiting
  api_rate_limit_per_minute: 0,
  // Minimum Retention (platform-wide minimums)
  audit_log_retention_days: 90,
  data_retention_days: 365,
};

// Tenant settings - full compliance settings including all features
const defaultTenantSettings: Partial<TenantSettings> = {
  // Security
  enable_mfa: false,
  max_login_attempts: 5,
  account_lockout_duration: 15,
  // Session
  session_timeout: 60,
  access_token_ttl: 3600,
  refresh_token_ttl: 604800,
  // Password
  password_min_length: 8,
  password_require_upper: true,
  password_require_lower: true,
  password_require_number: true,
  password_require_special: true,
  password_expiry_days: 90,
  // Retention
  audit_log_retention_days: 365,
  data_retention_days: 2555,
  // Features
  enable_geolocation: true,
  enable_fraud_detection: true,
  enable_aml_screening: true,
  enable_kyc_verification: true,
  enable_gpt_query: false,
  // Notifications
  enable_email_notifications: true,
  enable_sms_notifications: false,
  // Rate Limiting
  api_rate_limit_per_minute: 0,
  // Nested
  geolocation_config: defaultGeolocationConfig,
  aml_screening_config: defaultAMLConfig,
};

// System-level tabs (for system admins managing the compliance platform)
type SystemTabType = "security" | "session" | "password" | "notifications";

// Tenant-level tabs (for tenant admins managing their compliance features)
type TenantTabType =
  | "security"
  | "session"
  | "password"
  | "features"
  | "notifications"
  | "geolocation"
  | "aml"
  | "kyc";

type TabType = SystemTabType | TenantTabType;

const SystemSettingsSection = () => {
  const { isSystemUser } = useAuth();
  const { selectedTenantId } = useTenant();
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<Partial<TenantSettings>>(
    defaultTenantSettings,
  );
  const [originalSettings, setOriginalSettings] = useState<
    Partial<TenantSettings>
  >(defaultTenantSettings);
  const [kycPreferences, setKycPreferences] = useState<Partial<KYCPreferences>>(
    {},
  );
  const [originalKycPreferences, setOriginalKycPreferences] = useState<
    Partial<KYCPreferences>
  >({});
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("security");

  // For system admins: toggle between system settings and tenant settings
  const [configMode, setConfigMode] = useState<"system" | "tenant">("tenant");

  // Determine which tenant ID to use for API calls
  // System mode: explicitly pass "_system" to update system tenant
  // Tenant mode: use selected tenant ID
  const effectiveTenantId = isSystemUser
    ? configMode === "system"
      ? "_system"
      : selectedTenantId
    : undefined;

  // Get appropriate defaults based on mode
  const getDefaults = () =>
    isSystemUser && configMode === "system"
      ? defaultSystemSettings
      : defaultTenantSettings;

  // Fetch settings on mount or when tenant/mode changes
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const defaults = getDefaults();
        const response = await getTenantSettings(effectiveTenantId);
        // Backend returns settings directly, not wrapped in a 'settings' field
        if (response) {
          const mergedSettings = { ...defaults, ...response };
          setSettings(mergedSettings);
          setOriginalSettings(mergedSettings);
        }

        // Fetch KYC preferences separately (only in tenant mode)
        if (!isSystemUser || configMode === "tenant") {
          const kycResponse = await getKYCPreferences();
          if (kycResponse.success && kycResponse.data) {
            setKycPreferences(kycResponse.data);
            setOriginalKycPreferences(kycResponse.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch tenant settings:", err);
        setError("Failed to load settings. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [isSystemUser, selectedTenantId, configMode, effectiveTenantId]);

  // Check for changes
  useEffect(() => {
    const settingsChanged =
      JSON.stringify(settings) !== JSON.stringify(originalSettings);
    const kycChanged =
      JSON.stringify(kycPreferences) !== JSON.stringify(originalKycPreferences);
    setHasChanges(settingsChanged || kycChanged);
  }, [settings, originalSettings, kycPreferences, originalKycPreferences]);

  // Reset to a valid tab when switching config modes
  useEffect(() => {
    // These tabs are only available in tenant mode (not in system mode)
    const tenantOnlyTabs: TabType[] = ["geolocation", "aml", "kyc"];

    if (
      isSystemUser &&
      configMode === "system" &&
      tenantOnlyTabs.includes(activeTab)
    ) {
      setActiveTab("security");
    }
  }, [configMode, isSystemUser, activeTab]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const settingsChanged =
        JSON.stringify(settings) !== JSON.stringify(originalSettings);
      const kycChanged =
        JSON.stringify(kycPreferences) !==
        JSON.stringify(originalKycPreferences);

      // Save tenant settings if changed
      if (settingsChanged) {
        let settingsToSave: Record<string, unknown>;

        if (isSystemUser && configMode === "system") {
          // System mode: only send system-relevant fields
          settingsToSave = {
            enable_mfa: settings.enable_mfa,
            max_login_attempts: settings.max_login_attempts,
            account_lockout_duration: settings.account_lockout_duration,
            session_timeout: settings.session_timeout,
            access_token_ttl: settings.access_token_ttl,
            refresh_token_ttl: settings.refresh_token_ttl,
            password_min_length: settings.password_min_length,
            password_require_upper: settings.password_require_upper,
            password_require_lower: settings.password_require_lower,
            password_require_number: settings.password_require_number,
            password_require_special: settings.password_require_special,
            password_expiry_days: settings.password_expiry_days,
            enable_email_notifications: settings.enable_email_notifications,
            enable_sms_notifications: settings.enable_sms_notifications,
            api_rate_limit_per_minute: settings.api_rate_limit_per_minute,
            audit_log_retention_days: settings.audit_log_retention_days,
            data_retention_days: settings.data_retention_days,
          };
        } else {
          // Tenant mode: send all fields, transform aml_screening_config to aml_settings
          const { aml_screening_config, ...restSettings } = settings;
          settingsToSave = {
            ...restSettings,
            aml_settings: aml_screening_config,
          };
        }

        await updateTenantSettings(settingsToSave, effectiveTenantId);
        setOriginalSettings(settings);
        
        // Invalidate settings query to update the app (e.g., ChatBubble visibility)
        queryClient.invalidateQueries({ queryKey: ["tenant-settings", effectiveTenantId || selectedTenantId] });
      }

      // Save KYC preferences separately if changed (only in tenant mode)
      if (kycChanged && (!isSystemUser || configMode === "tenant")) {
        const kycResponse = await updateKYCPreferences(kycPreferences);
        if (kycResponse.success) {
          // Refetch to ensure we have the latest data
          const refetchResponse = await getKYCPreferences();
          if (refetchResponse.success && refetchResponse.data) {
            setKycPreferences(refetchResponse.data);
            setOriginalKycPreferences(refetchResponse.data);
          } else {
            setOriginalKycPreferences(kycPreferences);
          }
        } else {
          toast.error(
            kycResponse.message || "Failed to update KYC preferences",
          );
          return;
        }
      }

      setHasChanges(false);
      toast.success("Settings saved successfully");
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError("Failed to save settings. Please try again.");
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
    setKycPreferences(originalKycPreferences);
  };

  const updateSetting = <K extends keyof TenantSettings>(
    key: K,
    value: TenantSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateGeolocationConfig = (
    key: keyof GeolocationConfig,
    value: string | boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      geolocation_config: {
        ...defaultGeolocationConfig,
        ...prev.geolocation_config,
        [key]: value,
      },
    }));
  };

  const updateKYCPreference = <K extends keyof KYCPreferences>(
    key: K,
    value: KYCPreferences[K],
  ) => {
    setKycPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const updateAMLConfig = (
    key: keyof AMLScreeningConfig,
    value: boolean | string | string[] | RiskThresholds | AlertSettings,
  ) => {
    setSettings((prev) => ({
      ...prev,
      aml_screening_config: {
        ...defaultAMLConfig,
        ...prev.aml_screening_config,
        [key]: value,
      },
    }));
  };

  const updateAMLRiskThresholds = (
    key: keyof RiskThresholds,
    value: number,
  ) => {
    setSettings((prev) => ({
      ...prev,
      aml_screening_config: {
        ...defaultAMLConfig,
        ...prev.aml_screening_config,
        risk_thresholds: {
          ...defaultAMLConfig.risk_thresholds,
          ...prev.aml_screening_config?.risk_thresholds,
          [key]: value,
        },
      },
    }));
  };

  const updateAMLAlertSettings = (
    key: keyof AlertSettings,
    value: boolean | string[],
  ) => {
    setSettings((prev) => ({
      ...prev,
      aml_screening_config: {
        ...defaultAMLConfig,
        ...prev.aml_screening_config,
        alert_settings: {
          ...defaultAMLConfig.alert_settings,
          ...prev.aml_screening_config?.alert_settings,
          [key]: value,
        },
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Determine if we're configuring system settings or tenant settings
  // System settings: when system admin toggles to "system" mode
  // Tenant settings: when tenant admin OR when system admin is in "tenant" mode
  const isConfiguringSystemSettings = isSystemUser && configMode === "system";

  // System-level tabs (core platform settings + minimum retention policies)
  const systemTabs: { id: TabType; label: string; icon: typeof Shield }[] = [
    { id: "security", label: "Security", icon: Shield },
    { id: "session", label: "Session", icon: Clock },
    { id: "password", label: "Password Policy", icon: Key },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "features", label: "Retention Policies", icon: Database },
  ];

  // Tenant-level tabs (includes all compliance features)
  const tenantTabs: { id: TabType; label: string; icon: typeof Shield }[] = [
    { id: "security", label: "Security", icon: Shield },
    { id: "session", label: "Session", icon: Clock },
    { id: "password", label: "Password Policy", icon: Key },
    { id: "features", label: "Features", icon: Zap },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "geolocation", label: "Geolocation", icon: MapPin },
    { id: "aml", label: "AML Screening", icon: Search },
    { id: "kyc", label: "KYC", icon: FileCheck },
  ];

  const tabs = isConfiguringSystemSettings ? systemTabs : tenantTabs;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {isConfiguringSystemSettings
                ? "System Settings"
                : isSystemUser
                  ? "Tenant Settings"
                  : "Organization Settings"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isConfiguringSystemSettings
                ? "Configure core platform settings for the compliance system"
                : isSystemUser
                  ? `Configure compliance settings for tenant: ${selectedTenantId}`
                  : "Configure your organization's compliance and security settings"}
            </p>
          </div>

          {/* Config Mode Toggle - Only for system admins */}
          {isSystemUser && (
            <div className="flex items-center gap-3 bg-muted/50 p-1 rounded-lg border border-border">
              <button
                onClick={() => setConfigMode("system")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  configMode === "system"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Shield className="w-4 h-4" />
                System Settings
              </button>
              <button
                onClick={() => setConfigMode("tenant")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  configMode === "tenant"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Users className="w-4 h-4" />
                Tenant Settings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 flex items-start gap-2 text-sm text-red-700 bg-red-50 p-4 rounded-lg border border-red-200">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">Error</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-border pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "bg-card text-muted-foreground hover:bg-muted border border-transparent"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {/* Security Settings */}
        {activeTab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SettingCard
              icon={Lock}
              iconColor="purple"
              title="Multi-Factor Authentication"
              description="Require MFA for all users"
            >
              <Toggle
                checked={settings.enable_mfa || false}
                onChange={(v) => updateSetting("enable_mfa", v)}
                label="Enable MFA"
              />
            </SettingCard>

            <SettingCard
              icon={Shield}
              iconColor="red"
              title="Account Lockout"
              description="Protect against brute force attacks"
            >
              <NumberInput
                label="Max Login Attempts"
                value={settings.max_login_attempts || 5}
                onChange={(v) => updateSetting("max_login_attempts", v)}
                min={1}
                max={20}
              />
              <NumberInput
                label="Lockout Duration (minutes)"
                value={settings.account_lockout_duration || 15}
                onChange={(v) => updateSetting("account_lockout_duration", v)}
                min={1}
                max={1440}
              />
            </SettingCard>

            <SettingCard
              icon={Database}
              iconColor="blue"
              title="API Rate Limiting"
              description="Limit API requests per minute (0 = system default)"
            >
              <NumberInput
                label="Requests per Minute"
                value={settings.api_rate_limit_per_minute || 0}
                onChange={(v) => updateSetting("api_rate_limit_per_minute", v)}
                min={0}
                max={10000}
              />
            </SettingCard>
          </div>
        )}

        {/* Session Settings */}
        {activeTab === "session" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SettingCard
              icon={Clock}
              iconColor="blue"
              title="Session Timeout"
              description="Automatically log out inactive users"
            >
              <NumberInput
                label="Timeout (minutes)"
                value={settings.session_timeout || 60}
                onChange={(v) => updateSetting("session_timeout", v)}
                min={1}
                max={43200}
              />
            </SettingCard>

            <SettingCard
              icon={Key}
              iconColor="green"
              title="Token Lifetimes"
              description="Configure access and refresh token expiration"
            >
              <NumberInput
                label="Access Token TTL (seconds)"
                value={settings.access_token_ttl || 3600}
                onChange={(v) => updateSetting("access_token_ttl", v)}
                min={60}
                max={86400}
              />
              <NumberInput
                label="Refresh Token TTL (seconds)"
                value={settings.refresh_token_ttl || 604800}
                onChange={(v) => updateSetting("refresh_token_ttl", v)}
                min={3600}
                max={31536000}
              />
            </SettingCard>
          </div>
        )}

        {/* Password Policy */}
        {activeTab === "password" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SettingCard
              icon={Key}
              iconColor="purple"
              title="Password Requirements"
              description="Set minimum password complexity"
            >
              <NumberInput
                label="Minimum Length"
                value={settings.password_min_length || 8}
                onChange={(v) => updateSetting("password_min_length", v)}
                min={6}
                max={128}
              />
              <Toggle
                checked={settings.password_require_upper || false}
                onChange={(v) => updateSetting("password_require_upper", v)}
                label="Require Uppercase"
              />
              <Toggle
                checked={settings.password_require_lower || false}
                onChange={(v) => updateSetting("password_require_lower", v)}
                label="Require Lowercase"
              />
              <Toggle
                checked={settings.password_require_number || false}
                onChange={(v) => updateSetting("password_require_number", v)}
                label="Require Number"
              />
              <Toggle
                checked={settings.password_require_special || false}
                onChange={(v) => updateSetting("password_require_special", v)}
                label="Require Special Character"
              />
            </SettingCard>

            <SettingCard
              icon={Clock}
              iconColor="orange"
              title="Password Expiration"
              description="Force password changes periodically"
            >
              <NumberInput
                label="Expiry Days (0 = never)"
                value={settings.password_expiry_days || 0}
                onChange={(v) => updateSetting("password_expiry_days", v)}
                min={0}
                max={365}
              />
            </SettingCard>
          </div>
        )}

        {/* Retention Policies - For system settings (minimum retention) */}
        {activeTab === "features" && isConfiguringSystemSettings && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SettingCard
              icon={Database}
              iconColor="blue"
              title="Minimum Retention Policies"
              description="Platform-wide minimum retention periods that tenants cannot go below"
            >
              <NumberInput
                label="Minimum Audit Log Retention (days)"
                value={settings.audit_log_retention_days || 90}
                onChange={(v) => updateSetting("audit_log_retention_days", v)}
                min={1}
                max={3650}
              />
              <NumberInput
                label="Minimum Data Retention (days)"
                value={settings.data_retention_days || 365}
                onChange={(v) => updateSetting("data_retention_days", v)}
                min={1}
                max={3650}
              />
              <p className="text-xs text-muted-foreground mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                These are platform-wide minimums. Tenants can set higher values
                based on their regulatory requirements, but cannot go below
                these limits.
              </p>
            </SettingCard>
          </div>
        )}

        {/* Features - Only for tenant settings */}
        {activeTab === "features" && !isConfiguringSystemSettings && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SettingCard
              icon={Zap}
              iconColor="yellow"
              title="Compliance Features"
              description="Enable or disable compliance modules"
            >
              <Toggle
                checked={settings.enable_geolocation || false}
                onChange={(v) => updateSetting("enable_geolocation", v)}
                label="Geolocation Tracking"
              />
              <Toggle
                checked={settings.enable_fraud_detection || false}
                onChange={(v) => updateSetting("enable_fraud_detection", v)}
                label="Fraud Detection"
              />
              <Toggle
                checked={settings.enable_aml_screening || false}
                onChange={(v) => updateSetting("enable_aml_screening", v)}
                label="AML Screening"
              />
              <Toggle
                checked={settings.enable_kyc_verification || false}
                onChange={(v) => updateSetting("enable_kyc_verification", v)}
                label="KYC Verification"
              />
              <Toggle
                checked={settings.enable_gpt_query || false}
                onChange={(v) => updateSetting("enable_gpt_query", v)}
                label="GPT Query (Premium)"
              />
            </SettingCard>

            <SettingCard
              icon={Database}
              iconColor="blue"
              title="Data Retention"
              description="Configure data retention periods (must meet system minimums)"
            >
              <NumberInput
                label="Audit Log Retention (days)"
                value={settings.audit_log_retention_days || 365}
                onChange={(v) => updateSetting("audit_log_retention_days", v)}
                min={1}
                max={3650}
              />
              <NumberInput
                label="Data Retention (days)"
                value={settings.data_retention_days || 2555}
                onChange={(v) => updateSetting("data_retention_days", v)}
                min={1}
                max={3650}
              />
            </SettingCard>
          </div>
        )}

        {/* Notifications */}
        {activeTab === "notifications" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SettingCard
              icon={Bell}
              iconColor="blue"
              title="Notification Channels"
              description="Configure notification delivery methods"
            >
              <Toggle
                checked={settings.enable_email_notifications || false}
                onChange={(v) => updateSetting("enable_email_notifications", v)}
                label="Email Notifications"
              />
              <Toggle
                checked={settings.enable_sms_notifications || false}
                onChange={(v) => updateSetting("enable_sms_notifications", v)}
                label="SMS Notifications"
              />
            </SettingCard>
          </div>
        )}

        {/* Geolocation - Only for tenant settings */}
        {activeTab === "geolocation" && !isConfiguringSystemSettings && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SettingCard
              icon={MapPin}
              iconColor="blue"
              title="Location Share Settings"
              description="Configure the base URL for location share links"
            >
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Location Share Base URL
                </label>
                <input
                  type="url"
                  value={
                    settings.geolocation_config?.location_share_base_url || ""
                  }
                  onChange={(e) =>
                    updateGeolocationConfig(
                      "location_share_base_url",
                      e.target.value,
                    )
                  }
                  placeholder="https://your-app.example.com"
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition bg-card text-foreground border-border"
                />
                <p className="text-xs text-muted-foreground">
                  The URL where customers will be directed to share their
                  location. Links will be: {"{base_url}"}/location/share/
                  {"{token}"}
                </p>
              </div>
            </SettingCard>

            <SettingCard
              icon={Globe}
              iconColor="green"
              title="Geolocation Provider"
              description="Configure the geolocation service provider"
            >
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Provider
                </label>
                <select
                  value={settings.geolocation_config?.provider || "geoip2"}
                  onChange={(e) =>
                    updateGeolocationConfig("provider", e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition bg-card text-foreground border-border"
                >
                  <option value="geoip2">GeoIP2 (Default)</option>
                  <option value="minfraud">MinFraud</option>
                  <option value="database">Database Only</option>
                </select>
              </div>
            </SettingCard>

            <SettingCard
              icon={Shield}
              iconColor="purple"
              title="Security Features"
              description="Enable additional security checks"
            >
              <Toggle
                checked={settings.geolocation_config?.enable_vpn_check || false}
                onChange={(v) => updateGeolocationConfig("enable_vpn_check", v)}
                label="VPN Detection"
                description="Detect and flag VPN/proxy usage"
              />
              <Toggle
                checked={
                  settings.geolocation_config?.enable_risk_score || false
                }
                onChange={(v) =>
                  updateGeolocationConfig("enable_risk_score", v)
                }
                label="Risk Scoring"
                description="Enable fraud risk scoring (requires MinFraud)"
              />
            </SettingCard>
          </div>
        )}

        {/* AML Screening - Only for tenant settings */}
        {activeTab === "aml" && !isConfiguringSystemSettings && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SettingCard
              icon={Search}
              iconColor="blue"
              title="AML Screening"
              description="Configure anti-money laundering screening"
            >
              <Toggle
                checked={settings.aml_screening_config?.enabled || false}
                onChange={(v) => updateAMLConfig("enabled", v)}
                label="Enable AML Screening"
                description="Enable anti-money laundering screening for customers"
              />
              <Toggle
                checked={
                  settings.aml_screening_config?.auto_screen_onboarding || false
                }
                onChange={(v) => updateAMLConfig("auto_screen_onboarding", v)}
                label="Auto Screen on Onboarding"
                description="Automatically screen new customers during onboarding"
              />
            </SettingCard>

            <SettingCard
              icon={Filter}
              iconColor="purple"
              title="Matching Settings"
              description="Configure screening match settings"
            >
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Match Score Threshold
                </label>
                <input
                  type="text"
                  value={settings.aml_screening_config?.match_score || "100"}
                  onChange={(e) =>
                    updateAMLConfig("match_score", e.target.value)
                  }
                  placeholder="100"
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition bg-card text-foreground border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum match score (0-100) to flag a result
                </p>
              </div>
              <Toggle
                checked={
                  settings.aml_screening_config?.enable_fuzzy_match || false
                }
                onChange={(v) => updateAMLConfig("enable_fuzzy_match", v)}
                label="Fuzzy Matching"
                description="Enable fuzzy name matching for better results"
              />
              <Toggle
                checked={
                  settings.aml_screening_config?.enable_alias_search || false
                }
                onChange={(v) => updateAMLConfig("enable_alias_search", v)}
                label="Alias Search"
                description="Search aliases and AKAs"
              />
              <Toggle
                checked={settings.aml_screening_config?.rca_search || false}
                onChange={(v) => updateAMLConfig("rca_search", v)}
                label="RCA Search"
                description="Enable Relative/Close Associate search"
              />
            </SettingCard>

            <SettingCard
              icon={AlertTriangle}
              iconColor="orange"
              title="Risk Thresholds"
              description="Configure hit count thresholds for risk levels"
            >
              <NumberInput
                label="Critical Risk (hits >=)"
                value={
                  settings.aml_screening_config?.risk_thresholds?.critical || 5
                }
                onChange={(v) => updateAMLRiskThresholds("critical", v)}
                min={1}
                max={100}
              />
              <NumberInput
                label="High Risk (hits >=)"
                value={
                  settings.aml_screening_config?.risk_thresholds?.high || 3
                }
                onChange={(v) => updateAMLRiskThresholds("high", v)}
                min={1}
                max={100}
              />
              <NumberInput
                label="Medium Risk (hits >=)"
                value={
                  settings.aml_screening_config?.risk_thresholds?.medium || 1
                }
                onChange={(v) => updateAMLRiskThresholds("medium", v)}
                min={1}
                max={100}
              />
            </SettingCard>

            <SettingCard
              icon={UserCheck}
              iconColor="green"
              title="Alert Actions"
              description="Configure actions when customers are flagged"
            >
              <Toggle
                checked={
                  settings.aml_screening_config?.alert_settings?.create_case ||
                  false
                }
                onChange={(v) => updateAMLAlertSettings("create_case", v)}
                label="Auto-Create Case"
                description="Automatically create a case for flagged customers"
              />
              <Toggle
                checked={
                  settings.aml_screening_config?.alert_settings
                    ?.notify_compliance_team || false
                }
                onChange={(v) =>
                  updateAMLAlertSettings("notify_compliance_team", v)
                }
                label="Notify Compliance Team"
                description="Send notifications to compliance team"
              />
              <Toggle
                checked={
                  settings.aml_screening_config?.alert_settings
                    ?.block_transaction || false
                }
                onChange={(v) => updateAMLAlertSettings("block_transaction", v)}
                label="Block Transactions"
                description="Block transactions for flagged customers"
              />
              <Toggle
                checked={
                  settings.aml_screening_config?.alert_settings
                    ?.require_manual_review || false
                }
                onChange={(v) =>
                  updateAMLAlertSettings("require_manual_review", v)
                }
                label="Require Manual Review"
                description="Require manual review before proceeding"
              />
            </SettingCard>

            <SettingCard
              icon={Globe}
              iconColor="blue"
              title="Countries"
              description="Countries to screen against"
            >
              <TagInput
                label="Screened Countries"
                value={settings.aml_screening_config?.countries || []}
                onChange={(v) => updateAMLConfig("countries", v)}
                placeholder="Add country code (e.g., US, GB)"
              />
            </SettingCard>

            <SettingCard
              icon={Filter}
              iconColor="purple"
              title="Screening Filters"
              description="Types of lists to screen against"
            >
              <TagInput
                label="Active Filters"
                value={settings.aml_screening_config?.filters || []}
                onChange={(v) => updateAMLConfig("filters", v)}
                placeholder="Add filter (e.g., sanction, pep)"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Common filters: sanction, pep, pep-class-1, pep-class-2,
                adverse-media, warning
              </p>
            </SettingCard>
            <div> <InternalWatchListUploder onFileSelect={() => {}} /> </div>
          </div>
        )}

        {/* KYC - Only for tenant settings */}
        {activeTab === "kyc" && !isConfiguringSystemSettings && (
          <div className="space-y-6">
            {/* First Row: Document Verification + (Risk Score & Age Verification) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SettingCard
                icon={FileCheck}
                iconColor="blue"
                title="Document Verification"
                description="Configure document verification requirements for KYC"
              >
                <Toggle
                  checked={
                    kycPreferences.is_document_verification_required || false
                  }
                  onChange={(v) =>
                    updateKYCPreference("is_document_verification_required", v)
                  }
                  label="Document Verification Required"
                  description="Require users to submit documents for verification"
                />
                <Toggle
                  checked={
                    kycPreferences.is_face_verification_required || false
                  }
                  onChange={(v) =>
                    updateKYCPreference("is_face_verification_required", v)
                  }
                  label="Face Verification Required"
                  description="Require users to complete face verification"
                />
                <Toggle
                  checked={
                    kycPreferences.is_address_verification_required || false
                  }
                  onChange={(v) =>
                    updateKYCPreference("is_address_verification_required", v)
                  }
                  label="Address Verification Required"
                  description="Require users to provide address verification"
                />
                <NumberInput
                  label="Required Document Count"
                  value={kycPreferences.required_document_count || 2}
                  onChange={(v) =>
                    updateKYCPreference("required_document_count", v)
                  }
                  min={1}
                  max={10}
                />
                <TagInput
                  label="Supported Document Types"
                  value={kycPreferences.supported_document_types || []}
                  onChange={(v) =>
                    updateKYCPreference("supported_document_types", v)
                  }
                  placeholder="e.g., ID_CARD, PASSPORT"
                />
              </SettingCard>

              <div className="flex flex-col gap-6">
                <SettingCard
                  icon={AlertTriangle}
                  iconColor="red"
                  title="Risk Score Thresholds"
                  description="Define risk level thresholds for KYC assessment"
                >
                  <NumberInput
                    label="Critical Risk Score"
                    value={kycPreferences.critical_risk_score || 75}
                    onChange={(v) =>
                      updateKYCPreference("critical_risk_score", v)
                    }
                    min={0}
                    max={100}
                  />
                  <NumberInput
                    label="High Risk Score"
                    value={kycPreferences.high_risk_score || 65}
                    onChange={(v) => updateKYCPreference("high_risk_score", v)}
                    min={0}
                    max={100}
                  />
                  <NumberInput
                    label="Medium Risk Score"
                    value={kycPreferences.medium_risk_score || 50}
                    onChange={(v) =>
                      updateKYCPreference("medium_risk_score", v)
                    }
                    min={0}
                    max={100}
                  />
                </SettingCard>

                <SettingCard
                  icon={Users}
                  iconColor="purple"
                  title="Age Verification"
                  description="Configure age verification requirements"
                >
                  <Toggle
                    checked={
                      kycPreferences.is_age_verification_required || false
                    }
                    onChange={(v) =>
                      updateKYCPreference("is_age_verification_required", v)
                    }
                    label="Age Verification Required"
                    description="Enforce age verification during KYC"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <NumberInput
                      label="Minimum Age"
                      value={kycPreferences.min_age || 18}
                      onChange={(v) => updateKYCPreference("min_age", v)}
                      min={0}
                      max={120}
                    />
                    <NumberInput
                      label="Maximum Age"
                      value={kycPreferences.max_age || 100}
                      onChange={(v) => updateKYCPreference("max_age", v)}
                      min={18}
                      max={150}
                    />
                  </div>
                </SettingCard>
              </div>
            </div>

            {/* Second Row: KYC Approval Reasons + Webhook Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SettingCard
                icon={CheckCircle}
                iconColor="green"
                title="KYC Approval Reasons"
                description="Define reasons for approving KYC applications"
              >
                <TagInput
                  label="Approval Reasons"
                  value={kycPreferences.approve_kyc_reasons || []}
                  onChange={(v) =>
                    updateKYCPreference("approve_kyc_reasons", v)
                  }
                  placeholder="e.g., IDENTITY_VERIFICATION"
                />
              </SettingCard>

              <SettingCard
                icon={Link2}
                iconColor="orange"
                title="Webhook Configuration"
                description="Configure webhook for KYC status updates"
              >
                <TextInput
                  label="Callback URL"
                  value={kycPreferences.callback_url || ""}
                  onChange={(v) => updateKYCPreference("callback_url", v)}
                  placeholder="https://api.example.com/webhooks/kyc-status"
                  description="Webhook URL to receive KYC status updates"
                />
              </SettingCard>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 pt-6 border-t border-border flex items-center justify-end gap-3">
        {hasChanges && (
          <button
            onClick={handleReset}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-muted transition disabled:opacity-50"
          >
            Reset Changes
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
            hasChanges && !isSaving
              ? "bg-[#164e87] hover:bg-[#133f6d] text-white"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : hasChanges ? (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Saved
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Helper Components
interface SettingCardProps {
  icon: typeof Shield;
  iconColor: "blue" | "green" | "purple" | "red" | "orange" | "yellow";
  title: string;
  description: string;
  children: React.ReactNode;
}

const colorMap = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  purple: "bg-purple-100 text-purple-600",
  red: "bg-red-100 text-red-600",
  orange: "bg-orange-100 text-orange-600",
  yellow: "bg-yellow-100 text-yellow-600",
};

const SettingCard = ({
  icon: Icon,
  iconColor,
  title,
  description,
  children,
}: SettingCardProps) => (
  <div className="border rounded-xl p-5 border-border bg-card hover:border-blue-300 transition-all duration-200">
    <div className="flex items-center gap-3 mb-4">
      <div className={`p-2 rounded-lg ${colorMap[iconColor]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}

const Toggle = ({ checked, onChange, label, description }: ToggleProps) => (
  <div className="flex items-center justify-between py-1">
    <div>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  </div>
);

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const NumberInput = ({
  label,
  value,
  onChange,
  min,
  max,
}: NumberInputProps) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-foreground">{label}</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      min={min}
      max={max}
      className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition bg-card text-foreground border-border"
    />
  </div>
);

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

const TagInput = ({ label, value, onChange, placeholder }: TagInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim().toUpperCase())) {
        onChange([...value, inputValue.trim().toUpperCase()]);
      }
      setInputValue("");
    }
  };

  const handleRemove = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemove(tag)}
              className="hover:text-blue-900"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition bg-card text-foreground border-border"
        />
        <button
          type="button"
          onClick={() => {
            if (
              inputValue.trim() &&
              !value.includes(inputValue.trim().toUpperCase())
            ) {
              onChange([...value, inputValue.trim().toUpperCase()]);
              setInputValue("");
            }
          }}
          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
}

const TextInput = ({
  label,
  value,
  onChange,
  placeholder,
  description,
}: TextInputProps) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-foreground">{label}</label>
    {description && (
      <p className="text-xs text-muted-foreground mb-1">{description}</p>
    )}
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition bg-card text-foreground border-border placeholder-muted-foreground"
    />
  </div>
);

export default SystemSettingsSection;
