"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import L, { LatLngExpression } from "leaflet";
import { GeoLocationRecord } from "@/types/geolocation.types";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface GeoAlertMapProps {
  record: GeoLocationRecord;
}

const MapController = ({ record }: { record: GeoLocationRecord }) => {
  const map = useMap();

  useEffect(() => {
    if (record) {
      map.setView(
        [Number(record.latitude), Number(record.longitude)] as LatLngExpression,
        6
      );
    }
  }, [map, record]);

  return null;
};

const GeoAlertMap = ({ record }: GeoAlertMapProps) => {
  const getMarkerColor = (record: GeoLocationRecord) => {
    if (record.risk_score >= 60) return "#dc2626"; // red
    if (record.risk_score >= 40) return "#ea580c"; // orange
    return "#16a34a"; // green
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

  if (!record || !record.latitude || !record.longitude) {
    return (
      <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">No location data available</p>
      </div>
    );
  }

  return (
    <div className="h-64 rounded-lg overflow-hidden border border-border relative z-0">
      <MapContainer
        className="h-full w-full"
        center={[Number(record.latitude), Number(record.longitude)]}
        zoom={6}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapController record={record} />

        <CircleMarker
          center={[Number(record.latitude), Number(record.longitude)]}
          radius={10}
          pathOptions={{
            color: getMarkerColor(record),
            fillColor: getMarkerColor(record),
            fillOpacity: 0.8,
            weight: 3,
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold mb-1">
                {record.country}{record.country_iso ? `, ${record.country_iso}` : ""}
              </p>
              <p className="text-xs text-gray-600 mb-2">
                {formatDateTime(record.created_at)}
              </p>
              <div className="space-y-1 text-xs">
                <p>
                  <strong>IP:</strong> {record.ip_address}
                </p>
                <p>
                  <strong>Coordinates:</strong> {Number(record.latitude).toFixed(4)}, {Number(record.longitude).toFixed(4)}
                </p>
                <p>
                  <strong>Risk Score:</strong> {Math.min(record.risk_score,100)}
                </p>
                <p>
                  <strong>Provider:</strong> {record.provider || "N/A"}
                </p>
                {(record.is_vpn || record.is_proxy || record.is_tor) && (
                  <p className="text-red-600">
                    <strong>Anonymizer:</strong>{" "}
                    {record.is_tor ? "TOR" : record.is_vpn ? "VPN" : "Proxy"}
                  </p>
                )}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
};

export default GeoAlertMap;
