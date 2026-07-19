'use strict';
/* Waypoint v1.2 — data layer. Snapshot 2026-07-16.
   Sources: research packages 1-6 (Personal apps/waypoint/research/research-*.md).
   v1.1 (research-5): all instrument yields are now NET of fund fees (TER) — the old
   blends quoted gross YTMs, which overstated income by ~0.12-0.20%. Blends rebuilt
   around Joël's real structure: ≈€100k crash-deployable dry powder + ≈€225k apartment
   core + ≈€25k accepted 4-year burn. Term deposits retired (see dep card + research-5).
   v1.2 (research-6, 2026-07-16): OFF-RAMP CORRECTIONS — KH demoted (20% worldwide CGT
   live since 1 Jan 2026; old card was wrong), PH promoted to PRIMARY anchor (+ §42(E)
   sourcing flag), TH remittance warning widened (ATM/card spend counts), guardrail 9 =
   hub-click (execute EVERY sale physically in SG/HK/AE), Kraken address rule superseded
   (PH at the START of travels, not after TRC), NL exit-tax Prinsjesdag monitor,
   A–F decision-tree playbook card (Scenario E retired).
   v1.3 (2026-07-16): REAL COL — the frugal (col.f) number for every hand-costed
   country now comes from Joël's line-by-line COL verification ledger (his real
   lifestyle: 1BR condo w/ pool+gym, 330g beef/day, cafe-working; ex-insurance,
   IMG €120 still a separate Match line). Replaces the old guide ×0.7 frugal
   estimates for TH/VN/KH/MY/JP/PH; guide 'normal' kept as the upper band (JP
   normal raised to stay above his real cost). PH now carries a `places` array —
   Cebu (condo) + lean-beach Siquijor + Valencia/Dumaguete — each hand-costed,
   plus a country-average row. Hand-costed figures carry `verified:true` and show
   a ✓ hand-costed mark in Match. Un-costed countries (GE/CZ/ID/SI) unchanged.
   v1.7 (2026-07-16): ACCOMMODATION + PROTEIN refinements from the living ledger —
   only Chiang Mai keeps the pool+gym condo; VN/KH/MY + PH-Cebu re-costed to a regular
   condo (no pool+gym) so frugal drops: VN 1024→974, KH 941→911, MY 1045→975,
   PH-Cebu 1078→1048 (PH mean 889→879). Thai islands switch protein to a chicken-
   forward mix (0/80/20 — imported island beef too dear): Koh Phangan 1297→1214,
   Koh Lanta 1224→1130. New marks: ★ pool+gym (Chiang Mai only) · ◆ beef-not-main
   (the two islands).
   v1.8 (2026-07-16): INDIA folded in as a live-only country (NEVER an anchor) — 6
   hand-costed places (Tiru 652 · Dharamkot 688 · Mysore 710 · Arambol 858 · Varkala
   870 · Assagao 998; country f = mean 796). All carry ◆ beef-not-main (goat-forward
   mix, beef banned). New `avoid` field = LOUD residency hard-avoid warning (182/FY →
   30% worldwide crypto + the 60/365 trap) with a red "residency: hard-avoid" tag.
   v1.10 (session 2026-07-17): NEW iBONDS SHELF — iShares filled the ladder since
   research-5: Dec 2029 (29GI, 3.18 net) and Dec 2031 (31IG, 3.57 net — matures AT
   the default plan end) added as cards. All three blends rebuilt on the new shelf,
   SAME ids: safety swaps ib28→ib29 (same skeleton, +€10/mo); target3 becomes
   MODULAR — €100k powder + €133k iBonds-2030 completion tranche ≈ €234k that can
   buy the NL home outright at ANY early-return date while a €116k iBonds-2031
   lock rides to maturity untouched (dual-destination powder, his framing);
   allig core moves ib30→ib31 (+€51/mo). ib28 RETIRED from blends (dominated by
   ib29; card kept). Crossover iBonds (IX29, 4.18 net, IG+BB mix) evaluated and
   REJECTED — breaks the pure-IG principle. Re-verify all yields after the ECB
   decision of 23 Jul 2026 (stamps are Apr/May 2026).
   v1.14 (2026-07-19): 4th blend 'deploy' — outcome of the crash-dive / powder
   exchange-rate study (his crypto lens: sell BTC −10% to buy alts −30% = a 3:1 bar.
   EUR high yield as powder FAILS it: ≈1.5:1 in exactly the big crashes — HY is
   another altcoin, not BTC; short IG passes). Powder rule deliberately changed ON
   JOËL'S CALL from crash-PROOF to BOUNDED-LOSS: 7% MMF checking float (≈€25k —
   bridges mid-2027 departure → Dec 2029 alongside distributions) + 22% iBonds-2029
   deploy sleeve + 71% iBonds-2031 lock = 3.39 net, +€38/mo over Max yield.
   Deploy exchange at a 2028 credit-crash trough ≈ 12:1 vs stocks −35 (≈5:1 in a
   2022-style rate shock — the float + short duration keep even that above the bar).
   Beats Max yield in ALL rebuilt-sim scenarios incl. 1929 (pull-to-par heals every
   mark); the price is the deploy-moment haircut (≈€2.9k per €100k raised) and the
   lost govt crash-rally trade. ib29 pays out ≈€77k cash Jan 2030 — the powder
   auto-refills for the 2030-31 home window.
   v1.18 (2026-07-19): THE TIME LAYER + three strategy gaps closed (his call: "build
   #2 and #4 now"). (a) MONITORS array + Agenda card at the top of Path — dated
   deadlines (ECB 23 Jul, the hard NL-deregistration deadline, iBonds maturities) +
   the recurring Prinsjesdag check (next 3rd-Tue-of-Sep computed live) + standing
   verify-items (TH decree, TH bank-on-DTV, GE SBS, PH §42(E) opinion, AOW window).
   Stamp-age flags app-wide: STALE_DAYS (declared v1.2, unused until now) drives
   amber "re-verify" marks on stamps older than 183 days + a freshness line in the
   Agenda card. (b) BOOMERANG (art. 2.2 Wet IB, researched Jul 16): new Playbooks
   card + gate lines in pump/return/tree/x5 — re-settling in NL within 12 months of
   departure without having lived (and been taxed as resident) in another state =
   deemed NL-resident the WHOLE time, retroactively. Rule: no sale in months 0–12
   unless certain of no NL re-settlement before the anniversary. (c) SECONDARY
   RESIDENCY TESTS: `res` field on VN/JP/KH/CZ/SI/ID — lease/abode/domicile/intent
   tests that catch BELOW the day count (TH/PH/GE/MY/IN are day-count-only); Path n1
   discipline widened to day limits AND no dwelling kept AND no vital-interest anchor.
   (d) EURO-EXIT TRIGGERS Playbooks card: the EUR regime risk no EUR bond can hedge —
   predefined triggers + a 10–15% gold/CHF/USD response ladder, deliberately NOT
   armed today (the trigger list is the insurance). (e) nlmotion card upgraded with
   the enactment-speed analysis (fast-path ceiling ≈3.5 months via the Belastingplan
   incl. press-release retroactivity, Dec 2025 status = exploration only + punted to
   the next cabinet, watch formation docs too, NL–PH treaty/TRC blunting).
   Not financial, tax, legal or immigration advice — verify load-bearing items locally. */

const DATA_STAMP='2026-07-19';
const ECB_STAMP={dfr:2.25,asOf:'2026-06-17',estr:2.18,note:'ECB decides again 23 Jul 2026 — hiking cycle; re-stamp snapshots after'};
const MMF_SPREAD=-0.08;   // MMF-ETF yield ≈ DFR − 0.08 (derivable live)
const INSURANCE=120;      // IMG Global ~€120/mo — his researched pick, named so he remembers which one won
const HORIZON_MO=60;      // Jan 2028 → Dec 2032 (pivot 2028 = constant, not editable)
const HORIZON_LABEL='2028 → 2032';
const STALE_DAYS=183;

/* v1.18 — the Agenda (rendered at the top of Path). Dated items sort by due date and
   go amber inside 60 days, red past due; `prinsjesdag:true` computes the next 3rd
   Tuesday of September live (the watch runs EVERY year until actual departure).
   Undated items = standing monitors: verify-before-acting flags with no calendar
   date of their own. Resolving a dated item = do the thing, then update/remove the
   entry in the next build (the app never silently un-flags itself). */
