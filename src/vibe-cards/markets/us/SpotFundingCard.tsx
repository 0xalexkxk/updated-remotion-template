import React from "react";
import { FONT_VIBE, V } from "../../vibe-theme";
import {
  CardFrame,
  LevChip,
  Panel,
  Stat,
  TAB,
  TokenAvatar,
  fmtPrice,
  fmtUsd,
} from "../../shared";
import { aprPct, data, epochHours, epochPct, pumpPaysPct } from "../data";

/** One step of the mechanic, as a horizontal product panel. */
const StepPanel: React.FC<{
  n: number;
  head: React.ReactNode;
  sub: React.ReactNode;
}> = ({ n, head, sub }) => (
  <Panel
    style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      padding: "26px 28px",
    }}
  >
    <span
      style={{
        color: V.gray,
        fontFamily: FONT_VIBE,
        fontSize: 22,
        fontWeight: 700,
        lineHeight: 1,
        ...TAB,
      }}
    >
      {n} / 3
    </span>
    <span style={{ color: V.text, fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>
      {head}
    </span>
    <span
      style={{ color: V.gray, fontSize: 22, lineHeight: 1.4, marginTop: "auto", ...TAB }}
    >
      {sub}
    </span>
  </Panel>
);

/**
 * US / English spot-vs-funding card, native to Vibe: hold the spot token,
 * Dump the same VibeCap perp, stay delta-neutral, and collect the dump-side
 * funding every 12h epoch — paid by the Pump side. Cash-and-carry, calm.
 *
 * Layout differs from FundingArbCard: one full-width hero across the top,
 * the three-step mechanic as a horizontal row of panels below.
 */
export const SpotFundingCardUS: React.FC = () => (
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
            cash and carry
          </span>
        </span>
        <span style={{ color: V.gray, fontSize: 24, lineHeight: 1 }}>
          delta-neutral. no price bet. funding alone.
        </span>
      </div>
    </div>

    {/* hero: one giant annualized number, full width */}
    <Panel
      style={{
        marginTop: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 40,
        padding: "30px 40px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ color: V.gray, fontSize: 23, fontWeight: 500 }}>
          Funding the Dump side collects · annualized
        </span>
        <span
          style={{
            color: V.lightBlue,
            fontSize: 150,
            fontWeight: 800,
            letterSpacing: -5,
            lineHeight: 0.9,
            ...TAB,
          }}
        >
          +{aprPct.toFixed(1)}% APR
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 14,
          textAlign: "right",
        }}
      >
        <span style={{ color: V.text, fontSize: 30, fontWeight: 700, ...TAB }}>
          +{epochPct.toFixed(4)}% per {epochHours}h epoch
        </span>
        <span style={{ color: V.gray, fontSize: 23, fontWeight: 500, maxWidth: 360 }}>
          Funding is positive —{" "}
          <span style={{ color: V.pink, fontWeight: 700 }}>Pumps pay</span>{" "}
          <span style={{ color: V.lightBlue, fontWeight: 700 }}>Dumps</span> every{" "}
          {epochHours}h.
        </span>
      </div>
    </Panel>

    {/* mechanic: horizontal 3-panel row */}
    <div style={{ display: "flex", gap: 22, marginTop: 24, flex: 1 }}>
      <StepPanel
        n={1}
        head={`Hold ${data.ticker} spot`}
        sub={`${fmtPrice(data.spotPx ?? 0)} · ${fmtUsd(data.spotLiquidityUsd)} spot liquidity`}
      />
      <StepPanel
        n={2}
        head={
          <>
            <span style={{ color: V.pink }}>Dump</span> the perp on Vibe
          </>
        }
        sub={
          <>
            mark {fmtPrice(data.vibeMarkPx ?? 0)} · funding{" "}
            <span style={{ color: V.lightBlue, fontWeight: 700 }}>
              +{epochPct.toFixed(4)}%
            </span>{" "}
            to you
          </>
        }
      />
      <StepPanel
        n={3}
        head="Delta-neutral. Collect."
        sub={
          <>
            Pumps pay {pumpPaysPct.toFixed(4)}% / epoch · basis{" "}
            {data.basisPct?.toFixed(2) ?? "—"}%
          </>
        }
      />
    </div>

    {/* honest caveat */}
    <div
      style={{
        color: V.gray,
        fontSize: 22,
        lineHeight: 1.3,
        marginTop: 22,
        fontFamily: FONT_VIBE,
      }}
    >
      Funding floats per epoch. The rate is not guaranteed.
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
      <Stat label="Spot Price" value={fmtPrice(data.spotPx ?? 0)} />
      <Stat label="Vibe Mark" value={fmtPrice(data.vibeMarkPx ?? 0)} />
      <Stat label="Spot Liquidity" value={fmtUsd(data.spotLiquidityUsd)} />
      <Stat label="Max Leverage" value={`${data.vibeMaxLeverage}x`} />
    </div>
  </CardFrame>
);
