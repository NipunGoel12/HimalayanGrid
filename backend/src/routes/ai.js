const express = require("express");
const db = require("../db");
const { answerQuestion } = require("../services/aiService");

const router = express.Router();

function id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function logLearningEvent(studentId, type, payload) {
  db.prepare(
    `INSERT INTO learning_events
      (id, student_id, type, payload, created_at, version, synced, sync_status, retries)
     VALUES (?, ?, ?, ?, ?, 1, 0, 'queued', 0)`
  ).run(
    id("ev"),
    studentId,
    type,
    JSON.stringify(payload),
    Date.now()
  );
}

function guessTopicFromStudent(student) {
  let weak = [];

  try {
    weak = JSON.parse(student?.weak_topics || "[]");
  } catch {
    weak = [];
  }

  return weak[0] || "General";
}

function isLocalStudent(studentId) {
  return typeof studentId === "string" &&
    studentId.startsWith("local-");
}

/**
 * Build a temporary student object for local profiles.
 *
 * Local profiles live in browser localStorage and are intentionally
 * NOT written into SQLite.
 */
function buildLocalStudent(studentId, studentProfile) {
  return {
    id: studentId,
    name: studentProfile?.name || "Student",
    grade: studentProfile?.grade || null,
    language: studentProfile?.language || "English",
    village:
      studentProfile?.region ||
      studentProfile?.village ||
      null,
    weak_topics: JSON.stringify(
      studentProfile?.weakTopics || []
    ),
  };
}

/**
 * POST /api/ai/ask
 *
 * Body:
 * {
 *   studentId,
 *   studentProfile,
 *   question,
 *   online,
 *   missionDone
 * }
 */
router.post("/ask", async (req, res) => {
  const {
    studentId = "std-001",
    studentProfile = null,
    question,
    online = false,
    missionDone = false,
  } = req.body || {};

  if (!question || !question.trim()) {
    return res.status(400).json({
      error: "question is required",
    });
  }

  const localStudent = isLocalStudent(studentId);

  let student;

  /*
   * Local profile:
   *
   * The profile exists only in the browser, so it will not exist
   * inside the SQLite students table.
   */
  if (localStudent) {
    student = buildLocalStudent(
      studentId,
      studentProfile
    );
  } else {
    /*
     * Existing/demo/backend student.
     *
     * Keep the original SQLite behaviour intact.
     */
    student = db
      .prepare(
        "SELECT * FROM students WHERE id = ?"
      )
      .get(studentId);

    if (!student) {
      return res.status(404).json({
        error: "Student not found",
      });
    }
  }

  let result;

  try {
    result = await answerQuestion({
      question,
      student,
      missionDone,
      preferCloud: !!online,
    });
  } catch (error) {
    console.error(
      "AI service error:",
      error
    );

    return res.status(500).json({
      error: "AI service failed",
      details: error.message,
    });
  }

  /*
   * Nemotron succeeded.
   *
   * IMPORTANT:
   * Do NOT use matchedTopic === null to determine whether
   * the question was unanswered.
   *
   * Nemotron normally returns matchedTopic: null because
   * it is not using the deterministic knowledge-pack matcher.
   */
  if (
    result.mode === "cloud" &&
    result.text
  ) {
    /*
     * Only SQLite-backed students should generate backend
     * learning events.
     *
     * Local profiles do not exist in SQLite.
     */
    if (!localStudent) {
      try {
        logLearningEvent(
          studentId,
          "ai-question-answered",
          {
            question,
            mode: result.mode,
          }
        );
      } catch (error) {
        console.error(
          "Failed to log AI learning event:",
          error.message
        );
      }
    }

    return res.json(result);
  }

  /*
   * Hima is offline / internet unavailable.
   */
  if (result.mode === "offline") {
    return res.status(503).json({
      ...result,
      text: null,
    });
  }

  /*
   * NVIDIA Nemotron failed.
   *
   * Return a proper error instead of pretending that
   * the local knowledge pack is an AI fallback.
   */
  if (result.mode === "cloud-error") {
    console.error(
      "Nemotron request failed:",
      result.error
    );

    return res.status(502).json({
      ...result,
      text: null,
    });
  }

  /*
   * Unexpected result.
   */
  return res.status(500).json({
    error: "Unexpected AI response",
    result,
  });
});


