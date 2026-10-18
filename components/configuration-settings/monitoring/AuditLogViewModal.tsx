"use client";

import React from "react";
import {
  User,
  Activity,
  Zap,
  Database,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Globe,
  FileText,
  Code,
  Tag,
  Info,
  Copy,
} from "lucide-react";
import { Modal } from "antd";
import { Tooltip } from "@/components/common/Tooltip";
import type { AuditLogRecord } from "../../../types/audit/audit.types";
import { formatText } from "@/utils/convertObjectKeysToCamelCase";
import Loader from "../../ui/loader/Loader";

interface AuditLogViewModalProps {
  isOpen: boolean;
  log: AuditLogRecord | null;
  loading: boolean;
  onClose: () => void;
}

const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  // Optional: Show toast notification
};

const getSeverityColor = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "bg-red-100 text-red-800 border-red-300";
    case "error":
      return "bg-orange-100 text-orange-800 border-orange-300";
    case "warning":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "info":
    default:
      return "bg-blue-100 text-blue-800 border-blue-300";
  }
};

const getStatusColor = (statusCode: number) => {
  if (statusCode >= 200 && statusCode < 300) {
    return "bg-green-100 text-green-800 border-green-300";
  } else if (statusCode >= 400) {
    return "bg-red-100 text-red-800 border-red-300";
  }
  return "bg-muted text-foreground border-border";
};

