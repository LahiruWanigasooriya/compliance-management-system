"use client";
import LoadingOverlay from "@/components/layout/LoadingOverlay";
import FilterArea from "@/components/ui/filter-area";
import { ICONS } from "@/constants/constants";
import { useGeoLocationRecord } from "@/hooks/useGeolocationRecords";
import { FilterProps } from "@/types/common.types";
import dynamic from "next/dynamic";
import { useState } from "react";
import GeoVisualFilterModal from "./modals/GeoVisualFilterModal";
import { GetGeoParams } from "@/types/geolocation.types";
import { dayUTC, getDateFromTimeFrame } from "@/utils/format";
import EmptyResult from "@/components/common/empty-result/EmptyResult";
import { RefreshCw } from "lucide-react";
import { useTenant } from "@/components/providers/tenant.provider";
import SummaryCard from "@/components/layout/SummaryCard";

const GeoMap = dynamic(() => import("./sections/GeoMap"), { ssr: false });

const GeoVisualsPage = () => {
  const [appliedFilters, setAppliedFilters] = useState<Array<FilterProps>>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [queryParams, setQueryParams] = useState<GetGeoParams>({});
  const { geoRecords, loading, isFetching, isRefetching, dataUpdatedAt, refresh } = useGeoLocationRecord(
    queryParams,
    setQueryParams
  );
  const { isSwitchingTenant } = useTenant();

  const handleFiltersClick = () => {
    setIsFilterModalOpen(true);
  };

  const handleRemoveFilter = (filterId: string) => {
    const updatedFilters = appliedFilters.filter(
      (filter) => filter.id !== filterId
    );
    setAppliedFilters(updatedFilters);

    const filterParams: GetGeoParams = {};

    updatedFilters.forEach((filter) => {
      if (filter.type === "anonymizer") {
        filterParams.is_vpn = (filter.value as string[]).includes("vpn");
        filterParams.is_proxy = (filter.value as string[]).includes("proxy");
        filterParams.is_tor = (filter.value as string[]).includes("tor");
      } else if (filter.type === "identifier") {
        filterParams.status = filter.value as string;
      } else if (filter.type === "timeFrame") {
        filterParams.date_from = getDateFromTimeFrame(filter.value as string);
      }
    });
    if (
      !filterParams.is_vpn &&
      !filterParams.is_proxy &&
      !filterParams.is_tor &&
      !filterParams.date_from &&
      !filterParams.date_to
    ) {
      setQueryParams({});
    } else {
      setQueryParams({ ...filterParams });
    }
  };

  const handleClearAllFilters = () => {
    setAppliedFilters([]);
    setQueryParams({});
  };

  const handleApplyFilters = (filters: {
    anonymizerTypes: string[];
    identifierTypes: string[];
    timeFrame?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const newFilters: FilterProps[] = [];
    const filterParams: GetGeoParams = {};
    if (filters.anonymizerTypes?.length) {
      newFilters.push({
        id: "anonymizerTypes",
        type: "anonymizer",
        label: "Anonymizer Types",
        value: filters.anonymizerTypes,
        displayValue: filters.anonymizerTypes.join(", "),
      });
      filterParams.is_vpn = filters.anonymizerTypes.includes("vpn");
      filterParams.is_proxy = filters.anonymizerTypes.includes("proxy");
      filterParams.is_tor = filters.anonymizerTypes.includes("tor");
    }
    if (filters.identifierTypes?.length) {
      newFilters.push({
        id: "identifierTypes",
        type: "identifier",
        label: "Identifier",
        value: filters.identifierTypes,
        displayValue: filters.identifierTypes.join(", "),
      });
    }
    if (filters.timeFrame) {
      newFilters.push({
        id: "timeFrame",
        type: "timeFrame",
        label: "Time Frame",
        value: filters.timeFrame,
        displayValue: filters.timeFrame,
      });
      filterParams.date_from = getDateFromTimeFrame(filters.timeFrame);
    }

    if (filters.dateFrom && filters.dateTo) {
      newFilters.push({
        id: "dateRange",
        type: "dateRange",
        label: "Date Range",
        value: `${filters.dateFrom}:${filters.dateTo}`,
        displayValue: `${filters.dateFrom} - ${filters.dateTo}`,
      });

      filterParams.date_from = dayUTC(filters.dateFrom);
      filterParams.date_to = dayUTC(filters.dateTo);
    }
    setAppliedFilters(newFilters);
    setQueryParams({ ...filterParams });
  };

  // Calculate stats from records
  const getStats = () => {
    if (!geoRecords || geoRecords.length === 0) {
      return { total: 0, highRisk: 0, vpn: 0, uniqueCountries: 0 };
    }
    const highRisk = geoRecords.filter((r) => r.risk_score >= 60).length;
    const vpn = geoRecords.filter((r) => r.is_vpn || r.is_proxy || r.is_tor).length;
    const uniqueCountries = new Set(geoRecords.map((r) => r.country)).size;
    return { total: geoRecords.length, highRisk, vpn, uniqueCountries };
  };

  const stats = getStats();

  // Don't show individual page loader during tenant switch - the global overlay handles it
  if (loading && !isSwitchingTenant) {
    return (
      <LoadingOverlay
        className="-inset-4!"
        loadingText="Loading Geo Location map..."
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 md:gap-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">
              Geolocation Visualization
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-muted-foreground text-sm dark:text-gray-400">
                Monitor customer locations and geographical patterns
              </p>
              {dataUpdatedAt > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  {isRefetching && (
                    <RefreshCw size={10} className="animate-spin" />
                  )}
                  <span className="hidden sm:inline">
                    Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
                  </span>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={isFetching}
              className="p-2 rounded-lg cursor-pointer border border-panel-border bg-card hover:bg-card/70 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw
                size={16}
                className={`text-muted-foreground ${isFetching ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              onClick={handleFiltersClick}
              className={`flex items-center gap-2 px-4 py-2 cursor-pointer border border-panel-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-foreground bg-card shadow-sm ${
                appliedFilters.length > 0 ? "ring-2 ring-[#1A5276]/20" : ""
              }`}
            >
              <ICONS.Filter size={16} />
              <span>Filters</span>
              {appliedFilters.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-[#1A5276] text-white text-xs rounded-full">
                  {appliedFilters.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {geoRecords && geoRecords.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <SummaryCard
              title="Total Locations"
              value={stats.total}
              mainColor="blue"
              icon={ICONS.MapPin}
              // bottomLabel="Active customers"
            />
            <SummaryCard
              title="High Risk"
              value={stats.highRisk}
              mainColor="red"
              icon={ICONS.AlertTriangle}
              // trend="+3"
              // trendColor="yellow"
              // bottomLabel="Awaiting verification"
            />
            <SummaryCard
              title="VPN/Proxy/TOR"
              value={stats.vpn}
              mainColor="orange"
              icon={ICONS.Shield}
              // bottomLabel="Verified customers"
            />
            <SummaryCard
              title="Countries"
              value={stats.uniqueCountries}
              mainColor="green"
              icon={ICONS.Globe}
              // bottomLabel="Enhanced due diligence"
            />
          </div>
        )}

        {/* Applied Filters */}
        {appliedFilters.length > 0 && (
          <FilterArea
            appliedFilters={appliedFilters}
            handleRemoveFilter={handleRemoveFilter}
            handleClearAllFilters={handleClearAllFilters}
          />
        )}

        {/* Map Section */}
        {geoRecords && geoRecords.length > 0 ? (
          <div className="relative h-[600px] w-full rounded-xl overflow-hidden border border-panel-border shadow-md bg-slate-100 dark:bg-slate-900 group mb-6">
            {/* Floating Header */}
            <div className="absolute top-4 left-4 z-[400] bg-card/90 backdrop-blur-md border border-panel-border/50 shadow-lg rounded-lg py-2 px-4 flex items-center gap-2 max-w-[calc(100%-2rem)]">
              <div className="bg-[#1A5276]/10 p-1.5 rounded-md">
                <ICONS.Globe size={18} className="text-[#1A5276]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground leading-none">
                  Live Risk Map
                </h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Real-time geolocation monitoring
                </p>
              </div>
            </div>

            {/* Floating Legend */}
            <div className="absolute bottom-4 left-4 z-[400] bg-card/90 backdrop-blur-md border border-panel-border/50 shadow-lg rounded-lg p-3 min-w-[140px]">
              <h4 className="text-xs font-semibold text-foreground mb-2 px-1">Risk Legend</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                  <span className="text-[11px] font-medium text-muted-foreground">Low Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]"></span>
                  <span className="text-[11px] font-medium text-muted-foreground">Medium Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></span>
                  <span className="text-[11px] font-medium text-muted-foreground">High Risk</span>
                </div>
              </div>
            </div>

            {/* Map Container */}
            <div className="h-full w-full">
              <GeoMap records={geoRecords} loading={loading} />
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-panel-border shadow-sm p-12">
            <EmptyResult
              title="No Location Data Found"
              description="There are no geolocation records to display on the map"
              icon={
                <ICONS.MapPin
                  className="mx-auto text-muted-foreground mb-4"
                  size={48}
                />
              }
            />
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <GeoVisualFilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApplyFilters={handleApplyFilters}
          currentFilters={appliedFilters}
        />
      )}
    </>
  );
};

export default GeoVisualsPage;
