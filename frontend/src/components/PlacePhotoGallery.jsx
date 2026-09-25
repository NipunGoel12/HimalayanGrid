import React, { useEffect, useState } from "react";
import { Camera, ExternalLink } from "lucide-react";
import { Badge, SkeletonLines } from "./ui.jsx";
import { fetchNearbyPlaces } from "../services/placePhotos.js";

/**
 * Real photos of famous places near a coordinate, from Wikipedia — so kids
 * can see actual peaks, monasteries, glaciers, towns near what they tapped.
 * mode: "full" (topic page) | "compact" (map popup).
 */
export default function PlacePhotoGallery({ lat, lon, title, mode = "full", radius = 20000 }) {
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    if (lat == null || lon == null) { setState({ status: "none" }); return; }
    let cancelled = false;
    setState({ status: "loading" });
    fetchNearbyPlaces(lat, lon, { radius, limit: mode === "compact" ? 4 : 5 })
      .then((d) => !cancelled && setState({ status: d.places.length ? "ready" : "empty", data: d }))
      .catch(() => !cancelled && setState({ status: "error" }));
    return () => { cancelled = true; };
  }, [lat, lon, radius, mode]);

  if (state.status === "none") return null;

  const compact = mode === "compact";
  return (
    <div className={`place-gallery ${compact ? "compact" : ""}`}>
      <div className="place-gallery-head">
        <Camera size={compact ? 12 : 14} />
        <span>Real photos near {title || "here"}</span>
        {state.data?.offline && <Badge tone="warning">saved copy</Badge>}
      </div>

      {state.status === "loading" && (
        <div className={compact ? "place-thumbs compact" : "place-thumbs"}>
          {Array.from({ length: compact ? 3 : 4 }).map((_, i) => <div key={i} className="place-skel" />)}
        </div>
      )}
      {state.status === "error" && (
        <div className="faint" style={{ fontSize: compact ? 11 : 12 }}>Photos need internet the first time you visit a place.</div>
      )}
      {state.status === "empty" && (
        <div className="faint" style={{ fontSize: compact ? 11 : 12 }}>No well-known photographed places found nearby yet.</div>
      )}
      {state.status === "ready" && (
        <div className={compact ? "place-thumbs compact" : "place-thumbs"}>
          {state.data.places.map((p) => (
            <a key={p.pageid} href={p.url} target="_blank" rel="noreferrer" className="place-card" title={p.extract}>
              <img src={p.thumbnail.url} alt={p.title} loading="lazy" />
              <div className="place-card-body">
                <div className="place-card-title">{p.title} <ExternalLink size={10} /></div>
                {!compact && <div className="place-card-extract">{p.extract}</div>}
                {p.distanceKm != null && <div className="place-card-dist">{p.distanceKm < 1 ? "< 1" : Math.round(p.distanceKm)} km away</div>}
              </div>
            </a>
          ))}
        </div>
      )}
      {!compact && state.status === "ready" && (
        <div className="faint" style={{ fontSize: 11, marginTop: 8 }}>Photos and facts from Wikipedia — tap a card to read more.</div>
      )}
    </div>
  );
}
