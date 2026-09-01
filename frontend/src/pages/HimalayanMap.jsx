import React, { useEffect, useState } from "react";
import { api } from "../services/apiClient.js";
import { SkeletonLines } from "../components/ui.jsx";
import { MAP_MODES, CATEGORIES } from "../constants.js";

export default function HimalayanMap({ student, openTopic }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("geography");
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setTopics(await api.getTopics(null, student.id)); } catch { setTopics([]); }
      setLoading(false);
    })();
  }, [student.id]);

  const activeMode = MAP_MODES.find((m) => m.id === mode);
  const visible = topics.filter((t) => activeMode.categories.includes(t.category));

  return (
    <div className="view-max">
      <div className="section">
        <div className="page-title">Himalayan Map</div>
        <div className="page-subtitle">
          An offline educational map — no internet needed. Choose a mode, then tap a location to explore it.
        </div>
      </div>

      <div className="section" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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

      {loading ? (
        <div className="panel panel-pad"><SkeletonLines count={4} /></div>
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
          {visible.length} location{visible.length === 1 ? "" : "s"} in {activeMode.label} mode. This illustrated map works fully offline; a future version can layer in real satellite/geospatial imagery behind the same location data.
        </div>
      </div>
    </div>
  );
}

/** A simple, original stylized illustration of the Himalayan region — ridgelines,
 *  a river, and forest patches — used as the offline map background so the
 *  feature never depends on external map tiles or network access. */
function MapIllustration() {
  return (
    <svg viewBox="0 0 100 60" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <polygon points="0,60 0,30 15,10 30,28 45,6 60,26 75,12 90,24 100,14 100,60" fill="#dfe9e4" />
      <polygon points="0,60 0,40 20,22 38,36 58,18 78,34 100,22 100,60" fill="#eef4ee" />
      <path d="M65,4 Q70,32 82,60" stroke="#a9c9dd" strokeWidth="1.4" fill="none" />
      <ellipse cx="20" cy="46" rx="10" ry="4" fill="#e3ecdc" />
      <ellipse cx="55" cy="50" rx="12" ry="4.5" fill="#e3ecdc" />
    </svg>
  );
}
