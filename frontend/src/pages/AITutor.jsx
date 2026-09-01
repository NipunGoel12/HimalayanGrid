import React, { useEffect, useRef, useState } from "react";
import { Send, Bot } from "lucide-react";
import { api } from "../services/apiClient.js";
import { Badge } from "../components/ui.jsx";

const SUGGESTED = ["What is a fraction?", "Explain the water cycle", "How do I read a contour map?"];

export default function AITutor({ student, networkOn, missionDone }) {
  const [messages, setMessages] = useState([
    { role: "tutor", mode: "system", text: `Hi ${student.name.split(" ")[0]}, ask me anything about your lessons. I use your grade, language and weak topics to tailor answers.` },
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
      const res = await api.askTutor({ studentId: student.id, question: q, online: networkOn, missionDone });
      setMessages((m) => [...m, { role: "tutor", mode: res.mode, fallback: res.fallback, text: res.text }]);
    } catch {
      setMessages((m) => [...m, { role: "tutor", mode: "local", text: "The Local Hub API is unreachable right now. Try again once connected to the Local Hub." }]);
    }
    setBusy(false);
  }

  return (
    <div className="view-max" style={{ maxWidth: 640 }}>
      <div className="section" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="page-title" style={{ fontSize: 17 }}>AI Tutor</div>
          <div className="page-subtitle">Grade {student.grade} · {student.language} · weak topics: {student.weak_topics.join(", ") || "none"}</div>
        </div>
        <Badge tone={networkOn ? "info" : "warning"}>{networkOn ? "Online tutor" : "Offline tutor"}</Badge>
      </div>

      <div className="panel" style={{ display: "flex", flexDirection: "column", height: 420 }}>
        <div className="scroll" style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 14, flexDirection: m.role === "student" ? "row-reverse" : "row" }}>
              {m.role === "tutor" && (
                <div style={{ width: 26, height: 26, borderRadius: 999, background: "var(--brand-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Bot size={14} color="var(--brand-dark)" />
                </div>
              )}
              <div style={{ maxWidth: "76%" }}>
                {m.role === "tutor" && m.mode && m.mode !== "system" && (
                  <div style={{ fontSize: 10.5, color: "var(--text-faint)", fontWeight: 650, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    {m.mode === "cloud" ? "Online tutor" : m.fallback ? "Offline tutor (fallback)" : "Offline tutor"}
                  </div>
                )}
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
          {busy && <div className="faint" style={{ fontSize: 12 }}>Thinking with lesson context…</div>}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div style={{ padding: "0 16px 10px", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SUGGESTED.map((s) => (
              <button key={s} className="chip" onClick={() => ask(s)}>{s}</button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid var(--border)" }}>
          <input
            type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask(input)}
            placeholder="Ask a question about your lessons…"
            style={{ flex: 1 }}
          />
          <button className="btn primary" onClick={() => ask(input)} disabled={busy}><Send size={14} /></button>
        </div>
      </div>
    </div>
  );
}
