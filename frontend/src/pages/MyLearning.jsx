import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, MessageCircle, ClipboardCheck, WifiOff } from "lucide-react";
import { api } from "../services/apiClient.js";
import { queueLearningEvent } from "../services/offlineStore.js";
import { Button, Badge, ProgressBar, EmptyState, SkeletonLines } from "../components/ui.jsx";

export default function MyLearning({ student, initialLessonId, initialSubject, setView }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [subject, setSubject] = useState(initialSubject);
  const [currentId, setCurrentId] = useState(initialLessonId);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let all = [];
      try { all = await api.getLessons(); } catch { all = []; }
      setLessons(all);

      let completed = new Set();
      try {
        const progress = await api.getProgress(student.id);
        progress.events
          .filter((e) => e.type === "lesson-completed")
          .forEach((e) => completed.add(e.payload.lessonId));
      } catch { /* offline: fine, local badge just won't show synced completions */ }
      setCompletedIds(completed);

      if (!subject) {
        const preferredLesson = all.find((l) => student.weak_topics.includes(l.weak_topic)) || all[0];
        setSubject(preferredLesson ? preferredLesson.subject : null);
        setCurrentId((prev) => prev || (preferredLesson ? preferredLesson.id : null));
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id]);

  const subjects = useMemo(() => Array.from(new Set(lessons.map((l) => l.subject))), [lessons]);
  const chapter = useMemo(() => lessons.filter((l) => l.subject === subject), [lessons, subject]);
  const currentIndex = chapter.findIndex((l) => l.id === currentId);
  const current = chapter[currentIndex] || chapter[0];
  const completedInCourse = chapter.filter((l) => completedIds.has(l.id)).length;

  async function markComplete() {
    if (!current) return;
    setCompletedIds((s) => new Set([...s, current.id]));
    setJustCompleted(true);
    await queueLearningEvent({ type: "lesson-completed", payload: { lessonId: current.id, title: current.title }, createdAt: Date.now() });
    try {
      await api.pushEvent({ studentId: student.id, type: "lesson-completed", payload: { lessonId: current.id, title: current.title } });
    } catch { /* stays queued locally */ }
  }

  function goPrev() {
    if (currentIndex > 0) { setCurrentId(chapter[currentIndex - 1].id); setJustCompleted(false); }
  }
  function goNext() {
    if (currentIndex < chapter.length - 1) { setCurrentId(chapter[currentIndex + 1].id); setJustCompleted(false); }
  }

  if (loading) {
    return <div className="view-max panel panel-pad"><SkeletonLines count={6} /></div>;
  }
  if (!current) {
    return <EmptyState title="No lessons downloaded yet" body="Visit Courses and sync content to start learning offline." />;
  }

  return (
    <div className="view-max" style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, alignItems: "start" }}>
      {/* Chapter navigation */}
      <div className="panel" style={{ position: "sticky", top: 0 }}>
        <div className="panel-header" style={{ display: "block" }}>
          <select
            value={subject || ""}
            onChange={(e) => { setSubject(e.target.value); const first = lessons.find((l) => l.subject === e.target.value); setCurrentId(first?.id); }}
            style={{ width: "100%", marginBottom: 8 }}
          >
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginBottom: 6 }}>{completedInCourse} of {chapter.length} lessons complete</div>
          <ProgressBar value={completedInCourse} max={chapter.length || 1} />
        </div>
        <div>
          {chapter.map((l) => (
            <button
              key={l.id}
              onClick={() => { setCurrentId(l.id); setJustCompleted(false); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8, textAlign: "left",
                padding: "10px 16px", border: "none", borderBottom: "1px solid var(--border)",
                background: l.id === current.id ? "var(--brand-light)" : "transparent", cursor: "pointer",
              }}
            >
              {completedIds.has(l.id) ? <CheckCircle2 size={15} color="var(--success)" /> : <Circle size={15} color="var(--gray-300)" />}
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: l.id === current.id ? 650 : 500, color: l.id === current.id ? "var(--brand-dark)" : "var(--text)" }}>
                {l.title}
              </span>
              {!l.cached && <WifiOff size={12} color="var(--text-faint)" />}
            </button>
          ))}
        </div>
      </div>

      {/* Current lesson */}
      <div>
        <div className="section" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>{current.subject} · Lesson {currentIndex + 1} of {chapter.length}</div>
            <div className="page-title">{current.title}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {current.cached ? <Badge tone="success">Available offline</Badge> : <Badge tone="neutral">Requires sync</Badge>}
            {completedIds.has(current.id) && <Badge tone="brand">Completed</Badge>}
          </div>
        </div>

        <div className="panel panel-pad section">
          {!current.cached ? (
            <EmptyState title="Lesson not downloaded" body="Open Sync Center to download this lesson for offline reading." />
          ) : (
            <>
              {current.sections.map((s, i) => (
                <div key={i} style={{ marginBottom: 18 }}>
                  <div style={{ fontWeight: 650, fontSize: 14.5, marginBottom: 6 }}>{s.heading}</div>
                  <div style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.65 }}>{s.body}</div>
                </div>
              ))}
              <div className="callout" style={{ marginTop: 4 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--brand-dark)", marginBottom: 3 }}>RESOURCES</div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                  This lesson is cached for offline reading ({current.size_mb} MB). {current.weak_topic ? `Related quiz topic: ${current.weak_topic}.` : "No related quiz for this lesson."}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="section" style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={() => setView("tutor")}><MessageCircle size={14} /> Ask AI Tutor</Button>
            {current.weak_topic && (
              <Button variant="secondary" onClick={() => setView("quiz")}><ClipboardCheck size={14} /> Take quiz</Button>
            )}
            {current.cached && (
              <Button variant={completedIds.has(current.id) ? "ghost" : "primary"} disabled={justCompleted && completedIds.has(current.id)} onClick={markComplete}>
                {completedIds.has(current.id) ? "Marked complete" : "Mark as complete"}
              </Button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" small onClick={goPrev} disabled={currentIndex <= 0}><ChevronLeft size={14} /> Previous</Button>
            <Button variant="secondary" small onClick={goNext} disabled={currentIndex >= chapter.length - 1}>Next <ChevronRight size={14} /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
