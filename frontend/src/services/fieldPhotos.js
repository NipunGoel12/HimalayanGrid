/**
 * Field Camera storage + AI helpers.
 * Photos and their labels live on the device (IndexedDB) so the camera and
 * manual labelling work with no connection. AI auto-labelling and translation
 * to "any language" call the Local Hub (which calls NVIDIA) and need internet.
 */
import { get, set, del } from "idb-keyval";

const INDEX_KEY = "hlg:fieldphotos:index";
const photoKey = (id) => `hlg:fieldphotos:${id}`;

export async function listPhotos() {
  return (await get(INDEX_KEY)) || [];
}

export async function savePhoto(photo) {
  const idx = await listPhotos();
  const meta = { id: photo.id, createdAt: photo.createdAt, labelCount: photo.labels.length, langKey: photo.langKey, thumb: photo.thumb };
  const next = [meta, ...idx.filter((m) => m.id !== photo.id)];
  await set(photoKey(photo.id), photo);
  await set(INDEX_KEY, next);
}

export const loadPhoto = (id) => get(photoKey(id));

export async function deletePhoto(id) {
  await del(photoKey(id));
  await set(INDEX_KEY, (await listPhotos()).filter((m) => m.id !== id));
}

/** Downscale an image source (video/img/canvas) to a JPEG data URL. */
export function toJpeg(source, srcW, srcH, maxSide, quality) {
  const scale = Math.min(1, maxSide / Math.max(srcW, srcH));
  const c = document.createElement("canvas");
  c.width = Math.round(srcW * scale);
  c.height = Math.round(srcH * scale);
  c.getContext("2d").drawImage(source, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", quality);
}

/** Smaller copy for the AI request (hosted vision APIs cap inline images at ~180 KB). */
export async function toAiImage(dataUrl) {
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  const steps = [[768, 0.72], [640, 0.65], [512, 0.6], [400, 0.55]];
  let out = dataUrl;
  for (const [side, q] of steps) {
    out = toJpeg(img, img.naturalWidth, img.naturalHeight, side, q);
    if (out.length < 170000) break;
  }
  return out;
}

async function post(path, body, timeoutMs = 60000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`/api/vision${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

/** Ask the AI to find and name things in the photo. */
export async function aiLabel(dataUrl, languageName) {
  const image = await toAiImage(dataUrl);
  return post("/label", { image, language: languageName });
}

/** Translate English label names into any language. */
export function aiTranslate(names, languageName) {
  return post("/translate", { names, language: languageName }, 30000);
}
