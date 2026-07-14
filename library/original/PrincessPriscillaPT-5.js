(() => {
	if (t == 0) {
		fx = [];
		dlybuf = [];
	};

	/* filters */
	lpf = (inp, cut) => (
		lpf_fxii = fxi++,
		f = fx[lpf_fxii] ??= {f0: 0},
		f.f0 += (inp - f.f0) * cut
	);

	hpf = (inp, cut) => (
		inp - lpf(inp, cut)
	);

	bpf = (inp, hcut, lcut) => (
		hpf(lpf(inp, lcut), hcut)
	);

	/* delay/reverb */
	dMax = 1e5;
	dly = multiTapDelay =(inp, heads, mix, fbfn = x => x) => {
		dly_fxii = dlyfxi++;
		dlybuf[dly_fxii] ??= new Float32Array(dMax);
		dly_wi = dt % dMax;
		dly_feed = inp;
		dly_out = 0;

		for(let head of heads){
			dly_ri = dlybuf[dly_fxii][(dMax + dt - round(head.t)) % dMax];
			dly_feed += dly_ri * head.fb;
			dly_out += dly_ri * head.m;
		};

		dlybuf[dly_fxii][dly_wi] = fbfn(dly_feed);
		return inp * (1 - mix) + dly_out * mix;
	};

	var fxi = 0;
	var dlyfxi = 0;
	var dt = t;

	/* track settings */
	const bpm = 90;
	const sr = 24e3;
	const spb = (60 / bpm) * sr;
	var sec = t / sr;
	var ts = sec * (bpm / 60) * 16384;
	var tt = sec * 256 * 440 * 2 ** (6 / 12);
	gain = (dB = 0) => 10 ** (dB / 20);

	/* sequencers */
	let prog = ts >> 15 & 7;
	let mseq = tt / 2 * 2 ** ((parseInt("0 3 a qm h f e7ae f 7 a5 7 3 532"[31 & (11 & ts >> 12) + (ts >> 14)], 36) || parseInt("03ac5a75"[7 & ts >> 15], 16)) / 12);
	let bseq = tt * 2 ** (parseInt("cc88aafa"[(ts >> 19) > 2 ? prog : 0], 36) / 12);
	let cseq = idx => tt * 2 ** ([[0, 3, 7], [-2, 3, 7], [0, 3, 8], [-2, 2, 5]]["00223313"[prog]][idx] / 12) / 2;

	/* instruments/oscillators */
	kick = () => sin(16 * (ts % 4096) ** .25 + (random() - .5) / 24) * 1.55;
	snare = () => bpf(random(), .55, .65) * 3.2;
	hat = () => hpf(random(), .2) * (1 - ts / 4096 % 1) ** 2 * 1.2;
	melody = (phase) => pwm(phase, sin(ts * PI / 16384 / 3) / 2);
	chords = (n0, n1, n2, lr) => saw(n0, lr) + saw(n1, lr) + saw(n2, lr);
	bass = (phase, lr) => saw(phase / 16) + saw(phase / (lr ? 8.04 : 7.96));
	pwm = (phase, dutyCycle = 0, shapeMode) => phase ? sign((shapeMode ? sin(phase * PI / 128 + 1e-10) : asin(sin(phase * PI / 128 + 1e-10)) / (PI / 2)) - dutyCycle) / 2 + dutyCycle / 2 : 0;
	saw = (phase) => atan(tan(phase * PI / 256 + 1e-10)) / (PI / 2);
	sps = (phase, lr) => saw(phase) + saw(phase * (lr ? 1.005 : .995)) + saw(phase * (lr ? 2.0065 : 1.9935));
	sinc = (phase) => sin(sin(phase * PI / 128) + sin(phase * PI / 32) / 8);
	bell = (phase, decay = 1) => (bit = phase - phase % "1352"[ts >> 12 & 3] * 10, (sinc(bit) * decay + sinc(bit * 3.99) / 2 * decay ** 2 + sinc(bit * 10.025) / 3 * decay ** 3 + sinc(bit * 17.955) / 4 * decay ** 4) / 1.75 || 0);

	/* automations/envelopes */
	let kEnv = (1 - (ts / 4096 % 1) ** 4) *! (ts >> 12 & 3);
	let sEnv = (1 - (ts / 32768 + .5) % 1) ** 1.5;
	let sc = min(1, ts / 16384 % 1 * 3) ** 2;

	/* song progression */
	prg = (str = "", spd = 0) => {if (str === " ") return 0; return str[ts >> spd] | 0};
	let kProg = prg("0001100110", 19);
	let sProg = prg("0001101110", 19);
	let hProg = prg("0011101110", 19);
	let mProg = prg("1111111111", 19);
	let cProg = prg("1111111110", 19);
	let bProg = prg("0111111111", 19);

	out = (lr) => tanh(((kick(lr) * kEnv * kProg + snare(lr) * sEnv * sProg + hat(lr) * hProg) * 1.15 + (dly((bpf(melody(mseq), .2, .75) * 1.15 + bell(mseq, exp(-ts % 4096 / 7e3))) * mProg + bpf(chords(cseq(0), cseq(1), cseq(2), lr), .5, .25) * cProg * 1.25, [{t: 300 + (lr ? cos : sin)(t / 4e3) * 40, m: 1, fb: 0}, {t: spb / (lr ? 2.01 : 1.99) + (lr ? sin : cos)(t / 35e3) * 175, m: .7, fb: .8}], .6, x => bpf(x, .1, .95)) * 1.45 + lpf(bass(bseq, lr), .01 + (1 - ts / 4096 % 1) ** 2 * .45) * bProg) * (kProg ? sc : 1) * 1.1) / 1.55) * gain(-1.5);
	return [out(0), out(1)];
})()