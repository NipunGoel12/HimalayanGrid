# 🏔️ Himalayan Learning Grid

> **Offline-first AI education for remote Himalayan communities.**

Himalayan Learning Grid is a full-stack, offline-first education platform designed for students in remote mountain communities where reliable internet connectivity cannot be assumed.

It combines **AI-assisted learning, interactive Himalayan exploration, gamification, offline storage, smart synchronization, real satellite data, Earth-observation imagery, multilingual learning tools, and a Local Hub architecture** into one learning experience.

### The core idea

```text
LEARN OFFLINE
      ↓
EXPLORE
      ↓
PRACTICE
      ↓
SAVE LOCALLY
      ↓
SMART SYNC WHEN CONNECTIVITY RETURNS
      ↓
CONTINUE LEARNING
```

---

## ✨ Features

### 🤖 Hima — AI Learning Guide

Hima is a child-friendly AI learning assistant powered by **NVIDIA Nemotron** when internet connectivity is available.

Students can:

* Ask questions naturally
* Ask for simpler explanations
* Request examples
* Ask to be quizzed
* Learn in the context of their current topics
* Use suggested actions such as **Explain Simply**, **Give an Example**, and **Quiz Me**
* Fall back to the local knowledge pack when cloud AI is unavailable

The NVIDIA API key remains server-side and is never exposed to the frontend.

---

### 🗺️ Interactive Himalayan Map

Himalayan Learning Grid provides both an **offline illustrated map** and a **real-world interactive map**.

#### Illustrated Map

A custom map designed for offline learning with topic-based exploration across:

* Mountains
* Rivers
* Wildlife
* Forests
* Weather & Science
* History
* Culture
* Space & Satellites

#### Real Map

The real map uses Leaflet and real-world coordinates to provide:

* Himalayan locations
* Topic pins
* Learn / Label / Photo interactions
* Geographic grid overlays
* Satellite imagery
* Terrain imagery
* Live Earth-observation layers
* Real satellite snapshots

The application can cache previously viewed map tiles for offline reuse.

---

### 🛰️ Learning Satellite

The Learning Satellite experience connects classroom learning with real orbital data.

It provides:

* Live satellite positions
* Ground tracks
* Coverage footprints
* Satellite pass predictions
* Rise / maximum elevation / set times
* Pass direction
* Weather and link outlook
* Earth-observation imagery
* Himalayan earthquake data

Orbital positions are calculated in the browser using **SGP4** and real TLE data.

Current tracked satellites include:

* ISS
* Terra
* Aqua
* Suomi NPP
* NOAA 19
* Landsat 8/9
* Sentinel-2A
* Cartosat-3
* INSAT-3DR

Data sources include **CelesTrak, NASA GIBS, Open-Meteo, and USGS**.

> Satellite orbital data, weather, imagery and Earth-observation data are real. The actual satellite communication/data-transfer gateway is simulated for the current prototype.

---

### 🎮 Gamified Learning

Students learn through exploration, missions and rewards.

The platform supports:

* XP
* Daily streaks
* Badges
* Missions
* Topic exploration
* Saved topics
* Learning progress
* Topic-specific quizzes

Example missions:

```text
🏔️ Mountain Explorer
🌊 River Detective
🐾 Wildlife Guardian
📜 History Explorer
🌱 Culture Keeper
🌦️ Climate Guardian
🌌 Stargazer
🛰️ Satellite Scientist
```

---

### 📚 Academic Learning

The platform also contains a structured academic learning system.

Current curriculum content includes:

* Fractions
* Water Cycle
* Contour Maps

Students can access:

* Courses
* Lessons
* Quizzes
* Personalized progress
* Weak-topic tracking
* Learning history
* Class progress

---

### 📸 Field Camera

The Field Camera turns the student's surroundings into an interactive learning activity.

Students can:

