import React, { useEffect, useMemo, useRef, useState } from "react";
import { Inbox } from "lucide-react";
import { CONN_COPY } from "../constants.js";

export function Button({ children, onClick, variant = "primary", disabled, small, type = "button", style, loading, className = "" }) {
  return (
    <button
      type={type}
      className={`btn ${variant} ${small ? "small" : ""} ${loading ? "loading" : ""} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      style={style}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = "neutral", dot, style }) {
  return (
    <span className={`badge ${tone}`} style={style}>
      {dot && <span className="status-dot" style={{ background: "currentColor" }} />}
      {children}
    </span>
  );
}

export const Tag = Badge;

export function ConnectionBadge({ state }) {
  const cfg = CONN_COPY[state] || { tone: "neutral", label: state };
  return <Badge tone={cfg.tone} dot>{cfg.label}</Badge>;
}

export function ConnectivityStatus({ state, mode = "compact", pending = 0, lastSync, onRetry }) {
  const cfg = CONN_COPY[state] || { tone: "neutral", label: state, detail: "" };
  let detail = cfg.detail;
  if (state === "SYNCING" && pending) detail = `Uploading ${pending} items…`;
  if (state === "SYNCED" && lastSync) {
    const mins = Math.max(0, Math.round((Date.now() - lastSync) / 60000));
    detail = mins <= 0 ? "Just now" : `Last sync ${mins} min ago`;
  }
  const color = {
    success: "var(--success)",
    info: "var(--info)",
    danger: "var(--danger)",
    warning: "var(--warning)",
    neutral: "var(--text-faint)",
  }[cfg.tone] || "var(--text-faint)";
  const pulsing = state === "SYNCING" || state === "LOCAL_HUB";
  return (
    <button
      type="button"
      className={`conn-card ${mode}`}
      onClick={state === "SYNC_ERROR" ? onRetry : undefined}
      aria-label={`${cfg.label}. ${detail}`}
      style={{ cursor: state === "SYNC_ERROR" ? "pointer" : "default" }}
    >
      <span className={`status-dot ${pulsing ? "pulse" : ""}`} style={{ background: color, color }} />
      <span className="conn-copy">
        <span className="conn-label">{cfg.label}</span>
        {mode !== "compact" && <span className="conn-detail">{detail}</span>}
      </span>
    </button>
  );
}

export function ProgressBar({ value, max = 100, tone = "brand" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const cls = tone === "warning" ? "warn" : tone === "danger" ? "danger" : "";
  return (
    <div className="progress-track" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`progress-fill ${cls}`} style={{ width: pct + "%" }} />
    </div>
  );
}

export function ProgressRing({ value = 0, size = 88, stroke = 8, label }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = circ - (pct / 100) * circ;
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg className="progress-ring" width={size} height={size} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(245,250,255,.1)" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            stroke="url(#ringGrad)" strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={dash}
            style={{ transition: "stroke-dashoffset .6s ease" }}
          />
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4DA3FF" />
              <stop offset="100%" stopColor="#45D483" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(0deg)", fontSize: 14, fontWeight: 750 }}>
          {Math.round(pct)}%
        </div>
      </div>
      {label && <div className="faint" style={{ fontSize: 11 }}>{label}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action, eyebrow }) {
  return (
    <div className="section" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div>}
        <div className="page-title">{title}</div>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, body, icon: Icon = Inbox, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={30} strokeWidth={1.5} /></div>
      <div className="empty-title">{title}</div>
      {body && <div className="empty-body">{body}</div>}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}
export const Empty = EmptyState;

export function SectionHead({ title, action, eyebrow }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 3 }}>{eyebrow}</div>}
        <div className="section-title">{title}</div>
      </div>
      {action}
    </div>
  );
}

export function StatRow({ items }) {
  return (
    <div className="stat-row stagger">
      {items.map((it, i) => (
        <div key={i} className="stat-cell">
          {it.icon && <div className="stat-icon" aria-hidden="true">{it.icon}</div>}
          <div className="stat-label">{it.label}</div>
          <div className="stat-value" style={it.color ? { color: it.color } : undefined}>{it.value}</div>
          {it.sub && <div className="stat-sub">{it.sub}</div>}
        </div>
      ))}
    </div>
  );
}

export function StatCard({ label, value, sub }) {
  return (
    <div className="stat-cell">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export function Skeleton({ w = "100%", h = 14, style }) {
  return <div className="skeleton" style={{ width: w, height: h, ...style }} />;
}

export function SkeletonLines({ count = 3 }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} w={i === count - 1 ? "60%" : "100%"} />
      ))}
    </div>
  );
}

export function LoadingSkeleton({ rows = 4 }) {
  return <div className="panel panel-pad"><SkeletonLines count={rows} /></div>;
}

export function PriorityBadge({ label }) {
  const tone = { HIGH: "danger", MEDIUM: "warning", LOW: "info", SKIPPED: "neutral" }[label] || "neutral";
  return <Badge tone={tone}>{label}</Badge>;
}

export function SyncStatusBadge({ status }) {
  const cfg = {
    queued: { tone: "neutral", label: "Queued" },
    QUEUED: { tone: "neutral", label: "Queued" },
    syncing: { tone: "info", label: "Syncing" },
    DOWNLOADING: { tone: "info", label: "Downloading" },
    AVAILABLE: { tone: "info", label: "Available" },
    synced: { tone: "success", label: "Synced" },
    DOWNLOADED: { tone: "success", label: "Downloaded" },
    failed: { tone: "danger", label: "Failed" },
    FAILED: { tone: "danger", label: "Failed" },
    skipped: { tone: "neutral", label: "Skipped" },
  }[status] || { tone: "neutral", label: status };
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

export function OfflineBadge({ available }) {
  return available
    ? <Badge tone="success">Available Offline</Badge>
    : <Badge tone="neutral">Needs download</Badge>;
}

export function AISourceBadge({ mode, fallback, unanswered }) {
  if (unanswered) return <Badge tone="warning">Unsupported question</Badge>;
  if (mode === "cloud") return <Badge tone="info">{fallback ? "Cloud AI fallback" : "CLOUD AI"}</Badge>;
  return <Badge tone="success">LOCAL AI</Badge>;
}

export function TopoWatermark() {
  return (
    <svg
      width="220" height="120" viewBox="0 0 220 120"
      style={{ position: "absolute", top: 0, right: 0, opacity: 0.35, pointerEvents: "none" }}
      aria-hidden="true"
    >
      <path d="M0,90 L40,40 L70,68 L110,20 L150,60 L220,30" stroke="rgba(108,197,255,.45)" strokeWidth="2" fill="none" />
      <path d="M0,100 L40,55 L70,80 L110,38 L150,74 L220,46" stroke="rgba(245,250,255,.2)" strokeWidth="2" fill="none" />
    </svg>
  );
}

export function XpPill({ xp }) {
  return <span className="xp-pill">⭐ {xp} XP</span>;
}
export function StreakPill({ streak }) {
  return <span className="streak-pill">🔥 {streak}-day streak</span>;
}

export function CategoryPill({ active, color, icon, label, onClick }) {
  return (
    <button
      className={`category-pill ${active ? "active" : ""}`}
      style={active ? { background: color, borderColor: color } : undefined}
      onClick={onClick}
    >
      <span>{icon}</span>{label}
    </button>
  );
}

export function TopicCard({ topic, onClick, extra }) {
  return (
    <button className="topic-card" onClick={onClick}>
      <div className="topic-card-art" style={{ background: (topic.color || "#4DA3FF") + "22" }}>{topic.icon}</div>
      <div className="topic-card-body">
        <div className="topic-card-title">{topic.title}</div>
        <div className="topic-card-meta">{topic.region} · {topic.subject}</div>
        {extra}
        <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {topic.quizCompleted ? <Badge tone="success">Quiz done</Badge> : topic.explored ? <Badge tone="info">Explored</Badge> : <Badge tone="neutral">New</Badge>}
          {topic.saved && <Badge tone="warning">Saved</Badge>}
          {topic.cached !== false && <Badge tone="success">Offline</Badge>}
        </div>
      </div>
    </button>
  );
}

export function CourseCard({ lesson, onContinue, onDownload }) {
  return (
    <div className="panel course-card lift">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div className="eyebrow">{lesson.subject}</div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>{lesson.title}</div>
        </div>
        <OfflineBadge available={!!lesson.cached} />
      </div>
      <div className="muted" style={{ fontSize: 12.5 }}>
        Grade {lesson.grade} · {lesson.language} · {lesson.size_mb} MB
        {lesson.sections ? ` · ${lesson.sections.length} sections` : ""}
      </div>
      {lesson.weak_topic && <Badge tone="warning">Weak topic: {lesson.weak_topic}</Badge>}
      <div>
        {lesson.cached ? (
          <Button small onClick={() => onContinue?.(lesson)}>Continue</Button>
        ) : (
          <Button small variant="secondary" onClick={() => onDownload?.(lesson)}>Download via Sync</Button>
        )}
      </div>
    </div>
  );
}

export function LessonCard({ lesson, onOpen }) {
  return <CourseCard lesson={lesson} onContinue={onOpen} />;
}

export function MissionCard({ mission, onOpenTopic }) {
  return (
    <div className="mission-card lift">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 26 }}>{mission.icon}</div>
        <div>
          <div style={{ fontWeight: 650, fontSize: 14.5 }}>{mission.title}</div>
          <div className="muted" style={{ fontSize: 12 }}>{mission.description}</div>
        </div>
        {mission.complete && <Badge tone="success" style={{ marginLeft: "auto" }}>Complete</Badge>}
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
          <span className="muted">{mission.progress} / {mission.target_count}</span>
          <span className="muted">+{mission.xp_reward} XP</span>
        </div>
        <ProgressBar value={mission.progress} max={mission.target_count} tone={mission.complete ? "brand" : "warning"} />
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(mission.topics || []).map((t) => (
          <button key={t.id} className="chip" onClick={() => onOpenTopic?.(t.id)}>{t.icon} {t.title}</button>
        ))}
      </div>
    </div>
  );
}

export function QuizOption({ label, selected, result, onSelect, name }) {
  const cls = result === "correct" ? "quiz-opt correct" : result === "wrong" ? "quiz-opt wrong" : "quiz-opt";
  return (
    <label
      className={cls}
      style={{
        display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, padding: "10px 12px",
        borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)",
        background: selected && !result ? "var(--brand-light)" : "rgba(7,17,31,.45)", cursor: "pointer",
      }}
    >
      <input type="radio" name={name} checked={!!selected} onChange={onSelect} />
      {label}
    </label>
  );
}

export function DownloadCard({ item, onRetry, onOpen }) {
  return (
    <div className="panel-row">
      <div>
        <div style={{ fontWeight: 650 }}>{item.name}</div>
        <div className="faint" style={{ fontSize: 11.5 }}>{item.size} · Priority {item.priority || "—"}</div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <SyncStatusBadge status={item.status} />
        {item.status === "FAILED" || item.status === "failed" ? (
          <Button small variant="danger" onClick={onRetry}>Retry</Button>
        ) : onOpen ? (
          <Button small variant="ghost" onClick={onOpen}>Open</Button>
        ) : null}
      </div>
    </div>
  );
}

export function SyncTimeline({ active = "OFFLINE" }) {
  const steps = ["OFFLINE", "QUEUED", "SATELLITE WINDOW", "UPLOADING", "PRIORITY DOWNLOAD", "SYNCED"];
  const idx = Math.max(0, steps.indexOf(active));
  return (
    <div className="sync-pipeline" role="list">
      {steps.map((s, i) => (
        <div key={s} className={`sync-step ${i < idx ? "done" : i === idx ? "active" : ""}`} role="listitem">{s}</div>
      ))}
    </div>
  );
}

export function BadgeChip({ icon, name, locked }) {
  return (
    <div className="badge-chip">
      <div className={`badge-chip-icon ${locked ? "locked" : ""}`}>{icon}</div>
      <div className="badge-chip-label">{name}</div>
    </div>
  );
}

export function AvatarPicker({ options, value, onChange }) {
  return (
    <div className="avatar-grid">
      {options.map((a) => (
        <button key={a} type="button" className={`avatar-option ${value === a ? "selected" : ""}`} onClick={() => onChange(a)}>
          {a}
        </button>
      ))}
    </div>
  );
}

export function MountainHero({ children }) {
  const heroRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function handlePointerMove(event) {
    if (!heroRef.current || event.pointerType !== "mouse") return;
    if (typeof window !== "undefined") {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (window.matchMedia("(pointer: coarse)").matches) return;
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const clientX = event.clientX;
    const clientY = event.clientY;

    rafRef.current = requestAnimationFrame(() => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const nx = (clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const ny = (clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

      // Gentle tilts and differential translation shifts
      heroRef.current.style.setProperty("--hero-tilt-x", `${(-ny * 3.5).toFixed(2)}deg`);
      heroRef.current.style.setProperty("--hero-tilt-y", `${(nx * 4.5).toFixed(2)}deg`);
      heroRef.current.style.setProperty("--hero-shift-x", `${(nx * 24).toFixed(1)}px`);
      heroRef.current.style.setProperty("--hero-shift-y", `${(ny * 16).toFixed(1)}px`);
    });
  }

  function resetPointer() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (!heroRef.current) return;
    heroRef.current.style.removeProperty("--hero-tilt-x");
    heroRef.current.style.removeProperty("--hero-tilt-y");
    heroRef.current.style.removeProperty("--hero-shift-x");
    heroRef.current.style.removeProperty("--hero-shift-y");
  }

  return (
    <section
      ref={heroRef}
      className="hlg-hero"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      aria-label="Himalayan Learning Grid Hero"
    >
      {/* 1. Deep Sky & Cosmic Alpine Stars */}
      <div className="hero-sky-gradient" aria-hidden="true" />
      <div className="hero-stars" aria-hidden="true" />

      {/* 2. Sunrise Atmospheric Glow & Corona */}
      <div className="sun-glow" aria-hidden="true">
        <div className="sun-core" />
        <div className="sun-corona" />
        <div className="sun-beam" />
      </div>

      {/* 3. Layered Drifting Alpine Clouds */}
      <div className="cloud c1" aria-hidden="true" />
      <div className="cloud c2" aria-hidden="true" />
      <div className="cloud c3" aria-hidden="true" />

      {/* 4. Distant High Peaks (Layer 1 - Subtle Parallax) */}
      <svg
        className="mountain-svg mountain-far"
        viewBox="0 0 1200 220"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="farPeakGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2e5478" />
            <stop offset="60%" stopColor="#1a3956" />
            <stop offset="100%" stopColor="#10273f" />
          </linearGradient>
          <linearGradient id="snowHighlight" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#c5e6fc" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#7cb9e8" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path
          d="M0 220 L0 140 L90 85 L180 135 L290 55 L380 115 L500 35 L620 125 L730 45 L850 120 L960 65 L1070 125 L1200 80 L1200 220 Z"
          fill="url(#farPeakGrad)"
        />
        {/* Snow caps on distant peaks */}
        <polygon points="500,35 465,85 538,80" fill="url(#snowHighlight)" />
        <polygon points="290,55 260,100 320,95" fill="url(#snowHighlight)" />
        <polygon points="730,45 700,90 760,86" fill="url(#snowHighlight)" />
        <polygon points="960,65 930,105 990,100" fill="url(#snowHighlight)" />
      </svg>

      {/* 5. Mid-Range Alpine Ridges (Layer 2 - Moderate Parallax) */}
      <svg
        className="mountain-svg mountain-mid"
        viewBox="0 0 1200 220"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="midPeakGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1b3e61" />
            <stop offset="60%" stopColor="#112942" />
            <stop offset="100%" stopColor="#0a1a2d" />
          </linearGradient>
          <linearGradient id="midSnowGlaze" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <path
          d="M0 220 L0 160 L120 115 L230 155 L350 90 L460 145 L580 75 L690 140 L810 85 L930 150 L1050 95 L1200 150 L1200 220 Z"
          fill="url(#midPeakGrad)"
        />
        {/* Ridge snow facets */}
        <polygon points="350,90 310,140 380,135" fill="url(#midSnowGlaze)" />
        <polygon points="580,75 535,130 625,120" fill="url(#midSnowGlaze)" />
        <polygon points="810,85 770,135 850,130" fill="url(#midSnowGlaze)" />
      </svg>

      {/* 6. Atmospheric Valley Mist */}
      <div className="hero-mist" aria-hidden="true" />

      {/* 7. Foreground Alpine Ridge & Silhouette (Layer 3 - Strong Parallax) */}
      <svg
        className="mountain-svg mountain-front"
        viewBox="0 0 1200 220"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="frontPeakGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b1b2d" />
            <stop offset="50%" stopColor="#071220" />
            <stop offset="100%" stopColor="#040912" />
          </linearGradient>
        </defs>
        <path
          d="M0 220 L0 180 L80 155 L160 185 L260 135 L380 185 L510 125 L640 180 L760 130 L880 178 L1010 135 L1120 180 L1200 155 L1200 220 Z"
          fill="url(#frontPeakGrad)"
        />
        {/* Soft edge highlight on foreground ridge */}
        <path
          d="M0 180 L80 155 L160 185 L260 135 L380 185 L510 125 L640 180 L760 130 L880 178 L1010 135 L1120 180 L1200 155"
          fill="none"
          stroke="rgba(56, 189, 248, 0.28)"
          strokeWidth="1.5"
        />
      </svg>

      {/* 8. Floating Spatial Exploration Objects (3-5 Meaningful Items) */}
      {/* Object A: Himalayan Astrolabe / Compass */}
      <div className="hero-floating-item hero-compass" aria-hidden="true">
        <div className="compass-dial">
          <div className="compass-rim" />
          <div className="compass-needle" />
          <span className="compass-point n">N</span>
          <span className="compass-point s">S</span>
        </div>
      </div>

      {/* Object B: Spatial 3D Learning Prismatic Gem */}
      <div className="hero-floating-item hero-prism" aria-hidden="true">
        <div className="prism-geometry">
          <span className="prism-facet f1" />
          <span className="prism-facet f2" />
          <span className="prism-facet f3" />
          <span className="prism-glow" />
        </div>
      </div>

      {/* Object C: Mini Orbital Satellite */}
      <div className="hero-floating-item hero-satellite" aria-hidden="true">
        <div className="satellite-body">
          <div className="solar-wing left" />
          <div className="sat-core">🛰️</div>
          <div className="solar-wing right" />
          <div className="sat-beacon" />
        </div>
      </div>

      {/* Object D: Himalayan Altitude Beacon Marker */}
      <div className="hero-floating-item hero-altitude-marker" aria-hidden="true">
        <div className="alt-badge">
          <span className="alt-icon">▲</span>
          <div className="alt-meta">
            <span className="alt-elevation">8,848m</span>
            <span className="alt-label">Himalayan Peak</span>
          </div>
        </div>
      </div>

      {/* 9. Telemetry Signals */}
      <span className="signal-dot s1" aria-hidden="true" />
      <span className="signal-dot s2" aria-hidden="true" />
      <span className="signal-dot s3" aria-hidden="true" />

      {/* 10. Foreground Interface Content */}
      <div className="hlg-hero-copy">{children}</div>
    </section>
  );
}

export function TiltCard({ children, className = "", max = 3.5 }) {
  const ref = useRef(null);

  function move(event) {
    if (!ref.current || event.pointerType !== "mouse") return;
    if (typeof window !== "undefined") {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (window.matchMedia("(pointer: coarse)").matches) return;
    }

    const rect = ref.current.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;

    const rotateY = nx * max * 2;
    const rotateX = -ny * max * 2;

    ref.current.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
    ref.current.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
    ref.current.style.setProperty("--shine-x", `${((nx + 0.5) * 100).toFixed(1)}%`);
    ref.current.style.setProperty("--shine-y", `${((ny + 0.5) * 100).toFixed(1)}%`);
  }

  function leave() {
    if (!ref.current) return;
    ref.current.style.removeProperty("--tilt-x");
    ref.current.style.removeProperty("--tilt-y");
    ref.current.style.removeProperty("--shine-x");
    ref.current.style.removeProperty("--shine-y");
  }

  return (
    <div
      ref={ref}
      className={`tilt-card ${className}`}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      <div className="tilt-sheen" aria-hidden="true" />
      {children}
    </div>
  );
}

export function SpatialEduObject({ title = "Understanding Fractions", subtitle = "Mathematics" }) {
  const containerRef = useRef(null);

  function handleMove(e) {
    if (!containerRef.current || e.pointerType !== "mouse") return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    containerRef.current.style.setProperty("--edu-tilt-x", `${(-ny * 12).toFixed(2)}deg`);
    containerRef.current.style.setProperty("--edu-tilt-y", `${(nx * 14).toFixed(2)}deg`);
  }

  function handleLeave() {
    if (!containerRef.current) return;
    containerRef.current.style.removeProperty("--edu-tilt-x");
    containerRef.current.style.removeProperty("--edu-tilt-y");
  }

  return (
    <div
      ref={containerRef}
      className="spatial-edu-scene"
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      aria-label="3D Educational Visualization"
    >
      {/* Ambient background light aura */}
      <div className="edu-scene-glow" aria-hidden="true" />

      {/* Gyroscopic Orbital Rings */}
      <div className="edu-orbit-ring ring-outer" aria-hidden="true" />
      <div className="edu-orbit-ring ring-mid" aria-hidden="true" />
      <div className="edu-orbit-ring ring-inner" aria-hidden="true" />

      {/* 3D Floating Spatial Fraction Prisms */}
      <div className="edu-spatial-cube" aria-hidden="true">
        <div className="cube-prism prism-quarter top-left">
          <span className="fraction-label">1/4</span>
        </div>
        <div className="cube-prism prism-quarter top-right">
          <span className="fraction-label">1/4</span>
        </div>
        <div className="cube-prism prism-half bottom-span active-fraction">
          <span className="fraction-label">2/4</span>
          <span className="fraction-sub">= 1/2</span>
        </div>

        {/* Soft cast depth shadow */}
        <div className="cube-ground-shadow" />
      </div>

      {/* Orbiting Learning Data Satellite / Beacon */}
      <div className="edu-satellite-node" aria-hidden="true">
        <div className="node-pulse" />
        <span className="node-symbol">📐</span>
      </div>

      {/* Editorial Caption Tag */}
      <div className="edu-scene-caption">
        <span className="caption-badge">Interactive Spatial Math</span>
        <span className="caption-equation">¼ + ¼ + ²⁄₄ = 1 Whole</span>
      </div>
    </div>
  );
}

export function Toast({ message, tone = "info", onClose }) {
  useEffect(() => {
    const t = setTimeout(() => onClose?.(), 3800);
    return () => clearTimeout(t);
  }, [message, onClose]);
  return (
    <div className="toast" role="status">
      <Badge tone={tone}>{tone}</Badge>
      <div style={{ marginTop: 6 }}>{message}</div>
    </div>
  );
}

export function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="panel panel-pad modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="section-title" style={{ marginBottom: 10 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

export function ErrorBoundary({ children }) {
  const [err, setErr] = useState(null);
  useEffect(() => {
    const onErr = (event) => setErr(event.error || event.reason || event);
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onErr);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onErr);
    };
  }, []);
  if (err) {
    return (
      <EmptyState
        title="Something went wrong"
        body="The page stayed available. Try another screen or refresh — your offline data is still on this device."
        action={<Button variant="secondary" onClick={() => setErr(null)}>Dismiss</Button>}
      />
    );
  }
  return children;
}

export function usePrefersReducedMotion() {
  return useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
}
