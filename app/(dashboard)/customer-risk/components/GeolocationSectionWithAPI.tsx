"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ICONS } from "@/constants/constants";
import { GeolocationEvent } from "@/types/customer-risk.types";
import { getGeolocationHistory, getGeolocationSummary, exportGeolocationHistory } from "@/actions/customer-risk.actions";
import type { GeolocationHistoryAPI, GeolocationSummaryAPI } from "@/types/customer-risk.types";
import dynamic from "next/dynamic";
import LoadingOverlay from "@/components/layout/LoadingOverlay";
import { toast } from "sonner";

// Dynamically import the map component to avoid SSR issues
const CustomerGeoMap = dynamic(() => import("./CustomerGeoMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <p className="text-muted-foreground">Loading map...</p>
    </div>
  ),
});

interface GeolocationSectionWithAPIProps {
  profileId: string;
}

// Helper function to map backend API data to frontend GeolocationEvent format
const mapToGeolocationEvent = (apiData: GeolocationHistoryAPI): GeolocationEvent => {
  // Determine proxy type from boolean flags
  let proxyType: GeolocationEvent["proxyType"] = "None";
  if (apiData.is_tor) proxyType = "TOR";
  else if (apiData.is_vpn) proxyType = "VPN";
  else if (apiData.is_proxy) proxyType = "Public Proxy";
  else if (apiData.is_hosting) proxyType = "Hosting Provider";

  return {
    id: apiData.id,
    timestamp: apiData.created_at,
    ipAddress: apiData.ip_address,
    country: apiData.country,
    region: apiData.region || "",
    city: apiData.city || "",
    latitude: apiData.latitude,
    longitude: apiData.longitude,
    asn: "", // Not available in backend data
    ispOrganization: "", // Not available in backend data
    proxyType: proxyType,
    geolocationAccuracyRadius: 0, // Not available in backend data
    deviceIdentifier: apiData.device_id || "Unknown",
    deviceType: "", // Would need to join with DeviceHistory
    operatingSystem: "", // Would need to join with DeviceHistory
    browserName: "", // Would need to join with DeviceHistory
    browserVersion: "", // Would need to join with DeviceHistory
    browserFingerprint: "", // Not available in backend data
    riskScore: apiData.risk_score,
    countryChanged: apiData.is_country_change,
    regionChanged: apiData.is_location_change && !apiData.is_country_change,
    cityChanged: apiData.is_location_change && !apiData.is_country_change,
    deviceChanged: apiData.is_device_change,
    proxyTypeChanged: false, // Not available in backend data
    riskScoreIncreased: false, // Not available in backend data
  };
};

