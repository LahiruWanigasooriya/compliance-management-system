/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "antd";
import type { KYCAlertsRecord } from "@/types/kyc/alerts.types";
import { AlertStatus } from "@/enums/kyc/AlertStatus";
import { getKYCPreferences } from "@/actions/kyc.actions";
import { toast } from "sonner";
import ReasonReviewPanel from "@/components/kyc/ReasonReviewPanel";
import { StatusConfirmationModal } from "@/components/common/ConfirmationModal";
import {
  EMPTY_WARNINGS,
  OTHER_REASON,
  entriesFromObject,
  hasDuplicateWarningEntries,
  objectFromEntries,
  parseWarnings,
  type WarningEntry,
} from "@/utils/kyc/warnings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStatusOptionLabel } from "@/utils/statusHelpers";

interface KYCAlertStatusModalProps {
  open: boolean;
  record: KYCAlertsRecord | null;
  onClose: () => void;
  onSubmit: (
    record: KYCAlertsRecord,
    status: AlertStatus,
    meta?: {
      reason?: string;
      warnings?: {
        document: Record<string, string>;
        address: Record<string, string>;
        face: Record<string, string>;
      };
    },
  ) => Promise<boolean>;
  isUpdating?: boolean;
}

export default function KYCAlertStatusModal({
  open,
  record,
  onClose,
  onSubmit,
  isUpdating,
}: KYCAlertStatusModalProps) {
  const [statusValue, setStatusValue] = useState<AlertStatus>(
    AlertStatus.PENDING,
  );
  const [reasons, setReasons] = useState<string[]>([OTHER_REASON]);
  const [selectedReason, setSelectedReason] = useState("");
  const [reasonValue, setReasonValue] = useState("");
  const [documentWarnings, setDocumentWarnings] = useState<WarningEntry[]>([
    { key: "", value: "" },
  ]);
  const [addressWarnings, setAddressWarnings] = useState<WarningEntry[]>([
    { key: "", value: "" },
  ]);
  const [faceWarnings, setFaceWarnings] = useState<WarningEntry[]>([
    { key: "", value: "" },
  ]);
  const [duplicateKeyError, setDuplicateKeyError] = useState("");
  const [localError, setLocalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const alertStatusOptions = [
    { label: "Pending", value: AlertStatus.PENDING },
    { label: "Resolved", value: AlertStatus.RESOLVED },
    { label: "In Progress", value: AlertStatus.IN_PROGRESS },
    { label: "Closed", value: AlertStatus.CLOSED },
    { label: "Escalated", value: AlertStatus.ESCALATED },
  ];

  useEffect(() => {
    if (!open) {
      return;
    }
    setStatusValue(record?.status ?? AlertStatus.PENDING);
    setSelectedReason("");
    setReasonValue("");
    const normalized = parseWarnings(record?.kyc?.warnings ?? null);
    setDocumentWarnings(
      entriesFromObject(normalized.document as Record<string, unknown>),
    );
    setAddressWarnings(
      entriesFromObject(normalized.address as Record<string, unknown>),
    );
    setFaceWarnings(
      entriesFromObject(normalized.face as Record<string, unknown>),
    );
    setDuplicateKeyError("");
    setLocalError("");
  }, [open, record]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isMounted = true;
    const loadPreferences = async () => {
      const response = await getKYCPreferences();
      if (!isMounted) {
        return;
      }

      if (!response.success) {
        setReasons([OTHER_REASON]);
        toast.error(response.message || "Failed to load reason options.");
        return;
      }

      const apiReasons = Array.isArray(response.data?.approve_kyc_reasons)
        ? response.data.approve_kyc_reasons
        : [];
      const normalizedReasons = apiReasons
        .map((reason) => reason.trim())
        .filter((reason) => reason.length > 0);
      const uniqueReasons = Array.from(
        new Set(normalizedReasons.filter((reason) => reason !== OTHER_REASON)),
      );

      setReasons([...uniqueReasons, OTHER_REASON]);
    };

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, [open]);

  const isOtherReason = selectedReason === OTHER_REASON;

  const hasDuplicateWarnings = useMemo(() => {
    return (
      hasDuplicateWarningEntries(documentWarnings) ||
      hasDuplicateWarningEntries(addressWarnings) ||
      hasDuplicateWarningEntries(faceWarnings)
    );
  }, [documentWarnings, addressWarnings, faceWarnings]);

  const hasDuplicateKeys = isOtherReason && hasDuplicateWarnings;
  const reasonForSubmit = isOtherReason
    ? reasonValue.trim()
    : selectedReason.trim();
  const isReasonMissing = reasonForSubmit.length === 0;

  useEffect(() => {
    if (!isReasonMissing) {
      setLocalError("");
    }
  }, [isReasonMissing]);

  useEffect(() => {
    if (hasDuplicateKeys) {
      setDuplicateKeyError("Duplicate keys are not allowed.");
      return;
    }
    setDuplicateKeyError("");
  }, [documentWarnings, addressWarnings, faceWarnings, hasDuplicateKeys]);

  const handleSubmitClick = () => {
    if (!record) {
      return;
    }

    if (isReasonMissing) {
      setLocalError("Reason is required.");
      return;
    }

    if (hasDuplicateKeys) {
      setDuplicateKeyError("Duplicate keys are not allowed.");
      return;
    }

    setShowConfirmModal(true);
  };

  const handleSubmit = async () => {
    setShowConfirmModal(false);
    if (!record) {
      return;
    }

    if (isReasonMissing) {
      setLocalError("Reason is required.");
      return;
    }

    if (hasDuplicateKeys) {
      setDuplicateKeyError("Duplicate keys are not allowed.");
      return;
    }

    setLocalError("");
    const reason = reasonForSubmit;
    const warnings = isOtherReason
      ? {
          document: objectFromEntries(documentWarnings),
          address: objectFromEntries(addressWarnings),
          face: objectFromEntries(faceWarnings),
        }
      : EMPTY_WARNINGS;

    setIsSubmitting(true);
    const success = await onSubmit(record, statusValue, {
      reason: reason || undefined,
      warnings,
    });
    if (success) {
      onClose();
    }
    setIsSubmitting(false);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnHidden
      maskClosable={!isSubmitting}
      width={480}
      className="dark:[&_.ant-modal-close]:!text-[#747780] [&_.ant-modal-container]:!p-0 [&_.ant-modal-body]:bg-white dark:[&_.ant-modal-body]:bg-[#011613] border dark:border-[#373c4a] rounded-md border-gray-200"
      styles={{
        body: {
          padding: 10,
          borderRadius: 7,
          overflow: "hidden",
        },
      }}
    >
      <div className="space-y-4 rounded-lg bg-white px-3 py-2 text-gray-900 dark:bg-[#011613] dark:text-slate-100">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Update Alert Status
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Update the alert status for this KYC record.
          </p>
          {record?.id && (
            <p className="text-xs text-gray-500 mt-1 dark:text-slate-400">
              Alert ID: {record.id}
            </p>
          )}
        </div>

        {localError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {localError}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 dark:text-slate-400">
            Alert Status
          </label>
          <Select
            value={statusValue}
            onValueChange={(value) => setStatusValue(value as AlertStatus)}
            disabled={isSubmitting || isUpdating}
          >
            <SelectTrigger className="w-full h-10 bg-white dark:bg-[#011613] border-gray-300 dark:border-[#373c4a]">
              <SelectValue>
                {(() => {
                  const option = alertStatusOptions.find(
                    (opt) => opt.value === statusValue
                  );
                  return option
                    ? getStatusOptionLabel(option.value, option.label)
                    : statusValue;
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent 
              className="bg-white dark:bg-[#011613] border-gray-300 dark:border-[#373c4a] z-[9999]"
              position="popper"
              sideOffset={5}
            >
              {alertStatusOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  {getStatusOptionLabel(option.value, option.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ReasonReviewPanel
          reasons={reasons}
          selectedReason={selectedReason}
          reasonValue={reasonValue}
          showOtherReasonFields={isOtherReason}
          reasonDisabled={isSubmitting || isUpdating}
          warningsDisabled={isSubmitting}
          duplicateKeyError={duplicateKeyError}
          required
          onReasonSelect={(value) => {
            setSelectedReason(value);
            if (value !== OTHER_REASON) {
              setReasonValue(value);
            } else {
              setReasonValue("");
            }
          }}
          onReasonValueChange={(value) => setReasonValue(value)}
          // documentWarnings={documentWarnings}
          // addressWarnings={addressWarnings}
          // faceWarnings={faceWarnings}
          // onDocumentWarningsChange={setDocumentWarnings}
          // onAddressWarningsChange={setAddressWarnings}
          // onFaceWarningsChange={setFaceWarnings}
        />

        <div className="flex justify-end gap-2">
          <button
            className="cursor-pointer px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors dark:border-[#373c4a] dark:text-slate-300 dark:hover:bg-[#011A04]"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 border rounded-lg transition-all text-sm font-medium cursor-pointer hover:bg-[#001F3F] text-white bg-[#1A5276] dark:bg-[#2a5a5f] dark:hover:bg-[#1f4648] disabled:bg-gray-400 disabled:text-gray-100 dark:disabled:bg-[#182c31] dark:disabled:text-slate-200 disabled:hover:bg-gray-400"
            onClick={(event) => {
              event.currentTarget.blur();
              handleSubmitClick();
            }}
            disabled={
              isSubmitting ||
              isUpdating ||
              !record ||
              hasDuplicateKeys ||
              isReasonMissing
            }
          >
            {isSubmitting || isUpdating ? "Updating..." : "Update Status"}
          </button>
        </div>
      </div>

      {showConfirmModal && (
        <StatusConfirmationModal
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={handleSubmit}
          isLoading={isSubmitting}
          status={statusValue}
        />
      )}
    </Modal>
  );
}
