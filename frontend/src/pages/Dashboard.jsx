import React, { useEffect, useState } from "react";
import { ArrowRight, Wifi, CloudDownload } from "lucide-react";
import { api } from "../services/apiClient.js";
import { getMissionDone, getDownloadedPackages } from "../services/offlineStore.js";
import { StatRow, Button, ProgressBar, Badge, SkeletonLines } from "../components/ui.jsx";
import { MISSION_TITLE } from "../constants.js";

export default function Dashboard({ student, connState, setView, openLesson }) {
  const [progress, setProgress] = useState(null);
  const [missionDone, setMissionDoneState] = useState(false);
  const [downloadedCount, setDownloadedCount] = useState(0);
  const [lastSync, setLastSync] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setProgress(await api.getProgress(student.id)); } catch { /* offline */ }
      try {
        const hist = await api.getSyncHistory();
        const done = hist.find((h) => h.message.includes("Sync complete"));
        setLastSync(done ? done.created_at : null);
      } catch { /* offline */ }
      try { setLessons(await api.getLessons()); } catch { /* offline */ }
      setMissionDoneState(await getMissionDone());
      setDownloadedCount((await getDownloadedPackages()).length);
      setLoading(false);
    })();
  }, [student.id, connState]);

  const attempts = progress?.attempts || [];
  const avgScore = attempts.length ? Math.round(attempts.reduce((a, b) => a + b.score, 0) / attempts.length) : null;
  const recentEvents = (progress?.events || []).filter((e) => e.type === "lesson-completed").slice(0, 3);
  const recentLessons = recentEvents.map((e) => lessons.find((l) => l.id === e.payload.lessonId)).filter(Boolean);

  return (
    <div className="view-max">
      <div className="section" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="page-title">Welcome back, {student.name.split(" ")[0]}</div>
          <div className="page-subtitle">{student.village} · Grade {student.grade} · {student.language} medium</div>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-faint)", display: "flex", alignItems: "center", gap: 6 }}>
          <Wifi size={13} />
          Last synced: {lastSync ? new Date(lastSync).toLocaleString() : "Never synced yet"}
        </div>
      </div>

      {loading ? (
        <div className="section"><SkeletonLines count={2} /></div>
      ) : (
        <div className="section">
          <StatRow
            items={[
              { label: "Weak topics", value: student.weak_topics.length, sub: student.weak_topics.join(", ") || "None flagged" },
              { label: "Avg. quiz score", value: avgScore !== null ? avgScore + "%" : "—", sub: `${attempts.length} attempt(s)` },
              { label: "Mountain Mission", value: missionDone ? "Complete" : "Pending", sub: MISSION_TITLE },
              { label: "Offline content", value: downloadedCount, sub: "Packages downloaded" },
            ]}
          />
        </div>
      )}

      <div className="section" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
        <div className="panel">
          <div className="panel-header">
            <div className="section-title">Continue learning</div>
            <button className="btn link" onClick={() => setView("learning")}>Go to My Learning <ArrowRight size={13} /></button>
          </div>
          <div>
            {student.weak_topics.length > 0 ? (
              student.weak_topics.map((t) => (
                <div key={t} className="panel-row">
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t}</div>
                    <div style={{ fontSize: 12, color: "var(--text-faint)" }}>Flagged as a weak topic — recommended next</div>
                  </div>
                  <Button small variant="secondary" onClick={() => setView("quiz")}>Practice quiz</Button>
                </div>
              ))
            ) : (
              <div className="panel-row"><span className="muted" style={{ fontSize: 13 }}>No weak topics right now — nice work. Browse Courses to keep learning.</span></div>
            )}
          </div>
        </div>

        <div className="panel panel-pad">
          <div className="section-title" style={{ marginBottom: 8 }}>Today's mission</div>
          <div className="muted" style={{ fontSize: 12.5, marginBottom: 12, lineHeight: 1.5 }}>
            {MISSION_TITLE} — explore elevation, slope, water sources and erosion.
          </div>
          {missionDone ? <Badge tone="success">Completed</Badge> : <Button small onClick={() => setView("mission")}>Open mission</Button>}
        </div>
      </div>

      <div className="section" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="panel">
          <div className="panel-header"><div className="section-title">Recently studied</div></div>
          {recentLessons.length === 0 ? (
            <div className="panel-body muted" style={{ fontSize: 12.5 }}>No lessons completed yet.</div>
          ) : (
            recentLessons.map((l) => (
              <div key={l.id} className="panel-row" style={{ cursor: "pointer" }} onClick={() => openLesson(l.id, l.subject)}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{l.title}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{l.subject}</div>
                </div>
                <ArrowRight size={14} color="var(--text-faint)" />
              </div>
            ))
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="section-title">Progress by subject</div>
            <button className="btn link" onClick={() => setView("progress")}>View all <ArrowRight size={13} /></button>
          </div>
          {(progress?.topicSummary || []).length === 0 ? (
            <div className="panel-body muted" style={{ fontSize: 12.5 }}>Complete a quiz to see progress here.</div>
          ) : (
            <div className="panel-body" style={{ display: "grid", gap: 12 }}>
              {progress.topicSummary.map((t) => (
                <div key={t.topic}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                    <span>{t.topic}</span>
                    <span className="muted">{t.average}%</span>
                  </div>
                  <ProgressBar value={t.average} tone={t.average >= 70 ? "brand" : "warning"} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="panel panel-pad" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CloudDownload size={16} color="var(--text-faint)" />
          <span style={{ fontSize: 13 }}>{downloadedCount} content package(s) available offline.</span>
        </div>
        <button className="btn link" onClick={() => setView("downloads")}>View downloads <ArrowRight size={13} /></button>
      </div>
    </div>
  );
}
