"use client";
import BackButton from "@/components/common/back-button/BackButton";
import { ICONS } from "@/constants/constants";
import { StatusConfirmationModal } from "@/components/common/ConfirmationModal";
import MatchScoreCircle, {
  getMatchScoreVariant,
} from "@/components/ui/MatchScoreCircle";
import {
  alertTypeLabels,
} from "@/constants/geolocation.constants";
import { useEffect, useState } from "react";

import Link from "next/link";
import {
  ActionOption,
  AlertAction,
  AlertTypes,
  GeoAlertNotes,
} from "@/types/geolocation.types";
import {
  formatLocation,
  getAccuracyRadius,
  getAutonomousSystemNumber,
  parseNotes,
  parseUserAgent,
} from "@/utils/format";
import { convertDate } from "@/utils/convertDate";
import { getUsers } from "@/actions/user.actions";
import { useGeoLocation } from "@/hooks/useGeolocationAlerts";
import { toast } from "sonner";
import LoadingOverlay from "@/components/layout/LoadingOverlay";
import ErrorCard from "@/components/common/error-card/ErrorCard";
import { useGeoLocationRecord } from "@/hooks/useGeolocationRecords";
import DropDown from "@/components/common/dropdown/DropDown";
import dynamic from "next/dynamic";
import CopyableText from "@/components/common/copyable-text/CopyableText";
import { useTenant } from "@/components/providers/tenant.provider";
import { usePermissions } from "@/hooks/usepermissions";
import { User } from "@/types/user.types";
import {
  getRiskBadgeClasses,
  getScoreBadgeClasses,
  getStatusBadgeClasses,
} from "@/utils/kyc/badgeClasses";
import { getStatusOptionLabel, getStatusWithIcon } from "@/utils/statusHelpers";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Dynamically import the map component to avoid SSR issues
const GeoAlertMap = dynamic(() => import("./GeoAlertMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <p className="text-muted-foreground">Loading map...</p>
    </div>
  ),
});

interface AlertDetailsClientProps {
  alertId: string;
}

