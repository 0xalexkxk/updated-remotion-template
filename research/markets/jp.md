# Japanese crypto X — funding-rate arbitrage (資金調達率アービトラージ) research

**Winning format: one big yield number up front (年利 / 利回り), in plain text or on a live screenshot — not an infographic.** Japanese crypto X sells the funding-rate carry trade as a *number you keep*, framed as 両建て (both-sides hedge) earning the 金利分 (the interest portion). The best-performing posts pair a concrete 年率 figure (e.g. `年利+20〜30%`, `¥50M deployed`) with a real position screenshot or a CryptoQuant chart. Polished diagrams underperform; raw screenshots, quant note-links, and a single declarative yield claim win.

## Scope and method

- **TwitterAPI.io advanced search**, 8 queries, `Top` tab, JP keywords (ファンディングレート / 資金調達率 / 両建て / デルタニュートラル / 年利).
- 73 cell-tagged results → **36 genuinely on-topic** after stripping noise. Two big generic-keyword false positives were discarded: corporate 資金調達 (Seoul-subway history, Alphabet share issue, HYBE PEF) and crowdfunding ファンディング (FiNANCiE token shilling). These match the words but are not the carry trade.
- Ranked by `likes + 2×retweets + quotes`; views as tiebreak. **Bookmarks are not exposed in the cache schema** (recorded as `null`); follower counts likewise absent.

## Top 10 (on-topic, ranked by engagement)

| # | Author | Likes | RT | Views | Media | Format | Hook in their own words |
|---|--------|-------|----|----|------|--------|------|
| 1 | @azuma_bitcoin | 83 | 8 | — | yes | live screenshot + yield claim | `金利受け取り用両建てポジション…運用額5000万で年利+20〜30%を目指す` |
| 2 | @bitmexsen | 87 | 8 | — | yes | strategy explainer + note | `両建てして資金調達率の金利分を稼ぐトレード…無期限と先物ポジション両建て` |
| 3 | @blog_uki | 303 | 76 | — | yes | quant thread → note | `ETHファンディングレートから市場構造に対する仮説…ETH無期限先物に関する仮説` |
| 4 | @mareku011 | 107 | 61 | 14,295 | yes | bot-build note + ✅ checklist | `デルタニュートラルBotの作り方…ファンディングレートを自動計算` |
| 5 | @abc_trillion | 60 | 21 | 17,281 | yes | PnL / IR results card | `営業外収益6,300万円計上…デルタニュートラル戦略を基盤としたリスクヘッジ` |
| 6 | @tomohiko_kondo | 254 | 60 | 50,442 | no | product announcement | `ファンディングレート（お客様側受け取りもあり）` |
| 7 | @blog_uki | 158 | 20 | — | yes | quant → note | `BitMEXのファンディングレートおよび乖離率の持つ説明力を定量化` |
| 8 | @digitalgoldbc | 79 | 5 | 8,358 | no | chart-reading signal card | `全取引所ファンディングレートチャートに赤いバー…ショートスクイーズで爆上げ` |
| 9 | @takumiasano_jp | 103 | 16 | — | no | educational thread | `レバレッジ比率やファンディングレートを確認するとわかります…先物でヘッジ` |
| 10 | @SOU_BTC | 70 | 14 | 127,687 | yes | news bullet card | `bitFlyer Crypto CFD…SFDが廃止されファンディングレートが導入` |

Honourable mentions outside the top 10: @blog_uki (`XBTのFRは積み上げで見ると…市況を映す鏡`), @web3_honey (Makina explainer listing `ファンディングレート裁定` as a pro strategy). **@blog_uki appears four times** — the canonical JP funding-rate quant voice. @azuma_bitcoin is the single best template specimen for our card.

## Design takeaways for a static Japanese card

1. **Lead with the yield number, not the mechanism.** `年利+20〜30%` or `利回り◯%` belongs in the largest type on the card. The winning posts state the return first; the hedge structure is the small print. Vibe's spot-vs-funding basis should surface as a headline APR.
2. **Use 両建て as the spine concept.** The trade reads to JP traders as "hold both sides, collect the 金利分." Label the two legs 現物 (spot/long) and 無期限先物ショート (perp short), bridged by an arrow that says 両建て → 資金調達率を受け取る.
3. **Say it earns 金利 (interest), not "funding income."** JP framing treats funding as *interest you receive* (金利受け取り / お客様側受け取り). "ショートがロングに支払う" is the precise mechanism phrase — put it as a one-line caption under the perp leg.
4. **A real screenshot beats a clean diagram.** The top organic posts are position screenshots and CryptoQuant charts, not designed infographics. If the card must be designed, make it look like a terminal/exchange panel (numbers, a small chart), not a marketing illustration.
5. **デルタニュートラル is the credibility word.** Every serious post uses it verbatim to mean "price-risk removed, yield remains." One line: `価格変動リスクをゼロに、金利だけ受け取る（デルタニュートラル）`.
6. **Show the carry as 放置できる (set-and-forget).** @azuma_bitcoin's `放置できるレバ` resonates — the appeal is passive yield, not active trading. Frame the basis trade as low-attention income.
7. **Name the risk honestly with ロスカット / 清算.** JP audiences are liquidation-scarred (90% 退場率 folklore in @FxRumasan). A small `※ロスカット注意：証拠金管理` line raises trust rather than lowering it.
8. **HyperEVM / perp DEX angle = the bot/自動 crowd.** The fastest-growing on-topic post (@mareku011, 61 RT) is a Bybit×Hyperliquid デルタニュートラルBot note. Vibe on HyperEVM can speak to this self-hoster culture: 自動 / Bot / 監視 / 自動計算.

## Vocabulary glossary — exact terms winning posts use

| Concept | Winning Japanese term(s) | Notes |
|---|---|---|
| Funding rate | **資金調達率**, **ファンディングレート**, **FR** | All three live; FR is the casual shorthand. |
| Spot | **現物** | The long leg you actually hold. |
| Perpetual future | **無期限先物**, **無期限**, **パーペチュアル/Perp** | 無期限先物 is the formal term; パーペチュアル/perp in DEX-native posts. |
| Basis / divergence | **乖離 (かいり)**, **乖離率** | JP posts say 乖離率 where EN says "basis"; pairs with FR constantly (`FRと乖離率の関係`). ベーシス is understood but 乖離 dominates organic posts. |
| Annualized yield / APR | **年利**, **年率**, **利回り** | 年利+◯% is the headline form. 利回り = yield in general. |
| Delta-neutral | **デルタニュートラル** | Used verbatim; the credibility keyword. |
| Carry / earning the funding | **金利分を稼ぐ**, **金利受け取り**, **金利トレード** | Funding is framed as *interest received*, not "carry." |
| Both-sides hedge (the structure) | **両建て (りょうだて)** | The native word for the spot+short hedge. |
| Traditional cash-and-carry arb | **サヤ取り / さや取り**, **裁定 (さいてい)** | Legacy futures-arb vocabulary; ファンディングレート裁定 = funding-rate arbitrage in pro posts. |
| Liquidation | **ロスカット**, **清算** | ロスカット = forced stop-out (retail term); 清算 = settlement/liquidation (formal). |
| "Shorts pay longs" | **ショートがロングに支払う**, **ショート過剰→マイナスFR** | Negative FR (マイナス値, 赤いバー) = shorts crowded → longs get paid → short-squeeze setup. |
| Set-and-forget | **放置できる** | The passive-income appeal phrase. |
