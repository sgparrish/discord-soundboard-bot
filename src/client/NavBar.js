import React from "react";
import { useSelector } from "react-redux";
import { Icon, Loader, Menu } from "semantic-ui-react";
import { Link, useRouteMatch } from "react-router-dom";

const NavItem = ({ title, path }) => (
  <Menu.Item active={!!useRouteMatch({ path })}>
    <Link to={path}>{title}</Link>
  </Menu.Item>
);

const NavStatus = ({ connecting, connected }) => (
  <Menu.Item active={false} position="right">
    {connecting && <Loader active inline size="tiny" title="Websocket connecting" />}
    {connected && <Icon name="checkmark" fitted color="grey" title="Websocket connected" />}
    {!connected && !connecting && <Icon name="warning sign" fitted color="grey" title="Websocket disconnected" />}
  </Menu.Item>
);

const NavBar = (props) => {
  const connecting = useSelector((state) => state.wsConnecting);
  const connected = useSelector((state) => state.wsConnected);
  return (
    <Menu pointing secondary>
      <Menu.Item header>Soundboard</Menu.Item>
      <NavItem title="Play" path="/play" />
      <NavItem title="Clip" path="/clip" />
      <NavStatus connecting={connecting} connected={connected} />
    </Menu>
  );
};

export default NavBar;
