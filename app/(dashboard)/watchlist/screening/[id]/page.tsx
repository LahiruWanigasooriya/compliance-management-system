"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ICONS } from "@/constants/constants";
import { ExtendedScreening, Screening } from "@/types/aml/screening";
import { FiltersResponse } from "@/types/aml/service.types";
import { getSupportedFiltersAndCountries, fetchScreeningByReference } from "@/actions/aml.actions";
import WatchlistEntryDetails from "../components/ScreeningEntryDetails";
import Loader from "@/components/ui/loader/Loader";

export default function WatchlistEntryPage() {
  const params = useParams();
  const router = useRouter();
  const [entry, setEntry] = useState<Screening | null>(null);
  const [filtersResponse, setFiltersResponse] = useState<FiltersResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const entryId = params.id as string;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [entryResponse, filtersRes] = await Promise.all([
          fetchScreeningByReference(entryId),
          getSupportedFiltersAndCountries(),
        ]);

        if (entryResponse.success && entryResponse.data?.screening) {
          setEntry(entryResponse.data.screening);
        }

        if (filtersRes.success && filtersRes.data) {
          setFiltersResponse(filtersRes.data);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setLoading(false);
      }
    };

    if (entryId) {
      loadData();
    }
  }, [entryId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex gap-3 items-center">
          <Loader />
          Loading entry details...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {/* <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
        >
          <ICONS.ArrowLeft size={16} />
          Back to Watchlist
        </button>
      </div> */}

      {!loading && !entry && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <ICONS.AlertTriangle size={48} className="text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Entry not found
          </h3>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-colors"
          >
            Go Back
          </button>
        </div>
      )}

      {entry && filtersResponse && (
        <WatchlistEntryDetails
          entry={entry as ExtendedScreening}
          filtersResponse={filtersResponse}
          onReviewSubmitted={() => {}}
          onAssigneeUpdated={() => {}}
        />
      )}
    </div>
  );
}