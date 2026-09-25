/**
 * Vision service — Field Camera photo labelling + label translation.
 *
 * Uses NVIDIA-hosted models through the same key as Hima
 * (NVIDIA_NEMOTRON_API_KEY). Needs internet; the frontend keeps manual
 * labelling fully offline.
 *
 *   NVIDIA_VISION_MODEL   optional — force one vision model id
 *   NVIDIA_API_BASE       optional — override https://integrate.api.nvidia.com/v1
 */
const API_BASE = process.env.NVIDIA_API_BASE || "https://integrate.api.nvidia.com/v1";
const TEXT_MODEL = process.env.NVIDIA_NEMOTRON_MODEL || "nvidia/nemotron-3-ultra-550b-a55b";
const VISION_MODELS = process.env.NVIDIA_VISION_MODEL
  ? [process.env.NVIDIA_VISION_MODEL]
  : ["nvidia/nemotron-nano-12b-v2-vl", "meta/llama-3.2-90b-vision-instruct", "meta/llama-3.2-11b-vision-instruct"];

const CATEGORIES = ["person", "tree", "plant", "flower", "mountain", "snow", "river", "sky", "cloud", "house", "road", "bridge", "field", "animal", "vehicle", "rock", "other"];
const MAX_IMAGE_CHARS = 200000; // hosted vision APIs cap inline images (~180 KB)

class VisionError extends Error {
  constructor(message, status = 502) { super(message); this.status = status; }
}

function apiKey() {
  const k = process.env.NVIDIA_VISION_API_KEY;
  if (!k || /^your_/i.test(k)) throw new VisionError("AI labelling needs NVIDIA_NEMOTRON_API_KEY in backend/.env. Manual labelling still works.", 503);
  return k;
}

async function chat(model, messages, { maxTokens = 900, timeoutMs = 45000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey()}`, Accept: "application/json" },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.1, stream: false }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const err = new VisionError(`Model ${model} returned ${res.status}`, res.status === 401 || res.status === 403 ? 503 : 502);
      err.modelProblem = res.status === 404 || res.status === 400 || res.status === 422;
      err.detail = body.slice(0, 200);
      throw err;
    }
    const data = await res.json();
    return String(data?.choices?.[0]?.message?.content || "");
  } catch (e) {
    if (e.name === "AbortError") throw new VisionError("The AI took too long to respond.", 504);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Pull a JSON object out of a model reply (handles <think>, ``` fences, chatter).
 * Vision replies can get long (many items x parts) and hit the token limit
 * mid-array, so on a parse failure this also tries to REPAIR a truncated
 * reply by trimming back to the last complete "},{" boundary and re-closing
 * the brackets, rather than discarding the whole (mostly good) answer.
 */
function extractJson(text, { label = "reply" } = {}) {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:json)?/gi, "");
  const start = cleaned.indexOf("{");
  if (start < 0) {
    console.warn(`[vision] ${label}: no JSON object found. Raw reply (first 300 chars): ${text.slice(0, 300)}`);
    throw new VisionError("The AI didn't recognise anything in that photo. Try a clearer, well-lit photo, or add labels by tapping.");
  }
  const end = cleaned.lastIndexOf("}");
  const whole = end > start ? cleaned.slice(start, end + 1) : cleaned.slice(start);
  try {
    return JSON.parse(whole);
  } catch {
    // Likely truncated mid-array (hit the token limit). Repair: cut back to
    // the last complete "}" that closes an item, then re-close any open
    // brackets in the order they were opened.
    const body = cleaned.slice(start);
    let lastGood = -1, lastGoodStack = null;
    const stack = [];
    for (let i = 0; i < body.length; i++) {
      const c = body[i];
      if (c === "{" || c === "[") stack.push(c);
      else if (c === "}" || c === "]") { stack.pop(); if (stack.length === 2) { lastGood = i; lastGoodStack = stack.slice(); } }
    }
    if (lastGood > 0) {
      const closers = lastGoodStack.slice().reverse().map((c) => (c === "{" ? "}" : "]")).join("");
      const repaired = body.slice(0, lastGood + 1) + closers;
      try {
        const parsed = JSON.parse(repaired);
        console.warn(`[vision] ${label}: repaired a truncated reply (the AI's answer was cut off, likely by the reply length limit).`);
        return parsed;
      } catch { /* fall through */ }
    }
    console.warn(`[vision] ${label}: could not parse or repair. Raw reply (first 400 chars): ${text.slice(0, 400)}`);
    throw new VisionError("The AI reply could not be read. Try again.");
  }
}

