isNaN(this.T)?T=-1:0,T++,
// Bảng Reverb
T||(Reverb={}),
Reverb.BPM=120,
Reverb.sR=48e3,
Reverb.q=(30*Reverb.sR)/(Reverb.BPM*2/3),

// Những gì bạn đang thấy ở đây là Mã Reverb Dead Data của Feeshbread
T||(
	Reverb.S="",
	Reverb.wsin=(phase)=>(-cos(phase/256*PI)+1)*128-.5,
	Reverb.fx=[],
	Reverb.dMax=1e6,
	Reverb.lpf=(a,c)=>(
		lp_fxii=Reverb.fxi++,
		Reverb.fx[lp_fxii]??=0,
		Reverb.fx[lp_fxii]+=(a-Reverb.fx[lp_fxii])*c
	),
	Reverb.bpf=(a,hc,lc)=>((a,c)=>a-Reverb.lpf(a,c))(Reverb.lpf(a,lc),hc),
	Reverb.render=(audio,heads,dw,fbfn=x=>x)=>{
		dly_fxii=Reverb.fxi++;
		Reverb.fx[dly_fxii]??=Array(Reverb.dMax).fill(0);
		dly_wi=Reverb.dt%Reverb.dMax;
		dly_feed=audio;dly_out=0;
		for(let head of heads){
			dly_ri=(Reverb.dMax+Reverb.dt-floor(head.T))%Reverb.dMax;
			dly_feed+=Reverb.fx[dly_fxii][dly_ri]*head.fb;
			dly_out+=Reverb.fx[dly_fxii][dly_ri]*head.m
		}
		Reverb.fx[dly_fxii][dly_wi]=fbfn(dly_feed);
		return audio*(1-dw)+dly_out*dw;
	}
),
Reverb.fxi=0,
Reverb.dt=T,
Reverb.rvrbHeads=[
	[
		{T:1e3+Reverb.wsin(T/180),m:.6,fb:.3},
		{T:1e4+Reverb.wsin(T/300),m:.5,fb:.5},
		{T:17e3+Reverb.wsin(T/380),m:.3,fb:.7},
		{T:37e3+Reverb.wsin(T/420),m:.2,fb:.9},
		{T:Reverb.q*1.005+Reverb.wsin(T*1.005/256),m:.75,fb:.75}
	],[
		{T:11e2+Reverb.wsin(T/200),m:.6,fb:.3},
		{T:13e3+Reverb.wsin(T/320),m:.5,fb:.5},
		{T:14e3+Reverb.wsin(T/320),m:.3,fb:.7},
		{T:4e4+Reverb.wsin(T/450),m:.2,fb:.9},
		{T:Reverb.q*.995+Reverb.wsin(T*.995/256),m:.75,fb:.75}
	]
],
sR=48e3,
r=t*1.5,

m=x=>(t/sR*256)*432*2**((x-64)/12)*(x>-1?x<128?1:0:0),
sinc=x=>((x*64/PI*128+4096)+4096&8191)*(-(x*64/PI*128+4096)+4096&8191)*((((x*64/PI*128+4096)+4096&8192)>>12)-1)/16777215,
cosc=x=>sinc(x-256),

Bell=(mel,v)=>tanh(sinc(sinc(mel*PI/128)+cosc(mel*PI/128*6)*v))*4*v**2/2,
note=[84,84,84,84,82,82,80,80,79,75,72,70,68,67,65,63,66,66,66,63,61,61,63,66,65,65,61,61,58,58,56,56,72,72,75,75,65,65,68,68,67,67,60,60,56,56,63,63,66,66,59,59,61,61,63,63,68,68,65,65,61,61,58,58,72,75,73,72,70,68,67,65,67,67,63,63,60,60,58,58,47,51,54,59,63,59,58,56,54,54,58,58,63,63,61,61,60,60,56,56,53,53,60,60,55,55,51,51,48,48,55,55,58,58,54,54,51,51,58,58,56,56,53,53,49,49,56,56][(r>>14)%128],
Q=Bell(m(note)+sin((t*note)/2**20 * 32) * 8,0.75),
[Reverb.render(Q,Reverb.rvrbHeads[0],.4,x=>tanh(Reverb.bpf(x,.01,.8)/200)*100),Reverb.render(Q,Reverb.rvrbHeads[1],.4,x=>tanh(Reverb.bpf(x,.01,.8)/200)*100)]