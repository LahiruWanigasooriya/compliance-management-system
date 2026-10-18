"use client";
import React from "react";
import { ICONS } from "@/constants/constants";

type ExportFormat = "pdf" | "csv" | "json";

interface GeoExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (type: ExportFormat) => Promise<void> | void;
  exporting?: boolean;
  title?: string;
  description?: string;
  allowedFormats?: Array<"pdf" | "csv" | "json">;
}

const GeoExportModal: React.FC<GeoExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  exporting = false,
  title = "Export Geo Alerts",
  description = "Select the format to export geolocation alerts:",
  allowedFormats = ["csv", "json", "pdf"],
}) => {
  if (!isOpen) return null;

  const allOptions = [
    { format: "csv" as const, label: "CSV", icon: ICONS.FileText },
    { format: "json" as const, label: "JSON", icon: ICONS.FileText },
    { format: "pdf" as const, label: "PDF", icon: ICONS.FileText },
  ];

  const options = allOptions.filter((opt) =>
    allowedFormats.includes(opt.format),
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl border border-panel-border shadow-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ICONS.X size={20} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <div className="space-y-2">
          {options.map(({ format, label, icon: Icon }) => (
            <button
              key={format}
              onClick={async () => {
                await onExport(format);
              }}
              disabled={exporting}
              className="w-full px-4 py-3 bg-card border border-panel-border rounded-lg hover:bg-card/70 transition-all text-left flex items-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon size={20} className="text-muted-foreground" />
              <span className="text-foreground font-medium">
                Export as {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GeoExportModal;
