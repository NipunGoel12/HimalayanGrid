import React, { useEffect, useState } from "react";
import { HardDrive } from "lucide-react";
import { api } from "../services/apiClient.js";
import { Badge, EmptyState, SkeletonLines } from "../components/ui.jsx";

export default function Downloads() {
  const [lessons, setLessons] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setLessons(await api.getLessons()); } catch { setLessons([]); }
      try {
        const { downloads } = await api.getSyncQueue();
        setPackages(downloads.filter((d) => d.status === "synced"));
      } catch { setPackages([]); }
      setLoading(false);
    })();
  }, []);

  const cachedLessons = lessons.filter((l) => l.cached);
  const totalMb = cachedLessons.reduce((a, l) => a + l.size_mb, 0);

  if (loading) return <div className="view-max panel panel-pad"><SkeletonLines count={5} /></div>;

  return (
    <div className="view-max">
      <div className="section">
        <div className="page-title">Downloads</div>
        <div className="page-subtitle">Content stored on this device and available with the network off.</div>
      </div>

      <div className="panel panel-pad section" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <HardDrive size={18} color="var(--text-faint)" />
        <div style={{ fontSize: 13 }}>
          <b>{cachedLessons.length}</b> lesson(s) cached · <b>{totalMb.toFixed(1)} MB</b> used on this device
        </div>
      </div>

      <div className="panel section">
        <div className="panel-header"><div className="section-title">Downloaded lessons</div></div>
        {cachedLessons.length === 0 ? (
          <EmptyState title="No lessons downloaded" body="Visit Sync Center to download lesson content for offline use." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Lesson</th><th>Subject</th><th>Language</th><th>Size</th></tr></thead>
              <tbody>
                {cachedLessons.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600 }}>{l.title}</td>
                    <td className="muted">{l.subject}</td>
                    <td className="muted">{l.language}</td>
                    <td className="muted">{l.size_mb} MB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-header"><div className="section-title">Synced content packages</div></div>
        {packages.length === 0 ? (
          <div className="panel-body muted" style={{ fontSize: 12.5 }}>No packages synced yet — run a sync from the Sync Center.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Package</th><th>Priority</th><th>Synced</th></tr></thead>
              <tbody>
                {packages.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.id}</td>
                    <td><Badge tone="neutral">{p.label}</Badge></td>
                    <td className="muted">{new Date(p.updated_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
