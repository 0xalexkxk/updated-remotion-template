import { buildCamera } from "./camera";
import { buildPricePath } from "./pricePath";
import type {
  Candle,
  ChartData,
  EngineConfig,
  FrameView,
  TapeRow,
  ViewCandle,
} from "./types";

/* ------------------------------------------------------------------ *
 * TRUE REAL-TIME, 1-minute-candle, tick-by-tick model. 1 video-second = 1
 * real-second, over a SINGLE candle boundary.
 *
 * We pick the "god minute" — the one 60s bucket with the largest intra-minute
 * move — and play a short window around its open. We arrive PREV_TAIL_SEC
 * before that minute boundary, watch the previous 1-minute candle tick out its
 * last few seconds and CLOSE on the boundary, then watch the GOD candle open at
 * that close and form tick-by-tick for the rest of the clip (it is still open
 * at clip end — that's fine). The run-up so far sits to the left as settled
 * real context. Exactly ONE candle boundary occurs in-window; no other candle
 * animates.
 *
 * Playback is genuine real-time: DURATION = WINDOW_SEC * FPS, and
 * realT(f) = T0 + (f/(DURATION-1)) * WINDOW_SEC, so one real second elapses per
 * FPS frames. Within-candle motion is the REAL tick staircase replayed by
 * buildPricePath over the window — never a synthetic random walk.
 * ------------------------------------------------------------------ */

export const PREV_TAIL_SEC = 5;
export const WINDOW_SEC = 24;

/** The "god minute": bucket ticks by floor(t/60); among buckets with at least
 *  ~2 ticks, pick the one with the largest intra-minute move (max/min, with
 *  last/first as a tiebreak fallback). Returns gMin = bucketKey * 60. */
export function godMinute(data: ChartData): number {
  const buckets = new Map<number, number[]>();
  for (const tk of data.ticks) {
    const k = Math.floor(tk.t / 60);
    const arr = buckets.get(k);
    if (arr) arr.push(tk.price);
    else buckets.set(k, [tk.price]);
  }
  let bestKey: number | null = null;
  let bestMove = -Infinity;
  for (const [k, prices] of buckets) {
    if (prices.length < 2) continue;
    const mn = Math.min(...prices);
    const mx = Math.max(...prices);
    const move = mn > 0 ? mx / mn : Math.abs(prices[prices.length - 1] / prices[0]);
    if (move > bestMove) {
      bestMove = move;
      bestKey = k;
    }
  }
  // Fallback: no multi-tick bucket → derive from the pump window start.
  if (bestKey === null) {
    return Math.floor(data.pumpWindow.startT / 60) * 60;
  }
  return bestKey * 60;
}

/** True real-time playback window + clip length. The clip is WINDOW_SEC real
 *  seconds: PREV_TAIL_SEC of the previous candle's tail, then the god candle
 *  opening on the boundary and forming for the rest. DURATION = WINDOW_SEC * FPS
 *  so 1 video-second = 1 real-second exactly. Exported so PumpFunScreen sets the
 *  composition duration to match. */
export function playbackWindow(data: ChartData, fps: number) {
  const gMin = godMinute(data);
  const T0 = gMin - PREV_TAIL_SEC;
  const T1 = T0 + WINDOW_SEC;
  const videoSeconds = WINDOW_SEC;
  const DURATION = Math.max(1, Math.round(WINDOW_SEC * fps));
  return { T0, T1, gMin, videoSeconds, DURATION };
}

/* ---- nice ladder ---------------------------------------------------- */
function niceStep(range: number): number {
  const raw = range / 6;
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(1, raw))));
  const n = raw / mag;
  const step = n >= 5 ? 5 : n >= 2.5 ? 2.5 : n >= 2 ? 2 : n >= 1 ? 1 : 0.5;
  return step * mag;
}
function buildLadder(min: number, max: number): number[] {
  const step = niceStep(max - min);
  if (!Number.isFinite(step) || step <= 0) return [];
  const first = Math.ceil(min / step) * step;
  const out: number[] = [];
  for (let v = first; v <= max + step * 0.001; v += step) out.push(v);
  return out;
}

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
/* A 32-bit avalanche (xmxmx) so consecutive ids give uncorrelated seeds — keeps
 *  the trader handles from trending (a real tape's first chars look random). */
