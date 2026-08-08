'use strict';
const APP_VERSION='1.49.1';
const LS='waypoint:v1';
const INFL_DEFAULT=2.3; /* %/yr — the seed for both inflation rates (was the single const INFL). His call Jul 19 2026: 2.3 conservative, was 2.0. Declared here (before defaults()/state init) so the plan can seed inflEng+inflSpend from it. */
const HOME_DEFAULT=250000;    /* v1.41: the home target in TODAY'S euros (his number Jul 26 2026). Declared HERE, not next to homeToday(), because defaults() runs at load — const TDZ, same trap as INFL_DEFAULT in v1.33. */
const INFL_HOME_DEFAULT=3.5;  /* v1.41: %/yr for the home target — deliberately ABOVE INFL_DEFAULT (2.3); Dutch house prices have run above CPI, and that divergence is the whole reason this rate is separate. v1.45: 3.0 → 3.5 (his call, 29 Jul 2026). DNB forecasts +3.5/+3.0/+4.0 for 2026-28 and ABN +3/+4, so 3.5 sits mid-range. ⚠ THIS IS NOW THE MOST LOAD-BEARING ASSUMPTION IN THE PLAN: it sets the home target AND, through the floor dial, the entire drawdown budget. At a €310k pot and 3% housing there is ≈€16.5k of total drawdown room before the home target fails; at 4% there is ≈€0. */

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtE=v=>'€'+Math.round(v).toLocaleString('nl-NL');
const fmtK=v=>'€'+Math.round(v/1000)+'k';
const pct=v=>v.toFixed(2)+'%';
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast._h);toast._h=setTimeout(()=>t.classList.remove('show'),2600);}

/* ---------- state ---------- */
function defaults(){return{plan:{principal:0,floor:0,start:0,end:48,blend:'target3',colMode:'f',anchor:'PH',sleeve:0,customY:3,spend:0,insOn:true,inflEng:INFL_DEFAULT,inflSpend:INFL_DEFAULT,home:HOME_DEFAULT,inflHome:INFL_HOME_DEFAULT},steps:{},ecb:null};} /* v1.33: inflEng + inflSpend = TWO independent inflation rates (%/yr), both default 2.3 = the old single INFL, so existing plans are byte-identical. inflEng drives the Engine floor check; inflSpend drives the Actual-spend lens (today's-euros line + real-preservation spend). His ask Jul 22 2026: let the engine calc and the actual-spend calc run on different inflation. */ /* v1.32: TWO plan dials — start & end (month indices, endLabel convention: index 1 = Jan 2028). Default start 0 = Dec 2027, end 48 = Dec 2031 → horizon 48 mo, IDENTICAL to the old single 'months:48' dial (old n=months was really Dec-2027→end). Earliest start = -6 = Jun 2027. Horizon n = end − start drives every calc; floorCheck deflates the plan-end floor and depends on END only. */ /* v1.28: insOn = master €120 insurance toggle, on by default (matches prior behaviour) */ /* v1.15: spend = his typed actual monthly all-in spend for the surplus lens (0 = lens shows its prompt) */ /* v1.11: customY = the what-if net yield behind the 4th 'Custom yield' row (plan.blend may be 'custom'). v1.4: fresh devices start at 0/0/… (his call). v1.2: default anchor = PH; saved plans keep their own picks */
function load(){try{const s=JSON.parse(localStorage.getItem(LS));if(!s)return defaults();const d=defaults();const sp=s.plan||{};
  /* v1.32 migration — MUST run on the RAW saved plan, before merging defaults (defaults now always
     carry end:48, which would mask the legacy field). A plan saved before the start dial carries
     `months` (the old end index) but no `start`/`end`: map end = months, start stays 0 (Dec 2027),
     so the horizon is unchanged. Then drop the dead field. */
  if(typeof sp.months==='number'&&typeof sp.end!=='number'){sp.end=sp.months;if(typeof sp.start!=='number')sp.start=0;}
  delete sp.months;
  s.plan=Object.assign(d.plan,sp);
  s.steps=s.steps||{};return s;}catch(e){return defaults();}}
function save(){try{localStorage.setItem(LS,JSON.stringify(state));}catch(e){}}
let state=(typeof localStorage!=='undefined')?load():defaults();

/* ---------- live ECB anchor (hybrid model: never display a number the app can’t vouch for) ---------- */
const ECB_URL='https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.4F.KR.DFR.LEV?format=jsondata&lastNObservations=1';
function liveDFR(){return(state.ecb&&typeof state.ecb.dfr==='number')?state.ecb.dfr:null;}
async function fetchECB(){
  const today=new Date().toISOString().slice(0,10);
  if(state.ecb&&state.ecb.fetched===today)return;
  try{
    const r=await fetch(ECB_URL,{cache:'no-store'});if(!r.ok)throw 0;
    const j=await r.json();
    const ser=j.dataSets[0].series;const k=Object.keys(ser)[0];
    const obs=ser[k].observations;const ok=Object.keys(obs).pop();
    const val=obs[ok][0];
    let od='';try{const dv=j.structure.dimensions.observation[0].values;od=dv[dv.length-1].id||'';}catch(e){}
    if(typeof val==='number'&&val>-1&&val<15){state.ecb={dfr:val,obsDate:od,fetched:today};save();renderAll();}
  }catch(e){/* offline or blocked — snapshots stand, driftInfo says so */}
}
function driftInfo(){
  const l=liveDFR();
  if(l==null)return{cls:'muted',glyph:'◌',txt:'live anchor unreachable — snapshot DFR '+pct(ECB_STAMP.dfr)+' ('+ECB_STAMP.asOf+') stands'};
  const d=Math.round((l-ECB_STAMP.dfr)*100)/100;
  if(Math.abs(d)<0.05)return{cls:'ok',glyph:'✓',txt:'ECB deposit rate '+pct(l)+' live — matches the snapshots'};
  return{cls:'warn',glyph:'!',txt:'ECB rate now '+pct(l)+' ('+(d>0?'+':'')+d.toFixed(2)+' vs snapshots) — yield snapshots are stale, re-stamp'};
}

/* ---------- engine math ---------- */
function instYield(id){const ins=INSTRUMENTS[id];if(ins.live&&liveDFR()!=null)return Math.round((liveDFR()+MMF_SPREAD)*100)/100;return ins.yld;}
function blendYield(mix){let y=0;for(const k in mix)y+=mix[k]*instYield(k);return Math.round(y*10000)/10000;}
/* Sustainable monthly budget: constant W such that the balance, earning y on the DECLINING
   balance, lands exactly on the floor after n months. Annuity form — not linear. */
function monthlyBudget(P,F,yPct,n){const i=yPct/100/12;if(i<=0)return(P-F)/n;const g=Math.pow(1+i,n);return(P*g-F)*i/(g-1);}
function currentBlend(){return BLENDS.find(b=>b.id===state.plan.blend)||BLENDS[1];}
/* v1.11: the 4th row — his own what-if net yield. Clamped 0–12; when plan.blend==='custom' the whole app runs on it. */
function custY(){const v=+state.plan.customY;return isFinite(v)?Math.min(12,Math.max(0,Math.round(v*100)/100)):0;}
function currentYield(){return state.plan.blend==='custom'?custY():blendYield(currentBlend().mix);}
/* v1.32: the plan horizon in months = end − start. Both are month indices on the
   endLabel scale (index 1 = Jan 2028). Clamped to ≥6 so no calc ever sees n≤0. */
