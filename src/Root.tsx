import React from "react";
import { Composition, Folder, Still } from "remotion";
import { pumpFunScreenMeta } from "./pumpfun-screen/PumpFunScreen";
import { CARD_H, CARD_W } from "./vibe-cards/shared";
import { LiquidationMapCard } from "./vibe-cards/LiquidationMapCard";
import { BigLiquidationCard } from "./vibe-cards/BigLiquidationCard";
import { FundingArbCard } from "./vibe-cards/FundingArbCard";
import { SpotFundingCardUS } from "./vibe-cards/markets/us/SpotFundingCard";
// CJK cards lazy-loaded so their large Noto Sans font bundles only load when
// the user actually renders one (not during pump-video renders).
const SpotFundingCardCN = React.lazy(() =>
  import("./vibe-cards/markets/cn/SpotFundingCard").then((m) => ({ default: m.SpotFundingCardCN })),
);
const SpotFundingCardKR = React.lazy(() =>
  import("./vibe-cards/markets/kr/SpotFundingCard").then((m) => ({ default: m.SpotFundingCardKR })),
);
const SpotFundingCardJP = React.lazy(() =>
  import("./vibe-cards/markets/jp/SpotFundingCard").then((m) => ({ default: m.SpotFundingCardJP })),
);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={pumpFunScreenMeta.id}
        component={pumpFunScreenMeta.component}
        durationInFrames={pumpFunScreenMeta.durationInFrames}
        fps={pumpFunScreenMeta.fps}
        width={pumpFunScreenMeta.width}
        height={pumpFunScreenMeta.height}
      />
      <Folder name="vibe-cards">
        <Still
          id="LiquidationMap"
          component={LiquidationMapCard}
          width={CARD_W}
          height={CARD_H}
        />
        <Still
          id="BigLiquidation"
          component={BigLiquidationCard}
          width={CARD_W}
          height={CARD_H}
        />
        <Still
          id="FundingArb"
          component={FundingArbCard}
          width={CARD_W}
          height={CARD_H}
        />
        <Folder name="markets">
          <Still
            id="SpotFundingUS"
            component={SpotFundingCardUS}
            width={CARD_W}
            height={CARD_H}
          />
          <Still
            id="SpotFundingCN"
            component={SpotFundingCardCN}
            width={CARD_W}
            height={CARD_H}
          />
          <Still
            id="SpotFundingKR"
            component={SpotFundingCardKR}
            width={CARD_W}
            height={CARD_H}
          />
          <Still
            id="SpotFundingJP"
            component={SpotFundingCardJP}
            width={CARD_W}
            height={CARD_H}
          />
        </Folder>
      </Folder>
    </>
  );
};