const MONITORS=[
  {due:'2026-07-23',t:'ECB decision — re-stamp the yield snapshots',
    d:'Hiking cycle. After the decision: re-stamp DFR/€STR + the instrument yields (oldest stamps Apr–May 2026) and bump the data snapshot. The Engine drift line warns meanwhile. Path p4.'},
  {prinsjesdag:true,t:'Prinsjesdag — NL exit-tax / inwonerschapsfictie check',
    d:'Check the Belastingplan package + the emigrant-exit-tax exploration AND the new cabinet’s formation/tax agenda. If a concrete bill lands, accelerate the exit — the fast path is ≈3.5 months to entry into force (see the Playbooks monitor card). Every September until departure.'},
  {due:'2027-12-31',t:'Hard deadline — NL deregistration complete before 1 Jan 2028',
    d:'The pivot constant: vermogensaanwasbelasting treated as fixed for 2028. Target departure mid-2027 leaves ~6 months of slack. Path x5 is the master-shield checklist; the AOW 1-year window opens the day this happens.'},
  {due:'2030-01-01',t:'iBonds-2029 pays out ≈€77k cash (Priced powder)',
    d:'The deploy sleeve matures at par — powder auto-refills for the 2030–31 home window. Decide then: re-park (MMF / next rung) or hold as the home tranche.'},
  {due:'2032-01-01',t:'iBonds-2031 pays out — the plan-end lock matures',
    d:'Cash lands at par exactly at the Dec 2031 plan end. The Fork decision (stay vs return) should already be made by now.'},
  {t:'TH remittance decree — monitor, never plan on it',
    d:'Revived draft (exempt if remitted in the year earned or the next) still awaiting Cabinet + Royal Gazette. Until it is published law, the no-remit leash is permanent.'},
  {t:'TH bank-on-DTV — THE gate on the onshore route',
    d:'BBL/KBank/SCB reject DTV accounts since the 2025–26 anti-scam crackdown; no Thai bank = no onshore 0% route. Verify at a branch before committing to TH as anchor. (The offshore Scenario-F route needs no Thai bank.)'},
  {t:'GE — coaching ≠ consulting for the 1% SBS',
    d:'Confirm the classification with a local advisor before counting on 1%; “consultancy” is SBS-excluded, fallback 20%. Only bites if GE becomes the anchor.'},
  {t:'PH lawyer — written §42(E) opinion pending',
    d:'The sharpened three-part question is in the dossier. The hub-click (guardrail 9) moots the ambiguity meanwhile; the opinion decides how much the continuity stay matters. Path p9.'},
  {t:'AOW buy-in — the 1-year window opens at departure',
    d:'Vrijwillige voortzetting must be requested at SVB within 1 year of leaving NL — decide it at Exit, not later. Becomes a dated deadline the day the BRP uitschrijving happens.'}
];

/* All yld values are NET of TER (fund fee) — YTM/YTW figures published by fund
   providers exclude fees, so net = published yield − TER. Schatz has no wrapper. */
const INSTRUMENTS={
  mmf:{name:'Money-market ETF',ref:'Xtrackers XEON (LU0290358497) · TER 0.10%',yld:2.17,live:true,stamp:'2026-07-10',
    risk:'Counterparty (synthetic swap, UCITS-capped at 10%). Zero duration, zero credit.',
    liq:'Intraday sale, cash T+2 — fastest on this list.',
    crash:'The dry-powder king. Mar 2020: overnight-swap ETFs kept accruing, no NAV dent. Spendable within days even in a 1929-style event.',
    hold:'UCITS ETF — holdable at IBKR/Swissquote wherever you are.',
    powder:1},
  frn:{name:'Floating-rate IG ETF',ref:'Amundi FRNE (LU1681041114) · TER 0.18% · yld = estimate',yld:2.50,stamp:'2026-07-14',
    risk:'IG credit spread, near-zero duration — coupons RESET quarterly with €STR, so rate moves barely touch the price (1y volatility 0.21%).',
    liq:'Intraday.',
    crash:'Worst dip ever −3.8% (Mar 2020), 5-year max drawdown −1.46%; recovers in weeks. Second-line dry powder.',
    hold:'UCITS ETF.',
    powder:3,
    note:'≈ MMF + ~0.3% for a small credit sleeve, and it floats UP if the ECB keeps hiking. Yield is an ESTIMATE (€STR + spread − TER; fund publishes no YTM) — verify the trailing return at purchase.'},
  govt:{name:'Short govt-bond ETF 1–3y',ref:'iShares IBGS · TER 0.20% · WAM 1.7y · gross YTM 2.68%',yld:2.48,stamp:'2026-06-22',
    risk:'Small duration (≈ −1.7% per +100bp); eurozone sovereign mix, mild IT/ES spread risk.',
    liq:'Intraday, deep market.',
    crash:'Flight-to-quality asset — typically RALLIES in equity crashes. Sell high to buy the bottom. Second-best dry powder.',
    hold:'UCITS ETF — same as MMF.',
    powder:2},
  schatz:{name:'German 2y held to maturity',ref:'Bund Schatz · no wrapper, no TER',yld:2.71,stamp:'2026-07-03',
    risk:'None in EUR terms if held to maturity — the eurozone risk-free benchmark.',
    liq:'Same-day sale possible (deep market); at maturity the exit value is known to the cent.',
    crash:'Rallies in crises; the classic 1929 survivor.',
    hold:'Needs a bond-capable broker → a point for IBKR; many retail EU brokers can’t.',
    powder:2},
  ib28:{name:'iBonds Dec 2028 — fixed-maturity IG',ref:'iShares IVOA/IB28 · TER 0.12% · gross YTW 3.18% · pays out cash ~1 Jan 2029',yld:3.06,stamp:'2026-05-07',
    risk:'IG credit (~390 issuers) + duration 2.1 that SHRINKS to zero at maturity. Hold to Dec 2028 and today’s yield is locked, end value known.',
    liq:'Trades like a stock — sell any weekday, cash T+2, from anywhere. Early sale = market price: worst case ≈ −2–4% if sold into a rate spike or panic, fading to ~0% near maturity.',
    crash:'Self-healing by construction: whatever the dip, pull-to-par ends it by Dec 2028 (bar defaults — IG default rate ~0.1–0.2%/yr, spread over ~390 names).',
    hold:'UCITS ETF.',
    powder:4,
    note:'RETIRED from all blends (Jul 2026): the new Dec 2029 rung pays 3.18% net for the same fixed-maturity idea one year longer — it dominates every role this fund played. Card kept so the ladder history stays visible.'},
  ib29:{name:'iBonds Dec 2029 — fixed-maturity IG',ref:'iShares 29GI (dist, IE000IHURBR0) · TER 0.12% · gross YTW 3.30% · pays out cash ~1 Jan 2030',yld:3.18,stamp:'2026-04-30',
    risk:'IG credit (~353 issuers) + duration 3.0 that SHRINKS to zero at maturity. Hold to Dec 2029 and today’s yield is locked, end value known.',
    liq:'Sell any weekday, cash T+2, from anywhere. Early sale worst case today ≈ −3–4% (rate spike + panic combined), fading to ~0% near maturity.',
    crash:'Self-healing: pull-to-par ends any dip by Dec 2029 (bar defaults — IG ~0.1–0.2%/yr, spread over ~350 names).',
    hold:'UCITS ETF.',
    powder:4},
  ib30:{name:'iBonds Dec 2030 — fixed-maturity IG',ref:'iShares 30IG/30IA · TER 0.12% · gross YTW 3.44% · pays out cash ~1 Jan 2031',yld:3.32,stamp:'2026-05-08',star:'the apartment tranche',
    risk:'IG credit (~310 issuers) + duration 3.8 shrinking to zero at maturity. Locked yield to Dec 2030.',
    liq:'Sell any weekday, cash T+2. Early sale worst case today ≈ −4–6% (rate spike + panic combined), shrinking every year toward zero at maturity.',
    crash:'Self-healing: any drawdown ends at the printed date. Maturity lands cash EXACTLY in the 2030–2032 return-to-NL window — then re-park or spend.',
    hold:'UCITS ETF.',
    powder:4},
  ib31:{name:'iBonds Dec 2031 — fixed-maturity IG',ref:'iShares 31IG (dist, IE000I2WYEU9) / IG31 (acc) · TER 0.12% · gross YTM 3.69% · pays out cash ~1 Jan 2032',yld:3.57,stamp:'2026-05-15',star:'the plan-end lock',
    risk:'IG credit (~261 issuers) + duration 4.7 shrinking to zero at maturity. The highest locked yield on the shelf — and it matures AT the default plan end (Dec 2031).',
    liq:'Sell any weekday, cash T+2. Early sale worst case today ≈ −5–8% (rate spike + panic combined), decaying fast as maturity nears: ≈ −3–4% by 2029, ≈ −1% by 2031. Partial sales are fine — it’s an ETF, sell only the euros needed.',
    crash:'Self-healing: pull-to-par by Dec 2031. In the blends this is the slice that never needs to move — plans changing is what the powder and the 2030 rung are for.',
    hold:'UCITS ETF.',
    powder:4},
  ig:{name:'IG corp-bond ETF 1–5y (evergreen)',ref:'iShares € Corp 1-5yr · TER 0.20% · WAM 3y · gross YTM 3.20%',yld:3.00,stamp:'2026-06-26',
    risk:'IG credit spread + ~2.8 duration — and NO maturity date: the −7% question stays open-ended (fund rolls bonds forever).',
    liq:'Intraday — but see crash behavior.',
    crash:'Mar 2020: −6/−7% AND traded at a discount to NAV — selling INTO a panic costs the discount on top. Recovered within months. Hold-through-storm money, not dry powder.',
    hold:'UCITS ETF.',
    powder:4,
    note:'Superseded in all blends by the iBonds pair (same net yield, but with a repair date on the calendar). Still the tool if an evergreen rolling IG sleeve is ever wanted.'},
  erne:{name:'Ultrashort IG ETF',ref:'iShares ERNE · TER 0.09% · WAM 0.7y · gross YTM 2.69%',yld:2.60,stamp:'2026-06-04',
    risk:'IG credit spread, minimal duration.',
    liq:'Intraday.',
    crash:'Mar 2020: low-single-% dip, recovered within weeks after the ECB backstop.',
    hold:'UCITS ETF.',
    powder:3,
    note:'Sits between the FRN and govt on every axis without beating either. Skippable unless spreads widen.'},
  dep:{name:'Term-deposit ladder — RETIRED',ref:'Raisin marketplace · 1y ≈2.99% / 2y ≈3.05% gross',yld:3.05,stamp:'2026-07-14',
    risk:'Bank credit, capped by the €100k/person/bank guarantee → €350k must split across 4+ banks.',
    liq:'None — locked to maturity (death/bankruptcy-grade exceptions only).',
    crash:'Zero mark-to-market, nominal guaranteed — and zero dry powder. Anti-powder: locked money can’t buy a bottom.',
    hold:'⚠ Raisin is residence-tied — the worst property for a nomad plan.',
    powder:5,
    note:'RETIRED from all blends (research-5, Jul 2026): the iBonds ETFs dominate on every axis — same locked-yield idea but higher net yield, sellable any day, no €100k-per-bank juggling, no residency tie. Card kept so future passes remember WHY deposits lost.'}
};

