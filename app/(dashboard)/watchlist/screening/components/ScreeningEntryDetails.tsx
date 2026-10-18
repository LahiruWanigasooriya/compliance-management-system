"use client";

import { Select as AntdSelect } from "antd";
import { ICONS } from "@/constants/constants";
import { convertDate } from "@/utils/convertDate";
import { ExtendedScreening, Screening } from "@/types/aml/screening";
import { getNameByCode } from "@/utils/aml/getNameByCode";
import { FiltersResponse } from "@/types/aml/service.types";
import { StatusConfirmationModal } from "@/components/common/ConfirmationModal";
import {
  getCategoryBadgeClasses,
  getRiskBadgeClasses,
  getStatusBadgeClasses,
} from "@/utils/kyc/badgeClasses";
import { submitScreeningReview } from "@/actions/aml.actions";
import { getUsers } from "@/actions/user.actions";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { OTHER_REASON } from "@/utils/kyc/warnings";
import { ReviewStatus } from "@/types/aml/filters";
import type { User } from "@/types/user.types";
import CopyableText from "@/components/common/copyable-text/CopyableText";
import { usePermissions } from "@/hooks/usepermissions";
import { useRouter } from "next/navigation";
import { getStatusOptionLabel, getStatusWithIcon } from "@/utils/statusHelpers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MatchScoreCircle, {
  getMatchScoreVariant,
} from "@/components/ui/MatchScoreCircle";

const buildReasonOptions = (tenantEscalateReasons?: string[]) => {
  const normalized =
    Array.isArray(tenantEscalateReasons) && tenantEscalateReasons.length > 0
      ? tenantEscalateReasons
          .map((reason) => reason.trim())
          .filter((reason) => reason.length > 0 && reason !== OTHER_REASON)
      : [];

  return Array.from(new Set(normalized));
};

const getReasonBucketsFromSettings = (
  tenantSettings?: FiltersResponse["data"]["tenantSettings"],
) => ({
  escalateReasons: buildReasonOptions(tenantSettings?.escalateReasons),
  resolveReasons: buildReasonOptions(tenantSettings?.resolveReasons),
  inProgressReasons: buildReasonOptions(tenantSettings?.inProgressReasons),
  closeReasons: buildReasonOptions(tenantSettings?.closeReasons),
});

const getReasonOptionsForStatus = (
  status: ReviewStatus,
  reasonBuckets: any,
) => {
  let baseReasons: string[] = [];
  if (status === "escalated") {
    baseReasons = reasonBuckets.escalateReasons;
  } else if (status === "in_progress") {
    baseReasons = reasonBuckets.inProgressReasons;
  } else if (status === "resolved") {
    baseReasons = reasonBuckets.resolveReasons;
  } else if (status === "closed") {
    baseReasons = reasonBuckets.closeReasons;
  }
  return Array.from(new Set([...(baseReasons ?? []), OTHER_REASON]));
};

