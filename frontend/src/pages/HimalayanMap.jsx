import React, { useEffect, useMemo, useRef, useState } from "react";
import { Map, Satellite, Mountain as MountainIcon, Layers, Grid3x3, Radio } from "lucide-react";
import { api } from "../services/apiClient.js";
import { SkeletonLines } from "../components/ui.jsx";
import { MAP_MODES, CATEGORIES } from "../constants.js";
import RealMap from "../components/RealMap.jsx";
import LabelingActivity from "../components/LabelingActivity.jsx";
import { SatellitePhotoModal, MapCaptureButton } from "../components/SatelliteCapture.jsx";
import { TOPIC_COORDS } from "../data/topicCoordinates.js";
import { getBasemaps, SATELLITE_PROVIDER } from "../services/satelliteConfig.js";

export default function HimalayanMap({ student, openTopic, notify }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("geography");
  const [hovered, setHovered] = useState(null);
  const [mapType, setMapType] = useState("illustrated"); // "illustrated" | "real"
  const [basemap, setBasemap] = useState("satellite"); // "satellite" | "live" | "terrain"
  const [showGrid, setShowGrid] = useState(false);
  const [labelingTopic, setLabelingTopic] = useState(null);
  const [photoTopic, setPhotoTopic] = useState(null);
  const realMapRef = useRef(null);
  const basemaps = useMemo(() => getBasemaps(), []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setTopics(await api.getTopics(null, student.id)); } catch { setTopics([]); }
      setLoading(false);
    })();
  }, [student.id]);

  const activeMode = MAP_MODES.find((m) => m.id === mode);
  const visible = topics.filter((t) => activeMode.categories.includes(t.category));
  const visibleOnRealMap = visible.filter((t) => TOPIC_COORDS[t.id]);

  return (
    <div className="view-max">
      <div className="section">
        <div className="page-title">Himalayan Map</div>
        <div className="page-subtitle">
          {mapType === "real"
            ? "Explore a real satellite map of the Himalayas! Tap a pin to learn about it, see real photos of the place, label it, or snap a satellite photo."
            : "An offline map to explore — no internet needed! Pick a mode, then tap a glowing pin to discover what\u2019s there."}
        </div>
      </div>

      <div className="section" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {MAP_MODES.map((m) => (
            <button
              key={m.id}
              className={`category-pill ${mode === m.id ? "active" : ""}`}
              style={mode === m.id ? { background: "var(--brand)", borderColor: "var(--brand)" } : undefined}
              onClick={() => setMode(m.id)}
            >
              <span>{m.icon}</span>{m.label}
            </button>
          ))}
        </div>

        <div className="map-type-toggle">
          <button className={mapType === "illustrated" ? "active" : ""} onClick={() => setMapType("illustrated")}>
            <Layers size={13} /> Illustrated
          </button>
          <button className={mapType === "real" ? "active" : ""} onClick={() => setMapType("real")}>
            <Map size={13} /> Real map
          </button>
        </div>
      </div>

      {loading ? (
        <div className="panel panel-pad"><SkeletonLines count={4} /></div>
      ) : mapType === "real" ? (
        <div className="real-map-wrap">
          <div className="map-frame" style={{ height: 460, position: "relative" }}>
            <RealMap
              ref={realMapRef}
              topics={visibleOnRealMap}
              basemap={basemap}
              showGrid={showGrid}
              onExplore={openTopic}
              onLabel={setLabelingTopic}
              onPhoto={setPhotoTopic}
            />
          </div>
          <div className="basemap-switch">
            <button className={basemap === "satellite" ? "active" : ""} onClick={() => setBasemap("satellite")}>
              <Satellite size={12} style={{ marginRight: 4, verticalAlign: -2 }} />Satellite
            </button>
            <button className={basemap === "live" ? "active" : ""} onClick={() => setBasemap("live")}>
              <Radio size={12} style={{ marginRight: 4, verticalAlign: -2 }} />Live
            </button>
            <button className={basemap === "terrain" ? "active" : ""} onClick={() => setBasemap("terrain")}>
              <MountainIcon size={12} style={{ marginRight: 4, verticalAlign: -2 }} />Terrain
            </button>
          </div>
          <div className="map-source-caption" title={`Provider: ${SATELLITE_PROVIDER}`}>
            {(basemaps[basemap] || basemaps.satellite).live && <span className="live-dot" />}
            {(basemaps[basemap] || basemaps.satellite).source}
          </div>
          <div className="map-tools-cluster">
            <button className={`map-tool-btn ${showGrid ? "active" : ""}`} onClick={() => setShowGrid((v) => !v)} title="Toggle lat/long coordinate grid">
              <Grid3x3 size={13} /> Grid
            </button>
            <MapCaptureButton
              getMapContainer={() => realMapRef.current?.getContainer()}
              centerTopic={() => realMapRef.current?.centerTopic()}
              notify={notify}
            />
          </div>
        </div>
      ) : (
        <div className="map-frame" style={{ height: 420, position: "relative" }}>
          <MapIllustration />
          {visible.map((t) => (
            <button
              key={t.id}
              className="map-pin"
              style={{ left: `${t.mapX}%`, top: `${t.mapY}%` }}
              onMouseEnter={() => setHovered(t.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => openTopic(t.id)}
              aria-label={`Explore ${t.title}`}
            >
              <span className="map-pin-dot" style={{ background: t.color }}>
                <span className="map-pin-icon">{t.icon}</span>
              </span>
              {hovered === t.id && <span className="map-pin-label">{t.title}</span>}
            </button>
          ))}
        </div>
      )}

      <div className="section" style={{ marginTop: 14 }}>
        <div className="faint" style={{ fontSize: 11.5 }}>
          {mapType === "real"
            ? `${visibleOnRealMap.length} location${visibleOnRealMap.length === 1 ? "" : "s"} plotted on real satellite imagery in ${activeMode.label} mode. Tiles you have already viewed are cached for offline use; switch to Illustrated for the fully offline version.`
            : `${visible.length} location${visible.length === 1 ? "" : "s"} in ${activeMode.label} mode. This illustrated map works fully offline; switch to Real map for satellite imagery.`}
        </div>
      </div>

      {labelingTopic && (
        <LabelingActivity topic={labelingTopic} onClose={() => setLabelingTopic(null)} />
      )}

      {photoTopic && (
        <SatellitePhotoModal topic={photoTopic} onClose={() => setPhotoTopic(null)} notify={notify} />
      )}
    </div>
  );
}

