/**
 * /api/vision — Field Camera AI helpers (need internet + NVIDIA key).
 *   POST /api/vision/label      { image: dataURL, language }   -> { labels:[...], model }
 *   POST /api/vision/translate  { names:[...], language }      -> { translations:{...} }
 * Photos are sent to the model for this request only and are not stored by the hub.
 */
const express = require("express");
const { labelImage, translateNames, translateStory, VisionError } = require("../services/visionService");

const router = express.Router();

function fail(res, err) {
  if (err instanceof VisionError) return res.status(err.status).json({ error: err.message });
  console.error("[vision]", err);
  return res.status(502).json({ error: "Could not reach the AI service. Check the internet connection." });
}

router.post("/label", async (req, res) => {
  try {
    res.json(await labelImage(req.body?.image, req.body?.language));
  } catch (e) { fail(res, e); }
});

router.post("/translate", async (req, res) => {
  try {
    res.json(await translateNames(req.body?.names, req.body?.language));
  } catch (e) { fail(res, e); }
});

router.post("/translate-story", async (req, res) => {
  try {
    res.json(await translateStory(req.body?.story, req.body?.language));
  } catch (e) { fail(res, e); }
});

module.exports = router;
