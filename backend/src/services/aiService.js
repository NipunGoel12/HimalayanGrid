/**
 * AI Tutor service — Nipun's subsystem (Backend / AI Learning Platform).
 *
 * Architecture:
 *   Student Question
 *     → Context Retriever (curriculum + student profile + weak topics + mission)
 *     → Model Adapter (Cloud model, with graceful fallback to a deterministic
 *       Local Tutor when the cloud is unreachable or ANTHROPIC_API_KEY is unset)
 *     → Response Validation
 *     → Answer + Learning Event
 *
 * The AI behaves as a learning engine, not a generic chatbot: every answer is
 * grounded in the student's grade, language, weak topics and mission state.
 */

const LOCAL_KNOWLEDGE_PACK = [
  {
    topic: "Fractions",
    keywords: ["fraction", "numerator", "denominator", "भिन्न"],
    answer: "A fraction shows a part of a whole, written as numerator/denominator. To add fractions with the same denominator, add the numerators and keep the denominator the same — e.g. 1/4 + 2/4 = 3/4. Try relating it to sharing a blanket or a roti into equal parts.",
  },
  {
    topic: "Water Cycle",
    keywords: ["water cycle", "evaporation", "condensation", "glacier", "rain", "snow"],
    answer: "The water cycle here starts with glacier and snow melt feeding rivers. Sun heats the river water, which evaporates, forms clouds over the peaks, cools, and falls again as rain or snow — the cycle repeats.",
  },
  {
    topic: "Contour Map",
    keywords: ["contour", "elevation", "slope", "map"],
    answer: "Contour lines connect points of the same elevation. When lines are close together the slope is steep; when they are spread apart the slope is gentle.",
  },
];

const FALLBACK_ANSWER =
  "I don't have that topic in my offline knowledge pack yet. It has been logged as an unanswered question — the Smart Priority Engine will raise its priority for the next satellite sync so a full answer can be downloaded.";

/** Context Retriever: pulls together everything the model adapter needs. */
function retrieveContext(student, { missionDone }) {
  return {
    grade: student.grade,
    language: student.language,
    village: student.village,
    weakTopics: JSON.parse(student.weak_topics || "[]"),
    missionDone: !!missionDone,
  };
}

/** Deterministic Local Tutor — used offline or as a cloud fallback. */
function localTutorAnswer(question) {
  const lower = question.toLowerCase();
  const hit = LOCAL_KNOWLEDGE_PACK.find((k) => k.keywords.some((kw) => lower.includes(kw.toLowerCase())));
  if (hit) return { text: hit.answer, mode: "local", matchedTopic: hit.topic };
  return { text: FALLBACK_ANSWER, mode: "local", matchedTopic: null };
}

/** Cloud Model Adapter — calls the real Anthropic API when a key is configured. */
async function cloudTutorAnswer(question, ctx) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }
  const system = `You are the Himalayan Learning Grid AI Tutor, a patient learning engine (not a generic chatbot) for a Grade ${ctx.grade} student in ${ctx.language}, from ${ctx.village}. Their current weak topics are: ${ctx.weakTopics.join(", ") || "none logged"}. Mountain Mission completed: ${ctx.missionDone}. Tailor your answer to their grade level, gently connect it to their weak topics when relevant, and keep answers under 120 words, encouraging and concrete, with a Himalayan/village example where natural.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Cloud model request failed: ${response.status}`);
  }
  const data = await response.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("Empty cloud response");
  return { text, mode: "cloud" };
}

/**
 * Response Validation — a lightweight guard so a malformed/empty answer never
 * reaches the student silently. Falls back to the Local Tutor if invalid.
 */
function validateResponse(res) {
  return res && typeof res.text === "string" && res.text.trim().length > 0;
}

/**
 * Main entry point used by the /api/ai/* routes.
 * `preferCloud` simulates "the device currently has satellite/internet".
 */
async function answerQuestion({ question, student, missionDone, preferCloud }) {
  const ctx = retrieveContext(student, { missionDone });

  if (preferCloud) {
    try {
      const res = await cloudTutorAnswer(question, ctx);
      if (validateResponse(res)) return res;
      throw new Error("Cloud response failed validation");
    } catch (err) {
      const local = localTutorAnswer(question);
      return { ...local, fallback: true, fallbackReason: err.message };
    }
  }

  return localTutorAnswer(question);
}

module.exports = { answerQuestion, retrieveContext, localTutorAnswer, LOCAL_KNOWLEDGE_PACK };
