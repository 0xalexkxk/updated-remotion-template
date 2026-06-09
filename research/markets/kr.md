# Korean funding-rate arbitrage — X research for the Vibe card

**Winning format: a "수익 꿀통" reveal card — a single image showing a delta-neutral funding-rate yield, framed as found money the reader is missing.** The post that won (`@hakunam77616815`, 153 likes) opens "[ edgeX 24시간의 펀딩비 꿀통 대공개 👀 ]" — *"edgeX's 24-hour funding-rate honeypot, revealed."* It promises a concrete number, attaches a card, and lets the reply thread fill with people asking how. Korea reads funding-rate arbitrage as **수익** (profit you can prove), not as **차익거래** (an abstract strategy). Lead with the yield, not the mechanism.

## TL;DR (front-loaded)

- **Top format:** profit-reveal card + delta-neutral explainer. Big annualized number, one screenshot, short Korean caption, a named venue.
- **Median engagement:** 63 likes across 19 analyzed posts (top = 153). Modest counts — this is a niche, campaign-driven topic, not a viral one.
- **The KR-specific signal:** the entire live conversation is owned by two yield campaigns — **edgeX** and **StandX (DUSD)** — and is carried by **수익 인증** (proof-of-profit) culture. The card must *show a number*, not explain a concept.
- **Adjacency:** 김프 (kimchi premium) is currently *negative* (역프) per the recap posts — do NOT frame the arb as "Upbit spot vs offshore perp" the way 2021 posts did; that trade is dead right now. Frame it as on-venue delta-neutral carry.

## Data caveats (state exceptions out loud)

The metered cache strips **media entities, bookmark counts, and follower counts**. So `hasMedia`, `bookmarks`, and `followers` are unverifiable and marked `null` in `kr.json`. Format is inferred from text patterns ("대공개 👀", "꿀통", "수익", multi-part "1편/2편" threads), which in this genre reliably signal an attached card or screenshot. Engagement is ranked on `likes + 2×retweets` with views as tiebreak.

One more: high **reply-to-like ratios** (often 1:1, e.g. 153 likes / 136 replies) mark these as **airdrop / campaign engagement-farming** posts. The replies are "gm participating" entries, not discussion. Treat the engagement as campaign-amplified, not organic reach.

## Top 10 posts

| # | Author | Likes | RT | Replies | Views | Format | What it does |
|---|---|---:|---:|---:|---:|---|---|
| 1 | @hakunam77616815 | 153 | 0 | 136 | 4,938 | Profit-reveal card | "edgeX 24h 펀딩비 꿀통 대공개" — reveals a yield number, card attached |
| 2 | @xkiugi | 120 | 0 | 119 | 924 | Yield-mechanism explainer | "eLP는 장기예치가 유리하다" — accrual-over-time framing, not direction |
| 3 | @BULL_BEAR00 | 81 | 0 | 74 | 1,793 | Delta-neutral thread (2편) | StandX DUSD 델타 헷징 + 펀딩비 수익, backtest vs Binance |
| 4 | @umbosip | 77 | 1 | 67 | 724 | Campaign promo (playful) | StandX participation hook, persona/character voice |
| 5 | @HyunkunO | 78 | 0 | 80 | 668 | Proof-of-profit | "0.2 BTC 숏포지션 24시간" — short position + funding, "혜자" (great value) |
| 6 | @BULL_BEAR00 | 78 | 0 | 72 | 1,026 | Synthetic-dollar explainer | DUSD as synthetic stable, asset-selection angle |
| 7 | @heungmangoo | 75 | 1 | 54 | 2,905 | Campaign storytelling | StandX seasonal/narrative post |
| 8 | @BlockChain_CK | 69 | 4 | 63 | 2,808 | Event announcement | reya×Teller livestream on "펀딩 레이트 차익거래 전략" |
| 9 | @Special_Ledger | 63 | 6 | 21 | 4,646 | Proof-of-profit screenshot | "5시간동안 1천달러 일당 수익" — daily-wage profit framing |
| 10 | @BULL_BEAR00 | 67 | 1 | 63 | 2,071 | Delta-neutral thread (1편) | DUSD 델타 헷징 펀딩비 수익, "한 줄 요약" lede |

