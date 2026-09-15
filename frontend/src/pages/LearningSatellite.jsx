import React, { useState } from "react";
import { Badge, Button, PageHeader, SyncTimeline } from "../components/ui.jsx";
import { api } from "../services/apiClient.js";
import { CONN_STATES } from "../constants.js";
import { Building2, Cloud, Satellite, Smartphone } from "lucide-react";

const STEPS = [
  { icon: "🛰️", title: "Satellite receives data", text: "Lessons and quizzes wait for a pass window — simulated here by MockSatelliteAdapter." },
  { icon: "📡", title: "Ground station", text: "The mock gateway transfers packages with realistic delay and optional failure." },
  { icon: "🏫", title: "Local hub", text: "The village hub stores content in SQLite even when the wider internet is down." },
  { icon: "📶", title: "Student device", text: "This PWA reads cached lessons from IndexedDB with the network off." },
  { icon: "🔄", title: "Progress syncs later", text: "Queued learning events upload first, then the priority engine downloads content." },
];

export default function LearningSatellite({ setView, student, networkOn, connState, setConnState, setNetworkOn, setHubOn }) {
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);
  const [phase, setPhase] = useState(connState === "OFFLINE" ? "OFFLINE" : "QUEUED");

  function push(msg) {
    setLog((l) => [...l, { msg, at: Date.now() }]);
  }

  async function openWindow() {
    setBusy(true);
    setNetworkOn?.(true);
    setHubOn?.(true);
    setPhase("SATELLITE WINDOW");
    setConnState(CONN_STATES.SYNCING);
    push("Opening simulated satellite window…");
    push("Satellite appears · signal waves expanding");
    try {
      push("Uploading learning events…");
      setPhase("UPLOADING");
      const res = await api.runSync({ studentId: student?.id || "std-001", simulateFailure: false });
      if (res.status === "SYNC_ERROR") {
        push(`Link drop: ${res.error || "validation failed"}`);
        setConnState(CONN_STATES.SYNC_ERROR);
        setPhase("SATELLITE WINDOW");
      } else {
        push("Downloading priority content…");
        setPhase("PRIORITY DOWNLOAD");
        push("Sync complete");
        setPhase("SYNCED");
        setConnState(CONN_STATES.SYNCED);
      }
    } catch (e) {
      push("Sync failed. Data remains queued.");
      setConnState(CONN_STATES.SYNC_ERROR);
    }
    setBusy(false);
  }

  return (
    <div className="view-max satellite-page">
      <PageHeader
        title="Learning Satellite"
        subtitle="How learning reaches remote Himalayan schools when cables do not."
      />
      <div className="mvp-note section">Satellite connection simulated for MVP</div>

      <div
        className={`sync-visual-spatial section ${busy || connState === CONN_STATES.SYNCING ? "sync-running" : connState === CONN_STATES.SYNCED ? "sync-complete" : ""}`}
        aria-label="Learning data path from student device to local hub and satellite"
      >
        <div className="sync-spatial-header">
          <Badge tone={busy || connState === CONN_STATES.SYNCING ? "info" : connState === CONN_STATES.SYNCED ? "success" : "neutral"}>
            {busy || connState === CONN_STATES.SYNCING ? "Transferring learning data · Pass Window Active" : connState === CONN_STATES.SYNCED ? "All Data Synchronized" : "Waiting for Pass Window"}
          </Badge>
          <span className="sync-telemetry-mono">
            {connState === CONN_STATES.SYNCING ? "TRANSMITTING TELEMETRY" : "RADIO STANDBY"}
          </span>
        </div>

        {/* Spatial 4-Node Architecture Grid */}
        <div className="sync-nodes-container">
          <div className="sync-node-spatial device">
            <div className="node-halo" />
            <div className="node-icon-box">
              <Smartphone size={26} color="var(--glacier-400)" />
            </div>
            <div className="node-text">
              <span className="node-title">Student Device</span>
              <span className="node-meta">PWA · IndexedDB</span>
            </div>
          </div>

          <div className="sync-connector-line c1">
            <div className="connector-pulse" />
          </div>

          <div className="sync-node-spatial hub">
            <div className="node-halo" />
            <div className="node-icon-box">
              <Building2 size={26} color="var(--teal-500)" />
            </div>
            <div className="node-text">
              <span className="node-title">Local Village Hub</span>
              <span className="node-meta">Micro-Server · SQLite</span>
            </div>
          </div>

          <div className="sync-connector-line c2">
            <div className="connector-pulse" />
          </div>

          <div className="sync-node-spatial satellite">
            <div className="node-halo" />
            <div className="node-icon-box">
              <Satellite size={28} color="var(--amber-400)" />
            </div>
            <div className="node-text">
              <span className="node-title">LEO Satellite</span>
              <span className="node-meta">Simulated Window</span>
            </div>
          </div>

          <div className="sync-connector-line c3">
            <div className="connector-pulse" />
          </div>

          <div className="sync-node-spatial cloud">
            <div className="node-halo" />
            <div className="node-icon-box">
              <Cloud size={26} color="var(--glacier-400)" />
            </div>
            <div className="node-text">
              <span className="node-title">Cloud Core</span>
              <span className="node-meta">Global Curriculum</span>
            </div>
          </div>
        </div>

        {/* Dynamic Animated Packets traveling across the architecture */}
        <div className={`spatial-packet-stream ${busy || connState === CONN_STATES.SYNCING ? "transmitting" : ""}`}>
          <span className="packet p1" />
          <span className="packet p2" />
          <span className="packet p3" />
          <span className="packet p4" />
        </div>
      </div>

      {/* Orbital Spatial Visualizer */}
      <div className="panel section sat-stage-spatial" aria-label="Simulated satellite visualization">
        <div className="sat-stars-field" aria-hidden="true" />
        <div className="sat-earth-curve">
          <div className="sat-mountain-silhouettes" />
          <div className="sat-atmosphere-glow" />
        </div>
        <div className="sat-wave-spatial w1" />
        <div className="sat-wave-spatial w2" />
        <div className="sat-wave-spatial w3" />
        <div className="sat-orbit-spatial">
          <div className="sat-vehicle">
            <div className="sat-solar-panel" />
            <span className="sat-emoji">🛰️</span>
            <div className="sat-solar-panel" />
            <div className="sat-signal-beam" />
          </div>
        </div>
        <div className="sat-stage-badges">
          <Badge tone="brand">Himalayan Region (LEO Orbit Pass)</Badge>
          <span className="sat-pass-indicator">Orbit: 550km · Inclination: 53°</span>
        </div>
      </div>

      <div className="section"><SyncTimeline active={phase} /></div>

      <div className="section" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button onClick={openWindow} loading={busy} disabled={busy}>Open Satellite Window</Button>
        <Button variant="secondary" onClick={() => setView("sync")}>Open Sync details</Button>
      </div>

      {log.length > 0 && (
        <div className="panel section">
          <div className="panel-header"><div className="section-title">Pass window</div></div>
          {log.map((l, i) => (
            <div key={i} className="panel-row"><span style={{ fontSize: 13 }}>{l.msg}</span></div>
          ))}
        </div>
      )}

      <div className="section">
        <div className="section-title" style={{ marginBottom: 10 }}>How it works</div>
        <div className="panel">
          {STEPS.map((s, i) => (
            <div key={i} className="story-step">
              <div className="story-step-icon">{s.icon}</div>
              <div>
                <div style={{ fontWeight: 650, fontSize: 13.5 }}>{i + 1}. {s.title}</div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 2, lineHeight: 1.5 }}>{s.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
