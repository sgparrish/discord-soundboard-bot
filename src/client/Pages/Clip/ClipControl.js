import React from "react";
import { useRouteMatch, useHistory } from "react-router-dom";
import { Button, Comment, Header, Input, Modal } from "semantic-ui-react";

import CommentEntry from "./CommentEntry";
import SoundSlider from "./SoundSlider";

const context = new AudioContext();

const ClipControl = ({ users, sounds }) => {
  const [loadingSound, setLoadingSound] = React.useState(false);
  const [times, setTimes] = React.useState([0, 1]);
  const [audioBuffer, setAudioBuffer] = React.useState(null);
  const [bufferSource, setBufferSource] = React.useState(null);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [soundName, setSoundName] = React.useState("");
  const [creatingSound, setCreatingSound] = React.useState(false);

  const match = useRouteMatch({
    path: `/clip/:userId/:soundId`,
  }) || { params: {} };
  const { userId, soundId } = match.params;

  const history = useHistory();

  const metadata = React.useMemo(() => {
    if (typeof userId === "undefined" || typeof soundId === "undefined" || sounds.length === 0) {
      return {};
    }
    return sounds.find((sound) => sound._id === soundId && sound.userId === userId);
  }, [users, sounds, userId, soundId]);

  React.useEffect(() => {
    if (typeof userId !== "undefined" && typeof soundId !== "undefined") {
      setLoadingSound(true);
      setTimes([0, 1]);
      setAudioBuffer(null);
      setBufferSource(null);
      setSoundName("");
      fetch(`/api/sound/${userId}/${soundId}`).then((res) =>
        res.arrayBuffer().then((arrayBuffer) => {
          context.decodeAudioData(arrayBuffer).then((audioBuffer) => {
            setLoadingSound(false);
            setTimes([0, audioBuffer.duration]);
            setAudioBuffer(audioBuffer);
            const source = context.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(context.destination);
            source.start();
            setBufferSource(source);
          });
        })
      );
    }
  }, [userId, soundId, setLoadingSound, setTimes, setAudioBuffer, setBufferSource, setSoundName]);

  const play = React.useCallback(() => {
    bufferSource.stop();
    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(context.destination);
    source.start(0, times[0], times[1] - times[0]);
    setBufferSource(source);
  }, [times, audioBuffer, bufferSource, setBufferSource]);

  const stop = React.useCallback(() => {
    bufferSource.stop();
  }, [bufferSource]);

  const toggleModal = React.useCallback(() => setModalOpen(!modalOpen), [modalOpen, setModalOpen]);

  const handleSoundNameChange = React.useCallback((event, data) => setSoundName(data.value), [setSoundName]);

  const createSound = React.useCallback(() => {
    setCreatingSound(true);
    fetch(`/api/sound/cut`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        soundId,
        start: times[0],
        end: times[1],
        name: soundName,
      }),
    })
      .then((res) => {
        history.push("/play");
      })
      .catch((err) => {
        setSoundName("");
        setModalOpen(false);
        setCreatingSound(false);
      });
  }, [userId, soundId, times, soundName, history, setModalOpen, setCreatingSound]);

  return (
    <div className="clip-control">
      <div className="clip-comment">
        <Comment.Group>
          <CommentEntry {...metadata} users={users} />
        </Comment.Group>
      </div>
      <Button.Group icon className="control-buttons">
        <Button icon="play" loading={loadingSound} disabled={!audioBuffer} onClick={play} />
        <Button icon="stop" loading={loadingSound} disabled={!audioBuffer} onClick={stop} />
        <Button icon="cut" loading={loadingSound} disabled={!audioBuffer} onClick={toggleModal} />
      </Button.Group>
      <div className="clip-slider">
        <SoundSlider duration={audioBuffer ? audioBuffer.duration : 60} times={times} setTimes={setTimes} />
      </div>
      <Modal open={modalOpen} closeIcon closeOnDimmerClick closeOnEscape onClose={toggleModal}>
        <Header icon="cut" content="Create sound" />
        <Modal.Content>
          <Comment.Group>
            <CommentEntry {...metadata} users={users} />
          </Comment.Group>
          <Input fluid label="Name" value={soundName} onChange={handleSoundNameChange} />
        </Modal.Content>
        <Modal.Actions>
          <Button
            primary
            content="Create"
            onClick={createSound}
            disabled={creatingSound || !soundName}
            loading={creatingSound}
          />
          <Button secondary content="Cancel" onClick={toggleModal} disabled={creatingSound} loading={creatingSound} />
        </Modal.Actions>
      </Modal>
    </div>
  );
};

export default ClipControl;
