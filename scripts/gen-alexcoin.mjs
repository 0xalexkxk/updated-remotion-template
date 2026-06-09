// Generates a synthetic Alexcoin dataset:
//   - LONG flat history at ~$10K mcap (~100 candles of chop)
//   - S-curve ramp from $10K → ~$700K (~40 candles)
//   - During the LIVE clip window: ~40% move with realistic resistance
//     (hit a level, get rejected, retest, break through, retest as support)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_PRICE  = 0.000010;
const MCAP_PER_PRICE = 10_000 / BASE_PRICE; // $10K @ base price

const NOW = Math.floor(Date.now() / 1000);

const GOD_MINUTE_T = Math.floor((NOW - 90) / 60) * 60;
const T0 = GOD_MINUTE_T - 5;
const T1 = T0 + 24;

function rand(min, max) { return min + Math.random() * (max - min); }
function noise(pct)     { return 1 + rand(-pct, pct); }

// ── candles ────────────────────────────────────────────────────────────
const candles = [];

// Phase A — flat chop at base price (~70% of the visible chart width)
const FLAT_COUNT = 100;
for (let i = 0; i < FLAT_COUNT; i++) {
  const t = GOD_MINUTE_T - (FLAT_COUNT + 40) * 60 + i * 60;
  const o = BASE_PRICE * noise(0.015);
  const c = BASE_PRICE * noise(0.015);
  const h = Math.max(o, c) * rand(1.002, 1.010);
  const l = Math.min(o, c) * rand(0.990, 0.998);
  candles.push({ t, o, h, l, c, v: rand(150, 600) });
}

// Phase B — S-curve ramp from $10K → ~$120K (~12x).
// Ramp ends at $120K — that's where the clip's god candle starts pumping.
const RAMP_COUNT = 40;
const RAMP_END_MULT = 12;
let prev = candles[candles.length - 1].c;
const sigMin = 1 / (1 + Math.exp(3));
const sigMax = 1 / (1 + Math.exp(-3));
function rampMult(x) {
  const sig = 1 / (1 + Math.exp(-6 * (x - 0.5)));
  return 1 + ((sig - sigMin) / (sigMax - sigMin)) * (RAMP_END_MULT - 1);
}
for (let i = 1; i <= RAMP_COUNT; i++) {
  const t = GOD_MINUTE_T - (RAMP_COUNT - i + 1) * 60;
  const target = BASE_PRICE * rampMult(i / RAMP_COUNT);
  const o = prev;
  const c = target * noise(0.025);
  const h = Math.max(o, c) * rand(1.005, 1.05);
  const l = Math.min(o, c) * rand(0.95, 0.998);
  candles.push({ t, o, h, l, c, v: rand(1000, 30000) * (1 + i / 10) });
  prev = c;
}

const RAMP_END_PRICE = prev; // ~70x base

// ── ticks ──────────────────────────────────────────────────────────────
const ticks = [];

// Pre-window ramp ticks (~80, spread across the S-curve ramp)
const rampStartT = GOD_MINUTE_T - RAMP_COUNT * 60;
for (let i = 0; i < 80; i++) {
  const frac = i / 79;
  const t = rampStartT + Math.round(frac * RAMP_COUNT * 60);
  const price = BASE_PRICE * rampMult(frac) * noise(0.02);
  ticks.push({
    t, price,
    usd: rand(20, 800),
    kind: Math.random() > 0.35 ? 'buy' : 'sell',
  });
}

// God-minute ticks — REAL-CHART feel: ~12% move over 19s with smooth phases
// and tiny Brownian micro-noise. Not a timelapse, not jerky.
//   0-30%:  slow rally  +6%  (gentle accumulation, micro-chop)
//   30-50%: pullback   -3%   (small rejection / liquidity sweep)
//   50-85%: re-rally   +12%  (breakout above prior high)
//   85-100%: cool-off   -2%  (small consolidation at the top)
const PUMP_START = GOD_MINUTE_T;
const PUMP_DUR   = 19;
const startPrice = RAMP_END_PRICE;

