import React from "react";
import { Img, staticFile } from "remotion";
import { C, FONT_UI } from "./theme";
import type { FrameView } from "../pumpfun-screen/types";

const LOGO = "vibe/03_transparent_icons/vibe_logo_white_transparent.png";
const BTC = "vibe/03_transparent_icons/btc_coin_icon_transparent.png";

const Chevron: React.FC<{ size?: number; color?: string }> = ({
  size = 22,
  color = C.text,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

/** Header: Vibe logo · Connect · menu. */
export const VibeHeader: React.FC = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      padding: "0 30px",
      height: 132,
      flexShrink: 0,
    }}
  >
    <Img src={staticFile(LOGO)} style={{ height: 56, width: "auto" }} />
    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 18 }}>
      <div
        style={{
          background: C.blue,
          color: C.text,
          fontFamily: FONT_UI,
          fontSize: 34,
          fontWeight: 600,
          padding: "20px 34px",
          borderRadius: 18,
          lineHeight: 1,
        }}
      >
        Connect
      </div>
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: 18,
          background: C.panel2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 32, height: 3, background: C.text, borderRadius: 2 }} />
        ))}
      </div>
    </div>
  </div>
);

const fmtPrice = (v: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Market row: coin selector + leverage pill + live price.
 *  `coinIcon` is the token avatar when available, else the BTC icon. */
export const MarketRow: React.FC<{
  view: FrameView;
  pair: string;
  sub: string;
  lev: string;
  coinIcon?: string | null;
}> = ({ view, pair, sub, lev, coinIcon }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      padding: "0 30px",
      height: 116,
      borderTop: `1px solid ${C.panelLine}`,
      borderBottom: `1px solid ${C.panelLine}`,
      flexShrink: 0,
    }}
  >
    <Img
      src={staticFile(coinIcon || BTC)}
      style={{ width: 56, height: 56, borderRadius: 28, objectFit: "cover", flexShrink: 0 }}
    />
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginLeft: 18 }}>
      <span style={{ color: C.text, fontFamily: FONT_UI, fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
        {pair}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ color: C.textMute, fontFamily: FONT_UI, fontSize: 26 }}>{sub}</span>
        <span
          style={{
            background: C.blue,
            color: C.text,
            fontFamily: FONT_UI,
            fontSize: 22,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 7,
            lineHeight: 1.1,
          }}
        >
          {lev}
        </span>
      </span>
    </div>
    <div style={{ marginLeft: 22, marginRight: 22, width: 1, height: 56, background: C.panelLine }} />
    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
      <span
        style={{
          color: C.text,
          fontFamily: FONT_UI,
          fontSize: 42,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {fmtPrice(view.liveMcap)}
      </span>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: C.panel2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Chevron />
      </div>
    </div>
  </div>
);

/** Chart / Positions / Orderbook tab switcher. */
export const Tabs: React.FC<{ active: string; labels: [string, string, string] }> = ({
  active,
  labels,
}) => (
  <div style={{ padding: "20px 24px", flexShrink: 0 }}>
    <div
      style={{
        display: "flex",
        background: C.panel2,
        borderRadius: 18,
        padding: 8,
        border: `1px solid ${C.panelLine}`,
      }}
    >
      {labels.map((label) => {
        const isActive = label === active;
        return (
          <div
            key={label}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "20px 0",
              borderRadius: 13,
              background: isActive ? C.blue : "transparent",
              color: isActive ? C.text : C.textMute,
              fontFamily: FONT_UI,
              fontSize: 32,
              fontWeight: isActive ? 600 : 500,
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  </div>
);
