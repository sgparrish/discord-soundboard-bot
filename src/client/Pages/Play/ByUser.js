import React from "react";
import { useSelector } from "react-redux";
import { Accordion } from "semantic-ui-react";

import SoundSet from "./SoundSet";

const SoundboardPage = () => {
  const board = useSelector((state) => state.board);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  return (
      <Accordion styled fluid>
      </Accordion>
  );
};

export default SoundboardPage;
