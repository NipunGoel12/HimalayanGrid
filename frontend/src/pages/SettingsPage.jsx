import React, { useEffect, useState } from "react";
import { PlayCircle, Trash2 } from "lucide-react";
import { Button, Badge, PageHeader, ConnectivityStatus } from "../components/ui.jsx";
import { resetLocalDb, getSettings, saveSettings, getQueuedEvents, getCachedLessons } from "../services/offlineStore.js";

export default function SettingsPage({ student, setView, connState }) {
  const [cleared, setCleared] = useState(false);
  const [settings, setSettings] = useState({ preferLocalAi: true, language: student.language });
  const [storage, setStorage] = useState(null);
  const [queued, setQueued] = useState(0);
  const [lessons, setLessons] = useState(0);

  useEffect(() => {
    (async () => {
      setSettings(await getSettings());
      setQueued((await getQueuedEvents()).length);
      setLessons((await getCachedLessons()).length);
      if (navigator.storage?.estimate) {
        const est = await navigator.storage.estimate();
        setStorage(est);
      }
    })();
  }, []);

  async function persist(next) {
    setSettings(next);
    await saveSettings(next);
  }

  async function clearOfflineData() {
    await resetLocalDb();
    setCleared(true);
  }

  const usedMb = storage?.usage != null ? (storage.usage / (1024 * 1024)).toFixed(1) : "—";

  return (
    <div className="view-max" style={{ maxWidth: 640 }}>
      <PageHeader title="Settings" subtitle="Language, offline preferences, storage and about HLG." />

      <div className="panel section">
        <div className="panel-header"><div className="section-title">Profile</div></div>
        <div className="panel-body kv-grid">
          <dt>Name</dt><dd>{student.name}</dd>
          <dt>Grade</dt><dd>{student.grade}</dd>
          <dt>Village</dt><dd>{student.village}</dd>
          <dt>Weak topics</dt><dd>{student.weak_topics?.join(", ") || "None flagged"}</dd>
        </div>
      </div>

      <div className="panel section">
        <div className="panel-header"><div className="section-title">Language</div></div>
        <div className="panel-body">
          <label className="field-label">Interface language</label>
          <select
            value={settings.language || student.language}
            onChange={(e) => persist({ ...settings, language: e.target.value })}
            style={{ width: 220 }}
          >
            <option>Hindi</option>
            <option>English</option>
            <option>Nepali</option>
          </select>
          <div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>Stored on this device. Lesson language still follows the catalog.</div>
        </div>
      </div>

      <div className="panel section">
        <div className="panel-header"><div className="section-title">Offline preferences</div></div>
        <div className="panel-body" style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
            <input
              type="checkbox"
              checked={settings.preferLocalAi !== false}
              onChange={(e) => persist({ ...settings, preferLocalAi: e.target.checked })}
            />
            Prefer Local AI even when internet is on
          </label>
          <div className="muted" style={{ fontSize: 12.5 }}>
            Connectivity toggles live in the header. Local Hub unavailable messages appear when the Express API cannot be reached.
          </div>
        </div>
      </div>

      <div className="panel section">
        <div className="panel-header"><div className="section-title">Connectivity</div></div>
        <div className="panel-body" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <ConnectivityStatus state={connState || "OFFLINE"} mode="expanded" pending={queued} />
          <div className="muted" style={{ fontSize: 12.5 }}>{queued} queued event(s) · {lessons} cached lesson(s)</div>
        </div>
      </div>

      <div className="panel section">
        <div className="panel-header"><div className="section-title">Storage</div></div>
        <div className="panel-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div className="muted" style={{ fontSize: 12.5 }}>
            Browser estimate: {usedMb} MB used{storage?.quota ? ` of ${(storage.quota / (1024 * 1024)).toFixed(0)} MB` : ""}.
            Clearing cache removes IndexedDB only — not the Local Hub SQLite database.
          </div>
          <Button variant="danger" small onClick={clearOfflineData}><Trash2 size={13} /> Clear offline data</Button>
        </div>
        {cleared && <div className="panel-body" style={{ paddingTop: 0 }}><Badge tone="success">Offline cache cleared</Badge></div>}
      </div>

      <div className="panel section">
        <div className="panel-header"><div className="section-title">About HLG</div></div>
        <div className="panel-body muted" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
          Himalayan Learning Grid is an offline-first PWA: student device → Local Hub API → SQLite.
          When a simulated satellite window opens, queued events upload and priority packages download.
          Frontend: Bhavya Vasudev · Offline AI: Nipun Goel · Satellite/sync: Shagun Mehta.
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><div className="section-title">Demo tools</div></div>
        <div className="panel-body" style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div className="muted" style={{ fontSize: 12.5 }}>Guided ~3 minute judge path.</div>
            <Button variant="secondary" small onClick={() => setView("demo")}><PlayCircle size={13} /> Open demo mode</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