function horizon(p){return Math.max(6,p.end-p.start);}
function engineNumbers(){
  const p=state.plan,y=currentYield();
  const w=monthlyBudget(p.principal,p.floor,y,horizon(p));
  const ym=p.principal*y/100/12;
  return{y,w,yieldMo:ym,draw:Math.max(0,w-ym)};
}
/* month index → calendar label (index 1 = Jan 2028; 6 → Jun 2028, 48 → Dec 2031 [default end],
   156 → Dec 2040 [max end], 0 → Dec 2027 [default start], -6 → Jun 2027 [earliest start]).
   v1.32: negative-safe (floored division + wrapped modulo) so start indices below Jan 2028 label correctly. */
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function endLabel(mo){const idx=mo-1;return MONTHS[((idx%12)+12)%12]+' '+(2028+Math.floor(idx/12));}
/* v1.39: the live wall-clock month, shown next to the inflation dial so the reference date of
   every today's-money figure is visible instead of implied. */
function nowLabel(){const n=new Date();return MONTHS[n.getMonth()]+' '+n.getFullYear();}
function verdict(budget,req){
  const m=budget-req;
  if(m>=0)return{cls:'ok',glyph:'✓',word:'funded',m};
  if(m>=-0.1*req)return{cls:'warn',glyph:'!',word:'tight',m};
  return{cls:'bad',glyph:'✕',word:'short',m};
}
function anchorC(){return COUNTRIES.find(c=>c.cc===state.plan.anchor)||COUNTRIES[0];}
/* v1.41 — THE HOME TARGET, replacing the frozen SAFETY_NET=300000 constant.
   His numbers (Jul 26 2026): "about 250k would be fine, but that is in today's euros".
   The planning question is NOT "what is my floor worth today" — it is "what will the house
   COST by then". So the target is entered in TODAY'S euros and grown FORWARD to the plan-end
   date, then compared to the plan-end floor: nominal vs nominal, same date, no deflator on
   either side. When inflHome == inflEng this is arithmetically identical to the old
   deflate-the-floor comparison — the whole point is that they are ALLOWED TO DIFFER, because
   Dutch house prices have historically outrun the consumer basket, and that gap is exactly
   the risk he is trying to see. Hence its own rate, defaulting ABOVE INFL_DEFAULT. */
/* (HOME_DEFAULT / INFL_HOME_DEFAULT are declared at the TOP with INFL_DEFAULT — const TDZ:
   defaults() runs at load, long before this line. Same trap as v1.33.) */
function homeToday(){const v=+state.plan.home;return isFinite(v)&&v>=0?Math.round(v):HOME_DEFAULT;}
function inflHome(){const v=+state.plan.inflHome;return isFinite(v)?Math.min(20,Math.max(0,Math.round(v*100)/100)):INFL_HOME_DEFAULT;}
/* the target grown forward over the SAME horizon everything else uses (v1.38/v1.39) */
function homeAt(end){return homeToday()*Math.pow(1+inflHome()/100,realYrs(end));}
/* v1.33: TWO independent inflation rates (were the single const INFL=2.3). Both clamp 0–20 %/yr and
   fall back to INFL_DEFAULT if a saved value is junk. inflEng() drives the Engine floor check;
   inflSpend() drives the Actual-spend lens. His ask Jul 22 2026: engine + actual-spend on different rates. */
function inflEng(){const v=+state.plan.inflEng;return isFinite(v)?Math.min(20,Math.max(0,Math.round(v*100)/100)):INFL_DEFAULT;}
function inflSpend(){const v=+state.plan.inflSpend;return isFinite(v)?Math.min(20,Math.max(0,Math.round(v*100)/100)):INFL_DEFAULT;}
/* v1.38 — THE SINGLE DEFLATION HORIZON. Every “in today’s money / today’s euros” figure in the
   app deflates from the PLAN-END date back to TODAY, and they all get that horizon from HERE.
   Depends on END only: moving the START dial changes how long the pot compounds, never what
   “today” means.
   ⚠ SUPERSEDES the v1.29 rule that the surplus lens should deflate over its own n-month window.
   That made the lens quote PLAN-START euros under a “today’s euros” label, so the Engine floor
   check and the Actual-spend lens silently answered in two different currencies-of-the-day
   (v1.32’s start dial widened the gap to n vs 18+end — 54 vs 66 months at start Jun-2027,
   ≈ €8.9k on a €350k pot at 3%). Both call this now, so they can never drift apart again.

   v1.39 — “TODAY” IS NOW COMPUTED, NOT BAKED IN. This used to read (18+end)/12, where 18 was
   the months from mid-2026 to Dec-2027. That was only true in mid-2026: it overstated the
   horizon by one month for every month that passed, so by the mid-2027 departure it would have
   been charging ~12 months of inflation that had ALREADY HAPPENED, quietly understating every
   real figure. ANCHOR = Dec 2027 = end index 0 (the endLabel convention). monthsToAnchor()
   counts real calendar months from the current month to that anchor and goes NEGATIVE once
   today passes Dec-2027 — correct, because the distance to a FIXED plan-end date shrinks as
   time runs. Clamped to a sane band so a badly-set device clock degrades instead of printing
   nonsense; at the band edge it lands on the historical 18. */
const REF_ANCHOR_Y=2027, REF_ANCHOR_M=11; /* Date-style month index: 11 = December */
function monthsToAnchor(d){
  const n=(d instanceof Date&&!isNaN(d.getTime()))?d:new Date();
  const m=(REF_ANCHOR_Y-n.getFullYear())*12+(REF_ANCHOR_M-n.getMonth());
  return isFinite(m)?Math.min(18,Math.max(-240,m)):18; /* 18 = the mid-2026 value this replaced */
}
function realYrs(end){return (monthsToAnchor()+end)/12;}
/* v1.32: the floor is a fixed amount at the plan-END date, so its today's-money value depends
   on END only (never on start). Param `end` = the end month index; deflation horizon from today
   to that date = realYrs(end): live months from this month to Dec-2027/index-0, then + end.
   Moving the START dial changes the monthly budget, not this check — economically correct.
   v1.33: deflation rate = inflEng() (was the shared INFL). */
