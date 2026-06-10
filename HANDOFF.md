# Pump Video Engine — Handoff Guide

**This is a one-stop guide to making memecoin pump videos. Read this whole file, then you can produce a video from any chart screenshot.**

---

## 📦 What this project does

Takes one chart screenshot + a few details, produces a 1080×1920 portrait MP4 that looks like someone screen-recorded the pump.fun / Axiom mobile app at the **exact moment a token pumped**. Used for memecoin marketing on Twitter / X.

Output: `out/{TICKER}-{lang}-{YYYYMMDD-HHMMSS}.mp4` (60fps, durations 10–30s).

The engine renders one continuous live screen — no captions, no transitions, no cuts. It is a pixel clone of the real app showing a real pump.

---

## 🔥 THE GOLDEN RULE — capture the PUMP MOMENT

**This is the most important thing to understand. Read it twice.**

The video must pretend we hit RECORD at the exact moment the price ripped. It must **not** show the current settled aftermath.

If a chart shows a token that **pumped $28K → $400K → settled at $341K**, the video must:
1. **Open** with the live god candle at **$28K** (the pre-pump base)
2. **RIP UP** during the clip — viewer watches the price actually go from $28K to $400K live
3. **End** at or near $341K (the peak / current settled price)

It must **NOT** open at $341K and chop around $340K-$345K. That's the aftermath. Boring. Wrong.

```
✅ RIGHT — pump moment              ❌ WRONG — aftermath
   start: pre-pump base                start: current settled price
   live candle RIPS during clip        live candle chops sideways
   peak counter ticks 1x → 14x         peak counter sits at 14x doing nothing
   viewer sees the pump HAPPEN         viewer sees what happened AFTER
```

The validator in `scripts/make.mjs` enforces this and **rejects** configs where `livePump` peak < 1.5x. Override with `"allowConsolidation": true` only if you really mean it (rare).

---

## 🔥 GOLDEN RULE #2 — full-chart reference → full-story video

If the user shares a **wide-zoom chart** (dexscreener daily view, multi-hour timeframe with long flat history visible), the video MUST show that same long flat → acceleration → pre-pump → PUMP arc.

If the user shares a **tight-zoom chart** (last hour only, no flat history visible), use a shorter history.

| Chart zoom | `candleCount` | History shape |
|---|---|---|
| Dexscreener daily / multi-hour | **180–260** | Long flat at floor + ramp to launchpad |
| pump.fun last-hour view | **80–100** | Recent accumulation only |
| Mid-range (a few hours) | **120–160** | Some flat + clear build-up |

The engine's `MAX_CTX = 260` and `BASE_VIEW = 240`. Keep history within those budgets.

---

## 🎬 The user-facing workflow

The user gives you **5 things**:
1. A chart screenshot
2. Token name
3. Token ticker
4. Avatar image (in their Downloads folder)
5. Video duration in seconds (10–30 typical)
6. Optional: timeframe label (`1m`, `15s`, `5m` — defaults to `1m`)

You give back: a **finished MP4** with their token / chart / pump replicated 1:1.

### Step-by-step

1. **User copies the avatar** to `public/`:
   ```bash
   cp ~/Downloads/<filename>.jpg public/<ticker-lower>-avatar.jpg
   ```
   You can't reach `~/Downloads` directly — they have to do this themselves.

2. **You analyze the chart screenshot** and extract anchor points:
   - Identify the **pre-pump base** mcap (where the live candle should open)
   - Identify the **peak / ATH** the pump hit
   - Identify the **end / current** mcap (where the price settled, if applicable)
   - Note any mid-pump structure (pullbacks, retests, breakouts)

3. **You write `configs/<name>.json`** encoding the pattern (see schema below).

4. **User runs:**
   ```bash
   npm run make <name>           # uses config's language
   npm run make <name> en        # force English
   npm run make <name> zh        # force Chinese
   npm run make <name> all       # render both EN and ZH
   ```

5. **Output appears in `out/`** with the format `TICKER-lang-timestamp.mp4`.

---

## 📋 Config schema

Every config in `configs/<name>.json`:

