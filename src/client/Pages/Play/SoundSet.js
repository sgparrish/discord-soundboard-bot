import React from "react";
import { Accordion, Button, Icon } from "semantic-ui-react";

const context = new AudioContext();

const SoundSet = ({ soundset, index, user, active, handleClick }) => {
  const bufferSource = React.useRef(null);

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
        {soundset.sounds.map(({ sound }) => (
          <Button.Group key={sound} compact size="mini" basic>
            <Button content={sound} onClick={() => fetch(`/api/sound/play/published/${soundset.category}/${sound}`)} />
            <Button
              icon="play"
              onClick={() =>
                fetch(`/api/sound/published/${soundset.category}/${sound}`).then((res) =>
                  res.arrayBuffer().then((arrayBuffer) =>
                    context.decodeAudioData(arrayBuffer).then((audioBuffer) => {
                      if (bufferSource.current !== null) bufferSource.current.stop();
                      const source = context.createBufferSource();
                      bufferSource.current = source;
                      source.buffer = audioBuffer;
                      source.connect(context.destination);
                      source.start();
                    })
                  )
                )
              }
            />
          </Button.Group>
        ))}
      </Accordion.Content>
    </div>
  );
};

export default SoundSet;
