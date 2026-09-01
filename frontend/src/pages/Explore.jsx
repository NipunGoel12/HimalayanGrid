import React, { useEffect, useState } from "react";
import { api } from "../services/apiClient.js";
import { TopicCard, CategoryPill, SkeletonLines, EmptyState } from "../components/ui.jsx";
import { CATEGORIES } from "../constants.js";
import { Compass } from "lucide-react";

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
        <div className="page-subtitle">Free exploration of the Himalayan world — pick anything that looks interesting.</div>
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
        <EmptyState icon={Compass} title="Nothing here yet" body="Try a different category." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14 }}>
          {filtered.map((t) => (
            <TopicCard key={t.id} topic={t} onClick={() => openTopic(t.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
