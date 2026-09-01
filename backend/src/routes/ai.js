const express = require("express");
const db = require("../db");
const { answerQuestion, localTutorAnswer } = require("../services/aiService");

const router = express.Router();

function id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function logLearningEvent(studentId, type, payload) {
  db.prepare(
    `INSERT INTO learning_events (id, student_id, type, payload, created_at, version, synced, sync_status, retries)
     VALUES (?, ?, ?, ?, ?, 1, 0, 'queued', 0)`
  ).run(id("ev"), studentId, type, JSON.stringify(payload), Date.now());
}

function guessTopicFromStudent(student) {
  const weak = JSON.parse(student.weak_topics || "[]");
  return weak[0] || "General";
}

// POST /api/ai/ask  { studentId, question, online, missionDone }
router.post("/ask", async (req, res) => {
  const { studentId = "std-001", question, online = false, missionDone = false } = req.body || {};
  if (!question || !question.trim()) return res.status(400).json({ error: "question is required" });

  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(studentId);
  if (!student) return res.status(404).json({ error: "Student not found" });

  const result = await answerQuestion({ question, student, missionDone, preferCloud: !!online });

  if (result.matchedTopic === null || (result.mode === "local" && !result.matchedTopic)) {
    // Unanswered — log it so the Smart Priority Engine can react.
    const guessed = guessTopicFromStudent(student);
    db.prepare(
      `INSERT INTO unanswered_questions (id, student_id, question, guessed_topic, created_at) VALUES (?, ?, ?, ?, ?)`
    ).run(id("uq"), studentId, question, guessed, Date.now());
    logLearningEvent(studentId, "ai-question-unanswered", { question });
  } else {
    logLearningEvent(studentId, "ai-question-answered", { question, mode: result.mode });
  }

  res.json(result);
});

// POST /api/ai/explain  { studentId, topic }
router.post("/explain", async (req, res) => {
  const { studentId = "std-001", topic } = req.body || {};
  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(studentId);
  if (!student) return res.status(404).json({ error: "Student not found" });
  const result = await answerQuestion({
    question: `Please explain the topic "${topic}" simply, as if I am struggling with it.`,
    student, missionDone: false, preferCloud: false,
  });
  res.json(result);
});

// POST /api/ai/generate-quiz  { topic }  — thin wrapper documented for API completeness;
// actual quiz bank lives in /api/quiz/generate. Kept separate per the AI API surface.
router.post("/generate-quiz", (req, res) => {
  const { topic } = req.body || {};
  const questions = db.prepare("SELECT * FROM quiz_questions WHERE topic = ?").all(topic);
  res.json({ topic, questions: questions.map((q) => ({ id: q.id, question: q.question, options: JSON.parse(q.options) })) });
});

// POST /api/ai/recommend  { studentId }
router.post("/recommend", (req, res) => {
  const { studentId = "std-001" } = req.body || {};
  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(studentId);
  if (!student) return res.status(404).json({ error: "Student not found" });
  const weak = JSON.parse(student.weak_topics || "[]");
  const lesson = weak.length ? db.prepare("SELECT * FROM lessons WHERE weak_topic = ?").get(weak[0]) : null;
  res.json({
    recommendedTopic: weak[0] || null,
    recommendedLesson: lesson ? { id: lesson.id, title: lesson.title } : null,
    reason: weak.length ? `"${weak[0]}" is flagged as a weak topic based on recent quiz performance.` : "No weak topics currently flagged.",
  });
});

module.exports = router;
