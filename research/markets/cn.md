# Chinese X — funding-rate arbitrage (资金费率套利) research

**The winning format: a KOL teaching card that turns funding rate into idle-USDT yield — a "无损套利" (lossless arbitrage) lesson with one big 年化/日化 number and a Binance funding-rate screenshot underneath.** Not a chart. A promise plus a recipe.

The Chinese market does not reward elegant diagrams. It rewards a teacher who says *this is near zero-risk, here is the exact APR, here is where to click.* The highest-engagement posts are all instruction, not illustration.

---

## TL;DR for the card builder

- One headline number. `无损 · 日化 0.5%` or `年化 5–10%` beats any prose. The number is the hook.
- Frame as **yield on money you already hold**, not as trading. "牛市踏空了？赚了一堆U不知道如何增值？" is the opening that won 471 likes.
- Show the **two legs explicitly**: 买现货 (buy spot) + 1倍做空永续 (1x short perp) → 总Δ=0. Readers want to see the hedge cancel.
- A real **exchange screenshot** (funding-rate ranking table) is the trust anchor. Three of the top six media posts use one.
- Name the **near-zero-risk** claim plainly (无损 / 基本上零风险 / 永远不会爆仓), then one honest caveat (负费率时平仓). Honesty raises trust here, doesn't lower it.

---

## Top 10 posts (ranked by likes + 2×RT + quotes)

| # | Author | Likes | RT | Views | Media | Format |
|---|--------|------:|---:|------:|:-----:|--------|
| 1 | @nemoyue0607 | 712 | 193 | 127k | no | 课代表笔记 — Delta-Neutral defined with a worked 1-ETH spot+short example |
| 2 | @aoke_quant | 505 | 145 | 300k | yes | 教程 Q&A on the "U本位无损套利模型" + funding-rank screenshot |
| 3 | @Meta8Mate | 471 | 404 | 246k | yes | big-APR card — "基本上零风险", 40% USDT 年化 + 10% APR 补贴 |
| 4 | @yhaiyang | 431 | 75 | 642k | no | first-principles explainer — derives 万分之一 base rate → 年化10% |
| 5 | @aoke_quant | 392 | 107 | 506k | yes | one-line hook "无损,日化0.5%" over a coin-margined funding screenshot |
| 6 | @taolige666 | 316 | 48 | 45k | yes | 理财 card 《如何稳定做到10%以上年化？》 — numbered neutral vaults |
| 7 | @Juu17__ | 285 | 90 | 205k | no | insider 四层博弈 thread on "无风险套利" snapshot timing |
| 8 | @taresky | 468 | 77 | 262k | no | portfolio disclosure — 资金费套利占40%, perp 年化30% |
| 9 | @xincctnnq | 519 | 122 | 50k | no | tool announce — 14 open-sourced HL strategies (基差套利/资金费率收割) |
| 10 | @feifan7686 | 159 | 28 | 46k | no | listicle — 周末基差套利 + 解锁前夕事件对冲, each a step recipe |

`postsAnalyzed = 115 · medianLikes (curated top-12) = 354`

---

## Design takeaways for a STATIC Chinese card

1. **Lead with the number, in the largest type on the card.** `年化 5–10%` or `日化 0.5% · 无损`. Everything else is support. The winning posts open on the figure, not the concept.

2. **Sell it as 理财, not as 交易.** The frame that travels is "把闲置的 U 变成会生息的资产" — turn idle USDT into a yield-bearing asset. Avoid words that smell of gambling (赌/梭哈); this audience has been burned and wants the *安心* (peace-of-mind) register.

3. **Draw the two legs as a balance that cancels.** 现货多头 (Δ=+1) on the left, 永续空头 (Δ=−1) on the right, `总Δ=0` in the middle. The neutralized-exposure visual is the single most-repeated teaching device.

4. **Say "做空付钱给做多" the right way round, and explain who pays.** Chinese posts teach that high positive funding comes from 散户看多→加杠杆开多→缺少空头对手盘. The arbitrageur is the patient short who *collects* the fee. State: 费率为正时，多头付给空头 (when funding is positive, longs pay shorts).

