import React from "react";
import moment from "moment";
import { Comment, Icon, Loader } from "semantic-ui-react";

const RecordingComment = ({
  recording = {
    text: "...",
    status: "completed",
    member: { name: "", iconURL: "https://cdn.discordapp.com/embed/avatars/0.png" },
  },
  selected = false,
  clipRecording,
  playRecording,
  saveRecording,
}) => {
  const {
    id,
    userId,
    start,
    end,
    text,
    status,
    member: { name, iconURL },
  } = recording;
  return (
    <Comment onClick={() => clipRecording(recording)} className={selected ? "selected" : undefined}>
      <Comment.Avatar src={iconURL} />
      <Comment.Content>
        <Comment.Author title={userId}>
          <span>{name}</span>
        </Comment.Author>
        <Comment.Metadata title={start ? moment(start).toISOString() : undefined}>
          {start ? moment(start).format("lll") : ""}
        </Comment.Metadata>
        <Comment.Text>
          {status === "completed" ? (
            text || "..."
          ) : (
            <>
              <Loader active inline size="mini" /> pending
            </>
          )}
        </Comment.Text>
        <Comment.Actions>
          {typeof clipRecording === "function" && (
            <Comment.Action
              onClick={(evt) => {
                clipRecording(recording);
                evt.stopPropagation();
              }}
            >
              <Icon name="cut" />
              Clip
            </Comment.Action>
          )}
          {typeof playRecording === "function" && (
            <Comment.Action
              onClick={(evt) => {
                playRecording(recording);
                evt.stopPropagation();
              }}
            >
              <Icon name="discord" />
              Play on Discord
            </Comment.Action>
          )}
          {typeof saveRecording === "function" && (
            <Comment.Action
              onClick={(evt) => {
                saveRecording(recording);
                evt.stopPropagation();
              }}
            >
              <Icon name="save" />
              Save
            </Comment.Action>
          )}
        </Comment.Actions>
      </Comment.Content>
    </Comment>
  );
};
export default RecordingComment;
