import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { api } from "../services/apiClient.js";
import { getQueuedEvents } from "../services/offlineStore.js";
import { XpPill, StreakPill, Button, SkeletonLines, TopicCard, ProgressRing, StatRow, MountainHero, ConnectivityStatus, TiltCard, SpatialEduObject } from "../components/ui.jsx";
import { JOURNEY_STEPS } from "../constants.js";

export default function Home({ student, gamification, setView, openTopic, connState }) {
  const [topics, setTopics] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [queued, setQueued] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setTopics(await api.getTopics(null, student.id)); } catch { setTopics([]); }
      try { setLessons(await api.getLessons()); } catch { setLessons([]); }
      setQueued((await getQueuedEvents()).length);
      setLoading(false);
    })();
  }, [student.id]);

  const categoryDone = (cat) => topics.some((t) => t.category === cat && t.quizCompleted);
  const currentStepIndex = JOURNEY_STEPS.findIndex((s) => !categoryDone(s.id));
  const activeStep = JOURNEY_STEPS[currentStepIndex === -1 ? JOURNEY_STEPS.length - 1 : currentStepIndex];
  const cachedLessons = lessons.filter((l) => l.cached);
  const continueLesson = cachedLessons.find((l) => student.weak_topics?.includes(l.weak_topic)) || cachedLessons[0];

  const adventureTopic =
    topics.find((t) => t.category === activeStep?.id && !t.explored) ||
    topics.find((t) => !t.explored) ||
    topics[0];

  const exploredCategories = new Set(topics.filter((t) => t.explored).map((t) => t.category));
  const recommended = topics.filter((t) => !t.quizCompleted && exploredCategories.has(t.category)).slice(0, 3);
  const fallbackRecommended = recommended.length ? recommended : topics.filter((t) => !t.explored).slice(0, 3);
  const currentMission = activeStep?.label || "Water Explorer";

  // Elevation steps for the mountain expedition trail
  const ELEVATIONS = ["2,400m", "3,800m", "4,900m", "6,100m", "8,848m"];

  return (
    <div className="view-max">
      {/* PRIMARY WOW MOMENT: Himalayan Environmental Hero */}
      <MountainHero>
        <div className="hero-kicker">HIMALAYAN LEARNING GRID</div>
        <h1 className="hero-heading">Learning Beyond the Network</h1>
        <p className="hero-subtitle">
          Learn, practice and explore — even when the internet disappears.
        </p>

        <div className="hero-greeting">
          Namaste, {student.name.split(" ")[0]} <span className="hero-avatar">{student.avatar || "🎓"}</span>
        </div>

        <div className="hero-hud-row">
          <ConnectivityStatus state={connState} mode="expanded" pending={queued} />
          {gamification && <XpPill xp={gamification.xp} />}
          {gamification && <StreakPill streak={gamification.streak} />}
        </div>

        <div className="hero-actions">
          <Button
            className="hero-btn-primary"
            onClick={() => continueLesson ? setView("learning") : setView("explore")}
          >
            Continue Learning
          </Button>
          <Button
            variant="secondary"
            className="hero-btn-secondary"
            onClick={() => setView("guide")}
          >
            Ask a Guide
          </Button>
        </div>
      </MountainHero>

      {/* SECONDARY WOW MOMENT: Continue Learning with 3D Spatial Edu Object */}
      <div className="section continue-learning-feature">
        <div className="continue-learning-copy">
          <div className="eyebrow">YOUR PRIMARY ACTION</div>
          <div className="page-title" style={{ marginTop: 6, fontSize: 24 }}>Continue Learning</div>
          <div className="continue-lesson-title">
            {continueLesson?.title || adventureTopic?.title || "Understanding Fractions"}
          </div>
          <div className="continue-lesson-meta">
            {continueLesson ? `${continueLesson.subject} · 4 min remaining` : "Mathematics · 4 min remaining"}
          </div>

          <div className="continue-progress-block">
            <div className="continue-progress-label">
              <span>Lesson Progress</span>
              <span>{continueLesson ? "42% completed" : "Ready to start"}</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: continueLesson ? "42%" : "15%" }}
              />
            </div>
          </div>

          <div className="continue-actions">
            <Button
              className="resume-lesson-btn"
              onClick={() => continueLesson ? setView("learning") : openTopic(adventureTopic?.id)}
            >
              Resume lesson
            </Button>
            <span className="offline-status-pill">
              <span className="pill-dot" /> Available offline
            </span>
          </div>
        </div>

        {/* Right side: 3D Spatial Educational Object */}
        <div className="continue-learning-spatial-wrap">
          <SpatialEduObject
            title={continueLesson?.title || "Understanding Fractions"}
            subtitle={continueLesson?.subject || "Mathematics"}
          />
        </div>
      </div>

      {/* MAJOR WOW MOMENT: Learning Journey (Spatial Himalayan Expedition) */}
      <div className="section expedition-section">
        <div className="section-head">
          <div>
            <div className="eyebrow">EXPEDITION TRAIL</div>
            <div className="section-title" style={{ fontSize: 18 }}>My Learning Journey</div>
          </div>
          <div className="expedition-altitude-indicator">
            Base Camp → Summit Pass
          </div>
        </div>

        <div className="journey-shell panel-pad">
          {/* Topographic Alpine Ridge Contour Background */}
          <div className="journey-contour-bg" aria-hidden="true">
            <svg viewBox="0 0 1000 140" preserveAspectRatio="none" className="journey-contour-svg">
              <path d="M0,140 Q250,50 500,90 T1000,30 L1000,140 Z" fill="rgba(14, 165, 233, 0.05)" />
              <path d="M0,140 Q300,80 600,60 T1000,50 L1000,140 Z" fill="rgba(20, 184, 166, 0.04)" />
            </svg>
          </div>

          <svg className="journey-trail" viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="journeyTrailGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.8" />
                <stop offset="35%" stopColor="#0EA5E9" stopOpacity="0.9" />
                <stop offset="70%" stopColor="#67E8F9" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <path
              d="M36 78 C160 20 240 108 360 56 S560 14 680 64 S840 110 964 42"
              fill="none"
              stroke="url(#journeyTrailGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="8 6"
              className="journey-svg-path"
            />
          </svg>

          <div className="journey-path">
            {JOURNEY_STEPS.map((s, i) => {
              const done = categoryDone(s.id);
              const isCurrent = i === currentStepIndex;
              const alt = ELEVATIONS[i % ELEVATIONS.length];

              return (
                <div className="journey-step" key={s.id}>
                  {i > 0 && (
                    <div className={`journey-connector ${categoryDone(JOURNEY_STEPS[i - 1].id) ? "done" : ""}`} />
                  )}
                  <div className="journey-node-wrapper">
                    {isCurrent && <div className="journey-node-pulse" />}
                    <button
                      className={`journey-node ${done ? "done" : isCurrent ? "current" : "locked"}`}
                      onClick={() => setView("explore")}
                      aria-label={`${s.label} (${done ? "Completed" : isCurrent ? "In progress" : "Upcoming"})`}
                    >
                      <span className="journey-node-icon">{s.icon}</span>
                      {done && <span className="journey-check-badge">✓</span>}
                    </button>
                  </div>
                  <div className="journey-label">{s.label}</div>
                  <div className="journey-altitude-tag">{alt}</div>
                  <div className={`journey-sub ${isCurrent ? "active-text" : ""}`}>
                    {done ? "Mastered" : isCurrent ? "Current Ascent" : "Up Next"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TODAY'S ADVENTURE: Expedition Invitation with Layered Himalayan 3D Tilt */}
      {loading ? (
        <div className="panel panel-pad section"><SkeletonLines count={3} /></div>
      ) : adventureTopic && (
        <div className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">FEATURED EXPEDITION</div>
              <div className="section-title" style={{ fontSize: 18 }}>Today's Adventure</div>
            </div>
            <div className="faint" style={{ fontSize: 12 }}>+60 XP Reward</div>
          </div>

          <TiltCard className="adventure-tilt" max={3}>
            <div className="panel panel-pad adventure-card">
              <div className="adventure-landscape-spatial" aria-hidden="true">
                <div className="adv-sky" />
                <div className="adv-sun" />
                <div className="adv-cloud" />

                {/* Layered mountain peaks SVG with altitude marker */}
                <svg viewBox="0 0 360 200" preserveAspectRatio="none" className="adv-mountain-svg">
                  <defs>
                    <linearGradient id="advPeakGradFar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                    <linearGradient id="advPeakGradMid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                    <linearGradient id="advPeakGradFore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0f766e" />
                      <stop offset="100%" stopColor="#064e3b" />
                    </linearGradient>
                  </defs>
                  {/* Far snow crests */}
                  <path d="M0 200 L70 80 L115 125 L180 46 L245 130 L295 75 L360 135 L360 200Z" fill="url(#advPeakGradFar)" />
                  <polygon points="180,46 155,95 210,90" fill="#ffffff" opacity="0.9" />
                  <polygon points="295,75 275,115 320,110" fill="#ffffff" opacity="0.8" />
                  {/* Mid rock ridges */}
                  <path d="M0 200 L85 115 L140 155 L210 95 L260 148 L310 108 L360 145 L360 200Z" fill="url(#advPeakGradMid)" />
                  {/* Fore pine contour */}
                  <path d="M0 200 L0 170 Q90 148 180 172 T360 162 L360 200Z" fill="url(#advPeakGradFore)" />
                </svg>

                <div className="adv-altitude-chip">
                  <span>▲ 8,848m Summit</span>
                </div>
                <div className="adv-topic-symbol">{adventureTopic.icon}</div>
              </div>

              <div className="adventure-content">
                <div className="adv-badge-row">
                  <span className="adv-cat-tag">{adventureTopic.subject || "Himalayan Science"}</span>
                  <span className="adv-time-tag">⏱ ~5 min trail</span>
                </div>
                <div className="adv-title">{adventureTopic.title}</div>
                <div className="adv-meta">
                  {adventureTopic.region} · Learn concepts, complete mini-quiz & gain expedition XP
                </div>
                <div className="adv-action-row">
                  <Button
                    className="adv-start-btn"
                    onClick={() => openTopic(adventureTopic.id)}
                  >
                    Start Adventure
                  </Button>
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      )}

      {/* OFFLINE LEARNING ARCHITECTURE BAND */}
      <div className="section offline-learning-band">
        <div className="offline-band-content">
          <div className="eyebrow" style={{ color: "var(--amber-400)" }}>OFFLINE RESILIENCE</div>
          <div className="offline-band-heading">
            No signal doesn't mean no learning.
          </div>
          <div className="offline-band-desc">
            The Himalayan Learning Grid architecture ensures your lessons, practice quizzes, and expedition progress are always cached on your local device and sync automatically when a hub is reached.
          </div>

          <div className="offline-arch-flow" aria-hidden="true">
            <div className="arch-node">
              <span className="arch-icon">📱</span>
              <span className="arch-label">Student Device</span>
            </div>
            <div className="arch-arrow">──►</div>
            <div className="arch-node">
              <span className="arch-icon">🏫</span>
              <span className="arch-label">Local Hub</span>
            </div>
            <div className="arch-arrow">──►</div>
            <div className="arch-node">
              <span className="arch-icon">💾</span>
              <span className="arch-label">Saved Learning</span>
            </div>
          </div>
        </div>

        <div className="offline-learning-items">
          <div className="stat-pill">
            <strong>{cachedLessons.length}</strong>
            <span>lessons cached</span>
          </div>
          <div className="stat-pill">
            <strong>{queued}</strong>
            <span>events queued</span>
          </div>
          <div className="stat-pill highlight">
            <strong style={{ color: "var(--success)" }}>✓</strong>
            <span>progress protected</span>
          </div>
        </div>
      </div>

      {/* EXPEDITION STATS SUMMARY */}
      <div className="section home-progress-summary">
        <StatRow
          items={[
            { icon: "🏔️", label: "Exploration", value: `${gamification?.explorationPct ?? 0}%`, sub: "Himalayan world mapped", color: "var(--glacier-400)" },
            { icon: "⇩", label: "Lessons cached", value: cachedLessons.length, sub: "Available offline", color: "var(--teal-500)" },
            { icon: "⌁", label: "Current mission", value: currentMission, sub: activeStep ? "In progress" : "Complete", color: "var(--amber-400)" },
            { icon: queued ? "•••" : "✓", label: "Queued events", value: queued, sub: queued ? "Will sync via Hub" : "Fully synced", color: queued ? "var(--orange-500)" : "var(--success)" },
          ]}
        />
      </div>

      {/* HIMALAYAN MAP ENTRY */}
      <div className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">INTERACTIVE CARTOGRAPHY</div>
            <div className="section-title" style={{ fontSize: 18 }}>Himalayan Map</div>
          </div>
          <button className="btn link" onClick={() => setView("map")}>
            Open map <ArrowRight size={14} />
          </button>
        </div>
        <div className="panel panel-pad map-preview-banner" onClick={() => setView("map")} style={{ cursor: "pointer" }}>
          <div className="map-banner-decor" aria-hidden="true">🗺️ ⛰️ ❄️ 📍</div>
          <div>
            <div style={{ fontWeight: 650, fontSize: 15 }}>Explore Ladakh, Sikkim, Uttarakhand & Everest</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              Interactive offline cartography with topography, river basins, high passes, and regional science.
            </div>
          </div>
          <Button small variant="secondary" onClick={(e) => { e.stopPropagation(); setView("map"); }}>
            Launch Map
          </Button>
        </div>
      </div>

      {/* RECOMMENDED DISCOVERIES */}
      {fallbackRecommended.length > 0 && (
        <div className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">RECOMMENDED EXPEDITIONS</div>
              <div className="section-title" style={{ fontSize: 18 }}>Recommended for you</div>
            </div>
          </div>
          <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {fallbackRecommended.map((t) => (
              <TopicCard key={t.id} topic={t} onClick={() => openTopic(t.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
