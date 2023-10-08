import React, { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Checkbox, Container, Dropdown, Menu } from "semantic-ui-react";
import useCookie from "react-use-cookie";

import ClipCardGroup from "./ClipCardGroup";

const useFavorites = () => {
  const [favorites, setFavorites] = useCookie("favorites", "[]");
  return [JSON.parse(favorites), (favorites) => setFavorites(JSON.stringify(favorites))];
};

// #region ClipCallbacks
const playClip = ({ category, filename }) => fetch(`/api/sounds/clips/play/${category}/${filename}`);
const downloadClip = ({ category, filename }) => {
  const link = document.createElement("a");
  link.download = filename;
  link.href = `/api/sounds/clips/save/${category}/${filename}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const context = new AudioContext();
let source = null;
const previewClip = async ({ category, filename }) => {
  const res = await fetch(`/api/sounds/clips/save/${category}/${filename}`);
  const buf = await res.arrayBuffer();
  const audioBuf = await context.decodeAudioData(buf);
  if (source !== null) source.stop();
  source = context.createBufferSource();
  source.buffer = audioBuf;
  source.connect(context.destination);
  source.start();
};
// #endregion

const SoundboardPage = () => {
  const allClips = useSelector((state) => state.clips);
  const [favorites, setFavorites] = useFavorites();

  // #region FavoriteCallbacks
  const isFavorite = useCallback(
    ({ category, filename }) => favorites.some(([c, f]) => category === c && filename === f),
    [favorites]
  );
  const toggleFavorite = useCallback(
    ({ category, filename }) => {
      const idx = favorites.findIndex(([c, f]) => category === c && filename === f);
      if (idx === -1) favorites.push([category, filename]);
      else favorites.splice(idx, 1);
      setFavorites(favorites);
    },
    [favorites, setFavorites]
  );
  // #endregion

  // #region ClipFiltering
  const [onlyFavorites, setOnlyFavorites] = useState(favorites.length > 0);
  const [sortBy, setSortBy] = useState("lastPlayed");
  const [groupByUser, setGroupByUser] = useState(false);

  const clips = useMemo(() => {
    const filteredClips = allClips.filter((x) => !onlyFavorites || isFavorite(x));

    filteredClips.sort((a, b) => {
      const aVector = [];
      const bVector = [];

      aVector.push(isFavorite(a));
      bVector.push(isFavorite(b));

      aVector.push(a.member !== undefined);
      bVector.push(b.member !== undefined);

      if (sortBy === "lastPlayed") {
        aVector.push(a.lastPlayed);
        bVector.push(b.lastPlayed);
        aVector.push(a.fileModified);
        bVector.push(b.fileModified);
        aVector.push(a.filename);
        bVector.push(a.filename);
      } else if (sortBy === "clipName") {
        aVector.push(a.filename);
        bVector.push(a.filename);
      } else if (sortBy === "newest") {
        aVector.push(a.fileModified);
        bVector.push(b.fileModified);
        aVector.push(a.filename);
        bVector.push(a.filename);
      } else if (sortBy === "mostPlayed") {
        aVector.push(a.playCount);
        bVector.push(b.playCount);
        aVector.push(a.fileModified);
        bVector.push(b.fileModified);
        aVector.push(a.filename);
        bVector.push(a.filename);
      }

      for (let i = 0; i < aVector.length; i++) {
        const aVal = aVector[i];
        const bVal = bVector[i];

        if (aVal < bVal) return 1;
        if (aVal > bVal) return -1;
      }

      return 0;
    });

    return filteredClips;
  }, [allClips, favorites, onlyFavorites, sortBy, groupByUser]);

  const clipGroups = useMemo(
    () =>
      Array.from(
        clips
          .reduce((groupMap, clip) => {
            const groupClips = groupMap.has(clip.category) ? groupMap.get(clip.category) : [];
            groupClips.push(clip);
            groupMap.set(clip.category, groupClips);
            return groupMap;
          }, new Map())
          .values()
      ),
    [clips]
  );
  // #endregion

  return (
    <Container className="soundboard-page" fluid>
      <Menu secondary stackable>
        <Dropdown
          item
          options={[
            { key: 0, text: "Show All Clips", value: false },
            { key: 1, text: "Show Just My Favorites", value: true },
          ]}
          value={onlyFavorites}
          onChange={(e, {value}) => setOnlyFavorites(value)}
        />
        <Dropdown
          item
          options={[
            { key: 0, text: "Sort by Last Played", value: "lastPlayed" },
            { key: 1, text: "Sort by Clip Name", value: "clipName" },
            { key: 2, text: "Sort by Newest", value: "newest" },
            { key: 3, text: "Sort by Most Played", value: "mostPlayed" },
          ]}
          value={sortBy}
          onChange={(e, {value}) => setSortBy(value)}
        />
        <Menu.Item content="" disabled />
        <Menu.Item active={groupByUser} onClick={() => setGroupByUser(!groupByUser)}>
          <Checkbox label="Group by user" checked={groupByUser} />
        </Menu.Item>
      </Menu>
      {groupByUser ? (
        <>
          {clipGroups.map((clips) => (
            <ClipCardGroup
              clips={clips}
              isFavorite={isFavorite}
              playClip={playClip}
              previewClip={previewClip}
              downloadClip={downloadClip}
              toggleFavorite={toggleFavorite}
              groupByUser={groupByUser}
            />
          ))}
        </>
      ) : (
        <ClipCardGroup
          clips={clips}
          isFavorite={isFavorite}
          playClip={playClip}
          previewClip={previewClip}
          downloadClip={downloadClip}
          toggleFavorite={toggleFavorite}
          groupByUser={groupByUser}
        />
      )}
    </Container>
  );
};

export default SoundboardPage;
