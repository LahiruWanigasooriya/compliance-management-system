"use client";

import { useState, useCallback, useId } from "react";
import {
  Upload,
  X,
  CheckCircle,
  FileText,
  Shield,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { uploadInternalWatchlistCSV } from "@/actions/aml.actions";

interface CsvUpload {
  file: File | null;
  fileName: string | null;
}

interface InternalWatchListUploderProps {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
  maxSizeMB?: number;
}

const EMPTY_CSV_STATE: CsvUpload = {
  file: null,
  fileName: null,
};

export default function InternalWatchListUploder({
  onFileSelect,
  disabled = false,
  maxSizeMB = 25,
}: InternalWatchListUploderProps) {
  const [csvUpload, setCsvUpload] = useState<CsvUpload>(EMPTY_CSV_STATE);
  const [isUploading, setIsUploading] = useState(false);
  const id = useId();
  const inputId = `${id}-csv-input`;
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.name.toLowerCase().endsWith(".csv")) {
        toast.error("Please select a CSV file");
        return;
      }

      // Validate file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        toast.error(`File size exceeds ${maxSizeMB}MB limit`);
        return;
      }

      setCsvUpload({
        file,
        fileName: file.name,
      });
      onFileSelect(file);
    },
    [maxSizeMB, onFileSelect],
  );

  const handleClear = useCallback(() => {
    // Reset file input first
    const fileInput = document.getElementById(inputId) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }

    // Then update state
    setCsvUpload(EMPTY_CSV_STATE);
    onFileSelect(null);
  }, [onFileSelect, inputId]);

  const handleContainerClick = useCallback(() => {
    if (!disabled) {
      document.getElementById(inputId)?.click();
    }
  }, [disabled, inputId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && !disabled) {
        e.preventDefault();
        document.getElementById(inputId)?.click();
      }
    },
    [disabled, inputId],
  );

  const handleUpload = useCallback(async () => {
    if (!csvUpload.file) {
      toast.error("Please select a CSV file first");
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadInternalWatchlistCSV(csvUpload.file);

      if (result.success) {
        toast.success(result.message || "CSV uploaded successfully");
        // Clear the upload state after successful upload
        // Reset file input first to prevent onChange triggering
        const fileInput = document.getElementById(inputId) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
        // Then update state without calling onFileSelect again
        setCsvUpload(EMPTY_CSV_STATE);
      } else {
        toast.error(result.message || "Failed to upload CSV");
      }
    } catch (error) {
      toast.error("An error occurred while uploading");
    } finally {
      setIsUploading(false);
    }
  }, [csvUpload.file, inputId]);

  const handleDownloadTemplate = useCallback(() => {
    const csvContent = `tenant_id,customer_id,first_name,middle_name,last_name,full_name,dob,nationality,country,identification_number,reason,risk_level,category,notes,expires_at
tenant-123,CUST-001,John,Michael,Doe,John Michael Doe,5/15/1980,US,United States,SSN-123-45-6789,Convicted of wire fraud in multiple jurisdictions,critical,fraud,Previous conviction in 2019. Released in 2023. High recidivism risk.,12/31/2025
tenant-123,CUST-002,Maria,Isabel,Rodriguez,Maria Isabel Rodriguez,3/22/1975,MX,Mexico,CURP-MIR750322,Former government official - potential conflict of interest,high,pep,Served as Deputy Finance Minister 2015-2020. Close ties to current administration.,`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "internal_watchlist_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Template downloaded successfully");
  }, []);

  const handleClearClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleClear();
    },
    [handleClear],
  );

  return (
    <div className={`w-full ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <label
          id={labelId}
          htmlFor={inputId}
          className="flex items-center gap-2 font-bold text-foreground"
        >
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          Internal Watchlist CSV
        </label>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Download Template
        </button>
      </div>

      <div
        className={`
          group relative rounded-2xl transition-all duration-300 overflow-hidden
          ${
            csvUpload.file
              ? "bg-linear-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 border-2 border-emerald-400 dark:border-emerald-500/50"
              : "bg-linear-to-r from-gray-50 to-white dark:from-gray-700/30 dark:to-gray-800/30 border-2 border-dashed border-gray-300 dark:border-gray-600"
          }
        `}
      >
        <input
          id={inputId}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="sr-only"
          disabled={disabled}
          aria-describedby={descriptionId}
        />

        {csvUpload.file ? (
          <div className="relative p-4">
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full shadow-lg">
              <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Uploaded</span>
            </div>

            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="w-16 h-16 text-emerald-500 mb-4" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {csvUpload.fileName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {(csvUpload.file.size / 1024).toFixed(1)} KB
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpload();
                }}
                disabled={isUploading}
                className="mt-4 flex items-center gap-2 px-4 py-2 cursor-pointer px-4 py-2 rounded-lg hover:bg-[#001F3F] text-white bg-[#1A5276] dark:bg-[#2a5a5f] dark:hover:bg-[#1f4648] text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-100 dark:disabled:bg-[#182c31] dark:disabled:text-slate-200 disabled:hover:bg-gray-400"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload CSV
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleClearClick}
              aria-label="Remove CSV file"
              className="absolute top-3 right-3 p-2  cursor-pointer bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 min-h-[180px]">
            <button
              type="button"
              onClick={handleContainerClick}
              disabled={disabled}
              className={`relative mb-4 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-2xl`}
            >
              <div
                className="absolute inset-0 bg-primary/20 dark:bg-blue-500/20 rounded-full animate-ping opacity-0 group-hover:opacity-100"
                style={{ animationDuration: "2s" }}
                aria-hidden="true"
              />
              <div className="relative p-4 bg-primary/10 dark:bg-blue-500/20 rounded-2xl hover:bg-primary/20 dark:hover:bg-blue-500/30 transition-colors">
                <Upload
                  className="w-8 h-8 text-primary dark:text-blue-400"
                  aria-hidden="true"
                />
              </div>
            </button>

            <p className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
              Click to upload CSV
            </p>
            <p
              id={descriptionId}
              className="text-sm text-gray-500 dark:text-gray-400 text-center mb-2"
            >
              Upload your Internal Watchlist CSV file
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
              CSV only (max {maxSizeMB}MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
