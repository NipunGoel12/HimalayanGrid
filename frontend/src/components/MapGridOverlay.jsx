import React, { useCallback, useEffect, useState } from "react";
import { useMap, useMapEvents } from "react-leaflet";

// Pick a graticule spacing (in degrees) that stays legible at the current zoom.
function gridStepForZoom(zoom) {
  if (zoom <= 5) return 5;
  if (zoom <= 7) return 2;
  if (zoom <= 9) return 1;
  if (zoom <= 11) return 0.5;
  return 0.25;
}

function formatLat(lat) {
  const v = Math.round(Math.abs(lat) * 100) / 100;
  return `${v}°${lat >= 0 ? "N" : "S"}`;
}
function formatLon(lon) {
  const v = Math.round(Math.abs(lon) * 100) / 100;
  return `${v}°${lon >= 0 ? "E" : "W"}`;
}

/**
 * Draws a lat/long coordinate grid over the map so students can see how
 * location is measured. Pure overlay — never intercepts clicks/drag.
 * Must be rendered as a child of <MapContainer>.
 */
export default function MapGridOverlay({ visible }) {
  const map = useMap();
  const [grid, setGrid] = useState({ lat: [], lon: [], w: 0, h: 0 });

  const recompute = useCallback(() => {
    if (!visible) return;
    const bounds = map.getBounds();
    const size = map.getSize();
    const step = gridStepForZoom(map.getZoom());
    const center = bounds.getCenter();

    const north = Math.ceil(bounds.getNorth() / step) * step;
    const south = Math.floor(bounds.getSouth() / step) * step;
    const west = Math.floor(bounds.getWest() / step) * step;
    const east = Math.ceil(bounds.getEast() / step) * step;

    const lat = [];
    for (let v = south, guard = 0; v <= north && guard < 200; v += step, guard++) {
      const y = map.latLngToContainerPoint([v, center.lng]).y;
      lat.push({ v, y, label: formatLat(v) });
    }
    const lon = [];
    for (let v = west, guard = 0; v <= east && guard < 200; v += step, guard++) {
      const x = map.latLngToContainerPoint([center.lat, v]).x;
      lon.push({ v, x, label: formatLon(v) });
    }
    setGrid({ lat, lon, w: size.x, h: size.y });
  }, [map, visible]);

  useEffect(() => { recompute(); }, [recompute, visible]);
  useMapEvents({ move: recompute, zoom: recompute, resize: recompute });

  if (!visible || grid.w === 0) return null;

  return (
    <svg
      className="map-grid-overlay"
      width={grid.w}
      height={grid.h}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 450 }}
    >
      {grid.lat.map((l) => (
        <g key={`lat-${l.v}`}>
          <line x1={0} y1={l.y} x2={grid.w} y2={l.y} className="map-grid-line" />
          <text x={4} y={l.y - 4} className="map-grid-label">{l.label}</text>
        </g>
      ))}
      {grid.lon.map((l) => (
        <g key={`lon-${l.v}`}>
          <line x1={l.x} y1={0} x2={l.x} y2={grid.h} className="map-grid-line" />
          <text x={l.x + 4} y={13} className="map-grid-label">{l.label}</text>
        </g>
      ))}
    </svg>
  );
}
