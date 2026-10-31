/* ===== ENGINE ===== */
export const COLORS=["#ff4d5a","#3da5ff","#3ddc84","#ffc233","#b57bff","#ff8a3d","#2ee6d6","#ff6bd6"];export const MAXS=8;
export const Engine=(()=>{
 let rnd=()=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296};
 const setRandom=f=>{rnd=f};
 const roll=n=>Array.from({length:n},()=>1+Math.floor(rnd()*6)); // DiceEngine: exactly n dice
 const sum=a=>a.reduce((x,y)=>x+y,0);
 function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
 const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
 function genMap(seed,cols,rows){ // hex graph, odd-r offset; seeded; connectivity validated
  const R=mulberry(hash(seed)),S=34,key=(c,r)=>c+","+r;
  const dl=r=>r&1?[[0,-1],[1,-1],[-1,0],[1,0],[0,1],[1,1]]:[[-1,-1],[0,-1],[-1,0],[1,0],[-1,1],[0,1]];
  let cells=[];for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)cells.push({c,r});
  const connected=cs=>{const m=new Map(cs.map(x=>[key(x.c,x.r),x])),seen=new Set([key(cs[0].c,cs[0].r)]),st=[cs[0]];
   while(st.length){const x=st.pop();for(const[d,e]of dl(x.r)){const k=key(x.c+d,x.r+e);if(m.has(k)&&!seen.has(k)){seen.add(k);st.push(m.get(k))}}}return seen.size===cs.length};
  for(let i=0,rm=Math.floor(R()*4);i<rm;i++){const k=Math.floor(R()*cells.length),tr=cells.filter((_,j)=>j!==k);if(connected(tr))cells=tr}
  const idx=new Map(cells.map((x,i)=>[key(x.c,x.r),i])),sy=["Al","Bar","Cor","Dun","El","Fen","Gal","Hel","Iv","Kar","Lor","Mor","Nor","Os","Pyr","Quen","Rav","Sol","Tor","Ul","Val","Wyn","Zar"],ed=["dor","wick","mere","gate","holm","reach","fall","vale","ton","spire"];
  const T=cells.map((x,i)=>({id:i,name:sy[Math.floor(R()*sy.length)]+ed[Math.floor(R()*ed.length)],x:S*Math.sqrt(3)*(x.c+(x.r&1?.5:0)),y:S*1.5*x.r,nb:dl(x.r).map(([d,e])=>idx.get(key(x.c+d,x.r+e))).filter(v=>v!==undefined),owner:0,n:1,S}));
  return T}
 function newGame(o){const seed=o.seed||String(Math.floor(Math.random()*1e9)),[cols,rows]=o.size.split("x").map(Number),T=genMap(seed,cols,rows);
  const P=Array.from({length:o.players},(_,i)=>({id:i,name:(i<o.humans?(o.names&&o.names.you||"Human"):(o.names&&o.names.ai||"AI"))+" "+(i+1),color:COLORS[i],ai:i<o.humans?0:o.diff,alive:true,atk:0,w:0,l:0}));
  const order=T.map((_,i)=>i).sort(()=>rnd()-.5);order.forEach((ti,k)=>{T[ti].owner=k%o.players;T[ti].n=1+Math.floor(rnd()*3)});
  return{v:1,seed,size:o.size,T,P,turn:0,round:1,hist:[],over:false,winner:-1,elapsed:0}}
 const canAttack=(G,a,d)=>{const A=G.T[a],D=G.T[d];return A.owner!==D.owner&&A.n>=2&&A.nb.includes(d)};
 const targets=(G,a)=>G.T[a].n<2?[]:G.T[a].nb.filter(d=>G.T[d].owner!==G.T[a].owner);
 function resolve(G,a,d){if(!canAttack(G,a,d))throw new Error("illegal");const A=G.T[a],D=G.T[d],ad=roll(A.n),dd=roll(D.n),as=sum(ad),ds=sum(dd);return{a,d,ad,dd,as,ds,win:as>ds,ao:A.owner,do:D.owner,round:G.round}}
 function apply(G,r){const A=G.T[r.a],D=G.T[r.d];G.P[r.ao].atk++;
  if(r.win){D.owner=A.owner;D.n=A.n-1;A.n=1;G.P[r.ao].w++;G.P[r.do].l+=0}else{A.n=1;G.P[r.ao].l++}
  G.hist.push({a:A.name,d:D.name,ao:r.ao,do:r.do,as:r.as,ds:r.ds,win:r.win,ad:r.ad.length,dd:r.dd.length});if(G.hist.length>200)G.hist.shift();
  refreshAlive(G);return G}
 function refreshAlive(G){G.P.forEach(p=>p.alive=G.T.some(x=>x.owner===p.id));const al=G.P.filter(p=>p.alive);if(al.length===1){G.over=true;G.winner=al[0].id}}
 function largest(G,pid){const own=new Set(G.T.filter(x=>x.owner===pid).map(x=>x.id)),seen=new Set();let best=0;
  for(const s of own){if(seen.has(s))continue;let c=0;const st=[s];seen.add(s);while(st.length){const x=st.pop();c++;for(const y of G.T[x].nb)if(own.has(y)&&!seen.has(y)){seen.add(y);st.push(y)}}best=Math.max(best,c)}return best}
 function reinforce(G,pid){let k=largest(G,pid),placed=0;while(k>0){const c=G.T.filter(x=>x.owner===pid&&x.n<MAXS);if(!c.length)break;c[Math.floor(rnd()*c.length)].n++;k--;placed++}return placed}
 function nextTurn(G){const prev=G.turn;let i=prev;do{i=(i+1)%G.P.length}while(!G.P[i].alive);if(i<=prev)G.round++;G.turn=i}
 return{newGame,genMap,canAttack,targets,resolve,apply,largest,reinforce,nextTurn,roll,sum,setRandom,refreshAlive}})();
