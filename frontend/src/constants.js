export const MISSION_TITLE = "Understand Your Mountain";
export const MISSION_VILLAGE = "Lachen, North Sikkim";

// Child-first application navigation. Teacher/Settings stay separate and
// professional in tone (per the redesign brief) rather than blended into the
// exploration experience.
export const NAV_GROUPS = [
  {
    label: "Explore",
    items: [
      { id: "home", label: "Home", icon: "home" },
      { id: "map", label: "Himalayan Map", icon: "map" },
      { id: "explore", label: "Explore Topics", icon: "compass" },
      { id: "missions", label: "Missions", icon: "target" },
      { id: "quiz", label: "Quizzes", icon: "checkSquare" },
      { id: "guide", label: "Ask a Guide", icon: "messageCircle" },
      { id: "story", label: "Stories", icon: "bookOpen" },
    ],
  },
  {
    label: "Classwork",
    items: [
      { id: "courses", label: "Courses", icon: "layers" },
      { id: "learning", label: "My Learning", icon: "graduationCap" },
      { id: "progress", label: "Class Progress", icon: "barChart2" },
    ],
  },
  {
    label: "My Space",
    items: [
      { id: "profile", label: "My Profile", icon: "user" },
      { id: "library", label: "Offline Library", icon: "download" },
      { id: "satellite", label: "Learning Satellite", icon: "radioTower" },
    ],
  },
  {
    label: "School",
    items: [{ id: "teacher", label: "Teacher", icon: "users" }],
  },
  {
    label: "Account",
    items: [{ id: "settings", label: "Settings", icon: "settings" }],
  },
];

// Category metadata shared by Explore, the Map mode switcher, and topic cards.
export const CATEGORIES = {
  mountains: { label: "Mountains", icon: "🏔️", color: "#2f6f6b" },
  rivers: { label: "Rivers", icon: "🌊", color: "#2a6fb0" },
  animals: { label: "Animals", icon: "🐆", color: "#b0562a" },
  forests: { label: "Forests", icon: "🌲", color: "#3f8f5b" },
  weather: { label: "Weather", icon: "🌦️", color: "#c98a2f" },
  history: { label: "History", icon: "📜", color: "#8a5a2f" },
  culture: { label: "Culture", icon: "🎭", color: "#c04f7a" },
  science: { label: "Science", icon: "🔬", color: "#6a5acd" },
  space: { label: "Space", icon: "🌌", color: "#3a3a7a" },
  satellites: { label: "Satellites", icon: "🛰️", color: "#2a5aa0" },
};

// Map "modes" group several raw categories under one teaching lens, per the
// product brief (Geography / History / Environment / Culture / Science / Satellite).
export const MAP_MODES = [
  { id: "geography", label: "Geography", icon: "🌍", categories: ["mountains", "rivers"] },
  { id: "history", label: "History", icon: "📜", categories: ["history"] },
  { id: "environment", label: "Environment", icon: "🌱", categories: ["animals", "forests"] },
  { id: "culture", label: "Culture", icon: "🧑‍🤝‍🧑", categories: ["culture"] },
  { id: "science", label: "Science", icon: "🔬", categories: ["science", "weather", "space"] },
  { id: "satellite", label: "Satellite", icon: "🛰️", categories: ["satellites"] },
];

// Journey path shown on the Home screen — a fixed narrative order through
// the categories a child progresses through.
export const JOURNEY_STEPS = [
  { id: "mountains", label: "Explore Himalayas", icon: "🏔️" },
  { id: "forests", label: "Discover Forests", icon: "🌲" },
  { id: "rivers", label: "Learn Rivers", icon: "🌊" },
  { id: "culture", label: "Explore Villages", icon: "🏘️" },
  { id: "history", label: "Discover History", icon: "📜" },
  { id: "science", label: "Science Expedition", icon: "🔬" },
  { id: "satellites", label: "Satellite Mission", icon: "🛰️" },
];

// Safe, illustrated avatar choices — no photo uploads from children.
export const AVATAR_OPTIONS = ["🧑‍🚀", "🧗", "🦁", "🐼", "🐧", "🦉", "🐲", "🧑‍🌾", "🐯", "🦊", "🐰", "🐨"];
