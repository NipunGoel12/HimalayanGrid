import React, { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { api } from "../services/apiClient.js";
import { getQueuedEvents, setLastSync } from "../services/offlineStore.js";
import { Button, StatRow, PriorityBadge, SyncStatusBadge, PageHeader, SyncTimeline } from "../components/ui.jsx";
import { CONN_STATES } from "../constants.js";

function pipelineFrom(connState, syncing, queuedLocal, pendingUploads) {
  if (connState === CONN_STATES.OFFLINE) return queuedLocal || pendingUploads ? "QUEUED" : "OFFLINE";
  if (connState === CONN_STATES.SYNCING || syncing) return "UPLOADING";
  if (connState === CONN_STATES.SYNC_ERROR) return "SATELLITE WINDOW";
  if (connState === CONN_STATES.SYNCED) return "SYNCED";
  if (connState === CONN_STATES.LOCAL_HUB) return pendingUploads ? "QUEUED" : "OFFLINE";
  return "OFFLINE";
}

export default function Sync({ student, networkOn, connState, setConnState, setNetworkOn, setHubOn }) {
  const [ranked, setRanked] = useState([]);
  const [queue, setQueue] = useState({ uploads: [], downloads: [] });
  const [gatewayLog, setGatewayLog] = useState([]);
  const [history, setHistory] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [forceSyncError, setForceSyncError] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [localQueued, setLocalQueued] = useState([]);
  const [phase, setPhase] = useState("OFFLINE");

  async function refreshAll() {
    try { setRanked(await api.getSyncCatalog(student.id)); } catch {}
    try { setQueue(await api.getSyncQueue()); } catch {}
    try { setGatewayLog(await api.getGatewayLog()); } catch {}
    try { setHistory(await api.getSyncHistory()); } catch {}
    try { setConflicts(await api.getConflicts()); } catch {}
    setLocalQueued(await getQueuedEvents());
  }
  useEffect(() => { refreshAll(); }, [student.id]);
  useEffect(() => {
    const pendingUploads = queue.uploads.filter((u) => u.sync_status !== "synced").length;
    setPhase(pipelineFrom(connState, syncing, localQueued.length, pendingUploads));
  }, [connState, syncing, localQueued, queue]);

  async function runSync() {
    setSyncing(true);
    setConnState(CONN_STATES.SYNCING);
    setPhase("SATELLITE WINDOW");
    try {
      setPhase("UPLOADING");
      const res = await api.runSync({ studentId: student.id, simulateFailure: forceSyncError });
      if (res.status === "SYNC_ERROR") {
        setConnState(CONN_STATES.SYNC_ERROR);
        setPhase("SATELLITE WINDOW");
      } else {
        setPhase("PRIORITY DOWNLOAD");
        setConnState(CONN_STATES.SYNCED);
        setPhase("SYNCED");
        await setLastSync(Date.now());
      }
      setForceSyncError(false);
    } catch {
      setConnState(CONN_STATES.SYNC_ERROR);
    }
    await refreshAll();
    setSyncing(false);
  }

  async function retryDownload(pkgId) {
    setConnState(CONN_STATES.SYNCING);
    try {
      await api.retryDownload(pkgId);
      setConnState(CONN_STATES.SYNCED);
    } catch {
      setConnState(CONN_STATES.SYNC_ERROR);
    }
    await refreshAll();
  }

  async function resolveConflict(id) {
    await api.resolveConflict(id);
    setConflicts((c) => c.filter((x) => x.id !== id));
  }

  const lastSyncEntry = history.find((h) => (h.message || "").includes("Sync complete"));
  const pendingUploads = queue.uploads.filter((u) => u.sync_status !== "synced");
  const failedDownloads = queue.downloads.filter((d) => d.status === "failed");
  const downloading = queue.downloads.find((d) => d.status === "syncing");
  const completed = queue.uploads.filter((u) => u.sync_status === "synced").length;

  return (
    <div className="view-max">
      <PageHeader
        title="Sync"
        subtitle="Visualizes the offline → satellite → synced pipeline. The gateway is MockSatelliteAdapter."
        action={
          <Button onClick={runSync} disabled={!networkOn || syncing} loading={syncing}>
            <RefreshCw size={14} /> {syncing ? "Syncing…" : "Open satellite window"}
          </Button>
        }
      />

      <div className="mvp-note section">Satellite connection simulated for MVP</div>

      <div className="section"><SyncTimeline active={phase} /></div>

      <div className="section">
        <StatRow
          items={[
            { label: "Connection", value: connState.replaceAll("_", " ") },
            { label: "Last synchronized", value: lastSyncEntry ? new Date(lastSyncEntry.created_at).toLocaleTimeString() : "Never" },
            { label: "Pending", value: pendingUploads.length + localQueued.length, sub: "events" },
            { label: "Uploading", value: syncing ? `${completed} / ${Math.max(pendingUploads.length, 1)}` : "Idle" },
          ]}
        />
      </div>

      {!networkOn && (
        <div className="callout warning section" style={{ fontSize: 12.5 }}>
          Enable Satellite / Internet in the header (or the button below) to open a simulated pass window.
          <div style={{ marginTop: 8 }}>
            <Button small onClick={() => { setHubOn?.(true); setNetworkOn?.(true); }}>Enable simulated satellite</Button>
          </div>
        </div>
      )}
      {connState === CONN_STATES.SYNC_ERROR && (
        <div className="callout danger section" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <AlertTriangle size={15} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12.5 }}>
            Sync failed. Your data remains queued. Nothing was overwritten.
            <div style={{ marginTop: 8 }}><Button small variant="danger" onClick={runSync}>Retry</Button></div>
          </div>
        </div>
      )}

      {downloading && (
        <div className="callout section">Downloading {downloading.id} · Priority {downloading.label || "HIGH"}</div>
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
                  <td className="muted" style={{ fontSize: 12 }}>{(p.reasons || []).join(", ") || "—"}</td>
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
          <div className="panel-header"><div className="section-title">Pending uploads</div></div>
          {localQueued.map((u) => (
            <div key={u.id || u.createdAt} className="panel-row"><span style={{ fontSize: 12.5 }}>{u.type} (device)</span><SyncStatusBadge status="QUEUED" /></div>
          ))}
          {pendingUploads.length === 0 && localQueued.length === 0 ? (
            <div className="panel-body muted" style={{ fontSize: 12.5 }}>Nothing queued.</div>
          ) : pendingUploads.slice(0, 8).map((u) => (
            <div key={u.id} className="panel-row"><span style={{ fontSize: 12.5 }}>{u.type}</span><SyncStatusBadge status={u.sync_status} /></div>
          ))}
        </div>
        <div className="panel">
          <div className="panel-header"><div className="section-title">Downloads</div></div>
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

      {failedDownloads.length > 0 && (
        <div className="callout danger section">⚠ Connection interrupted on {failedDownloads.length} package(s). Retry from the download list.</div>
      )}

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
