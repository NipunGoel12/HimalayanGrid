import React, { useEffect, useRef, useState } from "react";
import { X, Download, Camera } from "lucide-react";
import { Button, Badge } from "./ui.jsx";
import { TOPIC_COORDS } from "../data/topicCoordinates.js";
import { getBasemaps, tileUrl } from "../services/satelliteConfig.js";

// Category → a small palette + terrain "texture" used to render a stylized,
// fully offline "satellite photo" for a topic. Nothing here is a real photo —
// it's original generated art, so it never depends on network access or
// raises any copyright/likeness concerns.
const CATEGORY_LOOK = {
  mountains: { sky: "#cfe3ef", ground: ["#8ea9a6", "#5f7d78", "#eef3f2"], label: "Ridge & snowline" },
  rivers: { sky: "#cfe6ef", ground: ["#7fa6a0", "#4d8fae", "#d9ecf2"], label: "River channel" },
  animals: { sky: "#d8e6d0", ground: ["#6f8f5c", "#4c6b3f", "#a9c48f"], label: "Habitat canopy" },
  forests: { sky: "#d6e7d4", ground: ["#4c6b3f", "#375a34", "#88a978"], label: "Forest cover" },
  weather: { sky: "#e3edf5", ground: ["#9fb6c4", "#7592a3", "#f3f7fa"], label: "Cloud & terrain" },
  history: { sky: "#ecdfc7", ground: ["#b79e77", "#8c7350", "#e3d3ac"], label: "Heritage site" },
  culture: { sky: "#f0dbe3", ground: ["#c98fa8", "#a2607f", "#f2e2e9"], label: "Settlement area" },
  science: { sky: "#dbe4f5", ground: ["#8fa0c9", "#63719e", "#e6ecf7"], label: "Study region" },
  space: { sky: "#1c2340", ground: ["#2c355e", "#161a30", "#4b5794"], label: "Observation site" },
  satellites: { sky: "#1c2340", ground: ["#2c355e", "#161a30", "#4b5794"], label: "Ground station" },
};

function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function formatCoord(v, posLabel, negLabel) {
  return `${Math.abs(v).toFixed(4)}°${v >= 0 ? posLabel : negLabel}`;
}

/** Draws a stylized, procedurally-generated "satellite image" for a topic
 * onto the given canvas. Fully deterministic per topic id, fully offline. */
export function renderMockSatelliteImage(canvas, topic) {
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext("2d");
  const look = CATEGORY_LOOK[topic.category] || CATEGORY_LOOK.mountains;
  const rand = seededRandom(hashString(topic.id || topic.title || "hlg"));

  // Base terrain gradient
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, look.sky);
  g.addColorStop(1, look.ground[0]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Terrain "patches" — deterministic blobs standing in for real terrain texture
  for (let i = 0; i < 26; i++) {
    const r = 14 + rand() * 46;
    const x = rand() * W;
    const y = H * 0.35 + rand() * H * 0.6;
    ctx.beginPath();
    ctx.fillStyle = look.ground[i % 2 === 0 ? 1 : 2];
    ctx.globalAlpha = 0.35 + rand() * 0.25;
    ctx.ellipse(x, y, r, r * 0.55, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Ridge silhouette across the middle, since this app is Himalaya-themed
  ctx.beginPath();
  ctx.moveTo(0, H * 0.42);
  for (let x = 0; x <= W; x += W / 10) {
    ctx.lineTo(x, H * 0.42 - (rand() - 0.5) * H * 0.22);
  }
  ctx.lineTo(W, H * 0.6);
  ctx.lineTo(0, H * 0.6);
  ctx.closePath();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fill();

  // Faint scanline / sensor-grid texture to sell the "satellite sensor" feel
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let y = 0; y < H; y += 6) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Crosshair + pin at center
  const cx = W / 2, cy = H / 2;
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 14, cy); ctx.lineTo(cx + 14, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy + 14); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.stroke();

  // Corner frame ticks, like a targeting/sensor readout
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  const t = 18;
  [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]].forEach(([x, y, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(x, y + dy * t); ctx.lineTo(x, y); ctx.lineTo(x + dx * t, y);
    ctx.stroke();
  });

  // Label footer
  ctx.fillStyle = "rgba(8,14,26,0.55)";
  ctx.fillRect(0, H - 40, W, 40);
  ctx.fillStyle = "#fff";
  ctx.font = "600 13px system-ui, sans-serif";
  ctx.fillText(`${topic.icon || "🛰️"} ${topic.title}`, 10, H - 22);
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  const coords = TOPIC_COORDS[topic.id];
  const coordText = coords
    ? `${formatCoord(coords[0], "N", "S")}  ${formatCoord(coords[1], "E", "W")}`
    : look.label;
  ctx.fillText(coordText, 10, H - 8);
}