const POWDER_RANK=['','pure dry powder','rallies in a crash','mild dip, quick recovery','hold through the storm','anti-powder (locked)'];

/* Blends v1.10 (new iBonds shelf, 2026-07-17) — same spine: ≈29% (≈€100k) dry powder
   that never falls in a crash and sells in 2–4 business days, + a core locked to
   printed maturity dates inside the 2030–2032 return window. Ids kept ('target3'
   now renders "Early home") so a saved plan in localStorage survives.
   v1.17 (2026-07-19): display names → the RISK-STORY set, his pick (ids unchanged):
   safety "Never red" · target3 "Early home" · allig "Safe powder" · deploy "Priced
   powder". Rationale: the %/€ column already tells the reward story, so the name
   carries the risk story — what the powder is and which option each mix preserves
   ("Max yield" had become false next to deploy's 3.39).
   DUAL-DESTINATION POWDER (his framing, Jul 2026): the €100k powder is an option on
   whichever opportunity shows up — crash-deploy into cheap stocks/BTC, OR the first
   tranche of an early NL home purchase. One pot, one choice, made at the moment;
   a crash makes property AND stocks cheap at once, so using it one way foregoes
   the other. The Early-home blend is built so powder + the 2030 rung together reach
   apartment money (≈€234k) without ever breaking the 2031 lock.
   All yields NET of fees — v1.1 blends for history: safety 2.71, target3 2.99, allig 3.08.
   v1.12 (2026-07-18): per-instrument `why` — each slice's earned place, blend-specific
   (the two-panic-flavours reasoning from the Jul 18 session now travels with the blend).
   v1.14 (2026-07-19): + 'deploy' — the ONE blend that deliberately breaks the
   crash-proof-powder spine: bounded-loss ib29 sleeve + €25k float instead of the
   ≈€100k no-loss pot (his call; rationale in the header v1.14 block). */
const BLENDS=[
  {id:'safety',name:'Never red',sub:'≈€100k powder (MMF+govt) + core in Schatz rolls & iBonds-2029 — nothing meaningfully red, ever; ≈€245k sellable within days',
    mix:{mmf:.12,govt:.17,schatz:.42,ib29:.29},
    why:{
      mmf:'First-line cash. The one slice with no minus sign in ANY panic — including a 2022-style rate spike, where even short govts go red. Spendable in days, and it floats UP with ECB hikes.',
      govt:'Crash-rally powder. 1–3y govts are the flight-to-quality asset: in an equity crash they usually RISE — you sell high exactly when everything else is cheap.',
      schatz:'The safe core. German 2y held to maturity: no fund fee, no credit worry, and mid-life price wobbles don’t matter — it pays out at par on a printed date, then rolls.',
      ib29:'The yield engine of this blend. IG corporates locked to Dec 2029: any dip must close by the printed maturity (pull-to-par) — a drawdown with an end date.'}},
  {id:'target3',name:'Early home',sub:'DUAL-DESTINATION powder: €100k powder + €133k iBonds-2030 ≈ €234k that can buy the NL home outright at ANY early-return date (early-exit cost ≈ −1–3% worst case, €0 from Jan 2031) — or stays invested as crash powder + apartment tranche if plans hold. The €116k iBonds-2031 lock rides to maturity untouched either way.',
    mix:{mmf:.05,govt:.24,ib30:.38,ib31:.33},
    why:{
      mmf:'The checking-account tier — known to the euro in EVERY panic flavour, even a 2022-style rate spike where govt paper is red too. Costs ≈€8/mo vs parking it in Schatz (on a €350k book): the price of a slice that can never show a minus at the worst moment.',
      govt:'The crash powder. Flight-to-quality paper that usually rallies in exactly the panic you’d deploy into — bonus yield AND a bonus sale price, one-click ETF sale from anywhere.',
      ib30:'The home-completion tranche. Cashes out Jan 2031; together with the powder ≈ €234k — apartment money at ANY early-return date (worst early exit −1–3%, €0 from Jan 2031).',
      ib31:'The plan-end lock. Top net yield on the shelf, pays out cash ~Jan 2032 exactly at plan end. The slice that never needs to move — which is why it can afford to be the longest.'}},
  {id:'allig',name:'Safe powder',sub:'FRN-boosted powder + everything else locked in iBonds-2031 to plan end — max extraction; an early home purchase here means waiting for the Jan 2032 cash-out or shaving small slices off the lock early',
    mix:{frn:.14,govt:.15,ib31:.71},
    why:{
      frn:'Powder with a yield kicker. IG floating-rate notes ≈ MMF +30bp, coupons reset quarterly so it floats UP with hikes. Worst dip ever −3.8%, recovered in weeks — second-line powder, not first-line.',
      govt:'Keeps one true crash-rally line in the powder: FRN dips a little in a panic, short govts usually rise — together they cover both panic flavours.',
      ib31:'Everything else, locked to plan end at the shelf’s top net yield — max extraction, with a printed Jan 2032 payout so every drawdown has a date-certain end.'}},
  {id:'deploy',name:'Priced powder',sub:'BOUNDED-LOSS powder (Jul 2026 rethink): ≈€25k MMF checking float + ≈€77k iBonds-2029 deploy sleeve — worst crash mark ≈ −4–8% today, shrinking every year and healed by the printed Dec 2029 date, after which it IS cash for the 2030-31 window — + ≈€248k locked to plan end. Sell the sleeve at ≈−3–4 to buy a −30% market (≈12:1 exchange): the crash-proof-powder rule traded for ≈+€38/mo over Safe powder.',
    mix:{mmf:.07,ib29:.22,ib31:.71},
    why:{
      mmf:'The checking float, not crash powder: ≈€25k that can never print a minus, sized to bridge living costs alongside the distributions until the 2029 rung matures. First euros out of any raise.',
      ib29:'The bounded-loss deploy sleeve. Short and shrinking duration: crash marks ≈ −4% by 2028, healed by the printed date. Selling at −3–4 to buy stocks at −30 ≈ 12:1 in a credit crash, ≈5:1 even in a 2022-style rate spike — both clear the 3:1 crypto bar (sell BTC −10, buy alts −30). Pays out ≈€77k cash Jan 2030: the powder refills itself for the home window.',
      ib31:'The plan-end lock, same slice as Safe powder: the shelf’s top net yield, paying out cash ~Jan 2032 exactly at plan end. Deploys come from the float and the 2029 sleeve — this slice never needs to move.'}}
];

const BROKERS=[
  {n:'IBKR',star:true,v:'ok',glyph:'✓',word:'survives',d:'Keeps clients on relocation. Open while still NL-resident (signup wants A tax residency), update to the anchor later. Trades bonds (Schatz). Withholding follows declared residency.'},
  {n:'Swissquote',star:true,v:'ok',glyph:'✓',word:'survives',d:'Built for expats — “keep the same account every time you move”. CHF 10k min, non-resident surcharge ~CHF 10–30/mo (cheap insurance). Swiss custody = outside the EU regulator, still CRS-reports to declared residence.'},
  {n:'DEGIRO',v:'bad',glyph:'✕',word:'dies on exit',d:'The one you actually use — supported-country list; moving outside → forced close/transfer (documented). Exit before leaving NL.'}
];

