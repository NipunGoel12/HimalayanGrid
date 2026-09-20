import React, { useEffect, useRef, useState } from "react";
import { Send, Compass, WifiOff } from "lucide-react";
import { api } from "../services/apiClient.js";
import { getSettings } from "../services/offlineStore.js";
import {
  Badge,
  AISourceBadge,
  PageHeader,
  Button,
} from "../components/ui.jsx";

const SUGGESTED = [
  "What is a fraction?",
  "Explain the water cycle in the Himalayas",
  "How do contour lines show a steep slope?",
  "Why do glaciers matter for village water?",
];

const MODES = [
  { id: "explain", label: "Explain Simply" },
  { id: "example", label: "Give Example" },
  { id: "quiz", label: "Quiz Me" },
];

function wrapMode(question, mode) {
  if (mode === "explain") {
    return `Explain simply, for a Grade 7 student: ${question}`;
  }

  if (mode === "example") {
    return `Give a concrete Himalayan village example for: ${question}`;
  }

  if (mode === "quiz") {
    return `Quiz me with one short question about: ${question}`;
  }

  return question;
}

export default function AskAGuide({ student, networkOn }) {
  const [messages, setMessages] = useState([
    {
      role: "guide",
      mode: "system",
      text: `Hi ${
        student?.name?.split(" ")[0] || "there"
      }. I'm Hima, your AI learning guide. Ask me about Fractions, Water Cycle, Contour Maps, Himalayan geography, environment, or basic satellite communication.`,
    },
  ]);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("explain");

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // Keep compatibility with the existing settings system.
  // There is currently no local AI model.
  useEffect(() => {
    getSettings().catch(() => {});
  }, []);

  // Hima uses NVIDIA Nemotron when internet is available.
  const useNemotron = networkOn;

  async function ask(raw) {
    if (!raw.trim() || busy) return;

    // No local LLM exists, so don't pretend AI works offline.
    if (!useNemotron) {
      setMessages((m) => [
        ...m,
        {
          role: "student",
          text: raw.trim(),
        },
        {
          role: "guide",
          mode: "offline",
          fallback: false,
          unanswered: false,
          text: "Hima needs an internet connection to answer questions. Reconnect to the network and try again.",
        },
      ]);

      setInput("");
      return;
    }

    const originalQuestion = raw.trim();
    const question = wrapMode(originalQuestion, mode);

    setMessages((m) => [
      ...m,
      {
        role: "student",
        text: originalQuestion,
      },
    ]);

    setInput("");
    setBusy(true);

    try {
      const res = await api.askTutor({
        studentId: student.id,
        question,
        online: true,
        missionDone: false,
      });

      // matchedTopic === null does NOT mean Nemotron failed.
      // Nemotron can answer questions outside the local knowledge pack.
      const unanswered = !!res.unanswered;

      setMessages((m) => [
        ...m,
        {
          role: "guide",
          mode: res.mode || "cloud",
          fallback: !!res.fallback,
          unanswered,
          topic: res.matchedTopic,
          text:
            res.text ||
            "Hima couldn't generate an answer right now. Please try again.",
        },
      ]);
    } catch (error) {
      console.error("Hima / NVIDIA Nemotron request failed:", error);

      setMessages((m) => [
        ...m,
        {
          role: "guide",
          mode: "offline",
          fallback: false,
          unanswered: false,
          text: "I couldn't reach Hima right now. Please check your internet connection and try again.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="view-max"
      style={{ maxWidth: 720 }}
    >
      <PageHeader
        title="Ask Hima"
        subtitle="Your AI learning guide for learning beyond the network."
        action={
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {useNemotron ? (
              <Badge tone="info">
                HIMA · ONLINE
              </Badge>
            ) : (
              <Badge tone="warning">
                <WifiOff
                  size={12}
                  style={{ marginRight: 4 }}
                />
                HIMA · OFFLINE
              </Badge>
            )}
          </div>
        }
      />

      <div
        className="section"
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`chip ${
              mode === m.id ? "active" : ""
            }`}
            onClick={() => setMode(m.id)}
            disabled={busy}
          >
            {m.label}
          </button>
        ))}
      </div>

      {!useNemotron && (
        <div
          className="panel"
          style={{
            padding: 14,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <WifiOff
            size={18}
            style={{ flexShrink: 0 }}
          />

          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Hima is unavailable offline
            </div>

            <div
              className="faint"
              style={{
                fontSize: 12,
                marginTop: 2,
              }}
            >
              Reconnect to the internet to use Hima.
            </div>
          </div>
        </div>
      )}

      <div
        className="panel"
        style={{
          display: "flex",
          flexDirection: "column",
          height: 480,
        }}
      >
        <div
          className="scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 16,
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 14,
                flexDirection:
                  m.role === "student"
                    ? "row-reverse"
                    : "row",
              }}
            >
              {m.role === "guide" && (
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    background: "var(--brand-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Compass
                    size={14}
                    color="var(--brand)"
                  />
                </div>
              )}

              <div className="ai-bubble">
                <div
                  style={{
                    padding: "9px 13px",
                    borderRadius: 12,
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                    background:
                      m.role === "student"
                        ? "linear-gradient(180deg,#6cc5ff,#4da3ff)"
                        : "rgba(16,36,58,.9)",
                    color:
                      m.role === "student"
                        ? "#07111f"
                        : "var(--text)",
                    border:
                      m.role === "student"
                        ? "none"
                        : "1px solid var(--border)",
                  }}
                >
                  {m.text}
                </div>

                {m.role === "guide" &&
                  m.mode !== "system" && (
                    <div
                      className="ai-source"
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      {m.mode === "cloud" ? (
                        <AISourceBadge
                          mode="cloud"
                          fallback={m.fallback}
                          unanswered={m.unanswered}
                        />
                      ) : (
                        <Badge
                          tone={
                            m.mode === "offline"
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {m.mode === "offline"
                            ? "HIMA OFFLINE"
                            : "HIMA"}
                        </Badge>
                      )}

                      {m.mode === "cloud" &&
                        !m.unanswered && (
                          <span
                            className="faint"
                            style={{ fontSize: 11 }}
                          >
                            Hima · Powered by NVIDIA
                            Nemotron
                          </span>
                        )}

                      {m.topic && (
                        <Badge tone="brand">
                          {m.topic}
                        </Badge>
                      )}
                    </div>
                  )}
              </div>
            </div>
          ))}

          {busy && (
            <div
              className="faint"
              style={{ fontSize: 12 }}
            >
              Hima is thinking...
            </div>
          )}

          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div
            style={{
              padding: "0 16px 10px",
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {SUGGESTED.map((s) => (
              <button
                key={s}
                className="chip"
                onClick={() => ask(s)}
                disabled={busy || !useNemotron}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
            padding: 12,
            borderTop: "1px solid var(--border)",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                ask(input);
              }
            }}
            placeholder={
              useNemotron
                ? "Ask Hima..."
                : "Reconnect to use Hima..."
            }
            style={{ flex: 1 }}
            aria-label="Question"
            disabled={busy || !useNemotron}
          />

          <Button
            onClick={() => ask(input)}
            disabled={
              busy ||
              !input.trim() ||
              !useNemotron
            }
          >
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}