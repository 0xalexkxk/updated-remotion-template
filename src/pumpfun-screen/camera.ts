/* ------------------------------------------------------------------ *
 * camera.ts — a STEADY HAND watching a live pump.
 *
 * This is not a fidgety bot and not a loose, sailing hand. It is a person
 * watching a chart auto-follow the price on their phone. The screen sits STILL.
 * The engine already follows the live edge and autoscales the Y axis; the human
 * just leaves it alone — until, once or twice in the whole clip, they make ONE
 * clean, deliberate adjustment and HOLD it.
 *
 * The model:
 *
 *   1. Rest is neutral and still. Most frames are zoom ≈ 1, pan ≈ 0, with at
 *      most an almost-imperceptible micro-drift (|zoom−1| ≤ 0.02, |pan| ≤ 0.3)
 *      so the framing isn't pixel-frozen — but it does not wander.
 *
 *   2. One or two deliberate gestures across the entire clip — spread out, near
 *      ~35% and ~70% of the timeline (with small jitter). Each is a single,
 *      purposeful move:
 *        ZOOM_OUT → zoom ~1.20–1.30  (pull back to see context)
 *        ZOOM_IN  → zoom ~0.70–0.80  (lean onto the live edge)
 *        SCROLL   → pan  ±10–18      (a small look into history)
 *        HOME     → zoom 1, pan 0    (re-center)
 *
 *   3. The motion is a clean ease-in-out over ~0.45–0.6s that LANDS on the
 *      target and SETTLES with NO overshoot — critically decisive, not bouncy.
 *      After landing, the view HOLDS the target until the next gesture or the
 *      end. Decisive in, hold, done.
 *
 * The contract is a DEVIATION from the engine's auto-fit framing:
 *   zoom = multiplier on the fit view (1 = neutral; <1 zooms IN; >1 zooms OUT).
 *   pan  = candle-unit offset (+ toward older candles, − toward the live edge).
 *
 * Fully deterministic and pure — no Math.random, no clock. All randomness is a
 * seeded LCG keyed by gesture index. A single forward pass carries the easing
 * state frame→frame.
 * ------------------------------------------------------------------ */

export interface CameraFrame {
  zoom: number;
  pan: number;
}

// Deterministic LCG, seeded once and stepped per draw. Stable float in [0,1).
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type GestureKind = "ZOOM_IN" | "ZOOM_OUT" | "SCROLL" | "HOME";

interface Target {
  zoom: number;
  pan: number;
}

interface Gesture {
  startFrame: number;  // frame the deliberate move begins
  durFrames: number;   // length of the ease-in-out
  from: Target;        // where we leave (the previous hold)
  to: Target;          // where we land and then hold
  // Pre-intention: a brief hesitation twitch BEFORE the real gesture — like a
  // thumb that starts drifting the wrong way before committing. Optional.
  preFrames: number;   // frames of pre-intention (0 = none)
  preTarget: Target;   // where the thumb wanders to before committing
}

// Smootherstep — ease-in-out with zero velocity at both ends. Decisive, no
// overshoot: it never exceeds the target then comes back.
function smoother(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t * t * t * (t * (t * 6 - 15) + 10);
}

// Pick a deliberate gesture target from a per-gesture RNG. `prev` is the current
// hold; a re-center to neutral only reads as intentional once we're away from it.
// If the previous gesture already changed zoom, this one prefers a scroll (and
// vice-versa) so two gestures contrast instead of repeating — the way a person
// makes one kind of adjustment, holds, then a different kind.
function pickTarget(rng: () => number, prev: Target): Target {
  const awayZoom = Math.abs(prev.zoom - 1) > 0.05;
  const awayPan = Math.abs(prev.pan) > 1;
  const away = awayZoom || awayPan;
  const roll = rng();
  const sign = rng() < 0.5 ? -1 : 1;
  const lerp = (a: number, b: number) => a + (b - a) * rng();

  // Already away from neutral: a clean re-center reads as deliberate.
  if (away && roll < 0.45) {
    return { zoom: 1, pan: 0 };
  }

  // Contrast the previous move. If zoom is already off-neutral, scroll instead;
  // if we're panned, return to a zoom adjustment.
  if (awayZoom && !awayPan) {
    return { zoom: 1, pan: sign * lerp(10, 18) };
  }
  if (awayPan && !awayZoom) {
    return roll < 0.5 ? { zoom: lerp(1.2, 1.3), pan: 0 } : { zoom: lerp(0.7, 0.8), pan: 0 };
  }

  // Trader behavior — leaning into the action, pinching to zoom, scrolling
  // sideways to see more candles. Most gestures are zoom-ins (close-up on
  // the live edge), with some finger pans and rare gentle dezooms.
  //   55% close-up zoom (real lean-in)
  //   20% medium zoom-in
  //   18% finger pan (scroll history)
  //    7% gentle zoom-out (peek context)
  if (roll < 0.55) {
    return { zoom: lerp(0.62, 0.78), pan: sign * lerp(0, 2) }; // big close-up
  }
  if (roll < 0.75) {
    return { zoom: lerp(0.82, 0.92), pan: sign * lerp(0, 4) }; // smaller zoom-in
  }
  if (roll < 0.93) {
    return { zoom: lerp(0.96, 1.06), pan: sign * lerp(7, 16) }; // pan finger swipe
  }
  return { zoom: lerp(1.08, 1.20), pan: sign * lerp(0, 3) };    // dezoom (rare)
}

