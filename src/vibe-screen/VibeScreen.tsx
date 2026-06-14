import React, { useMemo } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  useCurrentFrame,
} from "remotion";
import { buildTimeline, playbackWindow } from "../pumpfun-screen/engine";
import type { ChartData } from "../pumpfun-screen/types";
import rawData from "../pumpfun-screen/data/active.json";
import { C, FONT_READY, FPS, H, W } from "./theme";
import { MarketRow, Tabs, VibeHeader } from "./TopChrome";
import { VibeChart } from "./VibeChart";
import { TradePanel, type TradeLabels } from "./TradePanel";

const data = rawData as ChartData;

export const { DURATION } = playbackWindow(data, FPS);

// ── Language ──────────────────────────────────────────────────────────
// make.mjs rewrites this single line to switch the whole UI language.
const LANG: "en" | "zh" = "zh";

const LABELS = {
  en: {
    chart: "Chart",
    positions: "Positions",
    orderbook: "Orderbook",
    sub: "Bitcoin",
    trade: {
      buy: "Buy",
      sell: "Sell",
      market: "Market",
      limit: "Limit",
      more: "More",
      riskMode: "Risk Mode",
      cross: "Cross",
      leverage: "Leverage",
      amount: "Amount",
      available: "Available:",
    } as TradeLabels,
  },
  zh: {
    chart: "图表",
    positions: "持仓",
    orderbook: "订单簿",
    sub: "比特币",
    trade: {
      buy: "买入",
      sell: "卖出",
      market: "市价",
      limit: "限价",
      more: "更多",
      riskMode: "风险模式",
      cross: "全仓",
      leverage: "杠杆",
      amount: "数量",
      available: "可用:",
    } as TradeLabels,
  },
} as const;

// ── Per-token framing (driven by the active.json the engine renders) ──
// make.mjs can rewrite PAIR / SUB / LEV to match the config.
const PAIR = "BTC-USDC";
const SUB = "Bitcoin";
const LEV = "40x";
const TF = "15m";

export const VibeScreen: React.FC = () => {
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
  const L = LABELS[LANG];

  // Fixed vertical budget so the chart gets an exact pixel height (SVG needs it).
  const HEADER_H = 132;
  const MARKET_H = 116;
  const TABS_H = 136;
  const PANEL_H = 560;
  const CHART_H = H - HEADER_H - MARKET_H - TABS_H - PANEL_H; // = 976
  const CHART_PAD = 24;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ display: "flex", flexDirection: "column", width: W, height: H }}>
        <VibeHeader />
        <MarketRow view={view} pair={PAIR} sub={SUB} lev={LEV} coinIcon={data.token.avatar} />
        <div style={{ height: TABS_H, flexShrink: 0 }}>
          <Tabs active={L.chart} labels={[L.chart, L.positions, L.orderbook]} />
        </div>
        <div style={{ height: CHART_H, flexShrink: 0, padding: `0 ${CHART_PAD}px 8px` }}>
          <VibeChart
            view={view}
            width={W - CHART_PAD * 2}
            height={CHART_H - 8}
            pairLabel={PAIR}
            tfLabel={TF}
          />
        </div>
        <div style={{ height: PANEL_H, flexShrink: 0 }}>
          <TradePanel t={L.trade} side="buy" />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const vibeScreenMeta = {
  id: "VibeScreen",
  component: VibeScreen,
  durationInFrames: DURATION,
  fps: FPS,
  width: W,
  height: H,
};
