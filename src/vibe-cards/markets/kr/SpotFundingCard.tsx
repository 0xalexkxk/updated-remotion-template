import React from "react";
import { getInfo, loadFont } from "@remotion/google-fonts/NotoSansKR";
import { FONT_VIBE, R, V } from "../../vibe-theme";
import { CardFrame, LevChip, Panel, TAB, TokenAvatar, fmtPrice, fmtUsd } from "../../shared";
import { aprPct, data, epochHours, epochPct, pumpPaysPct } from "../data";

// CJK Google Fonts ship as ~120 numbered unicode-range slices — there is no
// "korean" key at the weight level. Load every slice we have.
const KR_SUBSETS = Object.keys(getInfo().fonts.normal["700"]) as "latin"[];
const { fontFamily: FONT_KR } = loadFont("normal", {
  weights: ["400", "500", "700", "900"],
  subsets: KR_SUBSETS,
});

/**
 * 수익-reveal card, native to Vibe: 현물 보유 + Vibe에서 같은 VibeCap 무기한
 * 선물을 Dump(숏) → 델타중립 → Dump 쪽이 12시간마다 펀딩비를 받는다.
 * The research's load-bearing line "롱이 숏에게 펀딩비를 지급" is literally
 * true on Vibe. Hero = 연환산 number; two legs side-by-side; one 꿀통 word
 * lives in a supporting line only.
 */
export const SpotFundingCardKR: React.FC = () => (
  <CardFrame source={data.source} fetchedAt={data.fetchedAt}>
    {/* app-style symbol header */}
    <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
      <TokenAvatar src={data.avatar} size={80} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontFamily: FONT_VIBE, color: V.text, fontSize: 46, fontWeight: 800, lineHeight: 1 }}>
            {data.ticker}
          </span>
          <LevChip label={`${data.vibeMaxLeverage}x`} />
          <span style={{ fontFamily: FONT_KR, color: V.gray, fontSize: 27, fontWeight: 500, lineHeight: 1 }}>
            현물 보유 · Vibe에서 Dump
          </span>
        </span>
        <span style={{ fontFamily: FONT_KR, color: V.gray, fontSize: 25, fontWeight: 500, lineHeight: 1.1 }}>
          델타중립 · 가격 베팅 없이 펀딩비 받기
        </span>
      </div>
    </div>

    {/* hero: the annualized funding the Dump side receives */}
    <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>
      <span style={{ fontFamily: FONT_KR, color: V.gray, fontSize: 24, fontWeight: 500, lineHeight: 1 }}>
        Dump 쪽이 받는 펀딩비 · Vibe에서 직접 수령
      </span>
      <span
        style={{
          fontFamily: FONT_VIBE,
          color: V.lightBlue,
          fontSize: 118,
          fontWeight: 800,
          letterSpacing: -3,
          lineHeight: 0.95,
          ...TAB,
        }}
      >
        연환산 +{aprPct.toFixed(1)}%
      </span>
    </div>

    {/* two legs, product-panel style, side by side */}
    <div style={{ display: "flex", gap: 24, marginTop: 26 }}>
      <Panel style={{ flex: 1, background: V.panel2, display: "flex", flexDirection: "column", gap: 14 }}>
        <span style={{ fontFamily: FONT_KR, color: V.text, fontSize: 30, fontWeight: 700, lineHeight: 1 }}>
          현물 매수
        </span>
        <span style={{ fontFamily: FONT_VIBE, color: V.text, fontSize: 32, fontWeight: 700, ...TAB }}>
          {data.spotPx != null ? fmtPrice(data.spotPx) : "—"}
        </span>
        <span style={{ fontFamily: FONT_KR, color: V.gray, fontSize: 23, fontWeight: 500, lineHeight: 1.35 }}>
          유동성 <span style={{ fontFamily: FONT_VIBE, ...TAB }}>{fmtUsd(data.spotLiquidityUsd)}</span>
        </span>
      </Panel>
      <Panel style={{ flex: 1, background: V.panel2, display: "flex", flexDirection: "column", gap: 14 }}>
        <span style={{ fontFamily: FONT_KR, fontSize: 30, fontWeight: 700, lineHeight: 1 }}>
          Vibe에서 <span style={{ color: V.pink }}>Dump</span>
        </span>
        <span style={{ fontFamily: FONT_VIBE, color: V.text, fontSize: 32, fontWeight: 700, ...TAB }}>
          {data.vibeMarkPx != null ? fmtPrice(data.vibeMarkPx) : "—"}
        </span>
        <span style={{ fontFamily: FONT_KR, color: V.gray, fontSize: 23, fontWeight: 500, lineHeight: 1.35 }}>
          최대 <span style={{ fontFamily: FONT_VIBE, ...TAB }}>{data.vibeMaxLeverage}x</span> · 펀딩비{" "}
          <span style={{ fontFamily: FONT_VIBE, color: V.lightBlue, fontWeight: 700, ...TAB }}>
            +{epochPct.toFixed(4)}%
          </span>
          /{epochHours}h 수령
        </span>
      </Panel>
    </div>

    {/* load-bearing line — now literally true on Vibe */}
    <div
      style={{
        marginTop: 22,
        background: V.panel,
        border: `1px solid ${V.hairline}`,
        borderRadius: R.panel,
        padding: "22px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <span style={{ fontFamily: FONT_KR, color: V.text, fontSize: 29, fontWeight: 700, lineHeight: 1.3 }}>
        롱(Pump)이 숏(Dump)에게 펀딩비를 지급 — <span style={{ color: V.lightBlue }}>12시간마다</span>
      </span>
      <span style={{ fontFamily: FONT_KR, color: V.gray, fontSize: 24, fontWeight: 500, lineHeight: 1.3 }}>
        Pump 지급{" "}
        <span style={{ fontFamily: FONT_VIBE, color: V.pink, fontWeight: 700, ...TAB }}>
          {pumpPaysPct.toFixed(4)}%
        </span>{" "}
        | Dump 수령{" "}
        <span style={{ fontFamily: FONT_VIBE, color: V.lightBlue, fontWeight: 700, ...TAB }}>
          +{epochPct.toFixed(4)}%
        </span>{" "}
        — 받는 쪽에 서면 되는 꿀통
      </span>
    </div>

    {/* credibility math + caveat */}
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 9 }}>
      <span style={{ fontFamily: FONT_VIBE, color: V.gray, fontSize: 23, fontWeight: 500, ...TAB }}>
        +{epochPct.toFixed(4)}%/12h × 2 × 365 = 연환산{" "}
        <span style={{ color: V.lightBlue, fontWeight: 700 }}>+{aprPct.toFixed(1)}%</span>
      </span>
      <span style={{ fontFamily: FONT_KR, color: V.grayDim, fontSize: 22, fontWeight: 500, lineHeight: 1.3 }}>
        펀딩비는 주기마다 변동 · 청산 위험 관리 필수
      </span>
    </div>
  </CardFrame>
);
