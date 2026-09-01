import React, { useEffect, useState, useCallback } from "react";
import {
  Home, Map, Compass, Target, CheckSquare, MessageCircle, BookOpen,
  User, Download, RadioTower, Users, Settings as SettingsIcon,
  Layers, GraduationCap, BarChart2, PlayCircle, Mountain as MountainIcon,
} from "lucide-react";
import { NAV_GROUPS } from "./constants.js";
import { ConnectionBadge, Button, XpPill, StreakPill } from "./components/ui.jsx";
import { api, flushQueuedEvents } from "./services/apiClient.js";
import { getCachedStudent, getOnboarded } from "./services/offlineStore.js";

import Onboarding from "./pages/Onboarding.jsx";
import Home_ from "./pages/Home.jsx";
import HimalayanMap from "./pages/HimalayanMap.jsx";
import Explore from "./pages/Explore.jsx";
import Missions from "./pages/Missions.jsx";
import TopicDetail from "./pages/TopicDetail.jsx";
import AskAGuide from "./pages/AskAGuide.jsx";
import StoryMode from "./pages/StoryMode.jsx";
import Profile from "./pages/Profile.jsx";
import LearningSatellite from "./pages/LearningSatellite.jsx";
import Downloads from "./pages/Downloads.jsx";
import Courses from "./pages/Courses.jsx";
import MyLearning from "./pages/MyLearning.jsx";
import ProgressView from "./pages/Progress.jsx";
import Quiz from "./pages/Quiz.jsx";
import Mission from "./pages/Mission.jsx";
import Sync from "./pages/Sync.jsx";
import Teacher from "./pages/Teacher.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import Demo from "./pages/Demo.jsx";

const ICONS = {
  home: Home, map: Map, compass: Compass, target: Target, checkSquare: CheckSquare,
  messageCircle: MessageCircle, bookOpen: BookOpen, user: User, download: Download,
  radioTower: RadioTower, users: Users, settings: SettingsIcon,
  layers: Layers, graduationCap: GraduationCap, barChart2: BarChart2,
};

const TITLES = {
  home: "Home", map: "Himalayan Map", explore: "Explore", missions: "Missions",
  quiz: "Quizzes", guide: "Ask a Guide", story: "Stories", profile: "My Profile",
  library: "Offline Library", satellite: "Learning Satellite", teacher: "Teacher Dashboard",
  settings: "Settings", topic: "Explore", courses: "Courses", learning: "My Learning",
  progress: "Class Progress", mission: "Mountain Mission", sync: "Sync Center", demo: "Demo Mode",
};