/* Countries — 13, role-tagged. Adding one = one entry, no code. */
const COUNTRIES=[
  {cc:'PH',n:'Philippines',f:'🇵🇭',roles:['anchor','live'],stamp:'2026-07-16',primary:true,
    col:{f:879,n:1250,city:'3 places costed',conf:'med',verified:true,note:'Hand-costed = mean of the three hand-costed places listed below (his real lifestyle, ex-insurance); Comfort = guide estimate. Manila higher, provinces lower.'},
    places:[
      {name:'Cebu',sub:'regular 1BR condo',f:1048,conf:'med',verified:true,note:'Regular 1BR condo, NO pool+gym (Jul 2026 — only Chiang Mai keeps pool+gym). Mainland beef supply, ~15min out. Priciest PH place.'},
      {name:'Siquijor',sub:'lean beach island',f:850,conf:'med',verified:true,note:'Home wifi weak → Eden/Starlink coworking (~$45/wk) doubles as workspace (biggest line); no pool/gym; beef stocked on Dumaguete ferry runs.'},
      {name:'Valencia / Dumaguete',sub:'lean, mainland-priced',f:739,conf:'med',verified:true,note:'Cheapest costed — real supermarkets, mainland beef ~€7/kg, no coworking premium, BI office in town for visa extensions.'}],
    stay:'30 days free, then famously extendable — up to ~36 months without leaving. SRRV (age 40+, ~$15–25k refundable deposit, $1.5k once + $360/yr) is optional convenience, not required.',
    work:'Territorial for individuals: foreign-source coaching 0%. But work performed while IN PH = PH-source, progressive to 35% (same source rule as TH).',
    anchor:{verdict:'THE primary off-ramp anchor — territorial 0% at ANY residency status',
      trc:'180+ days present → resident alien; BIR tax-residency certificate is routine. The 0% does NOT depend on it: resident alien, NRAETB and NRANETB are ALL territorial — 180 days only buys the TRC paper. No special visa needed (tourist visa extends ~36 months); SRRV optional.',
      coach:'0% foreign-source / up to 35% on PH-performed days.',
      off:'0% — individual foreign-source gains, incl. crypto sold on a foreign exchange, are untaxed at ANY residency status. No remittance basis for aliens: wiring the proceeds into PH to live on is FINE (the opposite of TH). Kraken supported.',
      gates:['§42(E) “sold within” question: if the sell-click happens on PH soil, BIR could argue PH-source (BOAC “income-producing activity” hook). Foreign-source is the better view (place-of-delivery, Shell v. Sipocot) but unsettled — mitigation = guardrail 9, the hub-click: execute the sale from SG/HK/AE (see Playbooks). Written lawyer opinion pending.',
        'Source rule bites coaching done on PH soil — perform/bill offshore or accept up to 35% on PH-day income.']}},
  {cc:'GE',n:'Georgia',f:'🇬🇪',roles:['anchor','live'],stamp:'2026-07-16',
    col:{f:1160,n:1350,city:'Tbilisi',conf:'med',verified:true,note:'Hand-costed = line-by-line for a ~6-month off-ramp stay (his real lifestyle, ex-insurance): PLAIN 1BR, NO pool+gym (a luxury feature in Tbilisi), works mostly from home (lighter cafe spend). Lands far above the old €725 guide — pool+gym does not translate, no cheap tropical shake/street-food culture, European beef + groceries, winter gas-heating spike. Comfort = guide estimate'},
    stay:'365 days visa-free (EU passport), renewable by border run — 183 days reachable with no permit at all.',
    work:'IE + Small Business Status → 1% on turnover ≤500k GEL (~€170k). ⚠ “Consultancy” is SBS-excluded — if coaching is classed as consulting, fallback = 20% PIT on GE-performed work.',
    anchor:{verdict:'best value — cheapest credible TRC, 0% crypto',
      trc:'183+ days in any 12-month window → file via rs.ge, ~€0, doable by POA. HNWI backup: worldwide assets >$500k = 0-day route (a crypto pump puts him over — remember it).',
      coach:'1% SBS if classification lands; else 20%.',
      off:'0% — 2019 MoF ruling: individual crypto gains = foreign-source under the territorial system. Unchanged 2026. Kraken supported.',
      gates:['Verify coaching ≠ consulting for SBS with a local advisor before counting on the 1%']}},
  {cc:'TH',n:'Thailand',f:'🇹🇭',roles:['anchor','live'],stamp:'2026-07-16',
    col:{f:921,n:1400,city:'Chiang Mai',conf:'med',verified:true,note:'Hand-costed = line-by-line (his real lifestyle, ex-insurance) — supersedes the old €800 lived anchor · Comfort = guide estimate · Bangkok +15–20% · re-confirm on next stay'},
    places:[
      {name:'Chiang Mai',sub:'his anchor city',f:921,verified:true,pool:true,note:'The representative cheap-TH base (his lived anchor, now hand-costed). ★ The ONLY pool+gym base in the whole plan — every other place is a regular condo or lean studio. The two islands below are pricier lifestyle alternatives.'},
      {name:'Koh Phangan',sub:'wellness island + coworking',f:1214,verified:true,beefMix:true,note:'+32% over Chiang Mai. Island rent (Srithanu/Haad Yuan wellness hub tightens supply), higher elec, + coworking (beacHub/Inner Space). ◆ BEEF NOT THE MAIN FOCUS: protein = chicken-forward mix (0% beef / 80% chicken / 20% fish) — imported island beef ~€12/kg not worth it (dropped the line ~€83/mo). Srithanu is itself a yoga/coaching hub.'},
      {name:'Koh Lanta',sub:'quiet beach island',f:1130,verified:true,beefMix:true,note:'+23% over Chiang Mai. Cheaper & quieter than Phangan; KoHub (~6.5k THB/mo) doubles as the reliable internet. ◆ BEEF NOT THE MAIN FOCUS: chicken-forward mix (0/80/20) — imported island beef ~€13/kg not worth it (dropped the line ~€94/mo).'}],
    stay:'DTV: 5-year multi-entry, 180 days/entry + 180-day extension, ~10k THB fee, show ~€13k funds. LTR out of reach ($80k/yr income bar).',
    work:'By the book: work performed while IN Thailand = Thai-source, 5–35% PIT regardless of remittance (DTV permits it immigration-wise, tax law doesn’t exempt it). Enforcement on nomads currently thin — the app shows the honest number.',
    anchor:{verdict:'the backup anchor — 0% two ways, each conditional (bank gate / no-remit leash)',
      trc:'180+ days in the calendar year + TIN + file first — the RO.22 certificate lags residence by months. Fine if sequenced: declare TH residence at the exchange before the sale, certificate follows.',
      coach:'5–35% by the book on TH-performed work.',
      off:'TWO 0% routes. Onshore: sell via Thai SEC-licensed exchanges (Min.Reg. 399), 1 Jan 2025 – 31 Dec 2029 — but bank-gated (see gate) and time-boxed. Offshore (Scenario F, the converged route): a Kraken sale is FOREIGN-source income on the remittance basis — assessable only when brought INTO TH, so Kraken → Swissquote + never remit = 0% even as a full 180+ day Thai resident, no Thai bank needed. Filing still required above 120k THB — exempt ≠ unreported. Guardrail 9 still applies: click from SG/HK/AE.',
      gates:['THE gate: Thai banks (BBL/KBank/SCB) reject new accounts on DTV since the 2025–26 anti-scam crackdown — no Thai bank, no THB cash-out. Verify on the ground before committing.',
        'Window closes 31 Dec 2029 — the entire off-ramp must finish before.',
        'Remittance is WIDER than wires: ATM withdrawals + card spend inside TH from the proceeds account COUNT. Amount-based (only what comes in is assessable), but income-first ordering on commingled money — keep proceeds in a dedicated non-commingled account and spend in TH from separate clean money. The leash is PERMANENT: remitting years later is still assessable if earned while TH-resident.',
        'Remittance relaxation = revived DRAFT decree (exempt if remitted in year earned or the next) — monitor, don’t plan on it.']}},
  {cc:'CZ',n:'Czechia',f:'🇨🇿',roles:['anchor','live'],stamp:'2026-07-16',
    col:{f:1200,n:1700,city:'Prague',conf:'high',note:'Brno −15%'},
    stay:'EU — unlimited; report to the Foreign Police within 30 days.',
    res:'⚠ Stálý byt: an available permanent home with intent to stay = resident from day 1 — the 183-day count is only the second limb. (As anchor that is the feature; passing through, don’t keep a flat at your disposal.)',
    work:'živnost + paušální daň band 1: CZK 9,984/mo (~€400) flat, covering income tax + social + health in one payment, up to ~1.5M CZK revenue. Simplest regime on the list.',
    anchor:{verdict:'the EU slot — 0% on aged lots (a small slice of his stack), ~€400/mo all-in work tax',
      trc:'Days–weeks: permanent home with intent to stay (“stálý byt”) OR 183 days; certificate routine, ~€0.',
      coach:'~€400/mo flat all-in (paušální daň).',
      off:'0% on lots held 3+ years, capped 40M CZK/yr (~€1.6M); disposals <100k CZK/yr not even reported. ⚠ NOT HIS FALLBACK (demoted Jul 16 2026): the exemption is PER-LOT and every sell/rebuy resets the clock — the LINK stack was actively traded, so the provably-uninterrupted 3y slice is likely SMALL. Same flaw that killed the Germany idea (1-year hold). Holding-period regimes don’t fit this lot history; source-based regimes (PH, TH, GE) do. The Koinly report will quantify the clean slice — informational only, not an anchor strategy.',
      gates:['Per-lot clock RESETS on every sell/rebuy — trading history, not purchase year, decides. Only never-traded lots qualify today; 2026 buys unlock 2029. Koinly lot report = the ground truth.']}},
  {cc:'VN',n:'Vietnam',f:'🇻🇳',roles:['live'],stamp:'2026-07-14',
    col:{f:974,n:1100,city:'Da Nang',conf:'med',verified:true,note:'Hand-costed = line-by-line (his real lifestyle, ex-insurance); regular 1BR condo, NO pool+gym (Jul 2026 — only Chiang Mai keeps pool+gym) · Comfort = guide estimate (band is tight — Da Nang rent rose in 2026)'},
    stay:'90-day e-visa, repeatable.',
    res:'⚠ Not just days: 183+ days OR a leased dwelling held ≥183 days in the tax year — a long lease ALONE can make you Vietnamese tax-resident below the day count. Keep stays short AND leases short.'},
  {cc:'KH',n:'Cambodia',f:'🇰🇭',roles:['live'],stamp:'2026-07-16',
    col:{f:911,n:1150,city:'Siem Reap',conf:'med',verified:true,note:'Hand-costed = line-by-line for Siem Reap (his real lifestyle, ex-insurance); regular 1BR, NO pool+gym, outer area (Jul 2026) · Comfort = guide estimate (Phnom Penh) · fresh 2026 data, thinnest sourcing of the set'},
    stay:'E-class “ordinary” visa on arrival, then extend 1/3/6/12 months indefinitely — ~$300/yr for the 12-month via agent. Easiest long-stay in SE Asia.',
    work:'Non-residents: Cambodian-source only. RESIDENTS are taxed on WORLDWIDE income — the old “territorial 0%” framing is dead.',
    res:'⚠ Abode-based, not day-based: a “principal place of abode” makes you resident (→ worldwide 20% CGT since 2026). Hotels/short lets passing through are fine; never keep a KH abode in a sale year.',
    demoted:'DEMOTED as anchor (Jul 16 2026) — the previous card was WRONG. The 20% CGT is LIVE since 1 Jan 2026 for investment assets, goodwill, IP and foreign currency (only the real-estate CGT is deferred to 2027), and residents are taxed on their WORLDWIDE gains. Abode-based residency is the trap: do NOT establish an abode or residency here in a sale year — passing through as a non-resident is fine. Crypto banking remains BANNED onshore (central-bank bar), so there is no local off-ramp either way. Scenario E retired — see the decision-tree playbook.'},
  {cc:'ID',n:'Indonesia',f:'🇮🇩',roles:['live'],stamp:'2026-07-14',
    col:{f:900,n:1400,city:'Canggu',conf:'med',note:'Bali premium; rest of ID much cheaper, nomad infra thin'},
    stay:'30-day VOA + 30-day extension; longer stays = visa runs or B211A-type paperwork.',
    res:'⚠ Not just days: 183+ days OR presence with INTENT to reside (long-term housing, a KITAS permit) — the intent test can catch below the day count. Visa-run tourism is fine; don’t sign a year lease.'},
  {cc:'IN',n:'India',f:'🇮🇳',roles:['live'],stamp:'2026-07-16',
    col:{f:796,n:1100,city:'6 places costed',conf:'med',verified:true,note:'Hand-costed = mean of the 6 hand-costed places below (his real lifestyle, ex-insurance; lean studio, no pool+gym; protein = goat-forward local mix — beef banned). Bimodal range: inland spiritual towns €652–710 = his CHEAPEST tier ever costed; Goa/Kerala beach €858–998 = mid-tier. Comfort = a roomier estimate.'},
    places:[
      {name:'Tiruvannamalai',sub:'spiritual · cheapest costed',f:652,conf:'med',verified:true,beefMix:true,note:'Deepest year-round spiritual community (Ramana/Arunachala satsang). His cheapest costed line yet. Weak wifi (strong SIM), hot, no beach; best Nov–Feb.'},
      {name:'Dharamkot',sub:'Himalayan meditation hub',f:688,conf:'med',verified:true,beefMix:true,note:'Vipassana/Tibetan + seeker community, BEST coworking (VOID Life/NomadGao). Cool ~2000m, no beach; go spring or autumn, not deep winter.'},
      {name:'Mysore',sub:'Ashtanga capital',f:710,conf:'med',verified:true,beefMix:true,note:'Gokulam shalas, serious daily practice, good meat sourcing, mild year-round. Caveat: lineage in transition post-Sharath (†Nov 2024). Inland.'},
      {name:'Arambol',sub:'Goa beach + healing scene',f:858,conf:'med',verified:true,beefMix:true,note:'The one beach town with a real grassroots healing/coaching scene (drum circle, ecstatic dance, breathwork, TTCs). Weak village wifi; Nov–Mar season.'},
      {name:'Varkala',sub:'Kerala cliff beach',f:870,conf:'med',verified:true,beefMix:true,note:'Red-cliff beach + best diet fit (daily fish, Kerala beef legal). Wellness tourism more than deep community; weak wifi (Fort Kochi fallback).'},
      {name:'Assagao',sub:'best wifi (priciest)',f:998,conf:'med',verified:true,beefMix:true,note:'Leafy N-Goa: best wifi ~95Mbps + NomadGao coworking + best meat/fish sourcing, ride to Arambol/beaches. No beachfront; priciest India node.'}],
    stay:'Dutch e-Tourist visa = 90 days MAX per visit (NL is NOT in the 180-day group). A ~4–5 month stay = split: ~88 days → exit (Sri Lanka/Nepal/Dubai) → ~88 days on the same 1/5-year multi-entry visa. No FRRO registration under 180 continuous days.',
    work:'Work performed while IN India = India-source, progressive PIT — but as a sub-182-day non-resident only India-day income is in scope. Perform/bill offshore where possible.',
    avoid:'⚠ RESIDENCY = HARD-AVOID — a sub-180-day EXPERIENCE only, never an anchor. 182+ days in an Indian FY (Apr–Mar) → resident → crypto taxed 30% + cess WORLDWIDE (§115BBH), exactly what the off-ramp exists to avoid. The 60-day + 365-days-over-prior-4-years limb ALSO catches foreigners: a repeat yearly visitor whose 4-year total hits 365 is caught at just 60 days. Rule: never >181 days/FY; if visiting yearly, cap the long-run average ~90 days/yr.'},
  {cc:'MY',n:'Malaysia',f:'🇲🇾',roles:['live'],stamp:'2026-07-14',
    col:{f:975,n:1300,city:'Penang',conf:'med',verified:true,note:'Hand-costed = line-by-line for Penang (his real lifestyle, ex-insurance); regular 1BR condo, NO pool+gym (Jul 2026 — only Chiang Mai keeps pool+gym) · Comfort = guide estimate (KL) · best infrastructure-per-euro in SE Asia'},
    stay:'90 days visa-free.',
    demoted:'Demoted as anchor: MM2H Silver = $150k deposit + MANDATORY RM600k property purchase (kills keep-principal-liquid); DE Rantau non-tech bar $60k/yr. Tax outcome was fine (no CGT non-trading, FSI exempt to 2036) — the visa economics are broken.'},
  {cc:'SI',n:'Slovenia',f:'🇸🇮',roles:['live'],stamp:'2026-07-14',
    col:{f:1450,n:2000,city:'Ljubljana',conf:'med',note:'only country in the red on Hand-costed without work income'},
    stay:'EU — unlimited.',
    res:'⚠ EU-style home tests: a permanent dwelling or centre of vital interests can attach residency below 183 days — not just a day count.',
    demoted:'Demoted as anchor: 25% tax on crypto→fiat from 1 Jan 2026 (swaps exempt, pre-2026 gains grandfathered). For a mostly-post-2026 gain that’s a ~25% haircut — the old “SI 0%” claim is dead. CZ takes the EU slot.'},
  {cc:'JP',n:'Japan',f:'🇯🇵',roles:['live'],stamp:'2026-07-14',
    col:{f:1472,n:1900,city:'Fukuoka',conf:'med',verified:true,note:'Hand-costed = line-by-line (his real lifestyle, ex-insurance); regular 1LDK, no pool+gym (Japan norm) — beef + cafe meals run 2–3× SE Asia, so his real Fukuoka cost lands ABOVE the old guide numbers · Comfort = a +~30% band, ESTIMATE (guide-normal was below his real cost, so it was raised to keep the band valid) · Tokyo higher again'},
    fx:'HIGH — the euro case is a weak-yen bet; if EUR/JPY strengthens 20%, Hand-costed Fukuoka rises to ~€1,770',
    blocks:'90-day blocks',
    stay:'90 days per entry, HARD CAP — NL is not on the bilateral extension list (AT/DE/IE/LI/MX/CH/UK only). Nomad visa ¥10M/yr, 6mo, non-renewable = out of reach. Pattern: quarterly Fukuoka blocks; immigration scrutinizes serial re-entries.',
    res:'⚠ Not just days: a jūsho (domicile — centre of life) attaches Japanese residency: a year-round apartment or a life visibly centred in JP can make you resident below any day count. Quarterly blocks in short-term lets are fine; don’t keep a standing JP apartment.',
    note:'Kraken restricted in JP — never an off-ramp jurisdiction. He’s learning Japanese (N4) and will visit regardless.'},
  {cc:'SG',n:'Singapore',f:'🇸🇬',roles:['hub'],stamp:'2026-07-16',hub:{wb:650,wm:1100,note:'cheapest sleep is the problem; food/transport cheap · execution venue for the click — no CGT'}},
  {cc:'HK',n:'Hong Kong',f:'🇭🇰',roles:['hub'],stamp:'2026-07-16',hub:{wb:600,wm:1500,note:'best food value, worst hotel value · execution venue for the click — no CGT'}},
  {cc:'AE',n:'Dubai',f:'🇦🇪',roles:['hub'],stamp:'2026-07-16',hub:{wb:400,wm:1200,note:'cheapest budget hub; extras brutal · execution venue for the click — no CGT'}}
];

