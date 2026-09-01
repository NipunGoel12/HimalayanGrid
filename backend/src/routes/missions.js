const express = require("express");
const gamification = require("../services/gamificationService");

const router = express.Router();

// GET /api/missions?studentId=std-001
router.get("/", (req, res) => {
  const studentId = req.query.studentId || "std-001";
  res.json(gamification.getMissionProgress(studentId));
});

module.exports = router;
