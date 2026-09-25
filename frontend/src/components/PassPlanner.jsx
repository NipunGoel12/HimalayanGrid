import React from "react";
import { Badge } from "./ui.jsx";
import { formatDuration, azimuthName } from "../services/satelliteTracking.js";
import { forecastAt, linkOutlook } from "../services/earthData.js";

const OUTLOOK_RANK = { good: 3, fair: 2, unknown: 1, poor: 0 };

/** Polar sky plot of one pass: North up, centre = straight overhead. */
export function SkyPlot({ pass }) {
  const S = 180, c = S / 2, R = 78;
  const pt = ({ az, el }) => {
    const r = ((90 - el) / 90) * R;
    const a = (az * Math.PI) / 180;
    return [c + r * Math.sin(a), c - r * Math.cos(a)];
  };
  const pts = pass.path.map(pt);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const first = pts[0], last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{ maxWidth: 200 }} role="img"
      aria-label={`Sky path of ${pass.sat.short}: rises ${azimuthName(pass.path[0].az)}, sets ${azimuthName(pass.path[pass.path.length - 1].az)}, maximum elevation ${Math.round(pass.maxEl)} degrees`}>
      {[0, 30, 60].map((el) => (
        <circle key={el} cx={c} cy={c} r={((90 - el) / 90) * R} fill="none" stroke="var(--border-strong)" strokeDasharray={el ? "2 3" : "0"} />
      ))}
      <line x1={c} y1={c - R} x2={c} y2={c + R} stroke="var(--border)" />
      <line x1={c - R} y1={c} x2={c + R} y2={c} stroke="var(--border)" />
      {[["N", c, c - R - 4], ["E", c + R + 8, c + 3], ["S", c, c + R + 12], ["W", c - R - 8, c + 3]].map(([t, x, y]) => (
        <text key={t} x={x} y={y} textAnchor="middle" fontSize="9" fill="var(--text-faint)" fontWeight="700">{t}</text>
      ))}
      <path d={d} fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={first[0]} cy={first[1]} r="3.5" fill="#10B981" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="#EF4444" />
    </svg>
  );
}

/**
 * Upcoming real passes over the hub, each paired with the real weather
 * forecast for that hour so students can see which pass is the best window.
 */
export default function PassPlanner({ passes, weather, selectedPass, onSelectPass, now }) {
  const rows = passes
    .filter((p) => !p.continuous && p.end.getTime() > now)
    .slice(0, 8)
    .map((p) => {
      const f = forecastAt(weather, p.maxAt);
      return { p, f, outlook: linkOutlook(f) };
    });

  const best = rows.length
    ? rows.reduce((b, r) =>
        OUTLOOK_RANK[r.outlook.level] * 100 + r.p.maxEl > OUTLOOK_RANK[b.outlook.level] * 100 + b.p.maxEl ? r : b
      ).p
    : null;

  if (!rows.length) {
    return <div className="muted" style={{ padding: 16, fontSize: 13 }}>No passes above 10° elevation in the next 24 hours for the tracked satellites.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr><th>Satellite</th><th>Rises</th><th>Duration</th><th>Max elev.</th><th>Path</th><th>Link outlook</th></tr>
        </thead>
        <tbody>
          {rows.map(({ p, f, outlook }) => {
            const inMs = p.start.getTime() - now;
            const active = inMs <= 0;
            return (
              <tr key={p.sat.noradId + p.start.getTime()} onClick={() => onSelectPass(p)}
                style={{ cursor: "pointer", background: selectedPass === p ? "var(--brand-50)" : undefined }}>
                <td><b>{p.sat.short}</b>{p === best && <> <Badge tone="success">Best window</Badge></>}</td>
                <td>
                  {p.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  <div className="faint" style={{ fontSize: 11 }}>{active ? "overhead now" : `in ${formatDuration(inMs)}`}</div>
                </td>
                <td>{formatDuration(p.end - p.start)}</td>
                <td>{Math.round(p.maxEl)}°</td>
                <td>{azimuthName(p.path[0].az)} → {azimuthName(p.path[p.path.length - 1].az)}</td>
                <td>
                  <Badge tone={outlook.tone}>{outlook.label.split(" — ")[0]}</Badge>
                  {f && <div className="faint" style={{ fontSize: 11 }}>{Math.round(f.cloud)}% cloud · {f.precip.toFixed(1)} mm/h</div>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