/* Path — linear sequence, plain checkboxes + text dependencies (computed unlock logic rejected for v1). */
const PATH=[
  {id:'prep',name:'Prepare',when:'now → 2027 · in NL',steps:[
    {id:'p1',t:'Open IBKR while still NL-resident',dep:'Before deregistering — NL/EU brokers re-KYC or close on emigration; IBKR survives relocation and trades bonds.'},
    {id:'p2',t:'Open Swissquote BEFORE leaving NL — broker backup AND the off-ramp proceeds bank',dep:'Guardrail 3. Digital onboarding needs the NL address; it is where the Kraken sale lands (decision-tree Q3: destination = Swissquote, never a remittance-country bank). Holds LINK natively; CHF 10k min, expat-built, second regulator. Dukascopy = second choice.'},
    {id:'p3',t:'Verify Kraken fully while NL-resident',dep:'KYC is easiest as a resident. The address switch comes EARLY — set Kraken to the first real PH address at the START of travels (supersedes the old after-TRC rule; see Nomad).'},
    {id:'p4',t:'Re-stamp yield snapshots after the 23 Jul 2026 ECB decision',dep:'Hiking cycle — the app warns when the live anchor moves off the snapshots.'},
    {id:'p5',t:'Deploy the ~€45k into the market; record lot dates',dep:'Lot dates feed the Koinly report + provenance dossier (source-of-funds proof). The old CZ 3-year-clock rationale is retired — CZ is not the fallback (per-lot resets, see the CZ card).'},
    {id:'p6',t:'Line up IMG Global insurance (~€120/mo)',dep:'His researched winner — already inside every burn number in Match.'},
    {id:'p7',t:'Skip term deposits — iBonds replaced them',dep:'Research-5: fixed-maturity iBonds ETFs beat Raisin deposits on yield, liquidity AND residency. Nothing residence-tied should hold the €350k.'},
    {id:'p8',t:'Assemble the source-of-funds dossier',dep:'Guardrail 7. Binance + Kraken exports, Etherscan paper-wallet trail, box-3 reconciliation, Koinly report → one PDF for Swissquote compliance BEFORE the ~€500k wire (pre-notify; freeze ≠ forfeiture, but a ready dossier keeps it smooth). Lives in Personal apps/offramp-dossier.'},
    {id:'p9',t:'Get the PH lawyer’s written §42(E) opinion + one cross-border pressure-test',dep:'Guardrail 8. The sharpened three-part question is in the dossier (04). Hub-click (guardrail 9) moots the ambiguity meanwhile — the opinion decides how much the continuity stay matters. One cross-border adviser session pressure-tests the whole itinerary before relying on it.'}]},
  {id:'exit',name:'Exit',when:'2027 · before the 2028 pivot',steps:[
    {id:'x1',t:'Sell apartment + company (≈ €350k)',dep:'Selling the apartment is ALSO the tax shield: no available Dutch dwelling = the decisive clean-exit factor (decision-tree Q1).'},
    {id:'x2',t:'Park the €350k in the chosen blend at IBKR/Swissquote',dep:'Position BEFORE deregistering — full product access needs a residence.'},
    {id:'x3',t:'Check the iBonds maturity dates line up with the plan',dep:'Dec 2028 tranche → cash Jan 2029 (re-park in MMF); Dec 2030 tranche → cash Jan 2031, right in the apartment window. If return slips past 2032, roll into a later iBonds rung.'},
    {id:'x4',t:'Set up cold-storage estate access',dep:'Someone must be able to reach the coins if something happens abroad — see Playbooks.'},
    {id:'x5',t:'Deregister from NL — cleanly, and DOCUMENT it',dep:'Before 1 Jan 2028 — vermogensaanwasbelasting treated as fixed (the pivot constant). Guardrail 1, the master shield: BRP uitschrijving + no available Dutch dwelling + NL accounts closed + center of life gone. Keep every piece of paperwork — a sloppy exit is the one failure mode that survives departure. ⚠ The 12-month boomerang clock starts HERE: re-settling in NL within 12 months of departure = deemed NL-resident the whole time (art. 2.2 — see Playbooks).'}]},
  {id:'nomad',name:'Nomad',when:'2028 → · resident nowhere',steps:[
    {id:'n1',t:'Residency discipline — days AND no dwelling AND no anchor',dep:'Guardrail 5, widened (Jul 2026): day limits alone are NOT the whole test — secondary tests (a lease kept at your disposal, an abode, a centre-of-life) catch BELOW the day count in VN/JP/KH/CZ/SI/ID (⚠ lines on those country cards). So: never 182 in India (30% worldwide crypto), never 180 in any worldwide-tax country, AND no dwelling kept available, AND no vital-interest anchor. PH is SAFE to exceed (territorial at any status); TH only with the no-remit leash; day-count-only set: TH/PH/GE/MY/IN.'},
    {id:'n2',t:'Make PH the FIRST stop, rent a real place, set the Kraken address to it — brokers stay as-is',dep:'SUPERSEDES the old after-TRC rule. A real rented PH address (address ≠ TRC): gets NL off the account early — CARF/DAC8 reporting follows the declared address — and avoids re-KYC in the middle of a pump window. Never a fabricated address; stale-but-genuine beats a last-minute change. IBKR/Swissquote keep NL until the TRC exists (“resident nowhere” is grey at brokers; both tolerate the gap).'},
    {id:'n3',t:'Re-confirm the hand-costed COL numbers on the first stays',dep:'The ✓ hand-costed figures (TH €921, VN €974, PH places…) are desk-costed from his real lifestyle — validate on the ground; the ledger in waypoint/research is the living source. (Supersedes the old “TH €800 lived anchor” check.)'},
    {id:'n4',t:'Monitor the moving parts',dep:'The Agenda card at the top of this section is the live list: dated deadlines + standing monitors (TH bank-on-DTV, TH decree, GE SBS, PH §42(E), Prinsjesdag). This step = the habit of actually looking at it.'}]},
  {id:'anchor',name:'Anchor',when:'when a base is chosen',steps:[
    {id:'a1',t:'Establish TRC at the anchor',dep:'PH 180d cumulative in the calendar year (the 0% does NOT need it — the TRC is paper/corroboration) · GE 183d · TH 180d + filing · CZ home/183d.'},
    {id:'a2',t:'THEN switch IBKR/Swissquote residency to the anchor',dep:'AFTER the TRC exists, BEFORE any big sale — DAC8/CARF reporting goes to the declared residence. Kraken already points at PH since the first stop (the old “switch Kraken after TRC” rule is superseded — see Nomad).'},
    {id:'a3',t:'If TH + onshore route: open Thai bank + Bitkub',dep:'Only the ONSHORE route needs this — the offshore Scenario F route (Kraken → Swissquote, zero remittance) needs no Thai bank. Banks reject DTV holders; verify branch reality before counting on onshore.'},
    {id:'a4',t:'If CZ: confirm which lots have passed 3 years',dep:'Per-lot, and the clock resets on every sell/rebuy — expect only a small never-traded slice to qualify (Koinly quantifies). This is why CZ is not the fallback.'},
    {id:'a5',t:'If GE: confirm SBS classification for coaching',dep:'“Consultancy” is excluded — local advisor; fallback is 20%.'}]},
  {id:'offramp',name:'Off-ramp',when:'the bull-run window',steps:[
    {id:'oq',t:'Run the Q3 pre-sale checklist',dep:'Before pressing anything: Kraken address = PH (not NL)? Provenance dossier current? Destination = Swissquote, never a remittance-country bank? Swissquote compliance pre-notified about the incoming wire? No hostile residency tripped this year?'},
    {id:'o0',t:'Fly to a hub and execute the sale physically in SG/HK/AE',dep:'Guardrail 9 — the hub-click, in EVERY scenario: even if “sold within” attached to the click location, local CGT is 0 → the PH §42(E) ambiguity becomes stakes-free. If roaming with no TRC: fly TOWARD PH via the hub, sell during the stop, land in PH (Scenario D). Cost: one layover.'},
    {id:'o1',t:'Sell via the anchor’s clean route',dep:'PH: foreign exchange (Kraken) → Swissquote, click from the hub. GE: anywhere (foreign-source). TH: ONSHORE licensed exchange only, before 31 Dec 2029 — or Kraken abroad with ZERO remittance. CZ: never-traded 3y+ lots only — a small slice of the stack.'},
    {id:'o2',t:'File the return even when exempt',dep:'Exempt ≠ unreported (TH filing duty >120k THB; CZ <100k CZK/yr excepted).'},
    {id:'o3',t:'Sweep proceeds into the safe blend',dep:'Back to the Engine — the sleeve becomes principal.'}]},
  {id:'fork',name:'Fork',when:'≈2032 · the only real branch',steps:[
    {id:'f1',t:'Decide: stay at the anchor or return to NL',dep:''},
    {id:'f2',t:'If return: rebuy outside high-price areas',dep:'The intact floor is what makes this possible in any scenario — the whole point of the Engine.'},
    {id:'f3',t:'Check the AOW gap + voluntary buy-in',dep:'Each year outside NL ≈ −2% AOW; vrijwillige voortzetting has a 1-year deadline after leaving — decide at Exit, not later. See Playbooks.'}]}
];

