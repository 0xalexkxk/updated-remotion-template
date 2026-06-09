# vibe-twitter-video-engine

A Remotion engine that renders Axiom-style memecoin-pump videos from real on-chain data. Drop in a token, get a pixel-clone of the pump.fun mobile token screen replaying that coin's real parabolic run-up — candles, live trade tape, market cap, the works.

- **One token in, one video out.** `npm run fetch <token>` pulls the real data; Studio shows it instantly; `npm run render` exports the MP4.
- **No API key.** Data comes from GeckoTerminal's free public API.
- **Real backbone, synthetic motion.** The parabola is real OHLC. The live-edge chop, the parasite camera, and the dynamic Peak marker are the engine's.

## Quick start

| Step | Command | Time |
|---|---|---|
| Install deps | `npm install` | ~2 min |
| Pull a real token | `npm run fetch <pool-or-symbol>` | ~1 min |
| Preview | `npm run studio` → open `http://localhost:3333` | instant |
| Export MP4 | `npm run render` → `out/PumpFunScreen.mp4` | ~1 min |

`npm run fetch` writes both `src/pumpfun-screen/data/<ticker>.json` and `src/pumpfun-screen/data/active.json`. The composition imports `active.json`, so the new token shows up in Studio with zero code edits. Run with no argument (`npm run fetch`) to auto-pick the spiciest trending pump.

The repo ships with a demo token (`heavypulp`) already baked into `active.json`, so it renders on a fresh clone before you fetch anything.

## How the data pipeline works

`scripts/pumpfun/fetch.mjs` hits **GeckoTerminal** (`api.geckoterminal.com`, no key, ~30 req/min so it paces itself and backs off on 429):

1. **Resolve** your argument — a Solana pool address, a token mint, or a symbol/name — to a pool. Deepest-liquidity match wins.
2. **OHLC candles** — up to 1000 minute candles, enough to contain a multi-hour run-up.
3. **Trade tape** — recent per-trade prices, sizes, and buy/sell sides, priced in USD off the base-token mint.
4. **Pump window** — the largest clean run-up in the trade series (max `price[j]/price[i]` over a running minimum) becomes the parabola the camera rides.
5. **Avatar** — the token image is downloaded to `public/pumpfun/<ticker>-avatar.png`.

**Jargon:** *pool* = a specific liquidity pair on a DEX. *mint* = the token's on-chain address. *OHLC* = open/high/low/close candle. *base token* = the memecoin (as opposed to the SOL/USDC it trades against).

## How the engine works

`src/pumpfun-screen/` builds a per-frame timeline (`engine.ts`) from the fetched data:

- **Real candle parabola** — the OHLC run-up window drives the chart's shape.
- **Live-edge random-walk chop** — the right edge of the chart breathes with synthetic micro-motion so the last candle feels alive, not frozen.
- **Parasite camera** — `camera.ts` rides the parabola, zooming and panning to keep the action framed the way a trader watching the chart would.
- **Dynamic Peak** — the all-time-high marker tracks the run and re-anchors as price prints new highs.

`pricePath.ts` stitches the real candles and the synthetic edge into one continuous price path; `theme.ts` holds the pump.fun colours, fonts (Inter via `@remotion/google-fonts`), and the 1080×1920 frame.

## Known constraint

GeckoTerminal returns only **~300 recent trades**, so the trade tape is *real-recent* — the last few hundred prints, not the full history of the pump. The **parabola shape is real** because it comes from the OHLC candles, which go back far enough to contain the whole run-up. So: real shape, real-recent tape.

---

Built with [Claude Code](https://claude.com/claude-code).

## Vibe cards (static tweet images)

Three Remotion stills built from real **Vibe** (Symmio on HyperEVM) data — same principle as the pump videos: auto-pick the trending pair, real data only, re-run to refresh.

| Card | Composition id | What it shows |
|---|---|---|
| Liquidation map | `LiquidationMap` | Where open positions on the most-used pair get liquidated — entry price + collateral actually deposited in each trader's account, bucketed into price levels around the mark |
| Big liquidation | `BigLiquidation` | The largest liquidation on the venue — side, effective leverage, entry → liquidation price, collateral wiped |
| Funding arb | `FundingArb` | The widest funding spread between Hyperliquid and Vibe on a coin both list. Vibe charges no funding on its pairs, so the hedge leg is free — the Hyperliquid funding is the carry |

| Step | Command | Time |
|---|---|---|
| Pull Vibe data | `npm run fetch:vibe` (or `npm run fetch:vibe SYMM` to force a pair) | ~30 s |
| Render all three | `npm run cards` → `out/liqmap.png`, `out/bigliq.png`, `out/fundingarb.png` | ~1 min |

### Data sources (all public, no keys)

1. **Goldsky subgraph** `hyperevm_mainnet_analytics` — quotes (open positions, liquidations), account balances (collateral deposited per trader).
2. **`solver.enigma.bz`** — Vibe's solver: symbol specs, max leverage, funding config.
3. **`lowcap-price.enigma.bz`** — mark prices and token metadata for Vibe's SFLOW pairs (which are pump.fun tokens).
4. **`api.hyperliquid.xyz`** — live hourly funding for the arb card.

### Liquidation levels

A position's liquidation level is computed from its open price and the collateral deposited in the trader's account (`allocatedBalance`), attributed pro-rata when one account holds several positions: `long: entry − collateral/qty`, `short: entry + collateral/qty`. Positions whose level falls at or below zero are unliquidatable by price and counted separately on the card.

**Exception:** Vibe has never charged funding on-chain and its HyperEVM config has no funding-rate feed, so the funding card's Vibe leg is a true 0% — that is the point of the arb.
