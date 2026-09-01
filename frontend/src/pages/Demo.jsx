import React, { useState } from "react";
import { CheckCircle2, PlayCircle } from "lucide-react";
import { Badge, Button } from "../components/ui.jsx";
import { api } from "../services/apiClient.js";

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

export default function Demo({ setView, setNetworkOn, setHubOn, setConnState, student }) {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);

  const script = [
    { label: "Network off", run: async () => { setNetworkOn(false); setHubOn(false); } },
    { label: "Student opens app", run: async () => setView("dashboard") },
    { label: "Open a cached lesson", run: async () => setView("learning") },
    { label: "Ask the offline AI Tutor", run: async () => setView("tutor") },
    { label: "Complete Earth / Mountain Mission", run: async () => setView("mission") },
    { label: "Take a personalized quiz", run: async () => setView("quiz") },
    { label: "Progress saved locally", run: async () => setView("progress") },
    { label: "Enable satellite sync", run: async () => { setHubOn(true); setNetworkOn(true); setView("sync"); } },
    { label: "Smart Priority Engine ranks content", run: async () => {} },
    {
      label: "Mock satellite gateway syncs", run: async () => {
        setConnState("SYNCING");
        try {
          const res = await api.runSync({ studentId: student.id, simulateFailure: false });
          setConnState(res.status === "SYNC_ERROR" ? "SYNC_ERROR" : "ONLINE");
        } catch { setConnState("SYNC_ERROR"); }
      },
    },
    { label: "Network off again", run: async () => { setNetworkOn(false); setHubOn(false); } },
    { label: "Open the newly synced content", run: async () => setView("courses") },
  ];

  async function play() {
    setRunning(true);
    for (let i = 0; i < script.length; i++) {
      setStep(i);
      await script[i].run();
      await wait(1500);
    }
    setRunning(false);
  }

  return (
    <div className="view-max" style={{ maxWidth: 560 }}>
      <div className="section">
        <Badge tone="brand">For judges</Badge>
        <div className="page-title" style={{ marginTop: 8 }}>Hackathon Demo Mode</div>
        <div className="page-subtitle">
          Plays the full story end-to-end in under three minutes: offline learning, Earth mission, personalized quiz, local save, smart satellite sync, then continued offline learning.
        </div>
      </div>

      <Button onClick={play} disabled={running}><PlayCircle size={15} /> {running ? "Running demo…" : "Play full demo"}</Button>

      <div className="panel section">
        {script.map((s, i) => (
          <div key={i} className="panel-row" style={{ opacity: running && i > step ? 0.4 : 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {i < step ? <CheckCircle2 size={16} color="var(--success)" /> : (
                <span style={{ width: 16, height: 16, borderRadius: 999, border: "1px solid var(--border-strong)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, color: "var(--text-faint)" }}>{i + 1}</span>
              )}
              <span style={{ fontSize: 13, fontWeight: i === step && running ? 650 : 500 }}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
