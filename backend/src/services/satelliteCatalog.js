/**
 * Catalog of REAL satellites the Learning Satellite page tracks.
 *
 * `noradId` is looked up live on CelesTrak (public orbital elements).
 * `match` is a safety check: if CelesTrak returns an object whose name does
 * not match, the entry is dropped rather than shown with a wrong description.
 * Facts below are general, well-known mission facts (orbit class, purpose).
 */
const CATALOG = [
  { noradId: 25544, match: /ISS|ZARYA/i, short: "ISS", kind: "Space station", orbit: "LEO",
    role: "Crewed research laboratory. Passes are bright enough to see with the naked eye at dusk/dawn." },
  { noradId: 25994, match: /TERRA/i, short: "Terra", kind: "Earth observation", orbit: "LEO (sun-synchronous)",
    role: "NASA satellite carrying the MODIS instrument — source of daily true-colour and snow-cover imagery." },
  { noradId: 27424, match: /AQUA/i, short: "Aqua", kind: "Earth observation", orbit: "LEO (sun-synchronous)",
    role: "NASA satellite studying the water cycle: clouds, precipitation, ice and snow." },
  { noradId: 37849, match: /SUOMI|NPP/i, short: "Suomi NPP", kind: "Earth observation", orbit: "LEO (sun-synchronous)",
    role: "Carries the VIIRS instrument — the source of the 'Live' true-colour layer on the map." },
  { noradId: 33591, match: /NOAA.?19/i, short: "NOAA 19", kind: "Weather", orbit: "LEO (polar)",
    role: "Polar-orbiting weather satellite that broadcasts weather images and data." },
  { noradId: 39084, match: /LANDSAT.?8|LDCM/i, short: "Landsat 8", kind: "Earth observation", orbit: "LEO (sun-synchronous)",
    role: "Maps land cover, glaciers and forests at 30 m resolution." },
  { noradId: 49260, match: /LANDSAT.?9/i, short: "Landsat 9", kind: "Earth observation", orbit: "LEO (sun-synchronous)",
    role: "Continues the 50-year Landsat land-monitoring record." },
  { noradId: 40697, match: /SENTINEL.?2A/i, short: "Sentinel-2A", kind: "Earth observation", orbit: "LEO (sun-synchronous)",
    role: "European Copernicus satellite imaging land and vegetation at up to 10 m." },
  { noradId: 44804, match: /CARTOSAT/i, short: "Cartosat-3", kind: "Earth observation", orbit: "LEO (sun-synchronous)",
    role: "Indian (ISRO) high-resolution mapping satellite." },
  { noradId: 41752, match: /INSAT.?3DR/i, short: "INSAT-3DR", kind: "Weather / communication", orbit: "GEO (~74°E)",
    role: "Indian geostationary weather satellite — it hangs fixed in the sky above the equator." },
];

module.exports = { CATALOG };
