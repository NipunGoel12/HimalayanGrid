/**
 * Real Earth-observation data used by the Learning Satellite page.
 * Every source is public and key-free:
 *   - Open-Meteo   (weather forecast)      https://open-meteo.com
 *   - USGS         (earthquake catalogue)  https://earthquake.usgs.gov
 * Last good responses are stored on-device so the page still shows the latest
 * known conditions (clearly marked with their age) when the network is off.
 */
import { get, set } from "idb-keyval";

async function cachedFetch(cacheKey, url, ttlMs) {
  const cached = await get(cacheKey);
  if (cached && Date.now() - cached.at < ttlMs) return { data: cached.data, at: cached.at, offline: false };
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    await set(cacheKey, { data, at: Date.now() });
    return { data, at: Date.now(), offline: false };
  } catch (err) {
    if (cached) return { data: cached.data, at: cached.at, offline: true };
    throw err;
  }
}

/** Current weather + 48 h hourly cloud/rain forecast at a location. */
export async function fetchWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}` +
    `&current=temperature_2m,relative_humidity_2m,cloud_cover,precipitation,wind_speed_10m` +
    `&hourly=cloud_cover,precipitation,precipitation_probability,snowfall` +
    `&forecast_days=2&timeformat=unixtime&timezone=auto`;
  const { data, at, offline } = await cachedFetch(`hlg:wx:${lat.toFixed(2)},${lon.toFixed(2)}`, url, 15 * 60 * 1000);
  return { ...data, fetchedAt: at, offline };
}

/** Forecast values for the hour containing `date` (unix-second hourly series). */
export function forecastAt(wx, date) {
  const times = wx?.hourly?.time;
  if (!times?.length) return null;
  const t = Math.floor(date.getTime() / 1000);
  let idx = 0;
  for (let i = 0; i < times.length; i++) if (times[i] <= t) idx = i;
  if (t > times[times.length - 1] + 3600) return null; // beyond forecast range
  return {
    cloud: wx.hourly.cloud_cover[idx],
    precip: wx.hourly.precipitation[idx],
    precipProb: wx.hourly.precipitation_probability?.[idx] ?? null,
    snowfall: wx.hourly.snowfall?.[idx] ?? 0,
  };
}

/**
 * Plain-language link outlook. Heavy rain/snow and thick cloud weaken
 * higher-frequency (Ku/Ka-band) satellite links ("rain fade") — this is a
 * guideline derived from the real forecast numbers, not a measured signal level.
 */
export function linkOutlook(f) {
  if (!f) return { level: "unknown", label: "No forecast", tone: "neutral" };
  if (f.precip >= 2 || f.snowfall >= 1 || (f.cloud >= 95 && (f.precipProb ?? 0) >= 60))
    return { level: "poor", label: "Poor — rain/snow fade likely", tone: "danger" };
  if (f.precip >= 0.3 || f.cloud >= 80)
    return { level: "fair", label: "Fair — thick cloud", tone: "warning" };
  return { level: "good", label: "Good — clear enough", tone: "success" };
}

/** Real earthquakes (M2.5+, last 7 days) inside the greater Himalayan region. */
export async function fetchEarthquakes() {
  const start = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const url =
    "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson" +
    `&starttime=${start}&minmagnitude=2.5&minlatitude=25&maxlatitude=37&minlongitude=72&maxlongitude=98&orderby=time`;
  const { data, at, offline } = await cachedFetch("hlg:quakes", url, 30 * 60 * 1000);
  return {
    fetchedAt: at,
    offline,
    quakes: (data.features || []).map((f) => ({
      id: f.id,
      mag: f.properties.mag,
      place: f.properties.place,
      time: f.properties.time,
      lon: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
      depthKm: f.geometry.coordinates[2],
    })),
  };
}

/** NASA GIBS Earth-observation layers (all public, no key). */
export function getEarthLayers() {
  const day = (offsetDays) => new Date(Date.now() - offsetDays * 86400000).toISOString().slice(0, 10);
  const gibs = (id, date, level, ext = "png") =>
    `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${id}/default/${date}/GoogleMapsCompatible_Level${level}/{z}/{y}/{x}.${ext}`;
  return [
    {
      id: "esri",
      label: "High-res imagery",
      overlay: null,
      note: "Archive imagery from commercial satellites (Maxar, Earthstar) — highest detail, not updated daily.",
    },
    {
      id: "truecolor",
      label: "Today's Earth",
      overlay: { url: gibs("VIIRS_SNPP_CorrectedReflectance_TrueColor", day(1), 9, "jpg"), maxNativeZoom: 9, opacity: 1 },
      date: day(1),
      note: "Yesterday's true-colour mosaic from the VIIRS instrument on Suomi NPP. Clouds you see are real, from yesterday.",
    },
    {
      id: "snow",
      label: "Snow cover",
      overlay: { url: gibs("MODIS_Terra_NDSI_Snow_Cover", day(2), 8), maxNativeZoom: 8, opacity: 0.85 },
      date: day(2),
      note: "MODIS/Terra snow cover (NDSI). Bright cyan = snow. Watch it retreat uphill between seasons.",
    },
    {
      id: "lst",
      label: "Surface temperature",
      overlay: { url: gibs("MODIS_Terra_Land_Surface_Temp_Day", day(2), 7), maxNativeZoom: 7, opacity: 0.75 },
      date: day(2),
      note: "Daytime land-surface temperature from MODIS/Terra. Compare valleys with high glaciers.",
    },
    {
      id: "night",
      label: "Night lights",
      overlay: { url: gibs("VIIRS_Black_Marble", "2016-01-01", 8), maxNativeZoom: 8, opacity: 1 },
      date: "2016 composite",
      note: "VIIRS 'Black Marble' night-time lights. Notice how dark the high Himalaya is — that's where connectivity gaps are.",
    },
  ];
}
