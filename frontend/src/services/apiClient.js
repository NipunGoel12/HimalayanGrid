/**
 * apiClient — thin wrapper Bhavya's frontend uses to talk to Nipun/Shagun backends.
 * Screens never call fetch() directly.
 */
import * as store from "./offlineStore.js";

const BASE = "/api";

async function request(path, options = {}) {
  const { timeoutMs = 12000, ...rest } = options;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(BASE + path, {
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      ...rest,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed: ${res.status}`);
    }
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  health: () => request("/health"),

  async getStudent(id = "std-001") {
    try {
      const student = await request(`/students/${id}`);
      await store.cacheStudent(student);
      return student;
    } catch (e) {
      const cached = await store.getCachedStudent();
      if (cached) return cached;
      throw e;
    }
  },
  updateProfile: (id, payload) => request(`/students/${id}/profile`, { method: "PUT", body: JSON.stringify(payload) }),

  async getProgress(id = "std-001") {
    try {
      return await request(`/students/${id}/progress`);
    } catch {
      const events = await store.getQueuedEvents();
      const attempts = await store.getLocalAttempts();
      return { events, attempts, offline: true };
    }
  },

  async getLessons() {
    try {
      const lessons = await request("/lessons");
      await store.cacheLessons(lessons);
      return lessons;
    } catch (e) {
      const cached = await store.getCachedLessons();
      if (cached.length) return cached;
      throw e;
    }
  },

  async getLesson(id) {
    try {
      return await request(`/lessons/${id}`);
    } catch (e) {
      const cached = await store.getCachedLessons();
      const found = cached.find((l) => l.id === id);
      if (found) return found;
      throw e;
    }
  },

  async generateQuiz(studentId, topic) {
    try {
      const data = await request("/quiz/generate", { method: "POST", body: JSON.stringify({ studentId, topic }) });
      await store.cacheQuiz(data.topic, data);
      return data;
    } catch (e) {
      const cached = await store.getCachedQuiz(topic);
      if (cached) return { ...cached, fromCache: true };
      throw e;
    }
  },

  async submitQuiz(payload) {
    try {
      const res = await request("/quiz/submit", { method: "POST", body: JSON.stringify(payload) });
      await store.saveAttemptLocally({ ...res, offline: false, createdAt: Date.now() });
      return res;
    } catch (e) {
      const attempt = {
        id: "local-" + Date.now(),
        topic: payload.topic,
        score: null,
        pendingServerScore: true,
        offline: true,
        createdAt: Date.now(),
        totalQuestions: payload.questionIds?.length,
      };
      await store.saveAttemptLocally(attempt);
      await store.queueLearningEvent({ type: "quiz-submitted-offline", payload, createdAt: Date.now() });
      return attempt;
    }
  },

  async askTutor(payload) {
    try {
      const res = await request("/ai/ask", { method: "POST", body: JSON.stringify(payload) });
      const unanswered = res.matchedTopic === null;
      if (unanswered) await store.saveUnanswered(payload.question);
      return { ...res, unanswered };
    } catch {
      await store.saveUnanswered(payload.question);
      await store.queueLearningEvent({ type: "ai-question-unanswered", payload: { question: payload.question, hubUnavailable: true }, createdAt: Date.now() });
      return {
        text: "I don't have enough local knowledge to answer this yet — and the Local Hub is unreachable right now.",
        mode: "local",
        matchedTopic: null,
        unanswered: true,
        hubUnavailable: true,
      };
    }
  },

  async completeMission(payload) {
    try {
      const res = await request("/mission/complete", { method: "POST", body: JSON.stringify(payload) });
      await store.setMissionDone(true);
      return res;
    } catch (e) {
      await store.setMissionDone(true);
      await store.queueLearningEvent({ type: "mission-completed-offline", payload, createdAt: Date.now() });
      return { score: null, mission: "Understand Your Mountain", offline: true };
    }
  },
  getMission: () => request("/mission"),

  getSyncStatus: () => request("/sync/status"),
  getSyncCatalog: (studentId = "std-001") => request(`/sync/catalog?studentId=${studentId}`),
  runSync: (payload) => request("/sync/run", { method: "POST", body: JSON.stringify(payload), timeoutMs: 60000 }),
  getSyncQueue: () => request("/sync/queue"),
  getSyncHistory: () => request("/sync/history"),
  getGatewayLog: () => request("/sync/gateway-log"),
  getConflicts: () => request("/sync/conflicts"),
  resolveConflict: (id) => request(`/sync/conflicts/${id}/resolve`, { method: "POST" }),
  retryDownload: (id) => request(`/sync/downloads/${id}/retry`, { method: "POST", timeoutMs: 30000 }),
  pushEvent: (payload) => request("/sync/events", { method: "POST", body: JSON.stringify(payload) }),

  getTeacherDashboard: () => request("/teacher/dashboard"),
  requestPackage: (payload) => request("/teacher/requests", { method: "POST", body: JSON.stringify(payload) }),

  async getTopics(category, studentId = "std-001") {
    const qs = category ? `?category=${encodeURIComponent(category)}&studentId=${studentId}` : `?studentId=${studentId}`;
    try {
      const topics = await request(`/topics${qs}`);
      if (!category) await store.cacheTopics(topics);
      return topics;
    } catch (e) {
      const cached = await store.getCachedTopics();
      if (cached.length) return category ? cached.filter((t) => t.category === category) : cached;
      throw e;
    }
  },
  async getTopic(id, studentId = "std-001") {
    try {
      return await request(`/topics/${id}?studentId=${studentId}`);
    } catch (e) {
      const cached = await store.getCachedTopics();
      const found = cached.find((t) => t.id === id);
      if (found) return found;
      throw e;
    }
  },
  exploreTopic: (id, studentId = "std-001") =>
    request(`/topics/${id}/explore`, { method: "POST", body: JSON.stringify({ studentId }) }),
  submitTopicQuiz: (id, studentId, answers) =>
    request(`/topics/${id}/quiz`, { method: "POST", body: JSON.stringify({ studentId, answers }) }),
  saveTopic: (id, studentId = "std-001") =>
    request(`/topics/${id}/save`, { method: "POST", body: JSON.stringify({ studentId }) }),

  async getMissions(studentId = "std-001") {
    try {
      const missions = await request(`/missions?studentId=${studentId}`);
      await store.cacheMissions(missions);
      return missions;
    } catch (e) {
      const cached = await store.getCachedMissions();
      if (cached.length) return cached;
      throw e;
    }
  },
  getGamification: (studentId = "std-001") => request(`/students/${studentId}/gamification`),
};

export async function flushQueuedEvents() {
  const queued = await store.getQueuedEvents();
  if (!queued.length) return 0;
  const remaining = [];
  for (const ev of queued) {
    try {
      await api.pushEvent({ studentId: "std-001", type: ev.type, payload: ev.payload });
    } catch {
      remaining.push(ev);
    }
  }
  if (remaining.length) {
    await store.clearQueuedEvents();
    for (const ev of remaining.reverse()) await store.queueLearningEvent(ev);
    return queued.length - remaining.length;
  }
  await store.clearQueuedEvents();
  return queued.length;
}
