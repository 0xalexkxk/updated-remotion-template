// Trillion: LIVE pump from $200K → $400K (2x) during a 20-second clip.
//   - Historical context: accumulation chop, ending at ~$200K mcap
//   - Live god minute: actually pumps 2x with realistic micro-structure
//     (initial rip, brief pullback, breakout, top wick)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_PRICE  = 0.00001;
const MCAP_PER_PRICE = 50_000 / BASE_PRICE; // launch reference: $50K @ base price

const NOW = Math.floor(Date.now() / 1000);
const GOD_MINUTE_T = Math.floor((NOW - 90) / 60) * 60;

function rand(min, max) { return min + Math.random() * (max - min); }
function noise(pct)     { return 1 + rand(-pct, pct); }

const candles = [];

// ── Phase A — early accumulation $50K → ~$150K, 50 candles ───────────
const ACC_COUNT = 50;
for (let i = 0; i < ACC_COUNT; i++) {
  const t = GOD_MINUTE_T - (ACC_COUNT + 40) * 60 + i * 60;
  const drift = 1 + (i / ACC_COUNT) * 2.0; // 1.0x → 3.0x → $50K → $150K
  const o = BASE_PRICE * drift * noise(0.05);
  const c = BASE_PRICE * drift * noise(0.05);
  const h = Math.max(o, c) * rand(1.005, 1.04);
  const l = Math.min(o, c) * rand(0.96, 0.995);
  candles.push({ t, o, h, l, c, v: rand(200, 1500) });
}

// ── Phase B — pre-pump consolidation around $200K, 40 candles ─────────
// The chart settles into a flat range right before the god-minute pump.
const CONS_COUNT = 40;
let prev = candles[candles.length - 1].c;
const targetCons = BASE_PRICE * 4.0; // $200K
for (let i = 0; i < CONS_COUNT; i++) {
  const t = GOD_MINUTE_T - CONS_COUNT * 60 + i * 60;
  // Ease prev → targetCons over first 10 candles, then chop around it
  const ease = Math.min(1, i / 10);
  const center = prev * (1 - ease) + targetCons * ease;
  const o = prev;
  const c = center * noise(0.04);
  const h = Math.max(o, c) * rand(1.005, 1.025);
  const l = Math.min(o, c) * rand(0.975, 0.995);
  candles.push({ t, o, h, l, c, v: rand(800, 4000) });
  prev = c;
}

const LIVE_START_PRICE = prev;  // ~$200K, where the god candle opens
const LIVE_PEAK_PRICE  = BASE_PRICE * 8.0; // $400K target — true 2x

// ── ticks — sparse pre-window + dense god-minute ──────────────────────
const ticks = [];
const pumpStartT = GOD_MINUTE_T - (ACC_COUNT + CONS_COUNT) * 60;

// SPARSE: one tick per pre-window minute (godMinute() requires ≥2 to consider)
for (let i = 0; i < ACC_COUNT + CONS_COUNT; i++) {
  const t = pumpStartT + i * 60 + 30;
  const cdl = candles[i];
  ticks.push({
    t,
    price: cdl.c,
    usd: rand(20, 500),
    kind: Math.random() > 0.45 ? 'buy' : 'sell',
  });
}
// 5 handoff ticks at GMT-30..GMT-10 → seed winBase ≈ $200K
for (let i = 0; i < 5; i++) {
  ticks.push({
    t: GOD_MINUTE_T - 30 + i * 5,
    price: LIVE_START_PRICE * noise(0.008),
    usd: rand(80, 600),
    kind: Math.random() > 0.5 ? 'buy' : 'sell',
  });
}

// ── God-minute pump ticks — $200K → $400K with realistic structure ────
// Window covers [GMT-5, GMT+15] — the god candle has 15s to pump.
// 0-15% (0-2s):    rip from 1.00x → 1.45x  ($200K → $290K)
// 15-30% (2-5s):   small pullback to 1.30x ($260K)
// 30-65% (5-10s):  breakout to 1.80x ($360K)
// 65-85% (10-13s): retest to 1.60x ($320K)
// 85-100% (13-15s): final push to 2.00x ($400K)
const PUMP_DUR = 15;
function pumpAt(frac) {
  const anchors = [
    [0.00, 1.00],
    [0.15, 1.45],
    [0.30, 1.30],
    [0.65, 1.80],
    [0.85, 1.60],
    [1.00, 2.00],
  ];
  for (let i = 1; i < anchors.length; i++) {
    const [t0, v0] = anchors[i - 1];
    const [t1, v1] = anchors[i];
    if (frac <= t1) {
      const local = (frac - t0) / (t1 - t0);
      const s = local * local * (3 - 2 * local); // smoothstep
      return v0 + (v1 - v0) * s;
    }
  }
  return 2.00;
}

const PUMP_TICKS = 80;
for (let i = 0; i < PUMP_TICKS; i++) {
  const frac = i / (PUMP_TICKS - 1);
  const price = LIVE_START_PRICE * pumpAt(frac) * noise(0.008);
  const t = GOD_MINUTE_T + Math.round(frac * PUMP_DUR);
  // Buy bias when smooth trend is rising
  const dirSample = pumpAt(Math.min(1, frac + 0.04)) - pumpAt(frac);
  const buyProb = dirSample > 0 ? 0.78 : 0.42;
  ticks.push({
    t, price,
    usd: rand(60, 5000) * (0.6 + frac * 2),
    kind: Math.random() < buyProb ? 'buy' : 'sell',
  });
}

const pumpWindow = {
  startT:    GOD_MINUTE_T,
  endT:      GOD_MINUTE_T + 20,
  basePrice: BASE_PRICE,
  peakPrice: LIVE_PEAK_PRICE,
};

const data = {
  token: {
    name: 'Trillion',
    symbol: 'TRILLION',
    avatar: 'trillion-avatar.png',
    mcapPerPrice: MCAP_PER_PRICE,
  },
  pool: { liquidityUsd: 200_000, reserveBase: null, reserveQuote: null },
  candles,
  ticks,
  pumpWindow,
  fetchedAt: new Date(NOW * 1000).toISOString(),
  source: 'synthetic',
};

const outPath = path.join(__dirname, '../src/pumpfun-screen/data/active.json');
fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
console.log(`✅ Written to ${outPath}`);
console.log(`   Candles:    ${candles.length} (${ACC_COUNT} accumulation + ${CONS_COUNT} consolidation)`);
console.log(`   Ticks:      ${ticks.length}`);
console.log(`   Live start: $${(LIVE_START_PRICE * MCAP_PER_PRICE / 1000).toFixed(0)}K`);
console.log(`   Live peak:  $${(LIVE_PEAK_PRICE * MCAP_PER_PRICE / 1000).toFixed(0)}K  (2x during clip)`);
console.log(`   Window:     20s on 1m timeframe`);
