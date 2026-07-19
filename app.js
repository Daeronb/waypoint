'use strict';
const APP_VERSION='1.17.0';
const LS='waypoint:v1';

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtE=v=>'€'+Math.round(v).toLocaleString('nl-NL');
const fmtK=v=>'€'+Math.round(v/1000)+'k';
const pct=v=>v.toFixed(2)+'%';
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast._h);toast._h=setTimeout(()=>t.classList.remove('show'),2600);}

/* ---------- state ---------- */
function defaults(){return{plan:{principal:0,floor:0,months:48,blend:'target3',colMode:'f',anchor:'PH',sleeve:0,customY:3,spend:0},steps:{},ecb:null};} /* v1.15: spend = his typed actual monthly all-in spend for the surplus lens (0 = lens shows its prompt) */ /* v1.11: customY = the what-if net yield behind the 4th 'Custom yield' row (plan.blend may be 'custom'). v1.9: default months = 48 = Dec 2031 (his pick). v1.5: months = plan horizon (Jan 2028 → end), third dial; earlier off-ramp+return = shorter horizon = higher monthly draw for the same floor. v1.4: fresh devices start at 0/0/0 (his call). v1.2: default anchor = PH; saved plans keep their own picks */
function load(){try{const s=JSON.parse(localStorage.getItem(LS));if(!s)return defaults();const d=defaults();s.plan=Object.assign(d.plan,s.plan||{});s.steps=s.steps||{};return s;}catch(e){return defaults();}}
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
function engineNumbers(){
  const p=state.plan,y=currentYield();
  const w=monthlyBudget(p.principal,p.floor,y,p.months);
  const ym=p.principal*y/100/12;
  return{y,w,yieldMo:ym,draw:Math.max(0,w-ym)};
}
/* months since Jan 2028 → calendar label (6 → Jun 2028, 36 → Dec 2030, 60 → Dec 2032) */
function endLabel(mo){const MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return MN[(mo-1)%12]+' '+(2028+Math.floor((mo-1)/12));}
function verdict(budget,req){
  const m=budget-req;
  if(m>=0)return{cls:'ok',glyph:'✓',word:'funded',m};
  if(m>=-0.1*req)return{cls:'warn',glyph:'!',word:'tight',m};
  return{cls:'bad',glyph:'✕',word:'short',m};
}
function anchorC(){return COUNTRIES.find(c=>c.cc===state.plan.anchor)||COUNTRIES[0];}
const SAFETY_NET=300000;  // the NL apartment safety net, in today’s money
const INFL=2.3;           // %/yr inflation for ALL today's-money math (floor check + surplus lens). His call Jul 19 2026: 2.3 conservative, was 2.0 — one constant, one truth
function floorCheck(floor,months){
  if(floor<=0)return{real:0,below:false,txt:'Dials at zero — set the start principal and floor to see the inflation check.'};
  const yrs=(18+months)/12; /* mid-2026 (today’s money) → Jan 2028 is 18 mo, then the plan horizon */
  const real=floor/Math.pow(1+INFL/100,yrs);
  const below=real<SAFETY_NET;
  return{real,below,txt:'Ends '+endLabel(months)+' at '+fmtE(floor)+' — floor held by construction. At '+INFL+'%/yr inflation ≈ '+fmtE(real)+' in today’s money — '+(below?'⚠ below':'still above')+' the '+fmtE(SAFETY_NET)+' NL apartment safety net.'};
}
/* v1.15 SURPLUS LENS (v1.16: lives in MATCH, INFL const) — type the real all-in monthly
   spend; if it undercuts the mix yield the pot GROWS. Same declining-balance recurrence
   as monthlyBudget, run forward (end = P·g − S·(g−1)/i over the plan months); the
   today's-euros figure uses the exact floorCheck convention (INFL %/yr, 18 mo from
   mid-2026 to the Jan-2028 pivot + the horizon). keep = the real-preservation spend:
   principal·(yield − INFL)/12 — spend under THAT and the pot grows in real terms too. */
function surplusProj(S){
  const p=state.plan,y=currentYield(),i=y/100/12,n=p.months;
  const g=Math.pow(1+i,n);
  const end=i>0?p.principal*g-S*(g-1)/i:p.principal-S*n;
  return{y,end,real:end/Math.pow(1+INFL/100,(18+n)/12),keep:Math.max(0,p.principal*(y-INFL)/100/12)};
}
function secDiv(n,name,sub){return '<div class="secdiv" id="sd-'+name.toLowerCase()+'"><span class="secn">'+n+'</span><b>'+name+'</b><span class="secsub">'+esc(sub)+'</span></div>';}

