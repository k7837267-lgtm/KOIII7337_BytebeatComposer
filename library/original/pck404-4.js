t||(fx=[]),fxi=0,
lpf=(a,c)=>(
   lp_fxii=fxi++,
   fx[lp_fxii]??=0,
   fx[lp_fxii]+=(a-fx[lp_fxii])*c
),
hpf=(a,c)=>a-lpf(a,c),
bpf=(a,hc,lc)=>hpf(lpf(a,lc),hc),
bbf=(a,hc,lc,v)=>a+bpf(a,hc,lc)*v,

ts=t*abs(80/(48e3*60)*16384),
l=16384,m=8192,s=4096,
seq=(inst,pat="",step=t)=>((!pat[step]||pat[step]=="0")?0:inst)||0,

kick=()=>tanh((sin(100*(ts%s)**.025*6)+hpf((random()-.5)/2,.5))*(1-ts/s%1)**22+(sin(100*(ts%s)**.1))*(1-(ts/s%1)**2)*(1-(1-ts/s%1)**8)*1.2)/tanh(1)*0.8,
clap=()=>bpf(((random()-.5)*10*(ts>>9&3?(1-ts/s%1)**4*2.5:(1-(ts/(512/1.5))%1)**2)),.2,.2)*1.3,
chat=closedHat=()=>hpf((random()-.5)*10*(1-ts/s%1)**4,.9)*1.6,
ride=()=>bpf(bpf((random()-.5)*(1-(ts/s%1)**2),.6,.59),.6,.59)*6.5,

bass=()=>tanh(4*sin(t/(200+55*((ts>>12&15)>9))))*0.4,

fmod1=[20,18.5,20,16],fmod2=[18,190],
fm=(c)=>tanh((0.2*(16-(ts>>8&15)))*sin(t/fmod1[ts>>17&3]+sin(t/fmod2[ts>>18&1]))+sin(c/2+t/10e5)*2)*0.36,

mast=(c)=>tanh(1.3*
+seq(kick(),"10000000001",ts>>12&15)*((ts>>16&3)!=3)
+seq(clap(),"000000001",ts>>11&15)*((ts>>15&3)!=3)
+seq(chat(),"0111",ts>>9&3)*((ts>>13&127)>15)
+seq(ride(),"100010001101001",ts>>11&15)*(ts>>15>31)
+bass()*(ts>>12>31)
+fm(c)*(ts>>14>31)
+((ts/32000)%1)**8*0.2*random()*(ts>>14>31)
+sin(t/162+(d=sin((0xd5a7af9>>(ts>>12&15)&15)*t/200))*!((ts>>19&1)%2))*0.22
+sin(t/258+d*!((ts>>12&7)%2)*((ts>>18&1)%2))*(0.6+0.2*sin(c*5+t/10e9))*0.5
),[mast(0),mast(1)]
