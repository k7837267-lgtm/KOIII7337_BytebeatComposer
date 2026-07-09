t || (
	tuning = 452,
	EDO = 12,


	filtCutBuf = [],
	filtResBuf = [],
	combAPBuf = [],

	btf = k => k % 256 / 128 - 1,

	rv = x => 2 * x - 1,

	cCA = (x, y, z = 0) => x.charCodeAt(y) - z,

	note = (x, M, X, y, z) => tuning / 440 * 27.5 * 2 ** ((M ? cCA(X, y, z) : x) / EDO) / 187.5 * ! (M ? X[y] === " " : 0),

	itrp = (x, y) => ! (x[y] === " "), 

	lp = (inp, cut, res, iter, resfb) => {
		y = inp;
		for (i = 0; i < iter; ++i) {
			count = counter ++;
			filtCutBuf[count] ??= filtResBuf[count] ??= 0;
			filtResBuf[count] *= resfb;
			res == 0 ? (filtCutBuf[count] += (y - filtCutBuf[count]) * cut) :
				(filtCutBuf[count] += filtResBuf[count] += (y - filtCutBuf[count] - filtResBuf[count] * res) * cut);
			y = filtCutBuf[count]
		}
		return y
	},

	hp = (inp, cut, res, iter, resfb) => {
		return inp - lp(inp, cut, res, iter, resfb)
	},

	comb_ap = (t, inp, mode, len, gain, fb, mod_vol, mod_func, cancel_k) => {
		count = counter ++;
		modulo = count + (t + 128 * mod_vol - round(mod_func)) % len;
		combAPBuf[modulo] ??= 0;
		y = mode ? combAPBuf[modulo] * fb - gain * inp : inp + combAPBuf[modulo] * fb;
		t % 1 ? 0 : combAPBuf[count + t % len] = mode ? inp + y * gain : y * gain;
		counter += len;
		return y + inp * cancel_k
	},

	reverb = (t, inp, gain_diff, gain_del, feedback, del_k, diff_iter, del_iter, diff_val, diff_sub, del_val, del_sub, mod_vol, mod_speed, mod_sub, mod_func = x => x, filter = y => y, dry, wet) => {
		out = out_2 =  0;
		for (diff_i = 0; diff_i < diff_iter; ++ diff_i) {
			out += comb_ap(t, inp, 1, diff_val - diff_sub * diff_i, gain_diff, feedback, 0, 0, gain_diff)
		};
		for (del_i = 0; del_i < del_iter; ++ del_i) {
			out_2 += comb_ap(t, diff_iter > 0 ? out : inp, 0, del_val - del_sub * del_i, gain_del, feedback, 1, mod_func(mod_speed - mod_sub) * mod_vol, del_k)
		};
		return hp(filter(out_2) * wet + inp * dry, .005, 0, 1, 0)
	},

	chorus = (t, inp, len, gain, mod, cncl) => {
		return comb_ap(t, hp(inp, .005, 0, 1, 0), 0, len, gain, 1, 1, mod, 0) + cncl * inp
	},

	soft = (inp, assym) => {
		return tanh(inp + assym)
	},

	adsr = (t, len, a, d, s, r) => {
		_a = min((t / 256 * len % 1) * (1 / a), 1);
		_d = max((((len * t + (256 - (256 * a))) / 256 % 1) * - (1 / d)) + 1, s);
		_ad = (_a >= 1 ? 0 : _a) + (_d == s ? 0 : _d);
		return (_ad + (_ad != 0 ? 0 : 1) * min((-(len * t) % 256 / 256 + 1) * (1 / r), s)) || s
	},

	osc = (t, f, type, d, w, d_a, d_b, d_f = X => X) => {
		TYPE = f => type === "sin" ? sin(t * f * PI / 128) : type === "tri" ? rv(abs(btf(t * f))) : type === "saw" ? btf(t * f) : type === "pul" ? rv(t * f % 256 > d) : type === "wvtab" ? rv(cCA(w, t * f * w.length / 256 % w.length, 48) / 128 * 64 / 39) : 0;
		return btf(t * f) == -1 ? 0 : (d_a && (TYPE(f + d_b * d_f(d_a - 1)) + osc(t, f, type, d, w, d_a - 1, d_b, X => d_f(X))))
	},

	R = random,

	tr = 0,


	bass = synth1 = ch1 = ch2 = ch3 = ch4 = ch5 = synth2 = 0,

	saw = (t, x, a) => osc(t, 1, "saw", 0, 0, a, x, _ => sin(2 * _)) / 3,

	synth_1 = t => soft(sin(t * PI / 128 + osc(t, 1, "sin", 0, 0, 1, 0) / 4) , 0)
),

counter = 0,
BPM = 60,
BPM /= 45000,
T = tr ++ * BPM,
I = T / 128,

bass += lp(note(0, 1, "cegg", ~~ I % 4, 96), .0003, 0, 1, 0),
synth1 += note(0, 1, "cgjnoscgeilqsueigjnsuvgjgjnsvzng", ~~ (I * 8) % 32, 60),
ch1 += note(0, 1, "cbee", ~~ I % 4, 60),
ch2 += note(0, 1, "gegg", ~~ I % 4, 60),
ch3 += note(0, 1, "jijj", ~~ I % 4, 60),
ch4 += note(0, 1, "nlnn", ~~ I % 4, 60),
ch5 += note(0, 1, "qnsu", ~~ I % 4, 60),
synth2 += note(0, 1, S2_ar = " njg", S2_t = ~~ I % 4, 48),

[.99, 1.01].map(X => soft((soft(lp(saw(bass, .01 * X, 3) * 1.3 + saw(2 * bass, .01 * X, 3), .003, 1, 1, .9) * .7, 0) + reverb(t, synth_1(synth1) * lp(adsr(I, 2048, .2, 1, .2, 0), .01, 0, 1, 0) * 1.2 + synth_1(synth2 + sin(t * PI / 12800 * X) * 128) * adsr(I, 256, 1, .001, 0, 0) * itrp(S2_ar, S2_t) * .65, .87, .87, 1, -.87, 2, 3, 5125, 901, 8645, 500, 1, 5e4, 1000, x => sin(1 / x * t * PI + 100 * X - 100) * 36, y => y, .4, .15) * .9 + chorus(t, lp([ch1, ch2, ch3, ch4, ch5].map(x => saw(x, .006, 2)).reduce((x, i) => x + i) / 5, .004, 1, 1, .9), 12288, .9, sin(t * PI / 32e3 * X) * 64, -.6) * 1.1) * .6 + lp(rv(R()), .005, 0, 1, 0), 0))