"use client";

import { useState, useEffect } from "react";
import { ICONS } from "@/constants/constants";
import EDDRequestDialog from "./EDDRequestDialog";
import EDDRequestList from "./EDDRequestList";
import { getEDDRequests, getEDDSummary } from "@/actions/customer-risk.actions";
import type {
  EDDRequest,
  EDDRequestSummary,
} from "@/types/customer-risk.types";
import LoadingOverlay from "@/components/layout/LoadingOverlay";

interface EDDSectionProps {
  profileId: string;
  customerId: string;
  requiresEdd: boolean;
  canUpdateCRPC?: boolean;
}

export default function EDDSection({
  profileId,
  customerId,
  requiresEdd,
  canUpdateCRPC = false,
}: EDDSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requests, setRequests] = useState<EDDRequest[]>([]);
  const [summary, setSummary] = useState<EDDRequestSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const fetchEDDData = async () => {
    setLoading(true);
    try {
      const [requestsResponse, summaryResponse] = await Promise.all([
        getEDDRequests({ profile_id: profileId, limit: showAll ? 100 : 5 }),
        getEDDSummary(profileId),
      ]);

      if (requestsResponse.success) {
        setRequests(requestsResponse.data.records);
      }

      if (summaryResponse.success) {
        setSummary(summaryResponse.data);
      }
    } catch (error) {
      console.error("Error fetching EDD data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEDDData();
  }, [profileId, showAll]);

  const handleSuccess = () => {
    fetchEDDData();
  };

  return (
    <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ICONS.FileText size={20} />
          <h2 className="text-lg font-semibold text-foreground">
            Enhanced Due Diligence
          </h2>
          {requiresEdd && (
            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-300 rounded-full text-xs font-semibold">
              REQUIRED
            </span>
          )}
        </div>
        {canUpdateCRPC && (
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors text-sm font-medium"
          >
            <ICONS.Plus size={16} />
            <span>Request Documents</span>
          </button>
        )}
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-6">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xl font-bold">{summary.total_requests}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300">
              {summary.pending_requests}
            </p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
              {summary.submitted_requests}
            </p>
            <p className="text-xs text-muted-foreground">Submitted</p>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-xl font-bold text-green-700 dark:text-green-300">
              {summary.approved_requests}
            </p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-xl font-bold text-red-700 dark:text-red-300">
              {summary.rejected_requests}
            </p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xl font-bold text-gray-700 dark:text-gray-300">
              {summary.expired_requests}
            </p>
            <p className="text-xs text-muted-foreground">Expired</p>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <p className="text-xl font-bold text-orange-700 dark:text-orange-300">
              {summary.cancelled_requests}
            </p>
            <p className="text-xs text-muted-foreground">Cancelled</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="relative py-8 min-h-[100px]">
          <LoadingOverlay loadingText="Loading requests..." />
        </div>
      )}

      {/* Requests List */}
      {!loading && (
        <>
          <EDDRequestList
            requests={requests}
            onRequestUpdated={handleSuccess}
          />

          {/* Show More/Less Toggle */}
          {requests.length >= 5 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-sm text-primary hover:underline"
              >
                {showAll ? "Show Less" : "Show All Requests"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Request Dialog */}
      <EDDRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        profileId={profileId}
        customerId={customerId}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
