import React, { useState } from "react";
import { Accordion, Card, Divider, Icon, Image } from "semantic-ui-react";

import ClipCard from "./ClipCard";

const ClipCardGroup = ({ clips, isFavorite, playClip, previewClip, downloadClip, toggleFavorite, groupByUser }) => {
  const [active, setActive] = useState(false);

  const { category, member } = clips[0] || {};

  const label = member ? (
    <>
      <Image circular size="mini" src={member.iconURL} />
      &nbsp;
      <span>{member.name}</span>
    </>
  ) : (
    <span>{category}</span>
  );

  const cardGroup = (
    <Card.Group centered>
      {clips.map((clip) => (
        <ClipCard
          clip={clip}
          isFavorite={isFavorite}
          playClip={playClip}
          previewClip={previewClip}
          downloadClip={downloadClip}
          toggleFavorite={toggleFavorite}
        />
      ))}
    </Card.Group>
  );

  if (groupByUser) {
    return (
      <Accordion fluid styled>
        <Accordion.Title active={active} index={category} onClick={() => setActive(!active)}>
          <Icon name="dropdown" />
          {label}
        </Accordion.Title>
        <Accordion.Content active={active}>
          {cardGroup}
        </Accordion.Content>
      </Accordion>
    );
  }
  return cardGroup;
};

export default ClipCardGroup;
