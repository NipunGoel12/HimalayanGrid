import React, { useEffect, useMemo, useState } from "react";
import { api } from "../services/apiClient.js";
import { Badge, Button, EmptyState, SkeletonLines } from "../components/ui.jsx";
import { BookOpen } from "lucide-react";

export default function Courses({ openLesson }) {
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
      <div className="section">
        <div className="page-title">Courses</div>
        <div className="page-subtitle">
          Browse the full curriculum catalog.{fromCache && " Showing your locally cached copy — the Local Hub is unreachable."}
        </div>
      </div>

      <div className="section" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {subjects.map((s) => (
          <button key={s} className={`chip ${subjectFilter === s ? "active" : ""}`} onClick={() => setSubjectFilter(s)}>{s}</button>
        ))}
      </div>

      <div className="panel">
        {loading ? (
          <div className="panel-body"><SkeletonLines count={5} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={BookOpen} title="No courses found" body="Try a different subject filter." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Lesson</th><th>Subject</th><th>Language</th><th>Grade</th><th>Size</th><th>Availability</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600 }}>{l.title}</td>
                    <td className="muted">{l.subject}</td>
                    <td className="muted">{l.language}</td>
                    <td className="muted">{l.grade}</td>
                    <td className="muted">{l.size_mb} MB</td>
                    <td>{l.cached ? <Badge tone="success">Downloaded</Badge> : <Badge tone="neutral">Not downloaded</Badge>}</td>
                    <td style={{ textAlign: "right" }}>
                      <Button small variant={l.cached ? "secondary" : "ghost"} disabled={!l.cached} onClick={() => openLesson(l.id, l.subject)}>
                        {l.cached ? "Continue" : "Sync to open"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
