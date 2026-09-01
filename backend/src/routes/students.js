const express = require("express");
const db = require("../db");
const gamification = require("../services/gamificationService");

const router = express.Router();

function serializeStudent(row) {
  return { ...row, weak_topics: JSON.parse(row.weak_topics || "[]") };
}

// GET /api/students/:id
router.get("/:id", (req, res) => {
  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(req.params.id);
  if (!student) return res.status(404).json({ error: "Student not found" });
  res.json(serializeStudent(student));
});

// GET /api/students/:id/progress
router.get("/:id/progress", (req, res) => {
  const attempts = db
    .prepare("SELECT * FROM quiz_attempts WHERE student_id = ? ORDER BY created_at DESC")
    .all(req.params.id);

  const byTopic = {};
  attempts.forEach((a) => {
    byTopic[a.topic] = byTopic[a.topic] || [];
    byTopic[a.topic].push(a.score);
  });
  const topicSummary = Object.entries(byTopic).map(([topic, scores]) => ({
    topic,
    average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    attempts: scores.length,
  }));

  const events = db
    .prepare("SELECT * FROM learning_events WHERE student_id = ? ORDER BY created_at DESC LIMIT 50")
    .all(req.params.id)
    .map((e) => ({ ...e, payload: JSON.parse(e.payload || "{}") }));

  res.json({ attempts, topicSummary, events });
});

// PUT /api/students/:id/profile
router.put("/:id/profile", (req, res) => {
  const existing = db.prepare("SELECT * FROM students WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Student not found" });

  const { name, grade, language, village, avatar, weakTopics } = req.body || {};
  const updated = {
    name: name ?? existing.name,
    grade: grade ?? existing.grade,
    language: language ?? existing.language,
    village: village ?? existing.village,
    avatar: avatar ?? existing.avatar,
    weak_topics: weakTopics ? JSON.stringify(weakTopics) : existing.weak_topics,
    updated_at: Date.now(),
    version: existing.version + 1,
    id: req.params.id,
  };
  db.prepare(
    `UPDATE students SET name=@name, grade=@grade, language=@language, village=@village,
       avatar=@avatar, weak_topics=@weak_topics, updated_at=@updated_at, version=@version
     WHERE id=@id`
  ).run(updated);

  res.json(serializeStudent(db.prepare("SELECT * FROM students WHERE id = ?").get(req.params.id)));
});

// GET /api/students/:id/gamification — XP, streak, badges, exploration %.
// Additive endpoint for the Explorer experience; does not touch the existing
// weak-topic/quiz progress endpoint above.
router.get("/:id/gamification", (req, res) => {
  const summary = gamification.getGamificationSummary(req.params.id);
  if (!summary) return res.status(404).json({ error: "Student not found" });
  res.json(summary);
});

module.exports = router;
