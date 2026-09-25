import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Upload, Sparkles, Download, Trash2, Volume2, Save, X, RefreshCcw, Languages, Eraser } from "lucide-react";
import { Badge, Button } from "./ui.jsx";
import { CATEGORIES, LANGUAGES, WORDS, langKey } from "../data/fieldLabels.js";
import { toJpeg, aiLabel, aiTranslate, listPhotos, savePhoto, loadPhoto, deletePhoto } from "../services/fieldPhotos.js";
import { queueLearningEvent } from "../services/offlineStore.js";

const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

// Quick-add suggestions for common visible parts, shown when a main pin is selected.
const SUGGESTED_PARTS = {
  person: ["eyes", "nose", "ears", "mouth", "hair", "hand"],
  animal: ["head", "legs", "tail", "ears", "eyes"],
  tree: ["trunk", "branches", "leaves", "roots"],
  plant: ["stem", "leaves", "roots"],
  flower: ["petals", "stem", "leaves"],
  mountain: ["peak", "snow line", "ridge", "slope"],
  house: ["roof", "door", "window", "wall"],
  vehicle: ["wheel", "window", "door"],
};
const newId = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** What to show on a pin for a given language. */
function labelText(label, lang, showEnglish) {
  const key = langKey(lang);
  // Sub-parts (e.g. "eyes", "roof") have no category — only WORDS.en/label.en apply.
  const generic = label.category ? WORDS.en[label.category] : null;
  const en = label.en || generic || "";
  if (key === "en") return { main: en, sub: "", missing: false };
  const main = label.locals?.[key] || (label.category ? WORDS[key]?.[label.category] : null) || "";
  return { main: main || en, sub: showEnglish || !main ? en : "", missing: !main };
}

