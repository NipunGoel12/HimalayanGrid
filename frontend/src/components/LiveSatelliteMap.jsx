import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getBasemaps } from "../services/satelliteConfig.js";
import { footprintRadiusKm } from "../services/satelliteTracking.js";

const satIcon = (name, selected) =>
  L.divIcon({
    className: "live-sat-icon",
    html: `<div class="live-sat-chip ${selected ? "selected" : ""}"><span>🛰️</span><b>${name}</b></div>`,
    iconSize: [0, 0],
    iconAnchor: [14, 14],
  });

const hubIcon = L.divIcon({
  className: "real-map-pin",
  html: `<div class="real-map-pin-dot" style="background:#F59E0B"><span>📡</span></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 28],
  popupAnchor: [0, -26],
});

/** Re-centres the map when the hub changes. */
function FlyTo({ observer }) {
  const map = useMap();
  useEffect(() => {
    if (observer) map.flyTo([observer.lat, observer.lon], Math.max(map.getZoom(), 4), { duration: 0.8 });
  }, [observer?.lat, observer?.lon]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/**
 * Live world map: real satellite positions (SGP4), the selected satellite's
 * ground track and coverage footprint, the Local Hub, real earthquakes, and a
 * selectable NASA Earth-observation layer.
 */
export default function LiveSatelliteMap({
  records, positions, selectedId, onSelect, observer, layer, quakes, track,
}) {
  const base = useMemo(() => getBasemaps().satellite, []);
  const selected = records.find((r) => r.noradId === selectedId);
  const selPos = selected ? positions[selected.noradId] : null;

  return (
    <MapContainer
      center={[observer.lat, observer.lon]}
      zoom={3}
      minZoom={2}
      worldCopyJump
      style={{ width: "100%", height: "100%" }}
      scrollWheelZoom
    >
      <FlyTo observer={observer} />
      <TileLayer url={base.url} attribution={base.attribution} maxNativeZoom={base.maxNativeZoom} maxZoom={base.maxZoom}
        tileSize={base.tileSize || 256} zoomOffset={base.zoomOffset || 0} crossOrigin="anonymous" />
      {layer?.overlay && (
        <TileLayer key={layer.id} url={layer.overlay.url} opacity={layer.overlay.opacity}
          maxNativeZoom={layer.overlay.maxNativeZoom} maxZoom={12} crossOrigin="anonymous"
          attribution='Imagery: <a href="https://earthdata.nasa.gov/gibs">NASA EOSDIS GIBS</a>' />
      )}

      {/* Ground track + coverage footprint of the selected satellite */}
      {track?.map((seg, i) => (
        <Polyline key={i} positions={seg} pathOptions={{ color: "#38BDF8", weight: 2, opacity: 0.9, dashArray: "6 6" }} />
      ))}
      {selPos && !selected.geostationary && (
        <Circle center={[selPos.lat, selPos.lon]} radius={footprintRadiusKm(selPos.altKm, 10) * 1000}
          pathOptions={{ color: "#38BDF8", weight: 1, fillColor: "#38BDF8", fillOpacity: 0.12 }} />
      )}

      {/* Real earthquakes (USGS) */}
      {quakes?.map((q) => (
        <CircleMarker key={q.id} center={[q.lat, q.lon]} radius={Math.max(3, q.mag * 2.2)}
          pathOptions={{ color: "#fff", weight: 1, fillColor: q.mag >= 4.5 ? "#EF4444" : "#FBBF24", fillOpacity: 0.75 }}>
          <Popup>
            <b>M {q.mag?.toFixed(1)}</b> · {q.place}<br />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {new Date(q.time).toLocaleString()} · depth {q.depthKm?.toFixed(0)} km
            </span>
          </Popup>
        </CircleMarker>
      ))}

      {/* Local Hub */}
      <Marker position={[observer.lat, observer.lon]} icon={hubIcon}>
        <Popup><b>{observer.name}</b><br /><span style={{ fontSize: 11 }}>Local Hub location</span></Popup>
      </Marker>

      {/* Satellites at their real current positions */}
      {records.map((r) => {
        const p = positions[r.noradId];
        if (!p) return null;
        return (
          <Marker key={r.noradId} position={[p.lat, p.lon]} icon={satIcon(r.short, r.noradId === selectedId)}
            eventHandlers={{ click: () => onSelect(r.noradId) }} zIndexOffset={r.noradId === selectedId ? 1000 : 0} />
        );
      })}
    </MapContainer>
  );
}
