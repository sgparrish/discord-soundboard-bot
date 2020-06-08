import React from "react";
import { Route, Switch, Redirect } from "react-router-dom";

import ClipControl from "./ClipControl";
import Transcript from "./Transcript";
import Timeline from "./Timeline";

const ClipPage = ({ match }) => {
  const [users, setUsers] = React.useState([]);
  const [sounds, setSounds] = React.useState([]);

  React.useEffect(() => {
    fetch("/api/recorded").then((res) =>
      res.json().then((data) => {
        setUsers(data.users);
        setSounds(
          data.sounds.map((sound) => ({
            ...sound,
            start: new Date(sound.start), // unpack dates
            end: new Date(sound.end),
          }))
        );
      })
    );
  }, []);

  return (
    <div className="clip-page">
      <ClipControl users={users} sounds={sounds} />
      <Transcript users={users} sounds={sounds} />
      <Timeline users={users} sounds={sounds} />
    </div>
  );
};

export default ClipPage;
