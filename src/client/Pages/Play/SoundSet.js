import React from "react";
import { Accordion, Button, Card, Icon, Image } from "semantic-ui-react";

const SoundSet = ({ id, member, sounds, index, active, handleClick }) => {
  return (
    <React.Fragment>
      <Accordion.Title active={active} index={index} onClick={handleClick}>
        <Icon name="dropdown" />
        {member ? (
          <React.Fragment>
            <Image src={member.iconURL} avatar />
            <span>{member.name}</span>
          </React.Fragment>
        ) : (
          <span>{id}</span>
        )}
      </Accordion.Title>
      <Accordion.Content active={active}>
        <Card.Group>
          {sounds.map((sound) => (
            <Card>
              <Card.Content>
                {member ? <Image circular floated="right" size="mini" src={member.iconURL}  /> : null}
                <Card.Header textAlign="left">{sound}</Card.Header>
                <Card.Meta textAlign="left">{member ? member.name : id}</Card.Meta>
                <Button.Group basic fluid compact>
                  <Button icon="discord" onClick={() => fetch(`/api/clips/board/play/${id}/${sound}`)} />
                  <Button icon="play" onClick={() => fetch(`/api/clips/board/play/${id}/${sound}`)} />
                  <Button icon="download" onClick={() => fetch(`/api/clips/board/play/${id}/${sound}`)} />
                  <Button icon="star" onClick={() => fetch(`/api/clips/board/play/${id}/${sound}`)} />
                </Button.Group>
              </Card.Content>
            </Card>
          ))}
        </Card.Group>
      </Accordion.Content>
    </React.Fragment>
  );
};

export default SoundSet;
