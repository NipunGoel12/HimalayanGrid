const express = require("express");
const db = require("../db");

const router = express.Router();

function id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Static roster for the hackathon demo school; in production this would be a
// students table scoped to a teacher/class rather than a hardcoded seed.
const CLASS_ROSTER = [
  { name: "Tenzin Dolma", grade: 7, weakTopics: ["Fractions", "Water Cycle"], avgScore: 62 },
  { name: "Karma Wangyal", grade: 7, weakTopics: ["Contour Map"], avgScore: 74 },
  { name: "Yangchen Lepcha", grade: 6, weakTopics: ["Fractions"], avgScore: 55 },
];
const PENDING_QUESTIONS = [
  { student: "Karma Wangyal", question: "Why does erosion happen faster on steep slopes?", topic: "Erosion" },
];

// GET /api/teacher/dashboard
router.get("/dashboard", (_req, res) => {
  const syncStatus = require("../services/syncEngine").getStatus();
  res.json({
    teacherName: "Ms. Pema Bhutia",
    students: CLASS_ROSTER,
    pendingQuestions: PENDING_QUESTIONS,
    requestedPackages: db.prepare("SELECT * FROM teacher_requests ORDER BY created_at DESC").all(),
    syncStatus,
  });
});

// POST /api/teacher/requests  { topic } or { packageId }
router.post("/requests", (req, res) => {
  const { topic, packageId, note } = req.body || {};
  if (!topic && !packageId) return res.status(400).json({ error: "topic or packageId is required" });
  const reqId = id("tr");
  db.prepare(
    `INSERT INTO teacher_requests (id, teacher_name, topic, package_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(reqId, "Ms. Pema Bhutia", topic || null, packageId || null, note || `Please prioritize ${topic || packageId}.`, Date.now());
  res.status(201).json({ id: reqId });
});

module.exports = router;
