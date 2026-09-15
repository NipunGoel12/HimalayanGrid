export const MISSION_TITLE = "Understand Your Mountain";
export const MISSION_VILLAGE = "Lachen, North Sikkim";

/** Fixed connectivity states used by the Local Hub / sync backend. Do not rename. */
export const CONN_STATES = {
  OFFLINE: "OFFLINE",
  LOCAL_HUB: "LOCAL_HUB",
  SYNCING: "SYNCING",
  SYNCED: "SYNCED",
  SYNC_ERROR: "SYNC_ERROR",
};

export const CONN_COPY = {
  OFFLINE: {
    label: "Offline",
    detail: "Cached learning available",
    tone: "neutral",
  },
  LOCAL_HUB: {
    label: "Local Hub",
    detail: "Connected to local learning network",
    tone: "info",
  },
  SYNCING: {
    label: "Syncing",
    detail: "Uploading queued items…",
    tone: "info",
  },
  SYNCED: {
    label: "Synced",
    detail: "Progress is up to date",
    tone: "success",
  },
  SYNC_ERROR: {
    label: "Sync error",
    detail: "Tap to retry",
    tone: "danger",
  },
};

export const PACKAGE_STATUSES = ["AVAILABLE", "QUEUED", "DOWNLOADING", "DOWNLOADED", "FAILED"];

export const DEMO_CURRICULUM = [
  { match: /fraction/i, label: "Fractions", difficulty: "Core", minutes: 12 },
  { match: /water/i, label: "Water Cycle", difficulty: "Core", minutes: 14 },
  { match: /contour/i, label: "Contour Maps", difficulty: "Practice", minutes: 10 },
  { match: /himalay|ladakh|sikkim|everest|kanchen/i, label: "Himalayan Geography", difficulty: "Explore", minutes: 8 },
  { match: /forest|glacier|climate|panda|leopard|environment/i, label: "Environment", difficulty: "Explore", minutes: 8 },
  { match: /satellite|space/i, label: "Basic Satellite Communication", difficulty: "Mission", minutes: 9 },
];

export const NAV_GROUPS = [
  {
    label: "Learn",
    items: [
      { id: "home", label: "Home", icon: "home" },
      { id: "explore", label: "Explore", icon: "compass" },
      { id: "courses", label: "Courses", icon: "layers" },
      { id: "learning", label: "My Learning", icon: "graduationCap" },
    ],
  },
  {
    label: "Practice",
    items: [
      { id: "quiz", label: "Quiz", icon: "checkSquare" },
      { id: "missions", label: "Missions", icon: "target" },
      { id: "guide", label: "Ask a Guide", icon: "messageCircle" },
    ],
  },
  {
    label: "Offline & Sync",
    items: [
      { id: "library", label: "Downloads", icon: "download" },
      { id: "sync", label: "Sync", icon: "refreshCw" },
      { id: "satellite", label: "Satellite", icon: "radioTower" },
    ],
  },
  {
    label: "More",
    items: [
      { id: "map", label: "Himalayan Map", icon: "map" },
      { id: "story", label: "Stories", icon: "bookOpen" },
      { id: "profile", label: "My Profile", icon: "user" },
      { id: "progress", label: "Class Progress", icon: "barChart2" },
      { id: "teacher", label: "Teacher", icon: "users" },
      { id: "settings", label: "Settings", icon: "settings" },
    ],
  },
];

export const MOBILE_NAV = [
  { id: "home", label: "Home", icon: "home" },
  { id: "explore", label: "Explore", icon: "compass" },
  { id: "learning", label: "Learn", icon: "graduationCap" },
  { id: "missions", label: "Missions", icon: "target" },
  { id: "profile", label: "Profile", icon: "user" },
];

export const CATEGORIES = {
  mountains: { label: "Mountains", icon: "🏔️", color: "#4DA3FF" },
  rivers: { label: "Rivers", icon: "🌊", color: "#6CC5FF" },
  animals: { label: "Animals", icon: "🐆", color: "#FFC857" },
  forests: { label: "Forests", icon: "🌲", color: "#45D483" },
  weather: { label: "Weather", icon: "🌦️", color: "#6CC5FF" },
  history: { label: "History", icon: "📜", color: "#C4A574" },
  culture: { label: "Culture", icon: "🎭", color: "#E08BB0" },
  science: { label: "Science", icon: "🔬", color: "#8B9CFF" },
  space: { label: "Space", icon: "🌌", color: "#6A7AD8" },
  satellites: { label: "Satellites", icon: "🛰️", color: "#4DA3FF" },
};

export const MAP_MODES = [
  { id: "geography", label: "Geography", icon: "🌍", categories: ["mountains", "rivers"] },
  { id: "history", label: "History", icon: "📜", categories: ["history"] },
  { id: "environment", label: "Environment", icon: "🌱", categories: ["animals", "forests"] },
  { id: "culture", label: "Culture", icon: "🧑‍🤝‍🧑", categories: ["culture"] },
  { id: "science", label: "Science", icon: "🔬", categories: ["science", "weather", "space"] },
  { id: "satellite", label: "Satellite", icon: "🛰️", categories: ["satellites"] },
];

export const JOURNEY_STEPS = [
  { id: "mountains", label: "Explore Himalayas", icon: "🏔️" },
  { id: "forests", label: "Discover Forests", icon: "🌲" },
  { id: "rivers", label: "Learn Rivers", icon: "🌊" },
  { id: "culture", label: "Explore Villages", icon: "🏘️" },
  { id: "history", label: "Discover History", icon: "📜" },
  { id: "science", label: "Science Expedition", icon: "🔬" },
  { id: "satellites", label: "Satellite Mission", icon: "🛰️" },
];

export const AVATAR_OPTIONS = ["🧑‍🚀", "🧗", "🦁", "🐼", "🐧", "🦉", "🐲", "🧑‍🌾", "🐯", "🦊", "🐰", "🐨"];
