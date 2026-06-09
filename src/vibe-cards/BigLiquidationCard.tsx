import React from "react";
import { V } from "./vibe-theme";
import {
  CardFrame,
  LevChip,
  SideChip,
  Stat,
  TAB,
  TokenAvatar,
  fmtPct,
  fmtPrice,
  fmtUsd,
} from "./shared";
import rawData from "./data/bigliq.json";

type BigLiqData = {
  pair: string;
  tokenName: string;
  avatar: string | null;
  side: "long" | "short";
  entry: number;
  liqPrice: number;
  notional: number;
  collateral: number;
  loss: number;
  movePct: number;
  liquidatedAt: number;
  fetchedAt: string;
  source: string;
};

const data = rawData as unknown as BigLiqData;

const leverage = data.collateral > 0 ? data.notional / data.collateral : 0;
const side = data.side === "long" ? "pump" : "dump";

export const BigLiquidationCard: React.FC = () => {
  const when = new Date(data.liquidatedAt * 1000);
  const whenLabel = `${when.toISOString().slice(0, 10)} ${when
    .toISOString()
    .slice(11, 16)} UTC`;

  return (
    <CardFrame source={data.source} fetchedAt={data.fetchedAt}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {/* banner */}
        <span
          style={{
            color: V.pink,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: 10,
            lineHeight: 1,
          }}
        >
          LIQUIDATED
        </span>

        {/* token row */}
        <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 28 }}>
          <TokenAvatar src={data.avatar} size={92} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span
                style={{
                  color: V.text,
                  fontSize: 52,
                  fontWeight: 800,
                  letterSpacing: -1,
                  lineHeight: 1,
                }}
              >
                {data.pair}
              </span>
              <LevChip label="20x" />
            </span>
            <span style={{ color: V.gray, fontSize: 25, lineHeight: 1 }}>
              {data.tokenName}
            </span>
          </div>
          <div style={{ marginLeft: 24 }}>
            <SideChip side={side} label={`${side} ${leverage.toFixed(1)}×`} />
          </div>
        </div>

        {/* the number */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 40, marginTop: 40 }}>
          <span
            style={{
              color: V.pink,
              fontSize: 148,
              fontWeight: 800,
              letterSpacing: -4,
              lineHeight: 0.9,
              ...TAB,
            }}
          >
            −{fmtUsd(data.loss)}
          </span>
          <span
            style={{
              color: V.gray,
              fontSize: 27,
              lineHeight: 1.4,
              paddingBottom: 10,
              maxWidth: 430,
            }}
          >
            lost on a {fmtUsd(data.notional)} position —{" "}
            {fmtPct(data.movePct)} move to the liquidation level
          </span>
        </div>
      </div>

      {/* entry → liq path */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 64,
          paddingTop: 30,
          borderTop: `1px solid ${V.hairline}`,
        }}
      >
        <Stat label="Open" value={fmtPrice(data.entry)} size={36} />
        <span style={{ color: V.pink, fontSize: 34, lineHeight: 1, paddingBottom: 2 }}>
          ⟶
        </span>
        <Stat
          label="Liquidation"
          value={fmtPrice(data.liqPrice)}
          color={V.pink}
          size={36}
        />
        <Stat label="Margin wiped" value={fmtUsd(data.collateral)} size={36} />
        <div style={{ marginLeft: "auto" }}>
          <Stat label="Time" value={whenLabel} size={27} align="right" />
        </div>
      </div>
    </CardFrame>
  );
};
