'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ICONS } from '@/constants/constants';
import { GeolocationEvent } from '@/types/customer-risk.types';
import { getGeolocationHistory } from '@/actions/customer-risk.actions';
import type { GeolocationHistoryAPI } from '@/types/customer-risk.types';
import PaginationControls, {
  getTotalPages,
} from '@/components/ui/PaginationControls';
import LoadingOverlay from '@/components/layout/LoadingOverlay';

// Helper function to map backend API data to frontend GeolocationEvent format
const mapToGeolocationEvent = (apiData: GeolocationHistoryAPI): GeolocationEvent => {
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
    asn: "",
    ispOrganization: "",
    proxyType: proxyType,
    geolocationAccuracyRadius: 0,
    deviceIdentifier: apiData.device_id || "Unknown",
    deviceType: "",
    operatingSystem: "",
    browserName: "",
    browserVersion: "",
    browserFingerprint: "",
    riskScore: apiData.risk_score,
    countryChanged: apiData.is_country_change,
    regionChanged: apiData.is_location_change && !apiData.is_country_change,
    cityChanged: apiData.is_location_change && !apiData.is_country_change,
    deviceChanged: apiData.is_device_change,
    proxyTypeChanged: false,
    riskScoreIncreased: false,
  };
};

export default function LocationHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.id as string;

  const [events, setEvents] = useState<GeolocationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = useMemo(
    () => getTotalPages(events.length, pageSize),
    [events.length, pageSize],
  );

  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return events.slice(startIndex, startIndex + pageSize);
  }, [events, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getGeolocationHistory({
          profile_id: profileId,
          date_preset: "last_90_days",
          limit: 1000,
        });
        if (response.success && response.data.records) {
          const mappedEvents = response.data.records.map(mapToGeolocationEvent);
          setEvents(mappedEvents);
        } else {
          setError('Failed to load location history');
        }
      } catch (err) {
        setError('An error occurred while loading location history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (profileId) {
      fetchData();
    }
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
      <div className="relative h-96">
        <LoadingOverlay loadingText="Loading location history..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ICONS.AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 font-semibold mb-2">Error</p>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/customer-risk/${profileId}`)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ICONS.ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Location History</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {events.length} location event{events.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
        </div>
      </div>

      {/* Location History Table */}
      <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
        {events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ICONS.MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No location history available for this profile.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedEvents.map((event) => {
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

                  {/* Geolocation Fields */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t border-panel-border">
                    <div>
                      <span className="font-medium text-foreground">IP Address:</span>
                      <p className="font-mono">{event.ipAddress}</p>
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
        )}

        {events.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalRecords={events.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[10, 20, 50]}
          />
        )}
      </div>
    </div>
  );
}
