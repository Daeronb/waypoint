'use strict';
const APP_VERSION='1.8.0';
const LS='waypoint:v1';

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtE=v=>'€'+Math.round(v).toLocaleString('nl-NL');
const fmtK=v=>'€'+Math.round(v/1000)+'k';
const pct=v=>v.toFixed(2)+'%';
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast._h);toast._h=setTimeout(()=>t.classList.remove('show'),2600);}

/* ---------- state ---------- */
function defaults(){return{plan:{principal:0,floor:0,months:60,blend:'target3',colMode:'f',anchor:'PH',sleeve:0},steps:{},ecb:null};} /* v1.5: months = plan horizon (Jan 2028 → end), third dial, default 60 = Dec 2032 baseline; earlier off-ramp+return = shorter horizon = higher monthly draw for the same floor. v1.4: fresh devices start at 0/0/0 (his call). v1.2: default anchor = PH; saved plans keep their own picks */
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
function engineNumbers(){
  const p=state.plan,y=blendYield(currentBlend().mix);
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
function floorCheck(floor,months){
  if(floor<=0)return{real:0,below:false,txt:'Dials at zero — set the start principal and floor to see the inflation check.'};
  const yrs=(18+months)/12; /* mid-2026 (today’s money) → Jan 2028 is 18 mo, then the plan horizon */
  const real=floor/Math.pow(1.02,yrs);
  const below=real<SAFETY_NET;
  return{real,below,txt:'Ends '+endLabel(months)+' at '+fmtE(floor)+' — floor held by construction. At 2%/yr inflation ≈ '+fmtE(real)+' in today’s money — '+(below?'⚠ below':'still above')+' the '+fmtE(SAFETY_NET)+' NL apartment safety net.'};
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
  h+=secDiv('01','Engine','what €350k yields');
  h+='<div class="anchorline chip-'+di.cls+'"><b>'+di.glyph+'</b> '+esc(di.txt)+'</div>';
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
    const y=blendYield(b.mix),w=monthlyBudget(p.principal,p.floor,y,p.months);
    const comp=Object.keys(b.mix).map(k=>Math.round(b.mix[k]*100)+'% '+esc(INSTRUMENTS[k].name)).join(' · ');
    h+='<label class="pick'+(b.id===p.blend?' on':'')+'"><input type="radio" name="blend" value="'+b.id+'"'+(b.id===p.blend?' checked':'')+'>';
    h+='<span class="pickbody"><span class="pickhead"><b>'+esc(b.name)+'</b><span class="num">'+pct(y)+' · '+fmtE(w)+'/mo</span></span>';
    h+='<span class="picksub">'+esc(b.sub)+'</span><span class="pickcomp">'+comp+'</span></span></label>';
  }
  h+='<div class="foot">Every mix keeps ≈€100k crash-deployable and the apartment core on fixed maturity dates (his 225/100/25 structure). Yields are NET of fund fees. Max-safety → max-yield gap ≈ €110/mo — the floor dial can absorb that on its own.</div></div>';
  h+='<div class="card"><div class="lbl">Crypto sleeve — a lens, not a branch</div>';
  h+='<input type="number" id="slv" class="numin" min="0" step="5000" value="'+p.sleeve+'">';
  h+='<div id="lensT"></div></div>';
  h+='<div class="lbl sect">Yield instrument cards</div>';
  for(const id in INSTRUMENTS){
    const ins=INSTRUMENTS[id],open=ui.inst===id;
    const yl=ins.live&&liveDFR()!=null?pct(instYield(id))+' (live: DFR '+(MMF_SPREAD<0?'−':'+')+Math.abs(MMF_SPREAD).toFixed(2)+')':pct(ins.yld);
    h+='<div class="card cc'+(open?' open':'')+'" data-inst="'+id+'"><div class="chead"><div><b>'+esc(ins.name)+'</b>'+(ins.star?' <span class="star">⭐ '+esc(ins.star)+'</span>':'')+'<div class="sub">'+esc(ins.ref)+'</div></div><div class="num big">'+yl+'</div></div>';
    if(open){h+='<div class="cbody">'+stampLine(ins.stamp);
      h+='<div class="kv"><span>Risk</span>'+esc(ins.risk)+'</div><div class="kv"><span>Liquidity</span>'+esc(ins.liq)+'</div><div class="kv"><span>Crash behavior</span>'+esc(ins.crash)+'</div><div class="kv"><span>Dry powder</span>#'+ins.powder+' — '+esc(POWDER_RANK[ins.powder])+'</div><div class="kv"><span>Holdable abroad</span>'+esc(ins.hold)+'</div>';
      if(ins.note)h+='<div class="notep">'+esc(ins.note)+'</div>';
      h+='</div>';}
    h+='</div>';
  }
  h+='<div class="lbl sect">Where the €350k sits — broker survivability</div>';
  h+='<div class="card">';
  for(const b of BROKERS){h+='<div class="brow"><span class="chip '+b.v+'"><b>'+b.glyph+'</b> '+esc(b.word)+'</span><div><b>'+esc(b.n)+(b.star?' ⭐':'')+'</b><div class="sub">'+esc(b.d)+'</div></div></div>';}
  h+='<div class="foot">Load-bearing: most NL/EU brokers close accounts on deregistration. Open IBKR + Swissquote while still NL-resident — see Path.</div></div>';
  h+='<div class="foot disc">Snapshot '+DATA_STAMP+' · sources in the four research docs · not financial advice — verify before acting.</div>';
  $('#view-engine').innerHTML=h;
  bindEngine();renderLens();
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
    const id=pk.querySelector('input').value,b=BLENDS.find(x=>x.id===id);
    const y=blendYield(b.mix),w=monthlyBudget(p.principal,p.floor,y,p.months);
    pk.querySelector('.pickhead .num').textContent=pct(y)+' · '+fmtE(w)+'/mo';
  });
}
function bindEngine(){
  $('#prS').oninput=e=>{state.plan.principal=+e.target.value;if(state.plan.floor>state.plan.principal)state.plan.floor=state.plan.principal;save();updateEngineNumbers();};
  $('#prS').onchange=()=>renderMatch();
  $('#flS').oninput=e=>{state.plan.floor=Math.min(+e.target.value,state.plan.principal);save();updateEngineNumbers();};
  $('#flS').onchange=()=>renderMatch();
  $('#tmS').oninput=e=>{state.plan.months=Math.min(60,Math.max(6,+e.target.value||60));save();updateEngineNumbers();};
  $('#tmS').onchange=()=>renderMatch();
  document.querySelectorAll('input[name=blend]').forEach(r=>r.onchange=e=>{state.plan.blend=e.target.value;save();renderEngine();renderMatch();});
  $('#slv').onchange=e=>{state.plan.sleeve=Math.max(0,+e.target.value||0);save();renderLens();};
  document.querySelectorAll('#view-engine .cc .chead').forEach(hd=>hd.onclick=()=>{const id=hd.parentElement.dataset.inst;ui.inst=(ui.inst===id?null:id);renderEngine();});
}