function hashSeed(n: number): number {
  let h = n >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}
function fakeTrader(rng: () => number): string {
  const ch = () => B58[Math.floor(rng() * B58.length)];
  return `${ch()}${ch()}${ch()}${ch()}…${ch()}${ch()}${ch()}${ch()}`;
}

/* A realistic Axiom fill size: mostly small, log-uniform within a tier.
 *  ~70% $4–$200, ~22% $200–$1500, ~8% $1500–$6000. */
function fillUsd(rng: () => number): number {
  const r = rng();
  const [lo, hi] = r < 0.7 ? [4, 200] : r < 0.92 ? [200, 1500] : [1500, 6000];
  const v = Math.exp(Math.log(lo) + rng() * (Math.log(hi) - Math.log(lo)));
  return v < 100 ? Math.round(v * 100) / 100 : Math.round(v);
}

/* Kept for any external import; the real timeline no longer uses it. The
 * "parabola" is now simply the pump window the data already isolated. */
export function chooseParabola(candles: Candle[]): {
  startIdx: number;
  peakIdx: number;
  endIdx: number;
} {
  let peakIdx = 0;
  for (let i = 1; i < candles.length; i++)
    if (candles[i].h > candles[peakIdx].h) peakIdx = i;
  return {
    startIdx: Math.max(0, peakIdx - 40),
    peakIdx,
    endIdx: candles.length - 1,
  };
}

/* A live 1-minute candle slot: OHLC in TOKEN price (USD), settled or forming.
 * minute = floor(realT/60) of the bucket it represents. slot is its integer
 * column (continues the context slots to the right). */
interface MinuteSlot {
  minute: number;
  slot: number;
  o: number;
  h: number;
  l: number;
  c: number;
  settled: boolean;
}

