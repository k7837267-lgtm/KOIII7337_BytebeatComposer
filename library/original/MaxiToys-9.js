BPM=190,	

T=t/48e3,
st=T/60*BPM,

t?0:(mem={},randTable=Array(512).fill(0).map(x=>random()*2-1)),
lp=(name,x,a)=>{
	mem[name]??=0;
	mem[name]=x*a+mem[name]*(1-a);
	return mem[name];
},

randI=0,
sps=(x,l)=>{
	let pos = randI++;
	return Array(l).fill(0).map((_,i)=>((x*(i/512+1)+randTable[(pos+i)&511])%1)-.5).reduce((a,b)=>a+b);
},


cho=[
	[58,63,66],
	[58,61,66],	
	[59,63,68],
	[58,61,65]
],

mtof=x=>440*2**((x-69)/12),

c=_=>lp("c"+_,cho[st/4&3].map(x=>sps(T*mtof(x),9)).reduce((a,b)=>a+b)/3,.001**(st%1)+.01),
sd='100100110010100100'[st*2&15],
k=sin(sqrt(st%.5)**.5*128+sin(T*PI*400)*1e-40**(st*2%1)*20)*sd*.01**(st*2%1),
[c(0)*(+sd?min(st*2%1,1):1)+k,c(1)*(+sd?min(st*2%1,1):1)+k]