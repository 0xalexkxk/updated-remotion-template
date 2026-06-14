import React from "react";
import { getInfo, loadFont } from "@remotion/google-fonts/NotoSansJP";
import { FONT_VIBE, R, V } from "../../vibe-theme";
import { CardFrame, Panel, TokenAvatar, fmtPrice, fmtUsd } from "../../shared";
import { aprPct, data, epochHours, epochPct, pumpPaysPct } from "../data";

// CJK Google Fonts ship as ~120 numbered unicode-range slices — there is no
// "japanese" key at the weight level. Load every slice we have.
const JP_SUBSETS = Object.keys(getInfo().fonts.normal["700"]) as "latin"[];
const { fontFamily: FONT_JP } = loadFont("normal", {
  weights: ["400", "500", "700", "900"],
  subsets: JP_SUBSETS,
});

const TAB = { fontVariantNumeric: "tabular-nums" } as const;

/** One side of the 両建て spine: a labelled leg panel, terminal-style. */
const LegPanel: React.FC<{
  label: string;
  side: string;
  detail: React.ReactNode;
  caption: string;
}> = ({ label, side, detail, caption }) => (
  <Panel
    style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      padding: "26px 30px",
    }}
  >
    <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
      <span
        style={{
          fontFamily: FONT_JP,
          color: V.text,
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: 0.5,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: FONT_VIBE,
          color: V.gray,
          fontSize: 22,
          fontWeight: 500,
        }}
      >
        {side}
      </span>
    </div>
    <span
      style={{ fontFamily: FONT_VIBE, color: V.text, fontSize: 22, ...TAB }}
    >
      {detail}
    </span>
    <span
      style={{
        fontFamily: FONT_JP,
        color: V.gray,
        fontSize: 21,
        lineHeight: 1.45,
        marginTop: "auto",
      }}
    >
      {caption}
    </span>
  </Panel>
);

/**
 * Spot vs funding, native to Vibe (Japanese): 現物を保有 + Vibe で同じ VibeCap の
 * 無期限を Dump（ショート）→ 両建て・デルタニュートラル → Dump 側が 12 時間ごとに
 * 資金調達率を受け取る。Pump（ロング側）が支払う。金利受け取りは Vibe 上で文字通り。
 */