const clamp01 = (n, fallback) => (Number.isFinite(+n) ? Math.min(1, Math.max(0, +n)) : fallback);
const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Categories worth asking the model to break down into visible parts.
const PARTABLE = new Set(["person", "animal", "tree", "plant", "flower", "mountain", "house", "vehicle"]);

function normalizePart(item, parentX, parentY) {
  const en = str(item?.name, 30);
  if (!en) return null;
  return {
    en,
    local: str(item?.local, 50),
    // Part coordinates are relative offsets (-0.15..0.15) from the parent, so a
    // model that only reasons "roughly above/left of the main point" still works.
    x: clamp01(parentX + (Number.isFinite(+item.dx) ? Math.max(-0.15, Math.min(0.15, +item.dx)) : 0), parentX),
    y: clamp01(parentY + (Number.isFinite(+item.dy) ? Math.max(-0.15, Math.min(0.15, +item.dy)) : 0), parentY),
  };
}

function normalizeLabels(raw) {
  const list = Array.isArray(raw?.labels) ? raw.labels : [];
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const en = str(item?.name, 40);
    if (!en) continue;
    const category = CATEGORIES.includes(String(item.category).toLowerCase()) ? String(item.category).toLowerCase() : "other";
    const x = clamp01(item.x, 0.5), y = clamp01(item.y, 0.5);
    const key = `${category}:${en.toLowerCase()}:${Math.round(x * 6)}:${Math.round(y * 6)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    let parts = [];
    if (PARTABLE.has(category) && Array.isArray(item.parts)) {
      const seenParts = new Set();
      for (const raw2 of item.parts) {
        const part = normalizePart(raw2, x, y);
        if (!part) continue;
        const pk = part.en.toLowerCase();
        if (seenParts.has(pk)) continue;
        seenParts.add(pk);
        parts.push(part);
        if (parts.length >= 6) break;
      }
    }

    out.push({ category, en, local: str(item.local, 60), x, y, parts });
    if (out.length >= 10) break;
  }
  return out;
}

async function labelImage(dataUrl, language = "English") {
  if (typeof dataUrl !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(dataUrl)) throw new VisionError("Send the photo as a JPEG/PNG data URL.", 400);
  if (dataUrl.length > MAX_IMAGE_CHARS) throw new VisionError("Photo is too large for AI labelling. Retake it or use a smaller image.", 413);
  const lang = str(language, 40) || "English";

  const prompt =
    `You label photos for school students in the Himalayan region, teaching them both what a thing is AND its visible parts. ` +
    `Look at the photo and name up to 8 distinct main things that are clearly visible: ` +
    `people, trees, plants, flowers, mountains, snow, rivers/lakes, sky, clouds, houses/buildings, roads/paths, bridges, fields/farms, animals, vehicles, rocks.\n` +
    `For each main thing give:\n` +
    `- "category": one of ${CATEGORIES.join(", ")}\n` +
    `- "name": a short specific English noun (e.g. "apple tree", "stone house")\n` +
    `- "local": that name written in ${lang} using its normal script${lang.toLowerCase() === "english" ? " (same as name)" : ""}\n` +
    `- "x","y": the centre of that thing as fractions of the image width/height between 0 and 1 (0,0 = top-left, 1,1 = bottom-right)\n` +
    `- "parts": ONLY for category person/animal/tree/plant/flower/mountain/house/vehicle, and ONLY parts you can actually see clearly in THIS photo (never invent parts that are hidden, too small, or out of frame). Up to 5 items, each:\n` +
    `   - "name": short English word for that part (e.g. for a person: "eyes","nose","ears","mouth","hair","hand"; for a mountain: "peak","snow line","ridge","slope"; for a house: "roof","door","window","wall"; for a tree: "trunk","branches","leaves","roots")\n` +
    `   - "local": that part's name in ${lang}\n` +
    `   - "dx","dy": its position as a SMALL offset from the main thing's centre (roughly -0.12 to 0.12), e.g. eyes are slightly above the person's centre so dy is negative\n` +
    `If a main thing has no clearly visible sub-parts worth teaching, give "parts": [].\n` +
    `Only list what you can really see; never invent objects or parts. Reply with ONLY JSON: ` +
    `{"labels":[{"category":"person","name":"farmer","local":"...","x":0.4,"y":0.5,"parts":[{"name":"eyes","local":"...","dx":0,"dy":-0.05},{"name":"hair","local":"...","dx":0,"dy":-0.09}]}]}`;

  let lastErr;
  for (const model of VISION_MODELS) {
    const userContent = [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: dataUrl } },
    ];
    const messages = /nemotron-nano-12b-v2-vl/.test(model)
      ? [{ role: "system", content: "/no_think" }, { role: "user", content: userContent }]
      : [{ role: "user", content: userContent }];
    try {
      const reply = await chat(model, messages, { maxTokens: 2000 });
      const labels = normalizeLabels(extractJson(reply, { label: `labelImage(${model})` }));
      return { labels, model };
    } catch (e) {
      lastErr = e;
      if (e.status === 503 || (e.status === 400 && !e.modelProblem)) throw e; // key missing / bad request: retrying won't help
      // model unavailable or unreadable reply -> try the next model
    }
  }
  throw lastErr || new VisionError("No vision model available.");
}