/**
 * POST /api/ai/explain
 *
 * Body:
 * {
 *   studentId,
 *   studentProfile,
 *   topic,
 *   online
 * }
 */
router.post("/explain", async (req, res) => {
  const {
    studentId = "std-001",
    studentProfile = null,
    topic,
    online = true,
  } = req.body || {};

  if (!topic || !topic.trim()) {
    return res.status(400).json({
      error: "topic is required",
    });
  }

  const localStudent = isLocalStudent(studentId);

  let student;

  /*
   * Support local browser profiles here too.
   */
  if (localStudent) {
    student = buildLocalStudent(
      studentId,
      studentProfile
    );
  } else {
    student = db
      .prepare(
        "SELECT * FROM students WHERE id = ?"
      )
      .get(studentId);

    if (!student) {
      return res.status(404).json({
        error: "Student not found",
      });
    }
  }

  let result;

  try {
    result = await answerQuestion({
      question: `Please explain the topic "${topic}" simply, as if I am struggling with it.`,
      student,
      missionDone: false,
      preferCloud: !!online,
    });
  } catch (error) {
    console.error(
      "AI explain service error:",
      error
    );

    return res.status(500).json({
      error: "AI service failed",
      details: error.message,
    });
  }

  if (
    result.mode === "cloud" &&
    result.text
  ) {
    return res.json(result);
  }

  if (result.mode === "offline") {
    return res.status(503).json({
      ...result,
      text: null,
    });
  }

  if (result.mode === "cloud-error") {
    console.error(
      "Nemotron explain request failed:",
      result.error
    );

    return res.status(502).json({
      ...result,
      text: null,
    });
  }

  return res.status(500).json({
    error: "Unexpected AI response",
    result,
  });
});


/**
 * POST /api/ai/generate-quiz
 *
 * Body:
 * {
 *   topic
 * }
 */
router.post("/generate-quiz", (req, res) => {
  const { topic } = req.body || {};

  const questions = db
    .prepare(
      "SELECT * FROM quiz_questions WHERE topic = ?"
    )
    .all(topic);

  res.json({
    topic,
    questions: questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: JSON.parse(q.options),
    })),
  });
});


/**
 * POST /api/ai/recommend
 *
 * Body:
 * {
 *   studentId
 * }
 *
 * Recommendations currently depend on SQLite student
 * performance data, so local-only profiles cannot use
 * this endpoint yet.
 */
router.post("/recommend", (req, res) => {
  const {
    studentId = "std-001",
  } = req.body || {};

  if (isLocalStudent(studentId)) {
    return res.json({
      recommendedTopic: null,
      recommendedLesson: null,
      reason:
        "Recommendations will become available after learning data is synced.",
    });
  }

  const student = db
    .prepare(
      "SELECT * FROM students WHERE id = ?"
    )
    .get(studentId);

  if (!student) {
    return res.status(404).json({
      error: "Student not found",
    });
  }

  let weak = [];

  try {
    weak = JSON.parse(
      student.weak_topics || "[]"
    );
  } catch {
    weak = [];
  }

  const lesson = weak.length
    ? db
        .prepare(
          "SELECT * FROM lessons WHERE weak_topic = ?"
        )
        .get(weak[0])
    : null;

  res.json({
    recommendedTopic:
      weak[0] || null,

    recommendedLesson: lesson
      ? {
          id: lesson.id,
          title: lesson.title,
        }
      : null,

    reason: weak.length
      ? `"${weak[0]}" is flagged as a weak topic based on recent quiz performance.`
      : "No weak topics currently flagged.",
  });
});


module.exports = router;