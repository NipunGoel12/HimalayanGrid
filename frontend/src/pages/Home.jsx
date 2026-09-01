import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { api } from "../services/apiClient.js";
import { XpPill, StreakPill, Button, SkeletonLines, TopicCard } from "../components/ui.jsx";
import { JOURNEY_STEPS } from "../constants.js";

export default function Home({ student, gamification, setView, openTopic }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setTopics(await api.getTopics(null, student.id)); } catch { setTopics([]); }
      setLoading(false);
    })();
  }, [student.id]);

  const categoryDone = (cat) => topics.some((t) => t.category === cat && t.quizCompleted);
  const currentStepIndex = JOURNEY_STEPS.findIndex((s) => !categoryDone(s.id));
  const activeStep = JOURNEY_STEPS[currentStepIndex === -1 ? JOURNEY_STEPS.length - 1 : currentStepIndex];

  const adventureTopic =
    topics.find((t) => t.category === activeStep?.id && !t.explored) ||
    topics.find((t) => !t.explored) ||
    topics[0];

  const exploredCategories = new Set(topics.filter((t) => t.explored).map((t) => t.category));
  const recommended = topics
    .filter((t) => !t.quizCompleted && exploredCategories.has(t.category))
    .slice(0, 3);
  const fallbackRecommended = recommended.length ? recommended : topics.filter((t) => !t.explored).slice(0, 3);

  return (
    <div className="view-max">
      <div className="explorer-hero section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="page-title" style={{ fontSize: 21 }}>Welcome back, Explorer {student.avatar}</div>
            <div className="page-subtitle">{student.name} · Grade {student.grade} · You've discovered {gamification?.explorationPct ?? 0}% of the Himalayan Learning World.</div>
          </div>
          {gamification && (
            <div style={{ display: "flex", gap: 8 }}>
              <XpPill xp={gamification.xp} />
              <StreakPill streak={gamification.streak} />
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-head"><div className="section-title">My Learning Journey</div></div>
        <div className="panel panel-pad">
          <div className="journey-path">
            {JOURNEY_STEPS.map((s, i) => {
              const done = categoryDone(s.id);
              const isCurrent = i === currentStepIndex;
              return (
                <div className="journey-step" key={s.id}>
                  {i > 0 && <div className={`journey-connector ${JOURNEY_STEPS[i - 1] && categoryDone(JOURNEY_STEPS[i - 1].id) ? "done" : ""}`} />}
                  <button
                    className={`journey-node ${done ? "done" : isCurrent ? "current" : "locked"}`}
                    onClick={() => setView("explore")}
                    aria-label={s.label}
                  >
                    {s.icon}
                  </button>
                  <div className="journey-label">{s.label}</div>
                  <div className="journey-sub">{done ? "Complete" : isCurrent ? "In progress" : "Up next"}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="panel panel-pad section"><SkeletonLines count={3} /></div>
      ) : adventureTopic && (
        <div className="section">
          <div className="section-head"><div className="section-title">Today's Adventure</div></div>
          <div className="panel panel-pad" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ fontSize: 44 }}>{adventureTopic.icon}</div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{adventureTopic.title}</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{adventureTopic.region} · About 5 minutes · Learn + Mini Quiz + XP</div>
            </div>
            <Button onClick={() => openTopic(adventureTopic.id)}>Start adventure</Button>
          </div>
        </div>
      )}

      <div className="section">
        <div className="section-head">
          <div className="section-title">Himalayan Map</div>
          <button className="btn link" onClick={() => setView("map")}>Open map <ArrowRight size={13} /></button>
        </div>
        <div className="panel panel-pad" style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Explore Ladakh, Sikkim, Uttarakhand and more on an interactive offline map — switch between Geography, History, Environment, Culture, Science and Satellite modes.
        </div>
      </div>

      {fallbackRecommended.length > 0 && (
        <div className="section">
          <div className="section-head"><div className="section-title">Recommended for you</div></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14 }}>
            {fallbackRecommended.map((t) => <TopicCard key={t.id} topic={t} onClick={() => openTopic(t.id)} />)}
          </div>
        </div>
      )}
    </div>
  );
}
