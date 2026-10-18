import DialogModal from "@/components/common/dialog-modal/DialogModal";
import { GeoLog } from "@/types/geolocation.types";
import { convertDate } from "@/utils/convertDate";
import { formatLocation } from "@/utils/format";
import { ICONS } from "@/constants/constants";
import CopyableText from "@/components/common/copyable-text/CopyableText";

interface GeoAuditLogPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLog: GeoLog;
}

const getSeverityStyles = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800";
    case "high":
    case "error":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800";
    case "medium":
    case "warning":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
    case "low":
    case "info":
    default:
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800";
  }
};

const getActionStyles = (action: string) => {
  const lowerAction = action?.toLowerCase() || "";
  if (lowerAction.includes("create") || lowerAction.includes("add")) {
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800";
  }
  if (lowerAction.includes("delete") || lowerAction.includes("remove")) {
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800";
  }
  if (lowerAction.includes("update") || lowerAction.includes("edit") || lowerAction.includes("modify")) {
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
  }
  if (lowerAction.includes("view") || lowerAction.includes("read") || lowerAction.includes("get")) {
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800";
  }
  return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800";
};

const formatLabel = (value: string) => {
  if (!value) return "N/A";
  return value.replaceAll("_", " ");
};

const InfoField = ({
  icon: Icon,
  label,
  value,
  copyable = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | undefined | null;
  copyable?: boolean;
}) => {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-panel-border last:border-b-0">
      <div className="flex-shrink-0 mt-0.5">
        <Icon size={16} className="text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          {label}
        </p>
        {copyable ? (
          <CopyableText
            text={value}
            textClassName="text-sm text-foreground break-all"
          />
        ) : (
          <p className="text-sm text-foreground break-all">{value}</p>
        )}
      </div>
    </div>
  );
};

const BadgeField = ({
  icon: Icon,
  label,
  value,
  badgeClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  badgeClass: string;
}) => {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-panel-border last:border-b-0">
      <div className="flex-shrink-0 mt-0.5">
        <Icon size={16} className="text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          {label}
        </p>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${badgeClass}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
};

const GeoAuditLogPopupModal = ({
  isOpen,
  onClose,
  selectedLog,
}: GeoAuditLogPopupModalProps) => {
  return (
    <DialogModal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="max-w-2xl"
    >
      <div className="flex flex-col">
        {/* Header */}
        <div className="bg-[#1A5276] rounded-lg px-5 py-4 mt-2 mb-6">
          <div className="flex items-center gap-3 mt-1 mb-2">
            <ICONS.FileText className="text-white" size={22} />
            <h3 className="text-lg font-semibold text-white">
              Audit Log Details
            </h3>
          </div>
          <p className="text-white/80 text-xs font-mono">
            ID: {selectedLog.id}
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {/* Primary Information */}
          <section>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ICONS.Info size={16} className="text-[#1A5276]" />
              Primary Information
            </h4>
            <div className="bg-card border border-panel-border rounded-lg p-4">
              <InfoField
                icon={ICONS.FileText}
                label="Log ID"
                value={selectedLog.id}
                copyable
              />
              <InfoField
                icon={ICONS.Building}
                label="Tenant ID"
                value={selectedLog.tenant_id}
                copyable
              />
              <BadgeField
                icon={ICONS.Zap}
                label="Action"
                value={formatLabel(selectedLog.action)}
                badgeClass={getActionStyles(selectedLog.action)}
              />
              <InfoField
                icon={ICONS.Database}
                label="Resource"
                value={formatLabel(selectedLog.resource)}
              />
              {selectedLog.resource_id && (
                <InfoField
                  icon={ICONS.Link}
                  label="Resource ID"
                  value={selectedLog.resource_id}
                  copyable
                />
              )}
            </div>
          </section>

          {/* Status Information */}
          <section>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ICONS.CheckCircle size={16} className="text-green-600" />
              Status Information
            </h4>
            <div className="bg-card border border-panel-border rounded-lg p-4">
              <BadgeField
                icon={ICONS.AlertTriangle}
                label="Severity"
                value={selectedLog.severity || "Info"}
                badgeClass={getSeverityStyles(selectedLog.severity)}
              />
              <InfoField
                icon={ICONS.User}
                label="Performed By"
                value={selectedLog.performed_by}
              />
              <InfoField
                icon={ICONS.Clock}
                label="Timestamp"
                value={convertDate(selectedLog.created_at, "YYYY-MM-DD HH:mm:ss")}
              />
            </div>
          </section>

          {/* Description */}
          {selectedLog.description && (
            <section>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <ICONS.FileText size={16} className="text-purple-600" />
                Description
              </h4>
              <div className="bg-card border border-panel-border rounded-lg p-4">
                <p className="text-sm text-foreground">{selectedLog.description}</p>
              </div>
            </section>
          )}

          {/* Network Information */}
          {(selectedLog.ipAddress || selectedLog.location) && (
            <section>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <ICONS.Globe size={16} className="text-cyan-600" />
                Network Information
              </h4>
              <div className="bg-card border border-panel-border rounded-lg p-4">
                {selectedLog.ipAddress && (
                  <InfoField
                    icon={ICONS.Network}
                    label="IP Address"
                    value={selectedLog.ipAddress}
                    copyable
                  />
                )}
                {selectedLog.location && (
                  <InfoField
                    icon={ICONS.MapPin}
                    label="Location"
                    value={formatLocation(selectedLog.location)}
                  />
                )}
              </div>
            </section>
          )}

          {/* Metadata */}
          {selectedLog.metaData && (
            <section>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <ICONS.Settings size={16} className="text-orange-600" />
                Metadata
              </h4>
              <div className="bg-gray-50 dark:bg-gray-900/50 border border-panel-border rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-foreground font-mono whitespace-pre-wrap break-words">
                  {typeof selectedLog.metaData === "string"
                    ? selectedLog.metaData
                    : JSON.stringify(selectedLog.metaData, null, 2)}
                </pre>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-panel-border">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground rounded-lg font-medium transition-colors cursor-pointer text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </DialogModal>
  );
};

export default GeoAuditLogPopupModal;
