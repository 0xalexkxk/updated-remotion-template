# vibe-twitter-video-engine — AI rules

Canonical instruction file for Claude Code, Cursor, Codex, and any other agent working this repo. One Remotion composition turns one real token into one pump-screen video. Read this before writing code.

`remotion` + `@remotion/cli` + `@remotion/google-fonts` all pinned at **4.0.438** — keep them in lockstep. React **19.2.3**, TypeScript **5.9.3**. The only build gate is `npm run lint` (`tsc`). Run it before claiming a change works.

## What this produces

One composition: **`PumpFunScreen`** — a pixel-clone of the pump.fun / Axiom mobile token screen, replaying a real coin's parabolic run-up. **1080×1920 portrait, 60fps.** Real OHLC backbone, synthetic live-edge motion, a hand-held parasite camera. The whole thing is data-driven: drop a token in, get a video out.

This engine renders one continuous live screen, not a cut sequence. There is no second composition. If you reach for captions, voiceover, or scene transitions, you are probably solving the wrong problem.

## Replicating a reference — compare, never describe from memory

When the job is to reproduce a reference video (not invent a look), the work is **a comparison loop**, not build-and-hope. Put the reference and your output next to each other and look at the difference. Your eye finds the real gap; your memory invents a false one.

The loop:

1. **Side by side, same moment.** Open the reference and Studio at the *same timestamp*. Screenshot both, lay them next to each other — reference left, Remotion right. This is the method, not a nicety. Never judge the output alone.
2. **Crop tight.** Screenshot the *one element* you are checking, not the whole frame. A few-pixel offset or a half-shade-off colour is invisible at full size and obvious in a tight crop. One element per comparison.
3. **Read previous → now.** A static match isn't enough; the frame *moves*. Grab the frame before and after a change and ask how it got from one to the other — did it tick or slide, grow or snap, ease or cut. You are matching the *transition*, not just the pose. Studio's frame stepping (`←`/`→`) is how you see it.
4. **Name the gap precisely.** "Not the same here" is not actionable. Say which **element** and which **property** — position, colour, size, timing, or easing. Pick the axis the gap lives on.
5. **Fix one, re-shoot, repeat.** Change that one property, screenshot the same crop at the same timestamp, confirm it closed, then the next gap.

## Decompose the screen — each element is independent

A screen is a stack of independent regions. They rarely share state and rarely animate together, so treat each as its own problem. When a comparison fails, the gap belongs to *one* element — fix that piece and leave the rest alone. Don't chase a header gap by touching the chart.

- **Split before you build.** List the regions, build and match them one at a time. A screen that is right region-by-region is right as a whole; a screen fixed all-at-once is never right anywhere.
- **Separate the look from the data.** A visual gap is either *wrong values* feeding the element or *wrong rendering* of correct values. Decide which before editing — the screenshot tells you the look is off; the underlying value tells you whether the number behind it is off.

In this repo the regions are the separate components under `src/pumpfun-screen/`, each reading its values off the per-frame `FrameView` from `buildTimeline` (see the engine model below) — so "wrong values vs wrong rendering" is literally `FrameView` vs component.

## Registering the composition

`src/Root.tsx` renders a single `<Composition>` reading fields off `pumpFunScreenMeta`, which is exported next to its component in `PumpFunScreen.tsx`:

```ts
export const pumpFunScreenMeta = {
  id: "PumpFunScreen",
  component: PumpFunScreen,
  durationInFrames: DURATION, // = WINDOW_SEC * FPS, from playbackWindow(data, FPS)
  fps: FPS,                   // 60
  width: W,                   // 1080
  height: H,                  // 1920
};
```

- **Duration is derived, not chosen.** `DURATION` comes from `playbackWindow(data, FPS)` so the clip is genuine real-time (1 video-second = 1 real-second). Don't hardcode a frame count.
- **One source of truth.** A composition = its `*Meta` + the `<Composition>` in `Root.tsx`. If you add a variant, export a new `Meta`, import it, render another `<Composition>`. Delete both when removing one.

## Studio & render

- Studio on **port 3333**: `npm run studio` → `http://localhost:3333/PumpFunScreen`. Prefer Studio for preview.
- Render only when asked: `npm run render` → `out/PumpFunScreen.mp4` (`remotion.config.ts` sets jpeg frames + overwrite).
- Pull a token: `npm run fetch <pool-or-symbol>` (no arg = auto-pick the spiciest trending pump).

## Where files live

| Path | What |
|---|---|
| `src/pumpfun-screen/` | the whole composition — components, engine, theme |
| `src/pumpfun-screen/data/active.json` | the token the composition renders (imported directly) |
| `src/pumpfun-screen/data/<ticker>.json` | per-token snapshots `fetch` writes alongside `active.json` |
| `public/pumpfun/<ticker>-avatar.png` | token images — mount via `staticFile()`, never a remote URL |
| `scripts/pumpfun/fetch.mjs` | the GeckoTerminal data pipeline |

