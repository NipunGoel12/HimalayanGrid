import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Flag } from "lucide-react";
import { api } from "../services/apiClient.js";
import { Button, Badge, ProgressBar, EmptyState } from "../components/ui.jsx";

const TOPICS = ["Fractions", "Water Cycle", "Contour Map"];

export default function Quiz({ student, onWeakTopicsChanged }) {
  const recommendedTopic = student.weak_topics[0] || TOPICS[0];
  const [topic, setTopic] = useState(recommendedTopic);
  const [quiz, setQuiz] = useState(null);
  const [stage, setStage] = useState("select"); // select | active | results
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => { setQuiz(null); setStage("select"); }, [topic]);

  async function start() {
    try {
      const data = await api.generateQuiz(student.id, topic);
      setQuiz(data);
      setAnswers({});
      setFlagged({});
      setQIndex(0);
      setStage("active");
    } catch {
      setQuiz(null);
    }
  }

  async function submit() {
    const questionIds = quiz.questions.map((q) => q.id);
    const answerArr = quiz.questions.map((_, i) => answers[i]);
    const res = await api.submitQuiz({ studentId: student.id, topic, answers: answerArr, questionIds });
    setResult(res);
    if (res.weakTopics) onWeakTopicsChanged?.(res.weakTopics);
    setStage("results");
  }

  function restart() {
    setStage("select");
    setResult(null);
  }

  if (stage === "select") {
    return (
      <div className="view-max">
        <div className="section">
          <div className="page-title">Quizzes</div>
          <div className="page-subtitle">Choose a topic. Recommended topics are based on recent quiz performance.</div>
        </div>
        <div className="panel panel-pad">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {TOPICS.map((t) => (
              <button key={t} className={`chip ${topic === t ? "active" : ""}`} onClick={() => setTopic(t)}>
                {t}{student.weak_topics.includes(t) && <Badge tone="warning" style={{ marginLeft: 4 }}>Weak</Badge>}
              </button>
            ))}
          </div>
          <div className="kv-grid" style={{ marginBottom: 16 }}>
            <dt>Topic</dt><dd>{topic}</dd>
            <dt>Questions</dt><dd>3 multiple choice</dd>
            <dt>Recommended</dt><dd>{student.weak_topics.includes(topic) ? "Yes — flagged as a weak topic" : "No, but available to practice"}</dd>
          </div>
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
        <div className="section"><ProgressBar value={qIndex + 1} max={quiz.questions.length} /></div>

        <div className="panel panel-pad section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
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
              <label
                key={oi}
                style={{
                  display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, padding: "10px 12px",
                  borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)",
                  background: answers[qIndex] === oi ? "var(--brand-light)" : "var(--surface)", cursor: "pointer",
                }}
              >
                <input type="radio" name={"q" + qIndex} checked={answers[qIndex] === oi} onChange={() => setAnswers({ ...answers, [qIndex]: oi })} />
                {opt}
              </label>
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
                background: i === qIndex ? "var(--brand)" : answers[i] !== undefined ? "var(--brand-light)" : "var(--surface)",
                color: i === qIndex ? "#fff" : answers[i] !== undefined ? "var(--brand-dark)" : "var(--text-muted)",
                border: "1px solid " + (i === qIndex ? "var(--brand)" : "var(--border-strong)"),
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
    return (
      <div className="view-max">
        <div className="section">
          <div className="page-title">Quiz results</div>
          <div className="page-subtitle">{topic}</div>
        </div>

        <div className="panel panel-pad section" style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 750, color: result.score >= 70 ? "var(--success)" : "var(--warning)" }}>
              {result.score !== null ? result.score + "%" : "—"}
            </div>
            <div className="muted" style={{ fontSize: 12.5 }}>{result.correctCount ?? "—"} of {result.totalQuestions ?? quiz?.questions.length} correct</div>
          </div>
          <div style={{ flex: 1, minWidth: 220, fontSize: 13, color: "var(--text-muted)" }}>
            {result.score === null
              ? "Saved locally — this attempt will be scored once the Local Hub is reachable."
              : result.score >= 70
              ? "Nice work. This topic's priority for extra practice content will ease."
              : "This topic stays flagged as weak — related lessons are boosted in the Smart Priority Engine."}
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
                      {!r.isCorrect && r.correctIndex !== null && <> · Correct answer: {r.options[r.correctIndex]}</>}
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
