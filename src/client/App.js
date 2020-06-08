import React from "react";
import { Route, Switch, Redirect } from "react-router-dom";

import NavBar from "./NavBar";
import PlayPage from "./Pages/Play";
import ClipPage from "./Pages/Clip";

const App = () => {
  return (
    <div className="app">
      <NavBar />
      <Switch>
        <Route path="/play" component={PlayPage} />
        <Route path="/clip" component={ClipPage} />
        <Redirect to="/play" />
      </Switch>
    </div>
  );
};

export default App;
