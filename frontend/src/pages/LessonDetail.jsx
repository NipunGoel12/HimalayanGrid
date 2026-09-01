import React, { useEffect, useState } from "react";
import { api } from "../services/apiClient.js";
import { Tag, Button, Empty } from "../components/ui.jsx";
import { queueLearningEvent } from "../services/offlineStore.js";

export default function LessonDetail({ lessonId, setView, student }) {
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLesson(await api.getLesson(lessonId));
      } catch {
        setError(true);
      }
    })();
  }, [lessonId]);

  async function markComplete() {
    setDone(true);
    // Every "complete" writes a real local event — no fake success buttons.
    await queueLearningEvent({ type: "lesson-completed", payload: { lessonId, title: lesson.title }, createdAt: Date.now() });
    try {
      await api.pushEvent({ studentId: student.id, type: "lesson-completed", payload: { lessonId, title: lesson.title } });
    } catch { /* stays queued locally until next sync */ }
  }

  if (error) return <Empty title="Lesson not found in local cache" body="This lesson has not been downloaded yet. Connect to the Satellite Sync panel to fetch it." />;
  if (!lesson) return <div className="pulse" style={{ color: "var(--mist)" }}>Loading lesson…</div>;

  return (
    <div className="anim-rise" style={{ maxWidth: 720 }}>
      <button onClick={() => setView("lessons")} style={{ background: "none", border: "none", color: "var(--mist)", fontSize: 12, marginBottom: 12, cursor: "pointer" }}>← Back to library</button>
      <Tag style={{ color: "var(--violet)", background: "rgba(139,143,224,0.12)" }}>{lesson.subject}</Tag>
      <div className="serif" style={{ fontSize: 22, fontWeight: 700, marginTop: 10 }}>{lesson.title}</div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 18 }}>{lesson.language} · Grade {lesson.grade} · Read fully offline</div>
      {lesson.sections.map((s, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{s.heading}</div>
          <div style={{ fontSize: 14, color: "var(--mist)", lineHeight: 1.6 }}>{s.body}</div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <Button variant="secondary" onClick={() => setView("tutor")}>Ask the AI Tutor about this</Button>
        <Button variant={done ? "ghost" : "primary"} disabled={done} onClick={markComplete}>
          {done ? "Marked complete ✓" : "Mark lesson complete"}
        </Button>
      </div>
    </div>
  );
}
