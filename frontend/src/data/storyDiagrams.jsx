import React from "react";

/** Shared frame so every diagram sits in the same friendly card. */
function Frame({ children, bg = "#0F2138" }) {
  return (
    <svg viewBox="0 0 300 170" className="story-diagram-svg" role="img" aria-hidden="true">
      <rect x="0" y="0" width="300" height="170" rx="14" fill={bg} />
      {children}
    </svg>
  );
}

/** Water cycle: cloud -> snow on peak -> glacier -> river -> village -> ocean -> back up as vapour. */
export function WaterCycleDiagram() {
  return (
    <Frame bg="#0E2A44">
      <path d="M0 140 L60 90 L100 130 L150 70 L210 120 L260 100 L300 140 L300 170 L0 170 Z" fill="#1B3A5C" />
      <path d="M60 90 L75 100 L85 90 L100 100" stroke="#DDEBFF" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="230" cy="40" rx="36" ry="16" fill="#EAF3FF" opacity="0.9" />
      <ellipse cx="205" cy="48" rx="24" ry="12" fill="#EAF3FF" opacity="0.9" />
      <ellipse cx="255" cy="48" rx="24" ry="12" fill="#EAF3FF" opacity="0.9" />
      <path d="M100 100 L96 108 L104 108 Z" fill="#fff" />
      <path d="M75 100 L71 108 L79 108 Z" fill="#fff" />
      <path d="M150 70 L145 80 L155 80 Z" fill="#fff" />
      <path d="M100 130 Q110 150 95 165 Q80 150 90 135 Q95 128 100 130" fill="#4FA3E0" opacity="0.9">
        <animate attributeName="cy" values="0;3;0" dur="2.4s" repeatCount="indefinite" />
      </path>
      <path d="M150 40 C160 60 145 60 150 85" stroke="#8FD3FF" strokeWidth="2" fill="none" strokeDasharray="3 4">
        <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2s" repeatCount="indefinite" />
      </path>
      <rect x="200" y="130" width="10" height="12" fill="#C99A5B" />
      <polygon points="195,130 205,118 215,130" fill="#B5824A" />
      <circle cx="150" cy="20" r="12" fill="#FFD873" />
    </Frame>
  );
}

/** Seed -> rain -> sapling -> tree -> flowers/bees. */
export function SeedGrowthDiagram() {
  return (
    <Frame bg="#12331F">
      <rect x="0" y="140" width="300" height="30" fill="#2C4A32" />
      <line x1="60" y1="20" x2="60" y2="40" stroke="#9FD8FF" strokeWidth="3" strokeLinecap="round">
        <animate attributeName="y2" values="20;45;20" dur="1.6s" repeatCount="indefinite" />
      </line>
      <line x1="75" y1="15" x2="75" y2="38" stroke="#9FD8FF" strokeWidth="3" strokeLinecap="round">
        <animate attributeName="y2" values="15;40;15" dur="1.6s" begin="0.3s" repeatCount="indefinite" />
      </line>
      <ellipse cx="60" cy="145" rx="6" ry="4" fill="#7A4A26" />
      <path d="M150 140 C150 110 150 90 150 60" stroke="#5B7A3A" strokeWidth="6" strokeLinecap="round" />
      <circle cx="150" cy="55" r="34" fill="#4E8B3C" />
      <circle cx="122" cy="70" r="20" fill="#5A9A46" />
      <circle cx="178" cy="70" r="20" fill="#5A9A46" />
      <circle cx="120" cy="45" r="4" fill="#FF9BC5" />
      <circle cx="175" cy="40" r="4" fill="#FF9BC5" />
      <circle cx="150" cy="30" r="4" fill="#FF9BC5" />
      <g>
        <ellipse cx="200" cy="55" rx="4" ry="3" fill="#FFD873" />
        <animateTransform attributeName="transform" type="translate" values="0 0; 20 -10; 0 0" dur="3s" repeatCount="indefinite" additive="sum" />
      </g>
    </Frame>
  );
}

/** Two plates collide and fold up into a mountain range. */
export function MountainFormationDiagram() {
  return (
    <Frame bg="#241A2E">
      <rect x="0" y="120" width="120" height="40" fill="#6E5A8C" />
      <rect x="180" y="120" width="120" height="40" fill="#8C6E5A" />
      <g>
        <rect x="20" y="122" width="90" height="10" fill="#8C7AB0" />
        <animateTransform attributeName="transform" type="translate" values="0 0; 20 0; 0 0" dur="3.5s" repeatCount="indefinite" />
      </g>
      <g>
        <rect x="190" y="122" width="90" height="10" fill="#B08C6E" />
        <animateTransform attributeName="transform" type="translate" values="0 0; -20 0; 0 0" dur="3.5s" repeatCount="indefinite" />
      </g>
      <path d="M90 120 L150 40 L210 120 Z" fill="#C9C4E0">
        <animate attributeName="d" values="M90 120 L150 100 L210 120 Z; M90 120 L150 40 L210 120 Z; M90 120 L150 40 L210 120 Z" dur="3.5s" repeatCount="indefinite" />
      </path>
      <path d="M135 60 L150 40 L165 60 Z" fill="#fff">
        <animate attributeName="opacity" values="0;0;1" dur="3.5s" repeatCount="indefinite" />
      </path>
    </Frame>
  );
}

/** Rocket -> orbit -> ground station -> village hub -> student device. */
export function SatelliteDiagram() {
  return (
    <Frame bg="#0B1730">
      <circle cx="150" cy="70" r="46" fill="none" stroke="#3A5580" strokeWidth="1.5" strokeDasharray="3 4" />
      <g>
        <circle r="6" fill="#8FD3FF" />
        <animateMotion dur="4s" repeatCount="indefinite" path="M196,70 A46,46 0 1,1 104,70 A46,46 0 1,1 196,70" />
      </g>
      <rect x="130" y="130" width="10" height="20" fill="#B5B5B5" />
      <polygon points="120,150 150,150 135,118" fill="#8B8B8B" />
      <rect x="40" y="140" width="28" height="18" rx="2" fill="#C99A5B" />
      <polygon points="36,140 54,124 72,140" fill="#B5824A" />
      <circle cx="230" cy="150" r="10" fill="#4E8B3C" />
      <rect x="222" y="150" width="16" height="10" fill="#5A9A46" />
      <line x1="135" y1="118" x2="150" y2="70" stroke="#8FD3FF" strokeWidth="1" strokeDasharray="2 3">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite" />
      </line>
      <line x1="54" y1="140" x2="135" y2="130" stroke="#8FD3FF" strokeWidth="1" strokeDasharray="2 3">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" begin="0.6s" repeatCount="indefinite" />
      </line>
      <line x1="230" y1="140" x2="140" y2="132" stroke="#8FD3FF" strokeWidth="1" strokeDasharray="2 3">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" begin="1.2s" repeatCount="indefinite" />
      </line>
    </Frame>
  );
}

export const STORY_DIAGRAMS = {
  "water-drop": WaterCycleDiagram,
  "himalayan-seed": SeedGrowthDiagram,
  "mountain-forms": MountainFormationDiagram,
  "satellite-sees": SatelliteDiagram,
};
