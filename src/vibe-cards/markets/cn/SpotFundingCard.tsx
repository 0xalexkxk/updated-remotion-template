import React from "react";
import { getInfo, loadFont } from "@remotion/google-fonts/NotoSansSC";
import { FONT_VIBE, R, V } from "../../vibe-theme";
import { CardFrame, LevChip, Panel, TAB, TokenAvatar } from "../../shared";
import { aprPct, data, epochHours } from "../data";

// CJK Google Fonts ship as ~120 numbered unicode-range slices — there is no
// "chinese-simplified" key at the weight level. Load every slice we have.
const CN_SUBSETS = Object.keys(getInfo().fonts.normal["700"]) as "latin"[];
const { fontFamily: FONT_CN } = loadFont("normal", {
  weights: ["400", "500", "700", "900"],
  subsets: CN_SUBSETS,
});

/** Per-epoch Dump-side funding as a % string, e.g. "0.0528%". */
const epochStr = (f: number): string => `${(f * 100).toFixed(4)}%`;

/** Annualized Dump-side funding as a positive % string, e.g. "38.5%". */
const aprStr = (a: number): string => `${(a * 100).toFixed(1)}%`;

const rankingRows = [
  {
    ticker: data.ticker,
    fundingShort12h: data.fundingShort12h,
    aprShort: data.aprShort,
  },
  ...data.runnersUp.slice(0, 4).map((r) => ({
    ticker: r.ticker,
    fundingShort12h: r.fundingShort12h,
    aprShort: r.aprShort,
  })),
];

