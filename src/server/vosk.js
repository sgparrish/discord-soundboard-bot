const fs = require("fs");
const path = require("path");
const { Duplex } = require("stream");
const { spawn } = require("child_process");

// Class design lovingly stollen from prism-media's ffmpeg class

class VoskDriver extends Duplex {
  constructor() {
    super();
    this.vosk = VoskDriver.create();
    const EVENTS = {
      readable: this._reader,
      data: this._reader,
      end: this._reader,
      unpipe: this._reader,
      finish: this._writer,
      drain: this._writer,
    };

    this._readableState = this._reader._readableState;
    this._writableState = this._writer._writableState;

    this._copy(["write", "end"], this._writer);
    this._copy(["read", "setEncoding", "pipe", "unpipe"], this._reader);

    for (const method of ["on", "once", "removeListener", "removeListeners", "listeners"]) {
      this[method] = (ev, fn) =>
        EVENTS[ev] ? EVENTS[ev][method](ev, fn) : Duplex.prototype[method].call(this, ev, fn);
    }

    const processError = (error) => this.emit("error", error);
    this._reader.on("error", processError);
    this._writer.on("error", processError);
  }

  get _reader() {
    return this.vosk.stdout;
  }
  get _writer() {
    return this.vosk.stdin;
  }

  _copy(methods, target) {
    for (const method of methods) {
      this[method] = target[method].bind(target);
    }
  }

  _destroy(err, cb) {
    super._destroy(err, cb);
    this.once("error", () => {});
    this.process.kill("SIGKILL");
  }

  static create() {
    if (!fs.existsSync(process.env.VOSK_MODEL)) {
      console.error("Vosk is enabled, but VOSK_MODEL not defined");
    }
    return spawn(process.env.VOSK_PYTHON, [path.join(process.env.VOSK_SCRIPT), path.join(process.env.VOSK_MODEL)]);
  }
}

module.exports = VoskDriver;
