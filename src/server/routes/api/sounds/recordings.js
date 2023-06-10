const path = require("node:path");
const { Op } = require("sequelize");

const Persistence = require("../../../services/persistence");
const DiscordVoice = require("../../../services/discord/voice");
const Serialization = require("../../../services/serialization");

const router = require("express").Router();

router.get("/page/:start?/:direction?", async (req, res) => {
  const { start, direction } = req.params;

  const up = !direction || direction.toLowerCase() === "up";
  const order = [["start", up ? "DESC" : "ASC"]];

  const query = { limit: 10, order };
  if (start) {
    const operator = up ? Op.lt : Op.gt;
    query.where = {
      start: {
        [operator]: start,
      },
    };
  }

  let recordings = await Persistence.getRecordings(query);
  if (up) recordings = recordings.reverse(); // flip so always sorted ascending

  const recordingDTOs = await Promise.all(recordings.map((recording) => Serialization.toRecordingDTO(recording)));
  res.json(recordingDTOs);
});

router.get("/get/:id", async (req, res) => {
  const { id } = req.params;
  const recording = await Persistence.getRecording(id);
  const recordingDTO = await Serialization.toRecordingDTO(recording);
  return res.json(recordingDTO);
});

router.get("/play/:id", async (req, res) => {
  const { id } = req.params;
  await DiscordVoice.playRecording(id);
  res.status(204).send();
});

router.get("/save/:id", async (req, res) => {
  const { id } = req.params;
  const recording = await Persistence.getRecording(id);
  const recordingDto = await Serialization.toRecordingDTO(recording);

  const filename = recording.filename;
  const username = recordingDto.member ? recordingDto.member.name : recordingDto.userId;
  const description = recording.text ? ` - ${recording.text.substring(0, 25)}` : ` at ${recording.start.toISOString()}`;
  const extension = path.extname(filename);

  res.set("Content-Disposition", `attachment;filename=${username}${description}${extension}`);
  res.sendFile(filename, { root: "." });
});

module.exports = router;
