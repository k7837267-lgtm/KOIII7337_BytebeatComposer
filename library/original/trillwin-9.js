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

Q=(
  
  A=(a,spd,tone)=>t*tone*2**(parseInt(a[(t>>spd)%a.length],36)/12),
  C=A("DHIK",15,1.3)/2,
  lpf(((C*.98%128+(C%128)*7)/3+(C*.99%127+C%127)/3+(C*.97%129+C%129+C*.96%126)/6+(C%126)+C*.97%130+C%130)*.20,.3)*("1100110011011011"[t>>12&15])
  
),[dly(Q,rvrbHeads[0],.5,x=>bpf(x,.3,.2))-32,dly(Q,rvrbHeads[1],.6,x=>bpf(x,.2,.2))-32]