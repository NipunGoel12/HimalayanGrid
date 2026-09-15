import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Flag } from "lucide-react";
import { api } from "../services/apiClient.js";
import { saveQuizSession, getQuizSession, clearQuizSession } from "../services/offlineStore.js";
import { Button, Badge, ProgressBar, EmptyState, QuizOption, PageHeader } from "../components/ui.jsx";

const TOPICS = ["Fractions", "Water Cycle", "Contour Map"];

export default function Quiz({ student, onWeakTopicsChanged }) {
  const recommendedTopic = (student.weak_topics && student.weak_topics[0]) || TOPICS[0];
  const [topic, setTopic] = useState(recommendedTopic);
  const [quiz, setQuiz] = useState(null);
  const [stage, setStage] = useState("select");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [result, setResult] = useState(null);
  const [flash, setFlash] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const session = await getQuizSession();
      if (session?.quiz) {
        setTopic(session.topic);
        setQuiz(session.quiz);
        setAnswers(session.answers || {});
        setFlagged(session.flagged || {});
        setQIndex(session.qIndex || 0);
        setStage("active");
      }
    })();
  }, []);

  useEffect(() => {
    if (stage === "active" && quiz) {
      saveQuizSession({ topic, quiz, answers, flagged, qIndex, savedAt: Date.now() });
    }
  }, [stage, quiz, answers, flagged, qIndex, topic]);

  async function start() {
    setError("");
    try {
      const data = await api.generateQuiz(student.id, topic);
      setQuiz(data);
      setAnswers({});
      setFlagged({});
      setQIndex(0);
      setStage("active");
    } catch {
      setError("This topic has no quiz bank cached offline. Open it once while the Local Hub is on, then try again.");
      setQuiz(null);
    }
  }

  async function submit() {
    const questionIds = quiz.questions.map((q) => q.id);
    const answerArr = quiz.questions.map((_, i) => answers[i]);
    const res = await api.submitQuiz({ studentId: student.id, topic, answers: answerArr, questionIds });
    setResult(res);
    if (res.weakTopics) onWeakTopicsChanged?.(res.weakTopics);
    await clearQuizSession();
    setStage("results");
  }

  function pick(i) {
    setAnswers({ ...answers, [qIndex]: i });
    setFlash("selected");
    setTimeout(() => setFlash(null), 280);
  }

  function restart() {
    setStage("select");
    setResult(null);
    clearQuizSession();
  }

  if (stage === "select") {
    return (
      <div className="view-max">
        <PageHeader title="Quiz" subtitle="Questions load from the Local Hub or from the on-device cache. Attempts survive refresh." />
        <div className="panel panel-pad">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {TOPICS.map((t) => (
              <button key={t} className={`chip ${topic === t ? "active" : ""}`} onClick={() => setTopic(t)}>
                {t}{student.weak_topics?.includes(t) && <Badge tone="warning" style={{ marginLeft: 4 }}>Weak</Badge>}
              </button>
            ))}
          </div>
          <div className="kv-grid" style={{ marginBottom: 16 }}>
            <dt>Topic</dt><dd>{topic}</dd>
            <dt>Questions</dt><dd>Multiple choice, cached when generated</dd>
            <dt>Recommended</dt><dd>{student.weak_topics?.includes(topic) ? "Yes — flagged as a weak topic" : "Available to practice"}</dd>
          </div>
          {error && <div className="callout danger" style={{ marginBottom: 12 }}>{error}</div>}
          <Button onClick={start}>Start quiz</Button>
        </div>
      </div>
    );
  }

  if (stage === "active" && quiz) {
    const q = quiz.questions[qIndex];
    const answeredCount = Object.keys(answers).length;
    return (
      <div className="view-max">
        <div className="section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div className="page-title" style={{ fontSize: 16 }}>{topic} quiz</div>
          <div className="muted" style={{ fontSize: 12.5 }}>Question {qIndex + 1} of {quiz.questions.length} · {answeredCount} answered</div>
        </div>
        {quiz.fromCache && <div className="callout section">Loaded from device cache — fully usable offline.</div>}
        <div className="section"><ProgressBar value={qIndex + 1} max={quiz.questions.length} /></div>

        <div className="panel panel-pad section" key={qIndex} style={{ animation: "page-in .35s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 650, lineHeight: 1.4 }}>{q.question}</div>
            <button
              className="btn ghost small"
              onClick={() => setFlagged((f) => ({ ...f, [qIndex]: !f[qIndex] }))}
              style={{ color: flagged[qIndex] ? "var(--warning)" : "var(--text-faint)", flexShrink: 0 }}
            >
              <Flag size={13} /> {flagged[qIndex] ? "Flagged" : "Mark for review"}
            </button>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {q.options.map((opt, oi) => (
              <QuizOption
                key={oi}
                name={"q" + qIndex}
                label={opt}
                selected={answers[qIndex] === oi}
                result={flash && answers[qIndex] === oi ? "correct" : null}
                onSelect={() => pick(oi)}
              />
            ))}
          </div>
        </div>

        <div className="section" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {quiz.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setQIndex(i)}
              className="btn small"
              style={{
                width: 30, padding: 0, justifyContent: "center",
                background: i === qIndex ? "var(--brand)" : answers[i] !== undefined ? "var(--brand-light)" : "transparent",
                color: i === qIndex ? "#07111f" : "var(--text)",
                border: "1px solid var(--border-strong)",
                position: "relative",
              }}
            >
              {i + 1}
              {flagged[i] && <span style={{ position: "absolute", top: -3, right: -3, width: 6, height: 6, borderRadius: 999, background: "var(--warning)" }} />}
            </button>
          ))}
        </div>

        <div className="section" style={{ display: "flex", justifyContent: "space-between" }}>
          <Button variant="secondary" onClick={() => setQIndex((i) => Math.max(0, i - 1))} disabled={qIndex === 0}>Previous</Button>
          {qIndex < quiz.questions.length - 1 ? (
            <Button onClick={() => setQIndex((i) => i + 1)}>Next</Button>
          ) : (
            <Button onClick={submit} disabled={answeredCount < quiz.questions.length}>Submit quiz</Button>
          )}
        </div>
      </div>
    );
  }

  if (stage === "results" && result) {
    const offline = result.offline || result.pendingServerScore || result.score === null;
    return (
      <div className="view-max">
        <PageHeader title="Quiz results" subtitle={topic} />
        <div className="panel panel-pad section" style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", animation: "celebrate .45s ease" }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 750, color: (result.score ?? 0) >= 70 ? "var(--success)" : "var(--warning)" }}>
              {result.score !== null ? result.score + "%" : "Saved"}
            </div>
            <div className="muted" style={{ fontSize: 12.5 }}>{result.correctCount ?? "—"} of {result.totalQuestions ?? quiz?.questions.length} correct</div>
          </div>
          <div style={{ flex: 1, minWidth: 220, fontSize: 13, color: "var(--text-muted)" }}>
            {offline
              ? "Quiz completed offline. The result is stored on this device and will sync when a satellite window opens."
              : result.score >= 70
              ? "Nice work. This topic's extra-practice priority will ease."
              : "This topic stays flagged as weak — related packages rise in the Smart Priority Engine."}
          </div>
        </div>

        {result.review && result.review.length > 0 && (
          <div className="panel section">
            <div className="panel-header"><div className="section-title">Answer review</div></div>
            {result.review.map((r, i) => (
              <div key={r.questionId || i} className="panel-row" style={{ alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 10 }}>
                  {r.isCorrect ? <CheckCircle2 size={16} color="var(--success)" /> : <XCircle size={16} color="var(--danger)" />}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.question}</div>
                    <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>
                      Your answer: {r.options[r.chosenIndex] ?? "—"}
                      {!r.isCorrect && r.correctIndex !== null && <> · Correct: {r.options[r.correctIndex]}</>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="section" style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" onClick={restart}>Try another quiz</Button>
        </div>
      </div>
    );
  }

  return <EmptyState title="Quiz unavailable" body="This topic has no quiz bank cached offline." />;
}
