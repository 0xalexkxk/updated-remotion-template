import React, { useMemo } from "react";
import { FONT_VIBE, V } from "./vibe-theme";
import {
  CardFrame,
  FundingPD,
  LevChip,
  Stat,
  StatStrip,
  TAB,
  TokenAvatar,
  fmtPct,
  fmtPrice,
  fmtUsd,
} from "./shared";
import rawData from "./data/liqmap.json";

type Position = {
  side: "long" | "short";
  entry: number;
  notional: number;
  collateral: number;
  leverage: number;
  liqPrice: number;
};

type LiqMapData = {
  pair: string;
  tokenName: string;
  avatar: string | null;
  markPrice: number;
  priceChange24h: number | null;
  marketCap: number | null;
  spotLiquidityUsd: number | null;
  fundingLong12h: number | null;
  fundingShort12h: number | null;
  positions: Position[];
  fetchedAt: string;
  source: string;
};

const data = rawData as unknown as LiqMapData;

const CHART_W = 1472;
const CHART_H = 380;
const BINS = 56;

type Bin = { long: number; short: number };

/**
 * Bucket every mappable liquidation level into BINS price buckets around the
 * mark. Positions whose liq level sits at/below zero cannot be liquidated by
 * price alone — they are excluded from the map and counted separately.
 */
const buildBins = (positions: Position[], mark: number) => {
  const mappable = positions.filter((p) => p.liqPrice > 0);
  const lo = Math.min(mark * 0.45, ...mappable.map((p) => p.liqPrice));
  const hi = Math.max(mark * 1.55, ...mappable.map((p) => p.liqPrice));
  const bins: Bin[] = Array.from({ length: BINS }, () => ({ long: 0, short: 0 }));
  for (const p of mappable) {
    const i = Math.min(
      BINS - 1,
      Math.max(0, Math.floor(((p.liqPrice - lo) / (hi - lo)) * BINS)),
    );
    bins[i][p.side] += p.notional;
  }
  return { bins, lo, hi, unmappable: positions.length - mappable.length };
};

