"use client";

import { useState } from "react";
import { ICONS } from "@/constants/constants";
import { GeolocationEvent } from "@/types/customer-risk.types";
import dynamic from "next/dynamic";

// Dynamically import the map component to avoid SSR issues
const CustomerGeoMap = dynamic(() => import("./CustomerGeoMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <p className="text-muted-foreground">Loading map...</p>
    </div>
  ),
});

interface GeolocationSectionProps {
  events: GeolocationEvent[];
}

const GeolocationSection = ({ events }: GeolocationSectionProps) => {
  const [showFullHistory, setShowFullHistory] = useState(false);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const displayedEvents = showFullHistory ? events : events.slice(0, 5);

  // Get unique values for summary
  const recentAddresses = [...new Set(events.map((e) => `${e.city}, ${e.country}`))].slice(0, 5);
  const recentIps = [...new Set(events.map((e) => e.ipAddress))].slice(0, 5);
  const recentDevices = [...new Set(events.map((e) => e.deviceIdentifier))].slice(0, 5);
  const anonymizerAttempts = events.filter((e) => e.proxyType !== "None");

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

  return (
    <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <ICONS.MapPin size={20} />
        Geolocation Data
      </h2>

      {/* Map */}
      <div className="mb-6">
        <CustomerGeoMap events={events} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Recent Locations</p>
          <p className="text-lg font-bold text-blue-600">{recentAddresses.length}</p>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Unique IPs</p>
          <p className="text-lg font-bold text-green-600">{recentIps.length}</p>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Devices</p>
          <p className="text-lg font-bold text-purple-600">{recentDevices.length}</p>
        </div>
        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">VPN/Proxy</p>
          <p className="text-lg font-bold text-orange-600">{anonymizerAttempts.length}</p>
        </div>
      </div>

      {/* Quick Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <h4 className="text-sm font-semibold mb-2">Recent Addresses</h4>
          <div className="space-y-1">
            {recentAddresses.map((addr, idx) => (
              <p key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                <ICONS.MapPin size={12} />
                {addr}
              </p>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2">Recent IP Addresses</h4>
          <div className="space-y-1">
            {recentIps.map((ip, idx) => (
              <p key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                <ICONS.Globe size={12} />
                {ip}
              </p>
            ))}
          </div>
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">IP:</span> {event.ipAddress}
                  </div>
                  <div>
                    <span className="font-medium">Device:</span> {event.deviceType}
                  </div>
                  <div>
                    <span className="font-medium">OS:</span> {event.operatingSystem}
                  </div>
                  <div>
                    <span className="font-medium">Browser:</span> {event.browserName}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {events.length > 5 && (
          <button
            onClick={() => setShowFullHistory(!showFullHistory)}
            className="w-full mt-4 text-center text-sm text-blue-600 hover:underline cursor-pointer"
          >
            {showFullHistory ? "Show Less" : `View Full History (${events.length} events)`}
          </button>
        )}
      </div>
    </div>
  );
};

export default GeolocationSection;
