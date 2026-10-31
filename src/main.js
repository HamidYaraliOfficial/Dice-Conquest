import "./styles.css";
import en from "./i18n/en.json";
import fa from "./i18n/fa.json";
import zh from "./i18n/zh-CN.json";
import {Engine,MAXS,COLORS} from "./engine.js";
import {AI} from "./ai.js";
const L={en,fa,zh};


const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let lang="en";const t=k=>(L[lang]&&L[lang][k])||L.en[k]||k;
const ls={g:k=>{try{return localStorage.getItem(k)}catch(e){return null}},s:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}},d:k=>{try{localStorage.removeItem(k)}catch(e){}}};
let cfg={snd:1,anim:matchMedia("(prefers-reduced-motion:reduce)").matches?0:1,sp:1};
try{Object.assign(cfg,JSON.parse(ls.g("dc_cfg")||"{}"))}catch(e){}
const saveCfg=()=>ls.s("dc_cfg",JSON.stringify(cfg));
/* ===== UI ===== */
let G=null,busy=false,sel=-1,vb=null,vb0=null,tgts=[],snd=null,gameId=0,els=[];
const SVGNS="http://www.w3.org/2000/svg",sleep=ms=>new Promise(r=>setTimeout(r,cfg.anim?ms/cfg.sp:Math.min(ms/cfg.sp,40)));
const beep=(f,d=.08)=>{if(!cfg.snd)return;try{snd=snd||new AudioContext();const o=snd.createOscillator(),g=snd.createGain();o.frequency.value=f;o.type="triangle";g.gain.value=.05;o.connect(g);g.connect(snd.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,snd.currentTime+d);o.stop(snd.currentTime+d)}catch(e){}};
function applyLang(){document.documentElement.lang=lang==="zh"?"zh-CN":lang;document.documentElement.dir=lang==="fa"?"rtl":"ltr";
 $$("[data-t]").forEach(e=>e.textContent=t(e.dataset.t));$("#howT").innerHTML=t("howT");$("#lang").value=$("#lang2").value=lang;ls.s("dc_lang",lang);if(G)refresh();}
function show(id){$$(".scr").forEach(s=>s.classList.toggle("on",s.id===id))}
function toast(m){const e=$("#toast");e.textContent=m;e.classList.add("on");clearTimeout(toast.h);toast.h=setTimeout(()=>e.classList.remove("on"),1800)}
function buildMap(){const svg=$("#map");svg.innerHTML='<g id="lay"></g><g id="fx"></g>';els=[];let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const lay=$("#lay");
 G.T.forEach(T=>{const g=document.createElementNS(SVGNS,"g");g.setAttribute("class","hx");const S=T.S-2,pts=[0,1,2,3,4,5].map(i=>{const a=Math.PI/180*(60*i-30);return(T.x+S*Math.cos(a)).toFixed(1)+","+(T.y+S*Math.sin(a)).toFixed(1)}).join(" ");
  g.innerHTML=`<title></title><polygon points="${pts}"></polygon><text x="${T.x}" y="${T.y}"></text>`;g.onclick=e=>{if(!drag.moved)clickT(T.id)};g.onmouseenter=()=>info(T.id);g.onpointerdown=null;lay.appendChild(g);els.push(g);
  x0=Math.min(x0,T.x-T.S);y0=Math.min(y0,T.y-T.S);x1=Math.max(x1,T.x+T.S);y1=Math.max(y1,T.y+T.S)});
 vb0={x:x0-20,y:y0-20,w:x1-x0+40,h:y1-y0+40};vb={...vb0};setVB()}
