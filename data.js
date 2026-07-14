'use strict';
/* Waypoint v1 — data layer. Snapshot 2026-07-14.
   Sources: research packages 1-4 (Personal apps/waypoint/research-*.md).
   Not financial, tax, legal or immigration advice — verify load-bearing items locally. */

const DATA_STAMP='2026-07-14';
const ECB_STAMP={dfr:2.25,asOf:'2026-06-17',estr:2.18,note:'ECB decides again 23 Jul 2026 — hiking cycle; re-stamp snapshots after'};
const MMF_SPREAD=-0.08;   // MMF-ETF yield ≈ DFR − 0.08 (derivable live)
const INSURANCE=120;      // IMG Global ~€120/mo — his researched pick, named so he remembers which one won
const HORIZON_MO=60;      // Jan 2028 → Dec 2032 (pivot 2028 = constant, not editable)
const HORIZON_LABEL='2028 → 2032';
const STALE_DAYS=183;

const INSTRUMENTS={
  mmf:{name:'Money-market ETF',ref:'Xtrackers XEON (LU0290358497) · TER 0.10%',yld:2.17,live:true,stamp:'2026-07-10',
    risk:'Counterparty (synthetic swap, UCITS-capped at 10%). Zero duration, zero credit.',
    liq:'Intraday sale, cash T+2 — fastest on this list.',
    crash:'The dry-powder king. Mar 2020: overnight-swap ETFs kept accruing, no NAV dent. Spendable within days even in a 1929-style event.',
    hold:'UCITS ETF — holdable at IBKR/Swissquote wherever you are.',
    powder:1},
  govt:{name:'Short govt-bond ETF 1–3y',ref:'iShares IBGS · WAM 1.7y',yld:2.68,stamp:'2026-06-22',
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
  erne:{name:'Ultrashort IG ETF',ref:'iShares ERNE · WAM 0.7y',yld:2.69,stamp:'2026-06-04',
    risk:'IG credit spread, minimal duration.',
    liq:'Intraday.',
    crash:'Mar 2020: low-single-% dip, recovered within weeks after the ECB backstop.',
    hold:'UCITS ETF.',
    powder:3,
    note:'Yields the same as govt 1–3y right now — you’re not being paid for the credit risk. Skippable unless spreads widen.'},
  ig:{name:'IG corp-bond ETF 1–5y',ref:'iShares € Corp 1-5yr · TER 0.20% · WAM 3y',yld:3.27,stamp:'2026-06-22',star:'the ≥3% ticket',
    risk:'IG credit spread + ~2.8 duration.',
    liq:'Intraday — but see crash behavior.',
    crash:'Mar 2020: −6/−7% AND traded at a discount to NAV — selling INTO a panic costs the discount on top. Recovered within months. Hold-through-storm money, not dry powder.',
    hold:'UCITS ETF.',
    powder:4},
  dep:{name:'Term-deposit ladder',ref:'Raisin marketplace · 1y ≈2.99% / 2y ≈3.05%',yld:3.05,stamp:'2026-07-14',
    risk:'Bank credit, capped by the €100k/person/bank guarantee → €350k must split across 4+ banks.',
    liq:'None — locked to maturity (death/bankruptcy-grade exceptions only).',
    crash:'Zero mark-to-market, nominal guaranteed — and zero dry powder. Anti-powder: locked money can’t buy a bottom.',
    hold:'⚠ Raisin is residence-tied. Only ladder maturities that end BEFORE deregistration, and get Raisin NL’s emigration policy in writing first.',
    powder:5}
};

const POWDER_RANK=['','pure dry powder','rallies in a crash','mild dip, quick recovery','hold through the storm','anti-powder (locked)'];

const BLENDS=[
  {id:'safety',name:'Max safety',sub:'storm bucket only — crash-proof, liquid or guaranteed',mix:{govt:.40,schatz:.30,mmf:.20,dep:.10}},
  {id:'target3',name:'3% target',sub:'IG as the biggest sleeve — the price of ≥3% today',mix:{ig:.50,dep:.25,govt:.15,mmf:.10}},
  {id:'allig',name:'All-in IG',sub:'max yield, max spread exposure — hold-through-storm',mix:{ig:1}}
];

const BROKERS=[
  {n:'IBKR',star:true,v:'ok',glyph:'✓',word:'survives',d:'Keeps clients on relocation. Open while still NL-resident (signup wants A tax residency), update to the anchor later. Trades bonds (Schatz). Withholding follows declared residency.'},
  {n:'Swissquote',star:true,v:'ok',glyph:'✓',word:'survives',d:'Built for expats — “keep the same account every time you move”. CHF 10k min, non-resident surcharge ~CHF 10–30/mo (cheap insurance). Swiss custody = outside the EU regulator, still CRS-reports to declared residence.'},
  {n:'Raisin',v:'warn',glyph:'!',word:'conditional',d:'Residence-tied platform + deposits locked to maturity. Usable only with maturities timed to end before deregistration; confirm the emigration policy in writing.'},
  {n:'Saxo',v:'warn',glyph:'?',word:'unverified',d:'Entity-based (NL under Saxo Bank); non-EU-move policy not confirmed. Ask directly only if a third leg is wanted.'},
  {n:'DEGIRO',v:'bad',glyph:'✕',word:'dies on exit',d:'Supported-country list; moving outside → forced close/transfer (documented). Exit before leaving NL.'},
  {n:'Trade Republic',v:'bad',glyph:'✕',word:'dies on exit',d:'Requires permanent residence in a supported country; a move can trigger termination.'}
];

/* Countries — 13, role-tagged. Adding one = one entry, no code. */
const COUNTRIES=[
  {cc:'GE',n:'Georgia',f:'🇬🇪',roles:['anchor','live'],stamp:'2026-07-14',
    col:{f:725,n:1350,city:'Tbilisi',conf:'high',note:'winter heating spike'},
    stay:'365 days visa-free (EU passport), renewable by border run — 183 days reachable with no permit at all.',
    work:'IE + Small Business Status → 1% on turnover ≤500k GEL (~€170k). ⚠ “Consultancy” is SBS-excluded — if coaching is classed as consulting, fallback = 20% PIT on GE-performed work.',
    anchor:{verdict:'best value — cheapest credible TRC, 0% crypto',
      trc:'183+ days in any 12-month window → file via rs.ge, ~€0, doable by POA. HNWI backup: worldwide assets >$500k = 0-day route (a crypto pump puts him over — remember it).',
      coach:'1% SBS if classification lands; else 20%.',
      off:'0% — 2019 MoF ruling: individual crypto gains = foreign-source under the territorial system. Unchanged 2026. Kraken supported.',
      gates:['Verify coaching ≠ consulting for SBS with a local advisor before counting on the 1%']}},
  {cc:'TH',n:'Thailand',f:'🇹🇭',roles:['anchor','live'],stamp:'2026-07-14',
    col:{f:800,n:1400,city:'Chiang Mai',conf:'high',note:'frugal = his lived anchor · Bangkok +15–20% · re-confirm on next stay'},
    stay:'DTV: 5-year multi-entry, 180 days/entry + 180-day extension, ~10k THB fee, show ~€13k funds. LTR out of reach ($80k/yr income bar).',
    work:'By the book: work performed while IN Thailand = Thai-source, 5–35% PIT regardless of remittance (DTV permits it immigration-wise, tax law doesn’t exempt it). Enforcement on nomads currently thin — the app shows the honest number.',
    anchor:{verdict:'best Asia tax — gated AND time-boxed to 2029',
      trc:'180+ days in the calendar year + TIN + file first — the RO.22 certificate lags residence by months. Fine if sequenced: declare TH residence at the exchange before the sale, certificate follows.',
      coach:'5–35% by the book on TH-performed work.',
      off:'0% on crypto sold via Thai SEC-licensed exchanges (Min.Reg. 399), 1 Jan 2025 – 31 Dec 2029. Selling abroad + remitting = taxable. Filing still required above 120k THB — exempt ≠ unreported. Kraken supported (but the play is onshore: Bitkub).',
      gates:['THE gate: Thai banks (BBL/KBank/SCB) reject new accounts on DTV since the 2025–26 anti-scam crackdown — no Thai bank, no THB cash-out. Verify on the ground before committing.',
        'Window closes 31 Dec 2029 — the entire off-ramp must finish before.',
        'Remittance relaxation = revived DRAFT decree (exempt if remitted in year earned or the next) — monitor, don’t plan on it.']}},
  {cc:'CZ',n:'Czechia',f:'🇨🇿',roles:['anchor','live'],stamp:'2026-07-14',
    col:{f:1200,n:1700,city:'Prague',conf:'high',note:'Brno −15%'},
    stay:'EU — unlimited; report to the Foreign Police within 30 days.',
    work:'živnost + paušální daň band 1: CZK 9,984/mo (~€400) flat, covering income tax + social + health in one payment, up to ~1.5M CZK revenue. Simplest regime on the list.',
    anchor:{verdict:'the EU slot — 0% on aged lots, ~€400/mo all-in work tax',
      trc:'Days–weeks: permanent home with intent to stay (“stálý byt”) OR 183 days; certificate routine, ~€0.',
      coach:'~€400/mo flat all-in (paušální daň).',
      off:'0% on lots held 3+ years, capped 40M CZK/yr (~€1.6M); disposals <100k CZK/yr not even reported.',
      gates:['Per-lot clock: coins bought 2026 are exempt only from 2029; the older ~€50k stack qualifies earlier. Track lot dates.']}},
  {cc:'PY',n:'Paraguay',f:'🇵🇾',roles:['anchor','live'],stamp:'2026-07-14',
    col:{f:750,n:1200,city:'Asunción',conf:'med',note:'fewer nomads — numbers less tested'},
    stay:'Temp residency: no investment minimum, $2.3–4.7k all-in, 5–7 days in Asunción; cédula 3–4+ months. PR after 2 years. Keep = no unjustified 12-month absence.',
    work:'Territorial: foreign-source 0%. PY-invoiced coaching ~10% IRP (+10% VAT) — and some PY invoicing is exactly what makes the TRC real.',
    anchor:{verdict:'insurance anchor — cheap to hold, far away, needs lead time',
      trc:'Cédula ≠ tax residency: DNIT wants cédula + active RUC ≥4 months + real PY invoicing + migration certificate. Total lead 4–8 months.',
      coach:'0% foreign-source / ~10% on PY-invoiced.',
      off:'0% on paper — no crypto law, foreign-source exempt. Least-documented regime on the list (low confidence).',
      gates:['A paper-only TRC is not reliably obtainable — needs months of RUC lead. Start early if this is the fallback.']}},
  {cc:'VN',n:'Vietnam',f:'🇻🇳',roles:['live'],stamp:'2026-07-14',
    col:{f:700,n:1100,city:'Da Nang',conf:'high',note:'cheapest solid option'},
    stay:'90-day e-visa, repeatable.'},
  {cc:'PH',n:'Philippines',f:'🇵🇭',roles:['live'],stamp:'2026-07-14',
    col:{f:750,n:1250,city:'Cebu',conf:'med',note:'Manila higher, provinces lower'},
    stay:'30 days free, then famously extendable — up to ~36 months without leaving.'},
  {cc:'ID',n:'Indonesia',f:'🇮🇩',roles:['live'],stamp:'2026-07-14',
    col:{f:900,n:1400,city:'Canggu',conf:'med',note:'Bali premium; rest of ID much cheaper, nomad infra thin'},
    stay:'30-day VOA + 30-day extension; longer stays = visa runs or B211A-type paperwork.'},
  {cc:'MY',n:'Malaysia',f:'🇲🇾',roles:['live'],stamp:'2026-07-14',
    col:{f:850,n:1300,city:'Kuala Lumpur',conf:'high',note:'Penang −10–15% · best infrastructure-per-euro in SE Asia'},
    stay:'90 days visa-free.',
    demoted:'Demoted as anchor: MM2H Silver = $150k deposit + MANDATORY RM600k property purchase (kills keep-principal-liquid); DE Rantau non-tech bar $60k/yr. Tax outcome was fine (no CGT non-trading, FSI exempt to 2036) — the visa economics are broken.'},
  {cc:'SI',n:'Slovenia',f:'🇸🇮',roles:['live'],stamp:'2026-07-14',
    col:{f:1450,n:2000,city:'Ljubljana',conf:'med',note:'only country frugal-red without work income'},
    stay:'EU — unlimited.',
    demoted:'Demoted as anchor: 25% tax on crypto→fiat from 1 Jan 2026 (swaps exempt, pre-2026 gains grandfathered). For a mostly-post-2026 gain that’s a ~25% haircut — the old “SI 0%” claim is dead. CZ takes the EU slot.'},
  {cc:'JP',n:'Japan',f:'🇯🇵',roles:['live'],stamp:'2026-07-14',
    col:{f:850,n:1200,city:'Fukuoka',conf:'high',note:'Tokyo 1100/1600'},
    fx:'HIGH — the euro case is a weak-yen bet; if EUR/JPY reverts 20%, Fukuoka becomes ~1050/1450',
    blocks:'90-day blocks',
    stay:'90 days per entry, HARD CAP — NL is not on the bilateral extension list (AT/DE/IE/LI/MX/CH/UK only). Nomad visa ¥10M/yr, 6mo, non-renewable = out of reach. Pattern: quarterly Fukuoka blocks; immigration scrutinizes serial re-entries.',
    note:'Kraken restricted in JP — never an off-ramp jurisdiction. He’s learning Japanese (N4) and will visit regardless.'},
  {cc:'SG',n:'Singapore',f:'🇸🇬',roles:['hub'],stamp:'2026-07-14',hub:{wb:650,wm:1100,note:'cheapest sleep is the problem; food/transport cheap'}},
  {cc:'HK',n:'Hong Kong',f:'🇭🇰',roles:['hub'],stamp:'2026-07-14',hub:{wb:600,wm:1500,note:'best food value, worst hotel value'}},
  {cc:'AE',n:'Dubai',f:'🇦🇪',roles:['hub'],stamp:'2026-07-14',hub:{wb:400,wm:1200,note:'cheapest budget hub; extras brutal'}}
];

/* Path — linear sequence, plain checkboxes + text dependencies (computed unlock logic rejected for v1). */
const PATH=[
  {id:'prep',name:'Prepare',when:'now → 2027 · in NL',steps:[
    {id:'p1',t:'Open IBKR while still NL-resident',dep:'Before deregistering — NL/EU brokers re-KYC or close on emigration; IBKR survives relocation and trades bonds.'},
    {id:'p2',t:'Open Swissquote as backup',dep:'Same reason. CHF 10k min, expat-built, second regulator (Swiss custody).'},
    {id:'p3',t:'Verify Kraken fully while NL-resident',dep:'KYC is easiest as a resident. The residency SWITCH comes later — after TRC, before any big sale.'},
    {id:'p4',t:'Re-stamp yield snapshots after the 23 Jul 2026 ECB decision',dep:'Hiking cycle — the app warns when the live anchor moves off the snapshots.'},
    {id:'p5',t:'Deploy the ~€45k into the market; record lot dates',dep:'The CZ 3-year clock runs per lot — 2026 buys are exempt only from 2029.'},
    {id:'p6',t:'Line up IMG Global insurance (~€120/mo)',dep:'His researched winner — already inside every burn number in Match.'},
    {id:'p7',t:'Get Raisin NL’s emigration policy in writing',dep:'Deposits are residence-tied and locked; only maturities ending before deregistration.'}]},
  {id:'exit',name:'Exit',when:'2027 · before the 2028 pivot',steps:[
    {id:'x1',t:'Sell apartment + company (≈ €350k)',dep:''},
    {id:'x2',t:'Park the €350k in the chosen blend at IBKR/Swissquote',dep:'Position BEFORE deregistering — full product access needs a residence.'},
    {id:'x3',t:'Any term deposits: maturity date < deregistration date',dep:'Locked money on a residence-tied platform is exactly the bad scenario.'},
    {id:'x4',t:'Set up cold-storage estate access',dep:'Someone must be able to reach the coins if something happens abroad — see Playbooks.'},
    {id:'x5',t:'Deregister from NL',dep:'Before 1 Jan 2028 — vermogensaanwasbelasting treated as fixed (the pivot constant).'}]},
  {id:'nomad',name:'Nomad',when:'2028 → · resident nowhere',steps:[
    {id:'n1',t:'Stay under day-thresholds everywhere (~183d rule of thumb)',dep:''},
    {id:'n2',t:'Leave broker/exchange residency as-is until the anchor TRC exists',dep:'“Resident nowhere” is grey at brokers; both tolerate the gap in practice.'},
    {id:'n3',t:'Re-confirm the TH €800 frugal anchor on the first stay',dep:'Chiang-Mai-era pricing; baht + inflation drift since.'},
    {id:'n4',t:'Monitor the moving parts',dep:'TH bank-on-DTV policy, TH remittance decree, GE coaching-vs-consulting — all flagged on the country cards.'}]},
  {id:'anchor',name:'Anchor',when:'when a base is chosen',steps:[
    {id:'a1',t:'Establish TRC at the anchor',dep:'GE 183d · TH 180d + filing · CZ home/183d · PY cédula + 4mo RUC.'},
    {id:'a2',t:'THEN switch residency at Kraken + IBKR/Swissquote',dep:'AFTER the TRC exists, BEFORE any big sale — DAC8/CARF reporting goes to the declared residence.'},
    {id:'a3',t:'If TH: open Thai bank + Bitkub',dep:'THE gate — banks reject DTV holders; verify branch reality before committing to TH at all.'},
    {id:'a4',t:'If CZ: confirm which lots have passed 3 years',dep:'Per-lot; 2026 buys unlock 2029.'},
    {id:'a5',t:'If GE: confirm SBS classification for coaching',dep:'“Consultancy” is excluded — local advisor; fallback is 20%.'}]},
  {id:'offramp',name:'Off-ramp',when:'the bull-run window',steps:[
    {id:'o1',t:'Sell via the anchor’s clean route',dep:'GE: anywhere (foreign-source). TH: ONSHORE licensed exchange only, before 31 Dec 2029. CZ: 3y+ lots only.'},
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
    {h:'Nomad gap (no TRC yet)',p:'Weakest position — DAC8/CARF reports to the last declared residence. Prefer accelerating the anchor TRC over selling big while resident nowhere. A hub trip (SG/HK/Dubai, €500–1,500/wk + flights) solves logistics, not tax.'},
    {h:'After the TRC',p:'Sell via the anchor’s clean route (GE anywhere · TH onshore before 2030 · CZ aged lots). Kraken + broker residency must already point at the anchor — that’s the Path sequencing rule.'}]},
  {id:'crash',icon:'▼',accent:'warn',title:'Crash — hold the storm bucket',sub:'and maybe buy the bottom',body:[
    {h:'What holds',p:'MMF: no dent. Govt/Schatz: typically rally. Deposits: nominal guaranteed but locked. IG 1–5y: −6/−7% plus a NAV discount if sold into the panic — do NOT sell it there; Mar 2020 recovered within months.'},
    {h:'Dry-powder rank',p:'MMF → govt/Schatz (sell high) → ultrashort IG → IG 1–5y → deposits (anti-powder). Buy-the-bottom optionality is a PROPERTY of the instruments, noted per card — deliberately not built out as a strategy.'}]},
  {id:'return',icon:'↩',accent:'warn',title:'Forced early return',body:[
    {h:'',p:'Re-register in NL → back in the NL tax net, whatever it is by then. The Engine’s floor is the point: principal intact means the apartment rebuy stays possible at ANY exit time. Broker accounts (IBKR/Swissquote) survive the move back too.'}]},
  {id:'stay',icon:'⚓',accent:'ok',title:'Relationship / staying long-term',body:[
    {h:'',p:'The anchor becomes home: local tax planning and real integration replace this app’s frame. Work income (coaching) becomes the main lever — the anchor cards’ work lines are the starting point.'}]},
  {id:'aow',icon:'◔',accent:'warn',title:'AOW gap',body:[
    {h:'',p:'Every year not NL-resident ≈ −2% state pension; 2028–2032 ≈ −8 to −10%. Voluntary continuation (vrijwillige voortzetting, SVB) must be requested within 1 year of leaving — it’s an Exit-phase decision, not a later one. Verify current terms with SVB before deregistering.'}]},
  {id:'estate',icon:'▣',accent:'bad',title:'Estate / cold-storage access',body:[
    {h:'',p:'If something happens abroad, someone must reach the coins: written procedure + seed access split so no single loss is fatal (e.g. steel backup with a trusted person). Also: who can instruct IBKR/Swissquote? Set beneficiaries where supported. Do this before Exit, not on the road.'}]}
];