function floorCheck(floor,end){
  const infl=inflEng();
  if(floor<=0)return{real:0,target:0,gap:0,below:false,infl,html:'Dials at zero — set the start principal and floor to see the inflation check.'};
  const yrs=realYrs(end); /* v1.38: the shared today→plan-end horizon */
  const real=floor/Math.pow(1+infl/100,yrs);
  /* v1.41: the home target grown FORWARD to the same date, at its OWN rate. below = the floor
     does not cover the house by then. Both sides nominal, both at plan end — no deflator. */
  const target=homeAt(end),gap=floor-target,below=gap<0;
  /* v1.43 — OPTION A, his pick: same sentence, the figures stop hiding in it. The three
     numbers he actually reads (the floor, its today’s-money value, the home target) go into
     .fig — serif face, tabular numerals — and the GAP leaves the prose entirely to become a
     .gapchip carrying a GLYPH AND A SIGN (▲ + / ▼ −) as well as colour, so the verdict is
     never colour-only. The chip is now the sole state carrier: the old whole-line .floorwarn
     amber is GONE (it fought the chip’s red, two warning hues for one fact). Chosen over the
     ledger and bar layouts to spend no extra vertical space. All interpolated values are
     machine-formatted numbers/labels — no user free text reaches this HTML. */
  return{real,target,gap,below,infl,
    html:'Ends <b class="fig">'+endLabel(end)+'</b> at <b class="fig">'+fmtE(floor)+'</b>, held by construction (≈ <b class="fig dim">'+fmtE(real)+'</b> in today’s money at '+infl+'%/yr). A <b class="fig dim">'+fmtE(homeToday())+'</b> home today ≈ <b class="fig">'+fmtE(target)+'</b> by then at '+inflHome()+'%/yr — <span class="gapchip '+(below?'neg':'pos')+'">'+(below?'▼ −'+fmtE(-gap):'▲ +'+fmtE(gap))+'</span>'};
}
/* v1.15 SURPLUS LENS (v1.16: lives in MATCH, INFL const) — type the real all-in monthly
   spend; if it undercuts the mix yield the pot GROWS. Same declining-balance recurrence
   as monthlyBudget, run forward (end = P·g − S·(g−1)/i over the plan months).
   ⚠ v1.38 REVERSES v1.29. v1.29 made this lens deflate over its own n-month compounding
   window so that "growth and deflation share the window". Internally tidy, but it silently
   changed WHICH DATE the real number is expressed in: plan-start euros, under a label that
   says today's euros — while the Engine floor check kept quoting genuine today's euros. The
   two headline real numbers therefore disagreed by the start offset (Joël, Jul 25 2026:
   €306.4k here vs €297.5k there on identical dials). The label is the contract, so both now
   deflate to TODAY via realYrs(p.end). Consequence to expect and NOT re-file as a bug: with
   a yield only slightly above inflation the real end value can sit BELOW the nominal
   principal, because the pot earns nothing over the months between today and the plan start
   — that is a true statement about purchasing power, and the floor check has always said it.
   keep = the real-preservation spend: principal·(yield − infl)/12 — spend under THAT and the
   pot grows in real terms too.
   v1.33: this lens runs on inflSpend() — its OWN inflation rate, independent of the Engine floor check. */
function surplusProj(S){
  const p=state.plan,y=currentYield(),i=y/100/12,n=horizon(p),infl=inflSpend(); /* v1.32: horizon = end−start; pot compounds over the plan months and (v1.29) deflates over the SAME window. v1.33: infl = the actual-spend rate */
  const g=Math.pow(1+i,n);
  const end=i>0?p.principal*g-S*(g-1)/i:p.principal-S*n;
  /* v1.38 BUGFIX: real is deflated over realYrs(p.end) — today → plan end — NOT over n.
     n is how long the pot COMPOUNDS (start → end); it is not how far the end value sits from
     today. Using n anchored this line to the plan-START date while the label said today’s
     euros, so it disagreed with the Engine floor check by exactly the start offset. */
  return{y,end,infl,real:end/Math.pow(1+infl/100,realYrs(p.end)),keep:Math.max(0,p.principal*(y-infl)/100/12)};
}
function secDiv(n,name,sub){return '<div class="secdiv" id="sd-'+name.toLowerCase()+'"><span class="secn">'+n+'</span><b>'+name+'</b><span class="secsub">'+esc(sub)+'</span></div>';}

/* ---------- shared bits ---------- */
function chip(cls,glyph,txt){return '<span class="chip '+cls+'"><b>'+glyph+'</b> '+esc(txt)+'</span>';}
/* v1.18 — stamp age: every stamped figure now knows how old it is. Past STALE_DAYS the
   stamp itself goes amber with a re-verify nudge ("never display a number the app
   can't vouch for" extended from yields to everything). */
function stampAge(d){const t=new Date(d+'T00:00:00');return isFinite(t)?Math.floor((Date.now()-t)/864e5):0;}
function stampLine(d){const a=stampAge(d),old=a>STALE_DAYS;return '<span class="stamp'+(old?' floorwarn':'')+'">stamped '+esc(d)+(old?' · '+a+'d old — re-verify':'')+'</span>';}
/* small verification mark for figures totalled line-by-line in Joël's own COL ledger (not guide estimates) */
function vmark(){return '<span class="vmark" title="Hand-costed line-by-line from your COL verification ledger — his real lifestyle, accommodation & protein noted per place (only Chiang Mai + Cebu are pool+gym; beef where it is his staple, a chicken/fish mix where beef is dear); ex-insurance. Not a guide estimate.">✓ hand-costed</span>';}
function poolmark(){return '<span class="vmark pool" title="Costed with a pool+gym condo (Chiang Mai + Cebu) — every other place is a regular condo or lean studio.">★ pool+gym</span>';}
function mixmark(){return '<span class="vmark mix" title="Beef is not the main protein here — costed as a local meat/fish mix instead: goat-forward in India (beef is banned), chicken-forward on the Thai islands (imported beef is dear), pork/chicken/fish in Hindu Bali (Ubud, Sanur, Amed, Lovina — imported beef dear).">◆ beef not main</span>';}
function estmark(){return '<span class="vmark est" title="Guide estimate — NOT yet hand-costed from your COL verification ledger. Calibrated from cost-of-living guides (guide ×0.7), not totalled line-by-line like the unmarked places. Treat as indicative until hand-costed.">◌ guide estimate</span>';}

