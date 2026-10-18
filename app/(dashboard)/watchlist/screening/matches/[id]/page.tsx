"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Carousel } from "antd";
import type { CarouselRef } from "antd/es/carousel";
import { ExtendedScreening } from "@/types/aml/screening";
import { Entity as ExternalEntity } from "@/types/aml/externalHits";
import { Entity as InternalEntity } from "@/types/aml/internalHits";
import { getNameByCode } from "@/utils/aml/getNameByCode";
import { FiltersResponse } from "@/types/aml/service.types";
import { getRiskBadgeClasses } from "@/utils/kyc/badgeClasses";
import Loader from "@/components/ui/loader/Loader";
import { fetchScreeningByReference } from "@/actions/aml.actions";
import { convertDate } from "@/utils/convertDate";
import CopyableText from "@/components/common/copyable-text/CopyableText";
import { ICONS } from "@/constants/constants";
import { useWatchlistFilters } from "@/hooks/useWatchlist";
import MatchScoreCircle, { getMatchScoreVariant } from "@/components/ui/MatchScoreCircle";

export default function WatchlistMatchesPage() {
  const params = useParams();
  const router = useRouter();
  const reference = params.id as string;

  const [detailData, setDetailData] = useState<ExtendedScreening | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);
  const carouselRef = useRef<CarouselRef>(null);
  const externalCarouselRef = useRef<CarouselRef>(null);

  const allMatches: (ExternalEntity | InternalEntity)[] = detailData?.allHits
    ? [
        ...(detailData.allHits.external || []),
        ...(detailData.allHits.internal || []),
      ]
    : [];
  const selectedMatch = allMatches[selectedMatchIndex];
  const isInternalMatch =
    selectedMatch &&
    "source" in selectedMatch &&
    selectedMatch.source === "internal";
  const matchScoreVariant =
    detailData?.matchScore !== undefined
      ? getMatchScoreVariant(detailData.matchScore)
      : undefined;

  const { filtersResponse, isLoading: isLoadingFilters } = useWatchlistFilters(
    {},
  );

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const screeningResponse = await fetchScreeningByReference(reference);

        if (screeningResponse.success && screeningResponse.data) {
          setDetailData(screeningResponse.data.screening as ExtendedScreening);
          setSelectedMatchIndex(0);
        } else {
          toast.error(
            screeningResponse.message ?? "Failed to load screening details",
          );
          router.back();
        }
      } catch (error) {
        toast.error("An error occurred while loading details");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    if (reference) {
      fetchData();
    }
  }, [reference, router]);

  if (isLoading || isLoadingFilters) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader />
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Loading match details...
        </p>
      </div>
    );
  }

  if (!detailData || allMatches.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        No matches found.
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">
              Watchlist Match Analysis
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
                  {detailData.fullName ||
                    `${detailData.firstName} ${detailData.lastName}`}
                </h1>
                <span className="px-2 py-1 bg-blue-50/50 text-blue-700 text-xs font-medium rounded-full border border-blue-500">
                  {detailData.totalHits || 0} Hits
                </span>
                {detailData.matchScore && (
                  <span className="px-2 py-1 bg-green-50/50 text-green-700 text-xs font-medium rounded-full border border-green-500">
                    Score: {detailData.matchScore}%
                  </span>
                )}
              </div>
              <div className="text-muted-foreground flex items-center gap-1 flex-wrap">
                <span>REF:</span>
                <CopyableText
                  text={detailData.reference}
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
          {/* Screening Overview */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.FileText size={20} />
              Screening Overview
            </h4>
            {/* <div className="grid grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <span className="text-xs text-muted-foreground">
                  Total Hits
                </span>
                <p className="font-bold text-lg text-foreground">
                  {detailData.totalHits || 0}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  External Hits
                </span>
                <p className="font-bold text-lg text-foreground">
                  {detailData.externalHitsCount || 0}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  Internal Hits
                </span>
                <p className="font-bold text-lg text-foreground">
                  {detailData.internalHitsCount || 0}
                </p>
              </div>
            </div> */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Left Side: Hits Statistics */}
              <div className="grid grid-cols-2 gap-4">
                {/* Total Hits: Full Width of Left Side */}
                <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-2xl text-center col-span-2 flex flex-col justify-center items-center">
                  <p className="text-4xl font-extrabold text-blue-600 leading-none">
                    {detailData.totalHits || detailData.hitsCount || 0}
                  </p>
                  <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest">
                    Total Hits
                  </p>
                </div>

                {/* External Hits */}
                <div className="p-6 bg-orange-50/30 border border-orange-100 rounded-2xl text-center flex flex-col justify-center items-center">
                  <p className="text-3xl font-bold text-orange-600 leading-none">
                    {detailData.externalHitsCount || 0}
                  </p>
                  <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-tighter">
                    External Hits
                  </p>
                </div>

                {/* Internal Hits */}
                <div className="p-6 bg-red-50/30 border border-red-100 rounded-2xl text-center flex flex-col justify-center items-center">
                  <p className="text-3xl font-bold text-red-600 leading-none">
                    {detailData.internalHitsCount || 0}
                  </p>
                  <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-tighter">
                    Internal Hits
                  </p>
                </div>
              </div>

              {/* Right Side: Match Score (Full Height) */}
              {detailData?.matchScore !== undefined && matchScoreVariant && (
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-white dark:bg-transparent h-full min-h-[200px]">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-4">
                    Match Score
                  </p>

                  {/* Circular Progress */}
                  <MatchScoreCircle
                    score={detailData.matchScore}
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
            <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-panel-border">
              <div>
                <span className="text-xs text-muted-foreground">
                  Screened At
                </span>
                <p className="font-medium text-foreground">
                  {convertDate(detailData.screenedAt, "YYYY-MM-DD HH:mm:ss")}
                </p>
              </div>
              {detailData.event && (
                <div>
                  <span className="text-xs text-muted-foreground">Event</span>
                  <p className="font-medium text-foreground">
                    {detailData.event}
                  </p>
                </div>
              )}
            </div>
            {(detailData as any).reviewStatus && (
              <div className="grid grid-cols-3 gap-4 text-sm pt-4 border-t border-panel-border mt-4">
                <div>
                  <span className="text-xs text-muted-foreground">
                    Review Status
                  </span>
                  <p className="font-medium text-foreground">
                    {(detailData as any).reviewStatus || "Pending"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">
                    Risk Level
                  </span>
                  <p className="font-medium text-foreground">
                    {(detailData as any).riskLevel || "Unknown"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Status</span>
                  <p className="font-medium text-foreground">
                    {(detailData as any).status || "Unknown"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Verification Results */}
          {(detailData as any).verificationResult && (
            <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
              <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ICONS.Shield size={20} />
                Verification Results
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {(detailData as any).verificationResult.backgroundChecks !==
                  undefined && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Background Checks
                    </span>
                    <p className="font-medium text-foreground">
                      {(detailData as any).verificationResult.backgroundChecks}
                    </p>
                  </div>
                )}
                {(detailData as any).hasInternalMatch !== undefined && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Has Internal Match
                    </span>
                    <p className="font-medium text-foreground">
                      {(detailData as any).hasInternalMatch ? "Yes" : "No"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Geolocation & Device Info */}
          {((detailData as any).geolocation ||
            (detailData as any).deviceInfo) && (
            <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
              <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ICONS.MapPin size={20} />
                Geolocation & Device Info
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {(detailData as any).geolocation && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Location
                    </span>
                    <div className="space-y-1">
                      {(detailData as any).geolocation.country && (
                        <p className="font-medium text-foreground">
                          Country: {(detailData as any).geolocation.country}
                        </p>
                      )}
                      {(detailData as any).geolocation.city && (
                        <p className="font-medium text-foreground">
                          City: {(detailData as any).geolocation.city}
                        </p>
                      )}
                      {(detailData as any).geolocation.ip && (
                        <p className="font-medium text-foreground">
                          IP: {(detailData as any).geolocation.ip}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {(detailData as any).deviceInfo && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Device Information
                    </span>
                    <div className="space-y-1">
                      {(detailData as any).deviceInfo.userAgent && (
                        <p className="font-medium text-foreground text-xs break-all">
                          User Agent: {(detailData as any).deviceInfo.userAgent}
                        </p>
                      )}
                      {(detailData as any).deviceInfo.platform && (
                        <p className="font-medium text-foreground">
                          Platform: {(detailData as any).deviceInfo.platform}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Match Details Header */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-foreground">
                  {selectedMatch?.name}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedMatch?.entityType || "Unknown Entity Type"}
                </p>
              </div>
              <div className="flex gap-2">
                {selectedMatch?.score && (
                  <span className="px-3 py-1 bg-blue-50/50 text-blue-700 rounded-full text-sm font-medium">
                    Score:{" "}
                    {isInternalMatch
                      ? selectedMatch.score / 100
                      : selectedMatch.score}
                  </span>
                )}
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isInternalMatch
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {isInternalMatch ? "Internal" : "External"}
                </span>
              </div>
            </div>

            {/* Match Types */}
            {selectedMatch?.matchTypes &&
              selectedMatch.matchTypes.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-muted-foreground mb-2">
                    Match Types
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedMatch.matchTypes.map((type, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {type.replace(/_/g, " ").toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Types/Categories */}
            {selectedMatch?.types && selectedMatch.types.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-2">
                  Categories
                </h5>
                <div className="flex flex-wrap gap-2">
                  {selectedMatch.types.map((type, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium"
                    >
                      {type.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comparison */}
          <div className="bg-card rounded-xl shadow border border-panel-border overflow-hidden">
            <div className="bg-muted px-6 py-4 border-b border-panel-border">
              <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <ICONS.GitCompare size={20} />
                Side-by-Side Comparison
              </h4>
            </div>
            <div className="grid grid-cols-2 divide-x divide-panel-border">
              <div className="p-6">
                <h5 className="text-sm font-medium text-muted-foreground mb-3">
                  Customer Data
                </h5>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground">Name</span>
                    <p className="font-medium text-foreground">
                      {detailData.firstName} {detailData.middleName || ""}{" "}
                      {detailData.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">DOB</span>
                    <p className="font-medium text-foreground">
                      {detailData.dob || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h5 className="text-sm font-medium text-muted-foreground mb-3">
                  Watchlist Entry
                </h5>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground">Name</span>
                    <p
                      className={`font-medium ${
                        selectedMatch?.name
                          ?.toLowerCase()
                          .includes(detailData.firstName?.toLowerCase()) ||
                        selectedMatch?.name
                          ?.toLowerCase()
                          .includes(detailData.lastName?.toLowerCase())
                          ? "text-green-600"
                          : "text-foreground"
                      }`}
                    >
                      {selectedMatch?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">DOB</span>
                    <p
                      className={`font-medium ${
                        (isInternalMatch
                          ? (selectedMatch as InternalEntity).fields?.dob
                          : (selectedMatch as ExternalEntity).fields
                              ?.dateOfBirth?.[0]?.value) === detailData.dob
                          ? "text-green-600"
                          : "text-foreground"
                      }`}
                    >
                      {isInternalMatch
                        ? (selectedMatch as InternalEntity).fields?.dob || "N/A"
                        : (selectedMatch as ExternalEntity).fields
                            ?.dateOfBirth?.[0]?.value || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rest of the content from the modal... */}
          {/* Alternative Names */}
          {!isInternalMatch &&
            (selectedMatch as ExternalEntity)?.alternativeNames &&
            (selectedMatch as ExternalEntity).alternativeNames.length > 0 && (
              <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
                <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ICONS.User size={20} />
                  Alternative Names (
                  {(selectedMatch as ExternalEntity).alternativeNames.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedMatch as ExternalEntity).alternativeNames.map(
                    (name, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-muted text-foreground rounded-md text-sm border border-panel-border"
                      >
                        {name}
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}

          {/* Fields Information */}
          {!isInternalMatch &&
            (selectedMatch as ExternalEntity)?.fields &&
            Object.keys((selectedMatch as ExternalEntity).fields).length >
              0 && (
              <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
                <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ICONS.Info size={20} />
                  Additional Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries((selectedMatch as ExternalEntity).fields).map(
                    ([key, values]: [string, any[]]) => (
                      <div key={key}>
                        <h5 className="text-sm font-medium text-foreground mb-2 bg-gradient-to-r from-muted to-transparent px-2 py-1 rounded">
                          {key.replace(/_/g, " ")}
                        </h5>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {values.map((item, idx) => {
                            const sourceKey = item.source
                              ?.toLowerCase()
                              .replace(/\s+/g, "-");
                            const sourceUrl = (selectedMatch as ExternalEntity)
                              .sourceNotes?.[sourceKey]?.url;

                            return (
                              <div
                                key={idx}
                                className="text-sm text-foreground p-2 bg-muted rounded border border-panel-border"
                              >
                                <div className="break-words">{item.value}</div>
                                {item.source && (
                                  <div className="mt-1 flex items-center gap-1">
                                    <span className="text-xs text-muted-foreground">
                                      Source:
                                    </span>
                                    {sourceUrl ? (
                                      <a
                                        href={sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline"
                                      >
                                        {item.source}
                                      </a>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        {item.source}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

          {/* Assets */}
          {!isInternalMatch &&
            (selectedMatch as ExternalEntity)?.assets &&
            (selectedMatch as ExternalEntity).assets.length > 0 && (
              <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
                <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ICONS.DollarSign size={20} />
                  Assets ({(selectedMatch as ExternalEntity).assets.length})
                </h4>
                <div className="space-y-2">
                  {(selectedMatch as ExternalEntity).assets.map(
                    (asset, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-muted rounded-md border border-panel-border text-sm text-foreground"
                      >
                        {asset}
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

          {/* Media/Adverse Media */}
          {!isInternalMatch &&
            (selectedMatch as ExternalEntity)?.media &&
            (selectedMatch as ExternalEntity).media.length > 0 && (
              <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
                <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ICONS.AlertTriangle size={20} />
                  Adverse Media (
                  {(selectedMatch as ExternalEntity).media.length})
                </h4>
                <div className="space-y-3">
                  {(selectedMatch as ExternalEntity).media.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-muted rounded-lg border border-panel-border"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="text-sm font-semibold text-foreground flex-1">
                          {item.title}
                        </h5>
                        {item.score && (
                          <span
                            className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${
                              item.score < 0
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {item.score}
                          </span>
                        )}
                      </div>
                      {item.adverseKeywords && (
                        <div className="mb-2">
                          <span className="text-xs font-semibold text-muted-foreground">
                            Keywords:
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {item.adverseKeywords}
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-foreground mb-2">
                        {item.snippet}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground capitalize">
                          {item.country || "N/A"}
                        </span>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View Source →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Sources */}
          {!isInternalMatch &&
            (selectedMatch as ExternalEntity)?.sources &&
            (selectedMatch as ExternalEntity).sources.length > 0 && (
              <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
                <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ICONS.Link size={20} />
                  Sources ({(selectedMatch as ExternalEntity).sources.length})
                </h4>
                <div className="space-y-2">
                  {(selectedMatch as ExternalEntity).sources.map(
                    (source, idx) => {
                      const sourceKey = source
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, "");
                      const sourceNote = (selectedMatch as ExternalEntity)
                        .sourceNotes?.[sourceKey];
                      return (
                        <div
                          key={idx}
                          className="p-3 bg-muted rounded-md border border-panel-border"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="text-sm font-semibold text-foreground">
                                {source}
                              </h5>
                              {sourceNote?.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {sourceNote.description}
                                </p>
                              )}
                              {sourceNote?.amlTypes && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {sourceNote.amlTypes.map(
                                    (type: any, typeIdx: any) => (
                                      <span
                                        key={typeIdx}
                                        className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                                      >
                                        {type.toUpperCase()}
                                      </span>
                                    ),
                                  )}
                                </div>
                              )}
                            </div>
                            {sourceNote?.url && (
                              <a
                                href={sourceNote.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline ml-2"
                              >
                                View Source →
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            )}

          {/* Source Details */}
          {!isInternalMatch &&
            (selectedMatch as ExternalEntity)?.sourceDetails &&
            (selectedMatch as ExternalEntity).sourceDetails.length > 0 && (
              <div className="bg-white dark:bg-[#0a1b18] rounded-lg border border-gray-200 dark:border-[#373c4a] p-4">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">
                  SOURCE DETAILS (
                  {(selectedMatch as ExternalEntity).sourceDetails.length})
                </h4>
                <div className="space-y-4">
                  {(selectedMatch as ExternalEntity).sourceDetails.map(
                    (detail, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 dark:border-[#373c4a] rounded-lg p-4 bg-gray-50 dark:bg-[#1a2a27]"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                              {detail.publisher}
                            </h5>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {detail.description}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 text-right">
                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              Created: {detail.createdAt}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              Updated: {detail.updatedAt}
                            </span>
                          </div>
                        </div>

                        {detail.categories && detail.categories.length > 0 && (
                          <div className="mb-3">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                              Categories:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {detail.categories.map((cat, catIdx) => (
                                <span
                                  key={catIdx}
                                  className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs"
                                >
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {detail.countries && detail.countries.length > 0 && (
                          <div className="mb-3">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                              Countries:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {detail.countries.map((country, countryIdx) => (
                                <span
                                  key={countryIdx}
                                  className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs"
                                >
                                  {country}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {detail.data?.summary && (
                          <div className="mb-3">
                            <h6 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                              Summary Information
                            </h6>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              {Object.entries(detail.data.summary).map(
                                ([key, values]: [string, any]) => {
                                  if (
                                    !values ||
                                    (Array.isArray(values) &&
                                      values.length === 0)
                                  )
                                    return null;
                                  return (
                                    <div key={key}>
                                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                        {key
                                          .replace(/([A-Z])/g, " $1")
                                          .toLowerCase()}
                                        :
                                      </span>
                                      <div className="text-gray-700 dark:text-gray-300 break-all overflow-wrap-anywhere">
                                        {Array.isArray(values)
                                          ? values.join(", ")
                                          : values}
                                      </div>
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          </div>
                        )}

                        {detail.data?.caseDetails &&
                          detail.data.caseDetails.length > 0 && (
                            <div className="mb-3">
                              <h6 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                Case Details
                              </h6>
                              <div className="space-y-2">
                                {detail.data.caseDetails.map(
                                  (caseDetail: any, caseIdx: any) => (
                                    <div
                                      key={caseIdx}
                                      className="p-2 bg-white dark:bg-[#0a1b18] rounded border border-gray-200 dark:border-[#373c4a] text-sm"
                                    >
                                      {Object.entries(caseDetail).map(
                                        ([key, values]: [string, any]) => {
                                          if (
                                            !values ||
                                            (Array.isArray(values) &&
                                              values.length === 0)
                                          )
                                            return null;
                                          return (
                                            <div key={key} className="mb-1">
                                              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                {key
                                                  .replace(/([A-Z])/g, " $1")
                                                  .toLowerCase()}
                                                :
                                              </span>
                                              <span className="text-gray-700 dark:text-gray-300 ml-2">
                                                {Array.isArray(values)
                                                  ? values.join(", ")
                                                  : values}
                                              </span>
                                            </div>
                                          );
                                        },
                                      )}
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                        {detail.data?.additionalInformation && (
                          <div className="mb-3">
                            <h6 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                              Additional Information
                            </h6>
                            <div className="space-y-2 text-sm">
                              {detail.data.additionalInformation.flagSummary &&
                                detail.data.additionalInformation.flagSummary
                                  .length > 0 && (
                                  <div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Flag Summary:
                                    </span>
                                    <div className="text-gray-700 dark:text-gray-300 mt-1">
                                      {detail.data.additionalInformation.flagSummary.map(
                                        (flag: any, flagIdx: any) => (
                                          <div
                                            key={flagIdx}
                                            className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 text-sm"
                                          >
                                            {flag}
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                              {detail.data.additionalInformation.notesRemarks &&
                                detail.data.additionalInformation.notesRemarks
                                  .length > 0 && (
                                  <div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Notes & Remarks:
                                    </span>
                                    <div className="text-gray-700 dark:text-gray-300 mt-1">
                                      {detail.data.additionalInformation.notesRemarks.map(
                                        (note: any, noteIdx: any) => (
                                          <div
                                            key={noteIdx}
                                            className="p-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 text-sm"
                                          >
                                            {note}
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        )}

                        {detail.data?.linkedEntities &&
                          detail.data.linkedEntities.length > 0 && (
                            <div className="mb-3">
                              <h6 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                Linked Entities
                              </h6>
                              <div className="space-y-2">
                                {detail.data.linkedEntities.map(
                                  (entity: any, entityIdx: any) => (
                                    <div
                                      key={entityIdx}
                                      className="p-2 bg-white dark:bg-[#0a1b18] rounded border border-gray-200 dark:border-[#373c4a] text-sm"
                                    >
                                      {entity.name && (
                                        <div className="font-medium text-gray-800 dark:text-gray-100">
                                          {Array.isArray(entity.name)
                                            ? entity.name.join(", ")
                                            : entity.name}
                                        </div>
                                      )}
                                      {entity.relation && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          Relation:{" "}
                                          {Array.isArray(entity.relation)
                                            ? entity.relation.join(", ")
                                            : entity.relation}
                                        </div>
                                      )}
                                      {entity.role && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          Role:{" "}
                                          {Array.isArray(entity.role)
                                            ? entity.role.join(", ")
                                            : entity.role}
                                        </div>
                                      )}
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                        {detail.data?.sanctionDetails &&
                          detail.data.sanctionDetails.length > 0 && (
                            <div className="mb-3">
                              <h6 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                Sanction Details
                              </h6>
                              <div className="space-y-2">
                                {detail.data.sanctionDetails.map(
                                  (sanction: any, sanctionIdx: any) => (
                                    <div
                                      key={sanctionIdx}
                                      className="p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800 text-sm"
                                    >
                                      {Object.entries(sanction).map(
                                        ([key, values]: [string, any]) => {
                                          if (
                                            !values ||
                                            (Array.isArray(values) &&
                                              values.length === 0)
                                          )
                                            return null;
                                          return (
                                            <div key={key} className="mb-1">
                                              <span className="text-xs text-red-600 dark:text-red-400 capitalize font-medium">
                                                {key
                                                  .replace(/([A-Z])/g, " $1")
                                                  .toLowerCase()}
                                                :
                                              </span>
                                              <span className="text-red-700 dark:text-red-300 ml-2">
                                                {Array.isArray(values)
                                                  ? values.join(", ")
                                                  : values}
                                              </span>
                                            </div>
                                          );
                                        },
                                      )}
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                        {detail.additionalSources &&
                          detail.additionalSources.length > 0 && (
                            <div className="mb-3">
                              <h6 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                Additional Sources
                              </h6>
                              <div className="space-y-1">
                                {detail.additionalSources.map(
                                  (source, sourceIdx) => (
                                    <a
                                      key={sourceIdx}
                                      href={source}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block text-xs text-[#3d5a5c] dark:text-[#5aaeb5] hover:underline break-all"
                                    >
                                      {source}
                                    </a>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                        {detail.url && (
                          <div className="pt-2 border-t border-gray-200 dark:border-[#373c4a]">
                            <a
                              href={detail.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#3d5a5c] dark:text-[#5aaeb5] hover:underline"
                            >
                              View Full Source →
                            </a>
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

          {/* Associates */}
          {!isInternalMatch &&
            (selectedMatch as ExternalEntity)?.associates &&
            (selectedMatch as ExternalEntity).associates.length > 0 && (
              <div className="bg-white dark:bg-[#0a1b18] rounded-lg border border-gray-200 dark:border-[#373c4a] p-4">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">
                  ASSOCIATES (
                  {(selectedMatch as ExternalEntity).associates.length})
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {(selectedMatch as ExternalEntity).associates.map(
                    (associate, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 dark:bg-[#1a2a27] rounded-md border border-gray-200 dark:border-[#373c4a] text-sm"
                      >
                        <div className="font-medium text-gray-800 dark:text-gray-100">
                          {associate.name}
                        </div>
                        {associate.association && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Relationship: {associate.association}
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

          {/* Review Information */}
          {((detailData as any).reviewNotes ||
            (detailData as any).reviewedAt) && (
            <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
              <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ICONS.MessageSquare size={20} />
                Review Information
              </h4>
              <div className="space-y-3 text-sm">
                {(detailData as any).reviewNotes && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Review Notes
                    </span>
                    <p className="font-medium text-foreground mt-1">
                      {(detailData as any).reviewNotes}
                    </p>
                  </div>
                )}
                {(detailData as any).reviewedAt && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Reviewed At
                    </span>
                    <p className="font-medium text-foreground">
                      {convertDate(
                        (detailData as any).reviewedAt,
                        "YYYY-MM-DD HH:mm:ss",
                      )}
                    </p>
                  </div>
                )}
                {(detailData as any).reviewDecision && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Review Decision
                    </span>
                    <p className="font-medium text-foreground">
                      {(detailData as any).reviewDecision}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Internal Details */}
          {isInternalMatch && (
            <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
              <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ICONS.Database size={20} />
                Internal Watchlist Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">
                    Entry ID
                  </span>
                  <p className="font-medium text-foreground">
                    {(selectedMatch as InternalEntity).entryId}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">
                    Added At
                  </span>
                  <p className="font-medium text-foreground">
                    {(selectedMatch as InternalEntity).addedAt}
                  </p>
                </div>
              </div>
              {(selectedMatch as InternalEntity).reason && (
                <div className="mt-4 pt-4 border-t border-panel-border">
                  <span className="text-xs text-muted-foreground">Reason</span>
                  <p className="text-sm text-foreground mt-1">
                    {(selectedMatch as InternalEntity).reason}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Additional Metadata */}
          {((detailData as any).tenantId || (detailData as any).updatedAt) && (
            <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
              <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ICONS.Settings size={20} />
                Metadata
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {(detailData as any).tenantId && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Tenant ID
                    </span>
                    <p className="font-medium text-foreground font-mono text-xs">
                      {(detailData as any).tenantId}
                    </p>
                  </div>
                )}
                {(detailData as any).updatedAt && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Last Updated
                    </span>
                    <p className="font-medium text-foreground">
                      {convertDate(
                        (detailData as any).updatedAt,
                        "YYYY-MM-DD HH:mm:ss",
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Match Selection */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.Users size={20} />
              Matches ({allMatches.length})
            </h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allMatches.map((match, idx) => {
                const isActive = selectedMatchIndex === idx;
                const isInternal =
                  "source" in match && match.source === "internal";
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedMatchIndex(idx)}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      isActive
                        ? "bg-blue-50/50 border-blue-200 shadow-sm"
                        : "bg-background border-panel-border hover:border-blue-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          isInternal
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {isInternal ? "Internal" : "External"}
                      </span>
                      {match.score && (
                        <span className="text-xs font-medium text-muted-foreground">
                          {isInternal ? match.score / 100 : match.score}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm font-medium truncate ${
                        isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {match.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {match.entityType || "Unknown"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.BarChart3 size={20} />
              Quick Stats
            </h4>
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                {/* First Row: Full Width */}
                <div className="flex justify-between items-center w-full border-b pb-2">
                  <span className="text-muted-foreground">Total Hits</span>
                  <span className="font-bold text-lg text-foreground">
                    {detailData.totalHits ||
                      detailData.hitsCount ||
                      detailData.matchCount ||
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
                      {detailData.externalHitsCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between border-l pl-4">
                    <span className="text-muted-foreground text-xs">
                      Internal Hits
                    </span>
                    <span className="font-medium text-sm text-foreground -translate-y-0.75">
                      {detailData.internalHitsCount || 0}
                    </span>
                  </div>
                </div>
              </div>

              {detailData.matchScore && (
                <div className="flex justify-between pt-2 border-t border-panel-border">
                  <span className="text-sm text-muted-foreground">
                    Match Score
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {detailData.matchScore}%
                  </span>
                </div>
              )}
              {detailData.lastMatch && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Last Match
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {detailData.lastMatch}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