* Capture photos using their device camera
* Upload images
* Place labels manually
* Move and edit labels
* Categorize objects
* Listen to labels using text-to-speech
* Export labeled diagrams as PNG

Supported built-in languages include:

* English
* Hindi
* Nepali
* Bengali
* Urdu
* Tibetan / Ladakhi script

When connected, NVIDIA vision models can assist with automatic image labeling.

---

### 📖 Story Mode

Story Mode teaches concepts through short illustrated learning journeys:

* **Journey of a Water Drop**
* **Journey of a Himalayan Seed**
* **How a Mountain Forms**
* **How a Satellite Sees Earth**

Stories include:

* Animated diagrams
* Step-by-step explanations
* Multilingual translation
* Browser text-to-speech
* Offline caching after content is downloaded

---

## 🔄 Smart Sync

Connectivity is treated as a limited resource.

Instead of attempting to synchronize everything, the Smart Priority Engine ranks content according to learning relevance.

The priority system considers:

```text
Weak-topic match          × 5
Teacher request           × 4
Unanswered question       × 4
New curriculum            × 3
Language match             × 3
Mission relevance          × 2
Large-file penalty        × -2
```

This allows the system to prioritize the educational content that matters most when connectivity becomes available.

---

## 📴 Offline-First Architecture

Offline functionality is a core requirement of the platform.

The frontend uses:

* Service Worker
* IndexedDB
* Local caching
* Cached lessons
* Cached quiz attempts
* Offline learning events
* Synchronization queues
* Offline application shell

The application can continue functioning with no internet connection when required content has already been cached.

When connectivity returns, queued learning activity can be synchronized.

---

# 🧠 Architecture

```text
                    HIMALAYAN LEARNING GRID
                              │
             ┌────────────────┴────────────────┐
             │                                 │
      React + Vite PWA                    Local Hub API
             │                           Express + SQLite
      ┌──────┴──────┐                 ┌────────┴─────────┐
      │             │                 │                  │
  IndexedDB    Service Worker       AI Service       Sync Engine
      │                               │                  │
      │                         NVIDIA Nemotron     Priority Engine
      │
      └────────────── Offline ──────────────────────────┘
                              │
                              ▼
                    External Data Sources
                              │
             ┌────────────────┼────────────────┐
             │                │                │
         CelesTrak         NASA GIBS        Open-Meteo
             │                │                │
             └──────────── USGS ──────────────┘
```

The architecture is designed around a **Local Hub** model.

In a real deployment, the Local Hub could run inside a school or village and communicate with the wider internet or satellite infrastructure when connectivity becomes available.

---

# 🛠️ Tech Stack

## Frontend

* React
* Vite
* JavaScript / JSX
* Leaflet
* React Leaflet
* Lucide React
* IndexedDB
* Service Worker
* PWA

## Backend

* Node.js
* Express
* SQLite
* better-sqlite3

## AI

* NVIDIA Nemotron
* NVIDIA Vision models
* Context-aware AI tutoring
* Local deterministic knowledge fallback

## Earth & Satellite Data

* CelesTrak
* NASA GIBS
* Open-Meteo
* USGS
* Wikipedia Geosearch

## Deployment

* Vercel — Frontend
* Render — Backend

---

# 📁 Project Structure

```text
HimalayanGrid/
│
├── backend/
│   ├── src/
│   │   ├── db/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   │
│   ├── data/
│   │   └── hlg.sqlite
│   │
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── data/
│   │   ├── pages/
│   │   └── services/
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

# ⚡ Getting Started

## Prerequisites

* Node.js 18+
* npm

## 1. Clone

```bash
git clone https://github.com/NipunGoel12/HimalayanGrid.git
cd HimalayanGrid
```

## 2. Start the Backend

```bash
cd backend
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Add the required environment variables.

Then start the server:

```bash
npm run dev
```

The backend runs on the configured port.

For production:

```bash
npm start
```

---

## 3. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will start the frontend locally.

