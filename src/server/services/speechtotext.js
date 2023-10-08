const vosk = require("vosk");
const fs = require("fs");
const { FFmpeg } = require("prism-media");

const Config = require("./config");
const Logger = require("./logger");
const Persistence = require("./persistence");

vosk.setLogLevel(0);

class SpeechToText {
  constructor() {
    const modelDir = Config.voskModel;

    if (!fs.existsSync(modelDir)) {
      Logger.warn(`Vosk model '${modelDir}' not found. Download from https://alphacephei.com/vosk/models`);
    } else {
      this.model = new vosk.Model(modelDir);
      Persistence.on(Persistence.events.recording.create.success, this.getTextForRecording.bind(this));
    }
  }

  async getTextForRecording(recording) {
    const recognizer = new vosk.Recognizer({ model: this.model, sampleRate: 16000 });
    recording.status = "listening";
    Persistence.emit(Persistence.events.recording.update.started, recording);

    const ffmpeg = new FFmpeg({
      args: ["-loglevel", "quiet", "-i", recording.filename, "-ar", "16000", "-ac", "1", "-f", "s16le"],
    });

    ffmpeg.on("data", (chunk) => {
      recognizer.acceptWaveform(chunk);
    });

    ffmpeg.on("end", () => {
      recording.text = recognizer.finalResult().text;
      recording.status = "completed";
      Persistence.emit(Persistence.events.recording.update.started, recording);

      recognizer.free();
    });

    ffmpeg.on("error", () => {
      recording.status = "faulted";
      Persistence.emit(Persistence.events.recording.update.started, recording);

      recognizer.free();
    });
  }
}

module.exports = new SpeechToText();
