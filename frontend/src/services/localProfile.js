/**
 * Local student profile — offline-first onboarding layer.
 *
 * Uses localStorage (synchronous, no dependencies).
 * The local profile is the source of truth for the current offline session.
 *
 * IMPORTANT:
 *  - This module NEVER writes to, deletes, or modifies backend/database records.
 *  - The synthetic student ID uses a "local-" prefix so it is clearly
 *    distinguishable from backend-seeded students like "std-001".
 */

const PROFILE_KEY = "hlg:localProfile";
const THEME_KEY = "hlg:theme";

/* ── ID generation ─────────────────────────────────────────────────────────── */

/**
 * Generate a short random ID for the local student.
 * Example output: "local-a7f3b2"
 */
function generateLocalId() {
  const rand = Math.random().toString(36).slice(2, 8);
  return `local-${rand}`;
}

/* ── Profile CRUD ──────────────────────────────────────────────────────────── */

/**
 * Read the persisted local profile.
 * Returns null if no profile has been saved yet.
 *
 * Shape:
 * {
 *   id,            // "local-xxxxxx"
 *   name,
 *   grade,
 *   language,
 *   region,
 *   onboardingComplete,
 *   createdAt,
 *   updatedAt,
 * }
 */
export function getLocalProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Boolean check — does a local profile exist at all? */
export function hasLocalProfile() {
  return getLocalProfile() !== null;
}

/** Boolean check — has onboarding been completed? */
export function isOnboardingComplete() {
  const p = getLocalProfile();
  return p?.onboardingComplete === true;
}

/**
 * Create a brand-new local profile.
 * Generates a stable local-{id} that will never change.
 */
export function createLocalProfile(data) {
  const now = Date.now();
  const profile = {
    id: generateLocalId(),
    name: data.name,
    grade: data.grade,
    language: data.language,
    region: data.region || null,
    onboardingComplete: true,
    createdAt: now,
    updatedAt: now,
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

/**
 * Update an existing local profile.
 * PRESERVES the original ID — never regenerates it.
 * PRESERVES createdAt.
 */
export function updateLocalProfile(data) {
  const existing = getLocalProfile();
  if (!existing) {
    throw new Error("Cannot update: no local profile exists. Use createLocalProfile() first.");
  }
  const updated = {
    ...existing,
    ...data,
    /* Lock these — never overwrite */
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: Date.now(),
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Legacy alias kept for backward compatibility with App.jsx boot sequence.
 * Prefer createLocalProfile() or updateLocalProfile() for new code.
 */
export function saveLocalProfile(profile) {
  const existing = getLocalProfile();
  if (existing) {
    return updateLocalProfile(profile);
  }
  return createLocalProfile(profile);
}

/**
 * Build a synthetic student object that is shape-compatible with the
 * backend student model used throughout the existing app.
 *
 * This is a READ-ONLY frontend compatibility layer.
 * It NEVER overwrites or mutates backend/database records.
 */
export function buildSyntheticStudent(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    name: profile.name || "Explorer",
    grade: profile.grade || 6,
    village: profile.region || "Himalayan Region",
    language: profile.language || "Hindi",
    avatar: "🎓",
    weak_topics: [],
    _isLocalProfile: true,
  };
}

/**
 * Remove the local profile entirely (e.g. for a "sign out" flow later).
 */
export function clearLocalProfile() {
  localStorage.removeItem(PROFILE_KEY);
}

/* ── Theme preference ──────────────────────────────────────────────────────── */

/** Get the persisted theme. Defaults to "dark". */
export function getTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || "dark";
  } catch {
    return "dark";
  }
}

/** Persist theme preference. */
export function setTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* localStorage unavailable — silent fail */
  }
}
