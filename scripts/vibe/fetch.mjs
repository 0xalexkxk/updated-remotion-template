#!/usr/bin/env node
/* eslint-env node */
/**
 * Fetch real Vibe (Symmio on HyperEVM) data and bake it to JSON files the
 * vibe-cards Remotion stills read. Same principle as scripts/pumpfun/fetch.mjs:
 * auto-pick the trending pair, real data backbone, zero code edits to re-run.
 *
 *   node scripts/vibe/fetch.mjs                # full refresh (all three cards)
 *   node scripts/vibe/fetch.mjs <symbol>       # force a pair for the liq map (e.g. SYMM)
 *
 * Sources (all public, no keys):
 *   - Goldsky subgraph  hyperevm_mainnet_analytics  → quotes, balances, liquidations
 *   - solver.enigma.bz/api/contract-symbols         → Vibe symbol specs
 *   - solver.enigma.bz/api/get_funding_info         → per-side 12h funding (the real thing)
 *   - lowcap-price.enigma.bz/api/v1                 → mark prices + token metadata
 *
 * Universe: VibeCaps only. Vibe lists two tiers — VibeCaps (pump.fun-style
 * lowcaps) and large caps (ASTER/JUP/TRUMP…, all ≥ ~$139M mcap with a clear
 * gap below). We classify by market cap: < $100M = VibeCap.
 *
 * Writes:
 *   src/vibe-cards/data/liqmap.json
 *   src/vibe-cards/data/bigliq.json
 *   src/vibe-cards/data/fundingarb.json
 *   public/vibe/<ticker>-avatar.png (when the token has an image)
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const DATA_DIR = resolve(ROOT, "src/vibe-cards/data");
const PUBLIC_DIR = resolve(ROOT, "public/vibe");

const SUBGRAPH =
  "https://api.goldsky.com/api/public/project_cm1hfr4527p0f01u85mz499u8/subgraphs/hyperevm_mainnet_analytics/latest/gn";
const SOLVER = "https://solver.enigma.bz/api";
const PRICE = "https://lowcap-price.enigma.bz/api/v1";

/** Above this market cap a listing is a "large cap" on Vibe, not a VibeCap. */
const VIBECAP_MAX_MCAP = 100e6;

const E18 = 1e18;
const num = (x) => Number(x) / E18; // BigInt-string (18 decimals) → float

