import React, { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, MessageCircle, CheckCircle2, XCircle, Download } from "lucide-react";
import { api } from "../services/apiClient.js";
import { touchRecent } from "../services/offlineStore.js";
import { Button, Badge, EmptyState, SkeletonLines, OfflineBadge } from "../components/ui.jsx";

export default function TopicDetail({ topicId, student, setView, onGamificationChange }) {
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState("learn");
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [celebrate, setCelebrate] = useState(null);
  const [offlineNote, setOfflineNote] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setStage("learn");
      setAnswers({});
      setResult(null);
      try {
        const t = await api.getTopic(topicId, student.id);
        setTopic(t);
        await touchRecent({ id: t.id, title: t.title, kind: "topic", at: Date.now() });
        try {
          const res = await api.exploreTopic(topicId, student.id);
          onGamificationChange?.(res.gamification);
        } catch {
          setOfflineNote(true);
        }
      } catch { setTopic(null); }
      setLoading(false);
    })();
  }, [topicId, student.id]);

  async function toggleSave() {
    try {
      const res = await api.saveTopic(topicId, student.id);
      setTopic((t) => ({ ...t, saved: res.saved }));
    } catch {
      setTopic((t) => ({ ...t, saved: !t.saved }));
    }
  }

  async function submitQuiz() {
    const answerArr = topic.quiz.map((_, i) => answers[i]);
    try {
      const res = await api.submitTopicQuiz(topicId, student.id, answerArr);
      setResult(res);
      onGamificationChange?.(res.gamification);
      if (res.newBadges?.length) setCelebrate(res.newBadges[0]);
    } catch {
      const review = topic.quiz.map((q, i) => ({
        question: q.question,
        isCorrect: q.answerIndex === answers[i] || q.correctIndex === answers[i],
      }));
      const correctCount = review.filter((r) => r.isCorrect).length;
      setResult({
        score: Math.round((correctCount / topic.quiz.length) * 100),
        correctCount,
        totalQuestions: topic.quiz.length,
        passed: correctCount === topic.quiz.length,
        xpAwarded: 0,
        review,
        offline: true,
      });
    }
    setStage("result");
  }

  if (loading) return <div className="view-max panel panel-pad"><SkeletonLines count={6} /></div>;
  if (!topic) return <EmptyState title="Topic not available offline" body="This topic hasn't been cached on this device yet. Download it from Sync when a window opens." />;

  return (
    <div className="view-max" style={{ maxWidth: 640 }}>
      <button className="btn ghost small" style={{ marginBottom: 10 }} onClick={() => setView("explore")}>← Back to Explore</button>

      <div className="panel section" style={{ overflow: "hidden" }}>
        <div style={{ height: 130, background: (topic.color || "#4DA3FF") + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>
          {topic.icon}
        </div>
        <div className="panel-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>{topic.region} · {topic.subject}</div>
              <div className="page-title" style={{ fontSize: 19 }}>{topic.title}</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <OfflineBadge available />
              <button className="btn ghost small" onClick={toggleSave}>
                {topic.saved ? <BookmarkCheck size={15} color="var(--brand)" /> : <Bookmark size={15} />} {topic.saved ? "Saved" : "Save"}
              </button>
            </div>
          </div>

          {offlineNote && <div className="callout warning" style={{ marginTop: 12 }}>You're offline. Exploration XP will sync when the Local Hub is reachable.</div>}

          <div className="callout" style={{ margin: "14px 0" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--glow)", marginBottom: 3 }}>DID YOU KNOW?</div>
            <div style={{ fontSize: 13.5 }}>{topic.fact}</div>
          </div>

          {stage === "learn" && (
            <>
              <div className="eyebrow">Learning objectives</div>
              <div style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.65, margin: "8px 0 16px" }}>{topic.description}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button onClick={() => setStage("quiz")}>Start / continue</Button>
                <Button variant="secondary" onClick={() => setView("guide")}><MessageCircle size={14} /> Ask a Guide</Button>
                <Button variant="ghost" onClick={() => setView("library")}><Download size={14} /> Downloads</Button>
              </div>
            </>
          )}

          {stage === "quiz" && topic.quiz && (
            <div>
              {topic.quiz.map((q, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 650, marginBottom: 8 }}>{i + 1}. {q.question}</div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {q.options.map((opt, oi) => (
                      <label key={oi} className={answers[i] === oi ? "quiz-opt" : "quiz-opt"} style={{ display: "flex", gap: 8, fontSize: 13, padding: "9px 11px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)", background: answers[i] === oi ? "var(--brand-light)" : "rgba(7,17,31,.4)", cursor: "pointer" }}>
                        <input type="radio" name={"tq" + i} checked={answers[i] === oi} onChange={() => setAnswers({ ...answers, [i]: oi })} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <Button onClick={submitQuiz} disabled={Object.keys(answers).length < topic.quiz.length}>Submit answers</Button>
            </div>
          )}

          {stage === "result" && result && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 30, fontWeight: 750, color: result.passed ? "var(--success)" : "var(--warning)" }}>{result.score}%</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {result.correctCount} of {result.totalQuestions} correct
                  {result.passed && result.xpAwarded ? <div style={{ color: "var(--success)", fontWeight: 600, marginTop: 2 }}>+{result.xpAwarded} XP earned</div> : null}
                  {result.offline && <div>Saved on this device — will sync later.</div>}
                </div>
              </div>

              {celebrate && (
                <div className="callout section" style={{ textAlign: "center", animation: "celebrate .45s ease" }}>
                  <div style={{ fontSize: 30 }}>{celebrate.badge_icon}</div>
                  <div style={{ fontWeight: 700, marginTop: 4 }}>Mission unlocked: {celebrate.title}</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>You earned the "{celebrate.badge_name}" badge (+{celebrate.xp_reward} XP)</div>
                </div>
              )}

              {result.review && (
                <div className="panel section">
                  {result.review.map((r, i) => (
                    <div key={i} className="panel-row" style={{ alignItems: "flex-start" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        {r.isCorrect ? <CheckCircle2 size={15} color="var(--success)" /> : <XCircle size={15} color="var(--danger)" />}
                        <div style={{ fontSize: 12.5 }}>{r.question}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                {!result.passed && <Button onClick={() => { setStage("quiz"); setResult(null); setAnswers({}); }}>Try again</Button>}
                <Button variant="secondary" onClick={() => setView("explore")}>Back to Explore</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