export const SpotFundingCardJP: React.FC = () => {
  const t = data.ticker;
  return (
    <CardFrame source={data.source} fetchedAt={data.fetchedAt}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <TokenAvatar src={data.avatar} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span
            style={{
              fontFamily: FONT_JP,
              color: V.text,
              fontSize: 50,
              fontWeight: 900,
              letterSpacing: -0.5,
              lineHeight: 1,
            }}
          >
            <span style={{ fontFamily: FONT_VIBE, ...TAB }}>{t}</span>
            <span style={{ marginLeft: 16, fontWeight: 700 }}>両建てで </span>
            <span style={{ fontFamily: FONT_VIBE, color: V.lightBlue, fontWeight: 900 }}>
              金利受け取り
            </span>
          </span>
          <span
            style={{
              fontFamily: FONT_JP,
              color: V.gray,
              fontSize: 25,
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            デルタニュートラル · 放置できるヘッジ
          </span>
        </div>
      </div>

      {/* hero — yield first */}
      <div
        style={{
          marginTop: 30,
          background: "rgba(24,138,253,0.07)",
          border: `1px solid ${V.lightBlue}55`,
          borderRadius: R.modal,
          padding: "30px 40px",
          display: "flex",
          alignItems: "center",
          gap: 36,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span
            style={{
              fontFamily: FONT_JP,
              color: V.gray,
              fontSize: 24,
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            金利受け取り・Dump側
          </span>
          <span
            style={{
              fontFamily: FONT_VIBE,
              color: V.lightBlue,
              fontSize: 108,
              fontWeight: 900,
              letterSpacing: -3,
              lineHeight: 0.92,
              ...TAB,
              textShadow: "0 0 40px rgba(24,138,253,0.40)",
            }}
          >
            年利 +{aprPct.toFixed(1)}%
          </span>
          <span
            style={{
              fontFamily: FONT_JP,
              color: V.text,
              fontSize: 26,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            <span style={{ fontFamily: FONT_VIBE, color: V.lightBlue, ...TAB }}>
              +{epochPct.toFixed(4)}%
            </span>{" "}
            / {epochHours}h を受け取る
          </span>
        </div>
        <span
          style={{
            fontFamily: FONT_JP,
            color: V.gray,
            fontSize: 25,
            lineHeight: 1.5,
            maxWidth: 600,
          }}
        >
          <span style={{ fontFamily: FONT_VIBE, color: V.text, fontWeight: 700 }}>
            {t}
          </span>{" "}
          の現物を保有し、Vibe で同じ無期限を Dump。
          12時間ごとに Pump 側が支払う資金調達率を、Dump 側のあなたが受け取る。
        </span>
      </div>

      {/* structure row — 両建て spine */}
      <div
        style={{
          marginTop: 26,
          display: "flex",
          alignItems: "stretch",
          gap: 18,
          flex: 1,
        }}
      >
        <LegPanel
          label="現物ロング"
          side="Spot"
          detail={`現物 ${fmtPrice(data.spotPx ?? 0)} · ${fmtUsd(
            data.spotLiquidityUsd,
          )} 流動性`}
          caption="実際に保有する原資産"
        />
        <div
          style={{
            alignSelf: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
            maxWidth: 250,
          }}
        >
          <span
            style={{
              fontFamily: FONT_VIBE,
              color: V.gray,
              fontSize: 34,
              lineHeight: 1,
            }}
          >
            ⇄
          </span>
          <span
            style={{
              fontFamily: FONT_JP,
              color: V.text,
              fontSize: 20,
              fontWeight: 700,
              lineHeight: 1.4,
              textAlign: "center",
              background: V.panel3,
              border: `1px solid ${V.hairline}`,
              borderRadius: R.panel,
              padding: "12px 18px",
            }}
          >
            両建て → 12時間ごとに金利を受け取る
          </span>
        </div>
        <LegPanel
          label="Vibe で無期限 Dump"
          side="Vibe"
          detail={
            <>
              マーク {fmtPrice(data.vibeMarkPx ?? 0)} · 最大{" "}
              {data.vibeMaxLeverage}x · FR{" "}
              <span style={{ color: V.lightBlue, fontWeight: 700 }}>
                +{epochPct.toFixed(4)}%
              </span>{" "}
              / {epochHours}h 受領
            </>
          }
          caption="Pump 側が支払い、Dump 側が受け取る"
        />
      </div>

      {/* mechanism caption */}
      <span
        style={{
          fontFamily: FONT_JP,
          color: V.text,
          fontSize: 26,
          fontWeight: 700,
          marginTop: 22,
          lineHeight: 1,
        }}
      >
        価格変動リスクをゼロに、金利だけ受け取る（デルタニュートラル）
      </span>

      {/* terminal data lines */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <span style={{ fontFamily: FONT_VIBE, color: V.gray, fontSize: 22, ...TAB }}>
          <span style={{ fontFamily: FONT_JP }}>Vibe FR (P|D) </span>
          <span style={{ color: V.pink }}>{pumpPaysPct.toFixed(4)}%</span>
          <span> | </span>
          <span style={{ color: V.lightBlue }}>+{epochPct.toFixed(4)}%</span>
          <span> / {epochHours}h</span>
        </span>
        <span style={{ fontFamily: FONT_VIBE, color: V.gray, fontSize: 22, ...TAB }}>
          +{epochPct.toFixed(4)}% × 2 × 365 ={" "}
          <span style={{ fontFamily: FONT_JP, color: V.gray }}>年利 </span>
          <span style={{ color: V.lightBlue, fontWeight: 700 }}>
            +{aprPct.toFixed(1)}%
          </span>
        </span>
        <span style={{ fontSize: 22, ...TAB }}>
          <span style={{ fontFamily: FONT_JP, color: V.gray }}>乖離率 </span>
          <span style={{ fontFamily: FONT_VIBE, color: V.gray }}>
            {data.basisPct?.toFixed(2) ?? "—"}%
          </span>
        </span>
        <span
          style={{
            fontFamily: FONT_JP,
            color: V.gray,
            fontSize: 21,
            marginTop: 6,
          }}
        >
          ※ロスカット注意：証拠金管理を徹底
        </span>
      </div>
    </CardFrame>
  );
};
