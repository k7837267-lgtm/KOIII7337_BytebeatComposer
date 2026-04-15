smpRate=16000;
const TAU=PI*2,PHI=1.6180339887498948;
mod=(n,m)=>(n%m+m)%m;fract=x=>(x%1+1)%1;
mix=(a,b,t)=>a+(b-a)*t;
clamp=(x,mn,mx)=>min(max(x,mn),mx);
createArray=(n,v)=>Array.from({length:n},(_,i)=>typeof v==="function"?v(i):v);
readArray=(a,i)=>a[mod(floor(i),a.length)];
linReadArray=(a,i)=>mix(a[mod(floor(i),a.length)],a[mod(floor(i)+1,a.length)],fract(i));
class linCurve{
 constructor(points=[]){this.points=points;this.sort();}
 sort(){this.points=this.points.sort((a, b)=>a[0]-b[0]);}
 add(x,y){
  this.points.push([x,y]);
  this.sort();
 }
 remove(index){this.points.splice(index,1);}
 get(x){
  let p=this.points;
  if(p.length===0)return 0;
  if(x<=p[0][0])return p[0][1];
  if(x>=p[p.length-1][0])return p[p.length-1][1];
  let i=p.findIndex(pt=>pt[0]>x),
      p0=p[i-1],p1=p[i];
  return mix(p0[1],p1[1],(x-p0[0])/(p1[0]-p0[0]));
 }
}
class optLinCurve{
 constructor(points=[]){
  this.x=new Float32Array(points.length);
  this.y=new Float32Array(points.length);
  this.slopes=new Float32Array(points.length);
  points.sort((a,b)=>a[0]-b[0]).forEach((p,i)=>this._set(i,p[0],p[1]));
  this._updateSlopes();
 }
 _set(i,x,y){this.x[i]=x;this.y[i]=y;}
 _updateSlopes(){
  for(let i=0;i<this.x.length-1;i++)
   this.slopes[i]=(this.y[i+1]-this.y[i])/(this.x[i+1]-this.x[i]);
 }
 get(x){
  const len = this.x.length;
  if(len===0)return 0;
  if(x<=this.x[0])return this.y[0];
  if(x>=this.x[len-1])return this.y[len-1];
  //binary search
  let low=0,high=len-1;
  while(low<high){
   let mid=(low+high)>>>1;
   if(this.x[mid]<x){low=mid+1;}
   else{high=mid;}
  }
  const i=low-1;
  return this.y[i]+this.slopes[i]*(x-this.x[i]);
 }
}
hash=n=>{
 n=Math.imul(n^(n>>>16),0x85ebca6b);
 n=Math.imul(n^(n>>>13),0xc2b2ae35);
 n^=n>>>16;
 return(n>>>0)/0xffffffff;
};
goldNoise=x=>{return fract(tan(abs(x*PHI-x))*x);};
seed=237485;//12345;
prng=()=>(seed=(seed*1664525+1013904223)%4294967296)/4294967296;
rand=(a=1,b=null)=>b===null?prng()*a:prng()*(b-a)+a;
randArr=(n,a=1,b=null)=>Array.from({length:n},()=>rand(a,b));
pickRand=a=>a[floor(rand(a.length))];
nHz=n=>432*pow(2,n/12);
normalize=b=>{
 let m=0;
 for(let i=0;i<b.length;i++)m=Math.max(m,Math.abs(b[i]));
 if(m>0)for(let i=0;i<b.length;i++)b[i]/=m;
 return b;
};
generators=[
 ()=>{
  let len=rand(3,10)|0,
      freqs=randArr(len,200,2e3),
      phases=randArr(len),
      lengths=randArr(len,.05,1.5),maxLen=max(...lengths),
      volEnvs=lengths.map(l=>{
       let pts=createArray(rand(2,6)|0,()=>[rand(l),rand()**3]);
       return new linCurve([[0,0],[.05,1],[l,0],...pts]);
      }),
      LFOs=createArray(len,()=>[rand(10,4e3),rand(1,900)]);
      buff=new Float32Array(maxLen*smpRate|0);
  for(let i=0;i<buff.length;i++){
   let t=i/smpRate,o=0;
   for(let j=0;j<len;j++){
    if(t>lengths[j])continue;
    o+=sin(phases[j]*TAU)*volEnvs[j].get(t);
    phases[j]=fract(phases[j]+((freqs[j]+sin(t*LFOs[j][0])*LFOs[j][1])/smpRate));
   }
   buff[i]=tanh(o);
  }
  return normalize(buff);
 },
 ()=>{
  let len=rand(.1,1.5)*smpRate|0,buff=new Float32Array(len);
      car=rand(40,1e3),modF=rand(2000),mul=rand(500),
      phase=0,mPhase=0;
  for(let i=0;i<len;i++){
   let t=i/len,env=pow(1-t,4);
   mPhase=fract(mPhase+(modF*env)/smpRate);
   phase=fract(phase+(car+sin(mPhase*TAU)*mul*env)/smpRate);
   buff[i] = tanh(sin(phase*TAU)*2)*env;
   if(hash(modF+i)>.98)buff[i]+=(random()-.5)*.2*env;
  }
  return buff;
 }
];
/*test=createArray(24,()=>pickRand(generators)());
return t=>{
 //return(sin(PI*2*440*t)*exp(-t*3))*.9+(hash(t*smpRate)-.5)*.025;
 let o=0;for(let i=0;i<test.length;i++)o+=linReadArray(test[i],t*smpRate)
 return o/test.length;
};*/
class OnePole{
 constructor(){this.v=0;}
 process(input,cutoffHz){
  let f=clamp((TAU*cutoffHz)/smpRate,0,.99);
  this.v+=f*(input-this.v);
  return this.v;
 }
}
ratios=[.5,1,1,1.5,2,4,.75];
beatOptions=[3,4,5,7,8,11];
makePattern=(beats,isAnchor=false)=>{
 let notes=[];
 const tempo=140,beatDur=60/tempo,sixteenth=beatDur/4,
       totalLen=beats*beatDur;
 if(isAnchor){ //metric anchor for the beat
  for(let i=0;i<beats*4;i++){
   if(i%4===0||hash(seed+i)>.75){
    notes.push({
     t:i*sixteenth,
     dur:sixteenth*.4,
     vel:i%8===0?.9:.4,
     pitch:1,cutoff:4e3
    });
   }
  }
 }else{
  let t=0;
  while(t<totalLen){
   let phraseLen=pickRand([1, 2, 4])*sixteenth,
       subdivisions=pickRand([3,4,7,8,12,16]),
       step=phraseLen/subdivisions,
       style=floor(hash(seed+t)*3), //0: fade in, 1: fade out, 2: pulse
       pBase=pickRand(ratios);
   for(let i=0;i<subdivisions;i++){
    let rel=i/subdivisions,
        v=style===0?rel:style===1?1-rel:(i%2===0?.8:.2);
    if(t+i*step<totalLen){
     notes.push({
      t:t+i*step,
      dur:step*.9,
      vel:v*v*rand(.6,1),
      pitch:pBase*(hash(seed+t+i)>.95?2:1),
      cutoff:mix(1e3,9e3,(style===1?rel:1-rel)**.4)
     });
    }
   }
   t+=phraseLen;
  }
 }
 return{notes:notes.sort((a,b)=>a.t-b.t),loopLen:totalLen};
};
tracks=createArray(10,i=>{
 seed+=i*123;
 let p=i<2?makePattern(4,true):makePattern(pickRand(beatOptions));
 return{
  ...p,
  buffer:generators[i%generators.length](),
  LP:new OnePole()
 };
});
return t=>{
 t*=.85;
 let out=0;
 for(let i=0;i<tracks.length;i++){
  let trk=tracks[i],now=t%trk.loopLen,n=null;
  for(let j=0;j<trk.notes.length;j++){
   let cand=trk.notes[j];
   if(now>=cand.t&&now<cand.t+cand.dur){
    n=cand;break;
   }
  }
  if(n){
   let elapsed=now-n.t,
       smp=linReadArray(trk.buffer,elapsed*smpRate*n.pitch);
   out+=trk.LP.process(smp*n.vel,n.cutoff)*.35;
  }
 }
 return tanh(out*1.5);
};