/* ---------- ENGINE view ---------- */
function renderEngine(){
  const p=state.plan,en=engineNumbers(),di=driftInfo(),bl=currentBlend();
  const fc=floorCheck(p.floor,p.end),n=horizon(p);
  let h='';
  h+=secDiv('01','Engine','what the principal yields');
  h+='<div class="hero"><div class="heron" id="heroW">'+fmtE(en.w)+'</div><div class="herosub">per month · sustainable to <span id="heroFloor">'+fmtE(p.floor)+'</span> · <span id="heroSpan">'+endLabel(p.start)+' → '+endLabel(p.end)+'</span></div>';
  h+='<div class="herobk" id="heroBk">≈ '+fmtE(en.yieldMo)+' yield + '+fmtE(en.draw)+' draw-down · computed on the declining balance</div></div>';
  h+='<div class="card"><div class="lbl">The four dials</div>';
  h+='<div class="slrow"><div class="slhead"><span>Start principal</span><span class="num" id="prV">'+fmtE(p.principal)+'</span></div><input type="range" id="prS" min="0" max="800000" step="5000" value="'+p.principal+'"></div>';
  h+='<div class="slrow"><div class="slhead"><span>Acceptable floor at plan end</span><span class="num" id="flV">'+fmtE(p.floor)+'</span></div><input type="range" id="flS" min="0" max="'+p.principal+'" step="5000" value="'+Math.min(p.floor,p.principal)+'"></div>';
  h+='<div class="slrow"><div class="slhead"><span>Plan start — when the drawdown begins</span><span class="num" id="stV">'+endLabel(p.start)+'</span></div><input type="range" id="stS" min="-6" max="'+(p.end-6)+'" step="6" value="'+p.start+'"></div>';
  h+='<div class="slrow"><div class="slhead"><span>Plan end — off-ramp &amp; possible return</span><span class="num" id="tmV">'+endLabel(p.end)+' · '+n+' mo</span></div><input type="range" id="tmS" min="6" max="156" step="6" value="'+p.end+'"></div>';
  /* v1.40: id was #chk2032 — a year baked into an element name back when the plan ended in
     2032. Renamed to #chkFloor; the id is referenced only here and in updateEngineNumbers. */
  h+='<div class="fchk" id="chkFloor">'+fc.html+'</div>';
  /* v1.33: inflation dial for the floor check — independent of the actual-spend lens rate (in Match) */
  h+='<div class="instog"><span class="instog-lbl">Inflation — floor check <span class="sub">deflates the plan-end floor to today’s money · today = '+nowLabel()+'</span></span><span class="cywrap"><input type="number" id="inEng" class="cyin" inputmode="decimal" min="0" max="20" step="0.1" value="'+inflEng()+'">%/yr</span></div>';
  /* v1.41: the home target — entered in TODAY’S euros, grown forward at its own rate. Two rows,
     one control each, mirroring the inflation-dial pattern. */
  h+='<div class="instog"><span class="instog-lbl">Home target <span class="sub">what the place would cost TODAY — grown forward to '+endLabel(p.end)+'</span></span><span class="cywrap">€<input type="number" id="hmIn" class="cyin" style="width:6.2em" inputmode="numeric" min="0" step="5000" value="'+homeToday()+'"></span></div>';
  h+='<div class="instog"><span class="instog-lbl">Inflation — housing <span class="sub">its own rate: Dutch house prices have run above CPI</span></span><span class="cywrap"><input type="number" id="inHome" class="cyin" inputmode="decimal" min="0" max="20" step="0.1" value="'+inflHome()+'">%/yr</span></div>';
  h+='</div>';
  h+='<div class="card"><div class="lbl">Instrument mix</div>';
  for(const b of BLENDS){
    const y=blendYield(b.mix),w=monthlyBudget(p.principal,p.floor,y,n),open=ui.blend===b.id;
    const comp=Object.keys(b.mix).map(k=>Math.round(b.mix[k]*100)+'% '+esc(INSTRUMENTS[k].name)).join(' · ');
    h+='<label class="pick'+(b.id===p.blend?' on':'')+'"><input type="radio" name="blend" value="'+b.id+'"'+(b.id===p.blend?' checked':'')+'>';
    h+='<span class="pickbody"><span class="pickhead"><b>'+esc(b.name)+'</b><span class="num">'+pct(y)+' · '+fmtE(w)+'/mo</span></span>';
    h+='<span class="picksub">'+esc(b.sub)+'</span>';
    /* v1.12: expandable per-instrument breakdown — share, net yield, live € amount + why it earned its place */
    if(open){
      h+='<span class="bdet">';
      for(const k in b.mix){
        h+='<span class="brow2"><span><b>'+Math.round(b.mix[k]*100)+'%</b> '+esc(INSTRUMENTS[k].name)+'</span><span class="num">'+pct(instYield(k))+(p.principal>0?' · '+fmtK(p.principal*b.mix[k]):'')+'</span></span>';
        h+='<span class="bref">'+esc(INSTRUMENTS[k].ref)+' · stamped '+esc(INSTRUMENTS[k].stamp)+'</span>';
        if(b.why&&b.why[k])h+='<span class="bwhy">'+esc(b.why[k])+'</span>';
      }
      h+='</span>';
    }else{
      h+='<span class="pickcomp">'+comp+'</span>';
    }
    h+='<button type="button" class="btgl" data-bd="'+b.id+'">'+(open?'▾ hide the why':'▸ why this mix — every instrument’s place')+'</button>';
    h+='</span></label>';
  }
  const cy=custY(),cw=monthlyBudget(p.principal,p.floor,cy,n);
  h+='<label class="pick'+(p.blend==='custom'?' on':'')+'"><input type="radio" name="blend" value="custom"'+(p.blend==='custom'?' checked':'')+'>';
  h+='<span class="pickbody"><span class="pickhead"><b>Custom yield</b><span class="num cywrap"><input type="number" id="cyIn" class="cyin" inputmode="decimal" min="0" max="12" step="0.01" value="'+cy+'">% · <span id="cyW">'+fmtE(cw)+'/mo</span></span></span>';
  h+='<span class="picksub">What-if dial — type any net yield and this row shows the sustainable monthly. Select it and the hero + Match run on it; the four mixes above stay untouched.</span></span></label>';
  h+='<div class="anchorline chip-'+di.cls+'"><b>'+di.glyph+'</b> '+esc(di.txt)+'</div>';
  h+='<div class="foot">All four are now LADDERS, or a ladder behind a cash tier — the Jul-2026 redesign. The shelf back end is nearly flat (iBonds-2030 → 2031 is only 17bp, ≈16bp per year of lock) while its front end is steep (iBonds-2029 → MMF is 108bp, ≈42bp/yr), so spreading the core across maturity dates costs almost nothing and holding cash is where the yield actually goes. The axis is WHEN money turns into cash at par, and at what mark: Never red → Long ladder is ≈€146/mo, and the floor dial moves more than that on its own (€305k → €295k ≈ €172/mo). ⚠ The ≈€52k at Kraken is NOT powder — it buys BTC before departure, so every euro of crash-deploy firepower in the 2028–2032 window comes from inside this pot. The iBonds core is also marginable — a second line of crisis firepower without selling (see Playbooks → Crash). Core on fixed maturity dates, yields NET of fund fees. RETIRED Jul 2026: Early home (its tranche fell ≈€64–84k short of a house at a €310k pot), Safe powder and Priced powder (single-bullet books paying only 1–2bp for holding everything to Jan 2032). Saved plans migrate: Safe powder → Ladder, Priced powder → Long ladder, Early home → Cash + ladder.</div></div>';
  h+='<div class="card"><div class="lbl">Crypto sleeve — a lens, not a branch</div>';
  h+='<input type="number" id="slv" class="numin" min="0" step="5000" value="'+p.sleeve+'">';
  h+='<div id="lensT"></div></div>';
  h+='<div class="lbl sect">Where the capital sits — broker survivability</div>';
  h+='<div class="card">';
  for(const b of BROKERS){h+='<div class="brow"><span class="chip '+b.v+'"><b>'+b.glyph+'</b> '+esc(b.word)+'</span><div><b>'+esc(b.n)+(b.star?' ⭐':'')+'</b><div class="sub">'+esc(b.d)+'</div></div></div>';}
  h+='<div class="foot">Load-bearing: most NL/EU brokers close accounts on deregistration. Open IBKR + Swissquote while still NL-resident — see Path.</div></div>';
  h+='<div class="foot disc">Snapshot '+DATA_STAMP+' · sources in the four research docs · not financial advice — verify before acting.</div>';
  $('#view-engine').innerHTML=h;
  bindEngine();renderLens();
}
function renderSpend(){
  const p=state.plan,el=$('#spT');if(!el)return;
  if(!(p.spend>0)){el.innerHTML='<div class="foot">Type your real all-in monthly spend (COL + €120 insurance + visa amortisation). Spend under the mix yield and the pot GROWS — this shows where it lands by plan end, nominal and in today’s euros. The budget above stays the sustainable MAXIMUM; this lens runs the other direction.</div>';return;}
  if(!(p.principal>0)){el.innerHTML='<div class="foot">Set the start-principal dial first — this lens projects it forward at your typed spend.</div>';return;}
  const s=surplusProj(p.spend),d=s.end-p.principal,m1=p.principal*s.y/100/12-p.spend;
  let h='<div class="lrow"><span>pot at '+endLabel(p.end)+'</span><span class="num">'+fmtE(s.end)+'</span></div>';
  h+='<div class="lrow"><span>in today’s euros ('+s.infl+'%/yr)</span><span class="num">'+fmtE(s.real)+'</span></div>';
  h+='<div class="lrow"><span>vs start principal</span><span class="num">'+(d>=0?'+':'−')+fmtE(Math.abs(d))+'</span></div>';
  h+='<div class="lrow"><span>first-month surplus (yield − spend)</span><span class="num">'+(m1>=0?'+':'−')+fmtE(Math.abs(m1))+'/mo</span></div>';
  h+='<div class="foot">Runs on the selected mix ('+pct(s.y)+') and the plan-end dial, before any crash-deploy. Real-preservation spend at this mix ≈ '+fmtE(s.keep)+'/mo — under that, the pot grows in REAL terms too, not just on paper.</div>';
  if(s.end<p.floor)h+='<div class="notep">⚠ This spend runs the pot below your '+fmtE(p.floor)+' floor by '+endLabel(p.end)+' — it exceeds the sustainable draw shown in Engine.</div>';
  el.innerHTML=h;
}
function renderLens(){
  const p=state.plan,a=anchorC(),el=$('#lensT');if(!el)return;
  const rows=[['flat',1],['2×',2],['5×',5]].map(([lab,m])=>{
    const v=p.sleeve*m;return '<div class="lrow"><span>'+lab+'</span><span class="num">'+fmtE(v)+'</span></div>';
  }).join('');
  let note='Off-ramp at '+a.f+' '+esc(a.n)+': '+esc(a.anchor?a.anchor.off.split('.')[0]:'—')+'.';
  let gate=(a.anchor&&a.anchor.gates.length)?'<div class="notep">⚠ '+esc(a.anchor.gates[0])+'</div>':'';
  el.innerHTML=rows+'<div class="foot">'+note+' Outcomes are a lens on the numbers — the plan does not branch on them.</div>'+gate;
}
function updateEngineNumbers(){
  const p=state.plan,en=engineNumbers(),n=horizon(p);
  $('#heroW').textContent=fmtE(en.w);$('#heroFloor').textContent=fmtE(p.floor);
  $('#heroBk').textContent='≈ '+fmtE(en.yieldMo)+' yield + '+fmtE(en.draw)+' draw-down · computed on the declining balance';
  $('#prV').textContent=fmtE(p.principal);$('#flV').textContent=fmtE(p.floor);
  $('#stV').textContent=endLabel(p.start);
  $('#tmV').textContent=endLabel(p.end)+' · '+n+' mo';$('#heroSpan').textContent=endLabel(p.start)+' → '+endLabel(p.end);
  const fc=floorCheck(p.floor,p.end),ck=$('#chkFloor');ck.innerHTML=fc.html; /* v1.43: HTML now — the .gapchip carries the state, no whole-line class toggle */
  const fl=$('#flS');fl.max=p.principal;if(+fl.value>p.principal)fl.value=p.principal;
  /* v1.32: keep the start dial below the end dial — its max tracks end−6 (mirrors the floor≤principal guard) */
  const st=$('#stS');if(st){st.max=p.end-6;if(+st.value>p.end-6)st.value=p.end-6;}
  document.querySelectorAll('#view-engine .pick').forEach(pk=>{
    const id=pk.querySelector('input').value;
    if(id==='custom'){$('#cyW').textContent=fmtE(monthlyBudget(p.principal,p.floor,custY(),n))+'/mo';return;}
    const b=BLENDS.find(x=>x.id===id);
    const y=blendYield(b.mix),w=monthlyBudget(p.principal,p.floor,y,n);
    pk.querySelector('.pickhead .num').textContent=pct(y)+' · '+fmtE(w)+'/mo';
  });
  if(ui.blend){const bd=BLENDS.find(x=>x.id===ui.blend);if(bd){const ks=Object.keys(bd.mix);
    document.querySelectorAll('#view-engine .bdet .brow2 .num').forEach((el,i)=>{const k=ks[i];if(!k)return;
      el.textContent=pct(instYield(k))+(p.principal>0?' · '+fmtK(p.principal*bd.mix[k]):'');});}}
}
function bindEngine(){
  $('#prS').oninput=e=>{state.plan.principal=+e.target.value;if(state.plan.floor>state.plan.principal)state.plan.floor=state.plan.principal;save();updateEngineNumbers();};
  $('#prS').onchange=()=>renderMatch();
  $('#flS').oninput=e=>{state.plan.floor=Math.min(+e.target.value,state.plan.principal);save();updateEngineNumbers();};
  $('#flS').onchange=()=>renderMatch();
  /* v1.32: plan START dial — month index, earliest -6 (Jun 2027), kept ≤ end−6 so the horizon stays ≥6 mo */
  $('#stS').oninput=e=>{const v=Math.max(-6,Math.min(state.plan.end-6,+e.target.value||0));state.plan.start=v;save();updateEngineNumbers();};
  $('#stS').onchange=()=>renderMatch();
  /* plan END dial — if the end is dragged at/under the start, pull the start down with it (keep ≥6 mo, floor at Jun 2027) */
  $('#tmS').oninput=e=>{const v=Math.min(156,Math.max(6,+e.target.value||48));state.plan.end=v;if(state.plan.start>v-6)state.plan.start=Math.max(-6,v-6);save();updateEngineNumbers();};
  $('#tmS').onchange=()=>renderMatch();
  document.querySelectorAll('input[name=blend]').forEach(r=>r.onchange=e=>{state.plan.blend=e.target.value;save();renderEngine();renderMatch();});
  document.querySelectorAll('#view-engine .btgl').forEach(bt=>bt.onclick=e=>{e.preventDefault();e.stopPropagation();ui.blend=(ui.blend===bt.dataset.bd?null:bt.dataset.bd);renderEngine();});
  const cyi=$('#cyIn');
  cyi.oninput=e=>{state.plan.customY=+e.target.value;save();updateEngineNumbers();};
  cyi.onchange=e=>{state.plan.customY=custY();e.target.value=state.plan.customY;save();updateEngineNumbers();if(state.plan.blend==='custom')renderMatch();};
  /* v1.33: floor-check inflation dial — live-updates the floor check only (does NOT touch the budget or Match) */
  const ie=$('#inEng');if(ie){ie.oninput=e=>{state.plan.inflEng=+e.target.value;save();updateEngineNumbers();};
    ie.onchange=e=>{state.plan.inflEng=inflEng();e.target.value=state.plan.inflEng;save();updateEngineNumbers();};}
  /* v1.41: home target + housing rate. oninput only rewrites #chkFloor (updateEngineNumbers
     never touches these inputs), so typing keeps focus — same reason #inSpend sits outside #spT. */
  const hm=$('#hmIn');if(hm){hm.oninput=e=>{state.plan.home=+e.target.value;save();updateEngineNumbers();};
    hm.onchange=e=>{state.plan.home=homeToday();e.target.value=state.plan.home;save();updateEngineNumbers();};}
  const ih=$('#inHome');if(ih){ih.oninput=e=>{state.plan.inflHome=+e.target.value;save();updateEngineNumbers();};
    ih.onchange=e=>{state.plan.inflHome=inflHome();e.target.value=state.plan.inflHome;save();updateEngineNumbers();};}
  $('#slv').onchange=e=>{state.plan.sleeve=Math.max(0,+e.target.value||0);save();renderLens();};
}

