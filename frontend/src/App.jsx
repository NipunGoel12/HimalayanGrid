import React, { useEffect, useState, useCallback, Component } from "react";
import {
  Home,
  Map,
  Compass,
  Target,
  CheckSquare,
  MessageCircle,
  BookOpen,
  User,
  Download,
  RadioTower,
  Users,
  Settings as SettingsIcon,
  Layers,
  GraduationCap,
  BarChart2,
  PlayCircle,
  Mountain as MountainIcon,
  RefreshCw,
} from "lucide-react";

import { NAV_GROUPS, MOBILE_NAV, CONN_STATES } from "./constants.js";
import {
  Button,
  XpPill,
  StreakPill,
  ConnectivityStatus,
} from "./components/ui.jsx";
import { api, flushQueuedEvents } from "./services/apiClient.js";
import {
  getCachedStudent,
  getOnboarded,
  getQueuedEvents,
  getLastSync,
  setLastSync,
} from "./services/offlineStore.js";

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
  home: Home,
  map: Map,
  compass: Compass,
  target: Target,
  checkSquare: CheckSquare,
  messageCircle: MessageCircle,
  bookOpen: BookOpen,
  user: User,
  download: Download,
  radioTower: RadioTower,
  users: Users,
  settings: SettingsIcon,
  layers: Layers,
  graduationCap: GraduationCap,
  barChart2: BarChart2,
  refreshCw: RefreshCw,
};

const TITLES = {
  home: "Home",
  map: "Himalayan Map",
  explore: "Explore",
  missions: "Missions",
  quiz: "Quiz",
  guide: "Ask a Guide",
  story: "Stories",
  profile: "My Profile",
  library: "Downloads",
  satellite: "Learning Satellite",
  teacher: "Teacher Dashboard",
  settings: "Settings",
  topic: "Topic",
  courses: "Courses",
  learning: "My Learning",
  progress: "Class Progress",
  mission: "Mountain Mission",
  sync: "Sync",
  demo: "Demo Mode",
};

function normalizeStudent(s) {
  if (!s) return s;

  let weak = s.weak_topics;

  if (typeof weak === "string") {
    try {
      weak = JSON.parse(weak);
    } catch {
      weak = [];
    }
  }

  return {
    ...s,
    weak_topics: weak || [],
  };
}