/* Playbooks — contingency cards on a linear plan. No timeline branching (that’s what made Runway chaotic). */
const PLAYBOOKS=[
  {id:'pump',icon:'▲',accent:'ok',title:'Sudden pump — cash out in 1–2 weeks',sub:'the emergency this plan is built around',body:[
    {h:'Before 2028 (still NL-resident)',p:'Fly home and sell as an NL resident — clean, no exotic moves. His own correction: pre-exit, NL IS the emergency plan.'},
    {h:'Nomad gap (no TRC yet) — the emergency sequence',p:'Fly TOWARD PH via a SG/HK/AE stop → execute the sale DURING the stop (guardrail 9: the hub-click) → land in PH for the presence/continuity story. PH is territorial 0% for aliens at ANY residency status — no 180 days needed. The old line “a hub trip solves logistics, not tax” was WRONG: clicking from a no-CGT jurisdiction also moots the sourcing ambiguity. ⚠ Months 0–12 after NL departure: check the boomerang card FIRST — if an NL re-settlement before the 12-month anniversary is at all likely, this sale becomes NL-taxed retroactively.'},
    {h:'After the TRC',p:'Same click discipline: sell via the anchor’s clean route (PH foreign exchange · GE anywhere · TH onshore before 2030 OR Kraken with zero remittance · CZ never-traded lots, small slice) but execute the click from SG/HK/AE anyway — guardrail 9 applies in EVERY scenario. Kraken already points at PH (set at the first stop); IBKR/Swissquote must point at the anchor. Run the Q3 pre-sale checklist first (Path).'}]},
  {id:'tree',icon:'⑂',accent:'ok',title:'Off-ramp decision tree — scenarios A–F',sub:'the one justified branch · from the cash-out dossier, verified Jul 16 2026',body:[
    {h:'The principle',p:'A gain is taxed only if some jurisdiction has a claim at the MOMENT of sale — 0% = engineering a moment where no one does. And in every branch: guardrail 9, execute the actual click physically in SG/HK/AE.'},
    {h:'Q1 — NL cleanly exited?',p:'NO + pre-2028 → Scenario A: just sell; box 3 is a modest deemed-return wealth tax, tolerable in a true emergency. NO + 2028 or later → do NOT sell as an NL resident (real gains tax) — exit first. YES → NL has no claim; keep the exit documentation. ⚠ One reach-back: inside months 0–12 of departure, the art. 2.2 boomerang can still reattach NL residency retroactively if you re-settle in NL — see the boomerang card before any early sale.'},
    {h:'Q2 — tax-resident anywhere this year?',p:'NO (roaming) → Scenarios B/D: fly toward PH via a hub stop, sell during the stop, land in PH = 0% at any residency status; guard the hostile thresholds (India 182d, TH 180d). PH resident → Scenario C: sell (hub-click) = 0% — and the hub-click matters MOST here: once PH-domiciled, mobilia sequuntur personam flips AGAINST you and hands BIR a situs argument for a click on PH soil (settled Scenario C carries more doctrinal risk than fly-in Scenario D). TH resident → Scenario F: Kraken → Swissquote, NEVER bring proceeds into TH by any channel = 0% on a permanent no-remit leash. Worldwide-tax country → failure mode: expect local tax, get an adviser.'},
    {h:'Scenario E — Cambodia — RETIRED',p:'✕ Was “sell as KH resident, territorial 0%”. WRONG since 1 Jan 2026: 20% CGT on residents’ WORLDWIDE gains, on abode-based residency. Never establish a KH abode in a sale year; passing through as a non-resident is fine.'},
    {h:'Q3 — always, before pressing sell',p:'Kraken address = PH (not NL)? Provenance dossier ready? Destination = Swissquote, not a remittance-country bank? Swissquote compliance pre-notified? Physically in SG/HK/AE for the click?'},
    {h:'Retired note',p:'“Emergency = fly back to NL and sell” is PRE-EXIT only (Scenario A). Post-exit, returning would re-enter the NL tax net — the emergency route is the hub-click toward PH.'}]},
  {id:'boom',icon:'⟲',accent:'bad',title:'The 12-month boomerang — art. 2.2 Wet IB',sub:'no sale in months 0–12 if an NL return is possible',body:[
    {h:'The rule',p:'Leave NL and go back to LIVE in NL within 12 months — without having lived in another state in between — and the law deems you NL-resident THE WHOLE TIME, retroactively. An aborted trip (health, family, burnout) converts a “clean exit” sale into an NL-resident sale after the fact. The clean-exit shield (x5) does not stop this — it is a statutory fiction, not a facts-and-circumstances test.'},
    {h:'The discipline',p:'No sale in months 0–12 after deregistration unless CERTAIN no NL re-settlement happens before the 12-month anniversary. After that the boomerang is dead — it counts 12 months from DEPARTURE, never backwards from return. A 2-year trip is untouched; only the aborted first year is the trap.'},
    {h:'The escape hatch',p:'The fiction does not apply if you actually LIVED in another EU/EEA/treaty state and were taxed there as a RESIDENT in between. Pure touring does not give this. A real settled opening stint in PH helps the facts — and a PH TRC (180+ days that calendar year) makes it solid.'},
    {h:'Forced home early anyway?',p:'Coins unsold + inside month 12 → “sell before re-registering” does NOT work here (the fiction reaches back past the sale date). Either wait out the anniversary abroad before selling, or sell and accept NL tax on that sale. See Forced early return.'}]},
  {id:'crash',icon:'▼',accent:'warn',title:'Crash — deploy the powder, hold the core',sub:'the ≈€100k sleeve exists for exactly this',body:[
    {h:'What holds',p:'MMF: no dent. FRN: −1 to −4% briefly, recovers in weeks. Govt/Schatz: typically RALLY — sell high. iBonds: dip self-heals by the printed maturity date, so do not sell mid-panic unless truly forced. Evergreen IG 1–5y (no longer in any blend): −6/−7% plus a NAV discount if sold into the panic.'},
    {h:'Deploying the ≈€100k',p:'Powder sleeve (MMF/FRN + govt) sells any weekday, cash in 2–4 business days, from anywhere via IBKR. His structure: this is the slice earmarked to buy cheap stocks/BTC at a bottom — the apartment core stays untouched.'},
    {h:'Property crash while abroad',p:'If NL property also craters and he wants the apartment EARLY: iBonds sell same-day too, worst case ≈ −4–6% mid-panic (shrinking yearly). An apartment bought 15–30% off more than covers that haircut.'},
    {h:'Second-line powder — borrow against the core',p:'The iBonds core is marginable collateral at IBKR: for a generational bottom, a margin loan of ≤40% of the core’s value (≈€100k more) can be drawn WITHOUT selling anything — the loan repays itself as rungs mature at par. Strict rules: only AFTER the cash sleeve is spent; deploy on a predefined trigger, not on calling “the bottom” (at ≤40% vs 2y IG, a further −30% leg cannot force a call); pair the draw with a voluntary de-lever line (broker raises bond haircuts → trim and repay on YOUR terms before the liquidation algo does); never draw in the same month as an IBKR residency-country switch. Verify at the time: the ETFs’ marginability + house maintenance + EUR margin rate (floats, ≈benchmark +1.5%, usually ABOVE the bond yield — the drawn tranche carries ≈flat).'},
    {h:'Why margin is 2nd line, not a cash-powder replacement',p:'The cash sleeve is an option he OWNS; a margin line is an option the BROKER writes and can revoke (house haircuts are policy, not contract — and revocation correlates with exactly the moment of use). Borrowing capacity is ADDITIVE to the sleeve, so going all-bonds would only trade the unconditional layer for ≈€90/mo of yield — rejected Jul 2026.'}]},
  {id:'eurexit',icon:'◎',accent:'warn',title:'Euro-exit triggers — regime insurance',sub:'the one risk EUR bonds cannot hedge · predefined, deliberately NOT armed',body:[
    {h:'The gap',p:'Every blend is EUR to the bone. A euro REGIME event — redenomination, capital controls, a eurozone break, 1929-scale EUR credit failure — is the one scenario the shelf cannot insure from inside: every hedge denominated in EUR fails with it. The only insurance that survives is outside the currency: gold, CHF, USD. Discussed size: 10–15% of the core.'},
    {h:'Triggers — predefined, not vibes',p:'(1) Sovereign spread blowout PLUS serious redenomination politics in a big member (IT/FR “parallel currency” talk moving from fringe to government). (2) Capital-control measures anywhere in the euro area (Cyprus 2013 is the precedent). (3) Inflation persistently far above the 2.3% planning assumption with the ECB visibly behind. (4) The stay-in-Asia branch firing — the floor currency should follow the future home, and an NL apartment is priced in euros only as long as NL is the destination.'},
    {h:'The response ladder',p:'Execute in calm, never mid-panic: shift 10–15% of the core into a physical-backed gold ETC + short CHF/USD sovereign paper — all holdable at IBKR as a nomad, no new accounts needed. The EUR floor logic stays unless the NL-return branch dies. This is a dial with a predefined trigger, exactly like the margin second line.'},
    {h:'Why not arm it now',p:'Carry cost: a 10–15% slice at gold/CHF carry vs ≈3.4% on the shelf ≈ €40–90/mo — real money for a tail that already has a predefined response. The trigger list IS the insurance until one fires. Revisit if trigger 4 (stay-in-Asia) firms up — that one is a life decision, not a market event.'}]},
  {id:'return',icon:'↩',accent:'warn',title:'Forced early return',body:[
    {h:'⚠ Inside 12 months of departure?',p:'The art. 2.2 boomerang deems you NL-resident the WHOLE time if you re-settle in NL within 12 months of leaving (see the boomerang card) — any sale made in the gap becomes NL-taxed retroactively, even a hub-click sale. If at all possible: wait out the 12-month anniversary abroad before re-registering — or before selling.'},
    {h:'',p:'Re-register in NL → back in the NL tax net, whatever it is by then. The Engine’s floor is the point: principal intact means the apartment rebuy stays possible at ANY exit time. Broker accounts (IBKR/Swissquote) survive the move back too.'},
    {h:'Coins still unsold?',p:'Past month 12: sell BEFORE re-registering, not after — post-2028 an NL resident pays real gains tax on the sale (decision-tree Q1). If the return is foreseeable and the bull has run, the off-ramp (hub-click → Swissquote) comes first, the BRP registration second. Only a genuine emergency justifies inverting that order.'}]},
  {id:'stay',icon:'⚓',accent:'ok',title:'Relationship / staying long-term',body:[
    {h:'',p:'The anchor becomes home: local tax planning and real integration replace this app’s frame. Work income (coaching) becomes the main lever — the anchor cards’ work lines are the starting point.'}]},
  {id:'aow',icon:'◔',accent:'warn',title:'AOW gap',body:[
    {h:'',p:'Every year not NL-resident ≈ −2% state pension; 2028–2032 ≈ −8 to −10%. Voluntary continuation (vrijwillige voortzetting, SVB) must be requested within 1 year of leaving — it’s an Exit-phase decision, not a later one. Verify current terms with SVB before deregistering.'}]},
  {id:'nlmotion',icon:'◉',accent:'warn',title:'Monitor — NL emigrant exit tax (inwonerschapsfictie)',sub:'directly targets this profile · Agenda tracks the yearly check',body:[
    {h:'Status (verified Dec 2025)',p:'Exploration ONLY — the State Secretary’s study found meager revenue (€16–38M/yr) and heavy implementation problems, and the caretaker cabinet explicitly punted the decision to the NEXT cabinet. No bill, no consultation. Origin: Tweede Kamer motion Oct 2024.'},
    {h:'How fast could it bite?',p:'Fast-path ceiling ≈ 3.5 months: if it ever rides the Belastingplan package — Prinsjesdag (3rd Tue Sep) → in force 1 Jan — and anti-abuse measures can even take effect RETROACTIVELY from the Budget-Day press release (15:15). But a novel trailing tax realistically needs 1.5–3 years from a cabinet “go” (consultation, Raad van State, treaty analysis). The exposure scenario that matters for a mid-2027 exit: a concrete bill on Prinsjesdag 2026 in force Jan 2027 — currently unlikely given the Dec 2025 findings, but exactly what the watch is for.'},
    {h:'What to watch',p:'Every Prinsjesdag until departure (the Agenda in Path computes the next one) AND the new cabinet’s formation/tax agenda — a coalition deal is where a “go” would first appear, months before any Budget Day.'},
    {h:'If a bill lands',p:'Accelerate the exit before entry into force — grandfathering of already-departed emigrants is likely but NOT guaranteed. Treaty blunting: a German-style trailing tax mainly works against NON-treaty states; NL–PH has a treaty, so PH treaty-residency (TRC) would blunt it — one more reason the 180-day continuity/TRC play is cheap insurance.'}]},
  {id:'addr',icon:'✉',accent:'ok',title:'What the exchange address does — and doesn’t',body:[
    {h:'Does',p:'Decides WHERE Kraken’s CARF/DAC8 report goes. That is all it steers.'},
    {h:'Doesn’t',p:'It is not a tax claim: notification ≠ taxation, and address ≠ TRC. A report landing in PH about a territorial-0% gain is a non-event. His follow-up (“doesn’t the PH address hand BIR a ‘he represented residence’ exhibit?”): the PH self-cert is a TRUE statement that at most shifts him between alien categories that are ALL territorial — the only theoretical route it matters is the mobilia domicile long-shot, itself mooted by the hub-click. A three-long-shot parlay.'},
    {h:'Stale is fine',p:'A genuine, once-real PH rental address that has gone stale beats a last-minute change during a pump (re-KYC risk, inconsistent story). Never a fabricated address — that IS the offence.'},
    {h:'Rejected idea',p:'Keeping NL on Kraken “to avoid PH notification” inverts the threat model (NL is the claimant to starve; PH is the safe harbor) and requires a false self-certification. Rejected Jul 15 2026 — do not re-litigate.'}]},
  {id:'freeze',icon:'◈',accent:'warn',title:'AML freeze on the €500k wire',body:[
    {h:'',p:'If Kraken or Swissquote pauses the money pending source-of-funds: freeze ≠ forfeiture — it is a compliance question with a prepared answer. The dossier IS the answer: Binance late-2017 buys at ~$0.14–0.17 (primary origin proof), the Etherscan trail bridging the lost paper wallet, NL box-3 filings as corroboration, Koinly lot report. Bar = balance of probabilities.'},
    {h:'Prevention beats cure',p:'Pre-notify Swissquote compliance before the wire (Q3 checklist) and sell only on Kraken — never a sketchy venue or mixer to “avoid” scrutiny; that is what converts a pause into a permanent problem (failure-mode table, dossier 04).'}]},
  {id:'estate',icon:'▣',accent:'bad',title:'Estate / cold-storage access',body:[
    {h:'',p:'If something happens abroad, someone must reach the coins: written procedure + seed access split so no single loss is fatal (e.g. steel backup with a trusted person). Also: who can instruct IBKR/Swissquote? Set beneficiaries where supported. Do this before Exit, not on the road.'}]}
];
