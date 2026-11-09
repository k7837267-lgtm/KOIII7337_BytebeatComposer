(this.func ??= ((/*arg = [...Math, window]*/) => {
	const wsin = phase => (-cos(phase / 128 * PI) + 1) * 128 - .5,
			fx = [],
			dMax = 1e6,
			lpf = (a, c) => (
				fx[fxi] ??= 0,
				fx[fxi] += (a - fx[fxi++]) * c
			),
			hpf = (a, c) => a - lpf(a, c),
			bpf = (a, hc, lc) => hpf(lpf(a, lc), hc),
			bbf = (a, hc, lc, v) => a + bpf(a, hc, lc) * v,
			n = c => lpf(random() - .5, c),
			alpf = (a, cu, cd, sr) => (
				fx[fxi] ??= 0,
				sr = fx[fxi],
				fx[fxi++] += (a - sr) * (sr < a ? cu : cd)
			),
			dly = (audio, heads, dw, fbfn = lr => lr) => {
				fx[fxi] ??= Array(dMax).fill(0);
				let wi = mod(dt, dMax),
					 feed = audio,
					 out = 0;
				for (let head of heads) {
					const ri = mod(dMax + dt - round(head.t), dMax);
					feed += fx[fxi][ri] * head.fb;
					out += fx[fxi][ri] * head.m;
				}
				fx[fxi++][wi] = fbfn(feed);
				return audio * (1 - dw) + out * dw;
			},
			cmp = (a, th, ra, at, rl, sc = a) => a / (alpf(max(abs(sc) - th, 0), at, rl) / th * ra + 1),
			chrd = (tone = dt, chrdNotes = [0], trnsp = 0, wave = input => input % 256 - 128) => {
				let chr = 0,
					 maxPoly = 4,
					 p;
				for (let idx = 0; idx < min(maxPoly, chrdNotes.length); idx++)
					chr += wave(tone * 2 ** (((p = chrdNotes[idx] + trnsp) - 69) / 12)) * (p >= 128 ? 0 : p < 0 ? 0 : 1) * (p ? 1 : 0);
				return maxPoly ? chr / maxPoly : 0;
			},
			mod = (a, b, c = 0) => (a % b + b) % b,
			pwm = (tone, width, mode = 1) => tone ? sign((mode ? asin(sin(tone * PI / 128)) / (PI / 2) : sin(tone * PI / 128)) - width) / 2 + width / 2 : 0,
			str = lr => lr ? .995 : 1.005;
	
	let fb1 = 0,
		 fb2 = 0,
		 fxi,
		 dt;
	
	return (t, sr) => {
		if (!t) { dt = 0; }
		fxi = 0;
		dt++;
		var bpm = 131,
			 sr = 48e3,
			 ts = t * abs(bpm / 60 * 32768) / 8,
			 tt = (t * 256) * 440 * 2 ** (-8 / 12),
			 q = (30 * sr) / bpm,
			 rvrbHeads = [
				 [
					 { t: 1e3 + wsin(dt / 210), m: .5, fb: .15 },
					 { t: 1e4 + wsin(dt / 250), m: .5, fb: .35 },
					 { t: 17e3 + wsin(dt / 300), m: .1, fb: .45 },
					 { t: 37e3 + wsin(dt / 380), m: .1, fb: .65 },
					 { t: q * 1.005 + wsin(dt * 1.005 / 256), m: 1, fb: .5 }
				 ],
				 [
					 { t: 11e2 - wsin(dt / 230), m: .5, fb: .15 },
					 { t: 13e3 - wsin(dt / 270), m: .5, fb: .35 },
					 { t: 14e3 - wsin(dt / 280), m: .1, fb: .45 },
					 { t: 4e4 - wsin(dt / 400), m: .1, fb: .65 },
					 { t: q * .995 - wsin(dt * .995 / 256), m: 1, fb: .5 }
				 ]
			 ],
			 pt = ts % 4096,
			 b = a => (tt / a * 2 ** ([0, 3, -9, -2][ts >> 15 & 3] / 12 + 1)) % 256 - 128,
			 kc=(1-(ts/1024)%1)*!(ts>>10&3),
			 e=a=>(fx[fxi]??=0,fx[fxi]=hpf(bpf(-fx[fxi++]+pwm(tt*(isNaN(a)?0:a),(1-ts/32768%1))*128,.05,.9),.08)),
			 a=lr=>tanh(cmp(
				 + bbf(
					 + tanh(sin(16 * pt ** .3)) * kc * 256 * (1 - ts / 2048 % 1) ** 2
					 + hpf(n(.6) * 128 * (1 - ((ts / 1024) % 1) ** .5) ** 1.5, .1)
					 + (
						 + atan(sin((2e6+(pt)*8)*(1-(1/((pt)*100+.1))*2)/70))*8*(max((1-pt/2048*2),0)**1.8)*(ts>>12&1)
						 + (fb1=hpf(fb1*.5+n(.2)*14*(1-((ts/8192+.5)%1))**2,.2))
					 ) * 32, .025, .2, -.5
				 )
				 + 2 * ((ts / 4096 % 1 * .8 + .2) * (1-kc) ** 1.3) * (
					 + dly(e(m = 2 ** ([7, [14, 12][ts >> 14 & 1], 10, 5, 12, [14, 15][ts >> 14 & 1], [19, 22][ts >> 14 & 1],[17, 14][ts >> 14 & 1]][ts >> 15 & 7] / 12)) + e(m * str(lr)), rvrbHeads[lr], .55, x => tanh(bpf(x, .01, .8) / 180) * 100)
					 + chrd(1, [
						 [69, 72, 76],
						 [69, 72, 77],
						 [67, 72, 76],
						 [67, 71, 74]
					 ][ts >> 15 & 3], 0, input => e(input * str(lr)) * 2)
					 + bbf(1.3 * lpf((b(4 * str(lr)) + b(8) + b(16 / str(lr)) / 2) / 4, (1 - ((ts / 1024) % 1)) ** 2 * .3 + .02) * (1 - ts / 1024 % 1) ** .1 * (ts / 4096 % 1) ** .1, .01, .5, -.3)
				 ), 50, 1, .01, .1e-3
			 )/40)*1.1;
		return [a(0), a(1)];
	};
})())(t / (t = 48e3), t);