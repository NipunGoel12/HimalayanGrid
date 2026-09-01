import React, { useState } from "react";
import { Badge } from "../components/ui.jsx";

const STORIES = [
  {
    id: "water-drop",
    title: "The Journey of a Water Drop",
    subject: "Science · Water cycle",
    steps: [
      { icon: "☁️", title: "Cloud", text: "High above the mountains, a tiny water drop forms inside a cool cloud." },
      { icon: "❄️", title: "Snow", text: "As the cloud drifts over a high peak, the drop freezes and falls as snow." },
      { icon: "🧊", title: "Glacier", text: "Season after season, snow piles up and packs into ice — the drop becomes part of a glacier." },
      { icon: "🏔️", title: "Melt", text: "In summer, sunlight warms the glacier's edge, and the drop melts free at last." },
      { icon: "🌊", title: "River", text: "The drop joins a stream, then a roaring river, tumbling down through the valleys." },
      { icon: "🏘️", title: "Village", text: "Along the way, the river fills a village's irrigation channel and drinking well." },
      { icon: "🌊", title: "Ocean", text: "Eventually the drop reaches the sea — where the sun will lift it back into a cloud, and the journey begins again." },
    ],
  },
  {
    id: "himalayan-seed",
    title: "The Journey of a Himalayan Seed",
    subject: "Environment · Forests",
    steps: [
      { icon: "🌰", title: "Seed", text: "A rhododendron seed falls from its flower onto the forest floor." },
      { icon: "🌧️", title: "Rain", text: "Monsoon rain softens the soil and the seed begins to sprout." },
      { icon: "🌱", title: "Sapling", text: "A tiny sapling reaches for sunlight between older trees." },
      { icon: "🌳", title: "Tree", text: "Years pass, and the sapling grows into a tree covered in bright red-pink blooms." },
      { icon: "🐝", title: "New life", text: "Its flowers feed bees and birds, and its own seeds begin new journeys of their own." },
    ],
  },
  {
    id: "mountain-forms",
    title: "How a Mountain Forms",
    subject: "Science · Geology",
    steps: [
      { icon: "🌍", title: "Two plates", text: "Deep underground, two huge pieces of the Earth's crust slowly push toward each other." },
      { icon: "💥", title: "Collision", text: "Where they meet, the crust has nowhere to go but up." },
      { icon: "⛰️", title: "Folding", text: "Rock layers fold and crumple, rising higher and higher over millions of years." },
      { icon: "🏔️", title: "A mountain range", text: "That's how the Himalayas formed — and they're still growing a few millimeters every year!" },
    ],
  },
  {
    id: "satellite-sees",
    title: "How a Satellite Sees Earth",
    subject: "Science · Satellites",
    steps: [
      { icon: "🚀", title: "Launch", text: "A satellite is launched far above the Earth's atmosphere." },
      { icon: "🛰️", title: "Orbit", text: "It circles the planet, capturing images and signals as it goes." },
      { icon: "📡", title: "Ground station", text: "The satellite sends its data down to a ground station on Earth." },
      { icon: "🏫", title: "Local hub", text: "From there, the data — including learning content — travels to a local hub in a mountain village." },
      { icon: "🎒", title: "Student", text: "A student's device syncs with the hub, and new lessons are ready — even without regular internet." },
    ],
  },
];

export default function StoryMode() {
  const [storyId, setStoryId] = useState(STORIES[0].id);
  const [step, setStep] = useState(0);
  const story = STORIES.find((s) => s.id === storyId);

  function pick(id) {
    setStoryId(id);
    setStep(0);
  }

  return (
    <div className="view-max" style={{ maxWidth: 620 }}>
      <div className="section">
        <div className="page-title">Stories</div>
        <div className="page-subtitle">Short illustrated stories that make big ideas easy to remember.</div>
      </div>

      <div className="section" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {STORIES.map((s) => (
          <button key={s.id} className={`chip ${storyId === s.id ? "active" : ""}`} onClick={() => pick(s.id)}>{s.steps[0].icon} {s.title}</button>
        ))}
      </div>

      <div className="panel panel-pad">
        <Badge tone="brand">{story.subject}</Badge>
        <div className="page-title" style={{ fontSize: 18, margin: "8px 0 4px" }}>{story.title}</div>

        <div style={{ marginTop: 10 }}>
          {story.steps.map((s, i) => (
            <div key={i} className="story-step" style={{ opacity: i <= step ? 1 : 0.35 }}>
              <div className="story-step-icon">{s.icon}</div>
              <div>
                <div style={{ fontWeight: 650, fontSize: 13.5 }}>{s.title}</div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 2, lineHeight: 1.5 }}>{s.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <button className="btn secondary small" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Back</button>
          {step < story.steps.length - 1 ? (
            <button className="btn primary small" onClick={() => setStep((s) => Math.min(story.steps.length - 1, s + 1))}>Continue</button>
          ) : (
            <Badge tone="success">Story complete</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
