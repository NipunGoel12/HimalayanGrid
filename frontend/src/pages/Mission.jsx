import React, { useEffect, useState } from "react";
import { api } from "../services/apiClient.js";
import { Badge, Button, EmptyState } from "../components/ui.jsx";
import { getMissionDone } from "../services/offlineStore.js";

const ELEVATION = [2700, 2820, 3100, 3400, 3650, 3500, 3200, 2950, 2760];
const FACTS = {
  Elevation: "Lachen sits at roughly 2,700m; the ridge above the village rises to about 3,650m.",
  Slope: "The steepest section lies just below the ridge — contour lines bunch tightly there, meaning a fast, risky descent.",
  Vegetation: "Rhododendron forest thins out above 3,300m, giving way to alpine meadow and bare rock.",
  "Water Sources": "A glacial stream feeds the village's irrigation channel, fullest in the June–August melt season.",
  Erosion: "Loose scree on the steep face erodes fastest after monsoon rain — terracing below the ridge helps slow it.",
};
const LAYERS = ["Elevation", "Slope", "Vegetation", "Water Sources", "Erosion"];

export default function Mission({ student }) {
  const [layer, setLayer] = useState("Elevation");
  const [mission, setMission] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const max = Math.max(...ELEVATION);
  const min = Math.min(...ELEVATION);

  useEffect(() => {
    (async () => {
      try { setMission(await api.getMission()); } catch { setMission(null); }
      setAlreadyDone(await getMissionDone());
    })();
  }, []);

  async function submit() {
    setSubmitted(true);
    await api.completeMission({ studentId: student.id, answers });
  }

  if (!mission) return <EmptyState title="Mission pack not downloaded" body="Sync Center can download the Understand Your Mountain terrain pack." />;

  return (
    <div className="view-max">
      <div className="section">
        <div className="eyebrow" style={{ marginBottom: 4 }}>Earth mission · cached demo terrain data</div>
        <div className="page-title">{mission.title}</div>
        <div className="page-subtitle">{mission.village}</div>
      </div>

      <div className="section" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {LAYERS.map((l) => (
          <button key={l} className={`chip ${layer === l ? "active" : ""}`} onClick={() => setLayer(l)}>{l}</button>
        ))}
      </div>

      <div className="panel panel-pad section">
        <svg viewBox="0 0 600 160" width="100%" height="150">
          <polyline fill="none" stroke="var(--brand)" strokeWidth="2.5"
            points={ELEVATION.map((e, i) => {
              const x = (i / (ELEVATION.length - 1)) * 580 + 10;
              const y = 140 - ((e - min) / (max - min)) * 115;
              return `${x},${y}`;
            }).join(" ")}
          />
          {ELEVATION.map((e, i) => {
            const x = (i / (ELEVATION.length - 1)) * 580 + 10;
            const y = 140 - ((e - min) / (max - min)) * 115;
            return <circle key={i} cx={x} cy={y} r={3} fill="var(--brand-dark)" />;
          })}
        </svg>
        <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>{FACTS[layer]}</div>
      </div>

      {alreadyDone && !submitted ? (
        <EmptyState title="Mission already complete" body="You can still review the terrain layers above." action={<Badge tone="success">Completed</Badge>} />
      ) : !submitted ? (
        <div className="panel panel-pad">
          <div className="section-title" style={{ marginBottom: 12 }}>Mission check</div>
          {mission.questions.map((q, i) => (
            <div key={q.id} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8 }}>{i + 1}. {q.q}</div>
              <div style={{ display: "grid", gap: 6 }}>
                {q.options.map((opt, oi) => (
                  <label key={oi} style={{ display: "flex", gap: 8, fontSize: 13, padding: "8px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)", background: answers[q.id] === oi ? "var(--brand-light)" : "var(--surface)" }}>
                    <input type="radio" name={"m" + q.id} checked={answers[q.id] === oi} onChange={() => setAnswers({ ...answers, [q.id]: oi })} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <Button onClick={submit} disabled={Object.keys(answers).length < mission.questions.length}>Complete mission</Button>
        </div>
      ) : (
        <EmptyState title="Mission complete — saved locally" body="This learning event is queued for the next satellite sync and unlocks the Mountain Mission content package in the Smart Priority Engine." action={<Badge tone="success">Saved</Badge>} />
      )}
    </div>
  );
}