export const LiquidationMapCard: React.FC = () => {
  const { bins, lo, hi, unmappable } = useMemo(
    () => buildBins(data.positions, data.markPrice),
    [],
  );

  const longTotal = data.positions
    .filter((p) => p.side === "long")
    .reduce((s, p) => s + p.notional, 0);
  const shortTotal = data.positions
    .filter((p) => p.side === "short")
    .reduce((s, p) => s + p.notional, 0);

  const peak = Math.max(...bins.map((b) => b.long + b.short), 1);
  // sqrt scale keeps one whale cluster from flattening the rest of the map
  const h = (v: number) => (v <= 0 ? 0 : Math.sqrt(v / peak) * (CHART_H - 26));
  const barW = CHART_W / BINS;
  const markX = ((data.markPrice - lo) / (hi - lo)) * CHART_W;

  // densest cluster = the level traders should watch
  const peakIdx = bins.reduce(
    (best, b, i) => (b.long + b.short > bins[best].long + bins[best].short ? i : best),
    0,
  );
  const peakPrice = lo + ((peakIdx + 0.5) / BINS) * (hi - lo);
  const peakSize = bins[peakIdx].long + bins[peakIdx].short;

  const axisTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    x: t * CHART_W,
    label: fmtPrice(lo + t * (hi - lo)),
  }));

  return (
    <CardFrame source={data.source} fetchedAt={data.fetchedAt}>
      {/* app-style symbol header */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <TokenAvatar src={data.avatar} size={76} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              style={{
                color: V.text,
                fontSize: 42,
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              {data.pair}
            </span>
            <LevChip label="20x" />
            <span style={{ color: V.gray, fontSize: 26, fontWeight: 500 }}>
              Liquidation Map
            </span>
          </span>
          <span
            style={{
              color: V.lightBlue,
              fontSize: 30,
              fontWeight: 700,
              lineHeight: 1,
              ...TAB,
            }}
          >
            {fmtPrice(data.markPrice)}
            {data.priceChange24h != null && (
              <span
                style={{
                  marginLeft: 14,
                  color: data.priceChange24h >= 0 ? V.lightBlue : V.pink,
                  fontSize: 24,
                }}
              >
                {fmtPct(data.priceChange24h)} 24H
              </span>
            )}
          </span>
        </div>
        <div style={{ marginLeft: 48 }}>
          <StatStrip>
            <Stat label="Market Cap" value={fmtUsd(data.marketCap ?? 0)} />
            <Stat
              label="Spot Liquidity"
              value={fmtUsd(data.spotLiquidityUsd ?? 0)}
            />
            <Stat label="Perp OI" value={fmtUsd(longTotal + shortTotal)} />
            <Stat
              label="Funding (12h) (P|D)"
              value={
                <FundingPD long={data.fundingLong12h} short={data.fundingShort12h} />
              }
            />
          </StatStrip>
        </div>
      </div>

      {/* the map */}
      <div style={{ marginTop: 30, position: "relative" }}>
        <svg width={CHART_W} height={CHART_H + 44}>
          <line
            x1={0}
            x2={CHART_W}
            y1={CHART_H}
            y2={CHART_H}
            stroke={V.hairline}
            strokeWidth={2}
          />
          {bins.map((b, i) => {
            const x = i * barW;
            const lh = h(b.long);
            const sh = h(b.short);
            return (
              <g key={i}>
                {lh > 0 && (
                  <rect
                    x={x + 1.5}
                    y={CHART_H - lh}
                    width={barW - 3}
                    height={lh}
                    fill={V.lightBlue}
                    opacity={0.95}
                    rx={3}
                  />
                )}
                {sh > 0 && (
                  <rect
                    x={x + 1.5}
                    y={CHART_H - lh - sh}
                    width={barW - 3}
                    height={sh}
                    fill={V.pink}
                    opacity={0.95}
                    rx={3}
                  />
                )}
              </g>
            );
          })}
          <line
            x1={markX}
            x2={markX}
            y1={6}
            y2={CHART_H}
            stroke={V.text}
            strokeWidth={2.5}
            strokeDasharray="10 8"
            opacity={0.8}
          />
          {axisTicks.map((t, i) => (
            <text
              key={i}
              x={t.x}
              y={CHART_H + 34}
              fill={V.gray}
              fontSize={21}
              fontFamily={FONT_VIBE}
              textAnchor={i === 0 ? "start" : i === axisTicks.length - 1 ? "end" : "middle"}
            >
              {t.label}
            </text>
          ))}
        </svg>
        <span
          style={{
            position: "absolute",
            top: -14,
            left: Math.min(Math.max(markX - 70, 0), CHART_W - 170),
            color: V.text,
            fontSize: 21,
            fontWeight: 700,
            background: V.panel3,
            borderRadius: 8,
            padding: "7px 12px",
            lineHeight: 1,
            ...TAB,
          }}
        >
          mark {fmtPrice(data.markPrice)}
        </span>
      </div>

      {/* stats row */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 56, marginTop: 22 }}>
        <Stat
          label="Pump liquidations"
          value={fmtUsd(longTotal)}
          color={V.lightBlue}
          size={38}
        />
        <Stat
          label="Dump liquidations"
          value={fmtUsd(shortTotal)}
          color={V.pink}
          size={38}
        />
        <Stat
          label="Densest cluster"
          value={`${fmtUsd(peakSize)} @ ${fmtPrice(peakPrice)}`}
          size={34}
        />
        <Stat label="Open positions" value={`${data.positions.length}`} size={34} />
        {unmappable > 0 && (
          <span
            style={{
              marginLeft: "auto",
              color: V.grayDim,
              fontSize: 19,
              alignSelf: "flex-end",
              lineHeight: 1.4,
              maxWidth: 280,
              textAlign: "right",
            }}
          >
            {unmappable} positions hold enough collateral to be unliquidatable
            in this range
          </span>
        )}
      </div>
    </CardFrame>
  );
};
