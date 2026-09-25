import React, { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TOPIC_COORDS, HIMALAYA_CENTER, HIMALAYA_DEFAULT_ZOOM } from "../data/topicCoordinates.js";
import { getBasemaps } from "../services/satelliteConfig.js";
import MapGridOverlay from "./MapGridOverlay.jsx";
import PlacePhotoGallery from "./PlacePhotoGallery.jsx";

function pinIcon(topic) {
  return L.divIcon({
    className: "real-map-pin",
    html: `<div class="real-map-pin-dot" style="background:${topic.color}"><span>${topic.icon}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
    popupAnchor: [0, -26],
  });
}

/**
 * Real satellite / live-imagery / terrain map.
 * Tile sources (and any optional API keys) live in services/satelliteConfig.js.
 */
const RealMap = forwardRef(function RealMap({ topics, basemap, showGrid, onExplore, onLabel, onPhoto }, ref) {
  const mapInstanceRef = useRef(null);
  const basemaps = useMemo(() => getBasemaps(), []);
  const located = useMemo(
    () => topics.filter((t) => TOPIC_COORDS[t.id]).map((t) => ({ ...t, coords: TOPIC_COORDS[t.id] })),
    [topics]
  );
  const layer = basemaps[basemap] || basemaps.satellite;

  useImperativeHandle(ref, () => ({
    getContainer: () => mapInstanceRef.current?.getContainer() || null,
    centerTopic: () => located[Math.floor(located.length / 2)] || topics[0] || null,
  }), [located, topics]);

  return (
    <MapContainer
      ref={mapInstanceRef}
      center={HIMALAYA_CENTER}
      zoom={HIMALAYA_DEFAULT_ZOOM}
      minZoom={4}
      style={{ width: "100%", height: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        key={basemap + layer.url}
        url={layer.url}
        attribution={layer.attribution}
        maxZoom={layer.maxZoom}
        maxNativeZoom={layer.maxNativeZoom}
        tileSize={layer.tileSize || 256}
        zoomOffset={layer.zoomOffset || 0}
        crossOrigin="anonymous"
      />
      {layer.labels && (
        <TileLayer
          key={`${basemap}-labels`}
          url={layer.labels.url}
          maxZoom={layer.labels.maxZoom}
          maxNativeZoom={layer.labels.maxNativeZoom}
          crossOrigin="anonymous"
          pane="overlayPane"
        />
      )}
      <MapGridOverlay visible={showGrid} />
      {located.map((t) => (
        <Marker key={t.id} position={t.coords} icon={pinIcon(t)}>
          <Popup>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{t.icon} {t.title}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 4 }}>{t.region}</div>
            <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginBottom: 8 }}>
              {t.coords[0].toFixed(3)}°N, {t.coords[1].toFixed(3)}°E
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              <button className="btn primary small" onClick={() => onExplore(t.id)}>Learn</button>
              <button className="btn secondary small" onClick={() => onLabel(t)}>🏷️ Label</button>
              <button className="btn secondary small" onClick={() => onPhoto(t)}>📷 Photo</button>
            </div>
            <PlacePhotoGallery lat={t.coords[0]} lon={t.coords[1]} title={t.title} mode="compact" />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
});

export default RealMap;
