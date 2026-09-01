import React, { useState } from "react";
import { PlayCircle, Trash2 } from "lucide-react";
import { Button, Badge } from "../components/ui.jsx";
import { resetLocalDb } from "../services/offlineStore.js";

export default function SettingsPage({ student, setView }) {
  const [cleared, setCleared] = useState(false);

  async function clearOfflineData() {
    await resetLocalDb();
    setCleared(true);
  }

  return (
    <div className="view-max" style={{ maxWidth: 640 }}>
      <div className="section">
        <div className="page-title">Settings</div>
        <div className="page-subtitle">Profile, offline storage and developer tools.</div>
      </div>

      <div className="panel section">
        <div className="panel-header"><div className="section-title">Profile</div></div>
        <div className="panel-body kv-grid">
          <dt>Name</dt><dd>{student.name}</dd>
          <dt>Grade</dt><dd>{student.grade}</dd>
          <dt>Language</dt><dd>{student.language}</dd>
          <dt>Village</dt><dd>{student.village}</dd>
          <dt>Weak topics</dt><dd>{student.weak_topics.join(", ") || "None flagged"}</dd>
        </div>
      </div>

      <div className="panel section">
        <div className="panel-header"><div className="section-title">Preferences</div></div>
        <div className="panel-body" style={{ display: "grid", gap: 14 }}>
          <div>
            <label className="field-label">Interface language</label>
            <select disabled style={{ width: 220 }}><option>{student.language}</option></select>
            <div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>Additional languages coming soon.</div>
          </div>
          <div>
            <label className="field-label">Connectivity</label>
            <div className="muted" style={{ fontSize: 12.5 }}>Local Hub and Satellite/Internet toggles are available in the header on every page.</div>
          </div>
        </div>
      </div>

      <div className="panel section">
        <div className="panel-header"><div className="section-title">Offline storage</div></div>
        <div className="panel-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div className="muted" style={{ fontSize: 12.5 }}>Clears the on-device cache (profile, lessons, quiz attempts, queued events). The Local Hub database is not affected.</div>
          <Button variant="danger" small onClick={clearOfflineData}><Trash2 size={13} /> Clear offline data</Button>
        </div>
        {cleared && <div className="panel-body" style={{ paddingTop: 0 }}><Badge tone="success">Offline cache cleared</Badge></div>}
      </div>

      <div className="panel">
        <div className="panel-header"><div className="section-title">Developer &amp; technical tools</div></div>
        <div className="panel-body" style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div className="muted" style={{ fontSize: 12.5 }}>Runs the full hackathon demo script for judges.</div>
            <Button variant="secondary" small onClick={() => setView("demo")}><PlayCircle size={13} /> Open demo mode</Button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div className="muted" style={{ fontSize: 12.5 }}>Technical Sync Center: priority engine, upload/download queues and conflict resolution.</div>
            <Button variant="secondary" small onClick={() => setView("sync")}>Open Sync Center</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