function setVB(){$("#map").setAttribute("viewBox",`${vb.x} ${vb.y} ${vb.w} ${vb.h}`)}
function refresh(){if(!G)return;const cur=G.P[G.turn];
 G.T.forEach((T,i)=>{const g=els[i],p=G.P[T.owner];g.querySelector("polygon").style.fill=p.color;g.querySelector("text").textContent=T.n;g.querySelector("title").textContent=`${T.name} — ${p.name} — ${T.n} ${t("sold")}`;
  g.setAttribute("class","hx"+(sel===i?" sel":"")+(tgts.includes(i)?" tgt":"")+(sel>=0&&sel!==i&&!tgts.includes(i)?" dim":""))});
 const alive=G.P.filter(p=>p.alive).length;
 $("#hud").innerHTML=`<span><span class="dot" style="color:${cur.color};background:${cur.color}"></span><b>${t("turn")}:</b> ${cur.name}</span><span><b>${t("round")}:</b> ${G.round}</span><span><b>${t("left")}:</b> ${alive}/${G.P.length}</span>`;
 $("#pls").innerHTML=G.P.map(p=>{const ts=G.T.filter(x=>x.owner===p.id);return`<div class="pl${p.id===G.turn&&!G.over?" act":""}${p.alive?"":" dead"}"><span class="dot" style="color:${p.color};background:${p.color}"></span>${p.name}${p.alive?"":" ("+t("defeated")+")"}<small>${ts.length} ${t("terr")} · ${ts.reduce((s,x)=>s+x.n,0)} ${t("sold")}</small></div>`}).join("");
 $("#reinf").textContent=`${t("reinf")}: +${Engine.largest(G,G.turn)}`;
 $("#hist").innerHTML=`<b>${t("hist")}</b><br>`+G.hist.slice(-6).reverse().map(h=>`<span style="color:${G.P[h.ao].color}">${h.a}</span> (${h.as}) → <span style="color:${G.P[h.do].color}">${h.d}</span> (${h.ds}) · ${h.win?t("conq"):(h.as===h.ds?t("tie")+"/":"")+t("held")}`).join("<br>");
 $("#bEnd").disabled=busy||G.over||cur.ai>0;if(sel<0)$("#info").innerHTML=""}
function info(i){if(!G)return;const T=G.T[i],p=G.P[T.owner];$("#info").innerHTML=`<b style="color:${p.color}">${T.name}</b><br>${t("owner")}: ${p.name}<br>${t("sold")}: ${T.n} (${T.n} ${t("dice")})<br>${t("nb")}: ${T.nb.map(n=>G.T[n].name).join(", ")}`}
function clickT(i){if(!G||busy||G.over||G.P[G.turn].ai)return;const T=G.T[i];info(i);
 if(sel<0){if(T.owner!==G.turn)return toast(t("notYours"));if(T.n<2)return toast(t("needTwo"));pick(i);return}
 if(i===sel){pick(-1);return}
 if(tgts.includes(i)){const a=sel;pick(-1);fight(a,i);return}
 if(T.owner===G.turn){if(T.n<2)return toast(t("needTwo"));pick(i);return}
 toast(t("notAdj"))}
function pick(i){sel=i;tgts=i<0?[]:Engine.targets(G,i);refresh();if(i>=0)info(i)}
const dieEl=v=>`<div class="die">${v}</div>`;
async function fight(a,d,fast){const gid=gameId;busy=true;refresh();const r=Engine.resolve(G,a,d),A=G.T[a],D=G.T[d]; // result decided BEFORE animation
 const fx=$("#fx"),ln=document.createElementNS(SVGNS,"line");ln.setAttribute("class","atkline");[["x1",A.x],["y1",A.y],["x2",D.x],["y2",D.y]].forEach(([k,v])=>ln.setAttribute(k,v));fx.appendChild(ln);
 const side=(el,p,T,n)=>{el.innerHTML=`<h4 style="color:${p.color}">${p.name}<br><small>${T.name}</small></h4><div class="dice">${Array.from({length:n},()=>'<div class="die roll">?</div>').join("")}</div><div class="tot">…</div>`};
 side($("#bA"),G.P[r.ao],A,r.ad.length);side($("#bD"),G.P[r.do],D,r.dd.length);$("#bt").classList.add("on");beep(300);
 const f=fast?.6:1;await sleep(650*f);if(gid!==gameId)return;
 const fill=(el,ds,tot)=>{[...el.querySelectorAll(".die")].forEach((e,i)=>{e.classList.remove("roll");e.textContent=ds[i]});el.querySelector(".tot").textContent=tot};
 fill($("#bA"),r.ad,r.as);fill($("#bD"),r.dd,r.ds);beep(520);await sleep(450*f);
 const res=document.createElement("div");res.className="res";res.style.color=r.win?"#3ddc84":"#ff5a6a";res.textContent=r.win?t("win"):t("lose");(r.win?$("#bA"):$("#bD")).appendChild(res);beep(r.win?780:200,.2);await sleep(750*f);
 $("#bt").classList.remove("on");ln.remove();if(gid!==gameId)return;
 Engine.apply(G,r);busy=false;save();refresh();if(G.over)return victory();return r}
