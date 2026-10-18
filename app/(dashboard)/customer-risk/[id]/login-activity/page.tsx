'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ICONS } from '@/constants/constants';
import { getGeolocationHistory } from '@/actions/customer-risk.actions';
import type { GeolocationHistoryAPI } from '@/types/customer-risk.types';
import PaginationControls, {
  getTotalPages,
} from '@/components/ui/PaginationControls';
import LoadingOverlay from '@/components/layout/LoadingOverlay';

export default function LoginActivityPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.id as string;

  const [loginEvents, setLoginEvents] = useState<GeolocationHistoryAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = useMemo(
    () => getTotalPages(loginEvents.length, pageSize),
    [loginEvents.length, pageSize],
  );

  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return loginEvents.slice(startIndex, startIndex + pageSize);
  }, [loginEvents, currentPage, pageSize]);

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
          const filteredEvents = response.data.records.filter(
            (record) => record.event_type === "login"
          );
          setLoginEvents(filteredEvents);
        } else {
          setError('Failed to load login activity');
        }
      } catch (err) {
        setError('An error occurred while loading login activity');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (profileId) {
      fetchData();
    }
  }, [profileId]);

  const toTitleCase = (str: string | null | undefined): string => {
    if (!str) return 'N/A';
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${hour12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="relative h-96">
        <LoadingOverlay loadingText="Loading login activity..." />
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
            <h1 className="text-2xl font-bold text-foreground">Login Activity</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {loginEvents.length} login event{loginEvents.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
        </div>
      </div>

      {/* Login Activity List */}
      <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
        {loginEvents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ICONS.Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No login activity available for this profile.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedEvents.map((login) => (
              <div
                key={login.id}
                className="border border-panel-border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {formatDateTime(login.created_at)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        login.risk_level === "critical"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          : login.risk_level === "high"
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                            : login.risk_level === "medium"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      }`}
                    >
                      {toTitleCase(login.risk_level)} Risk
                    </span>
                    {login.is_compliant ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        Compliant
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        Non-Compliant
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">IP Address</p>
                    <p className="text-sm font-medium text-foreground">
                      {login.ip_address || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Country</p>
                    <p className="text-sm font-medium text-foreground">
                      {login.country || login.country_iso || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Risk Score</p>
                    <p className="text-sm font-medium text-foreground">
                      {login.risk_score}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Device ID</p>
                    <p className="text-sm font-medium text-foreground truncate">
                      {login.device_id
                        ? login.device_id.substring(0, 8) + "..."
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Location</p>
                    <p className="text-sm font-medium text-foreground">
                      {login.latitude !== 0 || login.longitude !== 0
                        ? `${login.latitude.toFixed(2)}, ${login.longitude.toFixed(2)}`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Blocked</p>
                    <p className="text-sm font-medium text-foreground">
                      {login.is_blocked ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
                {/* Security Flags */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-panel-border">
                  {login.is_vpn && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                      VPN
                    </span>
                  )}
                  {login.is_proxy && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                      Proxy
                    </span>
                  )}
                  {login.is_tor && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                      TOR
                    </span>
                  )}
                  {login.is_hosting && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                      Hosting
                    </span>
                  )}
                  {login.is_location_change && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      Location Change
                    </span>
                  )}
                  {login.is_country_change && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                      Country Change
                    </span>
                  )}
                  {login.is_device_change && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                      Device Change
                    </span>
                  )}
                  {!login.is_vpn &&
                    !login.is_proxy &&
                    !login.is_tor &&
                    !login.is_hosting &&
                    !login.is_location_change &&
                    !login.is_country_change &&
                    !login.is_device_change && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        No Flags
                      </span>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}

        {loginEvents.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalRecords={loginEvents.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[10, 20, 50]}
          />
        )}
      </div>
    </div>
  );
}
