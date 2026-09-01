const express = require("express");
const db = require("../db");

const router = express.Router();

function serialize(row) {
  return { ...row, sections: JSON.parse(row.sections || "[]"), cached: !!row.cached, new_curriculum: !!row.new_curriculum };
}

// GET /api/lessons
router.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM lessons").all();
  res.json(rows.map(serialize));
});

// GET /api/lessons/:id
router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM lessons WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Lesson not found in local cache" });
  res.json(serialize(row));
});

module.exports = router;
