"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Select } from "antd";
import { ICONS } from "@/constants/constants";
import type { KYCAlertsRecord } from "@/types/kyc/alerts.types";
import { convertDate } from "@/utils/convertDate";
import Loader from "@/components/ui/loader/Loader";
import { VerificationStage } from "@/enums/kyc/verificationStage";
import ValidationWarnings from "../../../../../../components/kyc/ValidationWarnings";
import { getUsers } from "@/actions/user.actions";
import {
  getKYCProofs,
  getKYCAlertRecordById,
  updateAlertStatus,
} from "@/actions/kyc.actions";
import {
  getRiskBadgeClasses,
  getStatusBadgeClasses,
} from "@/utils/kyc/badgeClasses";
import DocumentGallery, {
  DocumentModel,
} from "../../../../../../components/kyc/DocumentGallery";
import { User } from "@/types/user.types";
import { toast } from "sonner";
import { calculateAge } from "@/utils/calculateAge";
import CopyableText from "@/components/common/copyable-text/CopyableText";
import KYCStatusModal from "../../../../../../components/kyc/KYCStatusModal";
import KYCAlertStatusModal from "../../../../../../components/kyc/KYCAlertStatusModal";
import { AlertStatus } from "@/enums/kyc/AlertStatus";
import { KycStatus } from "@/enums/kyc/kycStatus";
import { getStatusWithIcon } from "@/utils/statusHelpers";
import { usePermissions } from "@/hooks/usepermissions";

interface KYCRecordDetailProps {
  recordId: string;
  initialData: KYCAlertsRecord;
}

