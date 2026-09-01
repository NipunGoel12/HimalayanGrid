import React from "react";
import { Inbox } from "lucide-react";

export function Button({ children, onClick, variant = "primary", disabled, small, type = "button", style }) {
  return (
    <button
      type={type}
      className={`btn ${variant} ${small ? "small" : ""}`}
      onClick={onClick}
      disabled={disabled}
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

/** Five-state connectivity indicator, shown compactly in the header. */
export function ConnectionBadge({ state }) {
  const cfg = {
    ONLINE: { tone: "success", label: "Online" },
    LOCAL_HUB: { tone: "info", label: "Local Hub" },
    OFFLINE: { tone: "neutral", label: "Offline" },
    SYNCING: { tone: "info", label: "Syncing" },
    SYNC_ERROR: { tone: "danger", label: "Sync error" },
  }[state] || { tone: "neutral", label: state };
  return <Badge tone={cfg.tone} dot>{cfg.label}</Badge>;
}

export function ProgressBar({ value, max = 100, tone = "brand" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const cls = tone === "warning" ? "warn" : tone === "danger" ? "danger" : "";
  return (
    <div className="progress-track">
      <div className={`progress-fill ${cls}`} style={{ width: pct + "%" }} />
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
// Backwards-compatible alias used by a couple of pages.
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
    <div className="stat-row">
      {items.map((it, i) => (
        <div key={i} className="stat-cell">
          <div className="stat-label">{it.label}</div>
          <div className="stat-value" style={it.color ? { color: it.color } : undefined}>{it.value}</div>
          {it.sub && <div className="stat-sub">{it.sub}</div>}
        </div>
      ))}
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

export function PriorityBadge({ label }) {
  const tone = { HIGH: "danger", MEDIUM: "warning", LOW: "info", SKIPPED: "neutral" }[label] || "neutral";
  return <Badge tone={tone}>{label}</Badge>;
}

export function SyncStatusBadge({ status }) {
  const cfg = {
    queued: { tone: "neutral", label: "Queued" },
    syncing: { tone: "info", label: "Syncing" },
    synced: { tone: "success", label: "Synced" },
    failed: { tone: "danger", label: "Failed" },
    skipped: { tone: "neutral", label: "Skipped" },
  }[status] || { tone: "neutral", label: status };
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

/** A thin, minimal topographic watermark — used once, subtly, never as a
 *  dominant decorative motif. */
export function TopoWatermark() {
  return (
    <svg
      width="220" height="120" viewBox="0 0 220 120"
      style={{ position: "absolute", top: 0, right: 0, opacity: 0.5, pointerEvents: "none" }}
    >
      <path d="M0,90 L40,40 L70,68 L110,20 L150,60 L220,30" stroke="var(--gray-200)" strokeWidth="2" fill="none" />
      <path d="M0,100 L40,55 L70,80 L110,38 L150,74 L220,46" stroke="var(--gray-100)" strokeWidth="2" fill="none" />
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

export function TopicCard({ topic, onClick }) {
  return (
    <button className="topic-card" onClick={onClick}>
      <div className="topic-card-art" style={{ background: topic.color + "22" }}>{topic.icon}</div>
      <div className="topic-card-body">
        <div className="topic-card-title">{topic.title}</div>
        <div className="topic-card-meta">{topic.region} · {topic.subject}</div>
        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
          {topic.quizCompleted ? <Badge tone="success">Quiz done</Badge> : topic.explored ? <Badge tone="info">Explored</Badge> : <Badge tone="neutral">New</Badge>}
          {topic.saved && <Badge tone="warning">Saved</Badge>}
        </div>
      </div>
    </button>
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
