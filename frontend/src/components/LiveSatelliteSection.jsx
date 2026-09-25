import React, { useEffect, useMemo, useRef, useState } from "react";
import { Locate, RefreshCw, CloudRain, Wind, Thermometer, Droplets, Activity } from "lucide-react";
import { Badge, Button, SkeletonLines } from "./ui.jsx";
import LiveSatelliteMap from "./LiveSatelliteMap.jsx";
import PlacePhotoGallery from "./PlacePhotoGallery.jsx";
import PassPlanner, { SkyPlot } from "./PassPlanner.jsx";
import { HUB_LOCATIONS, DEFAULT_HUB_ID } from "../data/hubLocations.js";
import {
  loadElements, prepare, positionAt, groundTrack, lookNow, predictPasses, formatDuration, azimuthName, ageHours,
} from "../services/satelliteTracking.js";
import { fetchWeather, fetchEarthquakes, forecastAt, linkOutlook, getEarthLayers } from "../services/earthData.js";

const SOURCE_LABEL = {
  live: { tone: "success", text: "Live orbital data" },
  "hub-cache": { tone: "warning", text: "Hub cache (hub is offline)" },
  "device-cache": { tone: "warning", text: "Saved on this device (offline)" },
};

export default function LiveSatelliteSection() {
  const [hubId, setHubId] = useState(DEFAULT_HUB_ID);
  const [gps, setGps] = useState(null); // { lat, lon, name, elev }
  const [geoMsg, setGeoMsg] = useState("");
  const [els, setEls] = useState({ status: "loading" }); // loading | ready | error
  const [selectedId, setSelectedId] = useState(null);
  const [selectedPass, setSelectedPass] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [weather, setWeather] = useState(null);
  const [wxError, setWxError] = useState(false);
  const [layerId, setLayerId] = useState("esri");
  const [showQuakes, setShowQuakes] = useState(false);
  const [quakes, setQuakes] = useState(null);
  const [quakeError, setQuakeError] = useState(false);
  const [passSeed, setPassSeed] = useState(Date.now()); // when passes were last computed

  const observer = useMemo(() => {
    if (gps) return gps;
    const h = HUB_LOCATIONS.find((x) => x.id === hubId) || HUB_LOCATIONS[0];
    return { lat: h.lat, lon: h.lon, name: h.name, elev: h.elev };
  }, [hubId, gps]);

  const layers = useMemo(() => getEarthLayers(), []);
  const layer = layers.find((l) => l.id === layerId) || layers[0];

  /* --- orbital elements --- */
  function loadOrbits() {
    setEls({ status: "loading" });
    loadElements()
      .then((d) => {
        const records = prepare(d.satellites);
        if (!records.length) throw new Error("no usable satellites");
        setEls({ status: "ready", records, source: d.source, fetchedAt: d.fetchedAt });
        setSelectedId((cur) => cur ?? (records.find((r) => r.noradId === 25544) || records[0]).noradId);
        setPassSeed(Date.now());
      })
      .catch(() => setEls({ status: "error" }));
  }
  useEffect(loadOrbits, []);

  /* --- 1 Hz clock drives live positions --- */
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  /* --- weather for the hub --- */
  useEffect(() => {
    let cancelled = false;
    setWxError(false);
    fetchWeather(observer.lat, observer.lon)
      .then((w) => !cancelled && setWeather(w))
      .catch(() => !cancelled && (setWeather(null), setWxError(true)));
    return () => { cancelled = true; };
  }, [observer.lat, observer.lon]);

  /* --- earthquakes (only when toggled on) --- */
  useEffect(() => {
    if (!showQuakes || quakes) return;
    setQuakeError(false);
    fetchEarthquakes().then(setQuakes).catch(() => setQuakeError(true));
  }, [showQuakes, quakes]);

  const records = els.status === "ready" ? els.records : [];

  /* --- live positions (recomputed every second) --- */
  const positions = useMemo(() => {
    const out = {};
    const d = new Date(now);
    records.forEach((r) => { out[r.noradId] = positionAt(r, d); });
    return out;
  }, [records, now]);

  const selected = records.find((r) => r.noradId === selectedId);
  const selPos = selected ? positions[selected.noradId] : null;
  const selLook = selected ? lookNow(selected, observer, new Date(now)) : null;

  /* ground track only needs refreshing about every 30 s */
  const trackKey = Math.floor(now / 30000);
  const track = useMemo(
    () => (selected && !selected.geostationary ? groundTrack(selected, new Date(now)) : null),
    [selected, trackKey] // eslint-disable-line react-hooks/exhaustive-deps
  );

  /* --- pass prediction for every tracked satellite over the hub --- */
  const passes = useMemo(() => {
    if (!records.length) return [];
    const from = new Date(passSeed);
    return records
      .flatMap((r) => predictPasses(r, observer, from, 24, 10))
      .filter((p) => p.end.getTime() > now)
      .sort((a, b) => a.start - b.start);
  }, [records, observer, passSeed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recompute the 24 h window once an hour so it never runs dry.
  useEffect(() => {
    if (now - passSeed > 3600 * 1000) setPassSeed(now);
  }, [now, passSeed]);

  const nextPass = passes.find((p) => !p.continuous && p.end.getTime() > now);
  const shownPass = selectedPass && passes.includes(selectedPass)
    ? selectedPass
    : passes.find((p) => selected && p.sat.noradId === selected.noradId && !p.continuous && p.end.getTime() > now) || nextPass;

  function useMyLocation() {
    if (!navigator.geolocation) { setGeoMsg("This browser has no location access."); return; }
    setGeoMsg("Locating…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lon: pos.coords.longitude, name: "My location", elev: pos.coords.altitude || 0 });
        setGeoMsg("");
      },
      () => setGeoMsg("Location permission denied — using the selected hub instead."),
      { timeout: 10000, maximumAge: 600000 }
    );
  }

  const wxNow = weather ? forecastAt(weather, new Date(now)) : null;
  const outlook = linkOutlook(wxNow);
  const epochAge = selected ? ageHours(selected.epoch) : 0;

  return (
    <div className="live-sat">
      <div className="section" style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="section-title">🛰️ Track a Real Satellite!</div>
          <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>
            These are real satellites flying above you right now! Your device calculates exactly where they are using real orbit data — no pretend numbers.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {els.status === "ready" && (
            <Badge tone={SOURCE_LABEL[els.source]?.tone || "neutral"} dot>
              {SOURCE_LABEL[els.source]?.text}
              {els.source !== "live" && els.fetchedAt ? ` · ${Math.round(ageHours(new Date(els.fetchedAt)))}h old` : ""}
            </Badge>
          )}
          <Button variant="secondary" onClick={loadOrbits} disabled={els.status === "loading"}><RefreshCw size={14} /> Refresh</Button>
        </div>
      </div>

      {els.status === "error" && (
        <div className="callout danger section">
          Orbital data isn't available yet. Connect once (start the Local Hub with internet) so the elements can be downloaded and saved on this device — after that this page works offline with the last saved orbits.
        </div>
      )}
      {els.status === "loading" && <div className="panel panel-pad section"><SkeletonLines count={4} /></div>}

      {els.status === "ready" && (
        <>
          {/* Hub location */}
          <div className="section live-sat-toolbar">
            <label className="faint" style={{ fontSize: 12 }} htmlFor="hub-select">Local Hub near</label>
            <select id="hub-select" value={gps ? "gps" : hubId} onChange={(e) => { setGps(null); setHubId(e.target.value); setSelectedPass(null); }}>
              {gps && <option value="gps">My location</option>}
              {HUB_LOCATIONS.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <Button variant="secondary" onClick={useMyLocation}><Locate size={14} /> Use my location</Button>
            {geoMsg && <span className="faint" style={{ fontSize: 12 }}>{geoMsg}</span>}
            {nextPass && (
              <span className="live-next-pass">
                Next pass over {observer.name}: <b>{nextPass.sat.short}</b>{" "}
                {nextPass.start.getTime() <= now ? "overhead now" : `in ${formatDuration(nextPass.start.getTime() - now)}`}
                {" · "}max {Math.round(nextPass.maxEl)}°
              </span>
            )}
          </div>

          {/* Map */}
          <div className="real-map-wrap section">
            <div className="map-frame" style={{ height: 480, position: "relative" }}>
              <LiveSatelliteMap
                records={records}
                positions={positions}
                selectedId={selectedId}
                onSelect={(id) => { setSelectedId(id); setSelectedPass(null); }}
                observer={observer}
                layer={layer}
                quakes={showQuakes ? quakes?.quakes : null}
                track={track}
              />
            </div>
            <div className="live-layer-bar">
              {layers.map((l) => (
                <button key={l.id} className={layerId === l.id ? "active" : ""} onClick={() => setLayerId(l.id)}>{l.label}</button>
              ))}
              <button className={showQuakes ? "active quake" : "quake"} onClick={() => setShowQuakes((v) => !v)}>
                <Activity size={11} style={{ marginRight: 4, verticalAlign: -1 }} />Earthquakes
              </button>
            </div>
          </div>
          <div className="faint section" style={{ fontSize: 12, lineHeight: 1.55, marginTop: -6 }}>
            <b>{layer.label}{layer.date ? ` · ${layer.date}` : ""}:</b> {layer.note}
            {showQuakes && (
              <> {quakeError ? "Earthquake feed unavailable right now."
                : !quakes ? "Loading earthquakes…"
                : `${quakes.quakes.length} earthquake${quakes.quakes.length === 1 ? "" : "s"} of M2.5+ in the last 7 days (USGS)${quakes.offline ? " — saved copy, offline" : ""}. Red = M4.5+.`}</>
            )}
          </div>

          {/* Selected satellite + hub conditions */}
          <div className="live-sat-grid section">
            {selected && selPos && (
              <div className="panel panel-pad">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>🛰️ {selected.name}</div>
                    <div className="faint" style={{ fontSize: 12 }}>{selected.kind} · {selected.orbit}</div>
                  </div>
                  <Badge tone={selLook && selLook.el > 0 ? "success" : "neutral"}>
                    {selLook && selLook.el > 0 ? `Above horizon · ${Math.round(selLook.el)}° ${azimuthName(selLook.az)}` : "Below horizon"}
                  </Badge>
                </div>
                <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.5, margin: "10px 0" }}>{selected.role}</p>
                <div className="live-stat-grid">
                  <div><span>Altitude</span><b>{Math.round(selPos.altKm).toLocaleString()} km</b></div>
                  <div><span>Speed</span><b>{selPos.speedKmS ? `${selPos.speedKmS.toFixed(2)} km/s` : "—"}</b></div>
                  <div><span>Over</span><b>{Math.abs(selPos.lat).toFixed(1)}°{selPos.lat >= 0 ? "N" : "S"} {Math.abs(selPos.lon).toFixed(1)}°{selPos.lon >= 0 ? "E" : "W"}</b></div>
                  <div><span>Orbit time</span><b>{selected.geostationary ? "24 h (fixed)" : `${selected.periodMin.toFixed(0)} min`}</b></div>
                  <div><span>Inclination</span><b>{selected.inclination.toFixed(1)}°</b></div>
                  <div><span>Distance to hub</span><b>{selLook ? `${Math.round(selLook.rangeKm).toLocaleString()} km` : "—"}</b></div>
                </div>
                <div className="faint" style={{ fontSize: 11, marginTop: 10 }}>
                  Orbital elements from {selected.epoch.toUTCString().slice(5, 22)} UTC ({epochAge < 48 ? `${Math.round(epochAge)} h` : `${Math.round(epochAge / 24)} days`} old).
                  {epochAge > 24 * 7 && " Accuracy drops as elements age — reconnect to refresh."}
                </div>
              </div>
            )}

            <div className="panel panel-pad">
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>📍 About {observer.name}</div>
              <PlacePhotoGallery lat={observer.lat} lon={observer.lon} title={observer.name} mode="compact" radius={30000} />
            </div>

            <div className="panel panel-pad">
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>Sky conditions at the hub</div>
              <div className="faint" style={{ fontSize: 12, marginBottom: 10 }}>{observer.name} · {Math.round(observer.elev || 0)} m</div>
              {wxError && <div className="muted" style={{ fontSize: 13 }}>Weather isn't available offline yet — connect once to save it.</div>}
              {!weather && !wxError && <SkeletonLines count={3} />}
              {weather && wxNow && (
                <>
                  <Badge tone={outlook.tone}>{outlook.label}</Badge>
                  <div className="live-stat-grid" style={{ marginTop: 12 }}>
                    <div><span><Thermometer size={11} /> Temperature</span><b>{Math.round(weather.current.temperature_2m)}°C</b></div>
                    <div><span><CloudRain size={11} /> Cloud cover</span><b>{Math.round(weather.current.cloud_cover)}%</b></div>
                    <div><span><Droplets size={11} /> Precipitation</span><b>{weather.current.precipitation} mm/h</b></div>
                    <div><span><Wind size={11} /> Wind</span><b>{Math.round(weather.current.wind_speed_10m)} km/h</b></div>
                  </div>
                  <div className="faint" style={{ fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>
                    Real forecast from Open-Meteo{weather.offline ? ` (saved ${Math.round(ageHours(new Date(weather.fetchedAt)))} h ago — offline)` : ""}.
                    Heavy rain, snow and thick cloud weaken higher-frequency satellite links, so a clear hour is the best time to sync.
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Passes */}
          <div className="panel section">
            <div className="panel-header">
              <div>
                <div className="section-title">Upcoming passes over {observer.name}</div>
                <div className="faint" style={{ fontSize: 12 }}>
                  Real pass times for the next 24 h (above 10° elevation), matched with the weather forecast for each pass. Tap a row to see its sky path.
                </div>
              </div>
            </div>
            <PassPlanner passes={passes} weather={weather} selectedPass={shownPass} onSelectPass={setSelectedPass} now={now} />
          </div>

          {shownPass && !shownPass.continuous && (
            <div className="panel panel-pad section live-sky">
              <SkyPlot pass={shownPass} />
              <div>
                <div style={{ fontWeight: 700 }}>{shownPass.sat.name}</div>
                <div className="muted" style={{ fontSize: 13, marginTop: 4, lineHeight: 1.6 }}>
                  Rises in the <b>{azimuthName(shownPass.path[0].az)}</b> at {shownPass.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })},
                  climbs to <b>{Math.round(shownPass.maxEl)}°</b> at {shownPass.maxAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })},
                  and sets in the <b>{azimuthName(shownPass.path[shownPass.path.length - 1].az)}</b> after {formatDuration(shownPass.end - shownPass.start)}.
                </div>
                <div className="faint" style={{ fontSize: 11.5, marginTop: 8 }}>
                  <span style={{ color: "#10B981" }}>●</span> rises &nbsp; <span style={{ color: "#EF4444" }}>●</span> sets &nbsp; · centre of the circle = directly overhead, outer ring = horizon.
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
