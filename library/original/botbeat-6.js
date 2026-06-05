t?0:fx=[],fxi=0,lpf=(a,c,r)=>(c+=1e-14,fx[++fxi]??=[0,0],fx[fxi][0]+=fx[fxi][1]+=(a-fx[fxi][0]-fx[fxi][1]*(1-sqrt(r)**.7)/c)*c),hpf=(a,c,r)=>a-lpf(a,c,r),bpf=(a,h,l,r)=>lpf(hpf(a,h,r),l,r),del=(i,d,f,c=0)=>(fx[++fxi]??=Array(d).fill(0),out=i+fx[fxi][(t+c|0)%d],fx[fxi][t%d]=out*f,out),rev=(m,a,s,v,f,d,w,E=x=>x)=>{var out=0;for(let i=0;i<a;i++){out+=E((del(m,s+(v*i),f,i*1568+12e3+(cos(t/32e3*(i/70+.8))*96))-m)/a)};return m*d+(out*w);},t?0:sli=[],slifxi=0,sl=slide=(input, portamento) => (
	sli_fxii = slifxi++,
	sli[sli_fxii] ??= [0, 0, 0, 0],
	valid = input !== 0,
	noteOn = valid && !sli[sli_fxii][3],
	sli[sli_fxii][3] = valid,
	sli[sli_fxii][2] = t ? input / t : t,
	valid
	? (sli[sli_fxii][0] += sli[sli_fxii][1] +=
		(sli[sli_fxii][2] - sli[sli_fxii][1]) /
		(noteOn ? 1 : (t > 2 ? (portamento || 1) : 1))
	  )
	: 0
),chrd = chords = (tone = T => T, chrdNotes = [0], trnsp = 0, wave = input => (input / 128 % 2 - 1 + input / 127 % 2 - 1) / 2) => {
	let idx = chr = 0
	let maxPoly = 8
	for (; idx < min(maxPoly, chrdNotes.length); idx++)
		chr += wave(tone((chrdNotes[idx] + trnsp)))
	return maxPoly ? chr / maxPoly : 0
},t || (dwnfx = []), dwnfxi = 0,
dwnPresets = {
	subtlelofi: { hertz: 11025, mix: .35 },
	samplercrunch: { hertz: 8000, mix: .7 },
	aggressivealias: { hertz: 4000, mix: 1 },
	custom: { hertz: 8e3, mix: 1 }
},
dwn = downSample = (signal, preset = "subtlelofi") => (
	dwn_fxii = dwnfxi++,
	dwnfx[dwn_fxii] ??= { val: 0, frame: -1 },

	{ hertz: hertz, mix: mix } = dwnPresets[preset] 
	?? (() => { throw new ReferenceError(`dwn() function error: Preset not found (reading preset: ${preset})`); })(),

	m = min(1, max(0, mix)),
	frame = (t * min(sr, max(0, hertz)) / sr) | 0,

	((((frame != dwnfx[dwn_fxii].frame)
		? (dwnfx[dwn_fxii].frame = frame, dwnfx[dwn_fxii].val = signal)
		: dwnfx[dwn_fxii].val) || 0) * m) + signal * (1 - m)
),bpm=120,sr=44.1e3,ts=t/2*bpm/(60*sr/32768),tt=t*440*256/sr*2**(-10/12),n=x=>2**(x/12),p=x=>parseInt(x,36),bt=x=>(x&255)/128-1,pwm=(x,y)=>bt((x/2&127)+y&128),M=i=>rev(hpf(pwm(sl(tt*2*n(([0,0,2,4,-1,-1,-3,-3][ts>>14&7])),800),32),.01,.3)+chrd(T=>tt/2*n(T),[[0,4,7],[-1,2,6]][ts>>16&1],0,input=>hpf(pwm(input%256*(abs(sin(ts/131072*PI))+1)*2,32),.01,0))*3,12,i?12288:15367,i?8193:8736,.55,.6,3,x=>lpf(x,.1,.1))*([1,ts/4096%1]["1000100010011010"[ts>>12&15]])+(sin(84*.9995**(ts%4096))+dwn(sin(tt/256*PI*n(-7-(ts>>16&1)))*2,"aggressivealias"))*(1-ts/4096%1)**1.5/1.5*"1   1   1  11 1 "[ts>>12&15],[M(0),M(1)].map(t=>dwn(t,"custom"))