async function endTurn(){if(!G||G.over||busy)return;busy=true;pick(-1);Engine.reinforce(G,G.turn);Engine.nextTurn(G);busy=false;save();refresh();beep(440);
 const p=G.P[G.turn];if(p.ai)aiTurn();else if(G.P.filter(x=>x.alive&&!x.ai).length>1)toast(p.name)}
async function aiTurn(){const gid=gameId;const lvl=G.P[G.turn].ai;if(!lvl)return;busy=true;refresh();
 let n=AI.maxAttacks(lvl);await sleep(450);
 while(n-->0&&G&&gid===gameId&&!G.over){const m=AI.pick(G,lvl);if(!m)break;sel=m.a;tgts=[m.d];refresh();await sleep(350);if(gid!==gameId)return;sel=-1;tgts=[];await fight(m.a,m.d,true);if(gid!==gameId)return;busy=true;await sleep(150)}
 if(gid!==gameId||G.over)return;busy=false;await endTurn()}
function victory(){const w=G.P[G.winner],ts=G.T.length,sd=G.T.reduce((s,x)=>s+x.n,0),tm=Math.round(G.elapsed/1000),mm=Math.floor(tm/60)+":"+String(tm%60).padStart(2,"0");ls.d("dc_save");
 $("#vicC").innerHTML=`<h1 class="logo" style="font-size:44px">${t("win")}</h1><h2 style="color:${w.color}">${t("winner")}: ${w.name}</h2><p>${t("terr")}: ${ts} · ${t("sold")}: ${sd}<br>${t("atks")}: ${w.atk} · ${t("wins")}: ${w.w} · ${t("losses")}: ${w.l}<br>${t("time")}: ${mm}</p><p>${G.P.filter(p=>p.id!==w.id).map(p=>p.name+" — "+t("defeated")).join("<br>")}</p><button class="btn pri" id="vAgain">${t("again")}</button> <button class="btn" id="vMenu">${t("toMenu")}</button>`;
 $("#vic").classList.add("on");$("#vAgain").onclick=()=>{$("#vic").classList.remove("on");start(lastOpt)};$("#vMenu").onclick=toMenu;beep(660,.4)}
function toMenu(){gameId++;busy=false;$("#vic").classList.remove("on");$("#bt").classList.remove("on");show("menu");$("#bCont").disabled=!ls.g("dc_save")}
let lastOpt=null,t0=0;
function start(o){gameId++;lastOpt=o;G=Engine.newGame({...o,names:{you:t("you"),ai:t("ai")}});t0=Date.now();sel=-1;tgts=[];busy=false;$("#vic").classList.remove("on");show("game");buildMap();refresh();save();if(G.P[G.turn].ai)aiTurn()}
function save(){if(!G||G.over)return;G.elapsed=Date.now()-t0;ls.s("dc_save",JSON.stringify({v:1,seed:G.seed,size:G.size,opt:lastOpt,owners:G.T.map(x=>x.owner),ns:G.T.map(x=>x.n),P:G.P,turn:G.turn,round:G.round,hist:G.hist,elapsed:G.elapsed}))}
function load(){const raw=ls.g("dc_save");if(!raw)return toast(t("noSave"));try{const s=JSON.parse(raw);if(s.v!==1)throw 0;const [c,r]=s.size.split("x").map(Number),T=Engine.genMap(s.seed,c,r);
  if(s.owners.length!==T.length||s.ns.some(n=>!(n>=1&&n<=MAXS))||!Array.isArray(s.P)||!(s.turn>=0&&s.turn<s.P.length))throw 0;
  T.forEach((x,i)=>{x.owner=s.owners[i];x.n=s.ns[i];if(!s.P[x.owner])throw 0});
  gameId++;G={v:1,seed:s.seed,size:s.size,T,P:s.P,turn:s.turn,round:s.round,hist:s.hist||[],over:false,winner:-1,elapsed:s.elapsed||0};lastOpt=s.opt;t0=Date.now()-G.elapsed;sel=-1;tgts=[];busy=false;show("game");buildMap();refresh();if(G.P[G.turn].ai)aiTurn()
 }catch(e){ls.d("dc_save");$("#bCont").disabled=true;toast(t("badSave"))}}
