const collectionMatchFunctions = {
  clips: (a, b) => a.category === b.category && a.filename === b.filename,
  recordings: (a, b) => a.id === b.id,
};

const collectionCreateEnabledFunctions = {
  clips: (state) => true,
  recordings: (state) => !state.hasMoreRecordingsBottom,
};

export default (
  state = {
    loadingClips: false,
    clips: [],

    loadingRecording: false,
    recording: null,

    loadingRecordingsTop: false,
    loadingRecordingsBottom: false,
    hasMoreRecordingsTop: false,
    hasMoreRecordingsBottom: false,
    recordings: [],

    wsConnecting: false,
    wsConnected: false,
  },
  action
) => {
  switch (action.type) {
    case "sounds/clips/pending":
      return { ...state, loadingClips: true };
    case "sounds/clips/fulfilled":
      return { ...state, loadingClips: false, clips: action.payload };

    case "sounds/recording/pending":
      return { ...state, loadingRecording: true };
    case "sounds/recording/fulfilled": {
      if (state.recordings.some((r) => r.id === action.payload.id))
        return { ...state, loadingRecording: false, recording: action.payload };
      return {
        ...state,
        loadingRecording: false,
        recording: action.payload,

        loadingRecordingsTop: false,
        loadingRecordingsBottom: false,
        hasMoreRecordingsTop: true,
        hasMoreRecordingsBottom: true,
        recordings: [action.payload],
      };
    }

    case "sounds/recordings/pending": {
      const direction = action?.meta?.arg?.direction;
      if (direction === "up" || direction === undefined) return { ...state, loadingRecordingsTop: true };
      if (direction === "down") return { ...state, loadingRecordingsBottom: true };
      return state;
    }
    case "sounds/recordings/fulfilled": {
      const direction = action?.meta?.arg?.direction;
      if (direction === "up" || direction === undefined)
        return {
          ...state,
          loadingRecordingsTop: false,
          hasMoreRecordingsTop: action.payload.length > 0,
          recordings: [...action.payload, ...state.recordings],
        };
      if (direction === "down")
        return {
          ...state,
          loadingRecordingsBottom: false,
          hasMoreRecordingsBottom: action.payload.length > 0,
          recordings: [...state.recordings, ...action.payload],
        };
      return state;
    }

    case "ws/connect":
      return { ...state, wsConnecting: true, wsConnected: false };
    case "ws/open":
      return { ...state, wsConnecting: false, wsConnected: true };
    case "ws/close":
      return { ...state, wsConnecting: false, wsConnected: false };

    case "ws/create": {
      const enabled = collectionCreateEnabledFunctions[action.collection](state);
      if (!enabled) return state;
      return { ...state, [action.collection]: [...state[action.collection], ...action.payload] };
    }
    case "ws/update": {
      const match = collectionMatchFunctions[action.collection];
      const collection = [...state[action.collection]];
      action.payload.forEach((x) => {
        const idx = collection.findIndex((y) => match(x, y));
        if (idx !== -1) collection[idx] = x;
      });
      return { ...state, [action.collection]: collection };
    }
    case "ws/delete": {
      const match = collectionMatchFunctions[action.collection];
      const collection = [...state[action.collection]].filter((x) => !action.payload.some((y) => match(x, y)));
      return { ...state, [action.collection]: collection };
    }
    default:
      return state;
  }
};
