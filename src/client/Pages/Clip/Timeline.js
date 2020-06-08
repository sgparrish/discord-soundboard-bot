import React from "react";
import { useRouteMatch, useHistory } from "react-router-dom";
import Timeline from "react-visjs-timeline";

const groupTemplate = (group, element, data) =>
  `<div class="user-label"><img class="user-image" src="${group ? group.image : ""}"/><span>${
    group ? group.content : ""
  }</span></div>`;

const TalkingTimeline = ({ users, sounds }) => {
  const timelineRef = React.useRef(null);

  const match = useRouteMatch({
    path: `/clip/:userId/:soundId`,
  }) || { params: {} };
  const { userId, soundId } = match.params;

  React.useEffect(() => {
    if (timelineRef.current.$el.itemSet.itemsData.length > 0) {
      timelineRef.current.$el.setSelection(soundId, { focus: true, animation: true });
    }
  }, [timelineRef, soundId]);

  const { items, groups, startTime, endTime } = React.useMemo(() => {
    if (sounds.length === 0) {
      return { items: [], groups: [], startTime: new Date(), endTime: new Date(new Date().getTime() + 30 * 60 * 1000) };
    }
    const items = sounds.map((sound) => ({
      id: sound._id,
      group: sound.userId,
      content: sound.text || "...",
      title: sound.text || "...",
      start: sound.start,
      end: sound.end,
    }));
    const groups = users.map((user) => {
      return {
        id: user.id,
        content: user.name || user.id,
        image: user.image,
      };
    });

    const startTime = items.reduce((minTime, item) => (item.start < minTime ? item.start : minTime), items[0].start);
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

    return { items, groups, startTime, endTime };
  }, [users, sounds]);

  const history = useHistory();

  const onSelect = React.useCallback(
    ({ items: selected, event }) => {
      if (selected.length > 0 && sounds.length > 0) {
        const userId = sounds.find((sound) => sound._id === selected[0]).userId;
        history.push(`/clip/${userId}/${selected[0]}`);
      }
    },
    [sounds, history]
  );

  return (
    <div className="timeline">
      <Timeline
        ref={timelineRef}
        items={items}
        groups={groups}
        options={{
          multiselect: false,
          stack: false,
          minHeight: "200px",
          height: "100%",
          zoomMax: 3600000,
          groupTemplate,
          start: startTime,
          end: endTime,
        }}
        selectHandler={onSelect}
      />
    </div>
  );
};

// Guard against shitty
export default ({ users, sounds }) => {
  if (users.length === 0 || sounds.length === 0) {
    return null;
  }
  return <TalkingTimeline users={users} sounds={sounds} />;
};
