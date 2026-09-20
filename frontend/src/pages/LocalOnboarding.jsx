import React, { useState } from "react";
import { Mountain, Check, ArrowRight } from "lucide-react";
import {
  createLocalProfile,
  buildSyntheticStudent,
  getTheme,
} from "../services/localProfile.js";
import { cacheStudent, setOnboarded } from "../services/offlineStore.js";
import "../landingPage.css";

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);
const LANGUAGES = ["Hindi", "English", "Nepali", "Tibetan", "Ladakhi", "Garhwali"];

/**
 * Local onboarding — premium profile creation screen.
 *
 * IMPORTANT:
 *  - No network calls. No backend API. Pure offline.
 *  - Uses createLocalProfile() which generates a stable "local-{id}".
 *  - NEVER overwrites or modifies backend/database seed data.
 */
export default function LocalOnboarding({ onComplete }) {
  const theme = getTheme();

  /* Form state */
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [language, setLanguage] = useState("Hindi");
  const [region, setRegion] = useState("");

  /* Validation state */
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);

  /* Success state */
  const [success, setSuccess] = useState(false);
  const [createdProfile, setCreatedProfile] = useState(null);

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

    /* Touch all fields to show any errors */
    setTouched({ name: true, grade: true, language: true });

    if (!canSubmit) return;
    setSaving(true);

    /* 1. Create local profile (generates a stable local-{id}) */
    const profile = createLocalProfile({
      name: name.trim(),
      grade: Number(grade),
      language,
      region: region.trim() || null,
    });

    /*
     * 2. Build synthetic student (frontend compatibility shim).
     *    NEVER calls backend API. NEVER modifies backend data.
     */
    const syntheticStudent = buildSyntheticStudent(profile);

    /*
     * 3. Cache to IndexedDB for the existing app's getCachedStudent().
     *    This writes only to the frontend cache — backend is untouched.
     */
    await cacheStudent(syntheticStudent);

    /* 4. Skip the existing avatar-picker onboarding */
    await setOnboarded(true);

    /* 5. Show success screen */
    setCreatedProfile(profile);
    setSuccess(true);
  }

  function enterApp() {
    onComplete(buildSyntheticStudent(createdProfile));
  }

  /* ── Success state ───────────────────────────────────────────────────── */
  if (success && createdProfile) {
    return (
      <div className="ob-screen" data-theme={theme}>
        <div className="ob-glow" />
        <div className="ob-card">
          <div className="ob-success">
            <div className="ob-success-check">
              <Check size={24} strokeWidth={2.5} />
            </div>
            <h2>
              You're ready,<br />{createdProfile.name.split(" ")[0]}.
            </h2>
            <button className="ob-submit" onClick={enterApp}>
              Enter Himalayan Learning Grid <ArrowRight size={16} />
            </button>
          </div>
          <div className="ob-privacy">
            Your profile is stored on this device only.
          </div>
        </div>
      </div>
    );
  }

  /* ── Form state ──────────────────────────────────────────────────────── */
  return (
    <div className="ob-screen" data-theme={theme}>
      <div className="ob-glow" />

      <div className="ob-card">
        <div className="ob-logo">
          <span className="ob-logo-mark">
            <Mountain size={16} strokeWidth={2.4} />
          </span>
          <span className="ob-logo-text">Himalayan Learning Grid</span>
        </div>

        <div className="ob-header">
          <h1>Welcome to<br />Himalayan Learning Grid</h1>
          <p>Let's create your learning profile.</p>
        </div>

        <form className="ob-form" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="ob-field">
            <label htmlFor="ob-name">What's your name?</label>
            <input
              id="ob-name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => touch("name")}
              className={errors.name ? "ob-field-error" : ""}
              autoFocus
              autoComplete="name"
            />
            {errors.name && <div className="ob-error-text">{errors.name}</div>}
          </div>

          {/* Grade */}
          <div className="ob-field">
            <label htmlFor="ob-grade">What grade are you in?</label>
            <select
              id="ob-grade"
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
            <label htmlFor="ob-lang">Preferred language</label>
            <select
              id="ob-lang"
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
            <label htmlFor="ob-region">
              Where are you learning from?
              <span className="ob-optional">Optional</span>
            </label>
            <input
              id="ob-region"
              type="text"
              placeholder="Village or region name"
              value={region}
              onChange={e => setRegion(e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="ob-submit"
            disabled={saving}
          >
            {saving ? "Creating profile…" : "Continue Learning"} <ArrowRight size={16} />
          </button>
        </form>

        <div className="ob-privacy">
          Your profile is stored on this device only. No internet required.
        </div>
      </div>
    </div>
  );
}