/* ---------- MATCH view ---------- */
const ui={inst:null,cc:null,book:null};
function reqFor(c){return(state.plan.colMode==='f'?c.col.f:c.col.n)+INSURANCE;}
function renderMatch(){
  const p=state.plan,en=engineNumbers();
  let h='';
  h+=secDiv('02','Match','where the budget lands');
  h+='<div class="card"><div class="matchhead"><div><div class="lbl">Budget from Engine</div><div class="heron sm num">'+fmtE(en.w)+'<span class="permo">/mo</span></div></div>';
  h+='<div class="colswitch"><button data-m="f" class="'+(p.colMode==='f'?'on':'')+'">frugal</button><button data-m="n" class="'+(p.colMode==='n'?'on':'')+'">normal</button></div></div>';
  h+='<div class="foot">Frugal is calibrated to experienced-nomad level (TH anchor €800, guides ×0.7) — not tourist guides. Every row = COL + €'+INSURANCE+' IMG Global insurance. Visa costs + flights come on top.</div></div>';
  h+='<div class="lbl sect">Live-through — can the Engine fund it?</div>';
  h+='<div class="foot">'+vmark()+' = totalled line-by-line from your own COL ledger (his real lifestyle, ex-insurance; accommodation & protein noted per place). '+poolmark()+' = the one pool+gym base (Chiang Mai only). '+mixmark()+' = beef is not the staple there (chicken/fish mix). Frugal shows that real number where costed; normal stays the looser guide band. Unmarked countries are still guide-calibrated (frugal = guide ×0.7).</div>';
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
    h+='<div class="sub num">'+fmtE(col)+' + '+fmtE(INSURANCE)+' insurance = '+fmtE(r.req)+'</div></div>';
    h+='<span class="chip '+r.v.cls+'"><b>'+r.v.glyph+'</b> '+r.v.word+' '+(r.v.m>=0?'+':'−')+fmtE(Math.abs(r.v.m)).slice(1)+'</span></div>';
    if(c.places){h+='<div class="places"><div class="placelbl">Places costed'+(state.plan.colMode==='n'?' · real figures (frugal basis)':'')+'</div>';
      for(const pl of c.places){const preq=pl.f+INSURANCE,pv=verdict(en.w,preq);
        h+='<div class="placerow"><span class="chip '+pv.cls+' pmini"><b>'+pv.glyph+'</b></span><div class="pinfo"><b>'+esc(pl.name)+'</b> <span class="sub">'+esc(pl.sub||'')+'</span>'+(pl.verified?' '+vmark():'')+(pl.pool?' '+poolmark():'')+(pl.beefMix?' '+mixmark():'')+'<div class="sub num">'+fmtE(pl.f)+' + '+fmtE(INSURANCE)+' = '+fmtE(preq)+' · '+pv.word+' '+(pv.m>=0?'+':'−')+fmtE(Math.abs(pv.m)).slice(1)+'</div>'+(pl.note?'<div class="pnote sub">'+esc(pl.note)+'</div>':'')+'</div></div>';}
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
    h+='<div class="brow"><b>'+c.f+' '+esc(c.n)+'</b><div class="sub num">'+fmtE(c.hub.wb)+'–'+fmtE(c.hub.wm)+' / week · '+esc(c.hub.note)+'</div></div>';
  }
  h+='<div class="foot">Guardrail 9 — the hub-click: execute EVERY sale physically from SG/HK/AE. Local CGT is 0 even if the sale were deemed locally sourced, which moots the PH “sold within” question. A 1–2 week trip = €500–1,500 + flights — a rounding error on the event that triggers it. Never a place to live.</div></div>';
  h+='<div class="foot disc">Snapshot '+DATA_STAMP+' · not tax or immigration advice.</div>';
  $('#view-match').innerHTML=h;
  document.querySelectorAll('.colswitch button').forEach(b=>b.onclick=()=>{state.plan.colMode=b.dataset.m;save();renderMatch();});
  document.querySelectorAll('#view-match .cc .chead').forEach(hd=>hd.onclick=()=>{const cc=hd.parentElement.dataset.cc;ui.cc=(ui.cc===cc?null:cc);renderMatch();});
  document.querySelectorAll('input[name=anchor]').forEach(r=>r.onchange=e=>{state.plan.anchor=e.target.value;save();renderMatch();toast('Anchor set: '+e.target.value+' — Engine lens + Path follow');});
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
