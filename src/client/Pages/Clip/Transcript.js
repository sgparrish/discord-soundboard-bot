import React from "react";
import { Comment, Loader } from "semantic-ui-react";
import InfiniteScroller from "./InfiniteScroller";

import RecordingComment from "./RecordingComment";

const Transcript = ({
  recordings,
  selectedRecording,
  clipRecording,
  playRecording,
  saveRecording,

  loadingRecordingsTop,
  loadingRecordingsBottom,
  hasMoreRecordingsTop,
  hasMoreRecordingsBottom,
  loadPrevRecordings,
  loadNextRecordings,
}) => {
  return (
    <InfiniteScroller
      className="transcript"
      loadingTop={loadingRecordingsTop}
      loadingBottom={loadingRecordingsBottom}
      hasMoreTop={hasMoreRecordingsTop}
      hasMoreBottom={hasMoreRecordingsBottom}
      loadMoreTop={loadPrevRecordings}
      loadMoreBottom={loadNextRecordings}
      topMargin={30}
      bottomMargin={30}
      stickToBottom
      startAtBottom
      loaderComponent={<Loader active inline />}
    >
      <Comment.Group>
        {recordings.map((recording) => (
          <RecordingComment
            recording={recording}
            selected={recording.id === selectedRecording?.id}
            clipRecording={clipRecording}
            playRecording={playRecording}
            saveRecording={saveRecording}
          />
        ))}
      </Comment.Group>
    </InfiniteScroller>
  );
};

export default Transcript;
