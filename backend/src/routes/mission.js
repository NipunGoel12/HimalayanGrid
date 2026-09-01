const express = require("express");
const db = require("../db");

const router = express.Router();

function id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Cached/demo Earth-observation data — clearly not a live feed or a real
// emergency alert. Owned by the mission data pipeline (Shagun) and rendered
// by the frontend (Bhavay) via this API contract.
const MISSION = {
  title: "Understand Your Mountain",
  village: "Lachen, North Sikkim",
  layers: ["Elevation", "Slope", "Vegetation", "Water Sources", "Erosion"],
  elevationProfile: [2700, 2820, 3100, 3400, 3650, 3500, 3200, 2950, 2760],
  facts: {
    Elevation: "Lachen sits at roughly 2,700m; the ridge above the village rises to about 3,650m.",
    Slope: "The steepest section lies just below the ridge — contour lines bunch tightly there, meaning a fast, risky descent.",
    Vegetation: "Rhododendron forest thins out above 3,300m, giving way to alpine meadow and bare rock.",
    "Water Sources": "A glacial stream feeds the village's irrigation channel, fullest in the June–August melt season.",
    Erosion: "Loose scree on the steep face erodes fastest after monsoon rain — terracing below the ridge helps slow it.",
  },
  questions: [
    { id: "mq-1", q: "Where is the slope steepest?", options: ["Near the village", "Just below the ridge", "At the valley floor"], correct: 1 },
    { id: "mq-2", q: "What feeds the irrigation channel?", options: ["Rainfall only", "A glacial stream", "A borewell"], correct: 1 },
  ],
};

// GET /api/mission
router.get("/", (_req, res) => {
  // Strip correct answers before sending to the client.
  const { questions, ...rest } = MISSION;
  res.json({ ...rest, questions: questions.map(({ id: qid, q, options }) => ({ id: qid, q, options })) });
});

// POST /api/mission/complete  { studentId, answers: {questionId: optionIndex} }
router.post("/complete", (req, res) => {
  const { studentId = "std-001", answers = {} } = req.body || {};
  let correct = 0;
  MISSION.questions.forEach((q) => { if (answers[q.id] === q.correct) correct++; });
  const score = Math.round((correct / MISSION.questions.length) * 100);

  db.prepare(
    `INSERT INTO learning_events (id, student_id, type, payload, created_at, version, synced, sync_status, retries)
     VALUES (?, ?, 'mission-completed', ?, ?, 1, 0, 'queued', 0)`
  ).run(id("ev"), studentId, JSON.stringify({ mission: MISSION.title, score }), Date.now());

  res.json({ score, mission: MISSION.title });
});

module.exports = router;