/* ---------- MATCH view ---------- */
const ui={cc:null,book:null,blend:null}; /* blend = which mix breakdown is open (v1.12; v1.13 removed inst — instrument cards retired, breakdowns carry the shelf) */
function visaOf(c){return c.visa||0;} /* v1.27: per-country amortised visa €/mo (blended convention, from research-11 / ledger Visa tab), folded into every COL total */
function insOnState(){return state.plan.insOn!==false;} /* v1.28: master insurance switch */
function insAmt(){return insOnState()?INSURANCE:0;} /* v1.28: €120 IMG Global insurance, one master toggle for every location at once */
function reqFor(c){return(state.plan.colMode==='f'?c.col.f:c.col.n)+visaOf(c)+insAmt();}
function renderMatch(){
  const p=state.plan,en=engineNumbers(),insOn=insOnState();
  let h='';
  h+=secDiv('02','Match','where the budget lands');
  h+='<div class="card"><div class="matchhead"><div><div class="lbl">Budget from Engine</div><div class="heron sm num">'+fmtE(en.w)+'<span class="permo">/mo</span></div></div>';
  h+='<div class="colswitch"><button data-m="f" class="'+(p.colMode==='f'?'on':'')+'">Hand-costed</button><button data-m="n" class="'+(p.colMode==='n'?'on':'')+'">Comfort</button></div></div>';
  /* v1.28: master insurance toggle — one switch adds/removes the €120/mo IMG Global line across EVERY location at once */
  h+='<div class="instog"><span class="instog-lbl">Health insurance <b>€'+INSURANCE+'/mo</b> <span class="sub">IMG Global · same everywhere</span></span><div class="colswitch"><button data-ins="on" class="'+(insOn?'on':'')+'">Included</button><button data-ins="off" class="'+(!insOn?'on':'')+'">Off</button></div></div>';
  h+='<div class="foot"><b>Hand-costed</b> = your real line-by-line cost from the COL ledger (lean lifestyle, ex-insurance) — not tourist guides. <b>Comfort</b> = a looser, roomier band on top. '+(insOn?'Every row = COL + €'+INSURANCE+' IMG Global insurance, with each country’s amortised visa cost (cheapest legal route) folded into the COL figure':'<b>Insurance is toggled off</b> — every row = COL only, with each country’s amortised visa cost (cheapest legal route) folded in; flip it back to <b>Included</b> to add the €'+INSURANCE+'/mo everywhere')+' — expand a card for the per-country amount + max stay, or the ledger Visa tab for line-by-line. Flights come on top.</div></div>';
  /* v1.16: the surplus lens lives HERE (his placement call) — between the budget and the live-through list */
  h+='<div class="card"><div class="lbl">Actual spend — a lens, not a branch</div>';
  h+='<input type="number" id="spIn" class="numin" inputmode="numeric" min="0" step="10" value="'+p.spend+'">';
  /* v1.33: this lens has its OWN inflation rate, separate from the Engine floor check */
  h+='<div class="instog"><span class="instog-lbl">Inflation — this lens <span class="sub">today’s-euros line + real-preservation spend</span></span><span class="cywrap"><input type="number" id="inSpend" class="cyin" inputmode="decimal" min="0" max="20" step="0.1" value="'+inflSpend()+'">%/yr</span></div>';
  h+='<div id="spT"></div></div>';
  h+='<div class="lbl sect">Live-through — can the Engine fund it?</div>';
  h+='<div class="foot">'+estmark()+' = still a guide estimate (guide ×0.7), NOT yet hand-costed — every place WITHOUT this mark is totalled line-by-line from your own COL ledger (real lifestyle, ex-insurance; accommodation & protein noted per place). '+poolmark()+' = pool+gym base (Chiang Mai + Cebu). '+mixmark()+' = beef is not the staple there (chicken/fish mix). Comfort is the looser, roomier band.</div>';
  const lives=COUNTRIES.filter(c=>c.roles.includes('live'));
  const rows=lives.map(c=>({c,req:reqFor(c),v:verdict(en.w,reqFor(c))}));
  rows.sort((a,b)=>b.v.m-a.v.m);
  for(const r of rows){
    const c=r.c,open=ui.cc===c.cc,col=(state.plan.colMode==='f'?c.col.f:c.col.n)+visaOf(c);
    let tags='';
    if(c.blocks)tags+='<span class="tag">'+esc(c.blocks)+'</span>';
    if(c.fx)tags+='<span class="tag warn">FX HIGH</span>';
    if(c.roles.includes('anchor'))tags+='<span class="tag ok">anchor</span>';
    if(c.demoted)tags+='<span class="tag bad">demoted anchor</span>';
    if(c.avoid)tags+='<span class="tag bad">residency: hard-avoid</span>';
    h+='<div class="card cc'+(open?' open':'')+'" data-cc="'+c.cc+'"><div class="chead"><div><b>'+c.f+' '+esc(c.n)+'</b> <span class="sub">'+esc(c.col.city)+'</span>'+(c.col.verified?'':' '+estmark())+tags;
    h+='<div class="sub num">'+(insOn?fmtE(col)+' + '+fmtE(INSURANCE)+' insurance = ':'')+'<span class="tot">'+fmtE(r.req)+'</span>'+(insOn?'':' <span class="insoff">insurance off</span>')+'</div></div>';
    h+='<span class="chip '+r.v.cls+'"><b>'+r.v.glyph+'</b> '+r.v.word+' '+(r.v.m>=0?'+':'−')+fmtE(Math.abs(r.v.m))+'</span></div>';
    if(c.places){h+='<div class="places"><div class="placelbl">Places costed'+(state.plan.colMode==='n'?' · real figures (hand-costed basis)':'')+'</div>';
      for(const pl of c.places){const preq=pl.f+visaOf(c)+insAmt(),pv=verdict(en.w,preq);
        h+='<div class="placerow"><span class="chip '+pv.cls+' pmini"><b>'+pv.glyph+'</b></span><div class="pinfo"><b>'+esc(pl.name)+'</b> <span class="sub">'+esc(pl.sub||'')+'</span>'+(pl.verified?'':' '+estmark())+(pl.pool?' '+poolmark():'')+(pl.beefMix?' '+mixmark():'')+'<div class="sub num">'+(insOn?fmtE(pl.f+visaOf(c))+' + '+fmtE(INSURANCE)+' = ':'')+'<span class="tot">'+fmtE(preq)+'</span> · '+pv.word+' '+(pv.m>=0?'+':'−')+fmtE(Math.abs(pv.m))+'</div>'+(pl.note?'<div class="pnote sub">'+esc(pl.note)+'</div>':'')+'</div></div>';}
      h+='</div>';}
    if(open){h+='<div class="cbody">'+stampLine(c.stamp);
      h+='<div class="kv"><span>Stay</span>'+esc(c.stay||'—')+'</div>';
      if(c.maxstay)h+='<div class="kv"><span>Max realistic stay</span>'+esc(c.maxstay)+'</div>';
      h+='<div class="kv"><span>Visa (in the total)</span>'+(visaOf(c)?'≈'+fmtE(visaOf(c))+'/mo amortised (cheapest legal route) — folded into the COL figure above':'€0 — EU freedom of movement / long visa-free stay')+'</div>';
      if(c.res)h+='<div class="kv"><span>Residency trigger — beyond day-count</span>'+esc(c.res)+'</div>';
      if(c.work)h+='<div class="kv"><span>Coaching income</span>'+esc(c.work)+'</div>';
      if(c.col.note)h+='<div class="kv"><span>COL note</span>'+esc(c.col.note)+' · confidence '+esc(c.col.conf)+'</div>';
      if(c.fx)h+='<div class="kv"><span>FX sensitivity</span>'+esc(c.fx)+'</div>';
      if(c.note)h+='<div class="kv"><span>Note</span>'+esc(c.note)+'</div>';
      if(c.demoted)h+='<div class="notep">'+esc(c.demoted)+'</div>';
      if(c.avoid)h+='<div class="notep">'+esc(c.avoid)+'</div>';
      h+='</div>';}
    h+='</div>';
  }
  h+='<div class="lbl sect">Anchor — tax residency for the off-ramp</div>';
  h+='<div class="foot">Work axis note: lines below are for his own online coaching practice (where THAT income is taxed). Local employment = separate big maybe, not modeled.</div>';
  for(const c of COUNTRIES.filter(x=>x.roles.includes('anchor'))){
    const a=c.anchor,on=p.anchor===c.cc;
    h+='<label class="pick anch'+(on?' on':'')+'"><input type="radio" name="anchor" value="'+c.cc+'"'+(on?' checked':'')+'>';
    h+='<span class="pickbody"><span class="pickhead"><b>'+c.f+' '+esc(c.n)+'</b>'+(c.primary?' <span class="star">⭐ primary</span>':'')+'<span class="sub">'+esc(a.verdict)+'</span></span>';
    h+='<span class="kv"><span>TRC</span>'+esc(a.trc)+'</span>';
    h+='<span class="kv"><span>Coaching</span>'+esc(a.coach)+'</span>';
    h+='<span class="kv"><span>Off-ramp</span>'+esc(a.off)+'</span>';
    for(const g of a.gates)h+='<span class="gate"><b>⚠</b> '+esc(g)+'</span>';
    h+='</span></label>';
  }
  h+='<div class="lbl sect">Hubs — execution venues, never places to live</div><div class="card">';
  for(const c of COUNTRIES.filter(x=>x.roles.includes('hub'))){
    h+='<div class="brow hubrow"><b class="hubname">'+c.f+' '+esc(c.n)+'</b><div class="sub num">'+fmtE(c.hub.wb)+'–'+fmtE(c.hub.wm)+' / week · '+esc(c.hub.note)+'</div></div>';
  }
  h+='<div class="foot">Guardrail 9 — the hub-click: execute EVERY sale physically from SG/HK/AE. Local CGT is 0 even if the sale were deemed locally sourced, which moots the PH “sold within” question. A 1–2 week trip = €500–1,500 + flights — a rounding error on the event that triggers it. Never a place to live.</div></div>';
  h+='<div class="foot disc">Snapshot '+DATA_STAMP+' · not tax or immigration advice.</div>';
  $('#view-match').innerHTML=h;
  document.querySelectorAll('.colswitch button[data-m]').forEach(b=>b.onclick=()=>{state.plan.colMode=b.dataset.m;save();renderMatch();});
  document.querySelectorAll('.colswitch button[data-ins]').forEach(b=>b.onclick=()=>{state.plan.insOn=(b.dataset.ins==='on');save();renderMatch();toast('Insurance '+(state.plan.insOn?'included (+€'+INSURANCE+'/mo everywhere)':'off — totals show COL + visa only'));});
  document.querySelectorAll('#view-match .cc .chead').forEach(hd=>hd.onclick=()=>{const cc=hd.parentElement.dataset.cc;ui.cc=(ui.cc===cc?null:cc);renderMatch();});
  document.querySelectorAll('input[name=anchor]').forEach(r=>r.onchange=e=>{state.plan.anchor=e.target.value;save();renderMatch();toast('Anchor set: '+e.target.value+' — Engine lens + Path follow');});
  $('#spIn').oninput=e=>{state.plan.spend=Math.max(0,+e.target.value||0);save();renderSpend();}; /* oninput + #spT-only rewrite keeps focus while typing (cyIn pattern) */
  /* v1.33: actual-spend inflation dial — lives OUTSIDE #spT so renderSpend() (which rewrites only #spT) keeps focus while typing */
  const isp=$('#inSpend');if(isp){isp.oninput=e=>{state.plan.inflSpend=+e.target.value;save();renderSpend();};
    isp.onchange=e=>{state.plan.inflSpend=inflSpend();e.target.value=state.plan.inflSpend;save();renderSpend();};}
  renderSpend();
}