Open:

```text
http://localhost:5173
```

During local development, Vite proxies `/api/*` requests to the backend.

---

# 🔐 Environment Variables

## Backend

Example:

```env
NVIDIA_NEMOTRON_API_KEY=your_api_key
NVIDIA_MODEL=your_model
NVIDIA_BASE_URL=your_base_url

EMBEDDING_PROVIDER=nvidia
NVIDIA_EMBEDDING_MODEL=your_embedding_model
```

Optional vision configuration:

```env
NVIDIA_VISION_MODEL=your_vision_model
```

## Frontend

The frontend can optionally use external satellite imagery providers:

```env
VITE_MAPBOX_TOKEN=your_token
```

or:

```env
VITE_MAPTILER_KEY=your_key
```

The application also includes satellite, terrain and Earth-observation layers that do not require these optional keys.

> **Never expose the NVIDIA API key through a `VITE_*` environment variable.**

---

# 🌐 Deployment

The production architecture separates the frontend and backend:

```text
                  Vercel
                    │
                    │ HTTPS
                    ▼
          HimalayanGrid Frontend
                    │
                    │ /api/*
                    ▼
                  Render
                    │
             Express Backend
                    │
        ┌───────────┼───────────┐
        │           │           │
      SQLite      NVIDIA     Satellite
                   AI          Data
```

For the Vite frontend, configure:

```env
VITE_API_URL=https://your-backend-url
```

The frontend then sends API requests to the deployed backend.

---

# 🛰️ Real vs Simulated

Himalayan Learning Grid deliberately distinguishes between real data and simulated infrastructure.

### Real

* Satellite orbital elements
* SGP4 orbital propagation
* Satellite positions
* Satellite pass calculations
* Weather forecasts
* Earth-observation imagery
* Earthquake data
* Geographic coordinates
* AI responses when connected
* Local database operations

### Simulated

* Physical satellite communication
* Satellite uplink/downlink hardware
* Village-to-satellite transmission gateway

The `SatelliteAdapter` abstraction allows the simulated gateway to eventually be replaced by a real communication implementation.

---

# 🧪 Demo Flow

### Learning

```text
Onboarding
    ↓
Home
    ↓
Today's Adventure
    ↓
Explore Himalayan Topic
    ↓
Learn
    ↓
Mini Quiz
    ↓
XP / Badge
    ↓
Progress
```

### Offline Connectivity

```text
Learn Offline
      ↓
Complete Mission
      ↓
Queue Learning Events
      ↓
Connectivity Returns
      ↓
Smart Priority Engine
      ↓
Rank Required Content
      ↓
Sync
      ↓
Continue Learning
```

---

# 🔮 Roadmap

* Real satellite communication hardware integration
* School and teacher authentication
* Multi-user accounts
* More curriculum content
* More regional languages
* Offline vector map packs
* Expanded quiz formats
* Richer field-learning content
* Real Local Hub deployments
* Production-grade persistent database infrastructure

---

# ⚠️ Current Limitations

Himalayan Learning Grid is currently a prototype / hackathon implementation.

Current limitations include:

* Demo-oriented student profile flow
* No production authentication system
* Satellite data-transfer gateway is simulated
* Some advanced quiz modes remain to be implemented
* Real map imagery requires network access until cached
* PWA install artwork requires final production assets
* SQLite requires persistent storage planning for production deployment

---

# 🎯 Design Principles

### Offline First

Connectivity should enhance learning, not determine whether learning is possible.

### Real Data Where It Matters

Satellite positions, weather, imagery and Earth-observation data come from real public datasets.

### Child First

The interface emphasizes exploration, stories, missions and understandable explanations.

### Local by Default

Learning activity and cached content should remain useful even when the cloud disappears.

### Honest Simulation

Infrastructure that is not physically deployed is explicitly represented as simulated.

<p align="center">

**🏔️ Learn beyond the network.**

</p>
