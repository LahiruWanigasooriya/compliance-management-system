"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import L, { LatLngExpression, LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { GeolocationEvent } from "@/types/customer-risk.types";

// Fix Leaflet default icon issue - only run in browser
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

interface CustomerGeoMapProps {
  events: GeolocationEvent[];
}

const MapController = ({ events }: { events: GeolocationEvent[] }) => {
  const map = useMap();

  useEffect(() => {
    if (events.length > 0) {
      // Center on the most recent event
      const latestEvent = events[0];
      map.setView([latestEvent.latitude, latestEvent.longitude] as LatLngExpression, 4);

      // If there are multiple locations, fit bounds to show all
      if (events.length > 1) {
        const bounds: LatLngBoundsExpression = events.map(
          (e) => [e.latitude, e.longitude] as [number, number]
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [map, events]);

  return null;
};

const CustomerGeoMap = ({ events }: CustomerGeoMapProps) => {
  const getMarkerColor = (event: GeolocationEvent) => {
    // Color based on risk score
    if (event.riskScore >= 60) return "#dc2626"; // red
    if (event.riskScore >= 40) return "#ea580c"; // orange
    return "#16a34a"; // green
  };

  const getMarkerRadius = (event: GeolocationEvent, index: number) => {
    // Most recent event is larger
    return index === 0 ? 10 : 6;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Ensure we're in the browser environment
  if (typeof window === "undefined") {
    return (
      <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">No geolocation data available</p>
      </div>
    );
  }

  return (
    <div className="h-64 rounded-lg overflow-hidden border border-panel-border relative z-0">
      <MapContainer
        className="h-full w-full"
        center={[events[0].latitude, events[0].longitude]}
        zoom={4}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapController events={events} />

        {events.map((event, index) => (
          <CircleMarker
            key={event.id}
            center={[event.latitude, event.longitude]}
            radius={getMarkerRadius(event, index)}
            pathOptions={{
              color: getMarkerColor(event),
              fillColor: getMarkerColor(event),
              fillOpacity: index === 0 ? 0.8 : 0.5,
              weight: index === 0 ? 3 : 1,
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold mb-1">
                  {event.city}, {event.country}
                </p>
                <p className="text-xs text-gray-600 mb-2">{formatDateTime(event.timestamp)}</p>
                <div className="space-y-1 text-xs">
                  <p><strong>IP:</strong> {event.ipAddress}</p>
                  <p><strong>Device:</strong> {event.deviceType}</p>
                  <p><strong>Risk Score:</strong> {event.riskScore}</p>
                  {event.proxyType !== "None" && (
                    <p className="text-red-600"><strong>Proxy:</strong> {event.proxyType}</p>
                  )}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

export default CustomerGeoMap;
