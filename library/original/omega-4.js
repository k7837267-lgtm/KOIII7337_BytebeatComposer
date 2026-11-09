const mod = (a, b) => (a % b + b) % b;
const read = (a, i) => a[floor(mod(i, a.length))];
const mix = (a, b, t) => a + (b - a) * t;
const fract = x => (x % 1 + 1) % 1;
const sinRnd = x => fract(sin(x * 15345.733 * sin(x * 2342.51)));

// Fillter
const fillterBuffer = [];
const Delay = (input, length, feedBack = 0.5, index = 0) => (
	fillterBuffer[fillterIndex] ??= new Float64Array(length),
	fillterBuffer[fillterIndex].t ??= 0,
	
	fillterBuffer[fillterIndex][mod(fillterBuffer[fillterIndex].t, length)] = input + (fillterBuffer[fillterIndex][floor(mod(fillterBuffer[fillterIndex++].t++ + index, length))] ?? 0) * feedBack
);
const Fractal = (input, length, feedBack = 0.5, index = 0, speed = 2) => (
	fillterBuffer[fillterIndex] ??= new Float64Array(length),
	fillterBuffer[fillterIndex].t ??= 0,
	
	fillterBuffer[fillterIndex][mod(fillterBuffer[fillterIndex].t, length)] = input + (fillterBuffer[fillterIndex][floor(mod(fillterBuffer[fillterIndex++].t++ * speed + index, length))] ?? 0) * feedBack
);
const lpf = (a, c) => {
	const index = fillterIndex++;
	return fillterBuffer[index] ??= 0, fillterBuffer[index] += (a - fillterBuffer[index]) * c;
};
const hpf = (a, c) => a - lpf(a, c);

// WaveFrom
const Saw = (x) => mod(x, 256) / 127.5 - 1;
const SawLPF = (t, i = 64) => ((t & 255) / 127.5 - 1) * tanh(abs(sin(t * PI / 256) * i));

const sampleOBJ = {};
const InputWave = (t, Sample, length, ID = "1") => {
	sampleOBJ[ID] ??= { Array: [] };
	sampleOBJ[ID].length = length
	sampleOBJ[ID].Array[floor(mod(t, length))] = Sample;
};
const OutputWave = (t, ID) => {
	return typeof sampleOBJ[ID] === "object" ? sampleOBJ[ID].Array[mod(floor(t), sampleOBJ[ID].length)] || 0 : 0;
};

// Random Var
var fillterIndex;
var DelayTime = -1;

const MajorScale = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 },
noteNameToHz = (N) => {
  const MIDI = MajorScale[N[0]]+{'#':1,'b':-1,' ':0}[N[1]]+parseInt(N[2])*12;
  return 2**(MIDI/12) * 440;
};

const note = [
	["A 3","A 4","G 5","C 6","E 6"],
	["A#3","A#4","A 5","D 6","F 6"],
	["G 4","G 5","A#5","D 6","F 6"],
	["C 5","G 5","A#5","D 6","E 6"],
	["D 5","F 5","A 5","C 6","E 6"],
	["D 5","F 5","A 5","C 6","D 6"],
	["E 5","E 6","G 6","B 6","D 7"],
	["D#4","D#5","G 6","A#6","D 7"]
].map(x => x.map(x => noteNameToHz(x) / 16384 * 2 ** (2 / 12)));

let Time = function() {
	this.t = 0;
	this.last = 0;
	this.process = (num, t = 1) => {
		var n = this.last;
		this.last = num;
		return this.last - n > 0 ? this.t = 0 : this.t += t;
	};
	return this;
},
chord = new Time();

return (t, sR) => {
	DelayTime += 1;
	fillterIndex = 0;
	
	t = round(t * sR);
	let i = 64, o = [0, 0];

	let Input = (t / 4 & 255) / 128 - 1;
	Input *= tanh(abs(sin(t * PI / 1024)) * 8);
	
	InputWave(t, Fractal(Input, 2 ** 13, -0.5, 0, 2), 1024, "Smooth");
	//InputWave(t, Delay(Input, 2 ** 13, -0.95, (sin(t * PI / 2 ** 15) + 1) * 128) / 4, 1024, "Smooth");

	let sum = 0;
	for(let i = 1; i <= 16; i++) sum += OutputWave(t * 2 ** i, "Smooth") / 2 ** i;
	for(let i = 1; i <= 16; i++) sum += OutputWave(t * i * i, "Smooth") / (i * i);

	InputWave(t, sum, 1024, "Fractal");
	
	const ch = note[+"0000000111111111"[t >> 13 & 15] + +"01220322"[t >> 17 & 7] * 2];
	while(i--) o[1 & i] += OutputWave(t * ch[i % 5] + 1e4 * (1 + sin(i + t / 7e5)), "Fractal");

	chord.process('1000100100100100'[t >> 13 & 15], 1)
	return o.map(e => tanh(Delay(lpf(e / 16, max(0, 1 - chord.t / 2 ** 15)), 11306, 0.55, 0)));
};