// ---------------------------------------------------------------------------
// Real imagery snapshot: stitches actual satellite tiles around a topic's
// coordinates onto the canvas (same provider as the Real map's "Satellite"
// layer). Rejects if tiles can't be loaded/read (offline, blocked, no CORS),
// in which case the caller falls back to the generated offline image above.
// ---------------------------------------------------------------------------
const PHOTO_ZOOM = 12;

function loadTile(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timer = setTimeout(() => reject(new Error("tile timeout")), 8000);
    img.onload = () => { clearTimeout(timer); resolve(img); };
    img.onerror = () => { clearTimeout(timer); reject(new Error("tile failed")); };
    img.src = url;
  });
}

export async function renderRealSatelliteImage(canvas, topic) {
  const coords = TOPIC_COORDS[topic.id];
  if (!coords) throw new Error("no coordinates");
  const layer = getBasemaps().satellite;
  const W = canvas.width, H = canvas.height, z = PHOTO_ZOOM;
  const [lat, lon] = coords;
  const scale = 256 * 2 ** z;
  const px = ((lon + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const py = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  const left = px - W / 2, top = py - H / 2;
  const tx0 = Math.floor(left / 256), tx1 = Math.floor((left + W) / 256);
  const ty0 = Math.floor(top / 256), ty1 = Math.floor((top + H) / 256);

  const jobs = [];
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      jobs.push(loadTile(tileUrl(layer, z, tx, ty)).then((img) => ({ img, tx, ty })));
    }
  }
  const tiles = await Promise.all(jobs); // any failure rejects -> caller falls back

  const ctx = canvas.getContext("2d");
  tiles.forEach(({ img, tx, ty }) => ctx.drawImage(img, tx * 256 - left, ty * 256 - top));
  ctx.getImageData(0, 0, 1, 1); // throws if the canvas got tainted (no CORS)

  // Sensor-style overlay: crosshair, corner ticks, caption
  const cx = W / 2, cy = H / 2;
  ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 14, cy); ctx.lineTo(cx + 14, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy + 14); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  const t = 18;
  [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]].forEach(([x, y, dx, dy]) => {
    ctx.beginPath(); ctx.moveTo(x, y + dy * t); ctx.lineTo(x, y); ctx.lineTo(x + dx * t, y); ctx.stroke();
  });
  ctx.fillStyle = "rgba(8,14,26,0.62)"; ctx.fillRect(0, H - 44, W, 44);
  ctx.fillStyle = "#fff"; ctx.font = "600 13px system-ui, sans-serif";
  ctx.fillText(`${topic.icon || "🛰️"} ${topic.title}`, 10, H - 26);
  ctx.font = "11px system-ui, sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.fillText(`${formatCoord(lat, "N", "S")}  ${formatCoord(lon, "E", "W")}  ·  z${z}`, 10, H - 11);
  ctx.textAlign = "right";
  ctx.fillText(layer.source, W - 10, H - 11);
  ctx.textAlign = "left";
  return layer.source;
}

