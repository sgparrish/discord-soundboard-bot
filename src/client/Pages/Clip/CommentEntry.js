import React from "react";
import moment from "moment";
import { Comment } from "semantic-ui-react";
import { useHistory } from "react-router-dom";

const CommentEntry = ({ _id, userId, start, end, text, users, link, highlight }) => {
  const user = users.find((user) => user.id === userId) || {};
  const history = useHistory();
  const onClick = React.useCallback(() => {
    if (link) {
      history.push(`/clip/${userId}/${_id}`);
    }
  }, [link, history]);

  return (
    <Comment className={`${highlight ? "highlight " : ""}${link ? "link " : ""}`} onClick={onClick}>
      <Comment.Avatar src={user.image} />
      <Comment.Content>
        <Comment.Author>{user.name}</Comment.Author>
        <Comment.Metadata>{moment(start).format("lll")}</Comment.Metadata>
        <Comment.Text>{text || "..."}</Comment.Text>
      </Comment.Content>
    </Comment>
  );
};
export default CommentEntry;