```jsonc
{
  // ── Identity ──────────────────────────────────────────────────────
  "name": "Millions Must Go",       // Display name in header
  "ticker": "MMG",                  // Symbol in header
  "avatar": "mmg-avatar.jpg",       // Filename in public/

  // ── Video setup ───────────────────────────────────────────────────
  "duration": 15,                   // Seconds (10-30 typical)
  "timeframe": "1m",                // "1m" | "15s" | "5m"
  "language": "en",                 // "en" | "zh"

  // ── HISTORY (pre-pump context, the left side of the chart) ────────
  "history": {
    "launchMcap": 20000,            // Mcap at the leftmost candle
    "candleCount": 180,             // How many candles of history to draw
    // Pattern: anchor points (frac 0..1, mcap in USD).
    // The generator interpolates with smoothstep between anchors.
    // The LAST anchor's mcap is where the live god candle opens.
    "pattern": [
      { "frac": 0.00, "mcap": 20000 },   // launch
      { "frac": 0.60, "mcap": 24000 },   // long flat
      { "frac": 0.85, "mcap": 26000 },   // small build-up
      { "frac": 1.00, "mcap": 28000 }    // pre-pump launchpad (=live open)
    ]
  },

  // ── LIVE PUMP (THE MAIN EVENT — what happens during the clip) ─────
  // mult = multiplier on the live candle's starting mcap.
  // The validator REJECTS configs where peak mult < 1.5x.
  "livePump": {
    "anchors": [
      { "frac": 0.00, "mult": 1.00 },    // $28K — pre-pump
      { "frac": 0.10, "mult": 1.80 },    // initial pop
      { "frac": 0.20, "mult": 1.40 },    // small pullback
      { "frac": 0.35, "mult": 3.50 },    // first leg up
      { "frac": 0.50, "mult": 5.50 },    // continued
      { "frac": 0.65, "mult": 10.00 },   // accelerating
      { "frac": 0.80, "mult": 14.30 },   // PEAK ($400K)
      { "frac": 0.90, "mult": 11.00 },   // pullback
      { "frac": 1.00, "mult": 12.20 }    // settled close ($341K)
    ]
  },

  // ── Optional tuning ───────────────────────────────────────────────
  "poolLiquidity": 100000,           // Bigger = smoother chart (default 200K)
  "txRateBoost": 1.0,                // 1.0 = default tape speed, 1.15 = +15%
  "allowConsolidation": false        // Bypass pump-moment validation (rare)
}
```

### Validation rules (enforced by `scripts/make.mjs`)

The config is **REJECTED** if any of these fail (unless `allowConsolidation: true`):
- `livePump` peak `mult` ≥ **1.5x**
- `livePump` range (peak / low) ≥ **1.4x**
- If final `mult` < 1.3x, peak `mult` must still be ≥ 1.5x

This guarantees every video shows a real pump, not consolidation.

---

## 🔍 How to read a chart screenshot

When the user sends a chart, identify:

1. **Y-axis range** — what are the visible mcap values? (e.g. $0 → $440K)
2. **Pre-pump base** — where was the price BEFORE the pump? (the long flat at the bottom)
3. **Peak / ATH** — the highest point the pump reached (often a long wick)
4. **Current price** — where the price is NOW (usually shown as a pill on the right)
5. **Structure** — was the pump a straight rip or did it have pullbacks/retests?

### Encoding what you see

- Pre-pump base → `history.pattern[last].mcap` and `livePump.anchors[0].mult = 1.0`
- Peak → `livePump.anchors[*].mult` highest value × pre-pump base = peak mcap
- Current settled price → `livePump.anchors[last].mult`
- Mid-pump pullbacks → intermediate anchors that dip then recover

### Example: MMG chart (the most recent one)

Reference: chart shows $28K → $400K peak → settled $341K.

```json
"history.pattern[last].mcap": 28000,    // pre-pump base = $28K
"livePump.anchors[last].mult": 12.20,   // 12.2x × $28K = $341K (settled)
"livePump.anchors[peak].mult": 14.30,   // 14.3x × $28K = $400K (ATH)
```

