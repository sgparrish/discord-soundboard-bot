const path = require("node:path");

const ClipManager = require("../../../services/clipmanager");
const DiscordVoice = require("../../../services/discord/voice");
const Serialization = require("../../../services/serialization");

const router = require("express").Router();

router.get("/", async (req, res) => {
  const clips = await ClipManager.getClips();
  const clipDTOs = await Promise.all(clips.map((clip) => Serialization.toClipDTO(clip)));
  res.json(clipDTOs);
});

router.get("/play/:category/:soundname", async (req, res) => {
  const { category, soundname } = req.params;
  const filename = await ClipManager.getClipFile(category, soundname);
  await DiscordVoice.playFile(filename);
  await ClipManager.clipPlayed(category, soundname);
  res.status(204).send();
});

router.get("/save/:category/:soundname", async (req, res) => {
  const { category, soundname } = req.params;

  const filename = await ClipManager.getClipFile(category, soundname);
  const clipDto = await Serialization.toClipDTO({category, soundname});

  const categoryName = clipDto.member ? clipDto.member.name : clipDto.category;

  res.set("Content-Disposition", `attachment;filename=${categoryName} - ${soundname}`);
  res.sendFile(filename, { root: "." });
});

router.post("/create", async (req, res, next) => {
  const { id, name, start, end } = req.body;
  await ClipManager.createClip(id, name, start, end);
  res.status(204).send();
});

module.exports = router;
