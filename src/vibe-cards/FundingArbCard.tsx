import React from "react";
import { FONT_VIBE, V } from "./vibe-theme";
import {
  CardFrame,
  LevChip,
  Panel,
  Stat,
  TAB,
  TokenAvatar,
  fmtPrice,
  fmtUsd,
} from "./shared";
import {
  aprPct,
  data,
  epochHours,
  epochPct,
  pumpPaysPct,
} from "./markets/data";

/**
 * Spot vs funding, native to Vibe: hold the spot token, Dump the same
 * VibeCap perp on Vibe, stay delta-neutral, and receive the dump-side
 * funding every epoch. Pumps pay; Dumps collect.
 */
export const FundingArbCard: React.FC = () => (
  <CardFrame source={data.source} fetchedAt={data.fetchedAt}>
    {/* app-style symbol header */}
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <TokenAvatar src={data.avatar} size={76} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ color: V.text, fontSize: 42, fontWeight: 800, lineHeight: 1 }}>
            {data.ticker}
          </span>
          <LevChip label={`${data.vibeMaxLeverage}x`} />
          <span style={{ color: V.gray, fontSize: 26, fontWeight: 500 }}>
            Spot vs Funding
          </span>
        </span>
        <span style={{ color: V.gray, fontSize: 24, lineHeight: 1 }}>
          delta-neutral · the Dump side gets paid every {epochHours}h
        </span>
      </div>
    </div>

    {/* hero: the funding the Dump side receives */}
    <div style={{ display: "flex", gap: 28, marginTop: 30, flex: 1 }}>
      <Panel style={{ flex: 1.25, display: "flex", flexDirection: "column", gap: 14 }}>
        <span style={{ color: V.gray, fontSize: 22, fontWeight: 500 }}>
          Funding received · Dump side · annualized
        </span>
        <span
          style={{
            color: V.lightBlue,
            fontSize: 124,
            fontWeight: 800,
            letterSpacing: -3,
            lineHeight: 0.95,
            ...TAB,
          }}
        >
          +{aprPct.toFixed(1)}%
        </span>
        <span style={{ color: V.text, fontSize: 25, fontWeight: 700, ...TAB }}>
          +{epochPct.toFixed(4)}% per {epochHours}h epoch, paid by the Pump side
        </span>
        <span style={{ color: V.gray, fontSize: 22, lineHeight: 1.45, marginTop: "auto" }}>
          Funding floats per epoch. The rate is not guaranteed.
        </span>
      </Panel>

      {/* the two legs, product-panel style */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
        <Panel style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ color: V.text, fontSize: 27, fontWeight: 700 }}>
            1 · Hold {data.ticker} spot
          </span>
          <span style={{ color: V.gray, fontSize: 22, lineHeight: 1.4, ...TAB }}>
            {fmtPrice(data.spotPx ?? 0)} · {fmtUsd(data.spotLiquidityUsd)} DEX
            liquidity
          </span>
        </Panel>
        <Panel style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ color: V.text, fontSize: 27, fontWeight: 700 }}>
            2 ·{" "}
            <span style={{ color: V.pink }}>Dump</span> the perp on Vibe
          </span>
          <span style={{ color: V.gray, fontSize: 22, lineHeight: 1.4, ...TAB }}>
            mark {fmtPrice(data.vibeMarkPx ?? 0)} · funding{" "}
            <span style={{ color: V.lightBlue, fontWeight: 700 }}>
              +{epochPct.toFixed(4)}%
            </span>{" "}
            / {epochHours}h to you
          </span>
        </Panel>
        <Panel style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ color: V.text, fontSize: 27, fontWeight: 700 }}>
            3 · Delta-neutral. Collect.
          </span>
          <span style={{ color: V.gray, fontSize: 22, lineHeight: 1.4, ...TAB }}>
            Pumps pay {pumpPaysPct.toFixed(4)}% / epoch · basis{" "}
            {data.basisPct?.toFixed(2) ?? "—"}%
          </span>
        </Panel>
      </div>
    </div>

    {/* footer stats strip */}
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 56,
        marginTop: 24,
        fontFamily: FONT_VIBE,
      }}
    >
      <Stat label="Market Cap" value={fmtUsd(data.marketCap ?? 0)} />
      <Stat label="Spot Liquidity" value={fmtUsd(data.spotLiquidityUsd)} />
      <Stat
        label="Funding (12h) (P|D)"
        value={
          <span style={{ ...TAB }}>
            <span style={{ color: V.pink }}>{pumpPaysPct.toFixed(4)}%</span>
            <span style={{ color: V.gray }}> | </span>
            <span style={{ color: V.lightBlue }}>+{epochPct.toFixed(4)}%</span>
          </span>
        }
      />
      <Stat label="Max Leverage" value={`${data.vibeMaxLeverage}x`} />
    </div>
  </CardFrame>
);
