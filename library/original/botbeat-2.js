t?0:(r={},b1=[]),cc=0,lpf=(i,f)=>(cl=cc++,b1[cl]??=0,b1[cl]+=(i-b1[cl])*f),hpf=(i,f)=>(i-lpf(i,f)),bpf=(i,lf,hf)=>(hpf(lpf(i,lf),hf)),

bpm=108,sr=48e3,
ts=t/2*bpm/(60*sr/32768),tt=t*432*128/sr*2**(-4/12),

bell=x=>sin(8*((()=>{let out=0;for(let i=0;i<(I=6);i++){out+=(cos(x*4*PI/256*2**i)%256/I/3)}return out})())),
fm=x=>bpf((cos(2*sin(x*PI/128)))+(sin(2*sin(x*PI/127))),.4,.01)/2,
sqr=x=>hpf((x%256/127)<1,.002),
pwm=x=>hpf((x%256/127)>((sin(ts/32768*PI))/2+1),.005),
fpwm=x=>((((x&128?0:127)&&x)&((x&128?0:127)||x))-192+(((x&128?0:255)&&x)-((x&128?0:127)||x))&255)/127-1,
tri=x=>((asin(sin(8*sin(x*PI/127-1)))*84))/127,
atari=x=>hpf(((((AL='1101011101011010')[((x)>>4)%AL.length]*128)&128)&255)/127-1,.008),

f=0,
F=7,
a=[[0,3,7,10],[1,5,9,12],[-2,2,5,9],[-1,3,6,9]][ts>>17&3],
i=16384,
dx=12288,
dy=24576,
BtF=bt=>(bt%256/256),
n=(a,b)=>2**(a/12)*2**(b/12),
l=(ts/512%8)+2,
x=cos(ts/16384%1),
y=(ts/i%1)/(1-ts/i%1),
yi=((ts+dx)/i%1)/(1-(ts+dx)/i%1),
yz=((ts+dy)/i%1)/(1-(ts+dy)/i%1),

p=fm,st=lr=>(lr?.995:1.005),

dm=DrumMachine=function(DT, Speed){let DT_II;switch(DT){case'k':DT_II = tanh(sin(384*sqrt(ts/Speed%1024)**.1))*pow(1-ts/Speed/1024%1,2);break;case'h':DT_II = hpf(random(),.6)*pow(1-ts/1024/Speed%1,6);break;case's':DT_II=cbrt((tanh(4*sin(12*cbrt((TS=ts%8192)/Speed%1024)))*pow(1-TS/Speed/1024%1,4)+bpf(random(),.1,.3)*32*(TS/Speed/1024%1)*pow(1-ts/Speed/1024%1,1.5)))/1.5*(1-ts/Speed/1024%1);break;case'-':DT_II = void 0||null;break;case't':DT_II=tanh(2*sin(t*6*440/sr))*pow(1-(ts/1024/Speed)%1,4);break;}return DT_II},

m=lr=>(L=(p(tt*st(lr)*n(0+f,a[(ts>>14)%a.length]))/y/4
+p(tt*st(lr)*n(7+f,a[((ts+dx)>>14)%a.length]))/yi/4
+p(tt*st(lr)*n(12+f,a[((ts+dy)>>14)%a.length]))/yz/4)/4,
R=(p(tt*st(lr)*n(0+F,a[(ts>>14)%a.length]))/y/4
+p(tt*st(lr)*n(7+F,a[((ts+dx)>>14)%a.length]))/yi/4
+p(tt*st(lr)*n(12+F,a[((ts+dy)>>14)%a.length]))/yz/4)/4,

min(max(L+R,-1),1)/2+dm('h',4)

),

[m(0),m(1)]