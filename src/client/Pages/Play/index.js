import React from "react";
import { Accordion, Container } from "semantic-ui-react";
import SoundSet from "./SoundSet";

const SoundboardPage = (props) => {
  const [users, setUsers] = React.useState([]);
  const [sounds, setSounds] = React.useState([]);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  React.useEffect(() => {
    fetch("/api/sounds").then((res) =>
      res.json().then((data) => {
        setUsers(data.users);
        setSounds(data.sounds);
      })
    );
  }, []);

  const sortedSets = React.useMemo(() => {
    const soundsCopy = sounds.slice();
    soundsCopy.sort((a, b) => {
      const aUser = users.find((user) => user.id === a.category);
      const bUser = users.find((user) => user.id === b.category);
      if (aUser && aUser.name && bUser && bUser.name) {
        if (aUser.name.toLowerCase() < bUser.name.toLowerCase()) return -1;
        if (aUser.name.toLowerCase() > bUser.name.toLowerCase()) return 1;
        return 0;
      } else if (aUser && !bUser) {
        return 1;
      } else if (!aUser && bUser) {
        return -1;
      } else {
        if (a.category.toLowerCase() < b.category.toLowerCase()) return -1;
        if (a.category.toLowerCase() > b.category.toLowerCase()) return 1;
        return 0;
      }
    });
    return soundsCopy;
  }, [users, sounds]);

  return (
    <Container className="soundboard-page">
      <Accordion styled fluid>
        {sortedSets.map((set, index) => {
          const user = users.find((u) => u.id === set.category);
          return (
            <SoundSet
              key={set.category}
              active={activeIndex === index}
              index={index}
              soundset={set}
              user={user}
              handleClick={() => {
                if (activeIndex === index) {
                  setActiveIndex(-1);
                } else {
                  setActiveIndex(index);
                }
              }}
            />
          );
        })}
      </Accordion>
    </Container>
  );
};

export default SoundboardPage;
