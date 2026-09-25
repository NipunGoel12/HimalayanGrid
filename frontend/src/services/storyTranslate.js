/**
 * Story Mode translation — sends a story's title+steps to the Local Hub
 * (NVIDIA) for translation into any language, and caches the result on this
 * device so it works offline after the first successful translation.
 */
import { get, set } from "idb-keyval";

const cacheKey = (storyId, langKey) => `hlg:story-tr:${storyId}:${langKey}`;

export async function getStoryTranslation(storyId, story, langKey, languageName) {
  const cached = await get(cacheKey(storyId, langKey));
  if (cached) return { ...cached, offline: false, cached: true };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch("/api/vision/translate-story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story: { title: story.title, steps: story.steps.map((s) => ({ title: s.title, text: s.text })) }, language: languageName }),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Translation failed (${res.status})`);
    await set(cacheKey(storyId, langKey), data);
    return { ...data, offline: false, cached: false };
  } finally {
    clearTimeout(timer);
  }
}