const InfoField: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number | undefined;
  copyable?: boolean;
  maxWidth?: string;
}> = ({ icon, label, value, copyable = false, maxWidth = "max-w-lg" }) => {
  if (!value) return null;

  const displayValue = typeof value === "string" ? value : String(value);

  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-3 flex-col">
          <div className="flex flex-row items-center gap-2">
            <div className="text-muted-foreground flex-shrink-0">{icon}</div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
              {label}
            </p>
          </div>
          <Tooltip text={displayValue} position="top" maxLength={100}>
            <p className={`text-sm text-foreground break-words ${maxWidth}`}>
              {displayValue.length > 100
                ? `${displayValue.substring(0, 70)}...`
                : displayValue}
            </p>
          </Tooltip>
        </div>
        {copyable && (
          <button
            onClick={() => copyToClipboard(displayValue, label)}
            className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Copy to clipboard"
          >
            <Copy size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

const BadgeField: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
}> = ({ icon, label, value, colorClass }) => {
  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <div className="flex gap-3 flex-col">
        <div className="flex flex-row items-center gap-2">
          <div className="text-muted-foreground">{icon}</div>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide text-center">
            {label}
          </p>
        </div>

        <div>
          <span
            className={`px-4 py-1 text-nowrap text-center rounded-full text-sm font-medium border ${colorClass}`}
          >
            {value}
          </span>
        </div>
      </div>
    </div>
  );
};

const JSONField: React.FC<{
  icon: React.ReactNode;
  label: string;
  data: Record<string, unknown> | undefined;
}> = ({ icon, label, data }) => {
  if (!data || Object.keys(data).length === 0) return null;

  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div className="border-b border-border py-3 last-border-b-0">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-muted-foreground">{icon}</div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
            {label}
          </p>
        </div>
        <button
          onClick={() => copyToClipboard(jsonString, label)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors dark:hover:text-slate-300"
          title="Copy JSON"
        >
          {/* <Copy size={16} /> */}
        </button>
      </div>
      <div className="bg-card/60 rounded border border-border p-3 overflow-x-auto">
        <pre className="text-xs text-foreground font-mono whitespace-pre-wrap break-words">
          {jsonString}
        </pre>
      </div>
    </div>
  );
};

export const AuditLogViewModal: React.FC<AuditLogViewModalProps> = ({
  isOpen,
  log,
  loading,
  onClose,
}) => {
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnHidden
      maskClosable={!loading}
      width={700}
      className="dark:[&_.ant-modal-close]:!text-[#747780] [&_.ant-modal-close]:!text-[#ffffff] [&_.ant-modal-container]:!p-0 [&_.ant-modal-body]:bg-white dark:[&_.ant-modal-body]:bg-[#011613] border dark:border-[#373c4a] rounded-md border-gray-200"
      styles={{
        body: {
          padding: 10,
          borderRadius: 7,
          overflow: "hidden",
        },
      }}
    >
      {loading || !log ? (
        <div className="flex items-center justify-center px-6 py-16">
          <Loader size="28" stroke="4" speed="3.5" />
        </div>
      ) : (
        <div className="bg-card space-y-2 text-foreground">
          {/* Header */}
          <div className="bg-[#3d5a5c] px-6 py-5 flex items-start rounded-md justify-between sticky-top z-10 text-primary-foreground">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="text-white" size={24} />
                <h3 className="text-lg font-semibold text-white">
                  Audit Log Details
                </h3>
              </div>
              <span className="text-white/70 font-mono text-xs flex">
                ID:{" "}
                {log?.id || (
                  <Loader size="8" stroke="2" speed="3.5" lightColor="white" />
                )}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 p-6 overflow-y-auto max-h-[60vh] rounded-md ">
            {/* Primary Information Section */}
            <section className="mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Info size={16} className="text-blue-600" />
                Primary Information
              </h3>
              <div className="border border-border rounded-lg p-5 space-y-3 bg-card">
                <InfoField
                  icon={<User size={16} />}
                  label="Username"
                  value={log.username || "N/A"}
                />
                <BadgeField
                  icon={<Activity size={16} />}
                  label="Event Type"
                  value={formatText(log.eventType) || "N/A"}
                  colorClass="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700"
                />
                <InfoField
                  icon={<Zap size={16} />}
                  label="Action"
                  value={formatText(log.action) || "N/A"}
                />
                <InfoField
                  icon={<Database size={16} />}
                  label="Resource"
                  value={formatText(log.resource) || "N/A"}
                />
                <InfoField
                  icon={<Tag size={16} />}
                  label="Resource ID"
                  value={log.resourceId || "N/A"}
                />
              </div>
            </section>

            {/* Status Information Section */}
            <section className="mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                Status Information
              </h3>
              <div className="border border-border rounded-lg p-5 space-y-3 bg-card">
                <BadgeField
                  icon={<CheckCircle size={16} />}
                  label="Status Code"
                  value={`${log.statusCode}` || "N/A"}
                  colorClass={getStatusColor(log.statusCode)}
                />
                <BadgeField
                  icon={<AlertTriangle size={16} />}
                  label="Severity"
                  value={formatText(log.severity) || "N/A"}
                  colorClass={getSeverityColor(log.severity)}
                />
                {log.errorMessage && (
                  <InfoField
                    icon={<AlertTriangle size={16} />}
                    label="Error Message"
                    value={log.errorMessage}
                  />
                )}
              </div>
            </section>

            {/* Request Details Section */}
            <section className="mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Code size={16} className="text-indigo-600" />
                Request Details
              </h3>
              <div className="border border-border rounded-lg p-5 space-y-3 bg-card">
                <InfoField
                  icon={<Code size={16} />}
                  label="Request Method"
                  value={log.requestMethod || "N/A"}
                />
                <InfoField
                  icon={<FileText size={16} />}
                  label="Request Path"
                  value={log.requestPath || "N/A"}
                  maxWidth="max-w-2xl"
                />
                <InfoField
                  icon={<Tag size={16} />}
                  label="Service Name"
                  value={formatText(log.serviceName) || "N/A"}
                />
              </div>
            </section>

            {/* Network Information Section */}
            <section className="mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Globe size={16} className="text-cyan-600" />
                Network Information
              </h3>
              <div className="border border-border rounded-lg p-5 space-y-3 bg-card">
                <InfoField
                  icon={<Globe size={16} />}
                  label="IP Address"
                  value={log.ipAddress || "N/A"}
                />
                <InfoField
                  icon={<FileText size={16} />}
                  label="User Agent"
                  value={log.userAgent || "N/A"}
                  maxWidth="max-w-2xl"
                />
              </div>
            </section>

            {/* Compliance & Tags Section */}
            <section className="mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Tag size={16} className="text-orange-600" />
                Compliance & Tags
              </h3>
              <div className="border border-border rounded-lg p-5 space-y-3 bg-card">
                <InfoField
                  icon={<Tag size={16} />}
                  label="Compliance Tag"
                  value={formatText(log.complianceTag) || "N/A"}
                />
                <InfoField
                  icon={<User size={16} />}
                  label="User ID"
                  value={log.userId || "N/A"}
                />
                <InfoField
                  icon={<Tag size={16} />}
                  label="Tenant ID"
                  value={log.tenantId || "N/A"}
                />
              </div>
            </section>

            {/* Timestamp Section */}
            <section className="mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-gray-600" />
                Timestamp
              </h3>
              <div className="border border-border rounded-lg p-5 space-y-3 bg-card">
                <InfoField
                  icon={<Calendar size={16} />}
                  label="Created At"
                  value={new Date(log.createdAt || "N/A").toLocaleString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    },
                  )}
                />
              </div>
            </section>

            {/* Metadata Section */}
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <section className="mb-4">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Code size={16} className="text-purple-600" />
                  Metadata
                </h3>
                <JSONField
                  icon={<Code size={16} />}
                  label="Metadata"
                  data={log.metadata || "N/A"}
                />
              </section>
            )}

            {/* New Value Section */}
            {log.newValue && Object.keys(log.newValue).length > 0 && (
              <section className="mb-4">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap size={16} className="text-yellow-600" />
                  New Values
                </h3>
                <JSONField
                  icon={<Zap size={16} />}
                  label="New Value"
                  data={log.newValue || "N/A"}
                />
              </section>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
