import React, { useEffect, useState } from "react";
import { HardDrive, Download } from "lucide-react";
import { api } from "../services/apiClient.js";
import { DownloadCard, EmptyState, SkeletonLines, PageHeader, StatRow, Button } from "../components/ui.jsx";

function mapStatus(row) {
  const s = (row.status || "").toLowerCase();
  if (s === "synced") return "DOWNLOADED";
  if (s === "syncing") return "DOWNLOADING";
  if (s === "failed") return "FAILED";
  if (s === "queued") return "QUEUED";
  if (s === "skipped") return "AVAILABLE";
  return (row.status || "AVAILABLE").toUpperCase();
}

export default function Downloads({ setView, openLesson }) {
  const [lessons, setLessons] = useState([]);
  const [packages, setPackages] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setLessons(await api.getLessons()); } catch { setLessons([]); }
    try {
      const { downloads } = await api.getSyncQueue();
      setPackages(downloads || []);
    } catch { setPackages([]); }
    try { setCatalog(await api.getSyncCatalog("std-001")); } catch { setCatalog([]); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const cachedLessons = lessons.filter((l) => l.cached);
  const totalMb = cachedLessons.reduce((a, l) => a + (l.size_mb || 0), 0);
  const failed = packages.filter((p) => p.status === "failed");

  const packageCards = (catalog.length ? catalog : packages).map((p) => {
    const row = packages.find((d) => d.id === p.id) || p;
    return {
      id: p.id,
      name: p.name || p.id,
      size: `${p.size_mb ?? "—"} MB`,
      priority: p.label || row.label,
      status: mapStatus(row),
      error: row.error,
    };
  });

  if (loading) return <div className="view-max panel panel-pad"><SkeletonLines count={5} /></div>;

  return (
    <div className="view-max">
      <PageHeader
        title="Downloads"
        subtitle="Offline content on this device. Download lessons before heading away from the hub."
        action={<Button variant="secondary" small onClick={() => setView?.("sync")}><Download size={13} /> Open Sync</Button>}
      />

      <div className="section">
        <StatRow items={[
          { label: "Lessons cached", value: cachedLessons.length },
          { label: "Storage used", value: `${totalMb.toFixed(1)} MB` },
          { label: "Packages", value: packageCards.filter((p) => p.status === "DOWNLOADED").length },
          { label: "Failed", value: failed.length, color: failed.length ? "var(--danger)" : undefined },
        ]} />
      </div>

      <div className="panel section">
        <div className="panel-header"><div className="section-title">Downloaded lessons</div></div>
        {cachedLessons.length === 0 ? (
          <EmptyState
            icon={HardDrive}
            title="No lessons saved yet"
            body="Download lessons before heading offline."
            action={<Button onClick={() => setView?.("sync")}>Go to Sync</Button>}
          />
        ) : cachedLessons.map((l) => (
          <DownloadCard
            key={l.id}
            item={{ name: l.title, size: `${l.size_mb} MB`, priority: l.weak_topic || "CORE", status: "DOWNLOADED" }}
            onOpen={() => openLesson?.(l.id, l.subject)}
          />
        ))}
      </div>

      <div className="panel">
        <div className="panel-header"><div className="section-title">Content packages</div></div>
        {packageCards.length === 0 ? (
          <div className="panel-body muted" style={{ fontSize: 12.5 }}>No package status yet — run a sync to populate this list.</div>
        ) : packageCards.map((p) => (
          <DownloadCard
            key={p.id}
            item={p}
            onRetry={p.status === "FAILED" ? async () => { try { await api.retryDownload(p.id); await load(); } catch { await load(); } } : undefined}
          />
        ))}
      </div>
    </div>
  );
}