/* ---------- shared bits ---------- */
function chip(cls,glyph,txt){return '<span class="chip '+cls+'"><b>'+glyph+'</b> '+esc(txt)+'</span>';}
function stampLine(d){return '<span class="stamp">stamped '+esc(d)+'</span>';}
/* small verification mark for figures totalled line-by-line in Joël's own COL ledger (not guide estimates) */
function vmark(){return '<span class="vmark" title="Hand-costed line-by-line from your COL verification ledger — his real lifestyle, accommodation & protein noted per place (only Chiang Mai is pool+gym; beef where it is his staple, a chicken/fish mix where beef is dear); ex-insurance. Not a guide estimate.">✓ hand-costed</span>';}
function poolmark(){return '<span class="vmark pool" title="The only base costed with a pool+gym condo — every other place is a regular condo or lean studio.">★ pool+gym</span>';}
function mixmark(){return '<span class="vmark mix" title="Beef is not the main protein here — costed as a local meat/fish mix instead: goat-forward in India (beef is banned), chicken-forward on the Thai islands (imported beef is dear).">◆ beef not main</span>';}

/* ---------- ENGINE view ---------- */
function renderEngine(){
  const p=state.plan,en=engineNumbers(),di=driftInfo(),bl=currentBlend();
  const fc=floorCheck(p.floor,p.months);
  let h='';
  h+=secDiv('01','Engine','what the principal yields');
  h+='<div class="hero"><div class="heron" id="heroW">'+fmtE(en.w)+'</div><div class="herosub">per month · sustainable to <span id="heroFloor">'+fmtE(p.floor)+'</span> · 2028 → <span id="heroEnd">'+endLabel(p.months)+'</span></div>';
  h+='<div class="herobk" id="heroBk">≈ '+fmtE(en.yieldMo)+' yield + '+fmtE(en.draw)+' draw-down · computed on the declining balance</div></div>';
  h+='<div class="card"><div class="lbl">The three dials</div>';
  h+='<div class="slrow"><div class="slhead"><span>Start principal</span><span class="num" id="prV">'+fmtE(p.principal)+'</span></div><input type="range" id="prS" min="0" max="450000" step="5000" value="'+p.principal+'"></div>';
  h+='<div class="slrow"><div class="slhead"><span>Acceptable floor at plan end</span><span class="num" id="flV">'+fmtE(p.floor)+'</span></div><input type="range" id="flS" min="0" max="'+p.principal+'" step="5000" value="'+Math.min(p.floor,p.principal)+'"></div>';
  h+='<div class="slrow"><div class="slhead"><span>Plan end — off-ramp &amp; possible return</span><span class="num" id="tmV">'+endLabel(p.months)+' · '+p.months+' mo</span></div><input type="range" id="tmS" min="6" max="60" step="6" value="'+p.months+'"></div>';
  h+='<div class="foot'+(fc.below?' floorwarn':'')+'" id="chk2032">'+fc.txt+'</div>';
  h+='<div class="foot">A shorter plan spreads the same principal→floor drawdown over fewer months — sell &amp; return earlier and the monthly budget rises. Dec 2032 = the baseline fork.</div></div>';
  h+='<div class="card"><div class="lbl">Instrument mix</div>';
  for(const b of BLENDS){
    const y=blendYield(b.mix),w=monthlyBudget(p.principal,p.floor,y,p.months),open=ui.blend===b.id;
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
  const cy=custY(),cw=monthlyBudget(p.principal,p.floor,cy,p.months);
  h+='<label class="pick'+(p.blend==='custom'?' on':'')+'"><input type="radio" name="blend" value="custom"'+(p.blend==='custom'?' checked':'')+'>';
  h+='<span class="pickbody"><span class="pickhead"><b>Custom yield</b><span class="num cywrap"><input type="number" id="cyIn" class="cyin" inputmode="decimal" min="0" max="12" step="0.01" value="'+cy+'">% · <span id="cyW">'+fmtE(cw)+'/mo</span></span></span>';
  h+='<span class="picksub">What-if dial — type any net yield and this row shows the sustainable monthly. Select it and the hero + Match run on it; the four mixes above stay untouched.</span></span></label>';
  h+='<div class="anchorline chip-'+di.cls+'"><b>'+di.glyph+'</b> '+esc(di.txt)+'</div>';
  h+='<div class="foot">The first three mixes keep ≈€100k of crash-proof dry powder — a DUAL-DESTINATION pot: crash-deploy into cheap assets, or the first tranche of an early home purchase (Early home is built around this). Priced powder is the deliberate exception: a bounded-loss iBonds-2029 sleeve + €25k float instead (small known haircut, healed by a printed date). Core on fixed maturity dates, yields NET of fund fees. Never red → Priced powder gap ≈ €190/mo — the floor dial can absorb that on its own. The iBonds core is also marginable — a second €100k of crisis firepower without selling (see Playbooks → Crash).</div></div>';
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
  let h='<div class="lrow"><span>pot at '+endLabel(p.months)+'</span><span class="num">'+fmtE(s.end)+'</span></div>';
  h+='<div class="lrow"><span>in today’s euros ('+INFL+'%/yr)</span><span class="num">'+fmtE(s.real)+'</span></div>';
  h+='<div class="lrow"><span>vs start principal</span><span class="num">'+(d>=0?'+':'−')+fmtE(Math.abs(d))+'</span></div>';
  h+='<div class="lrow"><span>first-month surplus (yield − spend)</span><span class="num">'+(m1>=0?'+':'−')+fmtE(Math.abs(m1))+'/mo</span></div>';
  h+='<div class="foot">Runs on the selected mix ('+pct(s.y)+') and the plan-end dial, before any crash-deploy. Real-preservation spend at this mix ≈ '+fmtE(s.keep)+'/mo — under that, the pot grows in REAL terms too, not just on paper.</div>';
  if(s.end<p.floor)h+='<div class="notep">⚠ This spend runs the pot below your '+fmtE(p.floor)+' floor by '+endLabel(p.months)+' — it exceeds the sustainable draw shown in Engine.</div>';
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
  const p=state.plan,en=engineNumbers();
  $('#heroW').textContent=fmtE(en.w);$('#heroFloor').textContent=fmtE(p.floor);
  $('#heroBk').textContent='≈ '+fmtE(en.yieldMo)+' yield + '+fmtE(en.draw)+' draw-down · computed on the declining balance';
  $('#prV').textContent=fmtE(p.principal);$('#flV').textContent=fmtE(p.floor);
  $('#tmV').textContent=endLabel(p.months)+' · '+p.months+' mo';$('#heroEnd').textContent=endLabel(p.months);
  const fc=floorCheck(p.floor,p.months),ck=$('#chk2032');ck.textContent=fc.txt;ck.classList.toggle('floorwarn',fc.below);
  const fl=$('#flS');fl.max=p.principal;if(+fl.value>p.principal)fl.value=p.principal;
  document.querySelectorAll('#view-engine .pick').forEach(pk=>{
    const id=pk.querySelector('input').value;
    if(id==='custom'){$('#cyW').textContent=fmtE(monthlyBudget(p.principal,p.floor,custY(),p.months))+'/mo';return;}
    const b=BLENDS.find(x=>x.id===id);
    const y=blendYield(b.mix),w=monthlyBudget(p.principal,p.floor,y,p.months);
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
  $('#tmS').oninput=e=>{state.plan.months=Math.min(60,Math.max(6,+e.target.value||60));save();updateEngineNumbers();};
  $('#tmS').onchange=()=>renderMatch();
  document.querySelectorAll('input[name=blend]').forEach(r=>r.onchange=e=>{state.plan.blend=e.target.value;save();renderEngine();renderMatch();});
  document.querySelectorAll('#view-engine .btgl').forEach(bt=>bt.onclick=e=>{e.preventDefault();e.stopPropagation();ui.blend=(ui.blend===bt.dataset.bd?null:bt.dataset.bd);renderEngine();});
  const cyi=$('#cyIn');
  cyi.oninput=e=>{state.plan.customY=+e.target.value;save();updateEngineNumbers();};
  cyi.onchange=e=>{state.plan.customY=custY();e.target.value=state.plan.customY;save();updateEngineNumbers();if(state.plan.blend==='custom')renderMatch();};
  $('#slv').onchange=e=>{state.plan.sleeve=Math.max(0,+e.target.value||0);save();renderLens();};
}

/* ---------- MATCH view ---------- */
const ui={cc:null,book:null,blend:null}; /* blend = which mix breakdown is open (v1.12; v1.13 removed inst — instrument cards retired, breakdowns carry the shelf) */
function reqFor(c){return(state.plan.colMode==='f'?c.col.f:c.col.n)+INSURANCE;}
function renderMatch(){
  const p=state.plan,en=engineNumbers();
  let h='';
  h+=secDiv('02','Match','where the budget lands');
  h+='<div class="card"><div class="matchhead"><div><div class="lbl">Budget from Engine</div><div class="heron sm num">'+fmtE(en.w)+'<span class="permo">/mo</span></div></div>';
  h+='<div class="colswitch"><button data-m="f" class="'+(p.colMode==='f'?'on':'')+'">Hand-costed</button><button data-m="n" class="'+(p.colMode==='n'?'on':'')+'">Comfort</button></div></div>';
  h+='<div class="foot"><b>Hand-costed</b> = your real line-by-line cost from the COL ledger (lean lifestyle, ex-insurance) — not tourist guides. <b>Comfort</b> = a looser, roomier band on top. Every row = COL + €'+INSURANCE+' IMG Global insurance. Visa costs + flights come on top.</div></div>';
  /* v1.16: the surplus lens lives HERE (his placement call) — between the budget and the live-through list */
  h+='<div class="card"><div class="lbl">Actual spend — a lens, not a branch</div>';
  h+='<input type="number" id="spIn" class="numin" inputmode="numeric" min="0" step="10" value="'+p.spend+'">';
  h+='<div id="spT"></div></div>';
  h+='<div class="lbl sect">Live-through — can the Engine fund it?</div>';
  h+='<div class="foot">'+vmark()+' = totalled line-by-line from your own COL ledger (his real lifestyle, ex-insurance; accommodation & protein noted per place). '+poolmark()+' = the one pool+gym base (Chiang Mai only). '+mixmark()+' = beef is not the staple there (chicken/fish mix). The ✓ mark shows where the Hand-costed number is a real ledger total; unmarked countries are still guide-calibrated (guide ×0.7) even under this tab. Comfort is the looser, roomier band.</div>';
  const lives=COUNTRIES.filter(c=>c.roles.includes('live'));
  const rows=lives.map(c=>({c,req:reqFor(c),v:verdict(en.w,reqFor(c))}));
  rows.sort((a,b)=>b.v.m-a.v.m);
  for(const r of rows){
    const c=r.c,open=ui.cc===c.cc,col=state.plan.colMode==='f'?c.col.f:c.col.n;
    let tags='';
    if(c.blocks)tags+='<span class="tag">'+esc(c.blocks)+'</span>';
    if(c.fx)tags+='<span class="tag warn">FX HIGH</span>';
    if(c.roles.includes('anchor'))tags+='<span class="tag ok">anchor</span>';
    if(c.demoted)tags+='<span class="tag bad">demoted anchor</span>';
    if(c.avoid)tags+='<span class="tag bad">residency: hard-avoid</span>';
    h+='<div class="card cc'+(open?' open':'')+'" data-cc="'+c.cc+'"><div class="chead"><div><b>'+c.f+' '+esc(c.n)+'</b> <span class="sub">'+esc(c.col.city)+'</span>'+(c.col.verified?' '+vmark():'')+tags;
    h+='<div class="sub num">'+fmtE(col)+' + '+fmtE(INSURANCE)+' insurance = <span class="tot">'+fmtE(r.req)+'</span></div></div>';
    h+='<span class="chip '+r.v.cls+'"><b>'+r.v.glyph+'</b> '+r.v.word+' '+(r.v.m>=0?'+':'−')+fmtE(Math.abs(r.v.m))+'</span></div>';
    if(c.places){h+='<div class="places"><div class="placelbl">Places costed'+(state.plan.colMode==='n'?' · real figures (hand-costed basis)':'')+'</div>';
      for(const pl of c.places){const preq=pl.f+INSURANCE,pv=verdict(en.w,preq);
        h+='<div class="placerow"><span class="chip '+pv.cls+' pmini"><b>'+pv.glyph+'</b></span><div class="pinfo"><b>'+esc(pl.name)+'</b> <span class="sub">'+esc(pl.sub||'')+'</span>'+(pl.verified?' '+vmark():'')+(pl.pool?' '+poolmark():'')+(pl.beefMix?' '+mixmark():'')+'<div class="sub num">'+fmtE(pl.f)+' + '+fmtE(INSURANCE)+' = <span class="tot">'+fmtE(preq)+'</span> · '+pv.word+' '+(pv.m>=0?'+':'−')+fmtE(Math.abs(pv.m))+'</div>'+(pl.note?'<div class="pnote sub">'+esc(pl.note)+'</div>':'')+'</div></div>';}
      h+='</div>';}
    if(open){h+='<div class="cbody">'+stampLine(c.stamp);
      h+='<div class="kv"><span>Stay</span>'+esc(c.stay||'—')+'</div>';
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
  document.querySelectorAll('.colswitch button').forEach(b=>b.onclick=()=>{state.plan.colMode=b.dataset.m;save();renderMatch();});
  document.querySelectorAll('#view-match .cc .chead').forEach(hd=>hd.onclick=()=>{const cc=hd.parentElement.dataset.cc;ui.cc=(ui.cc===cc?null:cc);renderMatch();});
  document.querySelectorAll('input[name=anchor]').forEach(r=>r.onchange=e=>{state.plan.anchor=e.target.value;save();renderMatch();toast('Anchor set: '+e.target.value+' — Engine lens + Path follow');});
  $('#spIn').oninput=e=>{state.plan.spend=Math.max(0,+e.target.value||0);save();renderSpend();}; /* oninput + #spT-only rewrite keeps focus while typing (cyIn pattern) */
  renderSpend();
}

/* ---------- PATH view ---------- */
function renderPath(){
  let h=secDiv('03','Path','the linear sequence');
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