/** Modal showing a per-topic simulated satellite photo, downloadable as PNG. */
export function SatellitePhotoModal({ topic, onClose, notify }) {
  const canvasRef = useRef(null);
  // "loading" -> "real" (actual imagery) | "offline" (generated fallback)
  const [state, setState] = useState({ kind: "loading", source: "" });

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    setState({ kind: "loading", source: "" });
    renderMockSatelliteImage(canvas, topic); // instant placeholder while tiles load
    renderRealSatelliteImage(canvas, topic)
      .then((source) => { if (!cancelled) setState({ kind: "real", source }); })
      .catch(() => {
        if (cancelled) return;
        renderMockSatelliteImage(canvas, topic); // repaint clean fallback (tiles may have half-drawn)
        setState({ kind: "offline", source: "" });
      });
    return () => { cancelled = true; };
  }, [topic]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${(topic.title || "himalaya-topic").replace(/\s+/g, "-").toLowerCase()}-satellite.png`;
    a.click();
    notify?.(`Saved a satellite snapshot of ${topic.title}.`, "info");
  }

  return (
    <div className="labeling-modal-overlay" onClick={onClose}>
      <div className="labeling-modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 18px 0" }}>
          <div>
            <Badge tone={state.kind === "real" ? "success" : "brand"}>
              {state.kind === "real" ? "🛰️ Real satellite image" : state.kind === "loading" ? "🛰️ Fetching satellite image…" : "🛰️ Offline illustration"}
            </Badge>
            <div style={{ fontWeight: 700, fontSize: 15.5, marginTop: 6 }}>{topic.title}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              {state.kind === "real"
                ? `Imagery from ${state.source}, centred on this topic's coordinates.`
                : state.kind === "loading"
                ? "Requesting imagery for this location…"
                : "No connection to the imagery server, so this is an on-device illustration from the topic's coordinates."}
            </div>
          </div>
          <button className="btn ghost small" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div style={{ padding: 18 }}>
          <canvas
            ref={canvasRef}
            width={520}
            height={340}
            style={{ width: "100%", height: "auto", borderRadius: 12, display: "block", border: "1px solid var(--border)" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
            <Button onClick={download} disabled={state.kind === "loading"}><Download size={14} /> Save image</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Floating "capture" control for the real map. Tries to snapshot the actual
 * live map view (satellite/terrain tiles included); if the browser blocks it
 * — most tile servers don't send the CORS headers a canvas snapshot needs —
 * it falls back to a generated satellite-style card for whatever topic is
 * centered on screen, so the feature always produces something to save.
 */
export function MapCaptureButton({ getMapContainer, centerTopic, notify }) {
  const [busy, setBusy] = useState(false);

  async function capture() {
    setBusy(true);
    try {
      const container = getMapContainer?.();
      if (!container) throw new Error("map not ready");
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(container, { useCORS: true, logging: false, backgroundColor: null });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "himalayan-map-view.png";
      a.click();
      notify?.("Saved the current map view.", "info");
    } catch (err) {
      // Tile servers without CORS headers taint the canvas — fall back to a
      // generated snapshot so "Capture" never just fails silently.
      const fallbackTopic = typeof centerTopic === "function" ? centerTopic() : centerTopic;
      if (fallbackTopic) {
        const canvas = document.createElement("canvas");
        canvas.width = 520; canvas.height = 340;
        renderMockSatelliteImage(canvas, fallbackTopic);
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = "himalayan-map-view.png";
        a.click();
        notify?.("Live tiles can't be saved directly, so here's a generated satellite-style snapshot instead.", "warning");
      } else {
        notify?.("Couldn't capture the map view — try again once the map has finished loading.", "warning");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="map-tool-btn" onClick={capture} disabled={busy} title="Capture the current map view as an image">
      <Camera size={13} /> {busy ? "Capturing…" : "Capture"}
    </button>
  );
}
