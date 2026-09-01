const express = require("express");
const db = require("../db");
const syncEngine = require("../services/syncEngine");
const { MockSatelliteAdapter } = require("../services/satelliteAdapter");

const router = express.Router();

function id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// GET /api/sync/status
router.get("/status", (_req, res) => {
  res.json(syncEngine.getStatus());
});

// POST /api/sync/events  — client pushes a locally-recorded learning event
// into the sync queue (used by the PWA when it comes back online).
router.post("/events", (req, res) => {
  const { studentId = "std-001", type, payload = {} } = req.body || {};
  if (!type) return res.status(400).json({ error: "type is required" });
  const evId = id("ev");
  db.prepare(
    `INSERT INTO learning_events (id, student_id, type, payload, created_at, version, synced, sync_status, retries)
     VALUES (?, ?, ?, ?, ?, 1, 0, 'queued', 0)`
  ).run(evId, studentId, type, JSON.stringify(payload), Date.now());
  res.status(201).json({ id: evId, status: "queued" });
});

// GET /api/sync/catalog?studentId=std-001  — Smart Priority Engine ranking
router.get("/catalog", (req, res) => {
  const studentId = req.query.studentId || "std-001";
  const ranked = syncEngine.getRankedCatalog(studentId);
  res.json(ranked);
});

// POST /api/sync/run  { studentId, simulateFailure }
router.post("/run", async (req, res) => {
  const { studentId = "std-001", simulateFailure = false } = req.body || {};
  try {
    const result = await syncEngine.runSync({ studentId, simulateFailure });
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: "SYNC_ERROR", error: err.message });
  }
});

// GET /api/sync/queue — current upload/download queue snapshot
router.get("/queue", (_req, res) => {
  const uploads = db.prepare("SELECT * FROM learning_events ORDER BY created_at DESC LIMIT 20").all();
  const downloads = db.prepare("SELECT * FROM sync_downloads ORDER BY updated_at DESC").all()
    .map((d) => ({ ...d, reasons: JSON.parse(d.reasons || "[]") }));
  res.json({ uploads, downloads });
});

// POST /api/sync/downloads/:id/retry
router.post("/downloads/:id/retry", async (req, res) => {
  const pkg = db.prepare("SELECT * FROM content_catalog WHERE id = ?").get(req.params.id);
  if (!pkg) return res.status(404).json({ error: "Package not found" });
  try {
    await syncEngine.adapter.downloadPackage({ id: pkg.id, name: pkg.name, size_mb: pkg.size_mb });
    db.prepare(
      `UPDATE sync_downloads SET status = 'synced', error = NULL, updated_at = ? WHERE id = ?`
    ).run(Date.now(), pkg.id);
    res.json({ status: "synced" });
  } catch (err) {
    db.prepare(`UPDATE sync_downloads SET status = 'failed', error = ?, updated_at = ? WHERE id = ?`).run(
      err.message, Date.now(), pkg.id
    );
    res.status(500).json({ status: "failed", error: err.message });
  }
});

// GET /api/sync/history
router.get("/history", (_req, res) => {
  res.json(db.prepare("SELECT * FROM sync_history ORDER BY created_at DESC LIMIT 30").all());
});

// GET /api/sync/gateway-log
router.get("/gateway-log", (_req, res) => {
  res.json(syncEngine.getGatewayLog());
});

// GET /api/sync/conflicts
router.get("/conflicts", (_req, res) => {
  res.json(db.prepare("SELECT * FROM conflicts WHERE resolved = 0 ORDER BY created_at DESC").all());
});

// POST /api/sync/conflicts/:id/resolve
router.post("/conflicts/:id/resolve", (req, res) => {
  db.prepare("UPDATE conflicts SET resolved = 1 WHERE id = ?").run(req.params.id);
  res.json({ resolved: true });
});

module.exports = router;
