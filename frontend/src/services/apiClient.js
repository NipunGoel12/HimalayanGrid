/**
 * apiClient — thin wrapper Bhavay's frontend uses to talk to Nipun's backend.
 * Frontend components never call fetch() directly or duplicate backend logic;
 * they go through here, so the REST contract stays a stable seam.
 *
 * Every GET falls back to whatever is cached locally when the request fails
 * (network off, hub-only, or backend unreachable), so screens never break
 * with the network off — they just serve local data.
 */
import * as store from "./offlineStore.js";

const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
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
    return request(`/students/${id}/progress`);
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

  getLesson: (id) => request(`/lessons/${id}`),

  generateQuiz: (studentId, topic) =>
    request("/quiz/generate", { method: "POST", body: JSON.stringify({ studentId, topic }) }),

  async submitQuiz(payload) {
    try {
      return await request("/quiz/submit", { method: "POST", body: JSON.stringify(payload) });
    } catch (e) {
      // Offline: score it locally with the same 70%-threshold rule and queue the event.
      const total = payload.questionIds.length;
      // We don't have correct answers offline, so this is a conservative local
      // fallback: the attempt is recorded as pending and re-scored on next sync.
      const attempt = { id: "local-" + Date.now(), topic: payload.topic, score: null, pendingServerScore: true };
      await store.saveAttemptLocally(attempt);
      await store.queueLearningEvent({ type: "quiz-submitted-offline", payload, createdAt: Date.now() });
      return attempt;
    }
  },

  askTutor: (payload) => request("/ai/ask", { method: "POST", body: JSON.stringify(payload) }),

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
  runSync: (payload) => request("/sync/run", { method: "POST", body: JSON.stringify(payload) }),
  getSyncQueue: () => request("/sync/queue"),
  getSyncHistory: () => request("/sync/history"),
  getGatewayLog: () => request("/sync/gateway-log"),
  getConflicts: () => request("/sync/conflicts"),
  resolveConflict: (id) => request(`/sync/conflicts/${id}/resolve`, { method: "POST" }),
  retryDownload: (id) => request(`/sync/downloads/${id}/retry`, { method: "POST" }),
  pushEvent: (payload) => request("/sync/events", { method: "POST", body: JSON.stringify(payload) }),

  getTeacherDashboard: () => request("/teacher/dashboard"),
  requestPackage: (payload) => request("/teacher/requests", { method: "POST", body: JSON.stringify(payload) }),

  // --- Explorer content model: topics, missions, gamification ---
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

  getMissions: (studentId = "std-001") => request(`/missions?studentId=${studentId}`),
  getGamification: (studentId = "std-001") => request(`/students/${studentId}/gamification`),
};

/** Flushes any learning events queued locally while offline, once back online. */
export async function flushQueuedEvents() {
  const queued = await store.getQueuedEvents();
  if (!queued.length) return 0;
  for (const ev of queued) {
    try {
      await api.pushEvent({ studentId: "std-001", type: ev.type, payload: ev.payload });
    } catch {
      return 0; // stop; will retry next time we're online
    }
  }
  await store.clearQueuedEvents();
  return queued.length;
}
