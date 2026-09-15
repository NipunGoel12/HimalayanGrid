import React, { useEffect, useState } from "react";
import { api } from "../services/apiClient.js";
import { TopicCard, CategoryPill, SkeletonLines, EmptyState, ProgressBar, OfflineBadge } from "../components/ui.jsx";
import { CATEGORIES, DEMO_CURRICULUM } from "../constants.js";
import { Compass } from "lucide-react";

function metaFor(topic) {
  const hit = DEMO_CURRICULUM.find((d) => d.match.test(`${topic.title} ${topic.subject} ${topic.category || ""}`));
  return hit || { label: topic.subject, difficulty: "Explore", minutes: 8 };
}

export default function Explore({ student, openTopic }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setTopics(await api.getTopics(null, student.id)); } catch { setTopics([]); }
      setLoading(false);
    })();
  }, [student.id]);

  const filtered = category ? topics.filter((t) => t.category === category) : topics;

  return (
    <div className="view-max">
      <div className="section">
        <div className="page-title">Explore</div>
        <div className="page-subtitle">Discover Fractions, Water Cycle, Contour Maps, Himalayan geography, environment and satellite communication — all usable offline once cached.</div>
      </div>

      <div className="section" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <CategoryPill active={!category} icon="✨" label="All" onClick={() => setCategory(null)} color="var(--brand)" />
        {Object.entries(CATEGORIES).map(([key, c]) => (
          <CategoryPill key={key} active={category === key} icon={c.icon} label={c.label} color={c.color} onClick={() => setCategory(key)} />
        ))}
      </div>

      {loading ? (
        <div className="panel panel-pad"><SkeletonLines count={5} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Compass} title="Nothing here yet" body="You're offline and this category isn't in the local cache. Try All, or download content from Sync." />
      ) : (
        <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {filtered.map((t) => {
            const meta = metaFor(t);
            const pct = t.quizCompleted ? 100 : t.explored ? 50 : 0;
            return (
              <div key={t.id} className="destination-tile-wrap">
                <TopicCard
                  topic={t}
                  onClick={() => openTopic(t.id)}
                  extra={
                    <div style={{ marginTop: 10 }}>
                      <div className="faint" style={{ fontSize: 11, marginBottom: 4 }}>{meta.difficulty} · ~{meta.minutes} min</div>
                      <ProgressBar value={pct} />
                      <div style={{ marginTop: 8 }}><OfflineBadge available /></div>
                    </div>
                  }
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
