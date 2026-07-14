/*
  *
  *    · The Celestial Bell Garden  *.
  *
  */

(() => {
	/* initializations */
	if (!t) fx = []; fxi = 0;

	/* filters */
	lp = lowPassFilter = function (a, c) {
		const lp_fxii = fxi++;
		let filt = fx[lp_fxii] || (fx[lp_fxii] = { f0: 0, f1: 0 });
		filt.f0 += (a - filt.f0) * c;
		return filt.f1 += (filt.f0 - filt.f1) * c;
	};
	hp = highPassFilter = function (a, c) { return a - lp(a, c); };
	bp = bandPassFilter = function (a, hc, lc) { return hp(lp(a, lc), hc); };

	/* async low-pass & compressor */
	alp = asyncLowPass = function (a, cu, cd) {
		const i = fxi++;
		let v = fx[i] || 0;
		return fx[i] = v + (a - v) * (v < a ? cu : cd);
	};

	cmp = compressor = function (a, th, ra, at, rl, sc = a) {
		return a / (alp(max(abs(sc) - th, 0), at, rl) / th * ra + 1);
	};

	/* constants & function names */
	const pi = Math.PI;
	const tau = pi * 2;
	const s = Math.sin;
	const e = Math.exp;
	const c = Math.cos;

	/* parameters */
	let sr = 24e3;
	const poly = polyphony = 16;
	let sec = seconds = 4; /* note: this is the duration of the lowest pitch in this polyrhythm. */
	let trem_mix = .35;
	let vibr_mix = .35;
	const dec = decay = 22e3;
	let dec_mult = 1.5;
	let gain_vol = .98;

	/* frequency & note table */
	const base = baseFrequency = tau / sr * 190.75;
	const notes = [0, 2, 4, 7, 11];

	let idx = out = 0;

	/* polyrhythm setup */
	for (; idx < poly; idx++) {

		/* rhythm for each note */
		const step = (idx / (poly * 4) + 1) / poly * (poly / sec);
		const per = period = sr / step;

		/* tremolo */
		const trem = tremolo = (1 - (-c((t % per) / 1e3) / 2 + .5) * trem_mix);

		/* vibrato */
		const shim = shimmer = s((t % per) / (500 + idx * -.1)) * 10;
		const det = detune = s((t % per) * (idx * -.01 + 1) / 4e3) * 100;

		/* note mapping */
		const nLen = notes.length;
		const freq = 2 ** (~~(idx / nLen) + notes[idx % nLen] / 12);
		const tt = ((t % per) + (det + shim) * vibr_mix) * freq * base;

		/* decay envelopes */
		const env1 = e(-t % per / dec);
		const env2 = e(-t % per / (dec / dec_mult));
		const env3 = e(-t % per / (dec * dec_mult / 2));

		/* additive synthesis - bell */
		const sum =
			s(s(tt) * env1 + s(tt * 6) * env2) * trem /* f + 6f */
			+ s(s(tt * .995) * env1 + s(tt * 6.03) * env2) * trem * .9 /* ~f [-] + ~6f [+] */
			+ s(tt * 2.005) * trem * env3 * .25 /* ~2f [+] */
			+ s(tt * 3.99) * trem * env2 * .8 /* ~4f [-] */
			+ s(tt * 10.025) * trem * env2 * .7 /* ~10f [+] */
			+ s(tt * 17.955) * trem * env3 * .6; /* ~18f [-] */

		const voiceGain = min(1, max(0, (1 - idx * (1 - gain_vol))));

		out += sin(sum / poly / 6) * voiceGain;
	};

	/* output */
	return s(cmp(bp(out * 16, .01, .8), 1, 1, .01, 1e-4));
})()