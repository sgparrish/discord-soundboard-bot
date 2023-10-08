import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

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
      <Routes>
        <Route path="/play/:userId?/:soundName?" element={<PlayPage />} />
        <Route path="/clip/:recordingId?" element={<ClipPage />} />
        <Route path="*" element={<Navigate to="/play"/>} />
      </Routes>
    </div>
  );
};

export default App;
