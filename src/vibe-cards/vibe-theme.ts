import { continueRender, delayRender, staticFile } from "remotion";

/**
 * The real Vibe brand, sampled from beta.vibe.trading (v0.6.5):
 * body #090D28; panels #0D1435 / #19203F / #212A50; primary blue #185DFD
 * (buttons, 20x chip); light blue #188AFD (price, positive funding, pump);
 * pink #FB88FF (negative funding, dump); gray #737296. Radii: panels 12px,
 * buttons 10px, chips 5px. Type: "Open Sauce Two".
 *
 * Vocabulary: Pump = long, Dump = short. Funding shown per 12h epoch as
 * "(P|D)" — pump side | dump side.
 */
export const V = {
  bg: "#090D28",
  panel: "#0D1435",
  panel2: "#19203F",
  panel3: "#212A50",
  hairline: "#212A50",
  blue: "#185DFD", // primary action / chip
  lightBlue: "#188AFD", // price, pump side, positive
  pink: "#FB88FF", // dump side, negative
  green: "#0DF20D", // trending-bar gains
  text: "#FFFFFF",
  gray: "#737296",
  grayDim: "#4A4968",
} as const;

export const R = { panel: 12, button: 10, chip: 5, modal: 24 } as const;

// ---- Open Sauce Two (self-hosted; fontsource ttf, same files the app uses)

const WEIGHTS = ["400", "500", "600", "700", "800", "900"] as const;

const handle = delayRender("load Open Sauce Two");
Promise.all(
  WEIGHTS.map((w) => {
    const f = new FontFace(
      "Open Sauce Two",
      `url(${staticFile(`fonts/OpenSauceTwo-${w}.ttf`)}) format("truetype")`,
      { weight: w },
    );
    return f.load().then((loaded) => document.fonts.add(loaded));
  }),
)
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));

export const FONT_VIBE = `"Open Sauce Two", sans-serif`;
