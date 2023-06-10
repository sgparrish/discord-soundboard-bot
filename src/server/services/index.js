const loadServices = (httpServer) => {
  require("./websockets").initialize(httpServer);

  // Core discord servers
  require("./discord/client");
  require("./discord/voice");

  // Discord addons
  require("./discord/adminchannel");
  require("./discord/userchannel");
  require("./discord/clipchannel");
  require("./discord/recordingchannel");

  // Other addons
  require("./speechtotext");
  require("./websockets");
};

module.exports = loadServices;
