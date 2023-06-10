const ws = require("ws");

const Persistence = require("./persistence");
const Serialization = require("./serialization");

class WebSockets {
  initialize(httpServer) {
    this.wsServer = new ws.Server({ server: httpServer });
    this.clients = new Set();

    this.wsServer.on("connection", this.onConnection.bind(this));

    Persistence.on(Persistence.events.recording.create.success, this.recordingCreated.bind(this));
    Persistence.on(Persistence.events.recording.update.success, this.recordingUpdated.bind(this));
    Persistence.on(Persistence.events.recording.delete.success, this.recordingDeleted.bind(this));

    Persistence.on(Persistence.events.clip.create.success, this.clipCreated.bind(this));
    Persistence.on(Persistence.events.clip.update.success, this.clipUpdated.bind(this));
    Persistence.on(Persistence.events.clip.delete.success, this.clipDeleted.bind(this));
  }

  // #region WebSocket Events
  async onConnection(client) {
    this.clients.add(client);

    client.on("close", (code, reason) => {
      this.clients.delete(client);
    });
  }
  // #endregion

  // #region Recording Events
  async recordingCreated(recording) {
    const recordingDto = await Serialization.toRecordingDTO(recording);
    this.clients.forEach((client) => {
      client.send(
        JSON.stringify({
          type: "ws/create",
          collection: "recordings",
          payload: [recordingDto],
        })
      );
    });
  }

  async recordingUpdated(recording) {
    const recordingDto = await Serialization.toRecordingDTO(recording);
    this.clients.forEach((client) => {
      client.send(
        JSON.stringify({
          type: "ws/update",
          collection: "recordings",
          payload: [recordingDto],
        })
      );
    });
  }

  async recordingDeleted(recording) {
    const recordingDto = await Serialization.toRecordingDTO(recording);
    this.clients.forEach((client) => {
      client.send(
        JSON.stringify({
          type: "ws/delete",
          collection: "recordings",
          payload: [recordingDto],
        })
      );
    });
  }
  // #endregion

  // #region Clip Events
  async clipCreated(clip) {
    const clipDto = await Serialization.toClipDTO(clip);
    this.clients.forEach((client) => {
      client.send(
        JSON.stringify({
          type: "ws/create",
          collection: "clips",
          payload: [clipDto],
        })
      );
    });
  }

  async clipUpdated(clip) {
    const clipDto = await Serialization.toClipDTO(clip);
    this.clients.forEach((client) => {
      // this functionality is kind of annoying so it's disabled
      /* client.send(JSON.stringify({
        type: "ws/update",
        collection: "clips",
        payload: [clipDto],
      })); */
    }); 
  }

  async clipDeleted(clip) {
    const clipDto = await Serialization.toClipDTO(clip);
    this.clients.forEach((client) => {
      client.send(
        JSON.stringify({
          type: "ws/delete",
          collection: "clips",
          payload: [clipDto],
        })
      );
    });
  }
  // #endregion
}

module.exports = new WebSockets();
