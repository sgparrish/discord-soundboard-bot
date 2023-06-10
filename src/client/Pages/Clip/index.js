import React, { useCallback, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import ClipInterface from "./ClipInterface";
import Transcript from "./Transcript";
import PublishModal from "./PublishModal";
import { useRecording, usePrevPageRecordings, useNextPageRecordings, useInitialRecordings } from "../../DataHooks";

// #region RecordingCallbacks
const playRecording = ({ id }) => fetch(`/api/sounds/recordings/play/${id}`);
const saveRecording = ({ id }) => {
  const link = document.createElement("a");
  link.download = `${id}.mp3`;
  link.href = `/api/sounds/recordings/save/${id}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
const createClip = (id, name, start, end, successCallback, failCallback) => {
  return fetch(`/api/sounds/clips/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id,
      name,
      start,
      end,
    }),
  });
};
// #endregion

const ClipPage = ({ match }) => {
  useRecording(match?.params?.recordingId);
  // this only loads if there's no recordingId specified
  useInitialRecordings(match?.params?.recordingId);

  const recordings = useSelector((state) => state.recordings);
  let recording = useSelector((state) => state.recording) || recordings.find((x) => x.id === match.params.recordingId);
  if (match?.params?.recordingId !== recording?.id) recording = undefined;

  // #region RecordingLoading
  const loadingRecordingsTop = useSelector((state) => state.loadingRecordingsTop);
  const loadingRecordingsBottom = useSelector((state) => state.loadingRecordingsBottom);
  const hasMoreRecordingsTop = useSelector((state) => state.hasMoreRecordingsTop);
  const hasMoreRecordingsBottom = useSelector((state) => state.hasMoreRecordingsBottom);
  const loadPrevRecordings = usePrevPageRecordings();
  const loadNextRecordings = useNextPageRecordings();
  // #endregion

  // #region RecordingCallback
  const history = useHistory();
  const clipRecording = React.useCallback(
    ({ id }) => {
      history.push(`/clip/${id}`);
    },
    [history]
  );
  // #endregion

  // #region ClippingState
  const [times, setTimes] = useState([0, 1]);
  const [modalOpen, setModalOpen] = useState(false);

  const toggleModal = useCallback(() => setModalOpen(!modalOpen), [modalOpen, setModalOpen]);
  // #endregion

  return (
    <div className="clip-page">
      <ClipInterface recording={recording} times={times} setTimes={setTimes} toggleModal={toggleModal} />
      <Transcript
        recordings={recordings}
        selectedRecording={recording}
        clipRecording={clipRecording}
        playRecording={playRecording}
        saveRecording={saveRecording}
        loadingRecordingsTop={loadingRecordingsTop}
        loadingRecordingsBottom={loadingRecordingsBottom}
        hasMoreRecordingsTop={hasMoreRecordingsTop}
        hasMoreRecordingsBottom={hasMoreRecordingsBottom}
        loadPrevRecordings={loadPrevRecordings}
        loadNextRecordings={loadNextRecordings}
      />
      <PublishModal
        recording={recording}
        times={times}
        modalOpen={modalOpen}
        toggleModal={toggleModal}
        createClip={createClip}
      />
    </div>
  );
};

export default ClipPage;
