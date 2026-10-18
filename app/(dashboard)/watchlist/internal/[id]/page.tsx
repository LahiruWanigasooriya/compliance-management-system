"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { InternalWatchlistEntry } from "@/types/aml/screening";
import { getNameByCode } from "@/utils/aml/getNameByCode";
import {
  getCategoryBadgeClasses,
  getRiskBadgeClasses,
  getActiveBadgeClasses,
} from "@/utils/kyc/badgeClasses";
import Loader from "@/components/ui/loader/Loader";
import { convertDate } from "@/utils/convertDate";
import CopyableText from "@/components/common/copyable-text/CopyableText";
import { ICONS } from "@/constants/constants";
import { useWatchlistFilters } from "@/hooks/useWatchlist";
import { calculateAge } from "@/utils/calculateAge";
import { fetchWatchlistEntry } from "@/actions/aml.actions";

export default function InternalWatchlistEntryPage() {
  const params = useParams();
  const router = useRouter();
  const entryId = params.id as string;

  const [entryData, setEntryData] = useState<InternalWatchlistEntry | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const { filtersResponse, isLoading: isLoadingFilters } = useWatchlistFilters(
    {},
  );

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetchWatchlistEntry(entryId);
        if (response.success && response.data) {
          setEntryData(response.data.screening);
        } else {
          toast.error(response.message ?? "Failed to load entry details");
          router.back();
        }
      } catch (error) {
        toast.error("An error occurred while loading entry details");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    if (entryId) {
      fetchData();
    }
  }, [entryId, router]);

  if (isLoading || isLoadingFilters) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader />
        <p className="mt-4 text-sm text-muted-foreground">
          Loading entry details...
        </p>
      </div>
    );
  }

  if (!entryData) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        Entry not found.
      </div>
    );
  }

  const allRiskLevels = filtersResponse?.data?.riskLevelOptions || [];

  return (
    <div className="">
      {/* Header */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">
              Internal Watchlist Entry
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
                  {entryData.fullName ||
                    `${entryData.firstName} ${entryData.middleName || ""} ${entryData.lastName}`.trim()}
                </h1>
                <span className={getCategoryBadgeClasses()}>
                  {entryData.category}
                </span>
                <span className={getRiskBadgeClasses(entryData.riskLevel)}>
                  Risk:{" "}
                  {getNameByCode(allRiskLevels, entryData.riskLevel) ||
                    entryData.riskLevel}
                </span>
                {(entryData as any).isActive && (
                  <span
                    className={getActiveBadgeClasses(
                      (entryData as any).isActive,
                    )}
                  >
                    {(entryData as any).isActive ? "Active" : "Inactive"}
                  </span>
                )}
              </div>
              <div className="text-muted-foreground flex items-center gap-1 flex-wrap">
                <span>REF:</span>
                <CopyableText
                  text={entryData.id}
                  textClassName="text-muted-foreground"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.User size={20} />
              Personal Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Full Name</span>
                <p className="font-medium text-foreground">
                  {entryData.fullName ||
                    `${entryData.firstName} ${entryData.middleName || ""} ${entryData.lastName}`.trim()}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  Date of Birth
                </span>
                <p className="font-medium text-foreground">
                  {entryData.dob
                    ? convertDate(entryData.dob, "Month Day, Year")
                    : "N/A"}
                  {entryData.dob && ` (Age: ${calculateAge(entryData.dob)})`}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  Nationality
                </span>
                <p className="font-medium text-foreground">
                  {(entryData as any).nationality || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Country</span>
                <p className="font-medium text-foreground">
                  {entryData.country || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  Customer ID
                </span>
                <p className="font-medium text-foreground">
                  {entryData.customerId || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  Identification Number
                </span>
                <p className="font-medium text-foreground">
                  {(entryData as any).identificationNumber || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Watchlist Details */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.AlertTriangle size={20} />
              Watchlist Details
            </h4>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-muted-foreground">Reason</span>
                <p className="font-medium text-foreground mt-1">
                  {entryData.reason || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Notes</span>
                <p className="text-foreground mt-1">
                  {entryData.notes || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Added By</span>
                <p className="font-medium text-foreground mt-1">
                  {(entryData as any).addedBy || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  Reviewed By
                </span>
                <p className="font-medium text-foreground mt-1">
                  {(entryData as any).reviewedBy || "Not reviewed"}
                </p>
              </div>
              {(entryData as any).reviewedAt && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    Reviewed At
                  </span>
                  <p className="font-medium text-foreground mt-1">
                    {convertDate(
                      (entryData as any).reviewedAt,
                      "YYYY-MM-DD HH:mm:ss",
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* System Information */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.Settings size={20} />
              System Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {(entryData as any).tenantId && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    Tenant ID
                  </span>
                  <p className="font-medium text-foreground font-mono text-xs">
                    {(entryData as any).tenantId}
                  </p>
                </div>
              )}
              {(entryData as any).id && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    Entry ID
                  </span>
                  <p className="font-medium text-foreground">{entryData.id}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Entry Status */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.Info size={20} />
              Entry Status
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Risk Level
                </span>
                <span className={getRiskBadgeClasses(entryData.riskLevel)}>
                  {getNameByCode(allRiskLevels, entryData.riskLevel) ||
                    entryData.riskLevel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className={getCategoryBadgeClasses()}>
                  {entryData.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span
                  className={getActiveBadgeClasses((entryData as any).isActive)}
                >
                  {(entryData as any).isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Added</span>
                <span className="text-sm font-medium text-foreground">
                  {convertDate(entryData.createdAt, "YYYY-MM-DD HH:mm:ss")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Updated</span>
                <span className="text-sm font-medium text-foreground">
                  {convertDate(
                    (entryData as any).updatedAt,
                    "YYYY-MM-DD HH:mm:ss",
                  )}
                </span>
              </div>
              {(entryData as any).expiresAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Expires</span>
                  <span className="text-sm font-medium text-foreground">
                    {convertDate(
                      (entryData as any).expiresAt,
                      "YYYY-MM-DD HH:mm:ss",
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          {(entryData as any).metadata && (
            <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
              <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ICONS.FileText size={20} />
                Metadata
              </h4>
              <div className="space-y-3 text-sm">
                {(() => {
                  try {
                    const metadata = JSON.parse((entryData as any).metadata);
                    return Object.entries(metadata).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-xs text-muted-foreground capitalize">
                          {key.replace(/_/g, " ")}
                        </span>
                        <p className="font-medium text-foreground mt-1">
                          {value as string}
                        </p>
                      </div>
                    ));
                  } catch {
                    return (
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Metadata
                        </span>
                        <p className="font-medium text-foreground mt-1">
                          {(entryData as any).metadata}
                        </p>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
