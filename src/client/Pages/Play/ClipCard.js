import React from "react";
import { Button, Card, Image } from "semantic-ui-react";

const ClipCard = ({ clip, isFavorite, playClip, previewClip, downloadClip, toggleFavorite }) => {
  const { category, member, filename, fileModified, lastPlayed, playCount } = clip;
  const filenameParts = filename.split(".");
  filenameParts.pop();
  const filenameWithoutExt = filenameParts.join(".");

  return (
    <Card key={`${category}/${filename}`} className="clip-card">
      <Card.Content>
        {member ? <Image circular floated="right" size="mini" src={member.iconURL} width={32} height={32} /> : null}
        <Card.Header textAlign="left">{filenameWithoutExt}</Card.Header>
        <Card.Meta textAlign="left">{member ? member.name : category}</Card.Meta>
        <Button.Group fluid compact basic>
          <Button icon="discord" title="Play in Discord" onClick={() => playClip(clip)} />
          <Button icon="play" title="Play in browser" onClick={() => previewClip(clip)} />
          <Button icon="download" title="Download clip" onClick={() => downloadClip(clip)} />
          <Button active={isFavorite(clip)} icon="heart"  title="Favorite clip" toggle onClick={() => toggleFavorite(clip)} />
        </Button.Group>
      </Card.Content>
    </Card>
  );
};
export default ClipCard;
