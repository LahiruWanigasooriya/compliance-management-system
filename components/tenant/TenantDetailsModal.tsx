"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Globe,
  CreditCard,
  Calendar,
  Shield,
  Key,
  Copy,
  Check,
  Settings,
  Loader2,
} from "lucide-react";
import type { Tenant, TenantSettings } from "@/types/tenant.types";
import { getTenantSettings } from "@/actions/tenant.actions";
import { toast } from "sonner";

interface TenantDetailsModalProps {
  tenant: Tenant;
  onClose: () => void;
}

export default function TenantDetailsModal({
  tenant,
  onClose,
}: TenantDetailsModalProps) {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const response = await getTenantSettings(tenant.id);
        if (response.success && response.data) {
          setSettings(response.data);
        }
      } catch (error) {
        console.error("Error fetching tenant settings:", error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettings();
  }, [tenant.id]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusColorStyles = (status: string) => {
    const normalizedStatus = status?.toLowerCase?.() || "";
    if (normalizedStatus === "active") {
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    }
    if (normalizedStatus === "suspended") {
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    }
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
  };

  const getPlanColorStyles = (plan: string) => {
    const normalizedPlan = plan?.toLowerCase?.() || "";
    if (normalizedPlan === "enterprise") {
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
    }
    if (normalizedPlan === "professional") {
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    }
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border px-6 py-4">
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:bg-muted/30 cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-[#164e87]" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Tenant Details
            </h2>
            <p className="text-sm text-muted-foreground">{tenant.name}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColorStyles(
              tenant.status
            )}`}
          >
            {tenant.status}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getPlanColorStyles(
              tenant.plan
            )}`}
          >
            {tenant.plan}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Basic Information */}
        <div className="mb-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Building2 size={16} />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Tenant ID
              </p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm text-foreground">{tenant.id}</p>
                <button
                  onClick={() => copyToClipboard(tenant.id, "id")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {copiedField === "id" ? (
                    <Check size={14} />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="mb-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Globe size={12} />
                Subdomain
              </p>
              <p className="text-sm text-foreground">
                {tenant.subdomain}.vesant.ai
              </p>
            </div>

            {tenant.url && (
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  URL
                </p>
                <a
                  href={tenant.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#164e87] hover:underline"
                >
                  {tenant.url}
                </a>
              </div>
            )}

            {tenant.industry && (
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Industry
                </p>
                <p className="text-sm text-foreground">{tenant.industry}</p>
              </div>
            )}

            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="mb-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                <CreditCard size={12} />
                Plan
              </p>
              <p className="text-sm text-foreground capitalize">{tenant.plan}</p>
            </div>

            {tenant.createdAt && (
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="mb-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar size={12} />
                  Created
                </p>
                <p className="text-sm text-foreground">
                  {new Date(tenant.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* API Key */}
        {tenant.apiKey && (
          <div className="mb-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Key size={16} />
              API Key
            </h3>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm text-foreground">
                  {tenant.apiKey.substring(0, 12)}...
                  {tenant.apiKey.substring(tenant.apiKey.length - 4)}
                </p>
                <button
                  onClick={() => copyToClipboard(tenant.apiKey!, "apiKey")}
                  className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/30"
                >
                  {copiedField === "apiKey" ? (
                    <>
                      <Check size={12} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Settings size={16} />
            Configuration
          </h3>

          {isLoadingSettings ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : settings ? (
            <div className="space-y-4">
              {/* Security Settings */}
              <div className="rounded-lg border border-border p-4">
                <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Shield size={14} />
                  SECURITY
                </h4>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">MFA Enabled</p>
                    <p className="text-sm font-medium text-foreground">
                      {settings.enableMfa ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Max Login Attempts
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {settings.maxLoginAttempts ?? 5}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Session Timeout
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {settings.sessionTimeout ?? 60} min
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Password Expiry
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {settings.passwordExpiryDays ?? 90} days
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Flags */}
              <div className="rounded-lg border border-border p-4">
                <h4 className="mb-3 text-xs font-semibold text-muted-foreground">
                  FEATURES
                </h4>
                <div className="flex flex-wrap gap-2">
                  {settings.enableAmlScreening && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      AML Screening
                    </span>
                  )}
                  {settings.enableKycVerification && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      KYC Verification
                    </span>
                  )}
                  {settings.enableGeolocation && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      Geolocation
                    </span>
                  )}
                  {settings.enableFraudDetection && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      Fraud Detection
                    </span>
                  )}
                  {settings.enableGptQuery && (
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      GPT Query
                    </span>
                  )}
                </div>
              </div>

              {/* Data Retention */}
              <div className="rounded-lg border border-border p-4">
                <h4 className="mb-3 text-xs font-semibold text-muted-foreground">
                  DATA RETENTION
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Audit Logs</p>
                    <p className="text-sm font-medium text-foreground">
                      {settings.auditLogRetentionDays ?? 365} days
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Data Retention
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {settings.dataRetentionDays ?? 2555} days
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
              No settings data available
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-6 py-4">
        <button
          onClick={onClose}
          className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/30 cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}