export default function App() {
  const [view, setView] = useState("home");
  const [networkOn, setNetworkOn] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [hubOn, setHubOn] = useState(true);
  const [connState, setConnState] = useState("OFFLINE");
  const [student, setStudent] = useState(null);
  const [onboarded, setOnboardedState] = useState(null); // null = not checked yet
  const [gamification, setGamification] = useState(null);
  const [openTopicId, setOpenTopicId] = useState(null);
  const [learningSubject, setLearningSubject] = useState(null);
  const [learningLessonId, setLearningLessonId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setStudent(await api.getStudent("std-001"));
      } catch {
        setStudent(await getCachedStudent());
      }
      setOnboardedState(await getOnboarded());
    })();
  }, []);

  const refreshGamification = useCallback(async (studentId) => {
    try { setGamification(await api.getGamification(studentId)); } catch { /* offline: keep last known */ }
  }, []);

  useEffect(() => {
    if (student) refreshGamification(student.id);
  }, [student, refreshGamification]);

  useEffect(() => {
    if (!networkOn && !hubOn) setConnState("OFFLINE");
    else if (!networkOn && hubOn) setConnState("LOCAL_HUB");
    else if (networkOn) setConnState((s) => (s === "SYNCING" || s === "SYNC_ERROR" ? s : "ONLINE"));
  }, [networkOn, hubOn]);

  useEffect(() => {
    if (networkOn) flushQueuedEvents();
  }, [networkOn]);

  const updateWeakTopics = useCallback((weakTopics) => {
    setStudent((s) => (s ? { ...s, weak_topics: weakTopics } : s));
  }, []);

  const openTopic = useCallback((topicId) => {
    setOpenTopicId(topicId);
    setView("topic");
  }, []);

  const openLesson = useCallback((lessonId, subject) => {
    setLearningLessonId(lessonId);
    setLearningSubject(subject || null);
    setView("learning");
  }, []);

  function onOnboardingDone(avatar) {
    setStudent((s) => (s ? { ...s, avatar } : s));
    setOnboardedState(true);
  }

  if (!student || onboarded === null) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "var(--text-muted)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28 }}>🏔️</div>
          <div style={{ marginTop: 8, fontSize: 13 }}>Loading your explorer profile…</div>
        </div>
      </div>
    );
  }

  if (!onboarded) {
    return <Onboarding student={student} onDone={onOnboardingDone} />;
  }

  return (
    <div className="layout">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="brand-mark"><MountainIcon size={16} strokeWidth={2.2} /></div>
          <div>
            <div className="brand-name">Himalayan Learning Grid</div>
            <div className="brand-sub">Explore &amp; learn offline</div>
          </div>
        </div>

        <div className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="nav-group-label">{group.label}</div>
              {group.items.map((n) => {
                const Icon = ICONS[n.icon];
                const active = view === n.id || (n.id === "explore" && view === "topic");
                return (
                  <button key={n.id} className={`nav-btn ${active ? "active" : ""}`} onClick={() => setView(n.id)}>
                    {Icon && <Icon size={16} strokeWidth={2} />}
                    {n.label}
                  </button>
                );
              })}
            </div>
          ))}
          <div className="nav-divider" />
          <button className="nav-btn subtle" onClick={() => setView("demo")}>
            <PlayCircle size={16} strokeWidth={2} />
            Demo Mode
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="profile-row">
            <div className="avatar">{student.avatar || "🎓"}</div>
            <div>
              <div className="profile-name">{student.name}</div>
              <div className="profile-role">Grade {student.grade} · Explorer</div>
            </div>
          </div>
          {gamification && (
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <XpPill xp={gamification.xp} />
              <StreakPill streak={gamification.streak} />
            </div>
          )}
        </div>
      </div>

      <div className="main">
        <div className="header">
          <div className="header-title">{TITLES[view] || "Himalayan Learning Grid"}</div>
          <div className="header-controls">
            <ConnectionBadge state={connState} />
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-muted)" }}>
              <input type="checkbox" checked={hubOn} onChange={(e) => setHubOn(e.target.checked)} /> Local Hub
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-muted)" }}>
              <input type="checkbox" checked={networkOn} onChange={(e) => setNetworkOn(e.target.checked)} /> Satellite / Internet
            </label>
            <Button small variant={networkOn ? "ghost" : "secondary"} onClick={() => { setNetworkOn(false); setHubOn(false); }}>
              Force network off
            </Button>
          </div>
        </div>

        <div className="view-body scroll">
          {view === "home" && <Home_ student={student} gamification={gamification} setView={setView} openTopic={openTopic} />}
          {view === "map" && <HimalayanMap student={student} openTopic={openTopic} />}
          {view === "explore" && <Explore student={student} openTopic={openTopic} />}
          {view === "missions" && <Missions student={student} openTopic={openTopic} setView={setView} />}
          {view === "topic" && (
            <TopicDetail
              topicId={openTopicId}
              student={student}
              setView={setView}
              onGamificationChange={setGamification}
            />
          )}
          {view === "quiz" && <Quiz student={student} onWeakTopicsChanged={updateWeakTopics} />}
          {view === "guide" && <AskAGuide student={student} networkOn={networkOn} />}
          {view === "story" && <StoryMode />}
          {view === "profile" && <Profile student={student} gamification={gamification} openTopic={openTopic} setView={setView} />}
          {view === "library" && <Downloads />}
          {view === "satellite" && <LearningSatellite setView={setView} />}
          {view === "courses" && <Courses openLesson={openLesson} />}
          {view === "learning" && (
            <MyLearning student={student} initialLessonId={learningLessonId} initialSubject={learningSubject} setView={setView} />
          )}
          {view === "progress" && <ProgressView student={student} />}
          {view === "mission" && <Mission student={student} />}
          {view === "sync" && <Sync student={student} networkOn={networkOn} connState={connState} setConnState={setConnState} />}
          {view === "teacher" && <Teacher connState={connState} />}
          {view === "settings" && <SettingsPage student={student} setView={setView} />}
          {view === "demo" && (
            <Demo setView={setView} setNetworkOn={setNetworkOn} setHubOn={setHubOn} setConnState={setConnState} student={student} />
          )}
        </div>
      </div>
    </div>
  );
}
