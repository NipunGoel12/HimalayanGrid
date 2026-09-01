import React from "react";
import { Badge, Button } from "../components/ui.jsx";

const STEPS = [
  { icon: "🛰️", title: "Satellite receives data", text: "New lessons, quizzes and images are beamed up to a satellite orbiting far above the Earth." },
  { icon: "📡", title: "Data reaches a ground station", text: "The satellite sends that data down to a ground station, even in places without normal internet cables." },
  { icon: "🏫", title: "Content reaches the local hub", text: "A small computer at the village school — the local hub — receives and stores the content." },
  { icon: "📶", title: "Students connect over local Wi-Fi", text: "Your device talks to the local hub over Wi-Fi, which works even when the satellite link is offline." },
  { icon: "🔄", title: "Progress syncs when connection returns", text: "Whatever you learn is saved on your device first, and safely syncs back up the next time a connection is available." },
];

export default function LearningSatellite({ setView }) {
  return (
    <div className="view-max" style={{ maxWidth: 640 }}>
      <div className="section">
        <Badge tone="brand">🛰️ Learning Satellite</Badge>
        <div className="page-title" style={{ marginTop: 8 }}>How learning reaches remote villages</div>
        <div className="page-subtitle">
          Your learning materials can reach remote schools even when normal internet is unavailable.
        </div>
      </div>

      <div className="panel panel-pad section">
        <svg viewBox="0 0 400 120" width="100%" height="110">
          <text x="30" y="24" fontSize="26" textAnchor="middle">🛰️</text>
          <text x="140" y="24" fontSize="26" textAnchor="middle">⛰️</text>
          <text x="250" y="24" fontSize="26" textAnchor="middle">🏫</text>
          <text x="360" y="24" fontSize="26" textAnchor="middle">🎒</text>
          <path d="M45,20 L125,20" stroke="var(--brand)" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M155,20 L235,20" stroke="var(--brand)" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M265,20 L345,20" stroke="var(--brand)" strokeWidth="2" strokeDasharray="4 4" />
          <text x="30" y="42" fontSize="10" textAnchor="middle" fill="var(--text-faint)">Satellite</text>
          <text x="140" y="42" fontSize="10" textAnchor="middle" fill="var(--text-faint)">Mountain region</text>
          <text x="250" y="42" fontSize="10" textAnchor="middle" fill="var(--text-faint)">Local hub</text>
          <text x="360" y="42" fontSize="10" textAnchor="middle" fill="var(--text-faint)">Student</text>
        </svg>
      </div>

      <div className="section">
        <div className="section-title" style={{ marginBottom: 10 }}>How satellites work — step by step</div>
        <div className="panel">
          {STEPS.map((s, i) => (
            <div key={i} className="story-step" style={{ padding: "16px 20px" }}>
              <div className="story-step-icon">{s.icon}</div>
              <div>
                <div style={{ fontWeight: 650, fontSize: 13.5 }}>{i + 1}. {s.title}</div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 2, lineHeight: 1.5 }}>{s.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel panel-pad" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div className="muted" style={{ fontSize: 12.5 }}>Curious how this works under the hood? The technical Sync Center shows the real priority engine and sync queue.</div>
        <Button variant="secondary" small onClick={() => setView("sync")}>Open technical view</Button>
      </div>
    </div>
  );
}