const GeolocationSectionWithAPI = ({ profileId }: GeolocationSectionWithAPIProps) => {
  const router = useRouter();
  const [events, setEvents] = useState<GeolocationEvent[]>([]);
  const [summary, setSummary] = useState<GeolocationSummaryAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

  useEffect(() => {
    const fetchGeolocationData = async () => {
      setLoading(true);
      try {
        const [historyResponse, summaryResponse] = await Promise.all([
          getGeolocationHistory({
            profile_id: profileId,
            date_preset: "last_90_days",
            limit: 50,
          }),
          getGeolocationSummary(profileId),
        ]);

        if (historyResponse.success && historyResponse.data.records) {
          const mappedEvents = historyResponse.data.records.map(mapToGeolocationEvent);
          setEvents(mappedEvents);
        }

        if (summaryResponse.success && summaryResponse.data) {
          setSummary(summaryResponse.data);
        }
      } catch (error) {
        console.error("Error fetching geolocation data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGeolocationData();
  }, [profileId]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const displayedEvents = events.slice(0, 3);

  // Use backend summary data if available, otherwise fallback to local calculation
  // Handle case where backend returns objects instead of strings
  const recentAddresses = (summary?.recent_locations || [...new Set(events.map((e) => `${e.city}, ${e.country}`))].slice(0, 5)).map((item: any) =>
    typeof item === 'string' ? item : `${item.city || ''}, ${item.country || ''}`.replace(/^, |, $/g, '') || 'Unknown'
  );
  const recentIps = (summary?.recent_ips || [...new Set(events.map((e) => e.ipAddress))].slice(0, 5)).map((item: any) =>
    typeof item === 'string' ? item : item.ip_address || 'Unknown'
  );
  const recentDevices = (summary?.recent_devices || [...new Set(events.map((e) => e.deviceIdentifier))].slice(0, 5)).map((item: any) =>
    typeof item === 'string' ? item : item.device_id || 'Unknown'
  );
  const anonymizerAttempts = (summary?.anonymizer_attempts || events.filter((e) => e.proxyType !== "None")).map((item: any) => {
    if (typeof item === 'object' && item !== null && !item.proxyType) {
      // Backend returns raw geolocation records - map to expected format
      let proxyType = 'VPN/Proxy';
      if (item.is_tor) proxyType = 'TOR';
      else if (item.is_vpn) proxyType = 'VPN';
      else if (item.is_proxy) proxyType = 'Public Proxy';
      else if (item.is_hosting) proxyType = 'Hosting Provider';
      return {
        ...item,
        proxyType,
        ipAddress: item.ip_address || item.ipAddress,
      };
    }
    return item;
  });
  const uniqueCountries = summary?.unique_countries || 0;
  const locationChanges = summary?.location_changes || 0;
  const countryChanges = summary?.country_changes || 0;
  const uniqueDevicesCount = summary?.unique_devices || 0;

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    setExportingFormat(format);
    try {
      const response = await exportGeolocationHistory({
        profile_id: profileId,
        format,
        date_preset: "last_90_days",
        limit: 1000,
      });

      if (response.success && response.data) {
        // Convert base64 to Blob
        const byteCharacters = atob(response.data.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: response.data.mimeType });

        // Create download link
        const url = globalThis.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `geolocation-history-${profileId}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        globalThis.URL.revokeObjectURL(url);
      } else {
        toast.error(`Failed to export: ${response.message}`);
      }
    } catch (error) {
      console.error("Error exporting geolocation history:", error);
      toast.error("An error occurred while exporting");
    } finally {
      setExportingFormat(null);
    }
  };

  const getChangeIndicator = (event: GeolocationEvent) => {
    const changes: string[] = [];
    if (event.countryChanged) changes.push("Country");
    if (event.regionChanged) changes.push("Region");
    if (event.cityChanged) changes.push("City");
    if (event.deviceChanged) changes.push("Device");
    if (event.proxyTypeChanged) changes.push("Proxy");
    if (event.riskScoreIncreased) changes.push("Risk");
    return changes;
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <ICONS.MapPin size={20} />
          Geolocation Data
        </h2>
        <div className="relative py-12 min-h-[120px]">
          <LoadingOverlay loadingText="Loading geolocation data..." />
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <ICONS.MapPin size={20} />
          Geolocation Data
        </h2>
        <div className="text-center py-12">
          <ICONS.MapPin size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-muted-foreground">No geolocation data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ICONS.MapPin size={20} />
          Geolocation Data
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exportingFormat !== null}
            className="px-3 py-1.5 text-xs border border-panel-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportingFormat === 'csv' ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exportingFormat !== null}
            className="px-3 py-1.5 text-xs border border-panel-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportingFormat === 'pdf' ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="mb-6">
        <CustomerGeoMap events={events} />
      </div>

      {/* Current/Most Recent Location Overview - E9-F3-US01 */}
      {events.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <ICONS.MapPin size={16} className="text-blue-600" />
            Most Recent Location (Based on latest activity)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">IP Address</p>
              <p className="text-sm font-medium font-mono truncate">{events[0]?.ipAddress || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Country</p>
              <p className="text-sm font-medium">{events[0]?.country || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Region</p>
              <p className="text-sm font-medium">{events[0]?.region || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">City</p>
              <p className="text-sm font-medium">{events[0]?.city || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Latitude</p>
              <p className="text-sm font-medium font-mono">{events[0]?.latitude?.toFixed(4) || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Longitude</p>
              <p className="text-sm font-medium font-mono">{events[0]?.longitude?.toFixed(4) || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ASN</p>
              <p className="text-sm font-medium">{events[0]?.asn || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ISP / Organization</p>
              <p className="text-sm font-medium truncate">{events[0]?.ispOrganization || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Proxy Type</p>
              <p className={`text-sm font-medium ${events[0]?.proxyType !== 'None' ? 'text-red-600' : 'text-green-600'}`}>
                {events[0]?.proxyType || 'None'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Accuracy Radius</p>
              <p className="text-sm font-medium">{events[0]?.geolocationAccuracyRadius ? `${events[0].geolocationAccuracyRadius}m` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Device Identifier</p>
              <p className="text-sm font-medium font-mono truncate">{events[0]?.deviceIdentifier || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Device Type</p>
              <p className="text-sm font-medium">{events[0]?.deviceType || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Operating System</p>
              <p className="text-sm font-medium">{events[0]?.operatingSystem || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Browser</p>
              <p className="text-sm font-medium">{events[0]?.browserName ? `${events[0].browserName} ${events[0].browserVersion || ''}`.trim() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Browser Fingerprint</p>
              <p className="text-sm font-medium font-mono truncate">{events[0]?.browserFingerprint || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Seen</p>
              <p className="text-sm font-medium">{events[0]?.timestamp ? formatDateTime(events[0].timestamp) : 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Total Events</p>
          <p className="text-lg font-bold text-blue-600">{summary?.total_records || events.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {uniqueCountries} {uniqueCountries === 1 ? "country" : "countries"}
          </p>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Unique IPs</p>
          <p className="text-lg font-bold text-green-600">{recentIps.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {locationChanges} location {locationChanges === 1 ? "change" : "changes"}
          </p>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Unique Devices</p>
          <p className="text-lg font-bold text-purple-600">{uniqueDevicesCount || recentDevices.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {countryChanges} country {countryChanges === 1 ? "change" : "changes"}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${
          anonymizerAttempts.length > 0
            ? "bg-red-50 dark:bg-red-900/20"
            : "bg-orange-50 dark:bg-orange-900/20"
        }`}>
          <p className="text-xs text-muted-foreground mb-1">VPN/Proxy Attempts</p>
          <p className={`text-lg font-bold ${
            anonymizerAttempts.length > 0 ? "text-red-600" : "text-orange-600"
          }`}>
            {summary?.anonymizer_count || anonymizerAttempts.length}
          </p>
          {anonymizerAttempts.length > 0 && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
              <ICONS.AlertTriangle size={12} className="inline mr-1" />
              Detected
            </p>
          )}
        </div>
      </div>

      {/* Recent Data Sections - E9-F1-US22 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Recent Addresses */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-panel-border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <ICONS.MapPin size={14} className="text-blue-600" />
              Recent Addresses
            </h4>
            <span className="text-xs text-muted-foreground">{recentAddresses.length} of {summary?.total_records || events.length}</span>
          </div>
          <div className="space-y-2">
            {recentAddresses.length > 0 ? (
              recentAddresses.slice(0, 5).map((addr, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-foreground p-2 bg-white dark:bg-gray-900 rounded border border-panel-border">
                  <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                  <span className="truncate">{addr}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No locations available</p>
            )}
          </div>
          {recentAddresses.length > 5 && (
            <button
              onClick={() => router.push(`/customer-risk/${profileId}/location-history`)}
              className="w-full mt-3 text-center text-xs text-blue-600 hover:underline flex items-center justify-center gap-1 cursor-pointer"
            >
              <ICONS.ExternalLink size={12} />
              View Full History ({recentAddresses.length} addresses)
            </button>
          )}
        </div>

        {/* Recent IPs */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-panel-border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <ICONS.Globe size={14} className="text-green-600" />
              Recent IP Addresses
            </h4>
            <span className="text-xs text-muted-foreground">{recentIps.length} unique</span>
          </div>
          <div className="space-y-2">
            {recentIps.length > 0 ? (
              recentIps.slice(0, 5).map((ip, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-foreground p-2 bg-white dark:bg-gray-900 rounded border border-panel-border font-mono">
                  <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                  <span className="truncate">{ip}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No IPs available</p>
            )}
          </div>
          {recentIps.length > 5 && (
            <button
              onClick={() => router.push(`/customer-risk/${profileId}/location-history`)}
              className="w-full mt-3 text-center text-xs text-blue-600 hover:underline flex items-center justify-center gap-1 cursor-pointer"
            >
              <ICONS.ExternalLink size={12} />
              View Full History ({recentIps.length} IPs)
            </button>
          )}
        </div>

        {/* Recent Device UUIDs */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-panel-border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <ICONS.Zap size={14} className="text-purple-600" />
              Recent Device UUIDs
            </h4>
            <span className="text-xs text-muted-foreground">{uniqueDevicesCount || recentDevices.length} devices</span>
          </div>
          <div className="space-y-2">
            {recentDevices.length > 0 ? (
              recentDevices.slice(0, 5).map((device, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-foreground p-2 bg-white dark:bg-gray-900 rounded border border-panel-border font-mono">
                  <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                  <span className="truncate text-xs">{device}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No devices available</p>
            )}
          </div>
          {recentDevices.length > 5 && (
            <button
              onClick={() => router.push(`/customer-risk/${profileId}/location-history`)}
              className="w-full mt-3 text-center text-xs text-blue-600 hover:underline flex items-center justify-center gap-1 cursor-pointer"
            >
              <ICONS.ExternalLink size={12} />
              View Full History ({recentDevices.length} devices)
            </button>
          )}
        </div>

        {/* Anonymizer Attempts */}
        <div className={`p-4 rounded-lg border ${
          anonymizerAttempts.length > 0
            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            : "bg-gray-50 dark:bg-gray-800 border-panel-border"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <ICONS.Shield size={14} className={anonymizerAttempts.length > 0 ? "text-red-600" : "text-gray-600"} />
              Anonymizer Attempts
            </h4>
            {anonymizerAttempts.length > 0 && (
              <span className="px-2 py-0.5 bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200 rounded-full text-xs font-semibold">
                {anonymizerAttempts.length} detected
              </span>
            )}
          </div>
          <div className="space-y-2">
            {anonymizerAttempts.length > 0 ? (
              anonymizerAttempts.slice(0, 5).map((attempt: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-sm p-2 bg-white dark:bg-gray-900 rounded border border-red-200 dark:border-red-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 text-xs rounded">
                      {attempt.proxyType || attempt.type || 'VPN/Proxy'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{attempt.ipAddress || attempt.ip_address || 'Unknown IP'}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <ICONS.CheckCircle size={24} className="mx-auto mb-2 text-green-500" />
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">No anonymizer attempts detected</p>
              </div>
            )}
          </div>
          {anonymizerAttempts.length > 5 && (
            <button
              onClick={() => router.push(`/customer-risk/${profileId}/location-history`)}
              className="w-full mt-3 text-center text-xs text-red-600 hover:underline flex items-center justify-center gap-1 cursor-pointer"
            >
              <ICONS.ExternalLink size={12} />
              View Full History ({anonymizerAttempts.length} attempts)
            </button>
          )}
        </div>
      </div>

      {/* Event History */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Location History</h4>
        <div className="space-y-3">
          {displayedEvents.map((event) => {
            const changes = getChangeIndicator(event);
            return (
              <div
                key={event.id}
                className={`p-4 rounded-lg border ${
                  changes.length > 0
                    ? "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/10"
                    : "border-panel-border bg-gray-50 dark:bg-gray-800"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">
                      {event.city}, {event.region}, {event.country}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(event.timestamp)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.proxyType !== "None" && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs rounded font-medium">
                        {event.proxyType}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        event.riskScore >= 60
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          : event.riskScore >= 40
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      }`}
                    >
                      Risk: {event.riskScore}
                    </span>
                  </div>
                </div>

                {/* Change Indicators */}
                {changes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {changes.map((change) => (
                      <span
                        key={change}
                        className="px-1.5 py-0.5 bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200 text-xs rounded"
                      >
                        {change} Changed
                      </span>
                    ))}
                  </div>
                )}

                {/* Enhanced Geolocation Fields - E9-F3-US01 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t border-panel-border">
                  <div>
                    <span className="font-medium text-foreground">IP Address:</span>
                    <p className="font-mono truncate">{event.ipAddress}</p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Device ID:</span>
                    <p className="font-mono truncate">{event.deviceIdentifier || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Coordinates:</span>
                    <p className="font-mono">{event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Risk Level:</span>
                    <p className={`font-semibold ${
                      event.riskScore >= 60 ? 'text-red-600' :
                      event.riskScore >= 40 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>{event.riskScore >= 60 ? 'High' : event.riskScore >= 40 ? 'Medium' : 'Low'}</p>
                  </div>
                </div>

                {/* Additional Technical Fields */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground mt-2">
                  <div>
                    <span className="font-medium text-foreground">ASN:</span>
                    <p>{event.asn || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">ISP/Org:</span>
                    <p className="truncate">{event.ispOrganization || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Accuracy Radius:</span>
                    <p>{event.geolocationAccuracyRadius > 0 ? `${event.geolocationAccuracyRadius}m` : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Browser Fingerprint:</span>
                    <p className="font-mono truncate">{event.browserFingerprint || 'N/A'}</p>
                  </div>
                </div>

                {/* Device Metadata */}
                {(event.deviceType || event.operatingSystem || event.browserName) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground mt-2">
                    <div>
                      <span className="font-medium text-foreground">Device Type:</span>
                      <p>{event.deviceType || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">OS:</span>
                      <p>{event.operatingSystem || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Browser:</span>
                      <p>{event.browserName ? `${event.browserName} ${event.browserVersion || ''}`.trim() : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Timezone:</span>
                      <p>N/A</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {events.length > 3 && (
          <button
            onClick={() => router.push(`/customer-risk/${profileId}/location-history`)}
            className="w-full mt-4 text-center text-sm text-blue-600 hover:underline cursor-pointer"
          >
            View All ({events.length} events)
          </button>
        )}
      </div>
    </div>
  );
};

export default GeolocationSectionWithAPI;
