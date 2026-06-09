import React, { useMemo } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  useCurrentFrame,
} from "remotion";
import { C, FONT_MONO, FONT_READY, FONT_UI, FPS, H, W } from "./theme";
import { buildTimeline, playbackWindow } from "./engine";
import { Header } from "./Header";
import { CandleChart } from "./CandleChart";
import { TradeTape } from "./TradeTape";
import { BottomBar } from "./BottomBar";
import type { ChartData } from "./types";
import rawData from "./data/active.json";

const data = rawData as ChartData;

// TRUE real-time clip length: WINDOW_SEC real seconds at FPS, so DURATION =
// WINDOW_SEC * FPS and 1 video-second = 1 real-second. Frame f ↔
// realT = T0 + (f/(DURATION-1))*(T1-T0), with T1-T0 = WINDOW_SEC.
export const { DURATION } = playbackWindow(data, FPS);

const CHART_H = 1120;

const TfRow: React.FC<{ tf: string }> = ({ tf }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 18,
      padding: "10px 30px",
      borderTop: `1px solid ${C.hairline}`,
      borderBottom: `1px solid ${C.hairline}`,
    }}
  >
    <span
      style={{
        color: C.text,
        fontFamily: FONT_MONO,
        fontSize: 24,
        background: "#13171f",
        padding: "5px 14px",
        borderRadius: 8,
      }}
    >
      {tf}
    </span>
    <span style={{ color: C.text, fontFamily: FONT_UI, fontSize: 24 }}>MCap</span>
    <span style={{ color: C.textFaint, fontFamily: FONT_UI, fontSize: 24 }}>
      / Price
    </span>
    <span style={{ marginLeft: "auto", color: C.textFaint, fontSize: 26, letterSpacing: 8 }}>
      ⚙ ⤴ ⤢
    </span>
  </div>
);

export const PumpFunScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const [handle] = React.useState(() => delayRender("inter-font"));
  React.useEffect(() => {
    FONT_READY().then(() => continueRender(handle));
  }, [handle]);
  const timeline = useMemo(
    () => buildTimeline(data, { totalFrames: DURATION, fps: FPS }),
    [],
  );
  const view = timeline[Math.min(frame, timeline.length - 1)];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ display: "flex", flexDirection: "column", height: H, width: W }}>
        <Header data={data} view={view} />
        <CandleChart view={view} width={W} height={CHART_H} />
        <TfRow tf={view.tfLabel} />
        <TradeTape view={view} />
        <div style={{ marginTop: "auto" }}>
          <BottomBar />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const pumpFunScreenMeta = {
  id: "PumpFunScreen",
  component: PumpFunScreen,
  durationInFrames: DURATION,
  fps: FPS,
  width: W,
  height: H,
};
