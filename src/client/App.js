import React from "react";
import { Route, Switch, Redirect } from "react-router-dom";

import NavBar from "./NavBar";
import PlayPage from "./Pages/Play";
import ClipPage from "./Pages/Clip";
import { useClips, useWebSocketActions } from "./DataHooks";

const App = () => {

  useClips();
  useWebSocketActions();

  return (
    <div className="app">
      <NavBar />
      <Switch>
        <Route path="/play/:userId?/:soundName?" component={PlayPage} />
        <Route path="/clip/:recordingId?" component={ClipPage} />
        <Redirect to="/play" />
      </Switch>
    </div>
  );
};

export default App;
