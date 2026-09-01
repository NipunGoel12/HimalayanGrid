/**
 * Sync Engine — orchestrates the flow described in the team plan:
 *
 *   Learning Event → Local Database → Sync Queue → Wait for Connectivity
 *   → Satellite/Internet Available → Priority Calculation → Package Validation
 *   → Upload/Download → Local DB Updated → UI = SYNCED
 *
 * Conflict rule: never silently overwrite student progress. Every conflict is
 * resolved deterministically (newest timestamp wins) and recorded for display.
 */

const db = require("../db");
const { rankCatalog } = require("./priorityEngine");
const { MockSatelliteAdapter } = require("./satelliteAdapter");

const gatewayLog = [];
const adapter = new MockSatelliteAdapter({
  latencyMs: Number(process.env.MOCK_SATELLITE_LATENCY_MS || 900),
  onLog: (msg) => gatewayLog.unshift({ message: msg, createdAt: Date.now() }),
});

let currentStatus = "IDLE"; // IDLE | SYNCING | SYNC_ERROR | DONE

function id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildContext(studentId) {
  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(studentId);
  const weakTopics = JSON.parse(student.weak_topics || "[]");
  const teacherRequests = db.prepare("SELECT * FROM teacher_requests").all();
  const unansweredRows = db
    .prepare("SELECT DISTINCT guessed_topic FROM unanswered_questions WHERE guessed_topic IS NOT NULL")
    .all();
  const unansweredTopics = unansweredRows.map((r) => r.guessed_topic);
  return { weakTopics, teacherRequests, unansweredTopics, language: student.language, student };
}

function getRankedCatalog(studentId) {
  const ctx = buildContext(studentId);
  const catalog = db.prepare("SELECT * FROM content_catalog").all();
  return rankCatalog(catalog, ctx);
}

/** Runs a full sync pass: uploads queued learning events, then downloads
 *  prioritized content packages. Returns a summary for the API response. */
async function runSync({ studentId, simulateFailure = false }) {
  if (currentStatus === "SYNCING") {
    return { status: "SYNCING", message: "A sync is already in progress." };
  }
  currentStatus = "SYNCING";
  addHistory("Sync started");
  await adapter.connect();

  // --- Upload phase: push queued learning events up to the school server ---
  const pendingEvents = db
    .prepare("SELECT * FROM learning_events WHERE sync_status != 'synced'")
    .all();

  const updateEventStatus = db.prepare(
    "UPDATE learning_events SET sync_status = ?, synced = ?, retries = retries + ? WHERE id = ?"
  );

  for (const ev of pendingEvents) {
    updateEventStatus.run("syncing", 0, 0, ev.id);
    try {
      await adapter.uploadPackage({ id: ev.id, name: ev.type, size_mb: 0.05 });
      updateEventStatus.run("synced", 1, 0, ev.id);
    } catch (err) {
      updateEventStatus.run("failed", 0, 1, ev.id);
    }
  }

  // --- Download phase: rank the catalog, download everything not SKIPPED ---
  const ranked = getRankedCatalog(studentId);
  const upsertDownload = db.prepare(
    `INSERT INTO sync_downloads (id, status, score, label, reasons, error, updated_at)
     VALUES (@id, @status, @score, @label, @reasons, @error, @updated_at)
     ON CONFLICT(id) DO UPDATE SET status=excluded.status, score=excluded.score,
       label=excluded.label, reasons=excluded.reasons, error=excluded.error, updated_at=excluded.updated_at`
  );

  for (const pkg of ranked) {
    if (pkg.label === "SKIPPED") {
      upsertDownload.run({
        id: pkg.id, status: "skipped", score: pkg.score, label: pkg.label,
        reasons: JSON.stringify(pkg.reasons), error: null, updated_at: Date.now(),
      });
      continue;
    }
    upsertDownload.run({
      id: pkg.id, status: "syncing", score: pkg.score, label: pkg.label,
      reasons: JSON.stringify(pkg.reasons), error: null, updated_at: Date.now(),
    });
    try {
      await adapter.downloadPackage(
        { id: pkg.id, name: pkg.name, size_mb: pkg.size_mb },
        { simulateFailure: simulateFailure && pkg.label === "HIGH" }
      );
      upsertDownload.run({
        id: pkg.id, status: "synced", score: pkg.score, label: pkg.label,
        reasons: JSON.stringify(pkg.reasons), error: null, updated_at: Date.now(),
      });
      addHistory(`Downloaded: ${pkg.name} (${pkg.label})`);
      markLessonCachedForPackage(pkg.id);
    } catch (err) {
      upsertDownload.run({
        id: pkg.id, status: "failed", score: pkg.score, label: pkg.label,
        reasons: JSON.stringify(pkg.reasons), error: err.message, updated_at: Date.now(),
      });
      addHistory(`FAILED: ${pkg.name} — ${err.message}`);
      currentStatus = "SYNC_ERROR";
      return { status: "SYNC_ERROR", failedPackage: pkg.name, error: err.message };
    }
  }

  maybeRecordConflict(studentId);

  addHistory("Sync complete — UI = SYNCED");
  currentStatus = "DONE";
  return { status: "DONE", downloaded: ranked.filter((p) => p.label !== "SKIPPED").length };
}

function markLessonCachedForPackage(packageId) {
  const map = {
    "pkg-hindi-fractions": "lsn-fractions",
    "pkg-watercycle-deep": "lsn-watercycle",
    "pkg-mountain-mission": "lsn-geography",
    "pkg-english-video": "lsn-newvideo",
    "pkg-huge-video": "lsn-hugevideo",
  };
  const lessonId = map[packageId];
  if (lessonId) {
    db.prepare("UPDATE lessons SET cached = 1 WHERE id = ?").run(lessonId);
  }
}

function addHistory(message) {
  db.prepare("INSERT INTO sync_history (id, message, created_at) VALUES (?, ?, ?)").run(
    id("hist"), message, Date.now()
  );
}

/** Deterministic, one-shot conflict demo: a locally recorded quiz score vs. a
 *  same-field value already on the school server. Newest timestamp wins;
 *  nothing is ever silently overwritten. */
function maybeRecordConflict(studentId) {
  const existing = db.prepare("SELECT COUNT(*) AS c FROM conflicts WHERE resolved = 0").get().c;
  if (existing > 0) return;
  const latest = db
    .prepare("SELECT * FROM quiz_attempts WHERE student_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(studentId);
  if (!latest) return;
  const remoteTimestamp = latest.created_at - 60_000; // simulated earlier remote write
  db.prepare(
    `INSERT INTO conflicts (id, field, local_value, remote_value, local_timestamp, remote_timestamp, resolution, created_at, resolved)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`
  ).run(
    id("cf"),
    `Progress on "${latest.topic}"`,
    `${latest.score}% (this device, ${new Date(latest.created_at).toLocaleTimeString()})`,
    `78% (school server, synced earlier from a shared tablet)`,
    latest.created_at,
    remoteTimestamp,
    "Kept the newer of the two records by timestamp — the local score was not overwritten.",
    Date.now()
  );
}

function getStatus() {
  return { status: currentStatus, satellite: adapter.getStatus ? { connected: adapter.connected } : null };
}

function getGatewayLog() {
  return gatewayLog.slice(0, 30);
}

module.exports = { runSync, getRankedCatalog, getStatus, getGatewayLog, adapter };
