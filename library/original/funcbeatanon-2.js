SR=32e3;TAU=PI*2;
mod=(n,m)=>(n%m+m)%m;
clamp=(x,mn,mx)=>min(max(x,mn),mx);
mix=(a,b,t)=>a+(b-a)*t;
makeArray=(n,v,norm=false)=>Array.from({length:n},(_,i)=>typeof v==="function"?v(norm?i/n:i):v);
class Delay{
 constructor(maxLen=SR,feedback=.9){
  maxLen=max(0,floor(maxLen))+1;
  Object.assign(this,{
   maxLen,curLen:maxLen-1,
   buf:new Float32Array(maxLen),
   writeAt:0,feedback
  });
 }
 changeLength(newLen){
  this.curLen=clamp(newLen,0,this.maxLen-1);
 }
 process(x){
  let readPos=mod(this.writeAt-this.curLen,this.maxLen),
      i0=floor(readPos),i1=(i0+1)%this.maxLen,frac=readPos-i0,
      outSamp=this.buf[i0]*(1-frac)+this.buf[i1]*frac;
  this.buf[this.writeAt]=x+outSamp*this.feedback;
  this.writeAt=(this.writeAt+1)%this.maxLen;
  return outSamp;
 }
}
/*myDel=new Delay();
return t=>{
 let o=sin(t*880*TAU)*max(1-mod(t,2)*20,0);
 myDel.changeLength(mix(myDel.maxLen*.02,myDel.maxLen*.9,(sin(t*2)+1)/2));
 return myDel.process(o);
};*/
class DelayMatrix{
 constructor(size=4,feedback=.98,len=SR){
  Object.assign(this,{
   size,feedback,dels:makeArray(size,i=>new Delay(len/(2+i),0)),
   outs:new Float32Array(size),dMul:1
  });
 }
 process(x,t){
  let v=new Float32Array(this.size),sum=0;
  for(let i=0;i<this.size;i++){
   this.dels[i].changeLength(this.dels[i].maxLen*this.dMul*(.6+.4*sin(t*(.5+i*.3))));
   v[i]=this.dels[i].process(this.outs[i]);
   sum+=v[i];
  }
  //reflection=I-(2/N)*OnesMatrix, output[i]=v[i]-(2/N)*sum(v)
  let factor=sum*(2/this.size);
  for(let i=0;i<this.size;i++)
   this.outs[i]=(i===0?x:0)+(v[i]-factor)*this.feedback;
  return sum/this.size;
 }
}
dm=new DelayMatrix(5,.98,SR*.3);
drmPl={
  init:()=>{
  drmPl.curT=0;drmPl.phase=0;
  drmPl.curTon=mix(200,3e3,random()**7);
  drmPl.curLen=pow(2,floor(random()*3)-3)*.4;
  drmPl.tonDur=.01+random()*.2;
  drmPl.tonMul=1+(random()-.5)*.02;
  dm.feedback=mix(.9,.995,random());
  dm.dMul=mix(.0005,1,random()**3);
 }
};
drmPl.init();
rev={buf:new Float32Array(SR*9),at:0};
return t=>{
 let o=sin(drmPl.phase*TAU)*max(1-(drmPl.curT/drmPl.tonDur),0);
 drmPl.phase=mod(drmPl.phase+(drmPl.curTon/SR),1);
 drmPl.curTon*=drmPl.tonMul;
 drmPl.curT+=1/SR;
 if(drmPl.curT>=drmPl.curLen)drmPl.init();
 o=tanh(dm.process(o,t));
 rev.buf[rev.at]=o;rev.at=(rev.at+1)%rev.buf.length;
 return tanh(o*2+rev.buf[(rev.buf.length-rev.at)-1]);
};