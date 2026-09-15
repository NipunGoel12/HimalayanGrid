import React, { useEffect, useState } from "react";
import { api } from "../services/apiClient.js";
import { getCachedMissions } from "../services/offlineStore.js";
import { SkeletonLines, Button, MissionCard, EmptyState, PageHeader } from "../components/ui.jsx";

export default function Missions({ student, openTopic, setView }) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setMissions(await api.getMissions(student.id));
      } catch {
        setMissions(await getCachedMissions());
        setOffline(true);
      }
      setLoading(false);
    })();
  }, [student.id]);

  const current = missions.find((m) => !m.complete) || missions[0];

  return (
    <div className="view-max">
      <PageHeader
        title="Missions"
        subtitle="Complete related topics and quizzes. Progress is stored on this device."
      />
      {offline && <div className="callout warning section">Showing cached missions. New XP will sync when the Local Hub is back.</div>}

      {current && (
        <div className="panel panel-pad section">
          <div className="eyebrow">Current mission</div>
          <div className="page-title" style={{ fontSize: 18, marginTop: 4 }}>{current.title}</div>
          <div className="muted" style={{ marginTop: 4 }}>{current.description}</div>
          <div style={{ marginTop: 10, fontWeight: 650 }}>{current.progress} / {current.target_count}</div>
        </div>
      )}

      {loading ? (
        <div className="panel panel-pad"><SkeletonLines count={4} /></div>
      ) : missions.length === 0 ? (
        <EmptyState title="No missions cached" body="Open this page once while connected so missions can be stored offline." />
      ) : (
        <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {missions.map((m) => (
            <MissionCard key={m.id} mission={m} onOpenTopic={openTopic} />
          ))}
        </div>
      )}

      <div className="panel panel-pad section" style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 13 }}>Field mission <b>Understand Your Mountain</b> still works offline and writes a real learning event.</div>
        <Button variant="secondary" small onClick={() => setView("mission")}>Open mission</Button>
      </div>
    </div>
  );
}
