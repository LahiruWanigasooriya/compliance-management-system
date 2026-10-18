"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ICONS } from "@/constants/constants";
import {
  createLocationRequest,
  getLocationRequests,
  cancelLocationRequest,
  resendLocationRequest,
} from "@/actions/geolocation.actions";
import type {
  LocationRequest,
  LocationRequestChannel,
  LocationRequestStatus,
} from "@/types/geolocation.types";
import LoadingOverlay from "@/components/layout/LoadingOverlay";
import ConfirmationModal from "@/components/common/ConfirmationModal";

interface LocationRequestSectionProps {
  customerId: string;
  customerEmail?: string;
  customerPhone?: string;
}

const LocationRequestSection = ({
  customerId,
  customerEmail,
  customerPhone,
}: LocationRequestSectionProps) => {
  const [requests, setRequests] = useState<LocationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null);

  // Form state
  const [channel, setChannel] = useState<LocationRequestChannel>("email");
  const [reason, setReason] = useState("");
  const [email, setEmail] = useState(customerEmail || "");
  const [phone, setPhone] = useState(customerPhone || "");
  const [expiryHours, setExpiryHours] = useState(24);

  useEffect(() => {
    fetchRequests();
  }, [customerId]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await getLocationRequests({
        user_id: customerId,
        limit: 10,
      });
      if (response.success && response.data.requests) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      console.error("Error fetching location requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!channel) return;
    if (channel === "email" && !email) {
      toast.error("Email is required for email channel");
      return;
    }
    if (channel === "sms" && !phone) {
      toast.error("Phone number is required for SMS channel");
      return;
    }

    setCreating(true);
    try {
      const response = await createLocationRequest({
        user_id: customerId,
        channel,
        reason: reason || undefined,
        email: channel === "email" ? email : undefined,
        phone: channel === "sms" ? phone : undefined,
        expiry_hours: expiryHours,
      });

      if (response.success) {
        setShowCreateForm(false);
        setReason("");
        fetchRequests();

        // Show share link
        if (response.data.share_link) {
          toast.success(`Location request created! Link expires at: ${new Date(response.data.token_expiry).toLocaleString()}`);
        }
      } else {
        toast.error(`Failed to create request: ${response.message}`);
      }
    } catch (error) {
      console.error("Error creating location request:", error);
      toast.error("An error occurred while creating the request");
    } finally {
      setCreating(false);
    }
  };

  const handleCancelClick = (requestId: string) => {
    setRequestToCancel(requestId);
    setCancelModalOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!requestToCancel) return;

    setCancelModalOpen(false);
    setActionLoading(requestToCancel);
    try {
      const response = await cancelLocationRequest(requestToCancel);
      if (response.success) {
        fetchRequests();
      } else {
        toast.error(`Failed to cancel: ${response.message}`);
      }
    } catch (error) {
      console.error("Error cancelling request:", error);
    } finally {
      setActionLoading(null);
      setRequestToCancel(null);
    }
  };

  const handleResend = async (requestId: string, reqChannel: LocationRequestChannel) => {
    setActionLoading(requestId);
    try {
      const response = await resendLocationRequest(requestId, {
        email: reqChannel === "email" ? email : undefined,
        phone: reqChannel === "sms" ? phone : undefined,
      });
      if (response.success) {
        toast.success("Notification resent successfully");
        fetchRequests();
      } else {
        toast.error(`Failed to resend: ${response.message}`);
      }
    } catch (error) {
      console.error("Error resending request:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: LocationRequestStatus) => {
    const styles: Record<LocationRequestStatus, string> = {
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      expired: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    };
    return `px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status] || styles.pending}`;
  };

  const getChannelIcon = (ch: LocationRequestChannel) => {
    switch (ch) {
      case "email":
        return <ICONS.Mail size={14} />;
      case "sms":
        return <ICONS.MessageSquare size={14} />;
      case "push":
        return <ICONS.Bell size={14} />;
      default:
        return <ICONS.Send size={14} />;
    }
  };

  return (
    <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ICONS.MapPinHouse size={20} />
          Location Requests
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors cursor-pointer"
        >
          <ICONS.Plus size={16} />
          Request 
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-panel-border">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <ICONS.Send size={16} />
            New Location Request
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Channel Selection */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Notification Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as LocationRequestChannel)}
                className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="push">Push Notification</option>
              </select>
            </div>

            {/* Expiry Hours */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Link Expires In
              </label>
              <select
                value={expiryHours}
                onChange={(e) => setExpiryHours(Number(e.target.value))}
                className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
                <option value={48}>48 hours</option>
                <option value={72}>72 hours</option>
              </select>
            </div>

            {/* Email (shown for email channel) */}
            {channel === "email" && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Phone (shown for SMS channel) */}
            {channel === "sms" && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Reason */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Reason (Optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Periodic verification, High-risk transaction review"
                className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleCreateRequest}
              disabled={creating}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <ICONS.Send size={16} />
                  <span>Send Request</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-panel-border rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Request History */}
      {loading ? (
        <div className="relative py-8 min-h-[100px]">
          <LoadingOverlay loadingText="Loading requests..." />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8">
          <ICONS.MapPinHouse size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-muted-foreground">No location requests yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Click "Request Location" to send a location verification request to this customer
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className={`p-4 rounded-lg border ${
                request.status === "completed"
                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10"
                  : request.status === "pending" || request.status === "sent"
                  ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10"
                  : "border-panel-border bg-gray-50 dark:bg-gray-800"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getChannelIcon(request.channel)}
                  <span className="font-medium capitalize">{request.channel}</span>
                  <span className={getStatusBadge(request.status)}>
                    {request.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {(request.status === "pending" || request.status === "sent") && (
                    <>
                      <button
                        onClick={() => handleResend(request.id, request.channel)}
                        disabled={actionLoading === request.id}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Resend notification"
                      >
                        <ICONS.RefreshCw size={14} />
                      </button>
                      <button
                        onClick={() => handleCancelClick(request.id)}
                        disabled={actionLoading === request.id}
                        className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Cancel request"
                      >
                        <ICONS.X size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p className="font-medium">{formatDateTime(request.created_at)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Expires:</span>
                  <p className="font-medium">{formatDateTime(request.token_expires_at)}</p>
                </div>
                {request.viewed_at && (
                  <div>
                    <span className="text-muted-foreground">Viewed:</span>
                    <p className="font-medium">{formatDateTime(request.viewed_at)}</p>
                  </div>
                )}
                {request.responded_at && (
                  <div>
                    <span className="text-muted-foreground">Responded:</span>
                    <p className="font-medium">{formatDateTime(request.responded_at)}</p>
                  </div>
                )}
              </div>

              {request.reason && (
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="font-medium">Reason:</span> {request.reason}
                </p>
              )}

              {/* Show captured location for completed requests */}
              {request.status === "completed" && request.latitude && request.longitude && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-green-200 dark:border-green-700">
                  <h4 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                    <ICONS.MapPin size={14} />
                    Captured Location
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Coordinates:</span>
                      <p className="font-mono text-xs">
                        {request.latitude.toFixed(6)}, {request.longitude.toFixed(6)}
                      </p>
                    </div>
                    {request.accuracy && (
                      <div>
                        <span className="text-muted-foreground">Accuracy:</span>
                        <p className="font-medium">{request.accuracy.toFixed(0)}m</p>
                      </div>
                    )}
                    {request.country && (
                      <div>
                        <span className="text-muted-foreground">Country:</span>
                        <p className="font-medium">{request.country}</p>
                      </div>
                    )}
                    {request.city && (
                      <div>
                        <span className="text-muted-foreground">City:</span>
                        <p className="font-medium">{request.city}</p>
                      </div>
                    )}
                    {request.position_source && (
                      <div>
                        <span className="text-muted-foreground">Source:</span>
                        <p className="font-medium capitalize">{request.position_source}</p>
                      </div>
                    )}
                    {request.ip_address && (
                      <div>
                        <span className="text-muted-foreground">IP Address:</span>
                        <p className="font-mono text-xs truncate">{request.ip_address}</p>
                      </div>
                    )}
                  </div>
                  {request.formatted_address && (
                    <p className="text-sm mt-2">
                      <span className="text-muted-foreground">Address:</span>{" "}
                      <span className="font-medium">{request.formatted_address}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={cancelModalOpen}
        onCancel={() => {
          setCancelModalOpen(false);
          setRequestToCancel(null);
        }}
        onConfirm={handleCancelConfirm}
        title="Cancel Location Request"
        description="Are you sure you want to cancel this location request?"
        confirmLabel="Cancel Request"
        cancelLabel="Keep Request"
        variant="danger"
      />
    </div>
  );
};

export default LocationRequestSection;
