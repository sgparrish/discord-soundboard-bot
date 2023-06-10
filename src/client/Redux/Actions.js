import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchSoundboardClips = createAsyncThunk("sounds/clips", async () => {
  const response = await fetch("/api/sounds/clips");
  return await response.json();
});

export const fetchSoundboardRecording = createAsyncThunk("sounds/recording", async (id) => {
  const response = await fetch(`/api/sounds/recordings/get/${id}`);
  return await response.json();
});

export const fetchSoundboardRecordings = createAsyncThunk("sounds/recordings", async ({ start, direction } = {}) => {
  const response = await fetch(
    `/api/sounds/recordings/page${start ? "/" + start : ""}${start && direction ? "/" + direction : ""}`
  );
  return await response.json();
});
