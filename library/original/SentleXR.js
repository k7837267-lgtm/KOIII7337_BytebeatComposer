t || (
	tuning = 440,
	EDO = 12,


	filtCutBuf = [],
	filtResBuf = [],
	combAPBuf = [],
	redSRBuf = [],
	oscBuf = [],
	dwnBuf = [],
	slideBuf = [],

	lerp = (a, b, x) => a * (1 - x) + b * x,

	btf = k => k % 256 / 128 - 1,

	rv = x => 2 * x - 1,

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

	bp = (inp, cutL, cutH, res, iter, resfb) => {
		return lp(hp(inp, cutH, res, iter, resfb), cutL, res, iter, resfb)
	},

	nf = (inp, cutL, cutH, volL, volH, res, iter, resfb) => {
		return lp(inp, cutL, res, iter, resfb) * volL + hp(inp, cutH, res, iter, resfb) * volH
	},

	pk = (inp, cut, res, resfb) => {
		return inp * (1 - cut) + lp(-inp, cut, res, 1, resfb)
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

	reverb = (t, inp, gain_diff, gain_del, feedback, del_k, diff_iter, del_iter, diff_val, diff_sub, del_val, del_sub, mod_vol, mod_speed, mod_sub, mod_func = x => x, dry, wet) => {
		out = out_2 =  0;
		for (diff_i = 0; diff_i < diff_iter; ++ diff_i) {
			out += comb_ap(t, inp, 1, diff_val - diff_sub * diff_i, gain_diff, feedback, 0, 0, gain_diff)
		};
		for (del_i = 0; del_i < del_iter; ++ del_i) {
			out_2 += comb_ap(t, diff_iter > 0 ? out : inp, 0, del_val - del_sub * del_i, gain_del, feedback, 1, mod_func(mod_speed - mod_sub) * mod_vol, del_k)
		};
		return hp(out_2 * wet + inp * dry, .005, 0, 1, 0)
	},

	bitcrush = (t, inp, SR) => {
		count = counter ++;
		value = redSRBuf[count] ??= {a:0, b:0},
		f = (t * SR / 48e3) | 0;
		return (f != value.b ? (value.b = f, value.a = inp) : value.a) || 0
	},

	flanger = (t, inp, len, gain, lfo) => {
		return comb_ap(t, inp, 0, len, gain, -1, 1, lfo, 0)
	},
	
	phaser = (inp, cut, cut_isArray, res, res_fb, freqs, exp_k, exp_add, bandw, dry, wet) => {
		phases = 0;
		for (iter = 0; iter < freqs.length; ++ iter) {
			phases += lp(inp, max(0, min(1.8, (freqs[iter] * (cut_isArray ? cut[iter] : cut) ** (exp_k + exp_add * iter)) / 8e3)) ** - (1 / (log(.698) / log(2))), res, bandw, res_fb)/8
		};
		return inp * dry + phases * wet;
	},

	chorus = (t, inp, len, gain, mod, cncl) => {
		return comb_ap(t, hp(inp, .005, 0, 1, 0), 0, len, gain, 1, 1, mod, 0) + cncl * inp
	},

	hard_clip = (inp, mn, mx) => {
		return max(mn, min(mx, inp))
	},

	soft_clip = (inp, assym) => {
		return tanh(inp + assym)
	},

	dwn_smp = (t, inp, len) => {
		count = counter ++;
		dwnBuf[count] ??= 0;
		t % len || (dwnBuf[count] = inp);
		return dwnBuf[count]
	},

	slide = (t, inp, len) => {
		count = counter ++;
		value = slideBuf[count] ??= {a:0, b:0};
		t % len || (value.a = value.b, value.b = inp);
		return lerp(value.a, value.b, t % len / len)
	},

	adsr = (t, len, a, d, s, r) => {
		_a = min((t / 256 * len % 1) * (1 / a), 1);
		_d = max((((len * t + (256 - (256 * a))) / 256 % 1) * - (1 / d)) + 1, s);
		_ad = (_a >= 1 ? 0 : _a) + (_d == s ? 0 : _d);
		return (_ad + (_ad != 0 ? 0 : 1) * min((-(len * t) % 256 / 256 + 1) * (1 / r), s)) || s
	},

	osc = (t, f, d, type) => {
		return type === "sin" ? sin(t * f * PI / 128) : type === "tri" ? rv(abs(btf(t * f))) : type === "saw" ? btf(t * f) : type === "pul" ? rv(t * f % 256 > d) : 0;
	},

	note = x => tuning / 440 * 27.5 * 2 ** (x / EDO) / 187.5,

	cCA = (x, y) => x.charCodeAt(y),

	R = random,

	tr = 0
),

counter = 0,
BPM = 160,
BPM /= 45000,
T = tr ++ * BPM,
I = T / 128,

N = 10,

lfo = osc(t, BPM / 4, 0, "sin") ** 2 * .5 + .3,
lfo_lp_r = (1 - osc(t, BPM / 64, 0, "tri")) * .25,

[.0069, .0071].map(x => pk(reverb(t, lp(nf(soft_clip(chorus(t, osc(t, note(N), 0, "saw"), 1e4, .85, osc(t, x, 0, "sin") * 64, -.6) * 4 + rv(R(x)), 0) + phaser([N + 24, N + 27.1, N + 28.9, N + 31.1, N + 33.9, N + 36.1, N + 38.9, N + 41.1, N + 42.9, N + 46.1].map(y => osc(t, note(y + x), 0, "saw")).reduce((n, i) => n + i) / 10, .4, 0, .2, .99, [16000, 12000, 8000, 4000], .8, .5, 1, 0, 1) * 2.5, .05, .1, lfo, 1 - lfo, .1, 1, .8) / 4, osc(t, BPM * 4, 0, "sin") ** 2 * lfo_lp_r + lfo_lp_r, 1, 2, .9), .82, .86, 1, -.95, 2, 4, 1260, 154, 6931, 652, 1, 56000, 2000, x => sin(1 / x * t * PI) * 64, 1, .4), .9, .5, .99))