(#11 @MargaTz HyperEVM-speed yield angle, #12 @heungmangoo StandX vs stbl comparison card.)

## Design takeaways for a STATIC Korean card

1. **Lead with the number, in 연환산 (annualized) form.** The winning posts promise a yield up front. Put a large **연환산 수익률 XX%** as the hero. Korean readers anchor on the APR, then read the mechanism.
2. **Frame it as 수익, not 차익거래.** "차익거래" reads academic; "펀딩비 수익" / "펀딩비 받기" reads like money you collect. Use the receiving verb — **펀딩비를 받는다** ("you *receive* the funding").
3. **Use the 델타중립 keyword explicitly.** Every credible post names **델타중립** (delta-neutral) or **델타 헷징**. It is the trust signal that says "not directional, not gambling." Without it the card looks like a long/short tip.
4. **Show the two legs as a pair, side by side.** 현물 매수 (spot long) + 무기한 선물 숏 (perp short) → the position nets to zero price exposure and *collects* funding. A two-column or two-row card mirrors how the explainer threads (1편/2편) lay it out.
5. **State who pays whom.** The exact winning phrase: **롱이 숏에게 펀딩비를 지급** ("longs pay shorts"). When funding is positive (양수), the short side — your side — receives. This one line is the whole trade.
6. **Drop the 김프 / Upbit-vs-offshore framing.** The market-recap posts say 김치 프리미엄 is currently *negative* (역프, 김프 소멸). The old "buy Upbit spot, short offshore perp" arb is not live. Frame Vibe's card as **on-venue carry** (HyperEVM, single venue), which also matches edgeX/StandX positioning.
7. **Borrow the "꿀통 / 혜자" register, sparingly.** "꿀통" (honeypot / sweet deal) and "혜자" (great value for money) are the words that won. One of them in the caption — not the hero — signals native fluency. The hero stays clean and numeric (Apple-style); the slang lives in the supporting line.
8. **Keep it one screenshot's worth.** No thread. The card *is* the proof. Mirror the proof-of-profit aesthetic: a single framed result a reader could screenshot and repost.

## Vocabulary glossary — the exact terms winning posts use

| Concept | Korean term(s) used | Notes |
|---|---|---|
| Funding rate | **펀딩비** (formal) · **펀비** (slang) | "펀딩비" is universal; "펀비" appears in casual posts. "펀딩 레이트" also seen (loanword). |
| Spot | **현물** | 현물 매수 = spot buy / long the spot leg. |
| Perpetual (futures) | **무기한 선물** · **무기한선물** (no space, common) · **퍼프 / 퍼페추얼** (slang, rarer) | "선물" alone = futures generally; specify 무기한 for perps. |
| Basis | **베이시스** · **현·선 괴리** (spot-futures gap) | "베이시스" is the direct loanword; "현선 괴리" is the descriptive native term. |
| Annualized yield | **연환산 수익률** · **연 수익률** · **APR** | "연환산" = annualized; lead the card with this. |
| Delta-neutral | **델타중립** · **델타 헷징** | The credibility keyword. Use it. |
| Carry | **캐리** · **펀딩 캐리** · (described as) **시간이 지날수록 누적되는 수익** | No clean native word; "캐리" loanword or describe as time-accruing yield. |
| Liquidation | **청산** | 청산 위험 = liquidation risk. Reassure: delta-neutral lowers but does not erase it. |
| "Shorts get paid / longs pay shorts" | **롱이 숏에게 펀딩비를 지급(한다)** · **숏 포지션이 펀딩비를 받는다** | The load-bearing sentence. When 펀딩비 양수(positive) → shorts receive. |
| Proof of profit | **수익 인증** | The cultural format. "인증" = verified/proof. |
| Kimchi premium | **김치 프리미엄** · **김프** · negative = **역프** | Currently 역프 — do not build the arb around it. |
| "Sweet deal" / honeypot | **꿀통** · **혜자** | Native slang that won; supporting line only. |

---

*Sources: 19 posts tagged `vibe-research-kr` in `cache/tweets.jsonl`, fetched via twitterapi.io advsearch (8 queries). Top conversation owned by edgeX and StandX (DUSD) funding-yield campaigns. Engagement is campaign-amplified; reach is niche.*
