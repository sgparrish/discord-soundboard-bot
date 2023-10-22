import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchSoundboardClips,
  fetchSoundboardRecording,
  fetchSoundboardRecordings,
} from "./Redux/Actions";

export const useClips = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchSoundboardClips());
  }, [dispatch, fetchSoundboardClips]);
};

export const useRecording = (id) => {
  const dispatch = useDispatch();
  useEffect(() => {
    if (id) dispatch(fetchSoundboardRecording(id));
  }, [id, dispatch, fetchSoundboardRecording]);
};

export const useInitialRecordings = (recordingId) => {
  const dispatch = useDispatch();
  const recordings = useSelector((state) => state.recordings);
  useEffect(() => {
    if (recordingId === undefined && recordings.length === 0) dispatch(fetchSoundboardRecordings());
  }, []);
};

export const usePrevPageRecordings = () => {
  const dispatch = useDispatch();
  const loadingRecordingsTop = useSelector((state) => state.loadingRecordingsTop);
  const recordings = useSelector((state) => state.recordings);
  return useCallback(() => {
    if (!loadingRecordingsTop && recordings.length > 0) {
      dispatch(fetchSoundboardRecordings({ start: recordings[0].start, direction: "up" }));
    }
  }, [loadingRecordingsTop, recordings, dispatch, fetchSoundboardRecordings]);
};

export const useNextPageRecordings = () => {
  const dispatch = useDispatch();
  const loadingRecordingsBottom = useSelector((state) => state.loadingRecordingsBottom);
  const recordings = useSelector((state) => state.recordings);
  return useCallback(() => {
    if (!loadingRecordingsBottom && recordings.length > 0) {
      dispatch(fetchSoundboardRecordings({ start: recordings[recordings.length - 1].start, direction: "down" }));
    }
  }, [loadingRecordingsBottom, recordings, dispatch, fetchSoundboardRecordings]);
};

export const useWebSocketActions = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    const connect = () => {
      dispatch({ type: "ws/connect" });
      const ws = new WebSocket(`ws://${window.location.host}`);
      ws.onopen = (evt) => {
        dispatch({ type: "ws/open" });
      };
      ws.onmessage = (message) => {
        let action = null;
        try {
          action = JSON.parse(message.data);
        } catch (ex) {
          console.error(ex);
        }
        if (action && action.type) dispatch(action);
      };
      ws.onerror = (evt) => {
        console.error(evt);
        ws.close();
      };
      ws.onclose = () => {
        dispatch({ type: "ws/close" });
        setTimeout(() => {
          connect();
        }, 5000);
      };
    };
    connect();
  }, [dispatch]);
};
