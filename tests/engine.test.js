import {describe,it,expect} from "vitest";
import {Engine,MAXS} from "../src/engine.js";
const mk=(owners,ns,edges)=>{const T=owners.map((o,i)=>({id:i,name:"T"+i,x:0,y:0,S:34,owner:o,n:ns[i],nb:[]}));edges.forEach(([a,b])=>{T[a].nb.push(b);T[b].nb.push(a)});
 return{T,P:Array.from({length:Math.max(...owners)+1},(_,i)=>({id:i,alive:true,atk:0,w:0,l:0})),turn:0,round:1,hist:[],over:false,winner:-1}};
const fix=v=>{let i=0;Engine.setRandom(()=>(v[i++%v.length]-.5)/6)};
describe("dice",()=>{
 it("rolls exactly n dice in 1..6",()=>{Engine.setRandom(Math.random);for(const n of[1,3,5,8]){const d=Engine.roll(n);expect(d).toHaveLength(n);d.forEach(x=>{expect(x).toBeGreaterThanOrEqual(1);expect(x).toBeLessThanOrEqual(6)})}});
 it("sums",()=>expect(Engine.sum([6,2,5,3,4,1])).toBe(21));
 it("battle uses 5 attacker and 3 defender dice",()=>{Engine.setRandom(Math.random);const G=mk([0,1],[5,3],[[0,1]]),r=Engine.resolve(G,0,1);expect(r.ad).toHaveLength(5);expect(r.dd).toHaveLength(3);expect(r.as).toBe(Engine.sum(r.ad))})});
describe("battle",()=>{
 it("attacker wins with higher total; 5 soldiers move",()=>{const G=mk([0,1],[6,4],[[0,1]]);fix([6,2,5,3,4,1,3,6,2,4]);const r=Engine.resolve(G,0,1);expect([r.as,r.ds,r.win]).toEqual([21,15,true]);Engine.apply(G,r);expect(G.T[1].owner).toBe(0);expect(G.T[1].n).toBe(5);expect(G.T[0].n).toBe(1)});
 it("defender wins when higher",()=>{const G=mk([0,1],[3,3],[[0,1]]);fix([1,1,1,6,6,6]);Engine.apply(G,Engine.resolve(G,0,1));expect(G.T[1].owner).toBe(1);expect(G.T[1].n).toBe(3);expect(G.T[0].n).toBe(1)});
 it("tie goes to defender",()=>{const G=mk([0,1],[2,2],[[0,1]]);fix([3,3,3,3]);const r=Engine.resolve(G,0,1);expect(r.win).toBe(false);Engine.apply(G,r);expect(G.T[1].owner).toBe(1);expect(G.T[0].n).toBe(1)});
 it("non-adjacent and 1-soldier attacks are illegal",()=>{const G=mk([0,1,1],[4,2,2],[[0,1],[1,2]]);expect(Engine.canAttack(G,0,2)).toBe(false);expect(()=>Engine.resolve(G,0,2)).toThrow();expect(Engine.canAttack(mk([0,1],[1,2],[[0,1]]),0,1)).toBe(false)})});
describe("reinforcement & end",()=>{
 it("uses largest connected group",()=>{const G=mk([0,0,0,0,0,0,0,1],[1,1,1,1,1,1,1,1],[[0,1],[1,2],[2,3],[3,4],[4,7],[7,5],[7,6]]);expect(Engine.largest(G,0)).toBe(5)});
 it("respects cap of 8",()=>{Engine.setRandom(Math.random);const G=mk([0,0,1],[7,8,1],[[0,1],[1,2]]);Engine.reinforce(G,0);expect(G.T[0].n).toBe(8);expect(G.T[1].n).toBe(8);expect(Engine.reinforce(mk([0,0,1],[8,8,1],[[0,1],[1,2]]),0)).toBe(0);expect(MAXS).toBe(8)});
 it("eliminates a player and ends the game",()=>{const G=mk([0,1],[3,2],[[0,1]]);fix([6,6,6,1,1]);Engine.apply(G,Engine.resolve(G,0,1));expect(G.P[1].alive).toBe(false);expect(G.over).toBe(true);expect(G.winner).toBe(0)})});
describe("map",()=>{
 it("is seeded, symmetric and connected",()=>{const a=Engine.genMap("abc",7,6),b=Engine.genMap("abc",7,6);expect(a.map(x=>x.name)).toEqual(b.map(x=>x.name));
  a.forEach(x=>x.nb.forEach(n=>expect(a[n].nb).toContain(x.id)));const seen=new Set([0]),st=[0];while(st.length)for(const n of a[st.pop()].nb)if(!seen.has(n)){seen.add(n);st.push(n)}expect(seen.size).toBe(a.length)})});