export default function KYCRecordDetail({
  recordId,
  initialData,
}: Readonly<KYCRecordDetailProps>) {
  const router = useRouter();
  const [record, setRecord] = useState<KYCAlertsRecord | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<DocumentModel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>(
    initialData.assignedUser?.id ?? "",
  );
  const [assignRoleName, setAssignRoleName] = useState(
    initialData.assignedUser?.role?.roleName ?? "",
  );
  const [isAssigning, setIsAssigning] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isAlertStatusModalOpen, setIsAlertStatusModalOpen] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const permissions = usePermissions();
  const formatUserName = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map(
        (word) =>
          `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`,
      )
      .join(" ");

  const handleAssignUserChange = async (
    value?: string | string[],
  ): Promise<boolean> => {
    const userId = Array.isArray(value) ? value[0] : value;
    const previousUserId = selectedUserId;
    const previousRoleName = assignRoleName;
    const previousRecord = record;

    if (!record) {
      return true;
    }

    setIsAssigning(true);
    const response = await updateAlertStatus({
      alertId: record.id,
      status: record.status,
      assigneeForId: userId,
    });

    if (response.success) {
      const selectedUser =
        userId && users.length > 0
          ? (users.find((user) => user.id === userId) ?? null)
          : null;
      setSelectedUserId(userId ?? "");
      setRecord((prev) =>
        prev && prev.id === record.id
          ? {
              ...prev,
              assignedFor: selectedUser?.id ?? null,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              assignedUser: (selectedUser || undefined) as any,
            }
          : prev,
      );
      setAssignRoleName(selectedUser?.role ?? "");
      toast.success("Assignee updated successfully.");
      setIsAssigning(false);
      return true;
    } else {
      toast.error(response.message ?? "Failed to update alert status.");
      setSelectedUserId(previousUserId);
      setAssignRoleName(previousRoleName);
      if (previousRecord) {
        setRecord(previousRecord);
      }
      setIsAssigning(false);
    }

    return false;
  };

  const loadRecordAndProofs = async (kycRecordId: string) => {
    setLoading(true);
    setDocsLoading(true);
    try {
      const [recordResponse, usersResponse] = await Promise.all([
        getKYCAlertRecordById(kycRecordId),
        getUsers({ limit: 100 }),
      ]);

      if (!recordResponse.success || !recordResponse.data) {
        setRecord(null);
        setDocs([]);
        return;
      }

      if (!usersResponse.success || !usersResponse.data) {
        setUsers([]);
      } else {
        setUsers(usersResponse.data);
      }

      const recordData = recordResponse.data;
      setRecord(recordData);
      setSelectedUserId(recordData.assignedUser?.id ?? "");

      const proofsResponse = recordData.kyc?.id
        ? await getKYCProofs(recordData.kyc.id)
        : { success: true, data: [] };

      setDocs(proofsResponse.success ? proofsResponse.data : []);
    } catch {
      setRecord(null);
      setDocs([]);
    } finally {
      setLoading(false);
      setDocsLoading(false);
    }
  };

  // Load users on mount
  useEffect(() => {
    const loadUsers = async () => {
      const usersResponse = await getUsers({ limit: 100 });
      if (usersResponse.success && usersResponse.data) {
        setUsers(usersResponse.data);
      }
    };
    void loadUsers();
  }, []);

  useEffect(() => {
    if (!record || !users.length) {
      return;
    }
    setSelectedUserId(record.assignedUser?.id ?? "");
  }, [record, users]);

  useEffect(() => {
    if (!record) {
      setAssignRoleName("");
      return;
    }
    const assigned = record.assignedUser;
    // Prefer explicit role name from the assigned user's role object
    let roleName = assigned?.role?.roleName;
    // Fallback: derive role name from users list if only roleId is present
    if (!roleName && assigned?.id && users.length) {
      const matched = users.find((u) => u.id === assigned.id);
      roleName = matched?.role;
    }
    setAssignRoleName(roleName ?? "");
  }, [record, users]);

  // Load proofs on initial mount and whenever the underlying KYC id changes
  useEffect(() => {
    const fetchProofs = async () => {
      setDocsLoading(true);
      try {
        const proofsResponse = record?.kyc?.id
          ? await getKYCProofs(record.kyc.id)
          : { success: true, data: [] };
        setDocs(proofsResponse.success ? proofsResponse.data : []);
      } finally {
        setDocsLoading(false);
      }
    };
    void fetchProofs();
  }, [record?.kyc?.id]);

  const handleRefresh = async () => {
    setIsRefetching(true);
    await loadRecordAndProofs(recordId);
    setIsRefetching(false);
  };

  const handleStatusUpdated = () => {
    handleRefresh();
    setIsStatusModalOpen(false);
  };

  const handleAlertStatusUpdate = async (
    _record: KYCAlertsRecord,
    status: AlertStatus,
    meta?: {
      reason?: string;
      warnings?: {
        document: Record<string, string>;
        address: Record<string, string>;
        face: Record<string, string>;
      };
    },
  ): Promise<boolean> => {
    if (!record) return false;

    const response = await updateAlertStatus({
      alertId: record.id,
      status,
      reason: meta?.reason,
    });

    if (response.success) {
      toast.success("Alert status updated successfully.");
      await handleRefresh();
      return true;
    } else {
      toast.error(response.message ?? "Failed to update alert status.");
      return false;
    }
  };

  // Proof type labels (used for mapping document types to labels)
  // const _proofTypeLabels = [
  //   { type: "document", label: "Primary ID" },
  //   { type: "additional_document", label: "Primary ID (Back)" },
  //   { type: "document_two", label: "Secondary ID" },
  //   { type: "additional_document_two", label: "Secondary ID (Back)" },
  // ];

  const detailFullName = record
    ? [record.kyc.firstName, record.kyc.middleName, record.kyc.lastName]
        .filter(Boolean)
        .join(" ")
    : "";

  const detailDobLabel = record?.kyc.dob
    ? convertDate(record.kyc.dob, "Month Day, Year")
    : "DOB not provided";

  const verificationSteps = record
    ? [
        {
          label: "ID",
          verified: record.kyc.idVerified,
          stage: VerificationStage.ID_VERIFICATION,
          order: 0,
        },
        {
          label: "Address",
          verified: record.kyc.addressVerified,
          stage: VerificationStage.ADDRESS_VERIFICATION,
          order: 1,
        },
        {
          label: "Face",
          verified: record.kyc.faceVerified,
          stage: VerificationStage.FACE_VERIFICATION,
          order: 2,
        },
      ]
    : [];

  const sortedVerificationSteps = [...verificationSteps].sort((a, b) => {
    const verifiedDiff = Number(b.verified) - Number(a.verified);
    return verifiedDiff || a.order - b.order;
  });

  const isKYCStatusBtnDisable = false;
  const { CheckCircle, XCircle, Mail, MapPinHouse, Calendar } = ICONS;

  if (loading || !record) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="28" stroke="4" speed="3.5" />
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      {/* <div className="bg-card rounded-xl border border-panel-border shadow-sm p-5 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <ICONS.ChevronLeft size={20} />
            </button>
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">
                  KYC Alert Details
                </h1>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-foreground capitalize">
                  {detailFullName || "Unknown"}
                </h1>
              </div>
              <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <strong>Alert ID:</strong>{" "}
                  <CopyableText
                    text={record.id}
                    textClassName="text-muted-foreground"
                  />
                  <span>|</span>
                  <strong>KYC ID:</strong>{" "}
                  <CopyableText
                    text={record.id}
                    textClassName="text-muted-foreground"
                  />
                </span>
                <span className="text-muted-foreground">|</span>
                <span className="flex items-center gap-1">
                  <ICONS.Calendar size={14} />
                  Created:{" "}
                  {convertDate(record.kyc.createdAt, "YYYY-MM-DD HH:mm:ss")}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={getStatusBadgeClasses(record.kyc.status)}>
                  {getStatusWithIcon(record.kyc.status, {
                    labelPrefix: "KYC:",
                  })}
                </span>
                <span className={getStatusBadgeClasses(record.status)}>
                  {getStatusWithIcon(record.status, { labelPrefix: "Alert:" })}
                </span>
                {record.risk && (
                  <span className={`${getRiskBadgeClasses(record.risk)}`}>
                    Risk: {record.risk}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefetching}
              className="p-2.5 rounded-lg border border-border bg-card hover:bg-card-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground"
              title="Refresh data"
            >
              <RefreshCw
                size={18}
                className={isRefetching ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
      </div> */}
      {/* Header */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">
              KYC Alert Details
            </h1>
          </div>

          <div className="flex items-start gap-3 mt-8">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors mt-1 cursor-pointer"
            >
              <ICONS.ChevronLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-2xl font-bold text-foreground capitalize">
                  {detailFullName || "Unknown"}
                </h1>
                <span className={getStatusBadgeClasses(record.kyc.status)}>
                  {getStatusWithIcon(record.kyc.status, {
                    labelPrefix: "KYC:",
                  })}
                </span>
                <span className={getStatusBadgeClasses(record.status)}>
                  {getStatusWithIcon(record.status, { labelPrefix: "Alert:" })}
                </span>
                {record.risk && (
                  <span className={`${getRiskBadgeClasses(record.risk)}`}>
                    Risk: {record.risk}
                  </span>
                )}
              </div>
              <div className="text-muted-foreground flex items-center gap-1 flex-wrap">
                <strong>Alert ID:</strong>{" "}
                <CopyableText
                  text={record.id}
                  textClassName="text-muted-foreground"
                />
                <span>|</span>
                <strong>KYC ID:</strong>{" "}
                <CopyableText
                  text={record.id}
                  textClassName="text-muted-foreground"
                />
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefetching}
          className="p-2.5 rounded-lg cursor-pointer border border-border bg-card hover:bg-card-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground"
          title="Refresh data"
        >
          <RefreshCw size={18} className={isRefetching ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Information */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.User size={20} />
              Applicant Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Full Name:</p>
                <p className="font-medium capitalize">
                  {detailFullName || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Date of Birth:
                </p>
                <p className="font-medium">
                  {detailDobLabel}
                  {record.kyc.dob && ` (Age: ${calculateAge(record.kyc.dob)})`}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email:</p>
                <p className="font-medium">{record.kyc.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Customer ID:
                </p>
                <p className="font-medium">
                  {record?.kyc.riskProfile?.customerId ||
                    record?.kyc.forwardReference ||
                    "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Location:</p>
                <p className="font-medium">{record.kyc.riskProfile?.countryOfResidence || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Created At:
                </p>
                <p className="font-medium">
                  {convertDate(record.kyc.createdAt, "YYYY-MM-DD HH:mm:ss")}
                </p>
              </div>
            </div>
          </div>

          {/* Verification Progress */}
          {sortedVerificationSteps.length > 0 && (
            <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ICONS.Shield size={20} />
                Verification Progress
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {sortedVerificationSteps.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      item.verified
                        ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900"
                        : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900"
                    }`}
                  >
                    {item.verified ? (
                      <CheckCircle
                        size={20}
                        className="text-green-600 dark:text-green-400 shrink-0"
                      />
                    ) : (
                      <XCircle
                        size={20}
                        className="text-red-600 dark:text-red-400 shrink-0"
                      />
                    )}
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {item.label}
                      </p>
                      <p
                        className={`text-xs ${
                          item.verified
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {item.verified ? "Verified" : "Pending"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.MapPin size={20} />
              Contact Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card-secondary">
                <Mail size={18} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {record.kyc.email || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-card-secondary">
                <MapPinHouse
                  size={18}
                  className="text-muted-foreground shrink-0 mt-0.5"
                />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    Residential Address
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {record.kyc.fullAddress || "Not provided"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.FileText size={20} />
              Documents Submitted
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                {record.kyc.proofs.length}
              </span>
            </h2>
            {docsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader size="22" stroke="3" speed="3.5" />
              </div>
            ) : (
              <DocumentGallery docs={docs} />
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Status Overview */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.BarChart3 size={20} />
              Status Overview
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  KYC Status
                </span>
                <span className={getStatusBadgeClasses(record.kyc.status)}>
                  {getStatusWithIcon(record.kyc.status)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Alert Status
                </span>
                <span className={getStatusBadgeClasses(record.status)}>
                  {getStatusWithIcon(record.status)}
                </span>
              </div>
              {record.risk && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Risk Level
                  </span>
                  <span className={getRiskBadgeClasses(record.risk)}>
                    {record.risk}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Documents</span>
                <span className="text-sm font-medium text-foreground">
                  {record.kyc.proofs.length}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.Info size={20} />
              Additional Information
            </h2>
            <div className="space-y-4">
              {record.kyc.supportedDocumentTypes &&
                record.kyc.supportedDocumentTypes.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Document Types:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {record.kyc.supportedDocumentTypes.map(
                        (docType, index) => {
                          const readableType = docType
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase());
                          return (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium dark:bg-blue-900/30 dark:text-blue-300"
                            >
                              {readableType}
                            </span>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}

              {record.kyc.status === KycStatus.DECLINED &&
                record.kyc.declinedReason && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Declined Reason:
                    </p>
                    <p className="text-sm text-foreground bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                      {record.kyc.declinedReason}
                    </p>
                  </div>
                )}

              {record.kyc.status === KycStatus.ACCEPTED &&
                record.kyc.acceptedReason && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Accepted Reason:
                    </p>
                    <p className="text-sm text-foreground bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                      {record.kyc.acceptedReason}
                    </p>
                  </div>
                )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Validation Warnings:
                </p>
                <ValidationWarnings warnings={record.kyc.warnings} />
              </div>

              {record.reason && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Rationale:
                  </p>
                  <p className="text-sm text-foreground bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    {record.reason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Assignment */}
          {permissions.canUpdateKYC && (
            <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ICONS.Users size={20} />
                Assignment
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Assign Role
                  </label>
                  <div className="h-10 flex items-center rounded-lg border border-panel-border px-3 bg-card text-sm font-medium text-foreground">
                    {assignRoleName || "Unassigned"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Assign User
                  </label>
                  <Select
                    value={selectedUserId || undefined}
                    onChange={(value) => {
                      if (value === "" || value === null || value === undefined)
                        return;
                      void handleAssignUserChange(value);
                    }}
                    style={{ width: "100%" }}
                    allowClear
                    loading={isAssigning}
                    disabled={isAssigning || !users.length}
                    placeholder="Select Assignee"
                    size="small"
                    className="rounded-lg border border-panel-border text-sm font-semibold text-foreground bg-card"
                    options={users.map((user) => ({
                      label: formatUserName(user.name) || user.email,
                      value: user.id,
                    }))}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {permissions.canUpdateKYC && (
        <div className="mt-6 flex gap-3 justify-end">
          <button
            className="px-4 py-2 rounded-lg bg-card-secondary text-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-border font-medium text-sm cursor-pointer"
            onClick={() => setIsAlertStatusModalOpen(true)}
          >
            Update Alert Status
          </button>

          <button
            className={`px-4 py-2 rounded-lg transition-colors border font-medium text-sm ${
              isKYCStatusBtnDisable
                ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 border-slate-300 dark:border-slate-700 cursor-not-allowed cursor-pointer"
                : "bg-[#1A5276] hover:bg-[#001F3F] text-white cursor-pointer"
            }`}
            disabled={isKYCStatusBtnDisable}
            onClick={() => setIsStatusModalOpen(true)}
          >
            Update KYC Status
          </button>
        </div>
      )}

      {/* Modals */}
      {isStatusModalOpen && record && (
        <KYCStatusModal
          open={isStatusModalOpen}
          record={record}
          onClose={() => setIsStatusModalOpen(false)}
          onUpdated={handleStatusUpdated}
        />
      )}
      {isAlertStatusModalOpen && record && (
        <KYCAlertStatusModal
          open={isAlertStatusModalOpen}
          record={record}
          onClose={() => setIsAlertStatusModalOpen(false)}
          onSubmit={handleAlertStatusUpdate}
        />
      )}
    </div>
  );
}
