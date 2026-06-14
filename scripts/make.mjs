// scripts/make.mjs
//   Usage:  npm run make <config-name>
//
// Reads configs/<name>.json, generates the synthetic dataset matching the
// chart pattern, applies the language, and renders the final MP4 with a
// unique filename. One command end-to-end.
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// ── parse args ─────────────────────────────────────────────────────────
// Usage:
//   npm run make <config-name>             → uses language from config
//   npm run make <config-name> <lang>      → overrides language (en | zh)
//   npm run make <config-name> all         → renders one video per language
const configName = process.argv[2];
const langArg = process.argv[3]; // optional: en | zh | all
if (!configName) {
  console.error('Usage: npm run make <config-name> [lang|all]');
  console.error('Available configs:');
  const dir = fs.readdirSync(path.join(root, 'configs'));
  for (const f of dir) if (f.endsWith('.json')) console.error('  -', f.replace('.json', ''));
  process.exit(1);
}
const configPath = path.join(root, 'configs', `${configName}.json`);
if (!fs.existsSync(configPath)) {
  console.error(`❌ Config not found: ${configPath}`);
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Apply language override if provided
if (langArg && langArg !== 'all') {
  if (!['en', 'zh'].includes(langArg)) {
    console.error(`❌ Unknown language: ${langArg}. Supported: en, zh`);
    process.exit(1);
  }
  cfg.language = langArg;
  console.log(`🌐 Language override: ${langArg}`);
}

// "all" mode → re-spawn make once per supported language
if (langArg === 'all') {
  const langs = ['en', 'zh'];
  console.log(`🌐 Rendering ${langs.length} languages: ${langs.join(', ')}`);
  for (const lang of langs) {
    console.log(`\n──────── ${lang.toUpperCase()} ────────`);
    const r = spawnSync('node', ['scripts/make.mjs', configName, lang], {
      cwd: root, stdio: 'inherit',
    });
    if (r.status !== 0) process.exit(r.status ?? 1);
  }
  process.exit(0);
}

// ── PUMP-MOMENT VALIDATION ─────────────────────────────────────────────
// Refuses configs that show post-pump consolidation instead of the live pump.
// See remotion.md → "🔥 THE CORE PRINCIPLE — capture the PUMP moment".
function validatePumpMoment(cfg) {
  if (cfg.allowConsolidation === true) return; // explicit override
  const anchors = cfg.livePump?.anchors;
  if (!anchors || anchors.length < 2) {
    throw new Error('❌ livePump.anchors missing or too short.');
  }
  const finalMult = anchors[anchors.length - 1].mult;
  const peakMult  = Math.max(...anchors.map((a) => a.mult));
  const lowMult   = Math.min(...anchors.map((a) => a.mult));
  const range = peakMult / lowMult;
  const fails = [];
  if (peakMult < 1.5) {
    fails.push(`livePump peak mult is ${peakMult.toFixed(2)}x — the clip is showing consolidation, not a pump. Set anchors so the live god candle actually RIPS (peak ≥ 1.5x, ideally ≥ 2x). Read remotion.md → "🔥 THE CORE PRINCIPLE".`);
  }
  if (range < 1.4) {
    fails.push(`livePump range is only ${range.toFixed(2)}x (low ${lowMult.toFixed(2)} → peak ${peakMult.toFixed(2)}). The clip will look like sideways chop. Encode the actual pump moment.`);
  }
  if (finalMult < 1.3 && peakMult < 1.5) {
    fails.push(`Final mult is ${finalMult.toFixed(2)}x. The clip should END at or near the chart's visible peak. If you want a pump that then retraces, fine, but the peak mult must still be ≥ 1.5x.`);
  }
  if (fails.length) {
    console.error('\n❌ Config rejected — not a pump moment:\n');
    for (const f of fails) console.error('   • ' + f);
    console.error('\n   The user wants to PRETEND we hit RECORD during the pump.');
    console.error('   The chart you replicate must SHOW THE PUMP HAPPENING.');
    console.error('   Override with "allowConsolidation": true if you really mean it.\n');
    process.exit(1);
  }
}
validatePumpMoment(cfg);

// ── helpers ────────────────────────────────────────────────────────────
function rand(min, max) { return min + Math.random() * (max - min); }
function noise(pct)     { return 1 + rand(-pct, pct); }
function smoothstep(t)  { const x = Math.max(0, Math.min(1, t)); return x * x * (3 - 2 * x); }
function interpAnchors(anchors, frac, valueKey) {
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1];
    const b = anchors[i];
    if (frac <= b.frac) {
      const local = (frac - a.frac) / (b.frac - a.frac);
      const s = smoothstep(local);
      return a[valueKey] + (b[valueKey] - a[valueKey]) * s;
    }
  }
  return anchors[anchors.length - 1][valueKey];
}

