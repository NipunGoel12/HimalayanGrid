import React, { useEffect, useMemo, useState } from "react";
import { api } from "../services/apiClient.js";
import { CourseCard, EmptyState, SkeletonLines, PageHeader } from "../components/ui.jsx";
import { BookOpen } from "lucide-react";

export default function Courses({ openLesson, setView }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("All");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setLessons(await api.getLessons());
      } catch {
        setFromCache(true);
      }
      setLoading(false);
    })();
  }, []);

  const subjects = useMemo(() => ["All", ...Array.from(new Set(lessons.map((l) => l.subject)))], [lessons]);
  const filtered = subjectFilter === "All" ? lessons : lessons.filter((l) => l.subject === subjectFilter);

  return (
    <div className="view-max">
      <PageHeader
        title="Courses"
        subtitle={fromCache
          ? "Showing your locally cached catalog — the Local Hub is unreachable."
          : "Browse the curriculum. Cached lessons stay readable with the network off."}
      />

      <div className="section" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {subjects.map((s) => (
          <button key={s} className={`chip ${subjectFilter === s ? "active" : ""}`} onClick={() => setSubjectFilter(s)}>{s}</button>
        ))}
      </div>

      {loading ? (
        <SkeletonLines count={5} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses found" body="Try another subject, or open Sync to download packages." />
      ) : (
        <div className="course-grid stagger">
          {filtered.map((l) => (
            <CourseCard
              key={l.id}
              lesson={l}
              onContinue={(lesson) => openLesson(lesson.id, lesson.subject)}
              onDownload={() => setView?.("sync")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