/** Stylized cartographic illustration of the Himalayan region — elevation ridges,
 *  glacial lakes, the Indus/Brahmaputra river system, and alpine valleys. */
function MapIllustration() {
  return (
    <svg viewBox="0 0 100 60" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="mapRidgeFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E3A5F" />
          <stop offset="100%" stopColor="#0F233D" />
        </linearGradient>
        <linearGradient id="mapRidgeMid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#142B47" />
          <stop offset="100%" stopColor="#0A1829" />
        </linearGradient>
        <linearGradient id="mapForestValleys" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F4C3A" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#06281E" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="mapRiverGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>

      {/* Topographic High Alpine Ridges */}
      <polygon points="0,60 0,28 14,8 28,24 44,4 62,22 76,10 90,20 100,12 100,60" fill="url(#mapRidgeFar)" />
      {/* Snow facet crests */}
      <polygon points="44,4 38,16 50,14" fill="#FFFFFF" opacity="0.85" />
      <polygon points="14,8 10,18 19,16" fill="#FFFFFF" opacity="0.8" />
      <polygon points="76,10 70,20 82,18" fill="#FFFFFF" opacity="0.8" />

      {/* Mid Elevation Foothills */}
      <polygon points="0,60 0,38 18,20 36,34 56,16 75,32 100,20 100,60" fill="url(#mapRidgeMid)" />
      <polygon points="56,16 50,26 62,24" fill="#BAE6FD" opacity="0.5" />

      {/* River System */}
      <path d="M68,2 Q72,30 84,60" stroke="url(#mapRiverGrad)" strokeWidth="1.2" fill="none" />
      <path d="M32,22 Q36,40 44,60" stroke="url(#mapRiverGrad)" strokeWidth="0.9" fill="none" opacity="0.75" />

      {/* Valley Forest Sanctuaries */}
      <ellipse cx="20" cy="46" rx="12" ry="5" fill="url(#mapForestValleys)" />
      <ellipse cx="56" cy="49" rx="14" ry="5.5" fill="url(#mapForestValleys)" />

      {/* Cartographic Grid Lines */}
      <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(186, 230, 253, 0.08)" strokeDasharray="1 3" strokeWidth="0.5" />
      <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(186, 230, 253, 0.08)" strokeDasharray="1 3" strokeWidth="0.5" />
      <line x1="33" y1="0" x2="33" y2="60" stroke="rgba(186, 230, 253, 0.08)" strokeDasharray="1 3" strokeWidth="0.5" />
      <line x1="66" y1="0" x2="66" y2="60" stroke="rgba(186, 230, 253, 0.08)" strokeDasharray="1 3" strokeWidth="0.5" />
    </svg>
  );
}