export function buildCamera(opts: { totalFrames: number; fps: number }): CameraFrame[] {
  const { totalFrames, fps } = opts;

  // Human watching a chart: multiple small finger interactions across the clip.
  // Traders rarely dezoom much — most gestures are small zoom-ins, micro pans
  // (scrolling slightly to see more candles), and quick taps that almost-revert.
  // ~1 gesture per 3 seconds of clip. Anchors are slightly biased toward the
  // dramatic part of the timeline (35-85%) where price action happens.
  const rng = lcg(0xc0ffee);
  const sec = totalFrames / fps;
  const gestureCount =
    sec < 4 ? 2 :
    sec < 8 ? 3 :
    sec < 14 ? 5 :
    sec < 20 ? 6 :
    7;
  // Place gestures with a bias toward action (35-85% range gets denser).
  const anchors = Array.from({ length: gestureCount }, (_, i) => {
    const r = lcg(0xa11a + i)();
    const base = (i + 0.5) / gestureCount;
    // Skew toward the middle (where the pump rips) with a soft sigmoid bend.
    const skewed = base < 0.5
      ? 0.5 - Math.pow(0.5 - base, 1.3) * 1.0
      : 0.5 + Math.pow(base - 0.5, 1.3) * 1.0;
    return Math.min(0.94, Math.max(0.05, skewed + (r - 0.5) * 0.06));
  });

  // Build gestures. Each has an optional pre-intention twitch (human hesitation).
  const gestures: Gesture[] = [];
  let prev: Target = { zoom: 1, pan: 0 };
  for (let i = 0; i < gestureCount; i++) {
    const gRng = lcg(0x9e3779b1 ^ ((i + 1) * 0x85ebca6b));
    const jitter = (gRng() * 2 - 1) * 0.05; // ±5% of the timeline
    const frac = Math.min(0.90, Math.max(0.10, anchors[i] + jitter));

    // Pre-intention: ~40% chance of a brief opposite nudge (0.1–0.2s).
    const hasHesitation = gRng() < 0.55;
    const preFrames = hasHesitation ? Math.round((0.1 + gRng() * 0.12) * fps) : 0;
    // The hesitation nudge is small and in the roughly opposite direction to 'to'.
    const to = pickTarget(gRng, prev);
    const preTarget: Target = {
      zoom: prev.zoom + (prev.zoom - to.zoom) * 0.18 * gRng(),
      pan:  prev.pan  + (prev.pan  - to.pan ) * 0.18 * gRng(),
    };

    // The deliberate move starts after the pre-intention.
    const gestureStart = Math.round(frac * totalFrames);
    const durFrames = Math.max(1, Math.round((0.4 + gRng() * 0.2) * fps));

    gestures.push({ startFrame: gestureStart, durFrames: preFrames + durFrames, from: prev, to, preFrames, preTarget });
    prev = to;
  }

  // Hand-held phone wobble — two layered sines per axis so the motion never
  // looks like a clean loop, plus a touch of zoom breathing.
  const driftZoom = (t: number) =>
    0.012 * Math.sin((2 * Math.PI * t) / 7.0 + 0.4) +
    0.006 * Math.sin((2 * Math.PI * t) / 2.6 + 1.7);
  const driftPan = (t: number) =>
    0.45 * Math.sin((2 * Math.PI * t) / 9.0 + 0.9) +
    0.20 * Math.sin((2 * Math.PI * t) / 3.1 + 2.4);

  // Single forward pass. The held target is whatever the most recent landed
  // gesture left us at; during a gesture we ease from its `from` to its `to`.
  const out: CameraFrame[] = [];
  let gIdx = 0;
  let held: Target = { zoom: 1, pan: 0 };
  for (let f = 0; f < totalFrames; f++) {
    // Settle any gestures whose move has fully completed into the held pose.
    while (gIdx < gestures.length && f >= gestures[gIdx].startFrame + gestures[gIdx].durFrames) {
      held = gestures[gIdx].to;
      gIdx++;
    }

    let baseZoom = held.zoom;
    let basePan = held.pan;

    // If we're inside the current gesture window, interpolate.
    // Phase 1 (pre-intention): from→preTarget over preFrames.
    // Phase 2 (commit): preTarget→to over (durFrames - preFrames).
    if (gIdx < gestures.length && f >= gestures[gIdx].startFrame) {
      const g = gestures[gIdx];
      const elapsed = f - g.startFrame;
      if (g.preFrames > 0 && elapsed < g.preFrames) {
        // Hesitation phase — drift toward preTarget
        const k = smoother(elapsed / g.preFrames);
        baseZoom = g.from.zoom + (g.preTarget.zoom - g.from.zoom) * k;
        basePan  = g.from.pan  + (g.preTarget.pan  - g.from.pan ) * k;
      } else {
        // Commit phase — move decisively to target
        const commitStart = g.preFrames;
        const commitDur   = g.durFrames - g.preFrames;
        const startPose   = g.preFrames > 0 ? g.preTarget : g.from;
        const k = smoother((elapsed - commitStart) / Math.max(1, commitDur));
        baseZoom = startPose.zoom + (g.to.zoom - startPose.zoom) * k;
        basePan  = startPose.pan  + (g.to.pan  - startPose.pan ) * k;
      }
    }

    const t = f / fps;
    let zoom = baseZoom + driftZoom(t);
    let pan = basePan + driftPan(t);

    // Clamp to the framing budget. Wider zoom range so gestures read clearly.
    zoom = Math.min(1.40, Math.max(0.50, zoom));
    pan = Math.min(24, Math.max(-24, pan));

    out.push({ zoom, pan });
  }

  return out;
}