/** One spot/perp leg: Chinese title, sub-line, and the Δ value. */
const Leg: React.FC<{
  title: string;
  sub: string;
  delta: string;
  deltaColor: string;
}> = ({ title, sub, delta, deltaColor }) => (
  <Panel
    style={{
      flex: 1,
      padding: "22px 26px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}
  >
    <span
      style={{
        fontFamily: FONT_CN,
        color: V.text,
        fontSize: 30,
        fontWeight: 700,
        lineHeight: 1.1,
      }}
    >
      {title}
    </span>
    <span
      style={{
        fontFamily: FONT_CN,
        color: V.gray,
        fontSize: 21,
        lineHeight: 1.35,
      }}
    >
      {sub}
    </span>
    <span
      style={{
        marginTop: "auto",
        fontFamily: FONT_VIBE,
        color: deltaColor,
        fontSize: 40,
        fontWeight: 800,
        letterSpacing: -0.5,
        lineHeight: 1,
        ...TAB,
      }}
    >
      {delta}
    </span>
  </Panel>
);

export const SpotFundingCardCN: React.FC = () => (
  <CardFrame source={data.source} fetchedAt={data.fetchedAt}>
    {/* app-style symbol header */}
    <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
      <TokenAvatar src={data.avatar} size={78} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: V.text, fontSize: 44, fontWeight: 800, lineHeight: 1 }}>
            {data.ticker}
          </span>
          <LevChip label={`${data.vibeMaxLeverage}x`} />
          <span
            style={{
              fontFamily: FONT_CN,
              color: V.text,
              fontSize: 30,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            持币对冲
          </span>
        </span>
        <span
          style={{ fontFamily: FONT_CN, color: V.gray, fontSize: 24, lineHeight: 1 }}
        >
          把闲置的币变成会生息的对冲 · Dump 方每 {epochHours} 小时收资金费
        </span>
      </div>
    </div>

    {/* hero + two legs row */}
    <div style={{ display: "flex", gap: 26, marginTop: 28, alignItems: "stretch" }}>
      {/* hero: the annualized funding the Dump side receives */}
      <Panel
        style={{
          flex: 1.2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <span
          style={{ fontFamily: FONT_CN, color: V.gray, fontSize: 23, lineHeight: 1 }}
        >
          年化
        </span>
        <span
          style={{
            fontFamily: FONT_VIBE,
            color: V.lightBlue,
            fontSize: 116,
            fontWeight: 800,
            letterSpacing: -3,
            lineHeight: 0.9,
            ...TAB,
          }}
        >
          +{aprStr(data.aprShort)}
        </span>
        <span
          style={{ fontFamily: FONT_CN, color: V.gray, fontSize: 23, lineHeight: 1.4 }}
        >
          持币对冲 ·{" "}
          <span style={{ color: V.pink, fontWeight: 700 }}>Dump 方</span>
          收资金费
        </span>
      </Panel>

      {/* two legs + center 总Δ=0 chip */}
      <div style={{ flex: 1.6, display: "flex", alignItems: "stretch", gap: 16 }}>
        <Leg
          title="现货"
          sub={`持有 ${data.ticker} 现货`}
          delta="Δ=+1"
          deltaColor={V.lightBlue}
        />
        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <span
            style={{
              fontFamily: FONT_VIBE,
              color: V.text,
              fontSize: 26,
              fontWeight: 700,
              background: V.panel3,
              borderRadius: 999,
              padding: "12px 18px",
              lineHeight: 1,
              whiteSpace: "nowrap",
              ...TAB,
            }}
          >
            总Δ=0
          </span>
        </div>
        <Leg
          title="Vibe Dump"
          sub={`在 Vibe 做空 ${data.ticker} 永续`}
          delta="Δ=−1"
          deltaColor={V.pink}
        />
      </div>
    </div>

    {/* ranking table — VIBE's own Dump-side funding, exchange-screenshot look */}
    <div
      style={{
        marginTop: 26,
        background: V.panel,
        border: `1px solid ${V.hairline}`,
        borderRadius: R.panel,
        padding: "6px 0",
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "14px 34px",
          borderBottom: `1px solid ${V.hairline}`,
        }}
      >
        <span
          style={{ fontFamily: FONT_CN, color: V.gray, fontSize: 21, flex: 1.2 }}
        >
          币种
        </span>
        <span
          style={{
            fontFamily: FONT_CN,
            color: V.gray,
            fontSize: 21,
            flex: 1.5,
            textAlign: "right",
          }}
        >
          Dump 方资金费（{epochHours}h）
        </span>
        <span
          style={{
            fontFamily: FONT_CN,
            color: V.gray,
            fontSize: 21,
            flex: 0.9,
            textAlign: "right",
          }}
        >
          年化
        </span>
      </div>

      {/* rows */}
      {rankingRows.map((row, i) => (
        <div
          key={row.ticker}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 34px",
            flex: 1,
            borderBottom:
              i === rankingRows.length - 1 ? "none" : `1px solid ${V.hairline}`,
          }}
        >
          <span
            style={{
              flex: 1.2,
              fontFamily: FONT_VIBE,
              color: V.text,
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 0.3,
            }}
          >
            {row.ticker}
          </span>
          <span
            style={{
              flex: 1.5,
              fontFamily: FONT_VIBE,
              color: V.lightBlue,
              fontSize: 27,
              fontWeight: 700,
              textAlign: "right",
              ...TAB,
            }}
          >
            +{epochStr(row.fundingShort12h)}
          </span>
          <span
            style={{
              flex: 0.9,
              fontFamily: FONT_VIBE,
              color: V.lightBlue,
              fontSize: 27,
              fontWeight: 700,
              textAlign: "right",
              ...TAB,
            }}
          >
            +{aprStr(row.aprShort)}
          </span>
        </div>
      ))}
    </div>

    {/* who-pays line + honest caveat */}
    <div
      style={{
        marginTop: 22,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 28,
      }}
    >
      <span
        style={{ fontFamily: FONT_CN, color: V.text, fontSize: 23, lineHeight: 1.4 }}
      >
        资金费为正 —{" "}
        <span style={{ color: V.lightBlue, fontWeight: 700 }}>Pump 方</span>
        付给{" "}
        <span style={{ color: V.pink, fontWeight: 700 }}>Dump 方</span>，每{" "}
        {epochHours} 小时一次
      </span>
      <span
        style={{
          fontFamily: FONT_CN,
          color: V.grayDim,
          fontSize: 21,
          lineHeight: 1.4,
          textAlign: "right",
          maxWidth: 480,
        }}
      >
        费率每个周期浮动，非保证收益
      </span>
    </div>
  </CardFrame>
);
