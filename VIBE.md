# Vibe perp-DEX skin (v2)

This project is a **re-skin** of the pump-video engine. Same engine, new interface:
the **Vibe** perpetuals DEX (matching `vibe-ui-v2.vercel.app`). Full-screen app —
**no browser chrome** (no URL bar, no close button, no bottom nav).

The composition id is **`VibeScreen`** (1080×1920, 60fps). The pump-engine
(`src/pumpfun-screen/engine.ts`, `pricePath.ts`, `camera.ts`) is reused unchanged;
only the visual layer in `src/vibe-screen/` is new.

## What the screen shows

```
Vibe logo            Connect  ☰      ← header
🪙 PAIR  sub  40x   |   PRICE  ⌄      ← market row (price is LIVE, from the engine)
[ Chart ] Positions  Orderbook        ← tabs
┌─────────────────────────────┐
│ PAIR · 15m                   │
│  blue/pink candles + grid    │      ← live chart (engine-driven)
│  volume bars                 │
└─────────────────────────────┘
[ ↗ Buy ]        ↘ Sell               ← trade panel (static chrome)
Market  Limit  More
Risk Mode              Cross ⌄
Leverage  ●────────   [ 1 x ]
Amount            Available: $0.00
```

- **Up candles are blue (#2465FF), down candles are pink (#EC71E1)** — Vibe's look.
- The **market-row coin icon** is the token avatar when the config provides one,
  else the bundled BTC icon.
- The **price** in the header animates with the engine's live value.

## Make a video

Same pipeline as v1:

```bash
npm run make <config>          # config's language
npm run make <config> en|zh    # force a language
npm run make <config> all      # both languages
```

Output: `out/<TICKER>-<lang>-<timestamp>.mp4`.

## Config fields (Vibe-specific additions)

On top of the normal fields (`history`, `livePump`, `duration`, `language`, …):

| Field | Default | Purpose |
|---|---|---|
| `pair` | `"<TICKER>-USDC"` | Market pair label in the header |
| `sub` | language word for the asset | Subtitle under the pair (e.g. "Bitcoin") |
| `leverage` | `"40x"` | The leverage pill text |
| `chartTf` | config `timeframe` or `"15m"` | The "PAIR · <tf>" chart label |
| `allowConsolidation` | `false` | **Set `true` for gentle perp charts** (see below) |

## ⚠️ Two kinds of chart in this skin

The Vibe reference is a **perp DEX** — its charts are gentle waves with clear,
fat candles, NOT extreme memecoin spikes. Two modes:

1. **Gentle perp chart (recommended for Vibe)** — moves like ±20–60%, candles
   stay clearly visible across the whole view. The pump-moment validator would
   reject these, so set **`"allowConsolidation": true`**. See `configs/btc.json`
   for the reference-matching demo.
2. **Memecoin pump** — the old aggressive behavior (a flat base then a vertical
   rip). Works, but with a big multiple the base compresses to a thin line.
   Fine if that's the intent.

**Candle density:** the Vibe chart shows ~70 candles (`BASE_VIEW = 72` in
`engine.ts`) for the fat-candle perp look, vs the pump.fun skin's 240.

## Language

All UI text switches off a single `LANG` constant in `VibeScreen.tsx`
(`make.mjs` rewrites it). Supported: `en`, `zh`. The labels live in the `LABELS`
map at the top of `VibeScreen.tsx` — add a language by extending that map.

## Files

| Path | What |
|---|---|
| `src/vibe-screen/VibeScreen.tsx` | root composition + `LANG`/`PAIR`/`SUB`/`LEV`/`TF` + `LABELS` |
| `src/vibe-screen/TopChrome.tsx` | header, market row, tab switcher |
| `src/vibe-screen/VibeChart.tsx` | blue/pink candle chart + volume + grid |
| `src/vibe-screen/TradePanel.tsx` | Buy/Sell, order tabs, risk, leverage, amount |
| `src/vibe-screen/theme.ts` | Vibe palette + frame size + font |
| `src/pumpfun-screen/*` | the reused engine (timeline, pricePath, camera) |
| `public/vibe/` | all the provided Vibe assets + manifest.json |
| `configs/btc.json` | reference-matching gentle BTC demo |