/* ---------- PATH view ---------- */
/* v1.18 — the Agenda: the app's time layer. Dated deadlines sort by date (red past
   due, amber within 60 days), Prinsjesdag is computed live (3rd Tuesday of September,
   every year until departure), standing monitors follow. Freshness line at the foot
   watches the snapshot stamps the same way the ECB drift line watches the rate. */
/* v1.44: same start-of-day fix — Prinsjesdag used to drop off the agenda at midnight on
   Prinsjesdag itself, the one morning it matters most. `now` injectable for testing. */
function nextPrinsjesdag(now){const n=startOfDay(now||new Date());for(let y=n.getFullYear();;y++){const first=new Date(y,8,1);const off=(2-first.getDay()+7)%7;const p=new Date(y,8,1+off+14);if(p>=n)return p;}}
/* v1.44 — A RECURRING dated monitor carries a LIST of published dates and shows the
   next one still ahead. The ECB row was recurring but held ONE hardcoded date, so the
   morning after a decision it went permanently red and had to be rolled by hand — that,
   not "ageing", was the real cause of backlog #24. Same spirit as nextPrinsjesdag(),
   except these dates are PUBLISHED rather than computable, so the list is finite: when
   it runs out the row falls back to the LAST date and goes overdue, which is the honest
   signal that the calendar needs restocking. The app still never silently un-flags itself.
   `now` is injectable so the rollover can be tested at any point on the calendar. */