const formatUserName = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map(
      (word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`,
    )
    .join(" ");

interface ScreeningEntryDetailsProps {
  entry: ExtendedScreening;
  filtersResponse: FiltersResponse;
  onReviewSubmitted?: (
    reference: string,
    reviewStatus: string,
    reviewNote: string,
  ) => void;
  onAssigneeUpdated?: (reference: string, user: User | null) => void;
}

export default function ScreeningEntryDetails({
  entry,
  filtersResponse,
  onReviewSubmitted,
  onAssigneeUpdated,
}: ScreeningEntryDetailsProps) {
  const { MapPin, Clock, Building, Shield, AlertTriangle, BarChart3 } = ICONS;
  const router = useRouter();

  const [isReviewing, setIsReviewing] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>(
    entry.reviewStatus as ReviewStatus,
  );
  const reasonBuckets = useMemo(
    () => getReasonBucketsFromSettings(filtersResponse?.data?.tenantSettings),
    [filtersResponse?.data?.tenantSettings],
  );
  const reasonOptions = useMemo(
    () => getReasonOptionsForStatus(reviewStatus, reasonBuckets),
    [reviewStatus, reasonBuckets],
  );
  const reviewStatusOptions = filtersResponse?.data?.reviewStatusOptions ?? [];
  const [reviewDecision] = useState<"" | "clear" | "refer" | "suspend">("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignRoleName, setAssignRoleName] = useState(
    entry?.assignUser?.role?.roleName ?? "",
  );
  const permissions = usePermissions();
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const matchScoreVariant = entry.matchScore
    ? getMatchScoreVariant(entry.matchScore)
    : undefined;

  useEffect(() => {
    setSelectedUserId(entry.assignFor ?? entry.assignUser?.id ?? "");
    setAssignRoleName(entry.assignUser?.role?.roleName ?? "");
    setReviewStatus(entry.reviewStatus as ReviewStatus);
    console.log("chk entry", entry);
  }, [entry]);

  const isOtherReason = selectedReason === OTHER_REASON;
  const isSubmitDisabled =
    isReviewing ||
    !selectedReason ||
    (isOtherReason && !reviewNotes.trim()) ||
    reviewNotes.length > 500;

  const handleReviewUpdateClick = () => {
    if (!entry?.reference) {
      toast.error("Missing screening reference.");
      return;
    }
    if (!selectedReason) {
      setReasonError("Reason is required.");
      return;
    }
    if (isOtherReason && !reviewNotes.trim()) {
      setReviewError("Review notes are required.");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleReviewUpdate = async () => {
    setShowConfirmModal(false);
    if (!entry?.reference) {
      toast.error("Missing screening reference.");
      return;
    }
    if (!selectedReason) {
      setReasonError("Reason is required.");
      return;
    }
    if (isOtherReason && !reviewNotes.trim()) {
      setReviewError("Review notes are required.");
      return;
    }

    const previousStatus = reviewStatus;
    const previousNotes = reviewNotes;
    const previousReason = selectedReason;

    setReasonError("");
    setReviewError("");
    setIsReviewing(true);
    try {
      const response = await submitScreeningReview(entry.reference, {
        review_status: reviewStatus,
        review_notes: reviewNotes.trim(),
        review_decision: reviewDecision,
      });
      if (response.success) {
        toast.success(response.message ?? "Review submitted.");
        setSelectedReason("");
        if (onReviewSubmitted) {
          onReviewSubmitted(entry.reference, reviewStatus, reviewNotes.trim());
        }
      } else {
        setReviewStatus(entry.reviewStatus as ReviewStatus);
        setReviewNotes(entry.reviewNotes || "");
        setSelectedReason("");
        toast.error(response.message ?? "Failed to submit review.");
      }
    } catch (error) {
      setReviewStatus(entry.reviewStatus as ReviewStatus);
      setReviewNotes(entry.reviewNotes || "");
      setSelectedReason("");
      toast.error("Unable to submit review.");
    } finally {
      setIsReviewing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      setUsersLoading(true);
      try {
        const response = await getUsers();
        if (!isMounted) return;
        if (response.success && response.data) {
          setUsers(response.data);
        } else {
          setUsers([]);
          toast.error(response.message ?? "Failed to load assignees.");
        }
      } catch (error) {
        if (isMounted) {
          setUsers([]);
          toast.error("Unable to load assignees.");
        }
      } finally {
        if (isMounted) {
          setUsersLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAssignUserChange = async (value?: string | string[]) => {
    if (!entry?.reference) {
      toast.error("Missing screening reference.");
      return;
    }

    const userId = Array.isArray(value) ? value[0] : value;
    const previousUserId = selectedUserId;
    const previousRoleName = assignRoleName;
    const newSelectedUserId = userId ?? "";
    setSelectedUserId(newSelectedUserId);
    setIsAssigning(true);
    try {
      const response = await submitScreeningReview(entry.reference, {
        assigned_for: userId ?? undefined,
      });
      if (response.success) {
        toast.success(response.message ?? "Assignee updated.");
        const selectedUser =
          userId && users.length > 0
            ? (users.find((user) => user.id === userId) ?? null)
            : null;
        const newRoleName = selectedUser?.role ?? "";
        setAssignRoleName(newRoleName);
        onAssigneeUpdated?.(entry.reference, selectedUser);
      } else {
        toast.error(response.message ?? "Failed to update assignee.");
        setSelectedUserId(previousUserId);
        setAssignRoleName(previousRoleName);
      }
    } catch (error) {
      toast.error("Unable to update assignee.");
      setSelectedUserId(previousUserId);
      setAssignRoleName(previousRoleName);
    } finally {
      setIsAssigning(false);
    }
  };

  const currentReviewStatusLabel =
    reviewStatusOptions.find((option) => option.value === reviewStatus)
      ?.label ?? reviewStatus;

  return (
    <div className="">
      {/* Header */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">
              Screening Entry Details
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
                <h1 className="text-2xl font-bold text-foreground">
                  {entry.fullName || `${entry.firstName} ${entry.lastName}`}
                </h1>
                <span className={getStatusBadgeClasses(reviewStatus || "")}>
                  {getStatusWithIcon(
                    getNameByCode(
                      filtersResponse?.data?.reviewStatusOptions ?? [],
                      reviewStatus,
                    ) || "N/A",
                  )}
                </span>
                <span
                  className={`capitalize ${getRiskBadgeClasses(entry.riskLevel)}`}
                >
                  Risk:{" "}
                  {getNameByCode(
                    filtersResponse?.data?.riskLevelOptions ?? [],
                    entry.riskLevel,
                  )}
                </span>
                <span className={getCategoryBadgeClasses()}>
                  {entry.categoryDisplay}
                </span>
              </div>
              <div className="text-muted-foreground flex items-center gap-1 flex-wrap">
                <CopyableText
                  text={entry.reference}
                  textClassName="text-muted-foreground"
                />
                <span>|</span>
                <ICONS.Building size={15} />
                <span>{entry.entityType || "Individual"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Entity Information */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield size={20} />
              Entity Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Full Name:</p>
                <p className="font-medium">
                  {entry.fullName ||
                    `${entry.firstName} ${entry.middleName || ""} ${entry.lastName}`.trim()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Date of Birth:
                </p>
                <p className="font-medium">{entry.dob || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Category:</p>
                <p className="font-medium">{entry.categoryDisplay}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Risk Level:
                </p>
                <p className="font-medium capitalize">
                  {getNameByCode(
                    filtersResponse?.data?.riskLevelOptions ?? [],
                    entry.riskLevel,
                  ) || entry.riskLevel}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Countries:</p>
                <p className="font-medium">
                  {entry.countries?.join(", ") || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Screened At:
                </p>
                <p className="font-medium">
                  {convertDate(
                    entry.screenedAt || entry.addedDate,
                    "YYYY-MM-DD HH:mm:ss",
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Screening Results */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.Search size={20} />
              Screening Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Side: Hits Statistics */}
              <div className="grid grid-cols-2 gap-4">
                {/* Total Hits: Full Width of Left Side */}
                <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-2xl text-center col-span-2 flex flex-col justify-center items-center">
                  <p className="text-4xl font-extrabold text-blue-600 leading-none">
                    {entry.totalHits || entry.hitsCount || 0}
                  </p>
                  <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest">
                    Total Hits
                  </p>
                </div>

                {/* External Hits */}
                <div className="p-6 bg-orange-50/30 border border-orange-100 rounded-2xl text-center flex flex-col justify-center items-center">
                  <p className="text-3xl font-bold text-orange-600 leading-none">
                    {entry.externalHitsCount || 0}
                  </p>
                  <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-tighter">
                    External Hits
                  </p>
                </div>

                {/* Internal Hits */}
                <div className="p-6 bg-red-50/30 border border-red-100 rounded-2xl text-center flex flex-col justify-center items-center">
                  <p className="text-3xl font-bold text-red-600 leading-none">
                    {entry.internalHitsCount || 0}
                  </p>
                  <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-tighter">
                    Internal Hits
                  </p>
                </div>
              </div>

              {/* Right Side: Match Score (Full Height) */}
              {matchScoreVariant && entry.matchScore && (
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-white dark:bg-transparent h-full min-h-[200px]">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-4">
                    Match Score
                  </p>

                  {/* Circular Progress */}
                  <MatchScoreCircle
                    score={entry.matchScore}
                    progressColor={matchScoreVariant.progressColor}
                    trackColor={matchScoreVariant.trackColor}
                    textClassName={matchScoreVariant.textClassName}
                    className="relative mb-4 w-24 h-24"
                  />

                  {/* Risk Badge */}
                  <div className={matchScoreVariant.badgeClasses}>
                    {matchScoreVariant.label}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Declined Information */}
          {entry.declinedReason && (
            <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ICONS.AlertTriangle size={20} className="text-red-500" />
                Declined Information
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Declined Reason:
                  </p>
                  <p className="text-sm text-foreground bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                    {entry.declinedReason}
                  </p>
                </div>
                {entry.declinedCodes && entry.declinedCodes.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Declined Codes:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {entry.declinedCodes.map((code, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium dark:bg-red-900/30 dark:text-red-300"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Internal Watchlist Matches */}
          {entry.internalWatchlist?.hasMatches &&
            entry.internalWatchlist.matches && (
              <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ICONS.Users size={20} />
                  Internal Watchlist Matches
                </h2>
                <div className="space-y-4">
                  {entry.internalWatchlist.matches.map((match, index) => (
                    <div
                      key={index}
                      className="border border-panel-border rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {match.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {match.categoryDisplay} • DOB: {match.dob || "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                              match.riskLevel === "critical"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                : match.riskLevel === "high"
                                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                                  : match.riskLevel === "medium"
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            }`}
                          >
                            {match.riskLevel} Risk
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Match Score
                          </p>
                          <p className="font-medium">{match.matchScore}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Match Type
                          </p>
                          <p className="font-medium capitalize">
                            {match.matchType}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Matched Fields
                          </p>
                          <p className="font-medium">
                            {match.matchedFields?.join(", ") || "N/A"}
                          </p>
                        </div>
                      </div>
                      {match.reason && (
                        <div className="mb-2">
                          <p className="text-xs text-muted-foreground mb-1">
                            Reason:
                          </p>
                          <p className="text-sm text-foreground">
                            {match.reason}
                          </p>
                        </div>
                      )}
                      {match.notes && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Notes:
                          </p>
                          <p className="text-sm text-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            {match.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Match Details */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 size={20} />
              Quick Stats
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                {/* First Row: Full Width */}
                <div className="flex justify-between items-center w-full border-b pb-2">
                  <span className="text-muted-foreground">Total Hits</span>
                  <span className="font-bold text-lg text-foreground">
                    {entry.totalHits ||
                      entry.hitsCount ||
                      entry.matchCount ||
                      0}
                  </span>
                </div>

                {/* Second Row: Two Columns */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">
                      External Hits
                    </span>
                    <span className="font-medium text-sm text-foreground -translate-y-0.75">
                      {entry.externalHitsCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between border-l pl-4">
                    <span className="text-muted-foreground text-xs">
                      Internal Hits
                    </span>
                    <span className="font-medium text-sm text-foreground -translate-y-0.75">
                      {entry.internalHitsCount || 0}
                    </span>
                  </div>
                </div>
              </div>
              {entry.matchScore && (
                <div className="flex justify-between pt-2 border-t border-panel-border">
                  <span className="text-sm text-muted-foreground">
                    Match Score
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {entry.matchScore}%
                  </span>
                </div>
              )}
              {entry.lastMatch && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Last Match
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {entry.lastMatch}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.FileText size={20} />
              Notes & Comments
            </h2>
            <div className="space-y-4">
              {entry.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Entry Notes:
                  </p>
                  <p className="text-sm text-foreground bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    {entry.notes}
                  </p>
                </div>
              )}
              {(entry.reviewNotes || reviewNotes) && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Review Notes:
                  </p>
                  <p className="text-sm text-foreground bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    {reviewNotes || entry.reviewNotes}
                  </p>
                </div>
              )}
              {!entry.notes && !entry.reviewNotes && (
                <p className="text-sm text-muted-foreground italic">
                  No notes available
                </p>
              )}
            </div>
          </div>

          {/* Review Section */}
          {permissions.canUpdateWatchlist && (
            <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ICONS.Edit size={20} />
                Review & Assignment
              </h2>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Review Status
                  </label>
                  <Select
                    value={reviewStatus}
                    onValueChange={(value) => {
                      setReviewStatus(value as ReviewStatus);
                    }}
                  >
                    <SelectTrigger className="w-full h-12 rounded-lg border border-panel-border bg-card px-3 text-sm font-semibold text-foreground">
                      <SelectValue placeholder="Select status">
                        {reviewStatus
                          ? getStatusOptionLabel(
                              reviewStatus,
                              currentReviewStatusLabel,
                            )
                          : "Select status"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent
                      className="bg-card border border-panel-border z-50"
                      position="popper"
                      sideOffset={5}
                    >
                      {reviewStatusOptions.map((option) => (
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
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Reason <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={selectedReason}
                    onChange={(event) => {
                      const value = event.target.value;
                      setSelectedReason(value);
                      setReasonError("");
                      if (value === OTHER_REASON) {
                        setReviewNotes("");
                        return;
                      }
                      if (value) {
                        setReviewNotes(value.trim());
                        setReviewError("");
                        return;
                      }
                      setReviewNotes("");
                    }}
                    className="rounded-lg border border-panel-border px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring bg-card"
                  >
                    <option value="">Select a reason</option>
                    {reasonOptions.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                  {reasonError && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {reasonError}
                    </p>
                  )}
                </div>
                {isOtherReason && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Review Notes <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(event) => {
                        setReviewNotes(event.target.value);
                        if (
                          reviewError &&
                          event.target.value.trim().length > 0
                        ) {
                          setReviewError("");
                        }
                      }}
                      className="w-full rounded-lg border border-panel-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring bg-card"
                      rows={3}
                      placeholder="Add notes for this review..."
                    />
                    <div className="flex justify-end">
                      <span className="text-xs text-muted-foreground">
                        {reviewNotes.length}/500
                      </span>
                    </div>
                    {reviewError && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {reviewError}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 items-end pt-4">
                  <div className="flex gap-2 w-full">
                    <div className="flex flex-col gap-1 w-full">
                      <label className="text-sm font-medium text-muted-foreground">
                        Assign Role
                      </label>
                      <div className="h-full w-full flex justify-start items-center rounded-md border border-panel-border px-3 py-2 text-left truncate capitalize bg-card">
                        <p className="truncate">
                          {assignRoleName || "Unassigned"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <label className="text-sm font-medium text-muted-foreground">
                        Assign User
                      </label>
                      <AntdSelect
                        value={selectedUserId || undefined}
                        onChange={(value) => {
                          if (
                            value === "" ||
                            value === null ||
                            value === undefined
                          )
                            return;
                          void handleAssignUserChange(value);
                        }}
                        style={{ width: "100%" }}
                        allowClear
                        loading={usersLoading}
                        disabled={usersLoading || isAssigning || !users.length}
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

                <div className="flex justify-end">
                  <button
                    className="px-4 py-2 w-full rounded-lg bg-[#1A5276] hover:bg-[#001F3F] text-white text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                    onClick={handleReviewUpdateClick}
                    disabled={isSubmitDisabled}
                  >
                    {isReviewing ? "Updating..." : "Update Review Status"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showConfirmModal && (
        <StatusConfirmationModal
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={handleReviewUpdate}
          isLoading={isReviewing}
          status={reviewStatus}
        />
      )}
    </div>
  );
}
