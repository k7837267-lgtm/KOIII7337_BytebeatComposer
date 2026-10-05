SR=48e3,
TRS=0,

note=x=>440*2**((x-69+TRS)/12),

t||(
c=[
	[51,56,59,63],
	[49,56,61,66],
	[53,56,63,68],
	[54,58,63,66]
],

sl2=(g=_=>[note(c[0][0]),note(c[0][1]),note(c[0][2]),note(c[0][3])].map(x=>x/SR*1.21))(),
sl=g(),

rand=[...Array(4)].map(x=>random()*10)
),

T=t/SR,
st=T*130/60,
cur=c[(st>>1)+3&3],

cur.forEach((x,i)=>{
	sl[i]+=sl2[i]+=(note(x)/SR-sl2[i])/1400;
}),

h=sl.map(x=>sin(x*PI*2+sin(x*PI*6+sin(x*PI*16))*.1**(st%.5))*('10011'.split("").flatMap(x=>[x,x]).concat('0100100'.split("")))[st*4&15]).reduce((a,b)=>a+b)/3,
k=sin((st%1)**.01*512+T*PI*100)/((st%1)*16+1),
sd=min((st%1)*3,1),
hh=_=>(random()-.5)*1e-20**(st*2%.5),
b=sin((w=T*PI*note(cur[0]))+sin(w*2+sin(w*3)*7)*3*.01**(r=(st*4%1)))*.6**r,
tanh((b/3+hh()+h)/2*sd+tanh(k))