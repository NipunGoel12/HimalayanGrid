const express = require("express");
const db = require("../db");
const gamification = require("../services/gamificationService");

const router = express.Router();

function id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function serializeTopic(row, extra = {}) {
  return {
    id: row.id, title: row.title, category: row.category, region: row.region, subject: row.subject,
    grade: row.grade, difficulty: row.difficulty, icon: row.icon, color: row.color,
    mapX: row.map_x, mapY: row.map_y, fact: row.fact, description: row.description,
    quiz: JSON.parse(row.quiz), offlineAvailable: !!row.offline_available, missionId: row.mission_id,
    ...extra,
  };
}

function logLearningEvent(studentId, type, payload) {
  db.prepare(
    `INSERT INTO learning_events (id, student_id, type, payload, created_at, version, synced, sync_status, retries)
     VALUES (?, ?, ?, ?, ?, 1, 0, 'queued', 0)`
  ).run(id("ev"), studentId, type, JSON.stringify(payload), Date.now());
}

// GET /api/topics?category=mountains&studentId=std-001
router.get("/", (req, res) => {
  const { category, studentId = "std-001" } = req.query;
  let rows = category ? db.prepare("SELECT * FROM topics WHERE category = ?").all(category) : db.prepare("SELECT * FROM topics").all();

  const progressRows = db.prepare("SELECT * FROM topic_progress WHERE student_id = ?").all(studentId);
  const progressMap = Object.fromEntries(progressRows.map((p) => [p.topic_id, p]));
  const savedRows = db.prepare("SELECT topic_id FROM saved_topics WHERE student_id = ?").all(studentId);
  const savedSet = new Set(savedRows.map((s) => s.topic_id));

  res.json(
    rows.map((t) =>
      serializeTopic(t, {
        explored: !!progressMap[t.id]?.explored,
        quizCompleted: !!progressMap[t.id]?.quiz_completed,
        saved: savedSet.has(t.id),
      })
    )
  );
});

// GET /api/topics/:id?studentId=std-001
router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM topics WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Topic not found in local cache" });
  const studentId = req.query.studentId || "std-001";
  const progress = db.prepare("SELECT * FROM topic_progress WHERE student_id = ? AND topic_id = ?").get(studentId, row.id);
  const saved = db.prepare("SELECT 1 FROM saved_topics WHERE student_id = ? AND topic_id = ?").get(studentId, row.id);
  res.json(serializeTopic(row, { explored: !!progress?.explored, quizCompleted: !!progress?.quiz_completed, saved: !!saved }));
});

// POST /api/topics/:id/explore  { studentId }
// Marks a topic as explored (viewed the learn panel), awards a small amount
// of XP, updates the daily streak, and logs a learning event.
router.post("/:id/explore", (req, res) => {
  const { studentId = "std-001" } = req.body || {};
  const topic = db.prepare("SELECT * FROM topics WHERE id = ?").get(req.params.id);
  if (!topic) return res.status(404).json({ error: "Topic not found" });

  // Check prior exploration state BEFORE the upsert, so first-time XP is
  // awarded exactly once (upserting first would make this row always read
  // explored=1, silently skipping the XP award every time).
  const priorProgress = db.prepare("SELECT explored FROM topic_progress WHERE student_id = ? AND topic_id = ?").get(studentId, topic.id);
  const isFirstExplore = !priorProgress || priorProgress.explored === 0;

  const now = Date.now();
  db.prepare(
    `INSERT INTO topic_progress (student_id, topic_id, explored, quiz_completed, updated_at)
     VALUES (?, ?, 1, 0, ?)
     ON CONFLICT(student_id, topic_id) DO UPDATE SET explored = 1, updated_at = excluded.updated_at`
  ).run(studentId, topic.id, now);

  gamification.touchStreak(studentId);
  let xpAwarded = 0;
  if (isFirstExplore) {
    xpAwarded = 10;
    gamification.addXp(studentId, xpAwarded);
  }
  logLearningEvent(studentId, "topic-explored", { topicId: topic.id, title: topic.title });

  res.json({ ok: true, xpAwarded, gamification: gamification.getGamificationSummary(studentId) });
});

// POST /api/topics/:id/quiz  { studentId, answers: [optionIndex,...] }
router.post("/:id/quiz", (req, res) => {
  const { studentId = "std-001", answers = [] } = req.body || {};
  const topic = db.prepare("SELECT * FROM topics WHERE id = ?").get(req.params.id);
  if (!topic) return res.status(404).json({ error: "Topic not found" });

  const quiz = JSON.parse(topic.quiz);
  let correct = 0;
  const review = quiz.map((q, i) => {
    const isCorrect = answers[i] === q.correctIndex;
    if (isCorrect) correct++;
    return { question: q.question, options: q.options, chosenIndex: answers[i] ?? null, correctIndex: q.correctIndex, isCorrect };
  });
  const score = Math.round((correct / quiz.length) * 100);
  const passed = score >= 60;

  const now = Date.now();
  db.prepare(
    `INSERT INTO topic_progress (student_id, topic_id, explored, quiz_completed, quiz_score, updated_at)
     VALUES (?, ?, 1, ?, ?, ?)
     ON CONFLICT(student_id, topic_id) DO UPDATE SET explored = 1, quiz_completed = ?, quiz_score = ?, updated_at = excluded.updated_at`
  ).run(studentId, topic.id, passed ? 1 : 0, score, now, passed ? 1 : 0, score);

  gamification.touchStreak(studentId);
  let xpAwarded = 0;
  let newBadges = [];
  if (passed) {
    xpAwarded = 20 + (score === 100 ? 10 : 0);
    gamification.addXp(studentId, xpAwarded);
    newBadges = gamification.evaluateMissionsForTopic(studentId, topic.id);
  }
  logLearningEvent(studentId, "topic-quiz-completed", { topicId: topic.id, title: topic.title, score });

  res.json({
    score, correctCount: correct, totalQuestions: quiz.length, passed, review,
    xpAwarded, newBadges, gamification: gamification.getGamificationSummary(studentId),
  });
});

// POST /api/topics/:id/save  { studentId }  — toggle "save for offline / later"
router.post("/:id/save", (req, res) => {
  const { studentId = "std-001" } = req.body || {};
  const topic = db.prepare("SELECT * FROM topics WHERE id = ?").get(req.params.id);
  if (!topic) return res.status(404).json({ error: "Topic not found" });
  const existing = db.prepare("SELECT 1 FROM saved_topics WHERE student_id = ? AND topic_id = ?").get(studentId, topic.id);
  if (existing) {
    db.prepare("DELETE FROM saved_topics WHERE student_id = ? AND topic_id = ?").run(studentId, topic.id);
    return res.json({ saved: false });
  }
  db.prepare("INSERT INTO saved_topics (student_id, topic_id, saved_at) VALUES (?, ?, ?)").run(studentId, topic.id, Date.now());
  res.json({ saved: true });
});

module.exports = router;
