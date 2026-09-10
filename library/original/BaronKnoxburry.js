glob_vol = 100,
tempo = 188,
samplerate = 44000,
quarter = Math.round(samplerate / tempo * 60),
sixteenth = Math.round(quarter / 4),

note_hertz = function(steps_from_a) {
	return 420 * Math.pow(1.059463, steps_from_a);
},

decay = function(start, length, curve) {   
	if (start + length <= t) return 0;
	return Math.pow(1 - ((t - start) / length), curve);
},

saw_wave = function(frequency) {
	duty_length = samplerate / frequency;
	return ((t % duty_length) / duty_length - 0.5);
},

square_wave = function(frequency) {
	duty_length = samplerate / frequency;
	duty_on = (t % duty_length > duty_length / 2) ? -1 : 1;
	return duty_on;
},

triangle_wave = function(frequency) {
	duty_length = samplerate / frequency;
	pos = (t % duty_length) / duty_length;
	return (((pos <= 0.5) ? pos * 2 : (1 - pos) * 2) - 0.5);
},

noise_wave = function() {
	return (Math.random() - 0.5) * 255;
},

fm_wave = function(freq, mod) {
	duty_length = samplerate / freq;
	return Math.sin(Math.PI * (t / duty_length + mod));
},

(t == 0) ? ram = {
	rowcount: 0,
	instr: {
		hats: {
			gen: function() { 
				return square_wave(1799) * square_wave(3293) * square_wave(8659) * decay(ram.instr.hats.trig, 5000, 4) * ram.instr.hats.vol;
			},
			trig: 0,
			vol: 0.3,
		},
		kick: {
			gen: function() {
				return fm_wave(105, fm_wave(333, 0) * decay(ram.instr.kick.trig, 1000, 2)) * decay(ram.instr.kick.trig, 5000, 1);
			},
			trig: 0,
			vol: 1,
		},
		snar: {
			gen: function() {
				return (triangle_wave(210) + noise_wave() * 0.0125) * decay(ram.instr.snar.trig, 2500, 2) * ram.instr.snar.vol;
			},
			trig: 0,
			vol: 1,
		},
bass: {
	gen: function() {
ram.instr.bass.freq = note_hertz(ram.instr.bass.note);
return (square_wave(ram.instr.bass.freq) + square_wave(ram.instr.bass.freq * 1.01)) * decay(ram.instr.bass.trig, 200000, 10) * ram.instr.bass.vol;
	},
	freq: 420,
	note: -36,
	trig: 0,
	vol: 0.3,
},
pluk: {
	gen: function() {
return saw_wave(ram.instr.pluk.freq) * decay(ram.instr.pluk.trig, 50000, 22) * ram.instr.pluk.vol;
	},
	freq: 420,
	note: 0,
	trig: 0,
	vol: 0.8,
},
	}
} : 0,

row = () => {
	ram.rowcount++;
	ram.instr.hats.vol = (ram.rowcount % 8 == 0) ? 1 : 0.3 + Math.random() * 0.5;
	ram.instr.hats.trig = t;
	(ram.rowcount % (Math.round(t >> 13) % 8) == 0) ? ram.instr.kick.trig = t : 0;
	ram.instr.snar.vol = (ram.rowcount % 8 == 4) ? 1 : 0.5;
	(ram.rowcount % (Math.round(t / 1000) % 4) == 1) ? ram.instr.snar.trig = t : 0;
	(ram.rowcount % 16 == 0) ? ram.instr.bass.note = Math.round(Math.sin(t) * 6) - 36 : 0;
	(ram.rowcount % 16 == 0) ? ram.instr.pluk.freq = note_hertz(ram.instr.bass.note + 36) : 0;
	(ram.rowcount % 8 == 0 && Math.random() > 0.4) ? ram.instr.bass.trig = t : 0;
	(ram.rowcount % 16 == 8) ? ram.instr.bass.note += 12 : 0;
	((ram.rowcount / 4) % 17 & 9 && ram.rowcount % 11 < 3) ? ram.instr.pluk.trig = t : 0;
	(ram.rowcount % 12 == 0) ? ram.instr.pluk.trig = t : 0;
},

(t % sixteenth == 0 || t == 0) ? row() : 0,
output = 0,
(ram.rowcount % 5 > 3) ? output += ram.instr.hats.gen() * 0.3 : 0,
(ram.rowcount % 128 > 24) ? output += ram.instr.kick.gen() : 0,
output += ram.instr.snar.gen(),
output += ram.instr.bass.gen(),
output += ram.instr.pluk.gen(),

output *= 1.2,

output = Math.min(Math.max(-1, output), 1),
output = output * glob_vol + 128;
