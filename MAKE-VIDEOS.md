# Making videos — automated workflow

One command turns a config file into a finished MP4. Pipeline:
```
configs/<name>.json  →  npm run make <name>  →  out/TICKER-timestamp.mp4
```

## 🔥 Core principle (read this first)

**The video must capture the MOMENT OF THE PUMP** — pretending we hit RECORD
exactly when the price ripped. NOT the current settled aftermath.

If the chart shows a $1M → $4M pump that now sits at $3.5M, the clip must
show the live god candle ripping $1M → $4M. The system will **reject** any
config that looks like consolidation. Full rules in `configs/_schema.md`.

## How to make a new video

### 1. Drop the avatar into `public/`
```
cp ~/Downloads/your-logo.png public/your-logo.png
```

### 2. Give me:
- **Screenshot** of the chart you want to replicate
- **Token name** (display name in header)
- **Ticker** (symbol, e.g. `TRILLION`)
- **Avatar filename** (the one you just copied)
- **Video duration** in seconds (e.g. 20)
- **Timeframe** to display (e.g. `1m`, `15s`)
- **Language** (`en` or `zh`)

### 3. I'll create `configs/<name>.json`
Reading the screenshot, I'll extract the pump pattern (where it goes up,
where it dumps, where it recovers, etc.) and encode it as anchor points.

### 4. You run:
```
npm run make <name>
```
Output: `out/TICKER-YYYYMMDD-HHMMSS.mp4`

## What the config controls

Everything visible in the video:
- Token name, ticker, avatar (header)
- Y-axis range (auto-fits from `launchMcap` + pattern)
- The historical candle pattern (left side of chart)
- The live god candle's pump shape (right side)
- Video duration, timeframe label, language
- Pool liquidity (affects tick smoothness)
- Tx rate boost (more or fewer transactions)

## Example workflow

**User**: *"Make a 25-second video, ticker MOONCOIN, name 'Moon Coin',
avatar mooncoin.png, English, 15s timeframe — replicate this chart"*
*[attaches screenshot]*

**Me**: I create `configs/mooncoin.json` with the chart pattern
encoded from the screenshot.

**User**: `npm run make mooncoin`

**System**: `✅ Done → out/MOONCOIN-20251215-143022.mp4`

## See it in action

The trillion config we just made:
```
npm run make trillion
```
Output: `out/TRILLION-<timestamp>.mp4` — 20s, 1分钟 (Chinese), $50K → $400K pump
