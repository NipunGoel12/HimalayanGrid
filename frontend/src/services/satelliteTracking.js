/**
 * Real orbital mechanics for the Learning Satellite page.
 * Inputs are real two-line elements (from /api/satellite/tles, sourced from
 * CelesTrak); positions are propagated with SGP4 (satellite.js) — nothing here
 * is simulated or randomised.
 */
import * as sat from "satellite.js";
import { get, set } from "idb-keyval";

const TLE_KEY = "hlg:sat:tles";
const R_EARTH = 6371; // km (mean radius, for footprint maths)

/** Fetch elements from the Local Hub; fall back to the last copy stored on-device. */
export async function loadElements() {
  try {
    const res = await fetch(
  `${import.meta.env.VITE_API_URL || ""}/api/satellite/tles`);
    if (!res.ok) throw new Error(`hub ${res.status}`);
    const data = await res.json();
    await set(TLE_KEY, data);
    return { ...data, source: data.stale ? "hub-cache" : "live" };
  } catch (err) {
    const cached = await get(TLE_KEY);
    if (cached) return { ...cached, stale: true, source: "device-cache" };
    throw err;
  }
}

/** Attach a parsed satrec to each satellite record. Bad TLEs are skipped. */
export function prepare(satellites) {
  return satellites
    .map((s) => {
      try {
        const satrec = sat.twoline2satrec(s.line1, s.line2);
        if (satrec.error) return null;
        // TLE epoch -> JS Date (line1 cols 19-32: YYDDD.DDDDDDDD)
        const yy = parseInt(s.line1.slice(18, 20), 10);
        const day = parseFloat(s.line1.slice(20, 32));
        const year = yy < 57 ? 2000 + yy : 1900 + yy;
        const epoch = new Date(Date.UTC(year, 0, 1) + (day - 1) * 86400000);
        const meanMotion = parseFloat(s.line2.slice(52, 63)); // rev/day
        return {
          ...s,
          satrec,
          epoch,
          periodMin: 1440 / meanMotion,
          inclination: parseFloat(s.line2.slice(8, 16)),
          geostationary: meanMotion > 0.9 && meanMotion < 1.1,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

/** Sub-satellite point + altitude/speed at a given time. */
export function positionAt(rec, date = new Date()) {
  const pv = sat.propagate(rec.satrec, date);
  if (!pv.position) return null;
  const gmst = sat.gstime(date);
  const geo = sat.eciToGeodetic(pv.position, gmst);
  const v = pv.velocity;
  return {
    lat: sat.degreesLat(geo.latitude),
    lon: sat.degreesLong(geo.longitude),
    altKm: geo.height,
    speedKmS: v ? Math.hypot(v.x, v.y, v.z) : null,
  };
}

/** Ground track polyline(s), split at the antimeridian so Leaflet doesn't draw across the map. */
export function groundTrack(rec, center = new Date(), minutesBefore = 10, minutesAfter = 100, stepSec = 30) {
  const segs = [[]];
  let prevLon = null;
  for (let t = -minutesBefore * 60; t <= minutesAfter * 60; t += stepSec) {
    const p = positionAt(rec, new Date(center.getTime() + t * 1000));
    if (!p) continue;
    if (prevLon !== null && Math.abs(p.lon - prevLon) > 180) segs.push([]);
    segs[segs.length - 1].push([p.lat, p.lon]);
    prevLon = p.lon;
  }
  return segs.filter((s) => s.length > 1);
}

/** Radius (km) of the circle on Earth from which the satellite is above `minElDeg`. */
export function footprintRadiusKm(altKm, minElDeg = 10) {
  const eps = (minElDeg * Math.PI) / 180;
  const ratio = (R_EARTH * Math.cos(eps)) / (R_EARTH + altKm);
  const lambda = Math.acos(Math.min(1, ratio)) - eps;
  return Math.max(0, R_EARTH * lambda);
}

function lookAngles(rec, observer, date) {
  const pv = sat.propagate(rec.satrec, date);
  if (!pv.position) return null;
  const gmst = sat.gstime(date);
  const ecf = sat.eciToEcf(pv.position, gmst);
  const la = sat.ecfToLookAngles(
    {
      latitude: sat.degreesToRadians(observer.lat),
      longitude: sat.degreesToRadians(observer.lon),
      height: (observer.elev || 0) / 1000,
    },
    ecf
  );
  return {
    az: sat.radiansToDegrees(la.azimuth),
    el: sat.radiansToDegrees(la.elevation),
    rangeKm: la.rangeSat,
  };
}

/** Current look angle from an observer (for the live "is it overhead?" readout). */
export function lookNow(rec, observer, date = new Date()) {
  return lookAngles(rec, observer, date);
}

/**
 * Predict passes above `minEl` degrees for the next `hours` hours.
 * Returns [{ sat, start, end, maxEl, maxAt, path:[{t,az,el}], continuous }]
 */
export function predictPasses(rec, observer, from = new Date(), hours = 24, minEl = 10, stepSec = 20) {
  const passes = [];
  let cur = null;
  const end = from.getTime() + hours * 3600 * 1000;
  for (let ms = from.getTime(); ms <= end; ms += stepSec * 1000) {
    const d = new Date(ms);
    const la = lookAngles(rec, observer, d);
    if (!la) continue;
    if (la.el >= minEl) {
      if (!cur) cur = { sat: rec, start: d, path: [], maxEl: -90, maxAt: d, continuous: ms === from.getTime() };
      cur.path.push({ t: ms, az: la.az, el: la.el });
      if (la.el > cur.maxEl) { cur.maxEl = la.el; cur.maxAt = d; }
    } else if (cur) {
      cur.end = d;
      passes.push(cur);
      cur = null;
    }
  }
  if (cur) { cur.end = new Date(end); cur.continuous = cur.continuous || rec.geostationary; passes.push(cur); }
  return passes;
}

export function formatDuration(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m) return `${m}m ${String(sec).padStart(2, "0")}s`;
  return `${sec}s`;
}

export function azimuthName(az) {
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(az / 45) % 8];
}

export function ageHours(date) {
  return (Date.now() - date.getTime()) / 3600000;
}
