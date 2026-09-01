/**
 * Offline local DB — Bhavay's PWA layer.
 *
 * Wraps IndexedDB (via idb-keyval) so the student app has somewhere durable
 * to keep cached lessons, the student profile, quiz attempts and a sync
 * queue of learning events recorded while offline. This is what makes the
 * "no fake success buttons" requirement real: every offline action here is
 * actually written to disk before the UI shows a confirmation.
 */
import { get, set, del, keys } from "idb-keyval";

const KEYS = {
  student: "hlg:student",
  lessons: "hlg:lessons",
  attempts: "hlg:attempts",
  events: "hlg:events", // unsynced learning events queue
  missionDone: "hlg:missionDone",
  downloadedPackages: "hlg:downloadedPackages",
  topics: "hlg:topics",
  onboarded: "hlg:onboarded",
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
  await set(KEYS.events, [event, ...existing]);
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

export async function resetLocalDb() {
  for (const k of Object.values(KEYS)) await del(k);
}
