import React, { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { api } from "../services/apiClient.js";
import { Button, Badge, StatRow, PriorityBadge, SyncStatusBadge, ProgressBar } from "../components/ui.jsx";

export default function Sync({ student, networkOn, connState, setConnState }) {
  const [ranked, setRanked] = useState([]);
  const [queue, setQueue] = useState({ uploads: [], downloads: [] });
  const [gatewayLog, setGatewayLog] = useState([]);
  const [history, setHistory] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [forceSyncError, setForceSyncError] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function refreshAll() {
    try { setRanked(await api.getSyncCatalog(student.id)); } catch {}
    try { setQueue(await api.getSyncQueue()); } catch {}
    try { setGatewayLog(await api.getGatewayLog()); } catch {}
    try { setHistory(await api.getSyncHistory()); } catch {}
    try { setConflicts(await api.getConflicts()); } catch {}
  }
  useEffect(() => { refreshAll(); }, [student.id]);

  async function runSync() {
    setSyncing(true);
    setConnState("SYNCING");
    try {
      const res = await api.runSync({ studentId: student.id, simulateFailure: forceSyncError });
      setConnState(res.status === "SYNC_ERROR" ? "SYNC_ERROR" : "ONLINE");
      setForceSyncError(false);
    } catch {
      setConnState("SYNC_ERROR");
    }
    await refreshAll();
    setSyncing(false);
  }

  async function retryDownload(pkgId) {
    setConnState("SYNCING");
    try { await api.retryDownload(pkgId); setConnState("ONLINE"); } catch { setConnState("SYNC_ERROR"); }
    await refreshAll();
  }

  async function resolveConflict(id) {
    await api.resolveConflict(id);
    setConflicts((c) => c.filter((x) => x.id !== id));
  }

  const lastSyncEntry = history.find((h) => h.message.includes("Sync complete"));
  const pendingUploads = queue.uploads.filter((u) => u.sync_status !== "synced").length;
  const pendingDownloads = ranked.filter((p) => p.label !== "SKIPPED").length;

  return (
    <div className="view-max">
      <div className="section" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="page-title">Sync Center</div>
          <div className="page-subtitle">
            Connects through a simulated satellite gateway (MockSatelliteAdapter) for this hackathon build — a documented interface so a real provider can be added later without other code changes.
          </div>
        </div>
        <Button onClick={runSync} disabled={!networkOn || syncing}>
          <RefreshCw size={14} className={syncing ? "" : ""} /> {syncing ? "Syncing…" : "Sync now"}
        </Button>
      </div>

      <div className="section">
        <StatRow
          items={[
            { label: "Connection", value: connState.replace("_", " ") },
            { label: "Last synchronized", value: lastSyncEntry ? new Date(lastSyncEntry.created_at).toLocaleTimeString() : "Never" },
            { label: "Pending uploads", value: pendingUploads },
            { label: "Pending downloads", value: pendingDownloads },
          ]}
        />
      </div>

      {!networkOn && (
        <div className="callout section" style={{ fontSize: 12.5 }}>Enable "Satellite / Internet" in the header to run a sync.</div>
      )}
      {connState === "SYNC_ERROR" && (
        <div className="callout danger section" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <AlertTriangle size={15} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12.5 }}>A package failed validation and was not written to the local database. Nothing was overwritten. Retry the failed item in the table below.</div>
        </div>
      )}

      <div className="section">
        <div className="section-head">
          <div className="section-title">Smart Priority Engine</div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
            <input type="checkbox" checked={forceSyncError} onChange={(e) => setForceSyncError(e.target.checked)} />
            Simulate a validation failure
          </label>
        </div>
        <div className="faint" style={{ fontSize: 11.5, marginBottom: 8 }}>
          score = weak-topic×5 + teacher-request×4 + unanswered×4 + new-curriculum×3 + language×3 + mission×2 − large-file×2
        </div>
        <div className="panel table-wrap">
          <table className="table">
            <thead><tr><th>Package</th><th>Size</th><th>Reasons</th><th>Score</th><th>Priority</th></tr></thead>
            <tbody>
              {ranked.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td className="muted">{p.size_mb} MB</td>
                  <td className="muted" style={{ fontSize: 12 }}>{p.reasons.join(", ") || "—"}</td>
                  <td className="mono">{p.score}</td>
                  <td><PriorityBadge label={p.label} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="panel">
          <div className="panel-header"><div className="section-title">Upload queue</div></div>
          {queue.uploads.length === 0 ? (
            <div className="panel-body muted" style={{ fontSize: 12.5 }}>Nothing queued.</div>
          ) : queue.uploads.slice(0, 8).map((u) => (
            <div key={u.id} className="panel-row"><span style={{ fontSize: 12.5 }}>{u.type}</span><SyncStatusBadge status={u.sync_status} /></div>
          ))}
        </div>
        <div className="panel">
          <div className="panel-header"><div className="section-title">Download queue</div></div>
          {queue.downloads.length === 0 ? (
            <div className="panel-body muted" style={{ fontSize: 12.5 }}>Run a sync to populate this list.</div>
          ) : queue.downloads.map((d) => (
            <div key={d.id} className="panel-row">
              <span style={{ fontSize: 12.5 }}>{d.id}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <SyncStatusBadge status={d.status} />
                {d.status === "failed" && <Button small variant="danger" onClick={() => retryDownload(d.id)}>Retry</Button>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="panel section">
          <div className="panel-header"><div className="section-title">Conflicts — resolved automatically</div></div>
          {conflicts.map((c) => (
            <div key={c.id} className="panel-row" style={{ alignItems: "flex-start", flexDirection: "column", gap: 6 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{c.field}</div>
              <div className="kv-grid" style={{ fontSize: 12.5 }}>
                <dt>Local</dt><dd>{c.local_value}</dd>
                <dt>Remote</dt><dd>{c.remote_value}</dd>
                <dt>Resolution</dt><dd style={{ color: "var(--success)" }}>{c.resolution}</dd>
              </div>
              <Button small variant="ghost" onClick={() => resolveConflict(c.id)}>Dismiss</Button>
            </div>
          ))}
        </div>
      )}

      <div className="section" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="panel">
          <div className="panel-header"><div className="section-title">Gateway log</div></div>
          <div className="panel-body scroll mono" style={{ maxHeight: 160, overflowY: "auto", fontSize: 11.5 }}>
            {gatewayLog.length === 0 ? <span className="faint">No activity yet.</span> : gatewayLog.map((g, i) => (
              <div key={i} className="muted" style={{ marginBottom: 4 }}>{new Date(g.createdAt).toLocaleTimeString()} — {g.message}</div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><div className="section-title">Sync history</div></div>
          <div className="panel-body scroll" style={{ maxHeight: 160, overflowY: "auto", fontSize: 12.5 }}>
            {history.length === 0 ? <span className="faint">No sync runs yet.</span> : history.map((h) => (
              <div key={h.id} className="muted" style={{ marginBottom: 4 }}>{new Date(h.created_at).toLocaleTimeString()} — {h.message}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
