import React, { useState } from "react";
import { AvatarPicker, Button } from "../components/ui.jsx";
import { AVATAR_OPTIONS } from "../constants.js";
import { api } from "../services/apiClient.js";
import { setOnboarded } from "../services/offlineStore.js";

export default function Onboarding({ student, onDone }) {
  const [avatar, setAvatar] = useState(student.avatar || AVATAR_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  async function start() {
    setSaving(true);
    try {
      await api.updateProfile(student.id, { avatar });
    } catch { /* offline: keep going, avatar will sync later */ }
    await setOnboarded(true);
    onDone(avatar);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 20 }}>
      <div className="panel panel-pad" style={{ maxWidth: 440, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 40 }}>🏔️</div>
          <div className="page-title" style={{ marginTop: 8 }}>Welcome, Explorer!</div>
          <div className="page-subtitle">Pick your explorer avatar to begin your Himalayan journey.</div>
        </div>

        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 56, marginBottom: 4 }}>{avatar}</div>
          <div className="muted" style={{ fontSize: 12.5 }}>{student.name} · Grade {student.grade}</div>
        </div>

        <label className="field-label">Choose your avatar</label>
        <AvatarPicker options={AVATAR_OPTIONS} value={avatar} onChange={setAvatar} />

        <Button style={{ width: "100%", justifyContent: "center", marginTop: 20 }} onClick={start} disabled={saving}>
          {saving ? "Setting up your journey…" : "Start exploring"}
        </Button>
        <div className="faint" style={{ fontSize: 11, textAlign: "center", marginTop: 10 }}>
          No photo needed — your avatar keeps your profile safe and fun.
        </div>
      </div>
    </div>
  );
}