class PageGuard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      crashed: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      crashed: true,
    };
  }

  componentDidCatch() {
    // Keep the application shell alive if an individual page crashes.
  }

  componentDidUpdate(prev) {
    if (
      prev.view !== this.props.view &&
      this.state.crashed
    ) {
      this.setState({
        crashed: false,
      });
    }
  }

  render() {
    if (this.state.crashed) {
      return (
        <div className="panel panel-pad">
          <div
            className="page-title"
            style={{ fontSize: 16 }}
          >
            This screen hit an error
          </div>

          <div className="page-subtitle">
            Your cached lessons and queued events are still
            on this device.
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function deriveConn({
  networkOn,
  hubOn,
  syncFlag,
}) {
  if (syncFlag === CONN_STATES.SYNCING) {
    return CONN_STATES.SYNCING;
  }

  if (syncFlag === CONN_STATES.SYNC_ERROR) {
    return CONN_STATES.SYNC_ERROR;
  }

  if (!networkOn && !hubOn) {
    return CONN_STATES.OFFLINE;
  }

  if (!networkOn && hubOn) {
    return CONN_STATES.LOCAL_HUB;
  }

  return CONN_STATES.SYNCED;
}

export default function App() {
  const [view, setView] = useState("home");

  const [networkOn, setNetworkOn] = useState(
    typeof navigator !== "undefined"
      ? navigator.onLine
      : true
  );

  const [hubOn, setHubOn] = useState(true);
  const [syncFlag, setSyncFlag] = useState(null);
  const [student, setStudent] = useState(null);
  const [onboarded, setOnboardedState] = useState(null);
  const [gamification, setGamification] = useState(null);
  const [openTopicId, setOpenTopicId] = useState(null);
  const [learningSubject, setLearningSubject] = useState(null);
  const [learningLessonId, setLearningLessonId] = useState(null);
  const [pending, setPending] = useState(0);
  const [lastSync, setLastSyncState] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [bootDone, setBootDone] = useState(false);

  const connState = deriveConn({
    networkOn,
    hubOn,
    syncFlag,
  });

  const notify = useCallback(
    (message, tone = "info") => {
      const id = Date.now();

      setToasts((t) => [
        ...t,
        {
          id,
          message,
          tone,
        },
      ]);

      setTimeout(() => {
        setToasts((t) =>
          t.filter((x) => x.id !== id)
        );
      }, 4000);
    },
    []
  );

  const setConnState = useCallback((next) => {
    if (
      next === CONN_STATES.SYNCING ||
      next === CONN_STATES.SYNC_ERROR
    ) {
      setSyncFlag(next);
    } else if (
      next === CONN_STATES.SYNCED ||
      next === "ONLINE" ||
      next === "DONE"
    ) {
      setSyncFlag(null);

      const ts = Date.now();

      setLastSyncState(ts);
      setLastSync(ts);
    } else {
      setSyncFlag(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setStudent(
          normalizeStudent(
            await api.getStudent("std-001")
          )
        );
      } catch {
        setStudent(
          normalizeStudent(
            await getCachedStudent()
          )
        );
      }

      setOnboardedState(await getOnboarded());

      setPending(
        (await getQueuedEvents()).length
      );

      setLastSyncState(
        await getLastSync()
      );

      setBootDone(true);

      try {
        await api.getLessons();
      } catch {
        // Cache if possible.
      }

      try {
        await api.getTopics(null, "std-001");
      } catch {
        // Offline.
      }

      for (const topic of [
        "Fractions",
        "Water Cycle",
        "Contour Map",
      ]) {
        try {
          await api.generateQuiz(
            "std-001",
            topic
          );
        } catch {
          // Quiz bank may not be reachable yet.
        }
      }
    })();
  }, []);

  useEffect(() => {
    const on = () => {
      setNetworkOn(true);
      notify("Connection restored. Syncing your progress...", "info");
    };

    const off = () => {
      setNetworkOn(false);
      notify("You're offline. Your learning progress will be saved on this device.", "warning");
    };

    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [notify]);

  const refreshGamification = useCallback(
    async (studentId) => {
      try {
        setGamification(
          await api.getGamification(studentId)
        );
      } catch {
        // Keep the last known gamification state.
      }
    },
    []
  );

  useEffect(() => {
    if (student) {
      refreshGamification(student.id);
    }
  }, [student, refreshGamification]);

  useEffect(() => {
    if (networkOn) {
      flushQueuedEvents().then(async (n) => {
        if (n) {
          notify(
            `${n} queued event(s) uploaded to the Local Hub.`,
            "success"
          );
        }

        setPending(
          (await getQueuedEvents()).length
        );
      });
    }
  }, [networkOn, notify]);

  const updateWeakTopics = useCallback(
    (weakTopics) => {
      setStudent((s) =>
        s
          ? {
              ...s,
              weak_topics: weakTopics,
            }
          : s
      );
    },
    []
  );

  const openTopic = useCallback((topicId) => {
    setOpenTopicId(topicId);
    setView("topic");
  }, []);

  const openLesson = useCallback(
    (lessonId, subject) => {
      setLearningLessonId(lessonId);
      setLearningSubject(subject || null);
      setView("learning");
    },
    []
  );

  function onOnboardingDone(avatar) {
    setStudent((s) =>
      s
        ? {
            ...s,
            avatar,
          }
        : s
    );

    setOnboardedState(true);
  }

  function go(id) {
    setView(id);
  }

  async function retrySync() {
    setView("sync");
    setConnState(CONN_STATES.SYNCING);

    try {
      const res = await api.runSync({
        studentId: student?.id || "std-001",
        simulateFailure: false,
      });

      setConnState(
        res.status === "SYNC_ERROR"
          ? CONN_STATES.SYNC_ERROR
          : CONN_STATES.SYNCED
      );
    } catch {
      setConnState(
        CONN_STATES.SYNC_ERROR
      );
    }
  }

  if (!bootDone || onboarded === null) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          color: "var(--text-muted)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            className="brand-mark"
            style={{
              margin: "0 auto 10px",
            }}
          >
            <MountainIcon size={16} />
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 13,
            }}
          >
            Loading Himalayan Learning Grid…
          </div>
        </div>
      </div>
    );
  }

  if (bootDone && !student) {
    return (
      <div
        className="panel panel-pad"
        style={{
          maxWidth: 420,
          margin: "12vh auto",
        }}
      >
        <div className="page-title">
          Local Hub unavailable
        </div>

        <div className="page-subtitle">
          No student profile is cached on this
          device yet. Start the backend once so
          the explorer profile can be stored
          offline.
        </div>
      </div>
    );
  }

  /*
   * FIX:
   * The previous version had a stray closing brace
   * after the Onboarding return.
   *
   * This conditional makes that brace valid and
   * ensures onboarding is shown only when required.
   */
  if (!onboarded) {
    return (
      <Onboarding
        student={student}
        onDone={onOnboardingDone}
      />
    );
  }

  const pageProps = {
    student,
    gamification,
    setView: go,
    openTopic,
    openLesson,
    networkOn,
    hubOn,
    connState,
    setConnState,
    notify,
  };

  return (
    <div className="layout">
      <aside
        className="sidebar"
        aria-label="Primary"
      >
        <div className="sidebar-header">
          <div className="brand-mark">
            <MountainIcon
              size={16}
              strokeWidth={2.2}
            />
          </div>

          <div>
            <div className="brand-name">
              Himalayan Learning Grid
            </div>

            <div className="brand-sub">
              Learn beyond the network
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="nav-group-label">
                {group.label}
              </div>

              {group.items.map((n) => {
                const Icon = ICONS[n.icon];

                const active =
                  view === n.id ||
                  (n.id === "explore" &&
                    view === "topic") ||
                  (n.id === "learning" &&
                    view === "mission" &&
                    false);

                return (
                  <button
                    key={n.id}
                    className={`nav-btn ${
                      active ? "active" : ""
                    }`}
                    onClick={() => go(n.id)}
                  >
                    {Icon && (
                      <Icon
                        size={16}
                        strokeWidth={2}
                      />
                    )}

                    {n.label}
                  </button>
                );
              })}
            </div>
          ))}

          <div className="nav-divider" />

          <button
            className="nav-btn subtle"
            onClick={() => go("demo")}
          >
            <PlayCircle
              size={16}
              strokeWidth={2}
            />
            Demo Mode
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="profile-row">
            <div className="avatar">
              {student.avatar || "🎓"}
            </div>

            <div>
              <div className="profile-name">
                {student.name}
              </div>

              <div className="profile-role">
                Grade {student.grade} ·{" "}
                {student.village}
              </div>
            </div>
          </div>

          {gamification && (
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 8,
                flexWrap: "wrap",
              }}
            >
              <XpPill
                xp={gamification.xp}
              />

              <StreakPill
                streak={
                  gamification.streak
                }
              />
            </div>
          )}
        </div>
      </aside>

      <div className="main">
        <header className="header">
          <div className="header-title">
            {TITLES[view] ||
              "Himalayan Learning Grid"}
          </div>

          <div className="header-controls">
            <ConnectivityStatus
              state={connState}
              mode="expanded"
              pending={pending}
              lastSync={lastSync}
              onRetry={retrySync}
            />

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
                color: "var(--text-muted)",
              }}
            >
              <input
                type="checkbox"
                checked={hubOn}
                onChange={(e) =>
                  setHubOn(e.target.checked)
                }
              />

              Local Hub
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
                color: "var(--text-muted)",
              }}
            >
              <input
                type="checkbox"
                checked={networkOn}
                onChange={(e) => {
                  setNetworkOn(
                    e.target.checked
                  );

                  if (e.target.checked) {
                    setHubOn(true);
                  }
                }}
              />

              Satellite / Internet
            </label>

            <Button
              small
              variant={
                networkOn
                  ? "ghost"
                  : "secondary"
              }
              onClick={() => {
                setNetworkOn(false);
                setHubOn(false);

                notify(
                  "You're offline. Cached lessons stay available.",
                  "warning"
                );
              }}
            >
              Force network off
            </Button>
          </div>
        </header>

        <div className="view-body scroll">
          {connState ===
            CONN_STATES.OFFLINE && (
            <div
              className="offline-banner"
              role="status"
            >
              <span>
                You're offline, but your
                saved lessons are available.
              </span>

              <span className="faint">
                Progress is stored on this
                device and will sync later.
              </span>
            </div>
          )}

          {connState ===
            CONN_STATES.LOCAL_HUB && (
            <div
              className="offline-banner"
              role="status"
              style={{
                borderColor:
                  "rgba(108,197,255,.3)",
                background:
                  "var(--info-bg)",
              }}
            >
              <span>
                Local Hub connected. Satellite /
                internet is off — Local AI still
                works.
              </span>
            </div>
          )}

          <div
            key={view}
            className="page-enter"
          >
            <PageGuard view={view}>
              {view === "home" && (
                <Home_ {...pageProps} />
              )}

              {view === "map" && (
                <HimalayanMap
                  student={student}
                  openTopic={openTopic}
                />
              )}

              {view === "explore" && (
                <Explore
                  student={student}
                  openTopic={openTopic}
                />
              )}

              {view === "missions" && (
                <Missions
                  student={student}
                  openTopic={openTopic}
                  setView={go}
                />
              )}

              {view === "topic" && (
                <TopicDetail
                  topicId={openTopicId}
                  student={student}
                  setView={go}
                  onGamificationChange={
                    setGamification
                  }
                />
              )}

              {view === "quiz" && (
                <Quiz
                  student={student}
                  onWeakTopicsChanged={
                    updateWeakTopics
                  }
                  connState={connState}
                />
              )}

              {view === "guide" && (
                <AskAGuide
                  student={student}
                  networkOn={networkOn}
                  hubOn={hubOn}
                />
              )}

              {view === "story" && (
                <StoryMode />
              )}

              {view === "profile" && (
                <Profile
                  student={student}
                  gamification={gamification}
                  openTopic={openTopic}
                  setView={go}
                />
              )}

              {view === "library" && (
                <Downloads
                  setView={go}
                  openLesson={openLesson}
                />
              )}

              {view === "satellite" && (
                <LearningSatellite
                  setView={go}
                  student={student}
                  networkOn={networkOn}
                  connState={connState}
                  setConnState={setConnState}
                  setNetworkOn={
                    setNetworkOn
                  }
                  setHubOn={setHubOn}
                />
              )}

              {view === "courses" && (
                <Courses
                  openLesson={openLesson}
                  setView={go}
                />
              )}

              {view === "learning" && (
                <MyLearning
                  student={student}
                  initialLessonId={
                    learningLessonId
                  }
                  initialSubject={
                    learningSubject
                  }
                  setView={go}
                />
              )}

              {view === "progress" && (
                <ProgressView
                  student={student}
                />
              )}

              {view === "mission" && (
                <Mission
                  student={student}
                />
              )}

              {view === "sync" && (
                <Sync
                  student={student}
                  networkOn={networkOn}
                  connState={connState}
                  setConnState={
                    setConnState
                  }
                  setNetworkOn={
                    setNetworkOn
                  }
                  setHubOn={setHubOn}
                />
              )}

              {view === "teacher" && (
                <Teacher
                  connState={connState}
                />
              )}

              {view === "settings" && (
                <SettingsPage
                  student={student}
                  setView={go}
                  connState={connState}
                />
              )}

              {view === "demo" && (
                <Demo
                  setView={go}
                  setNetworkOn={
                    setNetworkOn
                  }
                  setHubOn={setHubOn}
                  setConnState={
                    setConnState
                  }
                  student={student}
                />
              )}
            </PageGuard>
          </div>
        </div>

        <nav
          className="bottom-nav"
          aria-label="Mobile"
        >
          {MOBILE_NAV.map((n) => {
            const Icon = ICONS[n.icon];

            const active =
              view === n.id;

            return (
              <button
                key={n.id}
                className={
                  active ? "active" : ""
                }
                onClick={() => go(n.id)}
              >
                {Icon && (
                  <Icon size={18} />
                )}

                {n.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div
        className="toast-stack"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast"
          >
            <div>{t.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}