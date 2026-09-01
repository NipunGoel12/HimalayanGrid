import React, { useEffect, useState } from "react";
import { api } from "../services/apiClient.js";
import { XpPill, StreakPill, BadgeChip, ProgressBar, SkeletonLines, TopicCard, EmptyState } from "../components/ui.jsx";
import { JOURNEY_STEPS } from "../constants.js";
import { Award } from "lucide-react";

const TABS = ["Journey", "Badges", "Missions", "Saved", "Downloads", "Progress"];

export default function Profile({ student, gamification, openTopic, setView }) {
  const [tab, setTab] = useState("Journey");
  const [topics, setTopics] = useState([]);
  const [missions, setMissions] = useState([]);
  const [academicProgress, setAcademicProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setTopics(await api.getTopics(null, student.id)); } catch { setTopics([]); }
      try { setMissions(await api.getMissions(student.id)); } catch { setMissions([]); }
      try { setAcademicProgress(await api.getProgress(student.id)); } catch { setAcademicProgress(null); }
      setLoading(false);
    })();
  }, [student.id]);

  const saved = topics.filter((t) => t.saved);
  const categoryDone = (cat) => topics.some((t) => t.category === cat && t.quizCompleted);

  return (
    <div className="view-max">
      <div className="section" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ width: 68, height: 68, borderRadius: 999, background: "var(--brand-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, border: "1px solid var(--border)" }}>
          {student.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="page-title">{student.name}</div>
          <div className="page-subtitle">Grade {student.grade} · {student.language} · {student.village}</div>
          {gamification && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <XpPill xp={gamification.xp} />
              <StreakPill streak={gamification.streak} />
            </div>
          )}
        </div>
      </div>

      <div className="tabs section">
        {TABS.map((t) => (
          <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="panel panel-pad"><SkeletonLines count={4} /></div>
      ) : tab === "Journey" ? (
        <div className="panel panel-pad">
          <div style={{ display: "grid", gap: 14 }}>
            {JOURNEY_STEPS.map((s) => (
              <div key={s.id}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                  <span>{s.icon} {s.label}</span>
                  <span className="muted">{categoryDone(s.id) ? "Complete" : "In progress"}</span>
                </div>
                <ProgressBar value={categoryDone(s.id) ? 1 : 0} max={1} tone={categoryDone(s.id) ? "brand" : "warning"} />
              </div>
            ))}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 14 }}>{gamification?.explorationPct ?? 0}% of the Himalayan Learning World discovered ({gamification?.exploredCount ?? 0} of {gamification?.totalTopics ?? 0} topics).</div>
        </div>
      ) : tab === "Badges" ? (
        <div className="panel panel-pad">
          {gamification?.badges?.length === 0 ? (
            <EmptyState icon={Award} title="No badges yet" body="Complete a mission in Explore or the Map to earn your first badge." />
          ) : (
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {gamification.badges.map((b) => <BadgeChip key={b.id} icon={b.icon} name={b.name} />)}
            </div>
          )}
        </div>
      ) : tab === "Missions" ? (
        <div style={{ display: "grid", gap: 10 }}>
          {missions.map((m) => (
            <div key={m.id} className="panel-row panel" style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                <span style={{ fontSize: 20 }}>{m.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.title}</div>
                  <ProgressBar value={m.progress} max={m.target_count} tone={m.complete ? "brand" : "warning"} />
                </div>
                <span className="muted" style={{ fontSize: 12 }}>{m.progress}/{m.target_count}</span>
              </div>
            </div>
          ))}
        </div>
      ) : tab === "Saved" ? (
        saved.length === 0 ? (
          <EmptyState title="No saved topics yet" body="Tap Save on any topic in Explore or the Map to find it here later." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14 }}>
            {saved.map((t) => <TopicCard key={t.id} topic={t} onClick={() => openTopic(t.id)} />)}
          </div>
        )
      ) : tab === "Downloads" ? (
        <div className="panel panel-pad" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div className="muted" style={{ fontSize: 12.5 }}>Downloaded lessons and content packages live in your Offline Library.</div>
          <button className="btn secondary small" onClick={() => setView("library")}>Open Offline Library</button>
        </div>
      ) : tab === "Progress" ? (
        <div className="panel panel-pad">
          {!academicProgress || academicProgress.topicSummary.length === 0 ? (
            <div className="muted" style={{ fontSize: 12.5 }}>Complete a graded quiz in Quizzes to see classwork progress here.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {academicProgress.topicSummary.map((t) => (
                <div key={t.topic}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span>{t.topic}</span><span className="muted">{t.average}%</span>
                  </div>
                  <ProgressBar value={t.average} tone={t.average >= 70 ? "brand" : "warning"} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
