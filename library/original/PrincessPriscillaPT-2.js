t || (fx = []), fxi = 0,
wsin = phase => (- cos(phase / 128 * PI) + 1) * 128 - .5,      
dt = t, rvrbMax = 1e5,      
lpf = lowPassFilter = (audio, cutoff) => (
	lp_fxii = fxi ++,
	fx[lp_fxii] ??= 0,
	fx[lp_fxii] += (audio - fx[lp_fxii]) * cutoff
),
hpf = highPassFilter = (audio, cutoff) => audio - lpf(audio, cutoff),
bpf = bandPassFilter = (audio, highCutoff, lowCutoff) => hpf(lpf(audio, lowCutoff), highCutoff),

rvrb = multiTapReverb = (audio, heads, dw, fbfn = x => x) => {
	rvrb_fxii = fxi ++;
	fx[rvrb_fxii] ??= new Float32Array(rvrbMax);
	rvrb_wi = dt % rvrbMax;
	rvrb_feed = audio;
	rvrb_out = 0;
	for(let head of heads) {
		rvrb_ri = (rvrbMax + dt - round(head.t)) % rvrbMax;
		rvrb_feed += fx[rvrb_fxii] [rvrb_ri] * head.fb;
		rvrb_out += fx[rvrb_fxii] [rvrb_ri] * head.m
	} fx[rvrb_fxii] [rvrb_wi] = fbfn(rvrb_feed);
	return audio * (1 - dw) + rvrb_out * dw
},
rvrbHeads = [[
	{t:1e3 + wsin(t / 180), m:.6, fb:.3},
	{t:1e4 + wsin(t / 300), m:.5, fb:.5},
	{t:17e3 + wsin(t / 380), m:.3, fb:.7},
	{t:37e3 + wsin(t / 420), m:.2, fb:.9}
],[
	{t:11e2 + wsin(t / 200), m:.6, fb:.3},
	{t:13e3 + wsin(t / 320), m:.5, fb:.5},
	{t:14e3 + wsin(t / 330), m:.3, fb:.7},
	{t:4e4 + wsin(t / 450), m:.2, fb:.9}
]],

I=int,
R=random,
S=sin,
T=tanh,
sr=samplerate=24e3,
ms=milliseconds=180,
ts=I(t/ms*1e3),
bitcrush=(t%65e2?_r1:_r1=I(R()*7)+1),
fmMod=(t%7e3?_r2:_r2=R()),

string="5468616e6b20796f7520736f206d75636820666f72206265696e6720737563682061206c6f79616c20616e6420776f6e64657266756c20706f6e7920667269656e64207468617420492068617665206861642074686520706c656173757265206f66206d656574696e6721204d7761687e21205e5e203c33",

a=lr=>tanh(rvrb(bpf(T(S(S((l=(t+t%bitcrush)/sr*360*2**(floor(parseInt(string[I(t/sr/ms*1e3)],16)/4)%3)*2**([0,4,7,11][parseInt(string[I(t/sr/ms*1e3)],16)%4]/12)*PI))*(1-l/PI/2%1)+S(l*6)*fmMod/2))*.9998**(t%I(sr*ms/1e3))*2||0,.01,.7)*1.5,rvrbHeads[lr],.75,x=>T(hpf(bpf(x,.05,.9),.1)/180)*100)),
[a(0),a(1)]