// ── generate dataset ──────────────────────────────────────────────────
const NOW = Math.floor(Date.now() / 1000);
const GOD_MINUTE_T = Math.floor((NOW - 90) / 60) * 60;

const launchMcap = cfg.history.launchMcap;
const BASE_PRICE = 0.00001;
const MCAP_PER_PRICE = launchMcap / BASE_PRICE;
const mcapToPrice = (mcap) => mcap / MCAP_PER_PRICE;

// Generate context candles
const candles = [];
const N_HIST = cfg.history.candleCount;
let prev = mcapToPrice(cfg.history.pattern[0].mcap);
for (let i = 0; i < N_HIST; i++) {
  const t = GOD_MINUTE_T - (N_HIST - i) * 60;
  const fracPrev = (i - 0.5) / N_HIST;
  const fracCurr = (i + 0.5) / N_HIST;
  const targetClose = mcapToPrice(interpAnchors(cfg.history.pattern, Math.max(0, Math.min(1, fracCurr)), 'mcap')) * noise(0.025);
  const o = prev;
  const c = targetClose;
  const swing = Math.abs(c - o) / Math.max(o, c);
  const wickPct = Math.max(0.005, swing * 0.4);
  const h = Math.max(o, c) * (1 + rand(wickPct * 0.3, wickPct * 1.2));
  const l = Math.min(o, c) * (1 - rand(wickPct * 0.3, wickPct * 1.0));
  candles.push({ t, o, h, l, c, v: rand(400, 6000) * (1 + Math.abs(swing) * 4) });
  prev = c;
}
const LIVE_START_PRICE = prev;

// Generate ticks
const ticks = [];
// Sparse: 1 tick per pre-window minute (godMinute requires ≥2 to consider)
for (let i = 0; i < N_HIST; i++) {
  const cdl = candles[i];
  ticks.push({
    t: cdl.t + 30,
    price: cdl.c,
    usd: rand(20, 500),
    kind: Math.random() > 0.45 ? 'buy' : 'sell',
  });
}
// Handoff ticks at T0 to set winBase
for (let i = 0; i < 5; i++) {
  ticks.push({
    t: GOD_MINUTE_T - 30 + i * 5,
    price: LIVE_START_PRICE * noise(0.008),
    usd: rand(80, 600),
    kind: Math.random() > 0.5 ? 'buy' : 'sell',
  });
}
// God-minute pump ticks — window covers [GMT, GMT + (duration - PREV_TAIL_SEC)].
// PREV_TAIL_SEC=5 always (engine constant). So with duration=15, pump fits 10s.
const PUMP_DUR = cfg.duration - 5;
const PUMP_TICKS = 80;
const liveAnchors = cfg.livePump.anchors;

// Dramatic candle mode: the price spikes high, dumps hard within the candle
// body, then slowly recovers. The OUTER mults (anchors) define what the chart
// will *settle* at; the dramatic mod adds an extra spike+dump+recover OVERLAY
// that prints as a giant wick on the forming god candle.
const dramatic = cfg.dramaticCandle === true;
function dramaMod(frac) {
  if (!dramatic) return 1.0;
  // Drama curve (multiplier on the base anchor value at this frac):
  //   0.00-0.25  ramp normal (mod = 1.00)
  //   0.25-0.40  SPIKE UP    (mod climbs to 1.18 = +18% overshoot)
  //   0.40-0.55  CRASH DOWN  (mod dives to 0.70 = -30% undershoot, long wick)
  //   0.55-0.85  slow recover (mod eases back to 1.00)
  //   0.85-1.00  hold
  if (frac < 0.25) return 1.0;
  if (frac < 0.40) {
    const t = (frac - 0.25) / 0.15;
    const s = t * t * (3 - 2 * t);
    return 1.0 + 0.18 * s;
  }
  if (frac < 0.55) {
    const t = (frac - 0.40) / 0.15;
    const s = t * t * (3 - 2 * t);
    return 1.18 - 0.48 * s; // 1.18 → 0.70
  }
  if (frac < 0.85) {
    const t = (frac - 0.55) / 0.30;
    const s = t * t * (3 - 2 * t);
    return 0.70 + 0.30 * s; // 0.70 → 1.00
  }
  return 1.0;
}

