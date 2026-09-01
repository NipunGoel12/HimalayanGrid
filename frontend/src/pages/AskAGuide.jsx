import React, { useEffect, useRef, useState } from "react";
import { Send, Compass } from "lucide-react";
import { api } from "../services/apiClient.js";
import { Badge } from "../components/ui.jsx";

const SUGGESTED = [
  "Why do mountains have snow?",
  "How do rivers start?",
  "Tell me about snow leopards.",
  "Why are glaciers important?",
];
const QUICK_ACTIONS = ["Explain simply", "Give an example", "Quiz me"];

export default function AskAGuide({ student, networkOn }) {
  const [messages, setMessages] = useState([
    { role: "guide", mode: "system", text: `Hi ${student.name.split(" ")[0]}! I'm your guide to the Himalayas. Ask me anything, or try one of the questions below.` },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function ask(q) {
    if (!q.trim() || busy) return;
    setMessages((m) => [...m, { role: "student", text: q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await api.askTutor({ studentId: student.id, question: q, online: networkOn, missionDone: false });
      setMessages((m) => [...m, { role: "guide", mode: res.mode, fallback: res.fallback, text: res.text }]);
    } catch {
      setMessages((m) => [...m, { role: "guide", mode: "local", text: "I can't reach the Local Hub right now — try again once you're connected." }]);
    }
    setBusy(false);
  }

  function lastStudentQuestion() {
    const q = [...messages].reverse().find((m) => m.role === "student");
    return q ? q.text : "that topic";
  }
  function quickAction(action) {
    const topic = lastStudentQuestion();
    if (action === "Explain simply") ask(`Explain "${topic}" in the simplest way possible, for a young child.`);
    else if (action === "Give an example") ask(`Give me a real Himalayan example of "${topic}".`);
    else if (action === "Quiz me") ask(`Ask me one short quiz question about "${topic}".`);
  }

  return (
    <div className="view-max" style={{ maxWidth: 640 }}>
      <div className="section" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="page-title" style={{ fontSize: 18 }}>Ask a Guide</div>
          <div className="page-subtitle">A friendly helper for your Himalayan questions.</div>
        </div>
        <Badge tone={networkOn ? "info" : "warning"}>{networkOn ? "Online guide" : "Offline guide"}</Badge>
      </div>

      <div className="panel" style={{ display: "flex", flexDirection: "column", height: 440 }}>
        <div className="scroll" style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 14, flexDirection: m.role === "student" ? "row-reverse" : "row" }}>
              {m.role === "guide" && (
                <div style={{ width: 26, height: 26, borderRadius: 999, background: "var(--brand-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Compass size={14} color="var(--brand-dark)" />
                </div>
              )}
              <div style={{ maxWidth: "76%" }}>
                <div style={{
                  padding: "9px 13px", borderRadius: 10, fontSize: 13.5, lineHeight: 1.55,
                  background: m.role === "student" ? "var(--brand)" : "var(--surface-muted)",
                  color: m.role === "student" ? "#fff" : "var(--text)",
                  border: m.role === "student" ? "none" : "1px solid var(--border)",
                }}>
                  {m.text}
                </div>
              </div>
            </div>
          ))}
          {busy && <div className="faint" style={{ fontSize: 12 }}>Thinking…</div>}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div style={{ padding: "0 16px 10px", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SUGGESTED.map((s) => <button key={s} className="chip" onClick={() => ask(s)}>{s}</button>)}
          </div>
        )}
        {messages.length > 1 && (
          <div style={{ padding: "0 16px 10px", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {QUICK_ACTIONS.map((a) => <button key={a} className="chip" onClick={() => quickAction(a)}>{a}</button>)}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid var(--border)" }}>
          <input
            type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask(input)}
            placeholder="Ask your guide anything…"
            style={{ flex: 1 }}
          />
          <button className="btn primary" onClick={() => ask(input)} disabled={busy}><Send size={14} /></button>
        </div>
      </div>
    </div>
  );
}
