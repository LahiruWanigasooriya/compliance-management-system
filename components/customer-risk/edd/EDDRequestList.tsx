"use client";

import { useState } from "react";
import type { EDDRequest, EDDRequestStatus, UpdateEDDRequest } from "@/types/customer-risk.types";
import { updateEDDRequest } from "@/actions/customer-risk.actions";
import { ICONS } from "@/constants/constants";
import { toast } from "sonner";

interface EDDRequestListProps {
  requests: EDDRequest[];
  onRequestUpdated?: () => void;
}

const statusColors: Record<EDDRequestStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  expired: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
  cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
};

const priorityColors: Record<string, string> = {
  low: "text-gray-600 dark:text-gray-400",
  normal: "text-blue-600 dark:text-blue-400",
  high: "text-orange-600 dark:text-orange-400",
  urgent: "text-red-600 dark:text-red-400",
};

const documentTypeLabels: Record<string, string> = {
  source_of_wealth: "Source of Wealth",
  source_of_funds: "Source of Funds",
  business_purpose: "Business Purpose",
  bank_statement: "Bank Statement",
  tax_return: "Tax Return",
  employment_proof: "Employment Proof",
  address_verification: "Address Verification",
  id_verification: "ID Verification",
  other: "Other",
};

export default function EDDRequestList({ requests, onRequestUpdated }: EDDRequestListProps) {
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [updatingRequest, setUpdatingRequest] = useState<string | null>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStatusUpdate = async (requestId: string, newStatus: EDDRequestStatus) => {
    setUpdatingRequest(requestId);

    try {
      const updateData: UpdateEDDRequest = {
        status: newStatus,
      };

      const response = await updateEDDRequest(requestId, updateData);

      if (response.success) {
        toast.success(`Request ${newStatus} successfully`);
        onRequestUpdated?.();
      } else {
        toast.error(response.message || "Failed to update request");
      }
    } catch (error) {
      toast.error("An error occurred while updating the request");
    } finally {
      setUpdatingRequest(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ICONS.FileText size={48} className="mx-auto mb-2 opacity-30" />
        <p>No EDD requests found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div
          key={request.id}
          className="border border-panel-border rounded-lg bg-card overflow-hidden"
        >
          {/* Request Header */}
          <div
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            onClick={() =>
              setExpandedRequest(expandedRequest === request.id ? null : request.id)
            }
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h4 className="font-semibold">
                  {documentTypeLabels[request.document_type] || request.document_type}
                </h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    statusColors[request.status]
                  }`}
                >
                  {request.status.toUpperCase()}
                </span>
                <span className={`text-xs font-medium ${priorityColors[request.priority]}`}>
                  {request.priority.toUpperCase()} PRIORITY
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Created: {formatDate(request.created_at)}
                {request.due_date && ` • Due: ${formatDate(request.due_date)}`}
              </p>
            </div>
            <ICONS.ChevronRight
              size={20}
              className={`transition-transform ${
                expandedRequest === request.id ? "rotate-90" : ""
              }`}
            />
          </div>

          {/* Expanded Details */}
          {expandedRequest === request.id && (
            <div className="px-4 pb-4 border-t border-panel-border bg-gray-50/50 dark:bg-gray-800/50">
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Requested By:</p>
                  <p className="text-sm font-medium">
                    {request.requested_by_name || request.requested_by || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created:</p>
                  <p className="text-sm">{formatDateTime(request.created_at)}</p>
                </div>
                {request.submitted_at && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Submitted:</p>
                    <p className="text-sm">{formatDateTime(request.submitted_at)}</p>
                  </div>
                )}
                {request.reviewed_at && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reviewed:</p>
                    <p className="text-sm">{formatDateTime(request.reviewed_at)}</p>
                  </div>
                )}
                {request.reviewed_by_name && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reviewed By:</p>
                    <p className="text-sm">{request.reviewed_by_name}</p>
                  </div>
                )}
              </div>

              {request.reason && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-1">Reason:</p>
                  <p className="text-sm">{request.reason}</p>
                </div>
              )}

              {request.description && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1">Description:</p>
                  <p className="text-sm">{request.description}</p>
                </div>
              )}

              {request.review_note && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                    Review Note:
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {request.review_note}
                  </p>
                </div>
              )}

              {request.rejection_reason && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                    Rejection Reason:
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {request.rejection_reason}
                  </p>
                </div>
              )}

              {/* Status Actions */}
              {request.status === "pending" && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleStatusUpdate(request.id, "submitted")}
                    disabled={updatingRequest === request.id}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Mark as Submitted
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(request.id, "cancelled")}
                    disabled={updatingRequest === request.id}
                    className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {request.status === "submitted" && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleStatusUpdate(request.id, "approved")}
                    disabled={updatingRequest === request.id}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(request.id, "rejected")}
                    disabled={updatingRequest === request.id}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
