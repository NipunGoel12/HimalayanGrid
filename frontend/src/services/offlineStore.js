/**
 * Offline local DB — Bhavya's PWA layer.
 * IndexedDB via idb-keyval. Do not add a second storage system.
 */
import { get, set, del, keys } from "idb-keyval";

const KEYS = {
  student: "hlg:student",
  lessons: "hlg:lessons",
  attempts: "hlg:attempts",
  events: "hlg:events",
  missionDone: "hlg:missionDone",
  downloadedPackages: "hlg:downloadedPackages",
  topics: "hlg:topics",
  onboarded: "hlg:onboarded",
  quizzes: "hlg:quizzes",
  quizSession: "hlg:quizSession",
  missions: "hlg:missions",
  completedLessons: "hlg:completedLessons",
  recent: "hlg:recent",
  settings: "hlg:settings",
  unanswered: "hlg:unanswered",
  lastSync: "hlg:lastSync",
};

export async function cacheLessons(lessons) {
  await set(KEYS.lessons, lessons);
}
export async function getCachedLessons() {
  return (await get(KEYS.lessons)) || [];
}

export async function cacheStudent(student) {
  await set(KEYS.student, student);
}
export async function getCachedStudent() {
  return await get(KEYS.student);
}

export async function saveAttemptLocally(attempt) {
  const existing = (await get(KEYS.attempts)) || [];
  await set(KEYS.attempts, [attempt, ...existing]);
}
export async function getLocalAttempts() {
  return (await get(KEYS.attempts)) || [];
}

export async function queueLearningEvent(event) {
  const existing = (await get(KEYS.events)) || [];
  await set(KEYS.events, [{ id: "loc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6), ...event }, ...existing]);
}
export async function getQueuedEvents() {
  return (await get(KEYS.events)) || [];
}
export async function clearQueuedEvents() {
  await set(KEYS.events, []);
}

export async function setMissionDone(v) {
  await set(KEYS.missionDone, v);
}
export async function getMissionDone() {
  return !!(await get(KEYS.missionDone));
}

export async function markPackageDownloaded(id) {
  const existing = (await get(KEYS.downloadedPackages)) || [];
  if (!existing.includes(id)) await set(KEYS.downloadedPackages, [...existing, id]);
}
export async function getDownloadedPackages() {
  return (await get(KEYS.downloadedPackages)) || [];
}

export async function debugDumpAllKeys() {
  return keys();
}

export async function cacheTopics(topics) {
  await set(KEYS.topics, topics);
}
export async function getCachedTopics() {
  return (await get(KEYS.topics)) || [];
}

export async function setOnboarded(v) {
  await set(KEYS.onboarded, v);
}
export async function getOnboarded() {
  return !!(await get(KEYS.onboarded));
}

export async function cacheQuiz(topic, data) {
  const all = (await get(KEYS.quizzes)) || {};
  all[topic] = data;
  await set(KEYS.quizzes, all);
}
export async function getCachedQuiz(topic) {
  const all = (await get(KEYS.quizzes)) || {};
  return all[topic] || null;
}

export async function saveQuizSession(session) {
  await set(KEYS.quizSession, session);
}
export async function getQuizSession() {
  return (await get(KEYS.quizSession)) || null;
}
export async function clearQuizSession() {
  await del(KEYS.quizSession);
}

export async function cacheMissions(missions) {
  await set(KEYS.missions, missions);
}
export async function getCachedMissions() {
  return (await get(KEYS.missions)) || [];
}

export async function markLessonCompleteLocal(lessonId) {
  const ids = (await get(KEYS.completedLessons)) || [];
  if (!ids.includes(lessonId)) await set(KEYS.completedLessons, [...ids, lessonId]);
}
export async function getLocalCompletedLessons() {
  return (await get(KEYS.completedLessons)) || [];
}

export async function touchRecent(entry) {
  const existing = (await get(KEYS.recent)) || [];
  const next = [entry, ...existing.filter((e) => e.id !== entry.id)].slice(0, 12);
  await set(KEYS.recent, next);
}
export async function getRecent() {
  return (await get(KEYS.recent)) || [];
}

export async function getSettings() {
  return (await get(KEYS.settings)) || { preferLocalAi: true, language: "Hindi" };
}
export async function saveSettings(s) {
  await set(KEYS.settings, s);
}

export async function saveUnanswered(q) {
  const existing = (await get(KEYS.unanswered)) || [];
  await set(KEYS.unanswered, [{ question: q, createdAt: Date.now() }, ...existing].slice(0, 40));
}
export async function getUnanswered() {
  return (await get(KEYS.unanswered)) || [];
}

export async function setLastSync(ts) {
  await set(KEYS.lastSync, ts);
}
export async function getLastSync() {
  return (await get(KEYS.lastSync)) || null;
}

export async function resetLocalDb() {
  for (const k of Object.values(KEYS)) await del(k);
}
