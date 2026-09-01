/**
 * Gamification service — powers the Explorer experience (XP, streaks,
 * missions and badges) without touching the existing curriculum/quiz engine
 * (weak topics, quiz_questions, quiz_attempts) used by the academic Quizzes
 * flow. These are deliberately separate systems: exploring "Mount Everest"
 * awards Explorer XP and mission progress; the Fractions/Water Cycle quiz
 * engine still drives grade-level weak-topic personalization as before.
 */

const db = require("../db");

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Updates a student's daily learning streak. Call this on any explorer
 *  activity (topic explored, mini-quiz completed, mission progressed). */
function touchStreak(studentId) {
  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(studentId);
  if (!student) return;
  const today = todayStr();
  if (student.last_active_date === today) return; // already counted today
  const newStreak = student.last_active_date === yesterdayStr() ? student.streak + 1 : 1;
  db.prepare("UPDATE students SET streak = ?, last_active_date = ? WHERE id = ?").run(newStreak, today, studentId);
}

function addXp(studentId, amount) {
  db.prepare("UPDATE students SET xp = xp + ? WHERE id = ?").run(amount, studentId);
}

function getBadges(student) {
  return JSON.parse(student.badges || "[]");
}

function awardBadgeIfNew(studentId, badge) {
  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(studentId);
  const badges = getBadges(student);
  if (badges.find((b) => b.id === badge.badge_id)) return false;
  badges.push({ id: badge.badge_id, name: badge.badge_name, icon: badge.badge_icon, earnedAt: Date.now() });
  db.prepare("UPDATE students SET badges = ? WHERE id = ?").run(JSON.stringify(badges), studentId);
  addXp(studentId, badge.xp_reward);
  return true;
}

/** Recomputes progress for every mission that a topic belongs to, awarding
 *  the badge + XP the first time a mission's target is reached. Returns any
 *  newly-earned mission badges so the API/UI can celebrate them. */
function evaluateMissionsForTopic(studentId, topicId) {
  const topic = db.prepare("SELECT * FROM topics WHERE id = ?").get(topicId);
  if (!topic || !topic.mission_id) return [];
  const mission = db.prepare("SELECT * FROM missions WHERE id = ?").get(topic.mission_id);
  if (!mission) return [];

  const completedCount = db
    .prepare(
      `SELECT COUNT(*) AS c FROM topic_progress tp
       JOIN topics t ON t.id = tp.topic_id
       WHERE tp.student_id = ? AND t.mission_id = ? AND tp.quiz_completed = 1`
    )
    .get(studentId, mission.id).c;

  if (completedCount >= mission.target_count) {
    const earned = awardBadgeIfNew(studentId, mission);
    if (earned) return [mission];
  }
  return [];
}

function getMissionProgress(studentId) {
  const missions = db.prepare("SELECT * FROM missions").all();
  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(studentId);
  const badges = getBadges(student);
  return missions.map((m) => {
    const completedCount = db
      .prepare(
        `SELECT COUNT(*) AS c FROM topic_progress tp
         JOIN topics t ON t.id = tp.topic_id
         WHERE tp.student_id = ? AND t.mission_id = ? AND tp.quiz_completed = 1`
      )
      .get(studentId, m.id).c;
    const topicIds = db.prepare("SELECT id, title, icon FROM topics WHERE mission_id = ?").all(m.id);
    return {
      ...m,
      progress: Math.min(completedCount, m.target_count),
      complete: badges.some((b) => b.id === m.badge_id),
      topics: topicIds,
    };
  });
}

function getExplorationStats(studentId) {
  const totalTopics = db.prepare("SELECT COUNT(*) AS c FROM topics").get().c;
  const exploredCount = db
    .prepare("SELECT COUNT(*) AS c FROM topic_progress WHERE student_id = ? AND explored = 1")
    .get(studentId).c;
  const pct = totalTopics ? Math.round((exploredCount / totalTopics) * 100) : 0;
  return { totalTopics, exploredCount, explorationPct: pct };
}

function getGamificationSummary(studentId) {
  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(studentId);
  if (!student) return null;
  const { totalTopics, exploredCount, explorationPct } = getExplorationStats(studentId);
  return {
    xp: student.xp,
    streak: student.streak,
    badges: getBadges(student),
    totalTopics,
    exploredCount,
    explorationPct,
  };
}

module.exports = {
  touchStreak,
  addXp,
  awardBadgeIfNew,
  evaluateMissionsForTopic,
  getMissionProgress,
  getExplorationStats,
  getGamificationSummary,
};
