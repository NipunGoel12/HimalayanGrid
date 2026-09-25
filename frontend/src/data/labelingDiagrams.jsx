import React from "react";

// Original, simple line-art diagrams used for the "Label & Learn" activity.
// Each diagram is hand-drawn SVG (no photos, no external assets — works
// fully offline) with a handful of hotspots the student labels by tapping a
// word from the word bank, then tapping the matching blank on the picture.
//
// hotspots: [{ id, x, y, answer }]  — x/y are percentages within the SVG frame.
// distractors: extra wrong words mixed into the word bank to make it a real
// labelling challenge rather than a 1:1 matching task.

export const LABELING_DIAGRAMS = {
  mountains: {
    title: "Label the mountain",
    hotspots: [
      { id: "peak", x: 50, y: 12, answer: "Summit" },
      { id: "snowline", x: 38, y: 30, answer: "Snowline" },
      { id: "glacier", x: 63, y: 42, answer: "Glacier" },
      { id: "basecamp", x: 22, y: 62, answer: "Base camp" },
      { id: "valley", x: 80, y: 80, answer: "Valley" },
    ],
    distractors: ["Delta", "Coral reef"],
    render: (P) => (
      <svg viewBox="0 0 100 100" style={S.svg}>
        <rect width="100" height="100" fill="#eaf3f6" />
        <polygon points="10,90 50,10 90,90" fill="#cbd8d6" />
        <polygon points="35,35 50,10 65,35 58,40 50,32 42,40" fill="#ffffff" />
        <path d="M15,90 Q40,70 55,90" fill="#dcecd8" stroke="none" />
        {P}
      </svg>
    ),
  },
  rivers: {
    title: "Label the river system",
    hotspots: [
      { id: "source", x: 18, y: 15, answer: "Source" },
      { id: "tributary", x: 55, y: 30, answer: "Tributary" },
      { id: "riverbed", x: 45, y: 55, answer: "Riverbed" },
      { id: "floodplain", x: 70, y: 68, answer: "Floodplain" },
      { id: "delta", x: 85, y: 88, answer: "Delta" },
    ],
    distractors: ["Summit", "Watchtower"],
    render: (P) => (
      <svg viewBox="0 0 100 100" style={S.svg}>
        <rect width="100" height="100" fill="#eaf3f6" />
        <path d="M20,12 Q30,40 40,50 T60,75 Q75,85 88,90" stroke="#4c8fb8" strokeWidth="4" fill="none" />
        <path d="M55,28 Q50,38 42,50" stroke="#4c8fb8" strokeWidth="2.5" fill="none" />
        <ellipse cx="30" cy="70" rx="18" ry="8" fill="#dcecd8" opacity="0.7" />
        {P}
      </svg>
    ),
  },
  animals: {
    title: "Label the mountain animal",
    hotspots: [
      { id: "ears", x: 38, y: 18, answer: "Ears" },
      { id: "eyes", x: 55, y: 30, answer: "Eyes" },
      { id: "coat", x: 30, y: 55, answer: "Thick fur coat" },
      { id: "paws", x: 65, y: 82, answer: "Paws" },
      { id: "tail", x: 88, y: 55, answer: "Tail" },
    ],
    distractors: ["Snowline", "Prayer flags"],
    render: (P) => (
      <svg viewBox="0 0 100 100" style={S.svg}>
        <rect width="100" height="100" fill="#f3ede4" />
        <ellipse cx="50" cy="60" rx="30" ry="20" fill="#c99b6a" />
        <circle cx="45" cy="32" r="16" fill="#c99b6a" />
        <polygon points="34,22 40,10 44,24" fill="#c99b6a" />
        <polygon points="50,22 56,10 58,24" fill="#c99b6a" />
        <path d="M78,60 Q92,50 90,68" stroke="#c99b6a" strokeWidth="6" fill="none" strokeLinecap="round" />
        {P}
      </svg>
    ),
  },
  forests: {
    title: "Label the forest",
    hotspots: [
      { id: "canopy", x: 50, y: 15, answer: "Canopy" },
      { id: "trunk", x: 50, y: 55, answer: "Trunk" },
      { id: "understory", x: 25, y: 65, answer: "Understory" },
      { id: "floor", x: 50, y: 90, answer: "Forest floor" },
      { id: "wildlife", x: 78, y: 70, answer: "Wildlife corridor" },
    ],
    distractors: ["Delta", "Observatory"],
    render: (P) => (
      <svg viewBox="0 0 100 100" style={S.svg}>
        <rect width="100" height="100" fill="#eef4ee" />
        <ellipse cx="50" cy="22" rx="34" ry="16" fill="#4f8f5b" />
        <ellipse cx="25" cy="55" rx="16" ry="10" fill="#6fa878" />
        <ellipse cx="75" cy="58" rx="16" ry="10" fill="#6fa878" />
        <rect x="47" y="30" width="6" height="55" fill="#8a5a2f" />
        {P}
      </svg>
    ),
  },
  weather: {
    title: "Label the mountain weather",
    hotspots: [
      { id: "cloud", x: 28, y: 18, answer: "Cloud" },
      { id: "precip", x: 55, y: 32, answer: "Precipitation" },
      { id: "wind", x: 78, y: 20, answer: "Wind" },
      { id: "snowline2", x: 40, y: 58, answer: "Snowline" },
      { id: "temp", x: 70, y: 78, answer: "Temperature zone" },
    ],
    distractors: ["Riverbed", "Trunk"],
    render: (P) => (
      <svg viewBox="0 0 100 100" style={S.svg}>
        <rect width="100" height="100" fill="#eaf3f6" />
        <polygon points="15,90 55,20 95,90" fill="#cbd8d6" />
        <ellipse cx="30" cy="20" rx="16" ry="8" fill="#ffffff" stroke="#c9d6db" />
        <path d="M60,32 L57,42 M65,32 L62,44 M70,32 L67,42" stroke="#4c8fb8" strokeWidth="2" />
        <path d="M75,18 L90,18 M78,24 L92,24" stroke="#9fb3ba" strokeWidth="2" />
        {P}
      </svg>
    ),
  },
  history: {
    title: "Label the ancient trade route",
    hotspots: [
      { id: "monastery", x: 78, y: 25, answer: "Monastery" },
      { id: "route", x: 40, y: 55, answer: "Trade route" },
      { id: "caravan", x: 55, y: 68, answer: "Caravan" },
      { id: "tower", x: 18, y: 30, answer: "Watchtower" },
      { id: "pass", x: 62, y: 30, answer: "Mountain pass" },
    ],
    distractors: ["Canopy", "Tributary"],
    render: (P) => (
      <svg viewBox="0 0 100 100" style={S.svg}>
        <rect width="100" height="100" fill="#f3ede4" />
        <path d="M10,80 Q40,60 50,55 T90,30" stroke="#a9865a" strokeWidth="3" strokeDasharray="4 3" fill="none" />
        <rect x="70" y="15" width="16" height="18" fill="#b0562a" />
        <polygon points="70,15 78,6 86,15" fill="#8a5a2f" />
        <rect x="14" y="20" width="8" height="20" fill="#8a5a2f" />
        {P}
      </svg>
    ),
  },
  culture: {
    title: "Label the festival scene",
    hotspots: [
      { id: "mask", x: 50, y: 25, answer: "Festival mask" },
      { id: "flags", x: 78, y: 15, answer: "Prayer flags" },
      { id: "dress", x: 35, y: 60, answer: "Traditional dress" },
      { id: "instrument", x: 65, y: 70, answer: "Musical instrument" },
      { id: "square", x: 20, y: 85, answer: "Village square" },
    ],
    distractors: ["Glacier", "Fault line"],
    render: (P) => (
      <svg viewBox="0 0 100 100" style={S.svg}>
        <rect width="100" height="100" fill="#fbeef2" />
        <path d="M70,10 L92,10 M70,16 L92,16 M70,22 L92,22" stroke="#c04f7a" strokeWidth="2" />
        <circle cx="50" cy="30" r="12" fill="#c04f7a" opacity="0.8" />
        <path d="M35,50 Q35,80 35,88" stroke="#c04f7a" strokeWidth="10" strokeLinecap="round" />
        <circle cx="65" cy="68" r="7" fill="#8a5a2f" />
        {P}
      </svg>
    ),
  },
  science: {
    title: "Label how mountains form",
    hotspots: [
      { id: "plate1", x: 20, y: 70, answer: "Tectonic plate" },
      { id: "plate2", x: 80, y: 70, answer: "Tectonic plate" },
      { id: "fold", x: 50, y: 35, answer: "Fold" },
      { id: "fault", x: 65, y: 55, answer: "Fault line" },
      { id: "uplift", x: 50, y: 15, answer: "Upliftment" },
    ],
    distractors: ["Delta", "Prayer flags"],
    render: (P) => (
      <svg viewBox="0 0 100 100" style={S.svg}>
        <rect width="100" height="100" fill="#eef0fb" />
        <rect x="0" y="72" width="45" height="20" fill="#b7bfe6" />
        <rect x="55" y="72" width="45" height="20" fill="#b7bfe6" />
        <path d="M20,72 Q50,20 80,72 Z" fill="#8f9adb" />
        <path d="M45,72 L55,50 L65,72" stroke="#5a5aad" strokeWidth="2" fill="none" />
        {P}
      </svg>
    ),
  },
  space: {
    title: "Label the stargazing scene",
    hotspots: [
      { id: "telescope", x: 50, y: 70, answer: "Telescope" },
      { id: "sky", x: 25, y: 15, answer: "Night sky" },
      { id: "star", x: 70, y: 20, answer: "Star" },
      { id: "dome", x: 78, y: 55, answer: "Observatory dome" },
      { id: "horizon", x: 15, y: 85, answer: "Horizon" },
    ],
    distractors: ["Tributary", "Canopy"],
    render: (P) => (
      <svg viewBox="0 0 100 100" style={S.svg}>
        <rect width="100" height="100" fill="#20204a" />
        <circle cx="70" cy="20" r="1.6" fill="#fff" />
        <circle cx="80" cy="35" r="1.2" fill="#fff" />
        <circle cx="25" cy="15" r="1.4" fill="#fff" />
        <circle cx="40" cy="10" r="1" fill="#fff" />
        <ellipse cx="78" cy="55" rx="14" ry="10" fill="#3a3a7a" />
        <line x1="50" y1="70" x2="60" y2="45" stroke="#c9c9e8" strokeWidth="3" />
        <rect x="45" y="70" width="10" height="8" fill="#c9c9e8" />
        {P}
      </svg>
    ),
  },
  satellites: {
    title: "Label the satellite link",
    hotspots: [
      { id: "satellite", x: 75, y: 15, answer: "Satellite" },
      { id: "solar", x: 88, y: 15, answer: "Solar panel" },
      { id: "beam", x: 55, y: 40, answer: "Signal beam" },
      { id: "antenna", x: 35, y: 68, answer: "Antenna" },
      { id: "ground", x: 25, y: 85, answer: "Ground station" },
    ],
    distractors: ["Riverbed", "Canopy"],
    render: (P) => (
      <svg viewBox="0 0 100 100" style={S.svg}>
        <rect width="100" height="100" fill="#eaf3f6" />
        <rect x="68" y="10" width="12" height="8" fill="#2a5aa0" />
        <rect x="80" y="8" width="8" height="4" fill="#9fc3e8" />
        <rect x="60" y="8" width="8" height="4" fill="#9fc3e8" />
        <path d="M72,18 L38,66" stroke="#2a5aa0" strokeWidth="1.4" strokeDasharray="3 2" />
        <polygon points="20,90 35,60 50,90" fill="#c9d6db" />
        <line x1="35" y1="60" x2="35" y2="75" stroke="#2a5aa0" strokeWidth="2" />
        {P}
      </svg>
    ),
  },
};

const S = {
  svg: { width: "100%", height: "100%", display: "block" },
};

// A handful of categories share one canonical diagram (weather/space/science
// sometimes overlap topic-to-category); fall back to "mountains" if a topic's
// category has no dedicated diagram yet.
export function getDiagramForCategory(category) {
  return LABELING_DIAGRAMS[category] || LABELING_DIAGRAMS.mountains;
}
