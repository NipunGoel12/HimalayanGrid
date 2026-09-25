/**
 * Real photos + short facts for a place, from Wikipedia (no API key).
 * Uses geosearch to find real, well-known nearby subjects (peaks, glaciers,
 * monasteries, towns, national parks...) so kids see genuine famous places
 * around the point they tapped — not a stock/generic photo of the topic.
 * Results are cached on-device so a place already seen works offline.
 */
import { get, set } from "idb-keyval";

const WIKI_API = "https://en.wikipedia.org/w/api.php";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // Wikipedia facts/photos barely change

function cacheKey(lat, lon, radius) {
  return `hlg:places:${lat.toFixed(2)},${lon.toFixed(2)}:${radius}`;
}

async function getJson(params, timeoutMs = 10000) {
  const url = `${WIKI_API}?${new URLSearchParams({ format: "json", origin: "*", ...params })}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`Wikipedia HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Find up to `limit` real, notable places near [lat, lon] with a photo.
 * Returns { places:[{ pageid, title, extract, thumbnail:{url,w,h}, distanceKm, url }], fetchedAt, offline }
 */
export async function fetchNearbyPlaces(lat, lon, { radius = 20000, limit = 6 } = {}) {
  const key = cacheKey(lat, lon, radius);
  const cached = await get(key);
  if (cached && Date.now() - cached.at < TTL_MS) return { ...cached.data, fetchedAt: cached.at, offline: false };

  try {
    const geo = await getJson({
      action: "query", list: "geosearch",
      gscoord: `${lat}|${lon}`, gsradius: String(radius), gslimit: String(limit * 3), gsnamespace: "0",
    });
    const hits = geo?.query?.geosearch || [];
    if (!hits.length) throw new Error("No nearby Wikipedia entries");

    const pageids = hits.map((h) => h.pageid).join("|");
    const info = await getJson({
      action: "query", pageids,
      prop: "pageimages|extracts|coordinates",
      piprop: "thumbnail", pithumbsize: "500",
      exintro: "1", explaintext: "1", exchars: "260",
    });
    const pages = info?.query?.pages || {};
    const distanceOf = Object.fromEntries(hits.map((h) => [h.pageid, h.dist]));

    const places = Object.values(pages)
      .filter((p) => p?.thumbnail?.source && p?.extract)
      .map((p) => ({
        pageid: p.pageid,
        title: p.title,
        extract: p.extract,
        thumbnail: { url: p.thumbnail.source, w: p.thumbnail.width, h: p.thumbnail.height },
        distanceKm: distanceOf[p.pageid] != null ? distanceOf[p.pageid] / 1000 : null,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, "_"))}`,
      }))
      .sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9))
      .slice(0, limit);

    const data = { places };
    if (places.length) await set(key, { at: Date.now(), data });
    return { ...data, fetchedAt: Date.now(), offline: false };
  } catch (err) {
    if (cached) return { ...cached.data, fetchedAt: cached.at, offline: true };
    throw err;
  }
}