export default function FieldCamera({ onSaved, notify }) {
  const [photo, setPhoto] = useState(null); // { id, createdAt, image, w, h, labels }
  const [cameraOn, setCameraOn] = useState(false);
  const [facing, setFacing] = useState("environment");
  const [camError, setCamError] = useState("");
  const [lang, setLang] = useState(LANGUAGES[0]);
  const [customLang, setCustomLang] = useState("");
  const [showEnglish, setShowEnglish] = useState(true);
  const [showParts, setShowParts] = useState(true);
  const [activeCat, setActiveCat] = useState("person");
  const [typed, setTyped] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [aiBusy, setAiBusy] = useState(false);
  const [trBusy, setTrBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { tone, text }

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const stageRef = useRef(null);
  const dragRef = useRef(null);
  const fileRef = useRef(null);

  const key = langKey(lang);
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => { listPhotos().then(setGallery); }, []);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  /* ---------------- camera ---------------- */
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);
  useEffect(() => stopCamera, [stopCamera]);

  async function startCamera(mode = facing) {
    setCamError("");
    stopCamera();
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError("Camera isn't available here (it needs https:// or localhost). You can upload a photo instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false,
      });
      streamRef.current = stream;
      setFacing(mode);
      setCameraOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
      });
    } catch (e) {
      setCamError(
        e.name === "NotAllowedError" ? "Camera permission was blocked. Allow it in the browser's address bar, or upload a photo instead."
        : e.name === "NotFoundError" ? "No camera found on this device. Upload a photo instead."
        : "Couldn't start the camera. Upload a photo instead."
      );
    }
  }

  function beginPhoto(image, w, h) {
    setPhoto({ id: newId("ph"), createdAt: Date.now(), image, w, h, labels: [] });
    setSelectedId(null); setMsg(null);
  }

  function capture() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const image = toJpeg(v, v.videoWidth, v.videoHeight, 1280, 0.85);
    const scale = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
    beginPhoto(image, Math.round(v.videoWidth * scale), Math.round(v.videoHeight * scale));
    stopCamera();
  }

  function onFile(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      const image = toJpeg(img, img.naturalWidth, img.naturalHeight, 1280, 0.85);
      const scale = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
      beginPhoto(image, Math.round(img.naturalWidth * scale), Math.round(img.naturalHeight * scale));
      URL.revokeObjectURL(url);
      stopCamera();
    };
    img.onerror = () => { URL.revokeObjectURL(url); setMsg({ tone: "danger", text: "That file couldn't be opened as a photo." }); };
    img.src = url;
  }

  /* ---------------- labels (main pins + nested sub-parts) ---------------- */
  const setLabels = (fn) => setPhoto((p) => (p ? { ...p, labels: fn(p.labels) } : p));

  /** Find a pin (main label or a sub-part) by id anywhere in the tree. */
  function findItem(labels, id) {
    for (const l of labels) {
      if (l.id === id) return { item: l, isPart: false, parent: null };
      const part = l.parts?.find((pt) => pt.id === id);
      if (part) return { item: part, isPart: true, parent: l };
    }
    return { item: null, isPart: false, parent: null };
  }
  /** Replace a pin (main or nested part) anywhere in the tree via an updater fn. */
  function mapItem(labels, id, updater) {
    return labels.map((l) => {
      if (l.id === id) return updater(l);
      if (l.parts?.some((pt) => pt.id === id)) return { ...l, parts: l.parts.map((pt) => (pt.id === id ? updater(pt) : pt)) };
      return l;
    });
  }
  /** Remove a pin: a main label removes it and its parts; a part removes just itself. */
  function removeItem(labels, id) {
    return labels.filter((l) => l.id !== id).map((l) => (l.parts?.some((pt) => pt.id === id) ? { ...l, parts: l.parts.filter((pt) => pt.id !== id) } : l));
  }

  function placeLabel(e) {
    if (dragRef.current?.moved) return;
    const r = stageRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    const text = typed.trim();
    const label = {
      id: newId("lb"), category: activeCat, x, y, source: "manual", parts: [],
      en: key === "en" && text ? text : WORDS.en[activeCat],
      locals: key !== "en" && text ? { [key]: text } : {},
    };
    setLabels((l) => [...l, label]);
    setSelectedId(label.id);
    setTyped("");
  }

  function onPinDown(e, id) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { id, moved: false };
    setSelectedId(id);
  }
  function onPinMove(e) {
    const d = dragRef.current;
    if (!d || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const r = stageRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    d.moved = true;
    setLabels((ls) => mapItem(ls, d.id, (it) => ({ ...it, x, y })));
  }
  function onPinUp() { setTimeout(() => { dragRef.current = null; }, 0); }

  const { item: selected, isPart: selectedIsPart, parent: selectedParent } = photo ? findItem(photo.labels, selectedId) : { item: null };

  function editSelected(patch) { setLabels((ls) => mapItem(ls, selectedId, (it) => ({ ...it, ...patch }))); }
  function editSelectedText(text) {
    setLabels((ls) => mapItem(ls, selectedId, (it) =>
      key === "en" ? { ...it, en: text || (selectedIsPart ? it.en : WORDS.en[it.category]) } : { ...it, locals: { ...it.locals, [key]: text } }
    ));
  }
  const removeSelected = () => { setLabels((ls) => removeItem(ls, selectedId)); setSelectedId(null); };
  /** Add a sub-part to the selected main pin. `name` (quick-add chip) is
   *  always English; otherwise falls back to the typed-name field. */
  function addSubPart(name) {
    if (!selected || selectedIsPart) return;
    const text = (name || typed).trim();
    if (!text) return;
    const angle = ((selected.parts?.length || 0) * 65) % 360;
    const part = {
      id: newId("pt"), source: "manual",
      en: name || (key === "en" ? text : "part"),
      locals: !name && key !== "en" ? { [key]: text } : {},
      x: Math.min(0.97, Math.max(0.03, selected.x + 0.09 * Math.cos((angle * Math.PI) / 180))),
      y: Math.min(0.97, Math.max(0.03, selected.y + 0.09 * Math.sin((angle * Math.PI) / 180))),
    };
    setLabels((ls) => ls.map((l) => (l.id === selected.id ? { ...l, parts: [...(l.parts || []), part] } : l)));
    setSelectedId(part.id);
    if (!name) setTyped("");
  }

  /* ---------------- AI ---------------- */
  async function runAiLabel() {
    if (!photo) return;
    setAiBusy(true); setMsg(null);
    try {
      const { labels } = await aiLabel(photo.image, lang.custom ? lang.name : lang.name.replace(/ \(.*\)/, ""));
      const fresh = labels.map((l) => ({
        id: newId("lb"), category: l.category, x: l.x, y: l.y, en: l.en, source: "ai",
        locals: l.local && key !== "en" ? { [key]: l.local } : {},
        parts: (l.parts || []).map((pt) => ({
          id: newId("pt"), en: pt.en, x: pt.x, y: pt.y, source: "ai",
          locals: pt.local && key !== "en" ? { [key]: pt.local } : {},
        })),
      }));
      const partCount = fresh.reduce((n, l) => n + l.parts.length, 0);
      setLabels((old) => [...old.filter((l) => l.source !== "ai"), ...fresh]);
      setSelectedId(null);
      setMsg(fresh.length
        ? { tone: "success", text: `AI found ${fresh.length} thing${fresh.length === 1 ? "" : "s"}${partCount ? ` and ${partCount} part${partCount === 1 ? "" : "s"} (like eyes, roof, trunk...)` : ""}. Positions are approximate — drag any pin to fix it, or delete wrong ones.` }
        : { tone: "warning", text: "The AI couldn't recognise anything clearly. Tap the photo to add labels yourself." });
    } catch (e) {
      setMsg({ tone: "danger", text: `${e.message} You can still label by tapping the photo.` });
    } finally { setAiBusy(false); }
  }

  /** Every pin in the tree, main labels then their parts, as a flat list. */
  function flatten(labels) {
    const out = [];
    for (const l of labels || []) { out.push(l); if (l.parts) out.push(...l.parts); }
    return out;
  }
  const needsTranslationOne = (it, k, tgt) => !it.locals?.[k] && (tgt.custom || (it.en && it.en !== WORDS.en[it.category]) || it.source === "ai");
  const needsTranslation = photo && key !== "en" && flatten(photo.labels).some((it) => needsTranslationOne(it, key, lang));

  async function runTranslate(targetLang = lang) {
    if (!photo) return;
    const k = langKey(targetLang);
    const todo = flatten(photo.labels).filter((it) => needsTranslationOne(it, k, targetLang));
    if (!todo.length) return;
    setTrBusy(true); setMsg(null);
    try {
      const names = [...new Set(todo.map((it) => it.en))];
      const { translations } = await aiTranslate(names, targetLang.name.replace(/ \(.*\)/, ""));
      const applyOne = (it) => (translations[it.en] && !it.locals?.[k] ? { ...it, locals: { ...it.locals, [k]: translations[it.en] } } : it);
      setLabels((ls) => ls.map((l) => ({ ...applyOne(l), parts: l.parts?.map(applyOne) })));
      setMsg({ tone: "success", text: `Translated into ${targetLang.name}.` });
    } catch (e) {
      setMsg({ tone: "danger", text: `${e.message} Built-in languages still work offline.` });
    } finally { setTrBusy(false); }
  }

  function useCustomLanguage() {
    const name = customLang.trim();
    if (!name) return;
    const l = { code: "custom", name, native: name, speech: "", custom: true };
    setLang(l);
    if (photo && online) runTranslate(l);
  }

  function speak(text) {
    if (!canSpeak || !text) return;
    const u = new SpeechSynthesisUtterance(text);
    if (lang.speech) u.lang = lang.speech;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  /* ---------------- save / export ---------------- */
  async function save() {
    if (!photo) return;
    const thumbImg = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = photo.image; });
    const thumb = toJpeg(thumbImg, thumbImg.naturalWidth, thumbImg.naturalHeight, 160, 0.6);
    const record = { ...photo, thumb, langKey: key };
    await savePhoto(record);
    const summary = {};
    let partCount = 0;
    photo.labels.forEach((l) => { summary[l.category] = (summary[l.category] || 0) + 1; partCount += l.parts?.length || 0; });
    await queueLearningEvent({
      type: "field-photo-labeled",
      payload: {
        photoId: photo.id, labelCount: photo.labels.length, partCount, language: lang.name, categories: summary,
        labels: photo.labels.map((l) => ({
          category: l.category, text: labelText(l, lang, false).main,
          parts: (l.parts || []).map((pt) => labelText(pt, lang, false).main),
        })),
        note: "Image stays on this device; only the labels are synced.",
      },
      createdAt: Date.now(),
    });
    setGallery(await listPhotos());
    onSaved?.();
    notify?.("Photo saved. Its labels are queued to sync.", "success");
  }

  async function openSaved(id) {
    const p = await loadPhoto(id);
    if (!p) return;
    setPhoto(p); setSelectedId(null); setMsg(null); stopCamera();
    const saved = LANGUAGES.find((l) => l.code === p.langKey);
    if (saved) setLang(saved);
  }
  async function removeSaved(id) {
    await deletePhoto(id);
    setGallery(await listPhotos());
    if (photo?.id === id) setPhoto(null);
  }

  function exportPng() {
    if (!photo) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const fs = Math.max(14, Math.round(c.width / 42));
      ctx.font = `700 ${fs}px "Noto Sans", "Segoe UI", system-ui, sans-serif`;
      ctx.textBaseline = "middle";
      if (lang.code === "ur") ctx.direction = "rtl";
      const drawPin = (x, y, text, color, scale) => {
        const fsz = fs * scale;
        ctx.font = `700 ${fsz}px "Noto Sans", "Segoe UI", system-ui, sans-serif`;
        const w = ctx.measureText(text).width + fsz * 1.2, h = fsz * 1.9;
        const px = x * c.width, py = y * c.height;
        const bx = Math.min(c.width - w - 4, Math.max(4, px - w / 2));
        const by = Math.min(c.height - h - 4, Math.max(4, py - h - fsz * 0.6));
        ctx.strokeStyle = "#fff"; ctx.lineWidth = scale >= 1 ? 2 : 1.3;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx + w / 2, by + h); ctx.stroke();
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(px, py, fsz * (scale >= 1 ? 0.42 : 0.3), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "rgba(7,13,24,.86)";
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, by, w, h, h / 2); else ctx.rect(bx, by, w, h); ctx.fill();
        ctx.strokeStyle = color; ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.textAlign = "center";
        ctx.fillText(text, bx + w / 2, by + h / 2 + 1);
      };
      photo.labels.forEach((l, i) => {
        const { main, sub } = labelText(l, lang, showEnglish);
        const color = CAT[l.category]?.color || "#38BDF8";
        drawPin(l.x, l.y, `${i + 1}. ${main}${sub ? ` · ${sub}` : ""}`, color, 1);
        if (showParts) (l.parts || []).forEach((pt) => {
          const p = labelText(pt, lang, showEnglish);
          ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
          ctx.beginPath(); ctx.moveTo(l.x * c.width, l.y * c.height); ctx.lineTo(pt.x * c.width, pt.y * c.height); ctx.stroke();
          ctx.setLineDash([]);
          drawPin(pt.x, pt.y, `${p.main}${p.sub ? ` · ${p.sub}` : ""}`, color, 0.68);
        });
      });
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = `field-photo-labeled-${lang.code === "custom" ? lang.name : lang.code}.png`;
      a.click();
    };
    img.src = photo.image;
  }

  /* ---------------- render ---------------- */
  const palette = useMemo(() => CATEGORIES.filter((c) => c.id !== "other"), []);
  const catWord = (id) => WORDS[key]?.[id] || WORDS.en[id];

  return (
    <div className="panel section fc-root">
      <div className="panel-header" style={{ flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className="section-title">📷 Photo Explorer — snap it, name it!</div>
          <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>
            Take a photo of anything around you — people, plants, mountains, houses, roads — then label it in your own language, and even label the small parts too! Works offline; AI help needs internet.
          </div>
        </div>
        <Badge tone={online ? "success" : "warning"} dot>{online ? "Online — AI labelling available" : "Offline — manual labelling"}</Badge>
      </div>

      <div className="panel-body">
        {/* Language */}
        <div className="fc-lang">
          <Languages size={15} aria-hidden="true" />
          <label htmlFor="fc-lang" className="faint" style={{ fontSize: 12 }}>Label language</label>
          <select id="fc-lang" value={lang.custom ? "custom" : lang.code}
            onChange={(e) => { if (e.target.value === "custom") return; setLang(LANGUAGES.find((l) => l.code === e.target.value)); }}>
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.native === l.name ? l.name : `${l.native} — ${l.name}`}</option>)}
            {lang.custom && <option value="custom">{lang.name} (AI)</option>}
          </select>
          <input type="text" placeholder="Any other language, e.g. Japanese" value={customLang} maxLength={30}
            onChange={(e) => setCustomLang(e.target.value)} onKeyDown={(e) => e.key === "Enter" && useCustomLanguage()} />
          <Button variant="secondary" small onClick={useCustomLanguage} disabled={!customLang.trim() || !online}>Use</Button>
          <label className="fc-check"><input type="checkbox" checked={showEnglish} onChange={(e) => setShowEnglish(e.target.checked)} /> Show English too</label>
        </div>
        {lang.basic && <div className="faint" style={{ fontSize: 11.5, marginBottom: 8 }}>Tibetan/Ladakhi covers common words only — ask a teacher or elder to confirm them.</div>}
        {!online && <div className="faint" style={{ fontSize: 11.5, marginBottom: 8 }}>Other languages need internet once to translate; the six built-in languages work offline.</div>}

        {!photo && (
          <div className="fc-capture">
            {cameraOn ? (
              <div className="fc-video-wrap">
                <video ref={videoRef} playsInline muted autoPlay className="fc-video" />
                <div className="fc-video-bar">
                  <Button onClick={capture}><Camera size={15} /> Capture</Button>
                  <Button variant="secondary" onClick={() => startCamera(facing === "environment" ? "user" : "environment")}><RefreshCcw size={14} /> Flip</Button>
                  <Button variant="ghost" onClick={stopCamera}><X size={14} /> Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="fc-start">
                <Button onClick={() => startCamera()}><Camera size={15} /> Open camera</Button>
                <Button variant="secondary" onClick={() => fileRef.current?.click()}><Upload size={14} /> Upload a photo</Button>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
              </div>
            )}
            {camError && <div className="callout warning" style={{ fontSize: 12.5, marginTop: 10 }}>{camError}</div>}
          </div>
        )}

        {photo && (
          <div className="fc-editor">
            <div>
              <div className="fc-palette" role="group" aria-label="Choose what to label, then tap the photo">
                {palette.map((c) => (
                  <button key={c.id} className={activeCat === c.id ? "active" : ""} style={activeCat === c.id ? { background: c.color, borderColor: c.color, color: "#07111f" } : undefined}
                    onClick={() => setActiveCat(c.id)} aria-pressed={activeCat === c.id}>
                    <span aria-hidden="true">{c.icon}</span> {catWord(c.id)}
                  </button>
                ))}
              </div>
              <input type="text" className="fc-typed" placeholder={`Optional name in ${lang.custom ? lang.name : lang.name.replace(/ \(.*\)/, "")} — then tap the photo`} value={typed}
                maxLength={40} onChange={(e) => setTyped(e.target.value)} />

              <div ref={stageRef} className="fc-stage" onClick={placeLabel} style={{ aspectRatio: `${photo.w} / ${photo.h}` }}>
                <img src={photo.image} alt="Captured photo to label" draggable={false} />
                {showParts && (
                  <svg className="fc-part-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    {photo.labels.flatMap((l) => (l.parts || []).map((pt) => (
                      <line key={pt.id} x1={l.x * 100} y1={l.y * 100} x2={pt.x * 100} y2={pt.y * 100}
                        stroke={CAT[l.category]?.color || "#38BDF8"} strokeWidth="0.4" strokeDasharray="1.5 1.2" opacity="0.85" vectorEffect="non-scaling-stroke" />
                    )))}
                  </svg>
                )}
                {photo.labels.map((l, i) => {
                  const { main, sub, missing } = labelText(l, lang, showEnglish);
                  const color = CAT[l.category]?.color || "#38BDF8";
                  return (
                    <React.Fragment key={l.id}>
                      <div className={`fc-pin ${selectedId === l.id ? "selected" : ""} ${missing ? "untranslated" : ""}`}
                        style={{ left: `${l.x * 100}%`, top: `${l.y * 100}%`, "--pin": color }}
                        onPointerDown={(e) => onPinDown(e, l.id)} onPointerMove={onPinMove} onPointerUp={onPinUp}
                        onClick={(e) => e.stopPropagation()} role="button" tabIndex={0} aria-label={`${main}${sub ? ` (${sub})` : ""}`}
                        onKeyDown={(e) => e.key === "Enter" && setSelectedId(l.id)}>
                        <span className="fc-pin-dot">{i + 1}</span>
                        <span className="fc-pin-text" dir={lang.code === "ur" ? "rtl" : undefined}>{main}{sub && <small> · {sub}</small>}</span>
                      </div>
                      {showParts && (l.parts || []).map((pt) => {
                        const pText = labelText(pt, lang, showEnglish);
                        return (
                          <div key={pt.id} className={`fc-pin fc-pin-part ${selectedId === pt.id ? "selected" : ""} ${pText.missing ? "untranslated" : ""}`}
                            style={{ left: `${pt.x * 100}%`, top: `${pt.y * 100}%`, "--pin": color }}
                            onPointerDown={(e) => onPinDown(e, pt.id)} onPointerMove={onPinMove} onPointerUp={onPinUp}
                            onClick={(e) => e.stopPropagation()} role="button" tabIndex={0}
                            aria-label={`${pText.main}, part of ${main}`} onKeyDown={(e) => e.key === "Enter" && setSelectedId(pt.id)}>
                            <span className="fc-pin-dot small">•</span>
                            <span className="fc-pin-text small" dir={lang.code === "ur" ? "rtl" : undefined}>{pText.main}{pText.sub && <small> · {pText.sub}</small>}</span>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="faint fc-hint" style={{ fontSize: 11.5, marginTop: 6 }}>
                Pick a category, then tap the photo to place a label. Drag a pin to move it; tap a pin to edit.
                <label className="fc-check" style={{ marginLeft: "auto" }}>
                  <input type="checkbox" checked={showParts} onChange={(e) => setShowParts(e.target.checked)} /> Show sub-parts (eyes, roof, trunk…)
                </label>
              </div>
            </div>

            <div className="fc-side">
              <div className="fc-actions">
                <Button onClick={runAiLabel} loading={aiBusy} disabled={!online || aiBusy}><Sparkles size={14} /> Auto-label with AI</Button>
                {needsTranslation && <Button variant="secondary" onClick={() => runTranslate()} loading={trBusy} disabled={!online || trBusy}><Languages size={14} /> Translate names</Button>}
              </div>
              {!online && <div className="faint" style={{ fontSize: 11.5 }}>AI labelling and translation need internet. Manual labelling works now.</div>}
              {msg && <div className={`callout ${msg.tone}`} style={{ fontSize: 12.5 }} role="status">{msg.text}</div>}

              {selected ? (
                <div className="panel panel-pad fc-edit">
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                    {selectedIsPart ? <>Edit part <span className="faint">of {labelText(selectedParent, lang, false).main}</span></> : `Edit label ${photo.labels.indexOf(selected) + 1}`}
                  </div>
                  {!selectedIsPart && (
                    <select value={selected.category} onChange={(e) => editSelected({ category: e.target.value })} aria-label="Category">
                      {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {catWord(c.id)}</option>)}
                    </select>
                  )}
                  <input type="text" maxLength={40} value={labelText(selected, lang, false).missing ? "" : labelText(selected, lang, false).main}
                    placeholder={labelText(selected, lang, false).missing ? `Type the ${lang.name} word` : ""} onChange={(e) => editSelectedText(e.target.value)} aria-label="Label text" />
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {canSpeak && <Button variant="secondary" small onClick={() => speak(labelText(selected, lang, false).main)}><Volume2 size={13} /> Listen</Button>}
                    <Button variant="danger" small onClick={removeSelected}><Trash2 size={13} /> Delete</Button>
                  </div>
                  {!selectedIsPart && (
                    <div className="fc-subpart-add">
                      <div className="faint" style={{ fontSize: 11, margin: "10px 0 6px" }}>Add a part of this {catWord(selected.category).toLowerCase()}:</div>
                      <div className="fc-chip-row">
                        {(SUGGESTED_PARTS[selected.category] || []).filter((p) => !selected.parts?.some((pt) => pt.en === p)).map((p) => (
                          <button key={p} className="fc-chip" onClick={() => addSubPart(p)}>+ {p}</button>
                        ))}
                        <button className="fc-chip" onClick={() => addSubPart()} disabled={!typed.trim()}>+ typed name</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="faint" style={{ fontSize: 12 }}>Select a pin to rename, change its category, hear it spoken, or delete it. Select a main pin to add its parts (eyes, roof, trunk…).</div>
              )}

              <ol className="fc-legend">
                {photo.labels.map((l, i) => {
                  const { main, sub } = labelText(l, lang, showEnglish);
                  return (
                    <li key={l.id}>
                      <div className={selectedId === l.id ? "selected" : ""} onClick={() => setSelectedId(l.id)}>
                        <span style={{ color: CAT[l.category]?.color }}>{CAT[l.category]?.icon}</span> {i + 1}. {main}{sub && <small className="faint"> · {sub}</small>}
                        {l.source === "ai" && <Badge tone="brand" style={{ marginLeft: 6 }}>AI</Badge>}
                      </div>
                      {!!l.parts?.length && (
                        <ul className="fc-legend-parts">
                          {l.parts.map((pt) => {
                            const pText = labelText(pt, lang, showEnglish);
                            return (
                              <li key={pt.id} className={selectedId === pt.id ? "selected" : ""} onClick={() => setSelectedId(pt.id)}>
                                • {pText.main}{pText.sub && <small className="faint"> · {pText.sub}</small>}
                                {pt.source === "ai" && <Badge tone="brand" style={{ marginLeft: 6 }}>AI</Badge>}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ol>

              <div className="fc-actions">
                <Button onClick={save}><Save size={14} /> Save &amp; queue sync</Button>
                <Button variant="secondary" onClick={exportPng} disabled={!photo.labels.length}><Download size={14} /> Labeled diagram (PNG)</Button>
                <Button variant="ghost" onClick={() => setLabels(() => [])} disabled={!photo.labels.length}><Eraser size={14} /> Clear</Button>
                <Button variant="ghost" onClick={() => { setPhoto(null); setMsg(null); }}><X size={14} /> New photo</Button>
              </div>
            </div>
          </div>
        )}

        {gallery.length > 0 && (
          <div className="fc-gallery">
            <div className="faint" style={{ fontSize: 12, margin: "14px 0 6px" }}>Saved on this device</div>
            <div className="fc-thumbs">
              {gallery.map((g) => (
                <div key={g.id} className="fc-thumb">
                  <button onClick={() => openSaved(g.id)} aria-label={`Open photo with ${g.labelCount} labels`}>
                    <img src={g.thumb} alt="" /><span>{g.labelCount} label{g.labelCount === 1 ? "" : "s"}</span>
                  </button>
                  <button className="fc-thumb-x" onClick={() => removeSaved(g.id)} aria-label="Delete saved photo"><X size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
