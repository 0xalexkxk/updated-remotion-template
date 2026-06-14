import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { FONT_VIBE, R, V } from "./vibe-theme";

/** 16:9 tweet-image card. */
export const CARD_W = 1600;
export const CARD_H = 900;

// ---------------------------------------------------------------- formatting

export const fmtUsd = (v: number): string => {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
};

/** Price with enough decimals to be meaningful for sub-cent memecoins. */
export const fmtPrice = (p: number): string => {
  if (p >= 1000) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 1 })}`;
  if (p >= 1) return `$${p.toFixed(4)}`;
  if (p >= 0.01) return `$${p.toFixed(5)}`;
  return `$${p.toPrecision(4)}`;
};

export const fmtPct = (p: number, digits = 2): string =>
  `${p >= 0 ? "+" : ""}${p.toFixed(digits)}%`;

export const TAB = { fontVariantNumeric: "tabular-nums" } as const;

// ------------------------------------------------------------------- pieces

export const TokenAvatar: React.FC<{ src: string | null; size?: number }> = ({
  src,
  size = 84,
}) =>
  src ? (
    <Img
      src={staticFile(src)}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
        border: `2px solid ${V.panel3}`,
      }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: V.panel2,
        flexShrink: 0,
      }}
    />
  );

/** The blue leverage chip from the app header ("20x"). */
export const LevChip: React.FC<{ label: string }> = ({ label }) => (
  <span
    style={{
      background: V.blue,
      color: V.text,
      fontFamily: FONT_VIBE,
      fontSize: 24,
      fontWeight: 700,
      borderRadius: R.chip,
      padding: "5px 12px",
      lineHeight: 1,
      ...TAB,
    }}
  >
    {label}
  </span>
);

/** Pump / Dump side chip — Vibe's vocabulary, Vibe's colors. */
export const SideChip: React.FC<{ side: "pump" | "dump"; label?: string }> = ({
  side,
  label,
}) => (
  <span
    style={{
      fontFamily: FONT_VIBE,
      fontSize: 26,
      fontWeight: 700,
      color: side === "pump" ? V.lightBlue : V.pink,
      background: V.panel3,
      borderRadius: R.button,
      padding: "10px 20px",
      lineHeight: 1,
      textTransform: "capitalize",
    }}
  >
    {label ?? side}
  </span>
);

/** One stat in the app-header strip: small gray label over a bold value. */
export const Stat: React.FC<{
  label: string;
  value: React.ReactNode;
  color?: string;
  size?: number;
  align?: "left" | "right";
  font?: string;
}> = ({ label, value, color = V.text, size = 30, align = "left", font = FONT_VIBE }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 8,
      alignItems: align === "right" ? "flex-end" : "flex-start",
    }}
  >
    <span
      style={{
        color: V.gray,
        fontFamily: font,
        fontSize: 20,
        fontWeight: 500,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
    <span
      style={{
        color,
        fontFamily: font,
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...TAB,
      }}
    >
      {value}
    </span>
  </div>
);

/** Horizontal strip of Stats — the app's symbol-header row. */
export const StatStrip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      display: "flex",
      alignItems: "flex-end",
      gap: 52,
      background: V.panel,
      border: `1px solid ${V.hairline}`,
      borderRadius: R.panel,
      padding: "22px 32px",
    }}
  >
    {children}
  </div>
);

/** A rounded app panel (#19203F, r12) — the product's building block. */
export const Panel: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      background: V.panel2,
      borderRadius: R.panel,
      padding: "28px 32px",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Per-side funding, app notation: "-0.1056% | 0.0527%" (Pump | Dump). */
export const FundingPD: React.FC<{
  long: number | null;
  short: number | null;
  size?: number;
}> = ({ long, short, size = 30 }) => (
  <span style={{ fontFamily: FONT_VIBE, fontSize: size, fontWeight: 700, ...TAB }}>
    <span style={{ color: V.pink }}>
      {long != null ? `${(long * 100).toFixed(4)}%` : "—"}
    </span>
    <span style={{ color: V.gray }}> | </span>
    <span style={{ color: V.lightBlue }}>
      {short != null ? `+${(short * 100).toFixed(4)}%` : "—"}
    </span>
  </span>
);

// --------------------------------------------------------------------- frame

/**
 * Card chrome: the Vibe app's dark-navy surface, the wordmark with its beta
 * tag, source + timestamp footer. Reads as the product, not a poster.
 */
export const CardFrame: React.FC<{
  children: React.ReactNode;
  source: string;
  fetchedAt: string;
}> = ({ children, source, fetchedAt }) => {
  const date = new Date(fetchedAt);
  const stamp = `${date.toISOString().slice(0, 10)} ${date
    .toISOString()
    .slice(11, 16)} UTC`;
  return (
    <AbsoluteFill
      style={{
        background: V.bg,
        fontFamily: FONT_VIBE,
        padding: "48px 64px 40px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* wordmark, app-faithful: bold white lowercase + blue beta tag */}
      <span
        style={{
          position: "absolute",
          top: 48,
          right: 64,
          color: V.text,
          fontSize: 40,
          fontWeight: 800,
          letterSpacing: -1,
          lineHeight: 1,
        }}
      >
        Vibe
        <span
          style={{
            marginLeft: 8,
            color: V.lightBlue,
            fontSize: 19,
            fontWeight: 700,
            verticalAlign: "super",
            letterSpacing: 0,
          }}
        >
          beta
        </span>
      </span>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `1px solid ${V.hairline}`,
          paddingTop: 18,
          marginTop: 26,
        }}
      >
        <span style={{ color: V.grayDim, fontSize: 19, letterSpacing: 0.3 }}>
          {source}
        </span>
        <span style={{ color: V.grayDim, fontSize: 19, ...TAB }}>{stamp}</span>
      </div>
    </AbsoluteFill>
  );
};
