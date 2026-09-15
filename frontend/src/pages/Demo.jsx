import React, { useState } from "react";
import { CheckCircle2, PlayCircle } from "lucide-react";
import { Button, PageHeader } from "../components/ui.jsx";
import { api } from "../services/apiClient.js";
import { CONN_STATES } from "../constants.js";

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

export default function Demo({ setView, setNetworkOn, setHubOn, setConnState, student }) {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);

  const script = [
    { label: "Open HLG dashboard", run: async () => setView("home") },
    { label: "Turn off internet", run: async () => { setNetworkOn(false); setHubOn(false); } },
    { label: "Open a cached lesson", run: async () => setView("learning") },
    { label: "Ask Local AI a supported question", run: async () => { setHubOn(true); setView("guide"); } },
    { label: "Complete a quiz (saved locally)", run: async () => setView("quiz") },
    { label: "Show queued events on Sync", run: async () => setView("sync") },
    { label: "Enable simulated satellite window", run: async () => { setHubOn(true); setNetworkOn(true); setView("satellite"); } },
    {
      label: "Upload + priority download → SYNCED",
      run: async () => {
        setConnState(CONN_STATES.SYNCING);
        try {
          const res = await api.runSync({ studentId: student.id, simulateFailure: false });
          setConnState(res.status === "SYNC_ERROR" ? CONN_STATES.SYNC_ERROR : CONN_STATES.SYNCED);
        } catch { setConnState(CONN_STATES.SYNC_ERROR); }
      },
    },
    { label: "Return to learning with updated state", run: async () => setView("home") },
  ];

  async function play() {
    setRunning(true);
    for (let i = 0; i < script.length; i++) {
      setStep(i);
      await script[i].run();
      await wait(1400);
    }
    setRunning(false);
  }

  return (
    <div className="view-max" style={{ maxWidth: 560 }}>
      <PageHeader
        eyebrow="For judges"
        title="Hackathon Demo Mode"
        subtitle="Repeats the 3-minute student journey: offline learning → Local AI → queued events → simulated satellite sync."
      />

      <Button onClick={play} disabled={running} loading={running}><PlayCircle size={15} /> {running ? "Running demo…" : "Play full demo"}</Button>

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
