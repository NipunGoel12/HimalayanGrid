import React, { useEffect, useState } from "react";
import { api } from "../services/apiClient.js";
import { Badge, ProgressBar, SkeletonLines, Button } from "../components/ui.jsx";

export default function Missions({ student, openTopic, setView }) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setMissions(await api.getMissions(student.id)); } catch { setMissions([]); }
      setLoading(false);
    })();
  }, [student.id]);

  return (
    <div className="view-max">
      <div className="section">
        <div className="page-title">Learning Missions</div>
        <div className="page-subtitle">Complete a set of topics to earn a badge and bonus XP.</div>
      </div>

      {loading ? (
        <div className="panel panel-pad"><SkeletonLines count={4} /></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {missions.map((m) => (
            <div key={m.id} className="mission-card">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 26 }}>{m.icon}</div>
                <div>
                  <div style={{ fontWeight: 650, fontSize: 14.5 }}>{m.title}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{m.description}</div>
                </div>
                {m.complete && <Badge tone="success" style={{ marginLeft: "auto" }}>Complete</Badge>}
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span className="muted">{m.progress} of {m.target_count} topics</span>
                  <span className="muted">+{m.xp_reward} XP</span>
                </div>
                <ProgressBar value={m.progress} max={m.target_count} tone={m.complete ? "brand" : "warning"} />
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {m.topics.map((t) => (
                  <button key={t.id} className="chip" onClick={() => openTopic(t.id)}>{t.icon} {t.title}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="panel panel-pad section" style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 13 }}>Also try the signature <b>Understand Your Mountain</b> field mission, linked to real terrain data.</div>
        <Button variant="secondary" small onClick={() => setView("mission")}>Open mission</Button>
      </div>
    </div>
  );
}