for (let i = 0; i < PUMP_TICKS; i++) {
  const frac = i / (PUMP_TICKS - 1);
  const baseMult = interpAnchors(liveAnchors, frac, 'mult');
  const mult = baseMult * dramaMod(frac);
  const price = LIVE_START_PRICE * mult * noise(dramatic ? 0.015 : 0.008);
  const t = GOD_MINUTE_T + Math.round(frac * PUMP_DUR);
  const dirSample = interpAnchors(liveAnchors, Math.min(1, frac + 0.04), 'mult') - baseMult;
  const buyProb = dirSample > 0 ? 0.78 : 0.42;
  ticks.push({
    t, price,
    usd: rand(60, 5000) * (0.6 + frac * 2),
    kind: Math.random() < buyProb ? 'buy' : 'sell',
  });
}

const LIVE_PEAK_PRICE = LIVE_START_PRICE * Math.max(...liveAnchors.map(a => a.mult));

const data = {
  token: {
    name: cfg.name,
    symbol: cfg.ticker,
    avatar: cfg.avatar,
    mcapPerPrice: MCAP_PER_PRICE,
  },
  pool: { liquidityUsd: cfg.poolLiquidity ?? 200000, reserveBase: null, reserveQuote: null },
  candles,
  ticks,
  pumpWindow: {
    startT: GOD_MINUTE_T,
    endT: GOD_MINUTE_T + cfg.duration,
    basePrice: BASE_PRICE,
    peakPrice: LIVE_PEAK_PRICE,
  },
  fetchedAt: new Date(NOW * 1000).toISOString(),
  source: 'config:' + configName,
};

const outPath = path.join(root, 'src/pumpfun-screen/data/active.json');
fs.writeFileSync(outPath, JSON.stringify(data, null, 2));

// ── apply runtime config: language + timeframe + duration ─────────────
// We patch engine.ts constants in place to keep things simple.
const enginePath = path.join(root, 'src/pumpfun-screen/engine.ts');
let engineSrc = fs.readFileSync(enginePath, 'utf8');

// Window duration
engineSrc = engineSrc.replace(
  /export const WINDOW_SEC = \d+;/,
  `export const WINDOW_SEC = ${cfg.duration};`,
);

// Timeframe label + tx rate boost via string replacement (best-effort)
const labels = cfg.language === 'zh'
  ? { tf: cfg.timeframe === '1m' ? '1分钟' : cfg.timeframe }
  : { tf: cfg.timeframe };
engineSrc = engineSrc.replace(
  /tfLabel: "[^"]*",/,
  `tfLabel: ${JSON.stringify(labels.tf)},`,
);

fs.writeFileSync(enginePath, engineSrc);

// ── VibeScreen skin: language + per-token framing ─────────────────────
// The whole Vibe UI reads its language off ONE `LANG` constant and its
// market framing off PAIR/SUB/LEV/TF constants. We rewrite those lines.
const vibePath = path.join(root, 'src/vibe-screen/VibeScreen.tsx');
let vibeSrc = fs.readFileSync(vibePath, 'utf8');

const lang = cfg.language === 'zh' ? 'zh' : 'en';
vibeSrc = vibeSrc.replace(
  /const LANG: "en" \| "zh" = "(?:en|zh)";/,
  `const LANG: "en" | "zh" = "${lang}";`,
);

// PAIR — default derives from the token symbol; an explicit cfg.pair overrides.
const pairLine = cfg.pair
  ? `const PAIR = ${JSON.stringify(cfg.pair)};`
  : 'const PAIR = `${data.token.symbol}-USDC`;';
vibeSrc = vibeSrc.replace(/const PAIR = (?:`[^`]*`|"[^"]*");/, pairLine);

// SUB — default is the language's word for the asset; cfg.sub overrides.
const subLine = cfg.sub
  ? `const SUB = ${JSON.stringify(cfg.sub)};`
  : 'const SUB = LABELS[LANG].sub;';
vibeSrc = vibeSrc.replace(/const SUB = (?:LABELS\[LANG\]\.sub|"[^"]*");/, subLine);

// LEV — leverage pill (e.g. "40x").
vibeSrc = vibeSrc.replace(
  /const LEV = "[^"]*";/,
  `const LEV = ${JSON.stringify(cfg.leverage || '40x')};`,
);

// TF — chart timeframe label (e.g. "15m"); falls back to the config timeframe.
vibeSrc = vibeSrc.replace(
  /const TF = "[^"]*";/,
  `const TF = ${JSON.stringify(cfg.chartTf || cfg.timeframe || '15m')};`,
);

fs.writeFileSync(vibePath, vibeSrc);

console.log(`✅ Generated active.json for ${cfg.ticker}`);
console.log(`   ${candles.length} candles, ${ticks.length} ticks, lang=${cfg.language}, ${cfg.duration}s window`);

// ── render via the unique-name script ──────────────────────────────────
console.log(`🎬 Rendering...`);
const child = spawn('node', ['scripts/render.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, MAKE_LANG: cfg.language },
});
child.on('exit', (code) => process.exit(code ?? 0));