// Smoothstep — eased 0→1 transition (zero velocity at both ends).
function smooth(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

function pumpPriceAt(frac) {
  // 1:1 match of the reference video movement profile (measured from frames):
  //   0-10%   (0-2s):    rip +10%        ($841K → $926K)
  //   10-20%  (2-4s):    pullback -1.4%  ($926K → $913K)
  //   20-30%  (4-6s):    push to peak    ($913K → $941K) — sets ATH
  //   30-55%  (6-11s):   consolidate     (hold ~$940K, small chop)
  //   55-75%  (11-15s):  big pullback    ($940K → $885K, -6%)
  //   75-95%  (15-19s):  recovery        ($885K → $897K)
  //   95-100%:           settle
  const anchors = [
    [0.00, 1.000],
    [0.10, 1.100],   // initial rip
    [0.20, 1.085],   // micro pullback
    [0.30, 1.119],   // peak (sets ATH)
    [0.55, 1.115],   // consolidation
    [0.75, 1.052],   // big pullback
    [0.95, 1.066],   // recovery
    [1.00, 1.066],
  ];
  for (let i = 1; i < anchors.length; i++) {
    const [t0, v0] = anchors[i - 1];
    const [t1, v1] = anchors[i];
    if (frac <= t1) {
      const local = smooth((frac - t0) / (t1 - t0));
      return startPrice * (v0 + (v1 - v0) * local);
    }
  }
  return startPrice * anchors[anchors.length - 1][1];
}

// Brownian micro-noise: small persistent random walk on top of the smooth path.
// This is what makes a chart feel ALIVE — micro ticks within the trend.
let brownian = 0;
const BROWN_STEP = 0.0004; // ~0.04% step — small and smooth
const BROWN_PULL = 0.08;   // stronger mean-reversion

const PUMP_TICKS = 75; // fewer anchors → smoother interpolation between them
for (let i = 0; i < PUMP_TICKS; i++) {
  const frac = i / (PUMP_TICKS - 1);
  // Update brownian: random walk with mean reversion
  brownian += (Math.random() - 0.5) * 2 * BROWN_STEP;
  brownian -= brownian * BROWN_PULL; // pull toward 0
  const smoothPrice = pumpPriceAt(frac);
  const price = smoothPrice * (1 + brownian);
  const t = PUMP_START + Math.round(frac * PUMP_DUR);
  // Buy/sell bias follows the smooth trend direction (not the noise)
  const dirSample = pumpPriceAt(Math.min(1, frac + 0.02)) - smoothPrice;
  const buyProb = dirSample > 0 ? 0.68 : 0.40;
  const kind = Math.random() < buyProb ? 'buy' : 'sell';
  const usd  = rand(40, 3500) * (0.6 + frac * 1.0);
  ticks.push({ t, price, usd, kind });
}

const peakPrice = pumpPriceAt(0.30); // peak at ~30% into the clip (+12%)

// ── pumpWindow ─────────────────────────────────────────────────────────
const pumpWindow = {
  startT:    GOD_MINUTE_T,
  endT:      T1,
  basePrice: BASE_PRICE,        // overall launch base ($10K)
  peakPrice: peakPrice,          // peak reached during clip
};

// ── assemble ───────────────────────────────────────────────────────────
const data = {
  token: {
    name: 'Trillion',
    symbol: 'TRILLION',
    avatar: 'trillion-avatar.png',
    mcapPerPrice: MCAP_PER_PRICE,
  },
  // Big pool → small per-trade impact → smooth chart (not jittery)
  pool: { liquidityUsd: 800000, reserveBase: null, reserveQuote: null },
  candles,
  ticks,
  pumpWindow,
  fetchedAt: new Date(NOW * 1000).toISOString(),
  source: 'synthetic',
};

const outPath = path.join(__dirname, '../src/pumpfun-screen/data/active.json');
fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
const startMcap = startPrice * MCAP_PER_PRICE;
const peakMcap  = peakPrice  * MCAP_PER_PRICE;
console.log(`✅ Written to ${outPath}`);
console.log(`   Candles:     ${candles.length} (${FLAT_COUNT} flat + ${RAMP_COUNT} ramp)`);
console.log(`   Ticks:       ${ticks.length}`);
console.log(`   Launch mcap: $${(BASE_PRICE * MCAP_PER_PRICE).toLocaleString()}`);
console.log(`   Clip start:  $${Math.round(startMcap).toLocaleString()} (≈${Math.round(startPrice/BASE_PRICE)}x launch)`);
console.log(`   Clip peak:   $${Math.round(peakMcap).toLocaleString()} (≈${Math.round(peakPrice/BASE_PRICE)}x launch)`);
console.log(`   Move:        +${Math.round((peakPrice/startPrice - 1) * 100)}% during clip`);
