import React, { useEffect, useRef, useState } from "react";
import { Send, Compass } from "lucide-react";
import { api } from "../services/apiClient.js";
import { getSettings } from "../services/offlineStore.js";
import { Badge, AISourceBadge, PageHeader, Button } from "../components/ui.jsx";

const SUGGESTED = [
  "What is a fraction?",
  "Explain the water cycle in the Himalayas",
  "How do contour lines show a steep slope?",
  "Why do glaciers matter for village water?",
];
const MODES = [
  { id: "explain", label: "Explain Simply" },
  { id: "example", label: "Give Example" },
  { id: "quiz", label: "Quiz Me" },
];

function wrapMode(question, mode) {
  if (mode === "explain") return `Explain simply, for a Grade 7 student: ${question}`;
  if (mode === "example") return `Give a concrete Himalayan village example for: ${question}`;
  if (mode === "quiz") return `Quiz me with one short question about: ${question}`;
  return question;
}

export default function AskAGuide({ student, networkOn, hubOn }) {
  const [messages, setMessages] = useState([
    { role: "guide", mode: "system", text: `Hi ${student.name.split(" ")[0]}. I am your offline-capable guide. Ask about Fractions, Water Cycle, Contour Maps, Himalayan geography, environment, or basic satellite communication.` },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("explain");
  const [preferLocal, setPreferLocal] = useState(true);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { getSettings().then((s) => setPreferLocal(s.preferLocalAi !== false)); }, []);

  const localReady = hubOn;
  const useCloud = networkOn && !preferLocal;

  async function ask(raw) {
    if (!raw.trim() || busy) return;
    const q = wrapMode(raw.trim(), mode);
    setMessages((m) => [...m, { role: "student", text: raw.trim() }]);
    setInput("");
    setBusy(true);
    try {
      const res = await api.askTutor({
        studentId: student.id,
        question: q,
        online: useCloud,
        missionDone: false,
      });
      const unanswered = res.unanswered || res.matchedTopic === null;
      setMessages((m) => [...m, {
        role: "guide",
        mode: res.mode,
        fallback: res.fallback,
        unanswered,
        hubUnavailable: res.hubUnavailable,
        topic: res.matchedTopic,
        text: unanswered
          ? "I don't have enough local knowledge to answer this yet.\n\nYour question has been saved and can be handled when connectivity is available."
          : res.text,
      }]);
    } catch {
      setMessages((m) => [...m, {
        role: "guide",
        mode: "local",
        unanswered: true,
        text: "Local Hub unavailable. Your question is saved on this device and can be handled when connectivity returns.",
      }]);
    }
    setBusy(false);
  }

  return (
    <div className="view-max" style={{ maxWidth: 720 }}>
      <PageHeader
        title="Ask a Guide"
        subtitle="Offline AI tutor. Nipun's Local AI answers supported topics without an internet key."
        action={
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {localReady
              ? <Badge tone="success">Local AI available</Badge>
              : <Badge tone="warning">Local Hub unavailable</Badge>}
            <Badge tone={useCloud ? "info" : "neutral"}>{useCloud ? "CLOUD AI possible" : "LOCAL AI preferred"}</Badge>
          </div>
        }
      />

      <div className="section" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {MODES.map((m) => (
          <button key={m.id} className={`chip ${mode === m.id ? "active" : ""}`} onClick={() => setMode(m.id)}>{m.label}</button>
        ))}
      </div>

      <div className="panel" style={{ display: "flex", flexDirection: "column", height: 480 }}>
        <div className="scroll" style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 14, flexDirection: m.role === "student" ? "row-reverse" : "row" }}>
              {m.role === "guide" && (
                <div style={{ width: 26, height: 26, borderRadius: 999, background: "var(--brand-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Compass size={14} color="var(--brand)" />
                </div>
              )}
              <div className="ai-bubble">
                <div style={{
                  padding: "9px 13px", borderRadius: 12, fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap",
                  background: m.role === "student" ? "linear-gradient(180deg,#6cc5ff,#4da3ff)" : "rgba(16,36,58,.9)",
                  color: m.role === "student" ? "#07111f" : "var(--text)",
                  border: m.role === "student" ? "none" : "1px solid var(--border)",
                }}>
                  {m.text}
                </div>
                {m.role === "guide" && m.mode !== "system" && (
                  <div className="ai-source" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <AISourceBadge mode={m.mode} fallback={m.fallback} unanswered={m.unanswered} />
                    {m.unanswered
                      ? <span className="faint" style={{ fontSize: 11 }}>Question saved for later</span>
                      : m.mode === "cloud"
                      ? <span className="faint" style={{ fontSize: 11 }}>Answered by Cloud AI{m.fallback ? " (after local/cloud fallback)" : ""} · Internet connection used</span>
                      : <span className="faint" style={{ fontSize: 11 }}>Answered by Local AI · Available offline</span>}
                    {m.topic && <Badge tone="brand">{m.topic}</Badge>}
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && <div className="faint" style={{ fontSize: 12 }}>Thinking with {useCloud ? "Cloud AI" : "Local AI"}…</div>}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div style={{ padding: "0 16px 10px", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SUGGESTED.map((s) => <button key={s} className="chip" onClick={() => ask(s)}>{s}</button>)}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid var(--border)" }}>
          <input
            type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask(input)}
            placeholder="Ask about fractions, water cycle, contours…"
            style={{ flex: 1 }}
            aria-label="Question"
          />
          <Button onClick={() => ask(input)} disabled={busy}><Send size={14} /></Button>
        </div>
      </div>
    </div>
  );
}
