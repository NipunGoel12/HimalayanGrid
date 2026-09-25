/**
 * Satellite imagery configuration — Himalayan Learning Grid
 * ---------------------------------------------------------------------
 * Every basemap used by the Real Map view and the "Photo" snapshot is
 * defined here, so this is the ONE file to look at for map/satellite keys.
 *
 * WORKS WITH NO KEYS (default):
 *   - "Satellite"  Esri World Imagery (Maxar/Earthstar) + place-name labels
 *   - "Live"       NASA GIBS daily true-colour imagery (VIIRS / SNPP) — free
 *   - "Terrain"    OpenTopoMap (SRTM contours)
 *
 * OPTIONAL KEYS (put them in frontend/.env — see frontend/.env.example):
 *   VITE_MAPBOX_TOKEN   -> "Satellite" switches to Mapbox Satellite-Streets
 *   VITE_MAPTILER_KEY   -> "Satellite" switches to MapTiler Satellite (higher zoom)
 *   (Mapbox wins if both are set.)
 *
 * Vite only exposes variables that start with VITE_, and they are bundled
 * into the browser build — use a token restricted by URL/domain, never a
 * secret key.
 */

const env = (typeof import.meta !== "undefined" && import.meta.env) || {};
const clean = (v) => (typeof v === "string" && v.trim() && !/^your_/i.test(v.trim()) ? v.trim() : "");

const MAPBOX_TOKEN = clean(env.VITE_MAPBOX_TOKEN);
const MAPTILER_KEY = clean(env.VITE_MAPTILER_KEY);

export const SATELLITE_PROVIDER = MAPBOX_TOKEN ? "mapbox" : MAPTILER_KEY ? "maptiler" : "esri";

const ESRI_ATTRIBUTION =
  "Imagery &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community";

/** Date (UTC) of the most recent NASA GIBS daily mosaic we request: yesterday. */
export function liveImageryDate() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Leaflet TileLayer options for the high-resolution satellite basemap. */
function satelliteLayer() {
  if (SATELLITE_PROVIDER === "mapbox") {
    return {
      url: `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
      attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.maxar.com/">Maxar</a>',
      tileSize: 512, zoomOffset: -1, maxNativeZoom: 18, maxZoom: 18,
      labels: null, // satellite-streets already includes labels
      source: "Mapbox Satellite",
      live: false,
    };
  }
  if (SATELLITE_PROVIDER === "maptiler") {
    return {
      url: `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`,
      attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; Satellite imagery providers',
      maxNativeZoom: 20, maxZoom: 18,
      labels: ESRI_LABELS(),
      source: "MapTiler Satellite",
      live: false,
    };
  }
  return {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: ESRI_ATTRIBUTION,
    maxNativeZoom: 17, maxZoom: 17,
    labels: ESRI_LABELS(),
    source: "Esri World Imagery",
    live: false,
  };
}

function ESRI_LABELS() {
  return {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    attribution: "",
    maxNativeZoom: 13, maxZoom: 17,
  };
}

/** All basemaps offered by the Real Map switch. */
export function getBasemaps() {
  const date = liveImageryDate();
  return {
    satellite: satelliteLayer(),
    live: {
      // NASA GIBS WMTS (EPSG:3857). Native max zoom for this layer is 9;
      // Leaflet upsamples beyond that so the layer still works when zoomed in.
      url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
      attribution: 'Imagery: <a href="https://earthdata.nasa.gov/gibs">NASA EOSDIS GIBS</a> · VIIRS / Suomi NPP',
      maxNativeZoom: 9, maxZoom: 12,
      labels: ESRI_LABELS(),
      source: `NASA VIIRS true colour · ${date}`,
      live: true,
    },
    terrain: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
      maxNativeZoom: 17, maxZoom: 17,
      labels: null,
      source: "OpenTopoMap (SRTM terrain)",
      live: false,
    },
  };
}

/** Build a concrete tile URL (for the canvas "Photo" snapshot). */
export function tileUrl(layer, z, x, y) {
  return layer.url
    .replace("{s}", "a")
    .replace("{z}", z)
    .replace("{x}", x)
    .replace("{y}", y);
}
