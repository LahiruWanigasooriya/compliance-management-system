import type { KYCAlertsRecord } from "@/types/kyc/alerts.types";

type ExportFormat = "pdf" | "csv" | "json";

const exportFields = [
  "id",
  "forwardReference",
  "tenantId",
  "firstName",
  "middleName",
  "lastName",
  "dob",
  "fullAddress",
  "idVerified",
  "addressVerified",
  "faceVerified",
  // "proofs",
  "email",
  "declinedReason",
  "warnings",
  "callbackUrl",
  "redirectUrl",
  "status",
  "location",
  "identityHash",
  "createdAt",
  "updatedAt",
  "alerts",
] as const;

const summaryFields = [
  "id",
  "email",
  "status",
  "createdAt",
  "updatedAt",
] as const;

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const formatFileStamp = () =>
  new Date().toISOString().replace(/[:]/g, "-").replace("T", "_").slice(0, 19);

export const toCsvValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const toLabel = (field: string) =>
  field
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (match) => match.toUpperCase());

export const exportKycRecords = async (
  records: KYCAlertsRecord[],
  format: ExportFormat
) => {
  // if (records.length === 0) {
  //   return;
  // }

  const fileStamp = formatFileStamp();
  const exportRows = records.map((record) => record.kyc);

  if (format === "json") {
    const blob = new Blob([JSON.stringify(exportRows, null, 2)], {
      type: "application/json",
    });
    downloadBlob(blob, `kyc-export_${fileStamp}.json`);
    return;
  }

  if (format === "csv") {
    const headers = [...exportFields];
    const csvLines = [
      headers.join(","),
      ...exportRows.map((row) =>
        headers
          .map((key) => {
            const value = row[key as keyof typeof row];
            if (value && typeof value === "object") {
              return toCsvValue(JSON.stringify(value));
            }
            return toCsvValue(value);
          })
          .join(",")
      ),
    ];
    const blob = new Blob([csvLines.join("\n")], { type: "text/csv" });
    downloadBlob(blob, `kyc-export_${fileStamp}.csv`);
    return;
  }

  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  doc.setFontSize(14);
  doc.text("KYC Export", 36, 32);

  if (exportRows.length === 0) {
    doc.setFontSize(12);
    doc.text("No records available", 36, 60);
  } else {
    autoTable(doc, {
      startY: 48,
      head: [summaryFields.map((field) => toLabel(field))],
      body: exportRows.map((row) =>
        summaryFields.map((field) => String(row[field] ?? ""))
      ),
      styles: {
        fontSize: 8,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [26, 82, 118],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      margin: { left: 24, right: 24 },
    });

    exportRows.forEach((row, index) => {
      autoTable(doc, {
        startY: (doc as typeof doc & { lastAutoTable?: { finalY: number } })
          .lastAutoTable?.finalY
          ? (doc as typeof doc & { lastAutoTable?: { finalY: number } })
              .lastAutoTable!.finalY + 16
          : 48,
        head: [[`Record ${index + 1}`, "Value"]],
        body: exportFields.map((field) => {
          const value = row[field];
          return [
            toLabel(field),
            typeof value === "object" && value !== null
              ? JSON.stringify(value)
              : String(value ?? ""),
          ];
        }),
        styles: {
          fontSize: 9,
          cellPadding: 4,
          valign: "top",
        },
        headStyles: {
          fillColor: [26, 82, 118],
          textColor: 255,
        },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 400 },
        },
        margin: { left: 24, right: 24 },
        pageBreak: "auto",
      });
    });
  }

  doc.save(`kyc-export_${fileStamp}.pdf`);
};
