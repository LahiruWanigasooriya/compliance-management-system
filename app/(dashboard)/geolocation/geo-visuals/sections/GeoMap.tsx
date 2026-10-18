"use client"
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, ZoomControl } from "react-leaflet";
import { useEffect } from "react";
import L, { LatLngExpression, LatLngBoundsExpression } from "leaflet";
import { GeoLocationRecord } from "@/types/geolocation.types";
import "leaflet/dist/leaflet.css";
import LoadingOverlay from "@/components/layout/LoadingOverlay";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface GeoMapProps {
  records: GeoLocationRecord[];
  loading: boolean;
}

const MapController = ({ records }: { records: GeoLocationRecord[] }) => {
  const map = useMap();

  useEffect(() => {
    if (records.length > 0) {
      const latestRecord = records[0];
      map.setView([Number(latestRecord.latitude), Number(latestRecord.longitude)] as LatLngExpression, 4);

      if (records.length > 1) {
        const bounds: LatLngBoundsExpression = records.map(
          (e) => [Number(e.latitude), Number(e.longitude)] as [number, number]
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [map, records]);

  return null;
};

const GeoMap = ({ records, loading }: GeoMapProps) => {
  const getMarkerColor = (riskScore: number) => {
    if (riskScore >= 60) return "#ef4444"; // red-500
    if (riskScore >= 40) return "#f97316"; // orange-500
    return "#22c55e"; // green-500
  };

  const getMarkerRadius = (index: number) => {
    // Most recent event is larger
    return index === 0 ? 8 : 5;
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

  if (loading) {
    return (
      <LoadingOverlay
        className="-inset-4!"
        loadingText="Loading Geo Location map..."
      />
    );
  }

  // Calculate center safely
  const defaultCenter: [number, number] = [20, 0];
  const center: [number, number] =
    records.length > 0
      ? [Number(records[0].latitude), Number(records[0].longitude)]
      : defaultCenter;

  return (
    <div className="h-full w-full relative z-0 bg-slate-50 dark:bg-slate-900">
      <MapContainer
        className="h-full w-full outline-none"
        center={center}
        zoom={4}
        minZoom={2}
        maxBounds={[
          [-90, -180],
          [90, 180],
        ]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <ZoomControl position="topright" />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <MapController records={records} />

        {records.map((record, index) => (
          <CircleMarker
            key={record.id}
            center={[Number(record.latitude), Number(record.longitude)]}
            radius={getMarkerRadius(index)}
            pathOptions={{
              color: getMarkerColor(record.risk_score),
              fillColor: getMarkerColor(record.risk_score),
              fillOpacity: index === 0 ? 0.9 : 0.6,
              weight: 1,
              opacity: 1,
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-800">
                    {record.country}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      record.risk_score >= 60
                        ? "bg-red-100 text-red-700"
                        : record.risk_score >= 40
                        ? "bg-orange-100 text-orange-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    Risk: {Math.min(record.risk_score, 100)}
                  </span>
                </div>
                
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-500">IP Address:</span>
                    <span className="font-mono">{record.ip_address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Time:</span>
                    <span>{formatDateTime(record.created_at)}</span>
                  </div>
                  
                  {(record.is_vpn || record.is_proxy || record.is_tor) && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex gap-1 flex-wrap">
                      {record.is_vpn && (
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">VPN</span>
                      )}
                      {record.is_proxy && (
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">Proxy</span>
                      )}
                      {record.is_tor && (
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">Tor</span>
                      )}
                    </div>
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

export default GeoMap;