async function translateNames(names, language) {
  const lang = str(language, 40);
  if (!lang) throw new VisionError("language is required", 400);
  const list = (Array.isArray(names) ? names : []).map((n) => str(n, 40)).filter(Boolean).slice(0, 30);
  if (!list.length) return { translations: {} };
  const prompt =
    `Translate each English word or short phrase into ${lang}, written in ${lang}'s normal script. ` +
    `Use simple everyday words a school student would use. If ${lang} has no common word, give the closest phrase. ` +
    `Reply with ONLY JSON of the form {"translations":{"english":"translation"}} for exactly these items:\n${JSON.stringify(list)}`;
  const reply = await chat(TEXT_MODEL, [{ role: "user", content: prompt }], { maxTokens: 900, timeoutMs: 30000 });
  const raw = extractJson(reply, { label: "translateNames" })?.translations || {};
  const translations = {};
  for (const n of list) {
    const t = str(raw[n], 80);
    if (t) translations[n] = t;
  }
  return { translations };
}

/**
 * Translate a short educational story (title + numbered steps) into another
 * language. Keeps the same step count and order; used by Story Mode.
 */
async function translateStory(story, language) {
  const lang = str(language, 40);
  if (!lang) throw new VisionError("language is required", 400);
  const title = str(story?.title, 120);
  const steps = (Array.isArray(story?.steps) ? story.steps : [])
    .map((s) => ({ title: str(s?.title, 40), text: str(s?.text, 400) }))
    .filter((s) => s.title || s.text)
    .slice(0, 12);
  if (!title && !steps.length) throw new VisionError("title or steps are required", 400);

  const prompt =
    `Translate this short educational story for school children into ${lang}, written in ${lang}'s normal script. ` +
    `Keep it simple and friendly, the same length and tone, and keep exactly ${steps.length} steps in the same order. ` +
    `Reply with ONLY JSON: {"title":"...","steps":[{"title":"...","text":"..."}, ...]} for this story:\n` +
    `${JSON.stringify({ title, steps })}`;
  const reply = await chat(TEXT_MODEL, [{ role: "user", content: prompt }], { maxTokens: 1800, timeoutMs: 40000 });
  const raw = extractJson(reply, { label: "translateStory" });
  const outSteps = (Array.isArray(raw?.steps) ? raw.steps : []).map((s, i) => ({
    title: str(s?.title, 60) || steps[i]?.title || "",
    text: str(s?.text, 500) || steps[i]?.text || "",
  }));
  while (outSteps.length < steps.length) outSteps.push(steps[outSteps.length]);
  return { title: str(raw?.title, 120) || title, steps: outSteps.slice(0, steps.length) };
}

module.exports = { labelImage, translateNames, translateStory, VisionError, _test: { extractJson, normalizeLabels } };
