import rawData from "../data/fundingarb.json";

/**
 * Shared data for every market's spot-vs-funding card.
 *
 * The trade all four cards present — native to Vibe: hold the spot token,
 * Dump (short) the same VibeCap perp on Vibe, stay delta-neutral, and
 * RECEIVE the dump-side funding every epoch. Funding on Vibe is asymmetric
 * per side: Pumps pay `fundingLong12h`, Dumps receive `fundingShort12h`.
 */
export type SpotFundingData = {
  ticker: string;
  tokenName: string;
  vibeSymbol: string;
  avatar: string | null;
  fundingShort12h: number; // fraction per epoch, Dump side receives
  fundingLong12h: number; // fraction per epoch (negative), Pump side pays
  epochSecs: number;
  aprShort: number; // annualized fraction the Dump side receives
  spotPx: number | null;
  vibeMarkPx: number | null;
  basisPct: number | null;
  spotLiquidityUsd: number;
  marketCap: number | null;
  change24hPct: number | null;
  vibeMaxLeverage: number;
  runnersUp: {
    ticker: string;
    fundingShort12h: number;
    aprShort: number;
    epochSecs: number;
    spotLiquidityUsd: number;
  }[];
  fetchedAt: string;
  source: string;
};

export const data = rawData as unknown as SpotFundingData;

/** Annualized funding the Dump side receives, as positive % (e.g. 38.5). */
export const aprPct = data.aprShort * 100;

/** Per-epoch funding the Dump side receives, in % (e.g. 0.0528). */
export const epochPct = data.fundingShort12h * 100;

/** Epoch length in hours (12 for most VibeCaps). */
export const epochHours = data.epochSecs / 3600;

/** Per-epoch funding the Pump side pays, in % (negative, e.g. -0.1056). */
export const pumpPaysPct = data.fundingLong12h * 100;
