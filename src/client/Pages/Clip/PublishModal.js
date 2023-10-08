import React, { useState, useCallback, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Header, Input, Modal } from "semantic-ui-react";

const PublishModal = ({ recording, times, modalOpen, toggleModal, createClip }) => {
  const inputRef = useRef();
  const [soundName, setSoundName] = useState("");
  const [creatingSound, setCreatingSound] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setSoundName(recording && recording.text && recording.text !== "..." ? recording.text.substring(0, 25) : "");
  }, [recording]);

  useLayoutEffect(() => {
    if (modalOpen && inputRef.current) {
      inputRef.current.select();
    }
  }, [modalOpen]);

  const handleSoundNameChange = useCallback((event, data) => setSoundName(data.value), [setSoundName]);
  const createSound = useCallback(() => {
    setCreatingSound(true);
    createClip(recording.id, soundName, times[0], times[1])
      .then((_) => {
        setCreatingSound(false);
        navigate(`/play`);
      })
      .catch((_) => {
        setSoundName("");
        setCreatingSound(false);
      });
  }, [recording, soundName, times, setSoundName, setCreatingSound]);

  return (
    <Modal open={modalOpen} closeIcon closeOnDimmerClick closeOnEscape onClose={toggleModal}>
      <Header icon="cut" content="Publish clip" />
      <Modal.Content>
        <Input ref={inputRef} fluid label="Name" value={soundName} onChange={handleSoundNameChange} />
      </Modal.Content>
      <Modal.Actions>
        <Button
          primary
          content="Publish"
          onClick={createSound}
          disabled={creatingSound || !soundName}
          loading={creatingSound}
        />
        <Button secondary content="Cancel" onClick={toggleModal} disabled={creatingSound} loading={creatingSound} />
      </Modal.Actions>
    </Modal>
  );
};

export default PublishModal;
