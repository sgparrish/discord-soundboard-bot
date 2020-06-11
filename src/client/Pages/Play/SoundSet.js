import React from "react";
import { Accordion, Button, Icon } from "semantic-ui-react";

const SoundSet = ({ soundset, index, user, active, handleClick }) => {
  const label = user.name ? (
    <React.Fragment>
      <img class="user-image" src={user.image} />
      <span>{user.name}</span>
    </React.Fragment>
  ) : (
    <span>{soundset.category}</span>
  );
  return (
    <div>
      <Accordion.Title active={active} index={index} onClick={handleClick}>
        <Icon name="dropdown" />
        {label}
      </Accordion.Title>
      <Accordion.Content active={active}>
        {soundset.sounds.map((sound) => (
          <Button
            key={sound}
            size={"mini"}
            onClick={React.useCallback(() => {
              fetch(`/api/sound/play/published/${soundset.category}/${sound}`);
            })}
          >
            {sound}
          </Button>
        ))}
      </Accordion.Content>
    </div>
  );
};

export default SoundSet;
