import React from "react";
import { interpolate } from "remotion";
import { C, FONT_UI } from "./theme";
import type { FrameView } from "../pumpfun-screen/types";

/**
 * Vibe-style candle chart. Same engine FrameView as the pump.fun skin, but:
 *  - up candles are BLUE (#2465FF), down candles are PINK (#EC71E1)
 *  - faint square grid, no right-side price ladder (price lives in the header)
 *  - volume bars across the bottom, coloured by candle direction
 *  - "BTC-USDC · 15m" label top-left
 */

const PAD_L = 4;
const PAD_R = 4;

export const VibeChart: React.FC<{
  view: FrameView;
  width: number;
  height: number;
  pairLabel: string;
  tfLabel: string;
}> = ({ view, width, height, pairLabel, tfLabel }) => {
  const plotL = PAD_L;
  const plotR = width - PAD_R;
  const plotW = plotR - plotL;

  // Vertical split: candles get the top ~74%, volume bars the bottom ~22%.
  const volH = Math.round(height * 0.2);
  const candTop = 44; // leave room under the pair label
  const candBottom = height - volH - 8;
  const candH = candBottom - candTop;

  const xOf = (vx: number) => plotR - (vx / view.viewCount) * plotW;
  const yOf = (v: number) =>
    interpolate(v, [view.scaleMin, view.scaleMax], [candBottom, candTop], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const cw = Math.max(3, (plotW / view.viewCount) * 0.58);

  // Volume scale: derive a per-candle volume from its range+body (deterministic,
  // no RNG at render time). Normalise against the largest visible volume.
  const vols = view.candles.map((cd) => {
    const range = Math.abs(cd.h - cd.l);
    const body = Math.abs(cd.c - cd.o);
    return range * 0.7 + body * 0.6;
  });
  const maxVol = Math.max(1e-9, ...vols);

  // Grid lines — 5 horizontal, evenly spaced; verticals every ~6 candle-units.
  const hLines = [0, 1, 2, 3, 4, 5].map((i) => candTop + (candH * i) / 5);
  const vStep = plotW / 6;
  const vLines = [0, 1, 2, 3, 4, 5, 6].map((i) => plotL + vStep * i);

  const liveY = yOf(view.liveMcap);
  const liveColor = view.liveUp ? C.blue : C.pink;

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {/* grid */}
      <g stroke={C.panelLine} strokeWidth={1}>
        {hLines.map((y, i) => (
          <line key={`h${i}`} x1={plotL} x2={plotR} y1={y} y2={y} opacity={0.6} />
        ))}
        {vLines.map((x, i) => (
          <line key={`v${i}`} x1={x} x2={x} y1={candTop} y2={candBottom + volH} opacity={0.45} />
        ))}
      </g>

      {/* candles */}
      {view.candles.map((cd, i) => {
        const x = xOf(cd.x);
        if (x < plotL - cw || x > plotR + cw) return null;
        const up = cd.c >= cd.o;
        const col = up ? C.blue : C.pink;
        const yH = yOf(cd.h);
        const yL = yOf(cd.l);
        const yO = yOf(cd.o);
        const yC = yOf(cd.c);
        const bodyTop = Math.min(yO, yC);
        const bodyH = Math.max(2, Math.abs(yC - yO));
        return (
          <g key={i} opacity={cd.forming ? 0.97 : 1}>
            <line x1={x} x2={x} y1={yH} y2={yL} stroke={col} strokeWidth={2} />
            <rect x={x - cw / 2} y={bodyTop} width={cw} height={bodyH} fill={col} rx={1.5} />
          </g>
        );
      })}

      {/* volume bars */}
      {view.candles.map((cd, i) => {
        const x = xOf(cd.x);
        if (x < plotL - cw || x > plotR + cw) return null;
        const up = cd.c >= cd.o;
        const col = up ? C.blue : C.pink;
        const h = Math.max(2, (vols[i] / maxVol) * (volH - 6));
        const y = height - h;
        return (
          <rect
            key={`vol${i}`}
            x={x - cw / 2}
            y={y}
            width={cw}
            height={h}
            fill={col}
            opacity={0.5}
            rx={1}
          />
        );
      })}

      {/* live price dashed line + tag */}
      <line
        x1={plotL}
        x2={plotR}
        y1={liveY}
        y2={liveY}
        stroke={liveColor}
        strokeWidth={1.5}
        strokeDasharray="6 6"
        opacity={0.85}
      />

      {/* pair · timeframe label */}
      <text
        x={plotL + 8}
        y={28}
        fill={C.textMute}
        fontFamily={FONT_UI}
        fontSize={26}
        fontWeight={500}
      >
        {pairLabel} · {tfLabel}
      </text>
    </svg>
  );
};
