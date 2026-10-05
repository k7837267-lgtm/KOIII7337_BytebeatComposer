RATE=44000,
t||(a=b=0,wq=[Array(RATE/1.6|0).fill(0),Array(RATE/2|0).fill(0)]),

t%RATE?0:r=random()/64+1e-5,

e=(sin(PI*(e=t/256*2**(([7,12,10,5,7,3,5,-2][t/RATE*2&7]-5)/12)))+(e*2%1)-.5+(e*3.01&1)-.5)/32*((p=t/RATE&31)>7.5&&p<16),


a=(w=(random()-.5)*1e-20**(t/RATE%1))*r+a*(1-r),
b=w*.1+b*.9,
y=tanh(a*40+(b-w)/4)+e,

wq.forEach((x,i)=>{
	x[t%x.length]=y+x[t%x.length]/7;
}),

[(i=wq[0])[t%i.length|0],(i=wq[1])[t%i.length|0]]