function startOfDay(d){const x=new Date(d);x.setHours(0,0,0,0);return x;}
function nextDue(list,now){const n=startOfDay(now||new Date());
  for(const s of list){const d=new Date(s+'T00:00:00');if(d>=n)return{due:d,exhausted:false};}
  return{due:new Date(list[list.length-1]+'T00:00:00'),exhausted:true};}
function dTo(d){return Math.ceil((d-new Date())/864e5);}
const MN3=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function shortDate(d){return MN3[d.getMonth()]+' '+d.getFullYear();}
function agendaRow(chipHtml,t,d){return '<div class="brow">'+chipHtml+'<div><b>'+esc(t)+'</b><div class="sub">'+esc(d)+'</div></div></div>';}
function agendaCard(){
  const dated=[],standing=[];
  for(const m of MONITORS){
    if(m.prinsjesdag)dated.push({due:nextPrinsjesdag(),t:m.t,d:m.d});
    else if(m.dues){const r=nextDue(m.dues);dated.push({due:r.due,t:m.t,
      d:m.d+(r.exhausted?' ⚠ The published date list has run out — restock it from the source calendar.':'')});}
    else if(m.due)dated.push({due:new Date(m.due+'T00:00:00'),t:m.t,d:m.d});
    else standing.push(m);
  }
  dated.sort((a,b)=>a.due-b.due);
  let h='<div class="card"><div class="lbl">Agenda — dated deadlines &amp; standing monitors</div>';
  for(const i of dated){
    const n=dTo(i.due);let c;
    if(n<0)c=chip('bad','✕','overdue');
    else if(n<=60)c=chip('warn','!',n+'d');
    else c=chip('muted','◌',shortDate(i.due));
    h+=agendaRow(c,i.t,i.d);
  }
  for(const m of standing)h+=agendaRow(chip('muted','◌','watch'),m.t,m.d);
  let oldest=DATA_STAMP;for(const k in INSTRUMENTS){if(INSTRUMENTS[k].stamp<oldest)oldest=INSTRUMENTS[k].stamp;}
  const stale=stampAge(oldest)>STALE_DAYS||stampAge(DATA_STAMP)>STALE_DAYS;
  h+='<div class="foot'+(stale?' floorwarn':'')+'">Freshness: data snapshot '+DATA_STAMP+' ('+stampAge(DATA_STAMP)+'d) · oldest instrument stamp '+oldest+' ('+stampAge(oldest)+'d) · ECB stamp '+ECB_STAMP.asOf+' (drift line in Engine watches it live). Stamps go amber past '+STALE_DAYS+' days.</div>';
  h+='</div>';
  return h;
}
function renderPath(){
  let h=secDiv('03','Path','the linear sequence');
  h+=agendaCard();
  h+='<div class="foot">Linear plan, plain checkboxes. Dependencies are text on purpose — real decisions are fuzzy; computed unlock logic was rejected for v1.</div>';
  for(const ph of PATH){
    const done=ph.steps.filter(s=>state.steps[s.id]).length;
    h+='<div class="phase"><div class="phead"><b>'+esc(ph.name)+'</b><span class="sub">'+esc(ph.when)+'</span><span class="num prog">'+done+'/'+ph.steps.length+'</span></div>';
    for(const s of ph.steps){
      const on=!!state.steps[s.id];
      h+='<label class="step'+(on?' done':'')+'"><input type="checkbox" data-step="'+s.id+'"'+(on?' checked':'')+'><span><b>'+esc(s.t)+'</b>'+(s.dep?'<span class="dep">'+esc(s.dep)+'</span>':'')+'</span></label>';
    }
    h+='</div>';
  }
  $('#view-path').innerHTML=h;
  document.querySelectorAll('#view-path input[type=checkbox]').forEach(cb=>cb.onchange=()=>{state.steps[cb.dataset.step]=cb.checked;if(!cb.checked)delete state.steps[cb.dataset.step];save();renderPath();});
}

