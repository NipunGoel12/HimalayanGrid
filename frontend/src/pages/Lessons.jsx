import React, { useEffect, useState } from "react";
import { api } from "../services/apiClient.js";
import { Tag, Button } from "../components/ui.jsx";

export default function Lessons({ setView }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.getLessons();
        setLessons(data);
      } catch {
        setFromCache(true);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ color: "var(--mist)" }} className="pulse">Loading lesson library…</div>;

  return (
    <div className="anim-rise">
      <div className="serif" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Offline Lesson Library</div>
      <div style={{ color: "var(--mist)", fontSize: 13, marginBottom: 16 }}>
        Every card below with a "Cached" badge is fully readable with the network off.
        {fromCache && " (Showing your locally cached copy — the Local Hub API is unreachable right now.)"}
      </div>
      <div className="grid-lessons">
        {lessons.map((l) => (
          <div key={l.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Tag style={{ color: "var(--violet)", background: "rgba(139,143,224,0.12)" }}>{l.subject}</Tag>
              {l.cached ? (
                <Tag style={{ color: "var(--green)", background: "rgba(79,179,126,0.12)" }}>Cached</Tag>
              ) : (
                <Tag style={{ color: "var(--faint)", background: "rgba(94,116,149,0.12)" }}>Not downloaded</Tag>
              )}
            </div>
            <div style={{ fontWeight: 700, marginTop: 10, fontSize: 15 }}>{l.title}</div>
            <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 4, flex: 1 }}>{l.language} · Grade {l.grade} · {l.size_mb} MB</div>
            <div style={{ marginTop: 12 }}>
              <Button small variant={l.cached ? "secondary" : "ghost"} disabled={!l.cached} onClick={() => setView("lesson-" + l.id)}>
                {l.cached ? "Open →" : "Sync to open"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