const AlertDetailClient = ({ alertId }: AlertDetailsClientProps) => {
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [reasonText, setReasonText] = useState<string>("");
  const [resolution, setResolution] = useState<string>("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [statusError, setStatusError] = useState<string>("");
  const [reasonError, setReasonError] = useState<string>("");
  const [resolutionError, setResolutionError] = useState<string>("");
  const [assigneeError, setAssigneeError] = useState<string>("");
  const [isReviewUpdating, setIsReviewUpdating] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [initialStatus, setInitialStatus] = useState<string | null>(null);

  const {
    updateGeoAlertStatusMutation,
    useGeoAlertById,
    actionGeoAlertMutation,
  } = useGeoLocation();

  const { useGeoRecordById } = useGeoLocationRecord();

  const { data, isLoading, error } = useGeoAlertById(alertId);
  const { isSwitchingTenant } = useTenant();

  const selectedAlert = data?.data ?? undefined;

  const { data: geoRecord } = useGeoRecordById(
    selectedAlert?.geolocation_record_id ?? "",
  );
  const geoRecordData = geoRecord?.data ?? undefined;
  const permissions = usePermissions();

  const RESOLUTION_OPTIONS = [
    { id: "threat", value: "confirmed_threat", label: "Confirmed Threat" },
    { id: "other", value: "other", label: "Other" },
  ];

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      setIsUsersLoading(true);
      const response = await getUsers({ limit: 100 });
      if (!isMounted) return;
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        setUsers([]);
      }
      setIsUsersLoading(false);
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedAlert?.status) {
      setSelectedStatus(selectedAlert.status);
      setInitialStatus(selectedAlert.status);
    }
  }, [selectedAlert?.status]);

  const isStatusChanged = selectedStatus !== null && initialStatus !== null && selectedStatus !== initialStatus;

  const actions: ActionOption[] = [
    {
      id: "pending",
      label: "Pending",
      value: "pending",
      dropdownValue: "pending",
    },
    {
      id: "in_progress",
      label: "In Progress",
      value: "in_progress",
      dropdownValue: "in_progress",
    },
    { id: "close", label: "Closed", value: "close", dropdownValue: "closed" },
    {
      id: "escalate",
      label: "Escalated",
      value: "escalate",
      dropdownValue: "escalated",
    },
    {
      id: "resolve",
      label: "Resolved",
      value: "resolve",
      dropdownValue: "resolved",
    },
  ];

  const currentAction = actions.find(
    (action) => action.dropdownValue === selectedStatus,
  );

  const handleReviewStatusChange = (value: string) => {
    setSelectedStatus(value);
    setIsUpdatingStatus(true);

    setReasonText("");
    setResolution("");
    setAssigneeId("");
    setStatusError("");
    setReasonError("");
    setResolutionError("");
    setAssigneeError("");
  };

  // Don't show individual page loader during tenant switch - the global overlay handles it
  if (isLoading && !isSwitchingTenant) {
    return (
      <LoadingOverlay
        className="-inset-4!"
        loadingText="Loading Geo Location Alert..."
      />
    );
  } else if (error || !selectedAlert) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <ErrorCard
          title="Error Loading Geo location Alert"
          description={error?.message ?? "Failed to load Geo location alert"}
        />
      </div>
    );
  }

  const handleGeoAlertAction = async (
    alertId: string,
    action: AlertAction,
    notes: GeoAlertNotes,
  ) => {
    try {
      await actionGeoAlertMutation.mutateAsync({
        alertId,
        action,
        notes,
      });
      toast.success(`Geo alert ${alertId} ${action} successfully.`);
    } catch (error) {
      console.error(`${action} geo alert failed`, error);
      toast.error(`Unable to ${action} geo alert.`);
    }
  };

  const handleReviewUpdateClick = () => {
    setShowConfirmModal(true);
  };

  const handleReviewUpdate = async () => {
    setShowConfirmModal(false);
    if (!selectedStatus) {
      setStatusError("Please select a review status.");
      return;
    }
    const action = actions.find(
      (candidate) => candidate.dropdownValue === selectedStatus,
    );
    if (!action) {
      setStatusError("Invalid status selected.");
      return;
    }

    setStatusError("");
    setReasonError("");
    setResolutionError("");
    setAssigneeError("");

    if (action.value === "pending" || action.value === "in_progress") {
      setIsReviewUpdating(true);
      try {
        await handleUpdateAlertStatus(selectedAlert.id, selectedStatus);
        setIsUpdatingStatus(false);
        setInitialStatus(selectedStatus);
      } finally {
        setIsReviewUpdating(false);
      }
      return;
    }

    const resolutionNeeded = action.value === "resolve";
    const escalatedOrClose =
      action.value === "escalate" || action.value === "close";
    const reasonNeeded =
      escalatedOrClose ||
      (action.value === "resolve" && resolution === "other");
    const assigneeNeeded = action.value === "escalate";

    if (reasonNeeded && !reasonText.trim()) {
      setReasonError("Please provide a reason.");
      return;
    }

    const notes: GeoAlertNotes = {};
    if (reasonText.trim()) {
      notes.reason = reasonText.trim();
    }

    if (resolutionNeeded) {
      if (!resolution) {
        setResolutionError("Please select a resolution.");
        return;
      }
      notes.resolution = resolution;
    }

    if (assigneeNeeded) {
      if (!assigneeId) {
        setAssigneeError("Please select an assignee.");
        return;
      }
      notes.assignee = assigneeId;
    }

    setIsReviewUpdating(true);
    try {
      await handleGeoAlertAction(selectedAlert.id, action.value, notes);
      setIsUpdatingStatus(false);
      setInitialStatus(selectedStatus);
    } finally {
      setIsReviewUpdating(false);
    }
  };

  const handleUpdateAlertStatus = async (alertId: string, status: string) => {
    try {
      await updateGeoAlertStatusMutation.mutateAsync({
        alertId: alertId,
        status: status,
      });
      toast.success(`Geo alert ${alertId} status updated successfully.`);
    } catch (error) {
      console.error("Updating geo alert status failed", error);
      toast.error("Unable to update geo alert status.");
    }
  };

  const toTitleCase = (str: string | null | undefined): string => {
    if (!str) return "N/A";
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return "text-red-600";
    if (score >= 40) return "text-orange-600";
    return "text-green-600";
  };

  const getRiskScoreBg = (score: number) => {
    if (score >= 70) return "bg-red-50 dark:bg-red-900/20";
    if (score >= 40) return "bg-orange-50 dark:bg-orange-900/20";
    return "bg-green-50 dark:bg-green-900/20";
  };

  // Parse device info from provider_response if available
  const getDeviceInfo = () => {
    if (!geoRecordData?.device_id) return null;
    try {
      return {
        deviceId: geoRecordData.device_id || null,
        deviceData: parseUserAgent(geoRecordData.user_agent) || null,
      };
    } catch {
      return null;
    }
  };

  const deviceInfo = getDeviceInfo();

  const formatUserName = (name?: string, email?: string) => {
    if (!name) return email ?? "";
    return name
      .split(" ")
      .filter(Boolean)
      .map(
        (word) =>
          `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`,
      )
      .join(" ");
  };

  return (
    <>
      <div className="">
        {/* Header */}
        <div className="mb-6 flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
          <div className="flex flex-col">
            <div>
              <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">
                Geolocation Alert Details
              </h1>
            </div>

            <div className="flex items-start gap-3 mt-8">
              <BackButton />
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="text-2xl font-bold text-foreground">
                    Alert #{selectedAlert.id.slice(0, 8)}
                  </h1>
                  <span
                    className={getStatusBadgeClasses(selectedAlert?.status)}
                  >
                    {getStatusWithIcon(selectedAlert?.status)}
                  </span>
                  <span
                    className={`${getRiskBadgeClasses(selectedAlert.severity)}`}
                  >
                    {toTitleCase(selectedAlert.severity)}
                  </span>
                  <span className={getScoreBadgeClasses()}>
                    Score: {Math.min(selectedAlert.risk_score, 100)}
                  </span>
                </div>
                <div className="text-muted-foreground flex items-center gap-1 flex-wrap">
                  <CopyableText
                    text={selectedAlert.id}
                    textClassName="text-muted-foreground"
                  />
                  <span>|</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:text-blue-200 dark:bg-blue-900/30 rounded text-xs font-medium">
                    {
                      alertTypeLabels[
                        selectedAlert.alert_type as keyof AlertTypes
                      ]
                    }
                  </span>
                  <span>|</span>
                  {selectedAlert.risk_profile_id ? (
                    <Link
                      href={`/customer-risk/${selectedAlert.risk_profile_id}`}
                      className="inline-flex items-center gap-1"
                    >
                      Customer:{" "}
                      {selectedAlert.customer_name || selectedAlert.user_id}
                      <ICONS.ExternalLink
                        size={12}
                        className="text-muted-foreground"
                      />
                    </Link>
                  ) : (
                    <span className="flex gap-1">
                      {selectedAlert.customer_name ? (
                        <>
                          Customer:{" "}
                          <CopyableText
                            text={selectedAlert.customer_name}
                            textClassName="text-muted-foreground"
                          />
                        </>
                      ) : (
                        <>
                          User:{" "}
                          <CopyableText
                            text={selectedAlert.user_id}
                            textClassName="text-muted-foreground"
                          />
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Risk Assessment Section */}
            <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ICONS.Target size={20} />
                Risk Assessment
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Risk Score Display */}
                <div className={`flex items-center justify-center`}>
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-white dark:bg-transparent h-full w-full min-h-[200px]">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-4">
                      Match Score
                    </p>

                    {/* Circular Progress */}
                    <MatchScoreCircle
                      score={Math.min(selectedAlert.risk_score, 100)}
                      {...getMatchScoreVariant(selectedAlert.risk_score)}
                      className="w-24 h-24 mb-4"
                    />

                    {/* Risk Badge */}
                    <span
                      className={
                        getMatchScoreVariant(selectedAlert.risk_score)
                          .badgeClasses
                      }
                    >
                      {getMatchScoreVariant(selectedAlert.risk_score).label}
                    </span>
                  </div>
                </div>

                {/* Risk Details */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-panel-border">
                    <span className="text-muted-foreground">Severity</span>
                    {/* <span
                      className={`font-medium capitalize ${getRiskScoreColor(selectedAlert.risk_score)}`}
                    >
                      {selectedAlert.severity}
                    </span> */}
                    <span
                      className={`${getRiskBadgeClasses(selectedAlert.severity)}`}
                    >
                      {toTitleCase(selectedAlert.severity)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-panel-border">
                    <span className="text-muted-foreground">Alert Type</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:text-blue-200 dark:bg-blue-900/30 rounded text-xs font-medium">
                      {
                        alertTypeLabels[
                          selectedAlert.alert_type as keyof AlertTypes
                        ]
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-panel-border">
                    <span className="text-muted-foreground">Status</span>
                    <span
                      className={getStatusBadgeClasses(selectedAlert?.status)}
                    >
                      {getStatusWithIcon(selectedAlert?.status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Jurisdiction</span>
                    <span
                      className={`font-medium ${selectedAlert.jurisdiction ? "text-red-600" : "text-green-600"}`}
                    >
                      {selectedAlert.jurisdiction || "None"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Factors */}
              {selectedAlert.risk_factors && (
                <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 mb-2">
                    <ICONS.AlertTriangle size={18} />
                    <span className="font-semibold">Risk Factors</span>
                  </div>
                  <ul className="space-y-1">
                    {parseNotes(selectedAlert.risk_factors).map(
                      (factor, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-orange-600 dark:text-orange-400"
                        >
                          <ICONS.AlertCircle
                            size={14}
                            className="mt-0.5 flex-shrink-0"
                          />
                          <span>{factor}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Location Map Section */}
            <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ICONS.MapPin size={20} />
                Location Map
              </h2>
              {geoRecordData && <GeoAlertMap record={geoRecordData} />}
            </div>

            {/* Geolocation Data Section */}
            <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ICONS.Globe size={20} />
                Geolocation Data
              </h2>

              {/* Current Location Overview */}
              {geoRecordData && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <ICONS.MapPin size={16} className="text-blue-600" />
                    Alert Location
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        IP Address
                      </p>
                      <p className="text-sm font-medium">
                        {geoRecordData.ip_address || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Country</p>
                      <p className="text-sm font-medium">
                        {geoRecordData.country || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Country ISO
                      </p>
                      <p className="text-sm font-medium">
                        {geoRecordData.country_iso || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Timezone</p>
                      <p className="text-sm font-medium">
                        {geoRecordData.timezone || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Latitude</p>
                      <p className="text-sm font-medium">
                        {geoRecordData.latitude || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Longitude</p>
                      <p className="text-sm font-medium">
                        {geoRecordData.longitude || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ASN</p>
                      <p className="text-sm font-medium">
                        {getAutonomousSystemNumber(
                          geoRecordData.provider_response ?? "",
                        ) || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Accuracy Radius
                      </p>
                      <p className="text-sm font-medium">
                        {getAccuracyRadius(
                          geoRecordData.provider_response ?? "",
                        ) || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Network & Provider Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-panel-border">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <ICONS.Network size={14} className="text-purple-600" />
                    Network Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Provider/ISP
                      </span>
                      <span className="text-sm font-medium">
                        {geoRecordData?.provider || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        VPN Detected
                      </span>
                      <span
                        className={`text-sm font-medium ${geoRecordData?.is_vpn ? "text-red-600" : "text-green-600"}`}
                      >
                        {geoRecordData?.is_vpn ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Proxy Detected
                      </span>
                      <span
                        className={`text-sm font-medium ${geoRecordData?.is_proxy ? "text-red-600" : "text-green-600"}`}
                      >
                        {geoRecordData?.is_proxy ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        TOR Detected
                      </span>
                      <span
                        className={`text-sm font-medium ${geoRecordData?.is_tor ? "text-red-600" : "text-green-600"}`}
                      >
                        {geoRecordData?.is_tor ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Anonymizer Status */}
                <div
                  className={`p-4 rounded-lg border ${
                    geoRecordData?.is_vpn ||
                    geoRecordData?.is_proxy ||
                    geoRecordData?.is_tor ||
                    geoRecordData?.is_anonymizer
                      ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                      : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  }`}
                >
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <ICONS.Shield
                      size={14}
                      className={
                        geoRecordData?.is_vpn ||
                        geoRecordData?.is_proxy ||
                        geoRecordData?.is_tor ||
                        geoRecordData?.is_anonymizer
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    />
                    Anonymizer Status
                  </h4>
                  {geoRecordData?.is_vpn ||
                  geoRecordData?.is_proxy ||
                  geoRecordData?.is_tor ||
                  geoRecordData?.is_anonymizer ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ICONS.AlertTriangle
                          size={16}
                          className="text-red-600"
                        />
                        <span className="text-sm font-semibold text-red-600">
                          Anonymizer Detected
                        </span>
                      </div>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        This connection is using{" "}
                        {geoRecordData?.is_tor
                          ? "TOR"
                          : geoRecordData?.is_vpn
                            ? "VPN"
                            : geoRecordData?.is_proxy
                              ? "Proxy"
                              : "ANONYMIZER"}{" "}
                        to mask the real location.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ICONS.CheckCircle
                          size={16}
                          className="text-green-600"
                        />
                        <span className="text-sm font-semibold text-green-600">
                          No Anonymizer Detected
                        </span>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Connection appears to be from a direct IP address.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Compliance Actions Section */}
            <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ICONS.FileText size={20} />
                Compliance & Notes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Assigned To
                  </p>
                  <p className="font-medium">
                    {selectedAlert.assignee
                      ? `${selectedAlert.assignee?.full_name} - ${selectedAlert.assignee?.role_name?.replace("_", " ")}`
                      : "Unassigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Resolution
                  </p>
                  <p className="font-medium">
                    {selectedAlert.resolution || "Pending"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="font-medium">
                    {selectedAlert.notes || "No notes available"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Alert Info Card */}
            <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ICONS.Info size={20} />
                Alert Information
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Alert ID</span>
                  <CopyableText
                    text={selectedAlert.id}
                    textClassName="font-medium text-sm"
                    iconClassName="!translate-y-1"
                  />
                </div>
                {selectedAlert.customer_name && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Customer Name</span>
                    {selectedAlert.risk_profile_id ? (
                      <Link
                        href={`/customer-risk/${selectedAlert.risk_profile_id}`}
                        className="font-medium text-sm inline-flex items-center gap-1"
                      >
                        {selectedAlert.customer_name}
                        <ICONS.ExternalLink
                          size={14}
                          className="text-muted-foreground"
                        />
                      </Link>
                    ) : (
                      <span className="font-medium text-sm">
                        {selectedAlert.customer_name}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">User ID</span>
                  <CopyableText
                    text={selectedAlert.user_id}
                    textClassName="font-medium text-sm"
                    iconClassName="!translate-y-1"
                  />
                  {/* <span className="font-medium text-sm">
                    {selectedAlert.user_id}
                  </span> */}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium text-sm">
                    {convertDate(selectedAlert.created_at, "Month Day, Year")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium text-sm">
                    {convertDate(selectedAlert.updated_at, "Month Day, Year")}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Location Card */}
            <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ICONS.MapPin size={20} />
                Quick Location
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium text-sm">
                    {formatLocation(selectedAlert.location)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">IP Address</span>
                  <span className="font-medium text-sm">
                    {selectedAlert.ip_address}
                  </span>
                </div>
                {geoRecordData && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Country</span>
                      <span className="font-medium text-sm">
                        {geoRecordData.country}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Timezone</span>
                      <span className="font-medium text-sm">
                        {geoRecordData.timezone || "N/A"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Security Status Card */}
            <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ICONS.Shield size={20} />
                Security Status
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">VPN</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase border ${
                      geoRecordData?.is_vpn
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-700 dark:border-red-300"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-700 dark:border-green-300"
                    }`}
                  >
                    {geoRecordData?.is_vpn ? "Detected" : "Clear"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Proxy</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase border ${
                      geoRecordData?.is_proxy
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-700 dark:border-red-300"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-700 dark:border-green-300"
                    }`}
                  >
                    {geoRecordData?.is_proxy ? "Detected" : "Clear"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">TOR</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase border ${
                      geoRecordData?.is_tor
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-700 dark:border-red-300"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-700 dark:border-green-300"
                    }`}
                  >
                    {geoRecordData?.is_tor ? "Detected" : "Clear"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Risk Level
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase border ${
                      selectedAlert.risk_score >= 70
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-700 dark:border-red-300"
                        : selectedAlert.risk_score >= 40
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-700 dark:border-green-300"
                    }`}
                  >
                    {toTitleCase(geoRecordData?.risk_level) || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Device Metadata Section */}
            {deviceInfo && (deviceInfo.deviceId || deviceInfo.deviceData) && (
              <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ICONS.Zap size={20} />
                  Device Information
                </h2>
                <div className="flex flex-col gap-3">
                  {deviceInfo.deviceId && (
                    <div className="flex justify-between items-center gap-1 text-sm">
                      <p className="text-muted-foreground">Device ID</p>
                      <p className="font-medium">{deviceInfo.deviceId}</p>
                    </div>
                  )}
                  {deviceInfo.deviceData && (
                    <div className="flex flex-col gap-3 text-sm">
                      <div className="flex justify-between items-center gap-1">
                        <p className="text-muted-foreground">Device Type</p>
                        <p className="font-medium">
                          {deviceInfo.deviceData.deviceType}
                        </p>
                      </div>
                      <div className="flex justify-between items-center gap-1">
                        <p className="text-muted-foreground">
                          Operating System
                        </p>
                        <p className="font-medium">
                          {deviceInfo.deviceData.os}
                        </p>
                      </div>
                      <div className="flex justify-between items-center gap-1">
                        <p className="text-muted-foreground">Browser</p>
                        <p className="font-medium">
                          {deviceInfo.deviceData.browser}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Event Timeline Card */}
            <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ICONS.Clock size={20} />
                Timeline
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Alert Created</p>
                    <p className="text-xs text-muted-foreground">
                      {convertDate(
                        selectedAlert.created_at,
                        "YYYY-MM-DD HH:mm:ss",
                      )}
                    </p>
                  </div>
                </div>
                {geoRecordData && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Location Recorded</p>
                      <p className="text-xs text-muted-foreground">
                        {convertDate(
                          geoRecordData.created_at,
                          "YYYY-MM-DD HH:mm:ss",
                        )}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-xs text-muted-foreground">
                      {convertDate(
                        selectedAlert.updated_at,
                        "YYYY-MM-DD HH:mm:ss",
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {permissions.canEditGEO && (
              <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <ICONS.Edit size={18} />
                    Review & Assignment
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">
                      Review Status
                    </span>
                    <Select
                      value={selectedStatus || ""}
                      onValueChange={(value) => handleReviewStatusChange(value)}
                    >
                      <SelectTrigger className="w-full h-12 rounded-lg border border-panel-border bg-card px-3 text-sm font-semibold text-foreground">
                        <SelectValue placeholder="Update Alert Status">
                          {selectedStatus
                            ? getStatusOptionLabel(
                                selectedStatus,
                                actions.find(
                                  (action) =>
                                    action.dropdownValue === selectedStatus,
                                )?.label ?? selectedStatus,
                              )
                            : "Update Alert Status"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        sideOffset={5}
                        className="bg-card border border-panel-border z-50"
                      >
                        {actions.map((action) => (
                          <SelectItem
                            key={action.id}
                            value={action.dropdownValue}
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800"
                          >
                            {getStatusOptionLabel(
                              action.dropdownValue,
                              action.label,
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {statusError && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {statusError}
                      </p>
                    )}
                  </div>

                  {isUpdatingStatus && currentAction?.value === "escalate" && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        Assign to <span className="text-red-500">*</span>
                      </span>
                      <DropDown
                        value={assigneeId}
                        selectOptions={
                          isUsersLoading
                            ? ([
                                { id: "loading", name: "Loading..." },
                              ] as User[])
                            : users
                        }
                        getOptionKey={(user) => user.id}
                        getOptionValue={(user) => user.id}
                        getOptionLabel={(user) =>
                          formatUserName(user.name, user.email)
                        }
                        onChange={(value) => {
                          setAssigneeId(value);
                          setAssigneeError("");
                        }}
                        placeholderValue={
                          isUsersLoading
                            ? "Loading assignees..."
                            : "Select assignee"
                        }
                        disabled={isUsersLoading}
                        className="w-full h-12 rounded-lg border border-panel-border! bg-card px-3 text-sm font-semibold text-foreground"
                      />
                      {assigneeError && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {assigneeError}
                        </p>
                      )}
                    </div>
                  )}

                  {isUpdatingStatus && currentAction?.value === "resolve" && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        Resolution
                      </span>
                      <Select
                        value={resolution}
                        onValueChange={(value) => {
                          setResolution(value);
                          setResolutionError("");
                          if (value !== "other") {
                            setReasonText("");
                            setReasonError("");
                          }
                        }}
                      >
                        <SelectTrigger className="w-full h-12 rounded-lg border border-panel-border bg-card px-3 text-sm font-semibold text-foreground">
                          <SelectValue placeholder="Select resolution">
                            {resolution
                              ? getStatusOptionLabel(
                                  resolution,
                                  RESOLUTION_OPTIONS.find(
                                    (option) => option.value === resolution,
                                  )?.label ?? resolution,
                                )
                              : "Select resolution"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          sideOffset={5}
                          className="bg-card border border-panel-border z-50"
                        >
                          {RESOLUTION_OPTIONS.map((option) => (
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
                      {resolutionError && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {resolutionError}
                        </p>
                      )}
                    </div>
                  )}

                  {isUpdatingStatus && (currentAction?.value === "close" ||
                    currentAction?.value === "escalate" ||
                    (currentAction?.value === "resolve" &&
                      resolution === "other")) && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        Reason <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={reasonText}
                        onChange={(event) => {
                          const value = event.target.value.slice(0, 500);
                          setReasonText(value);
                          setReasonError("");
                        }}
                        placeholder="Enter reason"
                        className="w-full rounded-lg border border-panel-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        rows={4}
                      />
                      <div className="flex justify-end">
                        <span className="text-xs text-muted-foreground">
                          {reasonText.length}/500
                        </span>
                      </div>
                      {reasonError && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {reasonError}
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={handleReviewUpdateClick}
                    disabled={isReviewUpdating || !isStatusChanged}
                    className="w-full bg-[#1A5276] hover:bg-[#143F5C] text-white text-sm cursor-pointer font-semibold"
                  >
                    {isReviewUpdating ? "Updating..." : "Update Review Status"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <StatusConfirmationModal
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={handleReviewUpdate}
          isLoading={isReviewUpdating}
          status={selectedStatus}
        />
      )}
    </>
  );
};

export default AlertDetailClient;
