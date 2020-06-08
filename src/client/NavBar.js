import React from "react";
import { Menu } from "semantic-ui-react";
import { Link, useRouteMatch } from "react-router-dom";

const NavItem = ({ title, path }) => (
  <Menu.Item active={!!useRouteMatch({ path })}>
    <Link to={path}>{title}</Link>
  </Menu.Item>
);

const NavBar = (props) => {
  return (
    <Menu pointing secondary>
      <Menu.Item header>Soundboard</Menu.Item>
      <NavItem title="Play" path="/play" />
      <NavItem title="Clip" path="/clip" />
    </Menu>
  );
};

export default NavBar;
