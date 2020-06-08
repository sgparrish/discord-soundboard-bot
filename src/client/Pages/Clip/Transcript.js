import React from "react";
import { Comment } from "semantic-ui-react";
import { useRouteMatch } from "react-router-dom";

import CommentEntry from "./CommentEntry";

const Transcript = ({ users, sounds }) => {
  const match = useRouteMatch({
    path: `/clip/:userId/:soundId`,
  }) || { params: {} };
  const { userId, soundId } = match.params;

  React.useEffect(() => {
    if (sounds.length > 0 && soundId) {
      const childIndex = sounds.findIndex((sound) => sound._id === soundId);
      document
        .getElementsByClassName("transcript")[0]
        .children[childIndex].scrollIntoView({ behavior: "smooth" });
    }
  }, [sounds, soundId]);

  return (
    <Comment.Group className="transcript">
      {sounds.map((sound) => (
        <CommentEntry link key={sound._id} {...sound} users={users} highlight={soundId === sound._id} />
      ))}
    </Comment.Group>
  );
};

export default Transcript;
