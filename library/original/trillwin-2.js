// ABILIITYCORE - FoodlesMickey / YouLikeHaveMaterials87 / trillwin

// Infinitely Instantiable 1-Pole Filters || feeshbread
// Every call = New Filter Instance
// What you're seeing here is feeshbread's Dead Data Reverb
t||(fx=[],dMax=1e6,z1=[],wsin=phase=>(-cos(phase/128*PI)+1)*128-.5,dly=multiTabDelay=(audio,heads,dw,fbfn=x=>x)=>{dly_fxii=fxi++;fx[dly_fxii]??=Array(dMax).fill(0);dly_wi	=dt%dMax;dly_feed=audio;dly_out=0;for(let head of heads){dly_ri=(dMax+dt-round(head.t))%dMax;dly_feed+=fx[dly_fxii][dly_ri]*head.fb;dly_out+=fx[dly_fxii][dly_ri]*head.m;}fx[dly_fxii][dly_wi]=fbfn(dly_feed);return audio*(1-dw)+dly_out*dw;}),fxi=0,dt=t,rvrbHeads=[[{t:6e3+wsin(t/100),m:.5,fb:.15},{t:10e3+wsin(t/250),m:.5,fb:.35},{t:14e3+wsin(t/300),m:.1,fb:.45},{t:2e4+wsin(t/380),m:.1,fb:.65}],[{t:8e3+wsin(t/230),m:.5,fb:.15},{t:12e3+wsin(t/270),m:.5,fb:.35},{t:16e3+wsin(t/280),m:.1,fb:.45},{t:24e3+wsin(t/200),m:.1,fb:.65}]],

callCount=0,
lpf=lowPassFilter=(a,c)=>(
	call=callCount++,
	z1[call]??=0,
	z1[call]+=(a-z1[call])*c
),
hpf=highPassFilter=(a,c)=>a-lpf(a,c),
bpf=bandPassFilter=(a,hc,lc)=>hpf(lpf(a,lc), hc),
lbf=lowBoostFilter=(a,c,v)=>a+lpf(a,c)*v,


// Low-Pass Filter w/ Resonance || Cattoadishere
lpr=lowPassResonance=(a,c,r)=>((
	call=callCount++,
	t||(z1[call+'lp6']=0,z1[call+'lp12']=0),
	ct=Math.min(c,.999),
	R=r+r/(1-ct),
	z1[call+'lp6']+=ct*(a-z1[call+'lp6']+R*(z1[call+'lp6']-z1[call+'lp12']))),
	z1[call+'lp12']+=ct*(z1[call+'lp6']-z1[call+'lp12'])
),

Octave = 0,
Pitch = '2294'[t>>16&3],
Detune = -20,
p=(round(Pitch)+(Octave/12)+(Detune/100)),
t||(a=b=0),
Q=j=>(c=a+=b+=(2**(p/12)/1.2*j*2**(parseInt('8BFBGFBF'[t>>13&7],36)/12)-b)/1400,
(lbf((1&0b1001010111>>(c>>(t&524288?4:5)))&&64,.06,.4)+175+(random()-.5)*128*(.99996**t)+bpf(EE=t*1.03*j*2**(parseInt('6698'[t>>16&3],36)/12)&255,.09,.16)%256*1.4*(t/[8192,8192,32768,16384][t>>14&3]%1)+((lpf(4e5/(t>>3&2047)&96,.1)*2*(.9999**(t&32767)))+(lpr(random()*128,.5,.8)*(.9995**(t&16383))))*(t>262144%1048576)+lpr(EE&128,abs(cos(t/131072)),.9)/2*(t>1048576))+64),
[dly(Q(1.005),rvrbHeads[0],.3,x=>bpf(x,.01,.9))/2,dly(Q(.995),rvrbHeads[1],.32,x=>bpf(x,.01,.8))/2]