/* ---------- PLAYBOOKS view ---------- */
function renderBooks(){
  let h=secDiv('04','Playbooks','contingencies');
  h+='<div class="foot">Contingency cards on a linear plan — the branches live here, not in the timeline.</div>';
  for(const b of PLAYBOOKS){
    const open=ui.book===b.id;
    h+='<div class="card cc book-'+b.accent+(open?' open':'')+'" data-book="'+b.id+'"><div class="chead"><div><span class="bicon">'+b.icon+'</span> <b>'+esc(b.title)+'</b>'+(b.sub?'<div class="sub">'+esc(b.sub)+'</div>':'')+'</div><span class="sub">'+(open?'−':'+')+'</span></div>';
    if(open){h+='<div class="cbody">';for(const s of b.body){if(s.h)h+='<div class="kv"><span>'+esc(s.h)+'</span>'+esc(s.p)+'</div>';else h+='<div class="notep plain">'+esc(s.p)+'</div>';}h+='</div>';}
    h+='</div>';
  }
  h+='<div class="foot disc">Not advice. Pre-exit the emergency plan stays “fly back and sell as an NL resident”; post-exit the decision tree governs — never sell as an NL resident from 2028 on.</div>';
  $('#view-books').innerHTML=h;
  document.querySelectorAll('#view-books .cc .chead').forEach(hd=>hd.onclick=()=>{const id=hd.parentElement.dataset.book;ui.book=(ui.book===id?null:id);renderBooks();});
}

/* ---------- nav: one page, scrollspy + scroll-to ---------- */
const VIEWS=['engine','match','path','books'];
let curView='engine';
function setActive(v){curView=v;document.querySelectorAll('#tabbar button').forEach(b=>b.classList.toggle('on',b.dataset.view===v));}
function gotoView(v){const el=$('#view-'+v);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});}
function renderAll(){renderEngine();renderMatch();renderPath();renderBooks();}
function setupSpy(){
  const secs=VIEWS.map(v=>$('#view-'+v)).filter(Boolean);
  const obs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)setActive(e.target.id.replace('view-',''));});},{rootMargin:'-45% 0px -50% 0px',threshold:0});
  secs.forEach(s=>obs.observe(s));
}
function openMenu(){
  $('#sheet').innerHTML='<div class="lbl">Waypoint v'+APP_VERSION+'</div>'
    +'<div class="sub">Data snapshot '+DATA_STAMP+' · ECB stamp '+ECB_STAMP.asOf+' ('+pct(ECB_STAMP.dfr)+')<br>'+esc(ECB_STAMP.note)+'</div>'
    +'<button id="mUpd">Check for updates</button>'
    +'<button id="mReset" class="danger">Reset plan (dials, anchor, checkmarks)</button>'
    +'<div class="sub disc">Plan lives only in this browser. Not financial, tax, legal or immigration advice.</div>';
  $('#sheetWrap').hidden=false;
  $('#mUpd').onclick=checkUpdates;
  $('#mReset').onclick=()=>{if(confirm('Reset the whole plan?')){state=defaults();save();$('#sheetWrap').hidden=true;renderAll();toast('Plan reset');}};
}
async function checkUpdates(){
  try{
    const r=await fetch('app.js?t='+Date.now(),{cache:'no-store'});const t=await r.text();
    const m=t.match(/APP_VERSION='([^']+)'/);
    if(m&&m[1]!==APP_VERSION){toast('Update '+m[1]+' available — close and reopen the app');}
    else toast('Up to date (v'+APP_VERSION+')');
  }catch(e){toast('Could not check — offline?');}
}
function init(){
  document.querySelectorAll('#tabbar button').forEach(b=>b.onclick=()=>gotoView(b.dataset.view));
  $('#menuBtn').onclick=openMenu;
  $('#sheetWrap').onclick=e=>{if(e.target.id==='sheetWrap')$('#sheetWrap').hidden=true;};
  renderAll();
  setupSpy();
  setActive('engine');
  fetchECB();
  if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
}
if(typeof document!=='undefined')init();