5. **Anchor with an exchange-screenshot aesthetic.** A funding-rate ranking table (币种 · 资金费率 · 年化) reads as proof. For Vibe (a DEX), mimic that table look — coin rows, a % column, an 年化 column — so it inherits the trust pattern Chinese readers already associate with arbitrage posts.

6. **State one honest caveat on the card.** 负费率时平仓 / 正费率时间牛短熊长. The top "打假" post (205 likes) earned trust by puncturing the hype. A single caveat line makes the big number believable.

7. **Use the DEX angle as the upgrade, not the lede.** "链上 / Hyperliquid / perp DEX" framing appears in the strongest tool posts, but always after the yield promise. Vibe on HyperEVM should say: *same 资金费率套利, on-chain, your keys* — as the second beat.

8. **Keep the typography dense and instructional.** These are not minimalist Western cards. Numbered steps, a blood-drop or 💰 header emoji, a clear 传送门/recipe. The successful cards look like a lesson page, not a poster.

---

## Vocabulary glossary — the exact Simplified Chinese winning posts use

| Concept | Winning term(s) | Notes |
|---|---|---|
| funding rate | **资金费率** (formal) · **费率** / **资金费** (casual) | 资金费率 dominates; 费率 alone is the conversational shorthand |
| spot | **现货** | 现货多头 = spot long leg |
| perpetual (contract) | **永续合约** · **永续** · **perp** | 永续 and the English "perp" both used freely |
| basis | **基差** | 基差套利 = basis arbitrage; "perp 比现货贵 0.8%" is how basis is expressed |
| annualized yield | **年化** / **年化收益(率)** · **日化** (daily) | 年化 is the headline unit; 日化 0.5% used for punchier hooks |
| delta-neutral | **Delta Neutral** / **中性(仓)** / **中性对冲** · **总Δ=0** | English "Delta Neutral" kept; 中性 is the native gloss |
| carry / collecting the fee | **吃费率** · **套费率** · **收资金费(用)** · **资金费率收割** | 吃/套/收割 = "eat / harvest" the funding — the active verb |
| lossless / risk-free framing | **无损(套利)** · **无风险套利** · **基本上零风险** | 无损 = capital-preserving; the signature phrase of this niche |
| liquidation | **爆仓** (blow-up, dominant) · **清算** (formal) · **强平** (forced close) | "币本位1倍做空永远不会爆仓" is the reassurance line |
| shorts/longs payment direction | **费率为正时多头付给空头** · **空头收(资金)费** | positive funding → longs pay shorts; the arbitrageur is the 空头 collecting |
| the arbitrage setup | **买现货 + 1倍做空永续** · **期现对冲** · **U本位无损套利模型** | 期现对冲 = spot-futures hedge; the canonical recipe phrase |
| idle-capital / yield framing | **闲置的U** · **生息** · **理财** · **赚了一堆U不知道如何增值** | the emotional hook — make dormant USDT earn |

### Chinese-market specifics worth carrying into the card

- **KOL 教程 threads win, not infographics.** The teacher-with-receipts archetype (课代表笔记, Q&A teardown, portfolio disclosure) out-engages any diagram. A static card should *feel* like the opening frame of such a thread.
- **撸毛 / 理财 crossover audience.** Many readers arrived from airdrop-farming (撸毛). They read funding arbitrage as the "after airdrops dried up" yield play — frame it as the mature, sustainable successor to 撸毛.
- **Binance is the default mental model; a DEX must borrow its UI trust.** Posts screenshot Binance's funding-rate ranking. Vibe's card should echo that table layout so the mechanic reads as familiar, then claim the on-chain upgrade.
- **币本位 (coin-margined) 1x short is the specific trick taught**, because it "永远不会爆仓" — a 1x coin-margined short never liquidates. If Vibe supports an equivalent, name it; it is the detail that signals you actually know the play.
