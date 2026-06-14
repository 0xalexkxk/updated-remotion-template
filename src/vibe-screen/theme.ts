/**
 * Vibe perp-DEX palette + type, matched to the vibe-ui-v2 reference.
 * Up candles are blue, down candles are pink (Vibe's signature look).
 * One typeface (Inter) for everything; numbers use tabular figures.
 */
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily, waitUntilDone } = loadFont("normal", {
  subsets: ["latin"],
  weights: ["400", "500", "600", "700", "800"],
});

export const FONT_READY = waitUntilDone; // () => Promise<void>

/** Sampled from vibe_theme_color_swatches.png. */
export const C = {
  bg: "#0E1330", // app background
  panel: "#101638", // header / panel fill
  panel2: "#171F46", // raised panel / button track
  panelLine: "#1d2752", // hairlines / borders
  blue: "#2465FF", // up candle, Buy, active accents
  blueDim: "#1a3a8f",
  pink: "#EC71E1", // down candle, Sell accent
  pinkDim: "#7d3a79",
  text: "#FFFFFF",
  textMute: "#9196B4", // muted labels
  textFaint: "#5b6291",
  green: "#2465FF", // alias: "up" uses blue in this skin
  red: "#EC71E1", // alias: "down" uses pink in this skin
} as const;

export const FONT_UI = fontFamily;
export const FONT_MONO = fontFamily;

/** 9:16 portrait video frame. The Vibe app fills it edge-to-edge — no browser
 *  chrome (no URL bar, no close button, no bottom nav). */
export const W = 1080;
export const H = 1920;
export const FPS = 60;