---

## 🌐 Language support

The system supports `en` and `zh` (Chinese Simplified). All UI text is swapped at render time:

| English | Chinese |
|---|---|
| Peak | 峰值 |
| Trades | 交易 |
| Holders | 持有人 |
| All | 全部 |
| Top Trades | 热门交易 |
| Age | 时间 |
| USD | 美元 |
| Market Cap | 市值 |
| Trader | 交易者 |
| MCap / Price | 市值 / 价格 |
| Buy | 买入 |
| Search | 搜索 |
| 1h | 1小时 |
| 1m | 1分钟 |
| now / 1s | 刚刚 / 1秒 |

Adding more languages: extend `UI_STRINGS` in `scripts/make.mjs`.

---

## 🛠 Commands cheat sheet

```bash
# Setup (one-time)
npm install

# Make a video
npm run make <config-name>            # render in config's language
npm run make <config-name> en         # force English
npm run make <config-name> zh         # force Chinese
npm run make <config-name> all        # render both languages

# Studio preview (port 3333)
npm run studio

# Lint check
npm run lint
```

Output filename format: `out/{TICKER}-{lang}-{YYYYMMDD-HHMMSS}.mp4`

---

## 🎯 Quality checklist before delivering a video

- [ ] Did the live candle actually pump during the clip? (Not chop)
- [ ] Does the Peak counter tick up dramatically during the clip?
- [ ] Does the displayed mcap match the chart's settled price by the end?
- [ ] Is the history showing the same zoom-level as the reference?
- [ ] Is the avatar visible in the header?
- [ ] Does the language (en/zh) match what the user asked for?

---

## 📁 File map

```
configs/
  _schema.md                    Full schema with examples
  <name>.json                   One config per video
public/
  tv-logo.png                   TradingView watermark (don't touch)
  <ticker>-avatar.jpg|png       Per-token avatar
scripts/
  make.mjs                      Main pipeline: config → data → render
  render.mjs                    Lower-level: render w/ unique filename
  gen-alexcoin.mjs              Legacy generator (not used by `make`)
src/pumpfun-screen/
  PumpFunScreen.tsx             Root composition
  Header.tsx, CandleChart.tsx,
  TradeTape.tsx, BottomBar.tsx  UI regions (text patched by make.mjs)
  engine.ts                     Timeline / candle logic (don't edit casually)
  pricePath.ts                  Tick interpolation
  camera.ts                     Subtle human-hand camera movement
  theme.ts                      Colors, fonts, frame size
  data/active.json              Generated by make.mjs each run
out/                            Rendered MP4s land here
remotion.md                     Canonical AI rules (read by Claude/Cursor)
HANDOFF.md                      ← you're reading this
MAKE-VIDEOS.md                  User quickstart
```

---

## 💬 The one-prompt brief (paste this when handing off to anyone)

> **Pump video engine — what you need to know**
>
> Repo: `vibe-twitter-video-engine` (a Remotion project). Read `HANDOFF.md` first.
>
> **What you do**: when I send a chart screenshot + token info, you write a `configs/<name>.json` and I run `npm run make <name>` to get an MP4.
>
> **Golden rules** (non-negotiable, validator enforces):
> 1. The video must show the **pump moment**, not the aftermath. `livePump.anchors` must end with `mult ≥ 1.5x`. If the chart shows $28K → $400K → settled at $341K, the live candle should rip $28K → $400K → $341K during the clip.
> 2. If the chart is **wide-zoom** (shows hours of history), use `candleCount: 180-260` with a long flat at the launch floor. If it's **tight-zoom**, use 80-100 candles.
>
> **My inputs per video**: chart screenshot, name, ticker, avatar (I copy to `public/<ticker>-avatar.jpg`), duration in seconds, language (en/zh), optional timeframe.
>
> **Your outputs**: one `configs/<name>.json` file + a confirmation. I run `npm run make <name>` (or `<name> all` for both languages) and get `out/{TICKER}-{lang}-{timestamp}.mp4`.
>
> Existing configs in `configs/` are good references. The most recent is `mmg.json`.
