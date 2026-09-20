import React, { useState, useEffect } from "react";
import { Check, ArrowRight } from "lucide-react";
import {
  getLocalProfile,
  updateLocalProfile,
  buildSyntheticStudent,
} from "../services/localProfile.js";
import { cacheStudent } from "../services/offlineStore.js";

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);
const LANGUAGES = ["Hindi", "English", "Nepali", "Tibetan", "Ladakhi", "Garhwali"];

/**
 * Reusable local profile editor.
 *
 * Usage:
 *   <ProfileEditor onSave={(updatedProfile) => { ... }} />
 *
 * This component:
 *  - Loads the current local profile
 *  - Allows editing name, grade, language, region
 *  - Validates required fields
 *  - Saves via updateLocalProfile() — ID is NEVER regenerated
 *  - Updates the IndexedDB cache so the existing app picks up changes
 *  - NEVER calls any backend API or modifies backend data
 */
export default function ProfileEditor({ onSave, className = "" }) {
  const profile = getLocalProfile();

  const [name, setName] = useState(profile?.name || "");
  const [grade, setGrade] = useState(profile?.grade?.toString() || "");
  const [language, setLanguage] = useState(profile?.language || "Hindi");
  const [region, setRegion] = useState(profile?.region || "");
  const [touched, setTouched] = useState({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Reset saved indicator after 3 seconds */
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  const errors = {
    name: touched.name && !name.trim() ? "Name is required" : null,
    grade: touched.grade && !grade ? "Grade is required" : null,
    language: touched.language && !language ? "Language is required" : null,
  };

  const canSubmit = name.trim().length > 0 && grade !== "" && language !== "";

  function touch(field) {
    setTouched(prev => ({ ...prev, [field]: true }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ name: true, grade: true, language: true });
    if (!canSubmit) return;

    setSaving(true);

    /*
     * updateLocalProfile() PRESERVES the existing ID.
     * Before: local-a83f21 → After: local-a83f21.
     */
    const updated = updateLocalProfile({
      name: name.trim(),
      grade: Number(grade),
      language,
      region: region.trim() || null,
    });

    /*
     * Update the IndexedDB cache so the app shell (sidebar, greeting)
     * picks up the new name/grade/village without reloading.
     * This writes only to the frontend cache — backend is untouched.
     */
    const syntheticStudent = buildSyntheticStudent(updated);
    await cacheStudent(syntheticStudent);

    setSaving(false);
    setSaved(true);

    if (onSave) onSave(updated);
  }

  if (!profile) {
    return (
      <div className={`pe-container ${className}`}>
        <p style={{ color: "var(--lp-text-muted, var(--text-muted))", fontSize: 14 }}>
          No local profile found. Complete onboarding first.
        </p>
      </div>
    );
  }

  return (
    <div className={`pe-container ${className}`}>
      <div className="pe-header">
        <h2>Edit Profile</h2>
        <p>Changes are saved to this device only.</p>
      </div>

      <form className="ob-form" onSubmit={handleSubmit}>
        {/* Name */}
        <div className="ob-field">
          <label htmlFor="pe-name">Name</label>
          <input
            id="pe-name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => touch("name")}
            className={errors.name ? "ob-field-error" : ""}
            autoComplete="name"
          />
          {errors.name && <div className="ob-error-text">{errors.name}</div>}
        </div>

        {/* Grade */}
        <div className="ob-field">
          <label htmlFor="pe-grade">Grade</label>
          <select
            id="pe-grade"
            value={grade}
            onChange={e => setGrade(e.target.value)}
            onBlur={() => touch("grade")}
            className={errors.grade ? "ob-field-error" : ""}
          >
            <option value="" disabled>Select grade</option>
            {GRADES.map(g => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>
          {errors.grade && <div className="ob-error-text">{errors.grade}</div>}
        </div>

        {/* Language */}
        <div className="ob-field">
          <label htmlFor="pe-lang">Preferred language</label>
          <select
            id="pe-lang"
            value={language}
            onChange={e => setLanguage(e.target.value)}
            onBlur={() => touch("language")}
            className={errors.language ? "ob-field-error" : ""}
          >
            <option value="" disabled>Select language</option>
            {LANGUAGES.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          {errors.language && <div className="ob-error-text">{errors.language}</div>}
        </div>

        {/* Region */}
        <div className="ob-field">
          <label htmlFor="pe-region">
            Region / Village
            <span className="ob-optional">Optional</span>
          </label>
          <input
            id="pe-region"
            type="text"
            placeholder="Village or region name"
            value={region}
            onChange={e => setRegion(e.target.value)}
            autoComplete="off"
          />
        </div>

        {/* Submit */}
        <button type="submit" className="ob-submit" disabled={saving}>
          {saving ? "Saving…" : "Save Changes"} <ArrowRight size={16} />
        </button>

        {saved && (
          <div className="pe-saved">
            <Check size={14} /> Profile updated successfully
          </div>
        )}
      </form>

      {/* Profile ID — read-only reference */}
      <div className="pe-id">
        Profile ID: {profile.id}
      </div>
    </div>
  );
}
