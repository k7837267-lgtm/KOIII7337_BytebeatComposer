// ===================
//   massive love <3
//       pck404
// ===================

// === state & fx ===

t||(fx=[],db=[],di=0,sm=-110,ph1=0,ph2=0,ph3=0,ph4=0,ph5=0,ph6=0),
fxi=0,
lpf=(a,c)=>(
   lp_fxii=fxi++,
   fx[lp_fxii]??=0,
   fx[lp_fxii]+=(a-fx[lp_fxii])*c
),
hpf=(a,c)=>a-lpf(a,c),
bpf=(a,hc,lc)=>hpf(lpf(a,lc),hc),
bbf=(a,hc,lc,v)=>a+bpf(a,hc,lc)*v,

dl=(v,len=SR/2,fb=.4,mix=.3)=>(
  d=db[p=(di-len)&65535]||0,
  db[di++&65535]=v+d*fb,
  v*(1-mix)+d*mix
),

// === timing utils ===

SR=48E3,
T=t/SR,
mtof=n=>440*2**((n-69)/12),

// === synth ===

off=(T/4<2)
  ?max(-12,-12*(2-(T/4)))
  :([0,-4,0,-4,-7,-12,-11,-8][floor(T/4-2)%8]),

sm+=(off-sm)*0.0001,
ph=(fq)=>2*PI*fq/SR,

rp=(T/2)%1,
sc=T<8?1:(0.3+rp*0.8)**2,

// === bass ===

bo=[1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0][floor(T*4-4*8)%16],
ba=bo?1:(ba*0.9999),

// === clap env ===

co1=(floor(T)%2)&&(1-((T)%1))**5,
co2=(floor(T-0.25)%2)&&(1-((T-0.25)%1))**5,
co3=(floor(T-0.5)%2)&&(1-((T-0.5)%1))**5,

// === fm piano ===

fmp=(t,n,vel=0.2)=>(

f=mtof(n),
ratio=3,
ampEnv=vel*exp(-t*2.5),
fmEnv=vel*exp(-t*8),

fm=
  sin(
    2*PI*f*t+
    3*vel*fmEnv*sin(2*PI*f*ratio*t)
  ),

trem = 1 + 0.12 * sin(2 * PI * 5 * t),
out = tanh(fm * ampEnv * trem * 2)
),
sc2=T<8?1:(0.3+rp*0.5)**2,

// === song parts ===

p2=(T/4)>2,
p3=(T/4)>10,

// === mixing ===

mix=(...d)=>
  d.reduce(
    ([l,r], _, i) =>
      i%3
        ? [l,r]
        : [
            l+d[i]*d[i+1]*d[i+2],
            r+d[i]*(1-d[i+1])*d[i+2]
          ],
    [0,0]
  ),

mix(
0.3,0.5,sin(ph1+=ph(mtof(60+sm)))*sc,
0.2,0.3,sin(ph2+=ph(mtof(64+sm)))*sc,
0.1,0.7,sin(ph3+=ph(mtof(67+sm)))*sc,
0.12,0.1,sin(ph4+=ph(mtof(71+sm)))*sc,
0.12,0.9,sin(ph5+=ph(mtof(74+sm)))*sc,
0.05,0.5,sin(ph6+=ph(mtof(78+sm)))*sc,
0.4,0.5,(p2&&atan(2.53*sin(mtof(36+((floor(T)%2)*12)+[0,3,0,-9,5,-12,1,-8][floor(T/4-2)%8])*2*PI*T)))*ba,
0.6,0.5,p2&&atan(lpf(sin(20*((T/2)%1)**.5*6)+sin(100*((T/2)%1)**.02*6),0.2)),
0.6,0.5,p2&&bpf(random()-.5,0.2,0.8)*co1,
0.12,0.6,p2&&bpf(random()-.5,0.2,0.8)*co2,
0.05,0.3,p2&&bpf(random()-.5,0.2,0.8)*co3,
0.55,0.5,p3&&dl(fmp(T%0.25,off+[60,67,71,64,74,78,83,74][floor(T*8)%8]+(floor(T)%2)*12))*sc2,
0.8,0.5+sin(T/3)/4,p3&&dl(random()*sin((T-0.1)*8)*max(0,(1-((T*8)%1)))*(0b11011011011>>((T*8)&15)&1)*(0.2+sin(T/5)*0.1)*min(1,T/96)),
).map(v=>atan(v*1.8))