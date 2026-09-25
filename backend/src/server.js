require("dotenv").config();
const express = require("express");
const cors = require("cors");

require("./db"); // ensures schema + seed run before routes touch the DB

const studentsRouter = require("./routes/students");
const lessonsRouter = require("./routes/lessons");
const quizRouter = require("./routes/quiz");
const aiRouter = require("./routes/ai");
const syncRouter = require("./routes/sync");
const teacherRouter = require("./routes/teacher");
const missionRouter = require("./routes/mission");
const topicsRouter = require("./routes/topics");
const missionsRouter = require("./routes/missions");
const satelliteRouter = require("./routes/satellite");
const visionRouter = require("./routes/vision");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "hlg-backend" }));

app.use("/api/students", studentsRouter);
app.use("/api/lessons", lessonsRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/ai", aiRouter);
app.use("/api/sync", syncRouter);
app.use("/api/teacher", teacherRouter);
app.use("/api/mission", missionRouter);
app.use("/api/topics", topicsRouter);
app.use("/api/missions", missionsRouter);
app.use("/api/satellite", satelliteRouter);
app.use("/api/vision", visionRouter);

app.use((req, res) => res.status(404).json({ error: `No route for ${req.method} ${req.path}` }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`[hlg-backend] Local Hub API listening on http://localhost:${PORT}`);
  console.log(`[hlg-backend] AI Tutor mode: ${process.env.ANTHROPIC_API_KEY ? "Cloud + Local fallback" : "Local Tutor only (no ANTHROPIC_API_KEY set)"}`);
});
