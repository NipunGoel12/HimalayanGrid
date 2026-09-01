import React, { useEffect, useState } from "react";
import { api } from "../services/apiClient.js";
import { Badge, ProgressBar, EmptyState, SkeletonLines } from "../components/ui.jsx";

export default function ProgressView({ student }) {
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try { setProgress(await api.getProgress(student.id)); } catch { setError(true); }
    })();
  }, [student.id]);

  if (error) return <EmptyState title="Progress unavailable offline" body="This dashboard is computed on the Local Hub. Reconnect to the Local Hub to view it." />;
  if (!progress) return <div className="view-max panel panel-pad"><SkeletonLines count={5} /></div>;

  return (
    <div className="view-max">
      <div className="section">
        <div className="page-title">Progress</div>
        <div className="page-subtitle">Computed from the Local Hub database — works over Local Wi-Fi even with the satellite link down.</div>
      </div>

      <div className="panel section">
        <div className="panel-header"><div className="section-title">Progress by subject</div></div>
        {progress.topicSummary.length === 0 ? (
          <div className="panel-body muted" style={{ fontSize: 12.5 }}>Complete a quiz to see topic-by-topic progress here.</div>
        ) : (
          <div className="panel-body" style={{ display: "grid", gap: 14 }}>
            {progress.topicSummary.map((t) => (
              <div key={t.topic}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600 }}>{t.topic} {student.weak_topics.includes(t.topic) && <Badge tone="warning" style={{ marginLeft: 6 }}>Weak</Badge>}</span>
                  <span className="muted">{t.average}%</span>
                </div>
                <ProgressBar value={t.average} tone={t.average >= 70 ? "brand" : "warning"} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-header"><div className="section-title">Learning event log</div></div>
        <div className="table-wrap" style={{ maxHeight: 340, overflowY: "auto" }}>
          <table className="table">
            <thead><tr><th>Event</th><th>Time</th><th>Status</th></tr></thead>
            <tbody>
              {progress.events.slice(0, 30).map((e) => (
                <tr key={e.id}>
                  <td className="mono" style={{ fontSize: 12 }}>{e.type}</td>
                  <td className="muted">{new Date(e.created_at).toLocaleString()}</td>
                  <td>{e.synced ? <Badge tone="success">Synced</Badge> : <Badge tone="neutral">Local only</Badge>}</td>
                </tr>
              ))}
              {progress.events.length === 0 && (
                <tr><td colSpan={3} className="muted" style={{ textAlign: "center", padding: 20 }}>No events logged yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
