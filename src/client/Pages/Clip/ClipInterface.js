import React, { useEffect, useState, useRef } from "react";
import { useCallback } from "react";
import { Button, Comment, Header, Input, Modal } from "semantic-ui-react";
import RecordingComment from "./RecordingComment";

import SoundSlider from "./SoundSlider";

// #region SoundControl
const useSoundPlayer = (soundUrl, onNewSound) => {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioContextRef = useRef(new AudioContext());
  const audioBufferRef = useRef(null);
  const bufferSourceRef = useRef(null);

  const context = audioContextRef.current;

  const play = (start, end) => {
    const audioBuffer = audioBufferRef.current;
    if (audioBuffer === null) return;
    let bufferSource = bufferSourceRef.current;
    if (bufferSource !== null) bufferSource.stop();

    bufferSource = context.createBufferSource();
    bufferSource.buffer = audioBuffer;
    bufferSource.connect(context.destination);
    bufferSource.addEventListener("ended", () => setPlaying(false));
    if (typeof start === "number" && typeof end === "number") bufferSource.start(0, start, end - start);
    else bufferSource.start();
    bufferSourceRef.current = bufferSource;

    setPlaying(context.state === "running");
  };

  const stop = () => {
    if (bufferSourceRef.current !== null) bufferSourceRef.current.stop();
    setPlaying(false);
  };

  useEffect(() => {
    if (typeof soundUrl !== "string") return;
    stop();
    setLoading(true);
    (async () => {
      const response = await fetch(soundUrl);
      const arrayBuffer = await response.arrayBuffer();
      audioBufferRef.current = await context.decodeAudioData(arrayBuffer);
      setLoading(false);
      onNewSound(audioBufferRef.current.duration);
      play();
    })();
  }, [soundUrl, onNewSound]);

  return { play, stop, playing, loading, length: audioBufferRef.current?.duration };
};
// #endregion

const ClipInterface = ({ recording, times, setTimes, toggleModal }) => {
  // #region SetupSoundPlayer
  const soundUrl = recording && recording.id ? `/api/sounds/recordings/save/${recording.id}` : undefined;
  const onNewSound = useCallback(
    (length) => {
      setTimes([0, length]);
    },
    [setTimes]
  );
  const { play, stop, playing, loading, length } = useSoundPlayer(soundUrl, onNewSound);
  // #endregion

  return (
    <div className="clip-interface">
      <div className="clip-comment">
        <Comment.Group>
          <RecordingComment recording={recording} />
        </Comment.Group>
      </div>
      <div className="control-buttons">
        <Button.Group icon basic>
          <Button
            icon={playing ? "stop" : "play"}
            title={playing ? "Stop recording" : "Play recording"}
            disabled={recording === undefined}
            loading={loading}
            onClick={playing ? () => stop() : () => play(times[0], times[1])}
          />
          <Button
            content="Publish"
            title="Publish clip"
            disabled={recording === undefined}
            loading={loading}
            onClick={() => toggleModal()}
          />
        </Button.Group>
      </div>
      <div className="clip-slider">
        <SoundSlider duration={length || 60} times={times} setTimes={setTimes} />
      </div>
    </div>
  );
};

export default ClipInterface;
