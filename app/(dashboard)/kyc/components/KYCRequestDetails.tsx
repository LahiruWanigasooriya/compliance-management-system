"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ICONS } from "@/constants/constants";
import { VerificationStage } from "@/enums/kyc/verificationStage";
import { getStatusBadgeClasses } from "@/utils/kyc/badgeClasses";
import { convertDate } from "@/utils/convertDate";
import { calculateAge } from "@/utils/calculateAge";
import { getKYCProofs, getKYCRequestById } from "@/actions/kyc.actions";
import type { KYCRecord } from "@/types/kyc/kyc.types";
import type { DocumentModel } from "../../../../components/kyc/DocumentGallery";
import DocumentGallery from "../../../../components/kyc/DocumentGallery";
import ValidationWarnings from "../../../../components/kyc/ValidationWarnings";
import CopyableText from "../../../../components/common/copyable-text/CopyableText";
import Loader from "../../../../components/ui/loader/Loader";

interface KYCRequestDetailsProps {
  recordId: string;
  initialData: KYCRecord;
}

export default function KYCRequestDetails({
  recordId,
  initialData,
}: Readonly<KYCRequestDetailsProps>) {
  const router = useRouter();
  const [record, setRecord] = useState<KYCRecord | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<DocumentModel[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  const loadRecordAndProofs = async (kycRecordId: string) => {
    setLoading(true);
    setDocsLoading(true);
    try {
      const recordResponse = await getKYCRequestById(kycRecordId);

      if (!recordResponse.success || !recordResponse.data) {
        setRecord(null);
        setDocs([]);
        return;
      }

      const recordData = recordResponse.data;
      setRecord(recordData);

      const proofsResponse = recordData.id
        ? await getKYCProofs(recordData.id)
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

  // Load proofs on initial mount and whenever the record id changes
  useEffect(() => {
    const fetchProofs = async () => {
      setDocsLoading(true);
      try {
        const proofsResponse = record?.id
          ? await getKYCProofs(record.id)
          : { success: true, data: [] };
        setDocs(proofsResponse.success ? proofsResponse.data : []);
      } finally {
        setDocsLoading(false);
      }
    };
    void fetchProofs();
  }, [record?.id]);

  const handleRefresh = async () => {
    setIsRefetching(true);
    await loadRecordAndProofs(recordId);
    setIsRefetching(false);
  };

  const detailFullName = record
    ? [record.firstName, record.middleName, record.lastName]
        .filter(Boolean)
        .join(" ")
    : "";

  const detailDobLabel = record?.dob
    ? convertDate(record.dob, "Month Day, Year")
    : "DOB not provided";

  const detailAge = record?.dob ? calculateAge(record.dob) : null;

  const verificationSteps = record
    ? [
        {
          label: "ID",
          verified: record.idVerified,
          stage: VerificationStage.ID_VERIFICATION,
          order: 0,
        },
        {
          label: "Address",
          verified: record.addressVerified,
          stage: VerificationStage.ADDRESS_VERIFICATION,
          order: 1,
        },
        {
          label: "Face",
          verified: record.faceVerified,
          stage: VerificationStage.FACE_VERIFICATION,
          order: 2,
        },
      ]
    : [];

  const sortedVerificationSteps = [...verificationSteps].sort((a, b) => {
    const verifiedDiff = Number(b.verified) - Number(a.verified);
    return verifiedDiff || a.order - b.order;
  });

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
                  KYC Request Details
                </h1>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-foreground capitalize">
                  {detailFullName || "Unknown"}
                </h1>
              </div>
              <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
                <CopyableText
                  text={record.id}
                  textClassName="text-muted-foreground"
                />
                <span className="text-muted-foreground">|</span>
                <span className="flex items-center gap-1">
                  <ICONS.Calendar size={14} />
                  Created:{" "}
                  {convertDate(record.createdAt, "YYYY-MM-DD HH:mm:ss")}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={getStatusBadgeClasses(record.status)}>
                  {record.status?.toUpperCase()}
                </span>
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
      <div className="mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">
              KYC Request Details
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
                <span className={getStatusBadgeClasses(record.status)}>
                  {record.status?.toUpperCase()}
                </span>
              </div>
              <div className="text-muted-foreground flex items-center gap-1 flex-wrap">
                <CopyableText
                  text={record.id}
                  textClassName="text-muted-foreground"
                />
                <span>|</span>
                <ICONS.Building size={15} />
                <span>KYC Request</span>
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
                <p className="font-medium capitalize">{detailFullName || "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Date of Birth:
                </p>
                <p className="font-medium">
                  {detailDobLabel}
                  {detailAge !== null && ` (Age: ${detailAge})`}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email:</p>
                <p className="font-medium">{record.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Customer ID:
                </p>
                <p className="font-medium">
                  {record?.riskProfile?.customerId ||
                    record?.forwardReference ||
                    "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Location:</p>
                <p className="font-medium">{record.location || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Created At:
                </p>
                <p className="font-medium">
                  {convertDate(record.createdAt, "YYYY-MM-DD HH:mm:ss")}
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
                    {record.email || "N/A"}
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
                    {record.fullAddress || "Not provided"}
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
                {docs.length}
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
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={getStatusBadgeClasses(record.status)}>
                  {record.status?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Documents</span>
                <span className="text-sm font-medium text-foreground">
                  {docs.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm font-medium text-foreground">
                  {convertDate(record.createdAt, "YYYY-MM-DD HH:mm:ss")}
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
              {record.supportedDocumentTypes &&
                record.supportedDocumentTypes.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Document Types:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {record.supportedDocumentTypes.map((docType, index) => {
                        const readableType = docType
                          .replace("_", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase());
                        return (
                          <span
                            key={index}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium dark:bg-green-900/30 dark:text-green-300"
                          >
                            {readableType}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

              {record.declinedReason && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Declined Reason:
                  </p>
                  <p className="text-sm text-foreground bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                    {record.declinedReason}
                  </p>
                </div>
              )}

              {record.acceptedReason && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Accepted Reason:
                  </p>
                  <p className="text-sm text-foreground bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                    {record.acceptedReason}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Validation Warnings:
                </p>
                {record.warnings ? (
                  <ValidationWarnings warnings={record.warnings} />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No warnings available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
