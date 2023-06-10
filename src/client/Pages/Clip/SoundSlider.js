import React from "react";
import { Slider, Rail, Handles, Tracks, Ticks } from "react-compound-slider";

import "./SoundSlider.css";

const SliderRail = ({ playbackPercent, getRailProps }) => (
  <React.Fragment>
    <div className="outer rail" {...getRailProps()} />
    <div className="inner rail" />
    <div className="playback rail" style={{width: `${playbackPercent}%`}}/>
  </React.Fragment>
);

const Handle = ({ domain: [min, max], handle: { id, value, percent }, disabled, getHandleProps }) => (
  <React.Fragment>
    <div className="outer slider" style={{ left: `${percent}%`, cursor: "ew-resize" }} {...getHandleProps(id)} />
    <div className={`inner slider${disabled ? " disalbed" : ""}`} style={{ left: `${percent}%` }} />
  </React.Fragment>
);

const Track = ({ source, target, getTrackProps, disabled }) => (
  <div
    className="track"
    style={{
      left: `${source.percent}%`,
      width: `${target.percent - source.percent}%`,
    }}
    {...getTrackProps()}
  />
);

const Tick = ({ tick, count, format = (x) => x }) => {
  return (
    <div className="tick">
      <div className="tick-mark" style={{ left: `${tick.percent}%` }} />
      <div
        className="tick-label"
        style={{
          left: `${tick.percent}%`,
          width: `${100 / count}%`,
          marginLeft: `${-(100 / count) / 2}%`,
        }}
      >
        {format(tick.value)}
      </div>
    </div>
  );
};

const msToLabel = (ms) => ms.toFixed(1) + " s";

const SoundSlider = ({ duration, times, setTimes }) => {
  const domain = React.useMemo(() => [0, duration], [duration]);
  const [update, setUpdate] = React.useState([0, duration]);
  React.useEffect(() => {
    setUpdate(domain);
  }, [domain, setUpdate]);

  return (
    <div className="slider">
      <Slider mode={2} step={0.001} domain={domain} onUpdate={setUpdate} onChange={setTimes} values={times}>
        <Rail>{({ getRailProps }) => <SliderRail getRailProps={getRailProps} />}</Rail>
        <Handles>
          {({ handles, getHandleProps }) => (
            <div className="slider-handles">
              {handles.map((handle) => (
                <Handle key={handle.id} handle={handle} domain={domain} getHandleProps={getHandleProps} />
              ))}
            </div>
          )}
        </Handles>
        <Tracks left={false} right={false}>
          {({ tracks, getTrackProps }) => (
            <div className="slider-tracks">
              {tracks.map(({ id, source, target }) => (
                <Track key={id} source={source} target={target} getTrackProps={getTrackProps} />
              ))}
            </div>
          )}
        </Tracks>
        <Ticks count={5}>
          {({ ticks }) => (
            <div className="slider-ticks">
              {ticks.map((tick) => (
                <Tick key={tick.id} tick={tick} count={ticks.length} format={msToLabel} />
              ))}
            </div>
          )}
        </Ticks>
      </Slider>
    </div>
  );
};

export default SoundSlider;
