-- Himalayan Learning Grid — Local Hub Database (SQLite)
-- Owner: Nipun (Backend / AI Learning Platform), sync columns owned jointly with Shagun.

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade INTEGER NOT NULL,
  language TEXT NOT NULL,
  village TEXT,
  avatar TEXT,
  weak_topics TEXT NOT NULL DEFAULT '[]',   -- JSON array
  updated_at INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  -- Gamification (added for the Explorer experience). Columns are added via
  -- a guarded migration in db/index.js for existing databases.
  xp INTEGER NOT NULL DEFAULT 0,
  badges TEXT NOT NULL DEFAULT '[]',        -- JSON array of badge ids
  streak INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT                     -- 'YYYY-MM-DD', drives streak logic
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  language TEXT NOT NULL,
  grade INTEGER NOT NULL,
  size_mb REAL NOT NULL,
  weak_topic TEXT,
  new_curriculum INTEGER NOT NULL DEFAULT 0,
  mission_related INTEGER NOT NULL DEFAULT 0,
  cached INTEGER NOT NULL DEFAULT 0,        -- present in the local hub's cache
  sections TEXT NOT NULL                    -- JSON array of {heading, body}
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  options TEXT NOT NULL,                    -- JSON array of strings
  correct_index INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  synced INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS learning_events (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  type TEXT NOT NULL,                       -- lesson-completed | quiz-completed | mission-completed | ai-question-answered | ai-question-unanswered
  payload TEXT NOT NULL,                    -- JSON
  created_at INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  synced INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'queued', -- queued | syncing | synced | failed
  retries INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Content packages available "on the satellite" (source catalog).
CREATE TABLE IF NOT EXISTS content_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  language TEXT NOT NULL,
  size_mb REAL NOT NULL,
  topic TEXT,
  new_curriculum INTEGER NOT NULL DEFAULT 0,
  mission_related INTEGER NOT NULL DEFAULT 0
);

-- Local record of what has been downloaded to this hub, and the state of the
-- current download queue as decided by the Smart Priority Engine.
CREATE TABLE IF NOT EXISTS sync_downloads (
  id TEXT PRIMARY KEY,               -- content_catalog.id
  status TEXT NOT NULL DEFAULT 'queued', -- queued | syncing | synced | failed | skipped
  score INTEGER,
  label TEXT,
  reasons TEXT,                      -- JSON array
  error TEXT,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS teacher_requests (
  id TEXT PRIMARY KEY,
  teacher_name TEXT NOT NULL,
  topic TEXT,
  package_id TEXT,
  note TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS unanswered_questions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  question TEXT NOT NULL,
  guessed_topic TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_history (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS conflicts (
  id TEXT PRIMARY KEY,
  field TEXT NOT NULL,
  local_value TEXT NOT NULL,
  remote_value TEXT NOT NULL,
  local_timestamp INTEGER NOT NULL,
  remote_timestamp INTEGER NOT NULL,
  resolution TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0
);

-- ============================================================================
-- Explorer content model — added for the "learning world" experience.
-- A Topic is the single reusable content unit shown on the Map, in Explore,
-- in Missions, and in recommendations (per the content architecture spec).
-- ============================================================================
CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,       -- mountains | rivers | animals | forests | weather | history | culture | science | space | satellites
  region TEXT NOT NULL,         -- e.g. "Nepal", "Sikkim", "Ladakh"
  subject TEXT NOT NULL,        -- Geography | Science | History | Environment | Culture
  grade INTEGER NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'easy',
  icon TEXT NOT NULL,           -- a single emoji, used as the illustration mark
  color TEXT NOT NULL,          -- accent color for the topic's card/marker
  map_x REAL NOT NULL,          -- stylized 0-100 position on the offline map illustration
  map_y REAL NOT NULL,
  fact TEXT NOT NULL,           -- "Did you know?" one-liner
  description TEXT NOT NULL,    -- short learn panel body
  quiz TEXT NOT NULL,           -- JSON array of {question, options[], correctIndex}
  offline_available INTEGER NOT NULL DEFAULT 1,
  mission_id TEXT               -- optional: contributes to this mission's progress
);

CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  target_count INTEGER NOT NULL,   -- number of topics to explore+quiz to complete
  xp_reward INTEGER NOT NULL,
  badge_id TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT NOT NULL
);

-- Per-student progress against a topic: explored (viewed the learn panel) and
-- quiz_completed (passed the mini quiz). Drives mission progress and the
-- "% of the Himalayan Learning World discovered" figure.
CREATE TABLE IF NOT EXISTS topic_progress (
  student_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  explored INTEGER NOT NULL DEFAULT 0,
  quiz_completed INTEGER NOT NULL DEFAULT 0,
  quiz_score INTEGER,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (student_id, topic_id)
);

CREATE TABLE IF NOT EXISTS saved_topics (
  student_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  saved_at INTEGER NOT NULL,
  PRIMARY KEY (student_id, topic_id)
);