async function gql(query) {
  const res = await fetch(SUBGRAPH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const body = await res.json();
  if (body.errors) throw new Error(JSON.stringify(body.errors));
  return body.data;
}

async function getJson(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} on ${url}`);
  return res.json();
}

/** Ticker before the "::" in a Vibe SFLOW symbol name. */
const tickerOf = (name) => name.split("::")[0];

// ---------------------------------------------------------------- symbols

async function vibeSymbols() {
  const d = await getJson(`${SOLVER}/contract-symbols`);
  const bySymbolId = new Map();
  for (const s of d.symbols) bySymbolId.set(Number(s.symbol_id), s);
  return bySymbolId;
}

/** Bulk token metadata keyed by full symbol name (mcap, spot liquidity, …). */
async function allMetadata() {
  const list = await getJson(`${PRICE}/metadata`);
  const byName = new Map();
  for (const m of list) byName.set(m.name, m);
  return byName;
}

/** Live per-side 12h funding keyed by ticker ("SYMM" → rates as fractions). */
async function fundingInfo() {
  const d = await getJson(`${SOLVER}/get_funding_info`);
  const byTicker = new Map();
  for (const [t, f] of Object.entries(d)) {
    byTicker.set(t, {
      short12h: Number(f.next_funding_rate_short),
      long12h: Number(f.next_funding_rate_long),
      epochSecs: Number(f.funding_rate_epoch_duration),
      nextFundingTime: Number(f.next_funding_time),
    });
  }
  return byTicker;
}

const isVibeCap = (meta) => (meta?.market_cap ?? 0) < VIBECAP_MAX_MCAP;

async function markPrice(name) {
  try {
    const d = await getJson(`${PRICE}/price/${encodeURIComponent(name)}`);
    return Number(d.markPrice);
  } catch {
    return null;
  }
}

async function tokenMeta(name) {
  try {
    return await getJson(`${PRICE}/metadata/${encodeURIComponent(name)}`);
  } catch {
    return null;
  }
}

// ------------------------------------------------------ trending pair pick

/**
 * Most-traded Vibe pair over the recent window, by opened notional.
 * Falls back to widening the window when the venue has been quiet.
 */
async function trendingPair(windows = [48, 24 * 7, 24 * 30]) {
  for (const hours of windows) {
    const since = Math.floor(Date.now() / 1000) - hours * 3600;
    const d = await gql(`{
      quotes(first: 1000, orderBy: timestamp, orderDirection: desc,
             where: {timestampOpenPosition_gt: "${since}", openedPrice_gt: "0"}) {
        symbolId symbol openedPrice quantity
      }
    }`);
    if (!d.quotes.length) continue;
    const vol = new Map();
    for (const q of d.quotes) {
      const notional = num(q.openedPrice) * num(q.quantity);
      const cur = vol.get(q.symbolId) ?? { symbol: q.symbol, notional: 0, trades: 0 };
      cur.notional += notional;
      cur.trades += 1;
      vol.set(q.symbolId, cur);
    }
    const ranked = [...vol.entries()]
      .map(([symbolId, v]) => ({ symbolId: Number(symbolId), ...v }))
      .sort((a, b) => b.notional - a.notional);
    console.log(`trending (last ${hours}h):`);
    ranked.slice(0, 5).forEach((r, i) =>
      console.log(
        `  ${i + 1}. ${tickerOf(r.symbol).padEnd(12)} $${r.notional.toFixed(0)}  (${r.trades} fills)`,
      ),
    );
    return ranked;
  }
  throw new Error("no opened quotes found in any window");
}

// ------------------------------------------------------------ liquidation map

/**
 * Open positions on a pair + the collateral actually deposited in each
 * trader's account (allocatedBalance). Liquidation level per position:
 * the price where the account's collateral is consumed by this position's
 * loss — collateral attributed pro-rata when the account holds several
 * open positions.
 *
 *   long :  liq = entry − collateralShare / quantity
 *   short:  liq = entry + collateralShare / quantity
 */
async function liqMapData(symbolId, symbolName) {
  const d = await gql(`{
    quotes(first: 1000, where: {symbolId: "${symbolId}", quoteStatus_in: [4, 5, 6]}) {
      quoteId partyA positionType openedPrice quantity
      cva lf partyAmm timestampOpenPosition
    }
  }`);
  const open = d.quotes.filter((q) => num(q.quantity) > 0 && num(q.openedPrice) > 0);
  if (!open.length) return { positions: [] };

  // Account collateral for every distinct partyA (collateral deposited in account).
  const parties = [...new Set(open.map((q) => q.partyA))];
  const balances = new Map();
  for (let i = 0; i < parties.length; i += 50) {
    const batch = parties.slice(i, i + 50);
    const b = await gql(`{
      latestAccountBalances(first: ${batch.length * 2}, where: {
        accountType: "PARTY_A", account_in: [${batch.map((p) => `"${p}"`).join(",")}]
      }) { account allocatedBalance }
    }`);
    for (const r of b.latestAccountBalances)
      balances.set(r.account, num(r.allocatedBalance));
  }

  // Pro-rata: notional share of each position within its account.
  const accountNotional = new Map();
  for (const q of open) {
    const n = num(q.openedPrice) * num(q.quantity);
    accountNotional.set(q.partyA, (accountNotional.get(q.partyA) ?? 0) + n);
  }

  const positions = open.map((q) => {
    const entry = num(q.openedPrice);
    const qty = num(q.quantity);
    const notional = entry * qty;
    const allocated = balances.get(q.partyA) ?? num(q.cva) + num(q.lf) + num(q.partyAmm);
    const share = allocated * (notional / (accountNotional.get(q.partyA) || notional));
    const long = q.positionType === 0;
    const liq = long ? entry - share / qty : entry + share / qty;
    return {
      quoteId: Number(q.quoteId),
      side: long ? "long" : "short",
      entry,
      quantity: qty,
      notional,
      collateral: share,
      leverage: share > 0 ? notional / share : 0,
      liqPrice: Math.max(liq, 0),
      openedAt: Number(q.timestampOpenPosition),
    };
  });
  return { positions };
}

// ------------------------------------------------------------ big liquidation

async function biggestLiquidations() {
  const d = await gql(`{
    quotes(first: 500, orderBy: timestamp, orderDirection: desc,
           where: {quoteStatus: 8, liquidatePrice_gt: "0"}) {
      quoteId partyA symbol symbolId positionType
      openedPrice liquidatePrice liquidateAmount
      cva lf partyAmm timestampOpenPosition timestamp
    }
  }`);
  return d.quotes
    .map((q) => {
      const entry = num(q.openedPrice);
      const liqPx = num(q.liquidatePrice);
      const qty = num(q.liquidateAmount);
      const long = q.positionType === 0;
      const collateral = num(q.cva) + num(q.lf) + num(q.partyAmm);
      return {
        quoteId: Number(q.quoteId),
        trader: q.partyA,
        symbol: q.symbol,
        symbolId: Number(q.symbolId),
        side: long ? "long" : "short",
        entry,
        liqPrice: liqPx,
        quantity: qty,
        notional: entry * qty,
        collateral,
        loss: Math.abs(entry - liqPx) * qty,
        movePct: ((liqPx - entry) / entry) * 100,
        openedAt: Number(q.timestampOpenPosition),
        liquidatedAt: Number(q.timestamp),
      };
    })
    .sort((a, b) => b.notional - a.notional);
}

// ----------------------------------------------------- spot vs funding (Vibe)

/**
 * The native carry on Vibe itself: hold the spot token, Dump (short) the perp
 * on Vibe, stay delta-neutral, and RECEIVE the dump-side funding every 12h
 * epoch. Funding is asymmetric per side — `get_funding_info` publishes
 * next_funding_rate_short (what a Dump receives when positive) and
 * next_funding_rate_long (what a Pump pays). Ranked across VibeCaps only,
 * requiring real spot liquidity so the spot leg is actually buyable.
 */
function spotVsFunding(symbols, meta, funding) {
  const rows = [];
  for (const [symbolId, s] of symbols) {
    const t = tickerOf(s.name);
    const f = funding.get(t);
    const m = meta.get(s.name);
    if (!f || !m || !isVibeCap(m)) continue;
    const spotLiq = m.liquidity?.usd ?? 0;
    rows.push({
      symbolId,
      vibeSymbol: s.name,
      ticker: t,
      tokenName: m.base_token?.name ?? t,
      tokenAddress: m.base_token?.address ?? null,
      fundingShort12h: f.short12h, // fraction per 12h epoch, Dump side receives
      fundingLong12h: f.long12h, // fraction per 12h epoch, Pump side pays
      epochSecs: f.epochSecs,
      aprShort: f.short12h * (86400 / f.epochSecs) * 365,
      spotPx: m.price_usd ? Number(m.price_usd) : null,
      spotLiquidityUsd: spotLiq,
      marketCap: m.market_cap ?? null,
      change24hPct: m.price_change?.h24 ?? null,
      vibeMaxLeverage: Number(s.max_leverage),
    });
  }
  rows.sort((a, b) => b.aprShort - a.aprShort);
  console.log("\nVibeCaps by dump-side funding received:");
  rows.slice(0, 8).forEach((r) =>
    console.log(
      `  ${r.ticker.padEnd(10)} +${(r.fundingShort12h * 100).toFixed(4)}%/${r.epochSecs / 3600}h  APR ${(r.aprShort * 100).toFixed(0)}%  spot liq $${(r.spotLiquidityUsd / 1e3).toFixed(0)}k`,
    ),
  );
  // The spot leg must be buyable: demand real DEX liquidity.
  return rows.filter((r) => r.spotLiquidityUsd > 25_000);
}

// ------------------------------------------------------------------- avatar

async function downloadAvatar(tokenAddress, ticker) {
  // pump.fun mints expose token images through dexscreener's token endpoint.
  try {
    const d = await getJson(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
    );
    const url = d?.pairs?.find((p) => p?.info?.imageUrl)?.info?.imageUrl;
    if (!url) return null;
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) return null;
    const file = `${ticker.toLowerCase()}-avatar.png`;
    writeFileSync(resolve(PUBLIC_DIR, file), buf);
    return `vibe/${file}`;
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------- main

async function main() {
  const forced = process.argv[2];
  mkdirSync(DATA_DIR, { recursive: true });
  mkdirSync(PUBLIC_DIR, { recursive: true });

  const [symbols, metaAll, funding] = await Promise.all([
    vibeSymbols(),
    allMetadata(),
    fundingInfo(),
  ]);
  const caps = new Map(
    [...symbols].filter(([, s]) => isVibeCap(metaAll.get(s.name))),
  );
  console.log(
    `vibe symbols: ${symbols.size} (${caps.size} VibeCaps, ${symbols.size - caps.size} large caps excluded)`,
  );

  // ---- pick the pair (trending VibeCap, or forced by ticker)
  // A liquidation map needs open positions to map. Rank by recent volume,
  // but require a real open book — the trending pair with the deepest
  // standing open interest wins.
  const rankedAll = await trendingPair();
  const ranked = rankedAll.filter((r) => caps.has(r.symbolId));
  if (rankedAll.length !== ranked.length)
    console.log(
      `  (dropped ${rankedAll.length - ranked.length} large-cap pairs from the ranking)`,
    );
  const oi = await gql(`{
    quotes(first: 1000, where: {quoteStatus_in: [4, 5, 6]}) { symbolId }
  }`);
  const openCount = new Map();
  for (const q of oi.quotes)
    openCount.set(Number(q.symbolId), (openCount.get(Number(q.symbolId)) ?? 0) + 1);
  for (const r of ranked) r.openPositions = openCount.get(r.symbolId) ?? 0;
  const mappable = ranked.filter((r) => r.openPositions >= 10);
  let pick = mappable.length
    ? mappable.sort((a, b) => b.openPositions - a.openPositions)[0]
    : ranked[0];
  if (forced) {
    const f = ranked.find(
      (r) => tickerOf(r.symbol).toUpperCase() === forced.toUpperCase(),
    );
    if (f) pick = f;
    else {
      const s = [...caps.values()].find(
        (x) => tickerOf(x.name).toUpperCase() === forced.toUpperCase(),
      );
      if (!s) throw new Error(`no VibeCap symbol for "${forced}"`);
      pick = { symbolId: Number(s.symbol_id), symbol: s.name, notional: 0, trades: 0 };
    }
  }
  const ticker = tickerOf(pick.symbol);
  const pickFunding = funding.get(ticker) ?? null;
  console.log(`\npair: ${ticker} (symbolId ${pick.symbolId})`);

  const [price, meta] = await Promise.all([
    markPrice(pick.symbol),
    tokenMeta(pick.symbol),
  ]);
  const avatar = meta?.base_token?.address
    ? await downloadAvatar(meta.base_token.address, ticker)
    : null;

  // ---- 1. liquidation map
  const { positions } = await liqMapData(pick.symbolId, pick.symbol);
  const liqmap = {
    pair: ticker,
    symbol: pick.symbol,
    symbolId: pick.symbolId,
    tokenName: meta?.base_token?.name ?? ticker,
    avatar,
    markPrice: price,
    priceChange24h: meta?.price_change?.h24 ?? null,
    marketCap: meta?.market_cap ?? null,
    spotLiquidityUsd: meta?.liquidity?.usd ?? null,
    fundingLong12h: pickFunding?.long12h ?? null,
    fundingShort12h: pickFunding?.short12h ?? null,
    volume48hUsd: pick.notional,
    trades48h: pick.trades,
    positions,
    fetchedAt: new Date().toISOString(),
    source: "goldsky:hyperevm_mainnet_analytics + lowcap-price.enigma.bz",
  };
  writeFileSync(resolve(DATA_DIR, "liqmap.json"), JSON.stringify(liqmap, null, 2));
  console.log(
    `liqmap: ${positions.length} open positions  (${positions.filter((p) => p.side === "long").length} long / ${positions.filter((p) => p.side === "short").length} short)`,
  );

  // ---- 2. big liquidation (VibeCaps only)
  const liqs = (await biggestLiquidations()).filter((l) => caps.has(l.symbolId));
  if (liqs.length) {
    const big = liqs[0];
    const bigTicker = tickerOf(big.symbol);
    const bigMeta = await tokenMeta(big.symbol);
    const bigAvatar = bigMeta?.base_token?.address
      ? await downloadAvatar(bigMeta.base_token.address, bigTicker)
      : null;
    const bigliq = {
      pair: bigTicker,
      tokenName: bigMeta?.base_token?.name ?? bigTicker,
      avatar: bigAvatar,
      ...big,
      recentLiquidations: liqs.slice(0, 12),
      fetchedAt: new Date().toISOString(),
      source: "goldsky:hyperevm_mainnet_analytics",
    };
    writeFileSync(resolve(DATA_DIR, "bigliq.json"), JSON.stringify(bigliq, null, 2));
    console.log(
      `bigliq: ${bigTicker} ${big.side} $${big.notional.toFixed(0)} notional, loss $${big.loss.toFixed(2)}`,
    );
  } else {
    console.log("bigliq: no liquidations found");
  }

  // ---- 3. spot vs funding on Vibe (VibeCaps only)
  const arbs = spotVsFunding(caps, metaAll, funding);
  if (arbs.length) {
    const best = arbs[0];
    const bestAvatar = best.tokenAddress
      ? await downloadAvatar(best.tokenAddress, best.ticker)
      : null;
    const vibePx = await markPrice(best.vibeSymbol);
    const fundingarb = {
      ...best,
      avatar: bestAvatar,
      vibeMarkPx: vibePx,
      basisPct:
        best.spotPx && vibePx
          ? ((vibePx - best.spotPx) / best.spotPx) * 100
          : null,
      runnersUp: arbs.slice(1, 6),
      fetchedAt: new Date().toISOString(),
      source: "solver.enigma.bz + lowcap-price.enigma.bz",
    };
    writeFileSync(
      resolve(DATA_DIR, "fundingarb.json"),
      JSON.stringify(fundingarb, null, 2),
    );
    console.log(
      `fundingarb: ${best.ticker}  Dump receives +${(best.fundingShort12h * 100).toFixed(4)}%/12h ≈ ${(best.aprShort * 100).toFixed(0)}% APR`,
    );
  } else {
    console.log("fundingarb: no overlap with meaningful funding");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
