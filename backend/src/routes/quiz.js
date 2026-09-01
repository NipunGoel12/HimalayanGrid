const express = require("express");
const db = require("../db");

const router = express.Router();

function id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function logLearningEvent(studentId, type, payload) {
  const evId = id("ev");
  db.prepare(
    `INSERT INTO learning_events (id, student_id, type, payload, created_at, version, synced, sync_status, retries)
     VALUES (?, ?, ?, ?, ?, 1, 0, 'queued', 0)`
  ).run(evId, studentId, type, JSON.stringify(payload), Date.now());
  return evId;
}

// POST /api/quiz/generate  { topic }
// Personalized: if no topic given, recommends the student's top weak topic.
router.post("/generate", (req, res) => {
  const { studentId = "std-001", topic } = req.body || {};
  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(studentId);
  if (!student) return res.status(404).json({ error: "Student not found" });

  const weakTopics = JSON.parse(student.weak_topics || "[]");
  const chosenTopic = topic || weakTopics[0];
  if (!chosenTopic) return res.status(400).json({ error: "No topic supplied and no weak topic on file" });

  const questions = db.prepare("SELECT * FROM quiz_questions WHERE topic = ?").all(chosenTopic);
  if (questions.length === 0) return res.status(404).json({ error: `No quiz bank for topic "${chosenTopic}"` });

  res.json({
    topic: chosenTopic,
    recommendedBecauseWeak: weakTopics.includes(chosenTopic),
    questions: questions.map((q) => ({ id: q.id, question: q.question, options: JSON.parse(q.options) })),
  });
});

// POST /api/quiz/submit  { studentId, topic, answers: [optionIndex,...], questionIds: [...] }
router.post("/submit", (req, res) => {
  const { studentId = "std-001", topic, answers = [], questionIds = [] } = req.body || {};
  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(studentId);
  if (!student) return res.status(404).json({ error: "Student not found" });

  const questions = questionIds.map((qid) => db.prepare("SELECT * FROM quiz_questions WHERE id = ?").get(qid));
  let correct = 0;
  questions.forEach((q, i) => { if (q && q.correct_index === answers[i]) correct++; });
  const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;

  const attemptId = id("qa");
  db.prepare(
    `INSERT INTO quiz_attempts (id, student_id, topic, score, created_at, synced) VALUES (?, ?, ?, ?, ?, 0)`
  ).run(attemptId, studentId, topic, score, Date.now());

  // Weak-topic logic: keep/raise if struggling, retire if consistently strong.
  const weakTopics = JSON.parse(student.weak_topics || "[]");
  const stillWeak = score < 70;
  let updatedWeak = weakTopics;
  if (stillWeak && !weakTopics.includes(topic)) updatedWeak = [...weakTopics, topic];
  if (!stillWeak && score >= 85 && weakTopics.includes(topic)) updatedWeak = weakTopics.filter((t) => t !== topic);
  db.prepare("UPDATE students SET weak_topics = ?, updated_at = ?, version = version + 1 WHERE id = ?").run(
    JSON.stringify(updatedWeak), Date.now(), studentId
  );

  logLearningEvent(studentId, "quiz-completed", { topic, score });

  // Additive field: per-question review for the results screen. Existing
  // consumers of this endpoint are unaffected since this only adds a key.
  const review = questions.map((q, i) => ({
    questionId: q ? q.id : questionIds[i],
    question: q ? q.question : null,
    options: q ? JSON.parse(q.options) : [],
    chosenIndex: answers[i] ?? null,
    correctIndex: q ? q.correct_index : null,
    isCorrect: !!q && q.correct_index === answers[i],
  }));

  res.json({ attemptId, topic, score, correctCount: correct, totalQuestions: questions.length, weakTopics: updatedWeak, review });
});

// GET /api/quiz/history?studentId=std-001
router.get("/history", (req, res) => {
  const studentId = req.query.studentId || "std-001";
  const rows = db.prepare("SELECT * FROM quiz_attempts WHERE student_id = ? ORDER BY created_at DESC").all(studentId);
  res.json(rows);
});

module.exports = router;
