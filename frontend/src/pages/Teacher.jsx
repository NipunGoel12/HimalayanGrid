import React, { useEffect, useState } from "react";
import { api } from "../services/apiClient.js";
import { Button, Badge, StatRow, EmptyState } from "../components/ui.jsx";
import { Users } from "lucide-react";

export default function Teacher({ connState }) {
  const [dash, setDash] = useState(null);
  const [requestTopic, setRequestTopic] = useState("Contour Map");

  async function load() {
    try { setDash(await api.getTeacherDashboard()); } catch { setDash(null); }
  }
  useEffect(() => { load(); }, []);

  async function sendRequest() {
    await api.requestPackage({ topic: requestTopic });
    await load();
  }

  if (!dash) {
    return <EmptyState icon={Users} title="Teacher dashboard unavailable" body="Connect to the Local Hub or Satellite Sync to load class data." />;
  }

  const classAvg = Math.round(dash.students.reduce((a, s) => a + s.avgScore, 0) / dash.students.length);

  return (
    <div className="view-max">
      <div className="section">
        <div className="page-title">Teacher Dashboard</div>
        <div className="page-subtitle">{dash.teacherName} · School connection: {connState.replace("_", " ")}</div>
      </div>

      <div className="section">
        <StatRow
          items={[
            { label: "Students", value: dash.students.length },
            { label: "Class average", value: classAvg + "%" },
            { label: "Pending questions", value: dash.pendingQuestions.length },
            { label: "Package requests", value: dash.requestedPackages.length },
          ]}
        />
      </div>

      <div className="panel section">
        <div className="panel-header"><div className="section-title">Students</div></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Grade</th><th>Weak topics</th><th>Avg. score</th></tr></thead>
            <tbody>
              {dash.students.map((s) => (
                <tr key={s.name}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td className="muted">{s.grade}</td>
                  <td>{s.weakTopics.map((t) => <Badge key={t} tone="warning" style={{ marginRight: 4 }}>{t}</Badge>)}</td>
                  <td style={{ color: s.avgScore >= 70 ? "var(--success)" : "var(--warning)", fontWeight: 600 }}>{s.avgScore}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="panel">
          <div className="panel-header"><div className="section-title">Pending student questions</div></div>
          {dash.pendingQuestions.length === 0 ? (
            <div className="panel-body muted" style={{ fontSize: 12.5 }}>No pending questions.</div>
          ) : dash.pendingQuestions.map((q, i) => (
            <div key={i} className="panel-row" style={{ display: "block" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{q.student}</div>
              <div className="muted" style={{ fontSize: 12.5 }}>{q.question}</div>
              <Badge tone="neutral" style={{ marginTop: 4 }}>{q.topic}</Badge>
            </div>
          ))}
        </div>

        <div className="panel panel-pad">
          <div className="section-title" style={{ marginBottom: 10 }}>Request a learning package</div>
          <label className="field-label">Topic</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <select value={requestTopic} onChange={(e) => setRequestTopic(e.target.value)} style={{ flex: 1 }}>
              {["Fractions", "Water Cycle", "Contour Map"].map((t) => <option key={t}>{t}</option>)}
            </select>
            <Button small onClick={sendRequest}>Request</Button>
          </div>
          <div className="faint" style={{ fontSize: 11.5 }}>Teacher requests add +4 to a package's priority score in the Sync Center.</div>
        </div>
      </div>

      <div className="panel section">
        <div className="panel-header"><div className="section-title">Active package requests</div></div>
        {dash.requestedPackages.length === 0 ? (
          <div className="panel-body muted" style={{ fontSize: 12.5 }}>No requests yet.</div>
        ) : dash.requestedPackages.map((r) => (
          <div key={r.id} className="panel-row"><span style={{ fontSize: 13 }}>{r.topic || r.package_id}</span><span className="muted" style={{ fontSize: 12 }}>{r.note}</span></div>
        ))}
      </div>
    </div>
  );
}
