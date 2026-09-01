/**
 * Smart Priority Engine — Shagun's subsystem (Satellite / Synchronization).
 *
 * Decides what a remote school/student needs first under limited bandwidth.
 * Never simply syncs everything.
 *
 * priority = weakTopicMatch*5 + teacherRequest*4 + unansweredQuestionMatch*4
 *          + newCurriculum*3 + languageMatch*3 + missionRelevance*2
 *          - largeFilePenalty*2
 */

function computePriority(pkg, ctx) {
  const reasons = [];
  let score = 0;

  const weakMatch = ctx.weakTopics.includes(pkg.topic);
  if (weakMatch) { score += 5; reasons.push("weak-topic match"); }

  const teacherMatch = ctx.teacherRequests.some(
    (r) => (r.topic && r.topic === pkg.topic) || (r.package_id && r.package_id === pkg.id)
  );
  if (teacherMatch) { score += 4; reasons.push("teacher request"); }

  const unansweredMatch = ctx.unansweredTopics.includes(pkg.topic);
  if (unansweredMatch) { score += 4; reasons.push("unanswered question"); }

  if (pkg.new_curriculum) { score += 3; reasons.push("new curriculum"); }

  const langMatch = pkg.language === ctx.language;
  if (langMatch) { score += 3; reasons.push("language match"); }

  if (pkg.mission_related) { score += 2; reasons.push("mission relevance"); }

  let penalty = 0;
  if (pkg.size_mb > 50) {
    penalty = 2 * Math.ceil(pkg.size_mb / 50);
    score -= penalty;
    reasons.push("large-file penalty");
  }

  let label;
  if (score >= 9) label = "HIGH";
  else if (score >= 5) label = "MEDIUM";
  else if (score > 0) label = "LOW";
  else label = "SKIPPED";

  return { ...pkg, score, label, reasons };
}

/** Ranks a full catalog against student/teacher/context signals, highest first. */
function rankCatalog(catalog, ctx) {
  return catalog
    .map((pkg) => computePriority(pkg, ctx))
    .sort((a, b) => b.score - a.score);
}

module.exports = { computePriority, rankCatalog };
