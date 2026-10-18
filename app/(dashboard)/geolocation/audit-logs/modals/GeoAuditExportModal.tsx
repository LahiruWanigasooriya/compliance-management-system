"use client";
import React from "react";
import GeoExportModal from "../../alerts/modals/GeoExportModal";

type ExportFormat = "pdf" | "csv" | "json";

interface GeoAuditExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (type: ExportFormat) => Promise<void> | void;
  exporting?: boolean;
}

export default function GeoAuditExportModal({
  isOpen,
  onClose,
  onExport,
  exporting,
}: GeoAuditExportModalProps) {
  return (
    <GeoExportModal
      isOpen={isOpen}
      onClose={onClose}
      onExport={onExport}
      exporting={exporting}
      title="Export Audit Logs"
      description="Select the format to export geolocation audit logs:"
      allowedFormats={["csv", "json"]}
    />
  );
}
