import React, { useEffect, useRef, useState } from "react";
import { Mountain, Menu, X, Sun, Moon, ArrowRight } from "lucide-react";
import { getTheme, setTheme, hasLocalProfile } from "../services/localProfile.js";
import "../landingPage.css";

/* ── Stars (generated once) ────────────────────────────────────────────────── */
const STARS = Array.from({ length: 45 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 50}%`,
  delay: `${(Math.random() * 5).toFixed(1)}s`,
  bright: Math.random() > 0.7,
}));

/* ── Scroll-reveal ─────────────────────────────────────────────────────────── */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("visible"); io.disconnect(); } },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, className = "" }) {
  const ref = useReveal();
  return <div ref={ref} className={`lp-reveal ${className}`}>{children}</div>;
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function LandingPage({ onStartLearning }) {
  const [theme, setThemeState] = useState(getTheme);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileExists = hasLocalProfile();

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    setTheme(next);
  }

  function scrollTo(id) {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const ctaLabel = profileExists ? "Continue Learning" : "Start Learning";

  return (
    <div className="lp" data-theme={theme}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">
          <span className="lp-nav-logo-mark"><Mountain size={14} strokeWidth={2.6} /></span>
          Himalayan Learning Grid
        </div>

        <div className="lp-nav-center">
          <button className="lp-nav-link" onClick={() => scrollTo("features")}>Features</button>
          <button className="lp-nav-link" onClick={() => scrollTo("how")}>How It Works</button>
        </div>

        <div className="lp-nav-right">
          <button className="lp-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="lp-nav-cta" onClick={onStartLearning}>
            {ctaLabel}
          </button>
        </div>

        <button className="lp-hamburger" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={`lp-mobile-menu ${mobileOpen ? "open" : ""}`}>
        <button className="lp-nav-link" onClick={() => scrollTo("features")}>Features</button>
        <button className="lp-nav-link" onClick={() => scrollTo("how")}>How It Works</button>
        <button className="lp-theme-btn" onClick={toggleTheme} style={{ alignSelf: "flex-start", marginLeft: 8 }}>
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className="lp-nav-cta" onClick={() => { setMobileOpen(false); onStartLearning(); }}>
          {ctaLabel}
        </button>
      </div>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-bg">
          <div className="lp-hero-glow" />
          <div className="lp-stars">
            {STARS.map(s => (
              <div
                key={s.id}
                className={`lp-star ${s.bright ? "bright" : ""}`}
                style={{ left: s.left, top: s.top, animationDelay: s.delay }}
              />
            ))}
          </div>

          {/* Mountain silhouettes */}
          <div className="lp-mountains">
            <svg viewBox="0 0 1440 400" preserveAspectRatio="none">
              <path d="M0,400 L0,280 Q180,140 360,220 Q480,120 600,200 Q720,70 840,175 Q960,55 1080,155 Q1200,95 1320,195 L1440,145 L1440,400Z" fill="var(--lp-mtn-far)" />
              <path d="M0,400 L0,310 Q200,195 400,278 Q560,155 720,258 Q840,135 960,228 Q1100,128 1260,238 L1440,188 L1440,400Z" fill="var(--lp-mtn-mid)" />
              <polygon points="720,258 693,292 747,288" fill="var(--lp-snow)" />
              <polygon points="960,228 937,258 983,254" fill="var(--lp-snow)" />
              <path d="M0,400 L0,340 Q240,268 480,328 Q660,238 840,308 Q1020,248 1200,318 L1440,278 L1440,400Z" fill="var(--lp-mtn-near)" />
              <path d="M0,400 L0,372 Q360,348 720,368 T1440,352 L1440,400Z" fill="var(--lp-mtn-forest)" />
            </svg>
          </div>
        </div>

        <div className="lp-hero-grid">
          {/* Left — copy */}
          <div className="lp-hero-copy">
            <div className="lp-hero-kicker">Himalayan Learning Grid</div>
            <h1 className="lp-hero-heading">
              Learning Beyond<br /><em>the Network.</em>
            </h1>
            <p className="lp-hero-sub">
              Education should continue even when the signal doesn't.
              Built for students in remote Himalayan communities.
            </p>
            <div className="lp-hero-actions">
              <button className="lp-btn-primary" onClick={onStartLearning}>
                {ctaLabel} <ArrowRight size={16} />
              </button>
              <button className="lp-btn-ghost" onClick={() => scrollTo("features")}>
                Explore the Platform
              </button>
            </div>
            {profileExists && (
              <div className="lp-hero-note">
                Welcome back — your profile is saved locally on this device.
              </div>
            )}
          </div>

          {/* Right — product visualization */}
          <div className="lp-hero-visual">
            <div className="lp-product-scene">
              <div className="lp-product-card">
                <div className="lp-product-topbar">
                  <div className="lp-product-topbar-left">
                    <Mountain size={14} strokeWidth={2.4} />
                    <span>Himalayan Learning Grid</span>
                  </div>
                  <div className="lp-product-offline-badge">
                    <span className="lp-product-offline-dot" />
                    Offline
                  </div>
                </div>

                <div className="lp-product-body">
                  <div className="lp-product-eyebrow">Current Lesson</div>

                  <div className="lp-product-lesson">
                    <div className="lp-product-lesson-header">
                      <span className="lp-product-lesson-icon">🌊</span>
                      <div className="lp-product-lesson-info">
                        <h4>Water Cycle</h4>
                        <span>Science · Grade 7 · 12 min</span>
                      </div>
                    </div>
                    <div className="lp-product-progress-track">
                      <div className="lp-product-progress-fill" style={{ width: "73%" }} />
                    </div>
                    <div className="lp-product-progress-label">
                      <span>Progress</span>
                      <span>73%</span>
                    </div>
                  </div>

                  <div className="lp-product-stats">
                    <div className="lp-product-stat">
                      <span className="lp-product-stat-icon">⚡</span>
                      <div>
                        <div className="lp-product-stat-value">240</div>
                        <div className="lp-product-stat-label">XP earned</div>
                      </div>
                    </div>
                    <div className="lp-product-stat">
                      <span className="lp-product-stat-icon">🔥</span>
                      <div>
                        <div className="lp-product-stat-value">5</div>
                        <div className="lp-product-stat-label">Day streak</div>
                      </div>
                    </div>
                  </div>

                  <div className="lp-product-next">
                    <span className="lp-product-next-label">Up next</span>
                    <span className="lp-product-next-title">Himalayan Geography 🏔️</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features strip ──────────────────────────────────────────────── */}
      <section id="features" className="lp-section">
        <Reveal>
          <div className="lp-features">
            <div className="lp-feature">
              <div className="lp-feature-icon">📡</div>
              <h3>Offline First</h3>
              <p>Keep learning without connectivity. Every lesson works on your device.</p>
            </div>
            <div className="lp-feature">
              <div className="lp-feature-icon">📚</div>
              <h3>Learn</h3>
              <p>Courses, lessons and stories built for local learning environments.</p>
            </div>
            <div className="lp-feature">
              <div className="lp-feature-icon">✏️</div>
              <h3>Practice</h3>
              <p>Quizzes, missions and progress tracking — all saved on device.</p>
            </div>
            <div className="lp-feature">
              <div className="lp-feature-icon">🔄</div>
              <h3>Sync</h3>
              <p>Progress syncs automatically whenever connectivity returns.</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section id="how" className="lp-section">
        <Reveal>
          <div className="lp-how-header">
            <div className="lp-how-kicker">How It Works</div>
            <h2 className="lp-how-heading">Three steps. No internet required.</h2>
          </div>

          <div className="lp-steps">
            <div className="lp-step">
              <div className="lp-step-num">01</div>
              <div className="lp-step-icon">📖</div>
              <h3>Learn Offline</h3>
              <p>Open any lesson or course. Everything runs from your device — no connection needed.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-num">02</div>
              <div className="lp-step-icon">✏️</div>
              <h3>Practice &amp; Progress</h3>
              <p>Take quizzes, complete missions, track your journey. All progress is saved locally.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-num">03</div>
              <div className="lp-step-icon">🔄</div>
              <h3>Sync When Connected</h3>
              <p>Reach a hub or get internet access — your progress syncs automatically. Nothing lost.</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="lp-cta-section">
        <Reveal>
          <div className="lp-cta-bg">
            <div className="lp-cta-glow" />
          </div>
          <h2 className="lp-cta-heading">
            Your learning doesn't stop<br /><em>when the network does.</em>
          </h2>
          <p className="lp-cta-sub">Start your learning journey today.</p>
          <button className="lp-btn-primary" onClick={onStartLearning}>
            {ctaLabel} <ArrowRight size={16} />
          </button>
        </Reveal>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        Himalayan Learning Grid · Offline-first education for remote communities
      </footer>
    </div>
  );
}