`PumpFunScreen.tsx` imports `data/active.json` statically, so a fresh `fetch` shows up in Studio with zero code edits.

## The data pipeline (`scripts/pumpfun/fetch.mjs`)

Hits **GeckoTerminal** (`api.geckoterminal.com`, no key, ~30 req/min — it paces itself and backs off on 429):

1. **Resolve** the argument (Solana pool address, token mint, or symbol/name) to a pool; deepest liquidity wins.
2. **OHLC candles** — up to 1000 minute candles, enough to contain the whole run-up.
3. **Trade tape** — recent per-trade price/size/side, priced in USD off the base mint.
4. **Pump window** — the largest clean run-up (max `price[j]/price[i]` over a running minimum) becomes the parabola.
5. **Avatar** — downloaded to `public/pumpfun/<ticker>-avatar.png`.

**Known constraint, state it out loud:** GeckoTerminal returns only ~300 recent trades. So the tape is *real-recent* (last few hundred prints), while the parabola shape is *fully real* (from OHLC that reaches back far enough). Real shape, real-recent tape — don't claim the tape is the full pump.

**Jargon:** *pool* = a DEX liquidity pair. *mint* = the token's on-chain address. *OHLC* = open/high/low/close candle. *base token* = the memecoin, vs the SOL/USDC it trades against.

## The engine model (`engine.ts`)

`buildTimeline(data, {totalFrames, fps})` returns one `FrameView` per frame; `PumpFunScreen` just indexes it by `useCurrentFrame()`. The model is **true real-time, tick-by-tick, across a single candle boundary**:

- It picks the **"god minute"** — the 60s bucket with the largest intra-minute move — and plays a `WINDOW_SEC` (24s) window around its open, arriving `PREV_TAIL_SEC` (5s) before the boundary.
- The previous candle ticks out and **closes** on the boundary; the god candle then **opens and forms tick-by-tick** for the rest of the clip. Exactly one boundary animates; the settled run-up sits to the left as real context.
- Within-candle motion is the **real tick staircase** replayed by `pricePath.ts` — never a synthetic random walk. The only synthetic motion is the live-edge breathing chop.
- `camera.ts` is a **steady hand**: mostly still (micro-drift only), with one or two deliberate ease-in-out gestures (~35% and ~70% of the timeline) that land with no overshoot. Don't make it fidgety.
- `FrameView` carries everything the components draw — mcap, multiple, dynamic peak, candles, tape, pulses. Add a field there, populate it in `buildTimeline`, read it in the component.

## Style & theme (`theme.ts`)

- **One typeface — Inter** via `@remotion/google-fonts/Inter`, loaded with `loadFont`. The composition gates first render on `FONT_READY()` through `delayRender`/`continueRender`. If you add a font, gate render the same way or text reflows on frame 1.
- **Palette lives in `C`** (Axiom token-screen match): mint green `#2fe3a6`, TradingView red `#f0334a`, purple Peak `#c04dff`, near-black `#07080a` ground. Pull colours from `C`, never inline a hex.
- **Numbers use tabular figures** — add `fontVariantNumeric: "tabular-nums"` wherever digits must align (mcap, prices, tape rows). Money that jitters column-width looks fake.
- **Frame is `W`×`H`×`FPS`** (1080×1920×60) — import them, don't retype literals.

## House rules

- **Real data, real motion.** The backbone is real OHLC; keep it real. Synthetic motion is allowed only at the live edge and in the camera — never fabricate the parabola.
- **Assets through `staticFile()`.** Everything the composition renders lives in `public/` and loads via `staticFile()`. Never render against a CDN or `api.geckoterminal.com` URL — `fetch` localizes the avatar for exactly this reason.
- **Animate with `useCurrentFrame()` + `interpolate()`/`spring()`.** No `Date.now()`, no real wall-clock, no `Math.random()` at render time — renders must be deterministic frame-for-frame.
- **`useMemo` the timeline.** `buildTimeline` runs once (`useMemo(..., [])`); per-frame work is just an array index. Keep it that way.
- **Commit as you go.** Granular commits, one logical change each. Run `npm run lint` first.

## Remotion domain knowledge

For Remotion APIs you don't already know — interpolation curves, springs, fonts, charts, sequencing, measuring text, `calculateMetadata`, transitions — load the **`remotion-best-practices`** skill at [`.agents/skills/remotion-best-practices/SKILL.md`](.agents/skills/remotion-best-practices/SKILL.md). It carries a rule file per topic with worked examples. Read the specific rule file before inventing a pattern.
