"use client";

import WarningsEditor from "@/components/kyc/WarningsEditor";
import { WarningEntry } from "@/utils/kyc/warnings";

const toTitleCase = (str: string): string => {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export interface ReasonReviewPanelProps {
  label?: string;
  reasons: string[];
  selectedReason: string;
  reasonValue: string;
  showOtherReasonFields: boolean;
  placeholder?: string;
  reasonDisabled?: boolean;
  warningsDisabled?: boolean;
  duplicateKeyError?: string;
  required?: boolean;
  isEnableWarningArea?: boolean;
  onReasonSelect: (value: string) => void;
  onReasonValueChange: (value: string) => void;
  documentWarnings?: WarningEntry[];
  addressWarnings?: WarningEntry[];
  faceWarnings?: WarningEntry[];
  onDocumentWarningsChange?: (warnings: WarningEntry[]) => void;
  onAddressWarningsChange?: (warnings: WarningEntry[]) => void;
  onFaceWarningsChange?: (warnings: WarningEntry[]) => void;
}

export default function ReasonReviewPanel({
  label = "Reason",
  reasons,
  selectedReason,
  reasonValue,
  showOtherReasonFields,
  placeholder = "Add a reason if needed",
  reasonDisabled = false,
  warningsDisabled = false,
  duplicateKeyError,
  required = false,
  isEnableWarningArea = false,
  onReasonSelect,
  onReasonValueChange,
  documentWarnings,
  addressWarnings,
  faceWarnings,
  onDocumentWarningsChange,
  onAddressWarningsChange,
  onFaceWarningsChange,
}: Readonly<ReasonReviewPanelProps>) {
  return (
    <>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1 dark:text-slate-400">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        <select
          value={selectedReason}
          onChange={(event) => onReasonSelect(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-600 dark:border-[#373c4a] dark:bg-[#011613] dark:text-slate-100 dark:focus:ring-slate-400"
          disabled={reasonDisabled}
        >
          <option value="">Select a reason</option>
          {reasons.map((reason) => (
            <option key={reason} value={reason}>
              {toTitleCase(reason)}
            </option>
          ))}
        </select>
      </div>

      {showOtherReasonFields && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 dark:text-slate-400">
              {label} {required && <span className="text-red-400">*</span>}
            </label>
            <textarea
              value={reasonValue}
              onChange={(event) => onReasonValueChange(event.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-600 dark:border-[#373c4a] dark:bg-[#011613] dark:text-slate-100 dark:focus:ring-slate-400"
              placeholder={placeholder}
              disabled={warningsDisabled}
            />
          </div>

          {isEnableWarningArea &&
            documentWarnings &&
            addressWarnings &&
            faceWarnings &&
            onDocumentWarningsChange &&
            onAddressWarningsChange &&
            onFaceWarningsChange &&(
              <WarningsEditor
                documentWarnings={documentWarnings}
                addressWarnings={addressWarnings}
                faceWarnings={faceWarnings}
                onDocumentWarningsChange={onDocumentWarningsChange}
                onAddressWarningsChange={onAddressWarningsChange}
                onFaceWarningsChange={onFaceWarningsChange}
                duplicateKeyError={duplicateKeyError}
                disabled={warningsDisabled}
              />
            )}
        </>
      )}
    </>
  );
}
