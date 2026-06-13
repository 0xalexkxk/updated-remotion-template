# Config Schema

Each `configs/<name>.json` describes one video. Run with:
```
npm run make <name>
```

## 🔥 THE CORE PRINCIPLE — capture the PUMP MOMENT

**This is the non-negotiable design rule of the whole project.**

When a chart screenshot is given, the goal is to pretend we hit **RECORD at the moment the pump happened** — NOT to replay the current settled state of the chart.

If the reference shows a token that pumped $1M → $4M and now sits at $3.5M, the video MUST show the live god candle ripping from $1M → $4M. It must NOT show consolidation at $3.5M.

### ✅ RIGHT — pump moment
```jsonc
"history": {
  "launchMcap": 200000,
  "pattern": [
    { "frac": 0.00, "mcap": 200000 },
    { "frac": 0.70, "mcap": 1000000 },     // build-up
    { "frac": 1.00, "mcap": 1000000 }      // clip starts here, pre-pump
  ]
},
"livePump": {
  "anchors": [
    { "frac": 0.00, "mult": 1.00 },        // $1M — pre-pump
    { "frac": 0.55, "mult": 2.80 },        // breakout
    { "frac": 1.00, "mult": 4.00 }         // ← THE PEAK from the chart
  ]
}
```

### ❌ WRONG — aftermath / consolidation
```jsonc
"history": {
  "pattern": [
    { "frac": 0.00, "mcap": 1000000 },
    { "frac": 0.70, "mcap": 4000000 },     // ❌ pump in HISTORY
    { "frac": 1.00, "mcap": 3500000 }      // ❌ settled price
  ]
},
"livePump": {
  "anchors": [
    { "frac": 0.00, "mult": 1.00 },
    { "frac": 0.50, "mult": 1.05 },        // ❌ chop, not pump
    { "frac": 1.00, "mult": 1.01 }         // ❌ no movement
  ]
}
```

### Validation enforced by `make.mjs`

The config is **REJECTED** at render time if:
- `livePump` peak mult < 1.5x
- `livePump` range (peak / low) < 1.4x
- Final mult < 1.3x with peak < 1.5x

To override (rare — you really want consolidation): set `"allowConsolidation": true`.

---

## Full Schema

```jsonc
{
  // ── Identity ────────────────────────────────────────────────────────
  "name": "Trillion",                  // Display name in header
  "ticker": "TRILLION",                // Symbol in header
  "avatar": "trillion-avatar.png",     // File in public/ folder

  // ── Video setup ─────────────────────────────────────────────────────
  "duration": 20,                      // seconds of video (clip length)
  "timeframe": "1m",                   // shown timeframe label: "1m", "15s", "5m"
  "language": "en",                    // "en" | "zh" — UI language

  // ── Historical chart (PRE-PUMP context) ─────────────────────────────
  // Accumulation / build-up BEFORE the live god candle pumps.
  // The last anchor's mcap is where the clip starts AND where the
  // god candle opens — it's the launchpad.
  "history": {
    "launchMcap": 200000,             // mcap at the leftmost candle (USD)
    "candleCount": 90,                // number of context candles to draw
    "pattern": [
      { "frac": 0.00, "mcap": 200000 },   // launch
      { "frac": 0.70, "mcap": 1000000 },  // build-up to launchpad
      { "frac": 1.00, "mcap": 1000000 }   // pre-pump (god candle opens here)
    ]
  },

  // ── Live god candle — THE PUMP (this is the main event) ────────────
  // Each anchor's `mult` is a multiplier on the starting mcap (history endpoint).
  // The final anchor should match the chart's visible peak.
  "livePump": {
    "anchors": [
      { "frac": 0.00, "mult": 1.00 },
      { "frac": 0.15, "mult": 1.45 },   // initial rip
      { "frac": 0.30, "mult": 1.30 },   // small pullback
      { "frac": 0.65, "mult": 1.80 },   // breakout
      { "frac": 0.85, "mult": 1.60 },   // retest
      { "frac": 1.00, "mult": 2.00 }    // final push (2x)
    ]
  },

  // ── Optional knobs ──────────────────────────────────────────────────
  "poolLiquidity": 200000,             // dampens per-tick wiggle (bigger = smoother)
  "txRateBoost": 1.0,                  // 1.0 = default, 1.15 = 15% more transactions
  "dramaticCandle": false,             // true → wild wick: spike up +18%, crash down -30%, slow recover

  // ── Escape hatch (rarely used) ──────────────────────────────────────
  "allowConsolidation": false          // set true to bypass pump-moment validation
}
```

## Self-check before saving a config

- [ ] Does `livePump.anchors` end with a `mult ≥ 1.5x`? If not, it's consolidation, not a pump.
- [ ] Does `(history.pattern[last].mcap × livePump.anchors[last].mult)` match the chart's visible peak?
- [ ] Is `history.pattern` ending at the **pre-pump** mcap, not the post-pump settled price?
- [ ] **Does `history` tell the FULL story shown in the screenshot?** A wide-zoom chart needs `candleCount: 200+` with a long flat at the launch floor + a gradual ramp. A close-zoom chart can use `candleCount: 90`.

## Rule: full-chart reference → full-story video

When the user shares a wide-zoom chart (dexscreener daily, multi-hour view):
- `history.candleCount` should be **180–260**
- `history.pattern` must include a **long flat at the launch floor**, then a gradual ramp to the pre-pump consolidation
- Engine's `MAX_CTX` is 260 and `BASE_VIEW` is 240 — keep history within those budgets

Example anchor shape for a wide-zoom reference:
```jsonc
"pattern": [
  { "frac": 0.00, "mcap": 50000 },     // very low
  { "frac": 0.45, "mcap": 80000 },     // long flat (45% of history near floor)
  { "frac": 0.65, "mcap": 90000 },     // still flat
  { "frac": 0.78, "mcap": 150000 },    // first sign of life
  { "frac": 0.85, "mcap": 350000 },    // accelerating
  { "frac": 0.92, "mcap": 700000 },    // ramping
  { "frac": 1.00, "mcap": 1000000 }    // pre-pump consolidation (launchpad)
]
```