/* ------------------------------------------------------------------ */
export function buildTimeline(data: ChartData, cfg: EngineConfig): FrameView[] {
  const { candles, ticks } = data;
  const mp = data.token.mcapPerPrice || 1;
  const { totalFrames, fps } = cfg;

  const { T0, T1 } = playbackWindow(data, fps);
  const { basePrice } = data.pumpWindow;
  const minStart = Math.floor(T0 / 60); // minute bucket of the first live frame

  // ---- Window-local price bounds for the replay. basePrice = the real price
  // at/just before T0 (the level the previous candle hands off from); peakPrice
  // = the max real tick price inside [T0, T1]. Only the window's ticks drive the
  // live series. Falls back to the pump's base when the window has no ticks
  // (sparse data) — pricePath then widens to all ticks on its own.
  const sortedTicks = [...ticks].sort((a, b) => a.t - b.t);
  let winBase = basePrice;
  for (const tk of sortedTicks) {
    if (tk.t <= T0) winBase = tk.price;
    else break;
  }
  const inWin = sortedTicks.filter((tk) => tk.t >= T0 && tk.t <= T1);
  const winPeak = inWin.length
    ? Math.max(...inWin.map((tk) => tk.price))
    : Math.max(winBase, basePrice);

  // ---- Live price series: REAL ticks replayed tick-by-tick over [T0, T1].
  // Passing startT=T0 includes the previous-candle tail before the boundary.
  const live = buildPricePath(ticks, data.pool, {
    totalFrames,
    fps,
    pumpWindow: { startT: T0, endT: T1, basePrice: winBase, peakPrice: winPeak },
  });

  // ---- Static context = real candles whose minute is BEFORE the live region.
  // They render settled, packed one-per-slot to the left of the live area
  // (their irregular real spacing collapses into uniform history columns —
  // Axiom packs recent candles the same way). We keep the most recent ~46.
  const ctxAll = candles.filter((c) => Math.floor(c.t / 60) < minStart);
  const MAX_CTX = 160;
  const ctx = ctxAll.slice(Math.max(0, ctxAll.length - MAX_CTX));
  const ctxCount = ctx.length;
  // The launch base for the multiples: foot of the run we can see. Prefer the
  // pump's own base; fall back to the oldest context low.
  const launchPrice =
    basePrice > 0 ? basePrice : ctx.length ? ctx[0].l : live[0].price;
  const launchMcap = launchPrice * mp;

  // Seed the running peak from settled context + any ticks before T0, so the
  // Peak counter starts at the real ATH up to this point rather than 1.0x.
  const ctxPeak = ctx.length ? Math.max(...ctx.map((c) => c.h)) : launchPrice;
  const preT0Peak = sortedTicks.reduce(
    (m, tk) => (tk.t <= T0 ? Math.max(m, tk.price) : m),
    ctxPeak,
  );

  // Context candles occupy slots [0 .. ctxCount-1]; live minute buckets
  // continue from ctxCount. A bucket's slot = ctxCount + (minute - minStart).
  const slotOfMinute = (minute: number) => ctxCount + (minute - minStart);

  // The previous-candle close hands off to the god candle's open. We seed the
  // first live bucket's open from the last context close so the chart reads
  // as one continuous tape (prev close → next open).
  const firstOpen = ctx.length ? ctx[ctx.length - 1].c : live[0].price;

  // ---- Pre-roll the minute buckets across the whole clip so we can lock the
  // OHLC of each finished bucket and know the running peak. One forward pass.
  const realTOf = (f: number) =>
    T0 + (totalFrames <= 1 ? 0 : (f / (totalFrames - 1)) * (T1 - T0));

  const buckets = new Map<number, MinuteSlot>();
  let prevClose = firstOpen;
  // Per-frame: which minute is forming, the running ATH (token price), and a
  // snapshot of the forming bucket's OHLC AS OF that frame (so the god candle's
  // high grows tick-by-tick on screen).
  const formingMinuteAt: number[] = new Array(totalFrames);
  const formingOHLCAt: { o: number; h: number; l: number; c: number }[] =
    new Array(totalFrames);
  let runPeakPrice = preT0Peak; // start from real ATH up to T0
  const runPeakAt: number[] = new Array(totalFrames);

  for (let f = 0; f < totalFrames; f++) {
    const realT = realTOf(f);
    const minute = Math.floor(realT / 60);
    formingMinuteAt[f] = minute;

    let b = buckets.get(minute);
    if (!b) {
      // A new minute opens at the previous bucket's close (continuous tape).
      const o = prevClose;
      b = {
        minute,
        slot: slotOfMinute(minute),
        o,
        h: o,
        l: o,
        c: o,
        settled: false,
      };
      buckets.set(minute, b);
    }
    const price = live[f].price;
    b.c = price;
    if (price > b.h) b.h = price;
    if (price < b.l) b.l = price;
    prevClose = price;
    formingOHLCAt[f] = { o: b.o, h: b.h, l: b.l, c: b.c };

    runPeakPrice = Math.max(runPeakPrice, b.h);
    runPeakAt[f] = runPeakPrice;
  }
  // Lock every bucket except the one that is still forming on the final frame.
  const lastForming = formingMinuteAt[totalFrames - 1];
  for (const b of buckets.values()) if (b.minute !== lastForming) b.settled = true;

  // ---- Camera: same 4-gesture thumb as before, applied as a deviation from
  // the auto-fit framing (zoom multiplies the fit view, pan scrolls it).
  const camera = buildCamera({ totalFrames, fps });
  const RIGHT_GAP = 5; // empty slots kept to the right of the live edge
  const BASE_GOD_X = 5; // resting offset of the live edge from the right edge

  // Eased autoscale state (token-price units → mcap via mp at emit time).
  // Start from a generous range that includes the launch flat at the bottom
  // and leaves headroom above the live edge, so the chart shows the whole
  // history from frame 1 rather than starting pre-zoomed on the live edge.
  let dispMin = 0;
  const initMax = (ctx.length ? Math.max(...ctx.map((c) => c.h)) : live[0].price) * mp;
  let dispMax = initMax * 1.6; // 60% headroom above current top for the pump

  let holders = 1400;
  let prevPrice = live[0].price;
  let prevPriceVelocity = 0; // tracks rising streak for burst logic

  // Smoothed mcap for the HEADER display — eases toward the live mcap so the
  // big number doesn't whip on every micro-tick. Real apps throttle the UI.
  let smoothMcap = live[0].price * mp;
  const MCAP_SMOOTH = 0.018; // EMA toward live, but only sampled every TICK_FRAMES
  // Display sample/hold — header & price pill only update every TICK_FRAMES
  // (0.4s at 60fps), so the number ticks like a real tape instead of flickering.
  const TICK_FRAMES = 24;
  let heldMcap = live[0].price * mp;
  let heldUp = true; // green/red direction sampled at the same cadence
  let prevSampleMcap = heldMcap; // previous sampled value → drives heldUp

  // ---- Credible synthetic tape. The real ticks are too sparse/old on quiet
  // tokens to read as a live pump (ages of 60–240s look dead), so we synthesise
  // a fast fresh tape calibrated to a real Axiom pump and ride the engine's REAL
  // live mcap. Deterministic: one seeded LCG advanced across the forward pass.
  // A fill arrives every ~0.5–1.2s of real time; ~75% buys while price rises;
  // amounts are log-skewed mostly small ($4–$200) with the odd bigger fill.
  interface SynthFill {
    realT: number;
    kind: "buy" | "sell";
    usd: number;
    mcap: number;
    n: number; // monotonic id → stable key + per-fill trader seed
  }
  const tapeRng = lcg(0x7a9e); // single stream for cadence/kind/amount
  const synthFills: SynthFill[] = [];
  let fillCount = 0;
  // Seed the gap to the first fill so row 0 isn't pinned to t=0.
  let nextFillRealT = T0 + 0.5 + tapeRng() * 0.7;
  // Pulse trackers — carried across the single forward pass. The mcap pulse
  // fires when a new fill prints; the peak pulse fires when the displayed Peak
  // value rounds up to a new high. Both decay 0.80/frame.
  let prevPeakDisp = -1;
  let mcapPulse = 0;
  let peakPulse = 0;

  // Pre-seed 6 tape rows so the tape isn't empty at frame 0. Ages will read
  // as 7s…2s back from T0, giving the viewer an already-live feed feeling.
  for (let i = 5; i >= 0; i--) {
    const r = tapeRng();
    const kind: "buy" | "sell" = r < 0.72 ? "buy" : "sell";
    synthFills.push({
      realT: T0 - i * 1.4 - 0.6,
      kind,
      usd: fillUsd(tapeRng),
      mcap: winBase * mp * (1 + (tapeRng() - 0.5) * 0.03),
      n: fillCount++,
    });
  }
  // Reset the next-fill clock to the real clip start.
  nextFillRealT = T0 + 0.3 + tapeRng() * 0.5;

  const frames: FrameView[] = [];

  for (let f = 0; f < totalFrames; f++) {
    const realT = realTOf(f);
    const price = live[f].price;
    const liveMcap = price * mp;
    // EMA toward live → header digits change ~3x slower than the raw price.
    smoothMcap += (liveMcap - smoothMcap) * MCAP_SMOOTH;
    // Sample/hold every TICK_FRAMES (0.4s): the displayed number freezes
    // between sample points, then snaps to the new value. Color flips only on
    // the sample boundary (comparing this sample vs the previous one).
    if (f % TICK_FRAMES === 0) {
      heldUp = smoothMcap >= prevSampleMcap;
      prevSampleMcap = heldMcap; // before reassigning
      heldMcap = smoothMcap;
    }
    const formingMinute = formingMinuteAt[f];
    const formingSlot = slotOfMinute(formingMinute);

    const tickUp = price >= prevPrice;
    // Velocity streak: rises +1 when price is up, resets to 0 when down.
    prevPriceVelocity = tickUp ? prevPriceVelocity + 1 : 0;
    prevPrice = price;

    // Peak = running ATH (mcap) / launch. Ticks up as the god candle prints new
    // highs; ends at the real peak.
    const peakMultiple = (runPeakAt[f] * mp) / launchMcap;
    // ~3.5 holders/sec, matches reference (1,567 → 1,630 over 18s).
    holders += (f % 17) === 0 ? 1 : 0;

    // Peak pulse: the on-screen Peak shows peakMultiple.toFixed(1), so a "new
    // high prints" exactly when its rounded-to-one-decimal value increases.
    const peakDisp = Math.round(peakMultiple * 10);
    if (peakDisp > prevPeakDisp) {
      if (prevPeakDisp !== -1) peakPulse = 1.0;
      prevPeakDisp = peakDisp;
    } else {
      peakPulse *= 0.92; // slower decay → glow lingers ~1.5s visible
    }

    // ---- Framing. The fit view spans [first context slot .. live edge] plus a
    // small right gap; the camera deviates from it.
    const cam = camera[f];
    // Show a lot of context — the flat history on the left needs to be visible.
    // Camera zoom < 1 zooms IN (fewer candles, focus on live edge),
    //              > 1 zooms OUT (more history visible).
    const BASE_VIEW = 145;
    const viewCount = Math.max(35, Math.min(200, Math.round(BASE_VIEW * cam.zoom)));
    const godX = Math.max(
      2,
      Math.min(Math.max(2, viewCount - 4), BASE_GOD_X + cam.pan),
    );
    // x is candle-units from the RIGHT edge. The live edge sits at godX.
    const viewRight = formingSlot + godX;

    // ---- Assemble visible candles. Context (settled, real OHLC) then live
    // buckets (settled or the forming one with running OHLC up to this frame).
    const viewCandles: ViewCandle[] = [];
    let tMin = Infinity;
    let tMax = -Infinity;
    let liveX: number | null = null;

    const pushView = (
      slot: number,
      o: number,
      h: number,
      l: number,
      c: number,
      forming: boolean,
    ) => {
      const x = viewRight - slot;
      if (x < -1 || x > viewCount + 1) return;
      viewCandles.push({
        o: o * mp,
        h: h * mp,
        l: l * mp,
        c: c * mp,
        x,
        forming,
      });
      tMin = Math.min(tMin, l * mp);
      tMax = Math.max(tMax, h * mp);
      if (forming) liveX = x;
    };

    // Context candles — packed one per slot, real OHLC.
    for (let i = 0; i < ctxCount; i++) {
      const x = viewRight - i;
      if (x < -1 || x > viewCount + 1) continue;
      const c = ctx[i];
      pushView(i, c.o, c.h, c.l, c.c, false);
    }
    // Live minute buckets, oldest → the forming one. Reconstruct each bucket's
    // OHLC as of THIS frame (the forming bucket's high grows as it pumps).
    for (let m = minStart; m <= formingMinute; m++) {
      const b = buckets.get(m);
      if (!b) continue;
      const forming = m === formingMinute;
      if (forming) {
        // Running OHLC of the forming minute as of THIS frame (snapshotted in
        // the pre-roll pass) — the god candle's high grows as it pumps.
        const s = formingOHLCAt[f];
        pushView(b.slot, s.o, s.h, s.l, s.c, true);
      } else {
        pushView(b.slot, b.o, b.h, b.l, b.c, false);
      }
    }
    if (!Number.isFinite(tMin)) {
      tMin = liveMcap;
      tMax = liveMcap;
    }

    // ---- Autoscale: ease toward padded bounds of visible candles (incl. the
    // forming god candle, whose growing high pushes the top up).
    const pad = (tMax - tMin) * 0.14 + tMax * 0.001;
    const targetMax = tMax + pad;
    const targetMin = Math.max(0, tMin - pad * 1.4);
    // Slow easing — chart Y-axis settles smoothly instead of whipping.
    dispMax += (targetMax - dispMax) * 0.035;
    dispMin += (targetMin - dispMin) * 0.035;

    // ---- Tape: a fast, fresh, credible pump tape riding the REAL live mcap.
    // Emit every synthetic fill whose scheduled time has now elapsed (usually
    // 0 or 1 per frame, since gaps are ~0.5–1.2s and a frame is ~1/fps s).
    // Each fill snapshots the live mcap at its emit time (so the Market Cap
    // column tracks the pump) with ±1% jitter, picks a buy/sell biased by the
    // live tick direction, and a log-skewed mostly-small USD amount.
    let printedThisFrame = false;
    while (nextFillRealT <= realT) {
      const r = tapeRng();
      // ~75% buys when price is rising, ~55% when falling.
      const buyProb = tickUp ? 0.75 : 0.55;
      const kind: "buy" | "sell" = r < buyProb ? "buy" : "sell";
      const jitter = 1 + (tapeRng() - 0.5) * 0.02; // ±1%
      synthFills.unshift({
        realT: nextFillRealT,
        kind,
        usd: fillUsd(tapeRng),
        mcap: liveMcap * jitter,
        n: fillCount++,
      });
      if (synthFills.length > 8) synthFills.length = 8; // keep last ~8
      printedThisFrame = true;
      // Interval scales with price velocity — a real pump has a HOT tape.
      // ripping hard: 0.05–0.18s (~8–10 fills/sec)
      // rising:       0.15–0.40s (~3–5 fills/sec)
      // chop/sell:    0.30–0.70s (~1.5–3 fills/sec)
      const ripping = prevPriceVelocity > fps * 0.4;
      const interval = ripping
        ? 0.05 + tapeRng() * 0.13
        : tickUp
          ? 0.15 + tapeRng() * 0.25
          : 0.3 + tapeRng() * 0.4;
      nextFillRealT += interval;
    }
    // Mcap pulse: a new fill this frame == a trade printed → spike, else decay.
    if (printedThisFrame) {
      if (fillCount > 1) mcapPulse = 1;
    } else {
      mcapPulse *= 0.8;
    }
    // Newest-first; ageSec measured from emit time so the top reads "now".
    const tape: TapeRow[] = synthFills.map((fl) => ({
      key: `tp${fl.n}`,
      kind: fl.kind,
      usd: fl.usd,
      mcap: fl.mcap,
      trader: fakeTrader(lcg(hashSeed(fl.n + 1))),
      ageSec: Math.max(0, Math.round(realT - fl.realT)),
    }));

    // ---- Axis time labels (real wall-clock from realT at three x positions).
    const xToTime = (vx: number) => {
      const slot = viewRight - vx;
      // Seconds-per-slot ≈ 60 in the live region; for context slots we walk
      // back from realT by whole minutes so labels read as a minute grid.
      const minutesBack = formingSlot - slot;
      const t = realT - minutesBack * 60;
      const d = new Date(t * 1000);
      return `${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes(),
      ).padStart(2, "0")}`;
    };
    const axisTimes = [0.16, 0.5, 0.84].map((r) => ({
      label: xToTime(r * viewCount),
      vx: r * viewCount,
    }));

    frames.push({
      mcap: heldMcap,
      multiple: heldMcap / launchMcap,
      peakMultiple,
      holders,
      scaleMin: dispMin,
      scaleMax: dispMax,
      ladder: buildLadder(dispMin, dispMax),
      candles: viewCandles,
      viewCount,
      // Sample/held value for the price pill + dashed line — only ticks every
      // TICK_FRAMES (0.4s). Candles themselves still use real OHLC for shape.
      liveMcap: heldMcap,
      liveUp: heldUp,
      liveX,
      // Entry marker — anchor to ~92% from the right edge so it stays at the
      // far left of the visible chart regardless of camera pan.
      entry: { mcap: launchMcap, vx: viewCount * 0.92 },
      tfLabel: "15s",
      axisTimes,
      tape,
      mcapPulse,
      peakPulse,
    });
  }

  return frames;
}

export function mcapLabel(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(v >= 1e7 ? 1 : 2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(v >= 1e5 ? 0 : 1)}K`;
  return `$${v.toFixed(0)}`;
}

export function mcapFull(v: number): string {
  return `$${Math.round(v).toLocaleString("en-US")}`;
}

export function usdLabel(v: number): string {
  if (v >= 1000) return `$${Math.round(v).toLocaleString("en-US")}`;
  return `$${v.toFixed(2)}`;
}

export function ladderLabel(v: number): string {
  if (v <= 0) return "$—";
  if (v >= 1e6) return `$${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}