/* pan & zoom */
const drag={on:false,moved:false,x:0,y:0};
const mapEl=$("#map");
mapEl.addEventListener("pointerdown",e=>{drag.on=true;drag.moved=false;drag.x=e.clientX;drag.y=e.clientY});
addEventListener("pointermove",e=>{if(!drag.on||!vb)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>6)drag.moved=true;if(!drag.moved)return;const k=vb.w/mapEl.clientWidth;vb.x-=dx*k;vb.y-=dy*k;drag.x=e.clientX;drag.y=e.clientY;setVB()});
addEventListener("pointerup",()=>{drag.on=false;setTimeout(()=>drag.moved=false,0)});
function zoom(f,cx,cy){if(!vb)return;const r=mapEl.getBoundingClientRect(),px=cx===undefined?.5:(cx-r.left)/r.width,py=cy===undefined?.5:(cy-r.top)/r.height,nw=Math.min(vb0.w*2,Math.max(vb0.w/4,vb.w*f)),nh=nw*vb.h/vb.w;vb.x+=(vb.w-nw)*px;vb.y+=(vb.h-nh)*py;vb.w=nw;vb.h=nh;setVB()}
mapEl.addEventListener("wheel",e=>{e.preventDefault();zoom(e.deltaY>0?1.12:.89,e.clientX,e.clientY)},{passive:false});
$("#zi").onclick=()=>zoom(.8);$("#zo").onclick=()=>zoom(1.25);$("#zr").onclick=()=>{vb={...vb0};setVB()};
/* wiring */
const opts=()=>{const p=Math.min(8,Math.max(2,+$("#sP").value||2)),h=Math.min(p,Math.max(0,+$("#sH").value||0));return{players:p,humans:h,diff:+$("#sD").value,size:$("#sS").value,seed:$("#sSeed").value.trim(),snd:$("#sSnd").checked}};
let backTo="menu";
$("#bNew").onclick=()=>show("setup");$("#sBack").onclick=()=>show("menu");$("#sGo").onclick=()=>{const o=opts();cfg.snd=o.snd?1:0;saveCfg();start(o)};
$("#bQuick").onclick=()=>start({players:4,humans:1,diff:2,size:"7x6",seed:""});
$("#bCont").onclick=load;$("#bHow").onclick=()=>show("how");$("#bSet").onclick=()=>{$("#oSnd").checked=!!cfg.snd;$("#oAnim").value=cfg.anim;$("#oSp").value=cfg.sp;show("sett")};$("#bAbout").onclick=()=>show("about");
$$("[data-back]").forEach(b=>b.onclick=()=>show("menu"));
$("#oSnd").onchange=e=>{cfg.snd=e.target.checked?1:0;saveCfg()};$("#oAnim").onchange=e=>{cfg.anim=+e.target.value;saveCfg()};$("#oSp").onchange=e=>{cfg.sp=+e.target.value;saveCfg()};
$("#oReset").onclick=()=>{cfg={snd:1,anim:1,sp:1};saveCfg();lang="en";applyLang();$("#oSnd").checked=true;$("#oAnim").value=1;$("#oSp").value=1};
$("#lang").onchange=$("#lang2").onchange=e=>{lang=e.target.value;applyLang()};
$("#bEnd").onclick=endTurn;$("#bMenu").onclick=()=>{save();toMenu()};
addEventListener("beforeunload",()=>save());
lang=ls.g("dc_lang")||"en";if(!L[lang])lang="en";applyLang();$("#bCont").disabled=!ls.g("dc_save");
