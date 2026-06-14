import React from "react";
import { C, FONT_UI } from "./theme";

const ArrowUp: React.FC = () => (
  <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 17l7-7 3 3 6-7" />
    <path d="M16 5h4v4" />
  </svg>
);
const ArrowDown: React.FC = () => (
  <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={C.pink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7l7 7 3-3 6 7" />
    <path d="M16 19h4v-4" />
  </svg>
);
const Chevron: React.FC<{ color?: string }> = ({ color = C.text }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export interface TradeLabels {
  buy: string;
  sell: string;
  market: string;
  limit: string;
  more: string;
  riskMode: string;
  cross: string;
  leverage: string;
  amount: string;
  available: string;
}

/** Bottom trade panel — Buy/Sell, order-type tabs, risk mode, leverage, amount.
 *  Static chrome (no live data); `side` picks which of Buy/Sell is active. */
export const TradePanel: React.FC<{ t: TradeLabels; side?: "buy" | "sell" }> = ({
  t,
  side = "buy",
}) => {
  const buyActive = side === "buy";
  return (
    <div
      style={{
        padding: "28px 30px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 30,
        borderTop: `1px solid ${C.panelLine}`,
        flexShrink: 0,
      }}
    >
      {/* Buy / Sell segmented toggle */}
      <div style={{ display: "flex", gap: 0, background: C.panel2, borderRadius: 20, padding: 10 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            padding: "26px 0",
            borderRadius: 14,
            background: buyActive ? C.blue : "transparent",
            color: C.text,
            fontFamily: FONT_UI,
            fontSize: 36,
            fontWeight: 600,
          }}
        >
          <ArrowUp />
          {t.buy}
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            padding: "26px 0",
            borderRadius: 14,
            background: !buyActive ? C.pink : "transparent",
            color: C.text,
            fontFamily: FONT_UI,
            fontSize: 36,
            fontWeight: 600,
          }}
        >
          <ArrowDown />
          {t.sell}
        </div>
      </div>

      {/* Market / Limit / More */}
      <div style={{ display: "flex", alignItems: "center", gap: 56, position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <span style={{ color: C.text, fontFamily: FONT_UI, fontSize: 32, fontWeight: 600 }}>{t.market}</span>
          <div style={{ width: 120, height: 4, background: C.blue, borderRadius: 2 }} />
        </div>
        <span style={{ color: C.textMute, fontFamily: FONT_UI, fontSize: 32 }}>{t.limit}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8, color: C.textMute, fontFamily: FONT_UI, fontSize: 32 }}>
          {t.more}
          <Chevron color={C.textMute} />
        </span>
      </div>

      {/* Risk Mode / Cross */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ color: C.textMute, fontFamily: FONT_UI, fontSize: 32 }}>{t.riskMode}</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: C.text, fontFamily: FONT_UI, fontSize: 32, fontWeight: 600 }}>{t.cross}</span>
          <div style={{ width: 52, height: 52, borderRadius: 13, background: C.panel2, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Chevron />
          </div>
        </div>
      </div>

      {/* Leverage */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <span style={{ color: C.textMute, fontFamily: FONT_UI, fontSize: 32 }}>{t.leverage}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          {/* slider track */}
          <div style={{ flex: 1, position: "relative", height: 44, display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: 0, right: 0, height: 8, background: C.panel2, borderRadius: 4 }} />
            {/* notch dots */}
            {[0.25, 0.5, 0.75, 1].map((p) => (
              <div
                key={p}
                style={{
                  position: "absolute",
                  left: `calc(${p * 100}% - 5px)`,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  background: C.textFaint,
                }}
              />
            ))}
            {/* knob at far left (1x) */}
            <div style={{ position: "absolute", left: 0, width: 44, height: 44, borderRadius: 22, background: C.text, boxShadow: "0 0 0 6px rgba(255,255,255,0.08)" }} />
          </div>
          {/* value box */}
          <div
            style={{
              width: 150,
              height: 72,
              borderRadius: 16,
              background: C.panel2,
              border: `1px solid ${C.panelLine}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 22px",
            }}
          >
            <span style={{ color: C.text, fontFamily: FONT_UI, fontSize: 34, fontWeight: 700 }}>1</span>
            <span style={{ color: C.textMute, fontFamily: FONT_UI, fontSize: 30 }}>x</span>
          </div>
        </div>
      </div>

      {/* Amount */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ color: C.text, fontFamily: FONT_UI, fontSize: 32, fontWeight: 500 }}>{t.amount}</span>
        <span style={{ marginLeft: "auto", color: C.textMute, fontFamily: FONT_UI, fontSize: 30 }}>
          {t.available} <span style={{ color: C.blue, fontWeight: 600 }}>$0.00</span>
        </span>
      </div>
    </div>
  );
};
