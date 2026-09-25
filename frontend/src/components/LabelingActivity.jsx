import React, { useMemo, useState } from "react";
import { X, RotateCcw, CheckCircle2 } from "lucide-react";
import { Button, Badge } from "./ui.jsx";
import { getDiagramForCategory } from "../data/labelingDiagrams.jsx";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Tap-to-label picture activity: tap a word in the bank, then tap the blank
 * on the picture you think it belongs to. Fully offline — the diagram is
 * original inline SVG, not a photo or network image.
 */
export default function LabelingActivity({ topic, onClose }) {
  const diagram = useMemo(() => getDiagramForCategory(topic.category), [topic.category]);
  const words = useMemo(
    () => shuffle([...diagram.hotspots.map((h) => h.answer), ...(diagram.distractors || [])]),
    [diagram]
  );

  const [selectedWord, setSelectedWord] = useState(null);
  const [assignments, setAssignments] = useState({}); // hotspotId -> word
  const [checked, setChecked] = useState(false);

  const usedWords = new Set(Object.values(assignments));
  const bankWords = words.filter((w) => !usedWords.has(w));

  function pickWord(w) {
    if (checked) return;
    setSelectedWord((cur) => (cur === w ? null : w));
  }

  function tapHotspot(hotspotId) {
    if (checked) return;
    setAssignments((cur) => {
      const next = { ...cur };
      if (selectedWord) {
        next[hotspotId] = selectedWord;
      } else if (next[hotspotId]) {
        delete next[hotspotId]; // tap a filled blank with nothing selected -> clear it
      }
      return next;
    });
    setSelectedWord(null);
  }

  function check() {
    setChecked(true);
  }

  function reset() {
    setAssignments({});
    setSelectedWord(null);
    setChecked(false);
  }

  const correctCount = diagram.hotspots.filter((h) => assignments[h.id] === h.answer).length;
  const allFilled = diagram.hotspots.every((h) => assignments[h.id]);

  const hotspotDots = diagram.hotspots.map((h) => {
    const filled = assignments[h.id];
    const isCorrect = checked && filled === h.answer;
    const isWrong = checked && filled && filled !== h.answer;
    return (
      <g key={h.id} onClick={() => tapHotspot(h.id)} style={{ cursor: checked ? "default" : "pointer" }}>
        <circle
          cx={h.x}
          cy={h.y}
          r={4.2}
          fill={isCorrect ? "#2f9e5c" : isWrong ? "#c0453f" : filled ? "var(--brand)" : "#ffffff"}
          stroke={isCorrect ? "#2f9e5c" : isWrong ? "#c0453f" : "var(--brand)"}
          strokeWidth="1.2"
        />
        {!filled && <circle cx={h.x} cy={h.y} r={1.3} fill="var(--brand)" />}
      </g>
    );
  });

  return (
    <div className="labeling-modal-overlay" onClick={onClose}>
      <div className="labeling-modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 18px 0" }}>
          <div>
            <Badge tone="brand">🏷️ Label &amp; Learn</Badge>
            <div style={{ fontWeight: 700, fontSize: 15.5, marginTop: 6 }}>{diagram.title}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              {topic.title} · Tap a word below, then tap the matching blank on the picture.
            </div>
          </div>
          <button className="btn ghost small" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        <div style={{ padding: 18, display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 16 }}>
          <div className="labeling-diagram">
            {diagram.render(hotspotDots)}
            {diagram.hotspots.map((h) => (
              <div
                key={h.id + "-tag"}
                className="labeling-tag"
                style={{ left: `${h.x}%`, top: `${h.y}%` }}
                onClick={() => tapHotspot(h.id)}
              >
                {assignments[h.id] && (
                  <span
                    className={
                      "labeling-tag-chip" +
                      (checked ? (assignments[h.id] === h.answer ? " correct" : " wrong") : "")
                    }
                  >
                    {assignments[h.id]}
                  </span>
                )}
              </div>
            ))}
          </div>

          {!checked ? (
            <div>
              <div className="faint" style={{ fontSize: 11, marginBottom: 6, fontWeight: 650 }}>WORD BANK</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {bankWords.length === 0 && <div className="muted" style={{ fontSize: 12 }}>All words placed — tap "Check my labels".</div>}
                {bankWords.map((w) => (
                  <button
                    key={w}
                    className="category-pill"
                    style={selectedWord === w ? { background: "var(--brand)", borderColor: "var(--brand)", color: "#fff" } : undefined}
                    onClick={() => pickWord(w)}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="callout" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 750, color: correctCount === diagram.hotspots.length ? "var(--success, #2f9e5c)" : "var(--brand-dark)" }}>
                {correctCount} / {diagram.hotspots.length} correct
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                {correctCount === diagram.hotspots.length ? "Great job — every label is right!" : "Green blanks are correct, red ones need another try."}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {!checked ? (
              <Button onClick={check} disabled={!allFilled}>
                <CheckCircle2 size={14} /> Check my labels
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={reset}><RotateCcw size={14} /> Try again</Button>
                <Button onClick={onClose}>Done</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
