/**
 * /api/satellite — live orbital elements for the Learning Satellite page.
 *
 * The Local Hub fetches public two-line elements (TLEs) from CelesTrak and
 * caches them on disk, so village devices get the last known orbits even when
 * the hub's own uplink is down. No API key is required.
 *
 *   GET /api/satellite/tles          -> { satellites: [...], fetchedAt, stale }
 *   GET /api/satellite/tles?refresh=1 forces a refresh attempt
 */
const express = require("express");
const fs = require("fs");
const path = require("path");
const { CATALOG } = require("../services/satelliteCatalog");

const router = express.Router();

const CELESTRAK_URL = process.env.CELESTRAK_URL || "https://celestrak.org/NORAD/elements/gp.php";
const TTL_MS = 6 * 60 * 60 * 1000; // CelesTrak refreshes elements a few times per day
const CACHE_FILE = path.join(
  path.dirname(process.env.DB_PATH || "./data/hlg.sqlite"),
  "tle-cache.json"
);

let memory = null; // { fetchedAt, satellites }

function loadDisk() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch {
    return null;
  }
}
function saveDisk(data) {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data));
  } catch (e) {
    console.warn("[satellite] could not write TLE cache:", e.message);
  }
}

function parseTle(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd()).filter(Boolean);
  if (lines.length < 3 || !lines[1].startsWith("1 ") || !lines[2].startsWith("2 ")) return null;
  return { name: lines[0].trim(), line1: lines[1], line2: lines[2] };
}

async function fetchOne(entry) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${CELESTRAK_URL}?CATNR=${entry.noradId}&FORMAT=tle`, { signal: ctrl.signal });
    if (!res.ok) return null;
    const tle = parseTle(await res.text());
    if (!tle || !entry.match.test(tle.name)) return null;
    return {
      noradId: entry.noradId,
      name: tle.name,
      short: entry.short,
      kind: entry.kind,
      orbit: entry.orbit,
      role: entry.role,
      line1: tle.line1,
      line2: tle.line2,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function refresh() {
  const results = (await Promise.all(CATALOG.map(fetchOne))).filter(Boolean);
  if (!results.length) throw new Error("CelesTrak returned no usable elements");
  memory = { fetchedAt: Date.now(), satellites: results };
  saveDisk(memory);
  return memory;
}

router.get("/tles", async (req, res) => {
  if (!memory) memory = loadDisk();
  const fresh = memory && Date.now() - memory.fetchedAt < TTL_MS;
  if (fresh && !req.query.refresh) return res.json({ ...memory, stale: false });

  try {
    const data = await refresh();
    return res.json({ ...data, stale: false });
  } catch (e) {
    if (memory) return res.json({ ...memory, stale: true }); // offline: serve last known
    return res.status(503).json({ error: "Orbital data unavailable (no internet and nothing cached yet)." });
  }
});

module.exports = router;
