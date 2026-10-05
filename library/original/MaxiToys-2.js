class DimensionEffect {
  constructor(sampleRate, maxDelayMs = 40) {
    this.sampleRate = sampleRate;
    this.bufferSize = Math.ceil((maxDelayMs / 1000) * sampleRate);
    this.leftBuffer = new Array(this.bufferSize).fill(0);
    this.rightBuffer = new Array(this.bufferSize).fill(0);
    this.index = 0;

    this.leftDelaySamples = Math.floor((15 / 1000) * sampleRate);   // 15ms
    this.rightDelaySamples = Math.floor((30 / 1000) * sampleRate); // 30ms

    this.wetLevel = 0.35;
    this.dryLevel = 1.0;
  }

  process(input) {
    const [dryL, dryR] = input;

    const idx = this.index;
    const lBuf = this.leftBuffer;
    const rBuf = this.rightBuffer;

    lBuf[idx] = dryL;
    rBuf[idx] = dryR;

    const lRead = (idx - this.leftDelaySamples + this.bufferSize) % this.bufferSize;
    const rRead = (idx - this.rightDelaySamples + this.bufferSize) % this.bufferSize;

    const wetL = lBuf[lRead] ?? 0;
    const wetR = rBuf[rRead] ?? 0;

    this.index = (idx + 1) % this.bufferSize;

    return [
      dryL * this.dryLevel + wetL * this.wetLevel,
      dryR * this.dryLevel + wetR * this.wetLevel,
    ];
  }
}

class HyperEffect {
  constructor(sampleRate, voiceCount = 6) {
    this.sampleRate = sampleRate;
    this.voiceCount = voiceCount;

    // Max delay time ~10ms
    this.maxDelaySamples = Math.floor((10 / 1000) * sampleRate);
    this.bufferSize = this.maxDelaySamples + 2; // extra margin

    this.buffers = Array.from({ length: 2 }, () =>
      new Array(this.bufferSize).fill(0)
    );
    this.bufferIndex = 0;

    // Per-voice LFO state
    this.voices = Array.from({ length: voiceCount }, (_, i) => ({
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.7,
      depth: 0.5 + Math.random() * 0.5,
      pan: i / (voiceCount - 1), // 0 (left) to 1 (right)
    }));

    this.wetLevel = 0.4;
    this.dryLevel = 1.0;
    this.t = 0;
  }

  process(input) {
    // Ensure the input is an array with two elements
    const [dryL, dryR] = Array.isArray(input) && input.length === 2 ? input : [0, 0];

    // Write input to circular buffer
    this.buffers[0][this.bufferIndex] = dryL;
    this.buffers[1][this.bufferIndex] = dryR;

    let wetL = 0;
    let wetR = 0;

    for (let v of this.voices) {
      // Calculate delay modulation (0 to maxDelaySamples)
      const lfo = Math.sin(v.phase + this.t * v.speed * 2 * Math.PI);
      const delaySamples =
        (0.5 + lfo * v.depth * 0.5) * this.maxDelaySamples;

      // Calculate read index
      const readIdx =
        (this.bufferIndex - Math.floor(delaySamples) + this.bufferSize) %
        this.bufferSize;

      const delayedL = this.buffers[0][readIdx] ?? 0;
      const delayedR = this.buffers[1][readIdx] ?? 0;

      // Pan the voice between L and R
      const left = delayedL * (1 - v.pan);
      const right = delayedR * v.pan;

      wetL += left;
      wetR += right;
    }

    // Average the wet mix
    wetL /= this.voiceCount;
    wetR /= this.voiceCount;

    // Mix wet and dry
    const outL = dryL * this.dryLevel + wetL * this.wetLevel;
    const outR = dryR * this.dryLevel + wetR * this.wetLevel;

    this.bufferIndex = (this.bufferIndex + 1) % this.bufferSize;
    this.t += 1 / this.sampleRate;

    return [outL, outR];
  }
}

class SoftDistortion {
  constructor(threshold = 0.7, drive = 1) {
    this.threshold = threshold;
    this.drive = drive;
  }

  process(sample) {
    // Apply the drive to the sample
    sample *= this.drive;
    

    return tanh(sample)*this.threshold;
  }
}

class Phaser {
  constructor(sampleRate, depth = 1, rate = 1, feedback = 0.5) {
    this.sampleRate = sampleRate;
    this.depth = depth; // Modulation depth
    this.rate = rate;   // Modulation rate (speed of phase shift)
    this.feedback = feedback; // Feedback amount
    this.inputHistory = [0, 0];
    this.outputHistory = [0, 0];
    this.phase = 0;
  }

  process(sample) {
    // Generate the phase modulation signal
    const modulator = Math.sin(2 * Math.PI * this.rate * this.phase / this.sampleRate);

    // Apply modulation depth to the signal
    const modulatedSample = sample * (1 - this.depth * modulator);

    // Apply feedback (creating the comb-filtering effect)
    const output = modulatedSample + this.feedback * this.outputHistory[0];

    // Update history
    this.outputHistory[1] = this.outputHistory[0];
    this.outputHistory[0] = output;

    // Increment phase (to modulate the phase over time)
    this.phase++;

    return output;
  }

  setRate(newRate) {
    this.rate = newRate;
  }

  setDepth(newDepth) {
    this.depth = newDepth;
  }

  setFeedback(newFeedback) {
    this.feedback = newFeedback;
  }
}


class BiquadLowPass {
  constructor(sampleRate, cutoff, resonance) {
    this.sampleRate = sampleRate;
    this.cutoff = cutoff;
    this.resonance = resonance;

    // History variables (keeps track of previous inputs and outputs)
    this.inputHistory = [0, 0];
    this.outputHistory = [0, 0];

    // Initialize coefficients
    this.updateCoefficients();
  }

  // Function to update filter coefficients based on cutoff and resonance
  updateCoefficients() {
    const w0 = (2 * Math.PI * this.cutoff) / this.sampleRate;
    const alpha = Math.sin(w0) / (2 * this.resonance);
    const cosW0 = Math.cos(w0);

    const norm = 1 / (1 + alpha);
    this.b0 = (1 - cosW0) * 0.5 * norm;
    this.b1 = (1 - cosW0) * norm;
    this.b2 = this.b0;
    this.a1 = -2 * cosW0 * norm;
    this.a2 = (1 - alpha) * norm;
  }

  // Function to process an individual sample through the filter
  process(sample) {
    const output =
      this.b0 * sample +
      this.b1 * this.inputHistory[0] +
      this.b2 * this.inputHistory[1] -
      this.a1 * this.outputHistory[0] -
      this.a2 * this.outputHistory[1];

    // Shift the history
    this.inputHistory[1] = this.inputHistory[0];
    this.inputHistory[0] = sample;
    this.outputHistory[1] = this.outputHistory[0];
    this.outputHistory[0] = output;

    return output;
  }

  // Function to update cutoff frequency dynamically
  setCutoff(newCutoff) {
    if (newCutoff !== this.cutoff) {
      this.cutoff = newCutoff;
      this.updateCoefficients();
    }
  }

  // Function to update resonance (Q factor)
  setResonance(newResonance) {
    if (newResonance !== this.resonance) {
      this.resonance = newResonance;
      this.updateCoefficients();
    }
  }
}

class BiquadHighPass {
  constructor(sampleRate, cutoff, resonance) {
    this.sampleRate = sampleRate;
    this.cutoff = cutoff;
    this.resonance = resonance;
    this.inputHistory = [0, 0];
    this.outputHistory = [0, 0];
    this.updateCoefficients();
  }

  updateCoefficients() {
    const w0 = (2 * Math.PI * this.cutoff) / this.sampleRate;
    const alpha = Math.sin(w0) / (2 * this.resonance);
    const cosW0 = Math.cos(w0);

    const norm = 1 / (1 + alpha);
    this.b0 = (1 + cosW0) * 0.5 * norm;
    this.b1 = -(1 + cosW0) * norm;
    this.b2 = this.b0;
    this.a1 = -2 * cosW0 * norm;
    this.a2 = (1 - alpha) * norm;
  }

  process(sample) {
    const output =
      this.b0 * sample +
      this.b1 * this.inputHistory[0] +
      this.b2 * this.inputHistory[1] -
      this.a1 * this.outputHistory[0] -
      this.a2 * this.outputHistory[1];

    // Shift history
    this.inputHistory[1] = this.inputHistory[0];
    this.inputHistory[0] = sample;
    this.outputHistory[1] = this.outputHistory[0];
    this.outputHistory[0] = output;

    return output;
  }

  setCutoff(newCutoff) {
    if (newCutoff !== this.cutoff) {
      this.cutoff = newCutoff;
      this.updateCoefficients();
    }
  }

  setResonance(newResonance) {
    if (newResonance !== this.resonance) {
      this.resonance = newResonance;
      this.updateCoefficients();
    }
  }
}

class Metronome {
  constructor(sampleRate, bpm = 120) {
    this.sampleRate = sampleRate;
    this.initialized = false;
    this.bpm = bpm;
    this.lastBPMChangeTime = 0;
    this.lastBeatAtChange = 0;
    this.beatsPerSecond = bpm / 60;
  }

  setBPM(bpm, t = 0) {
    if (!this.initialized) {
      // First-time init
      this.lastBeatAtChange = 0;
      this.lastBPMChangeTime = t;
      this.initialized = true;
    } else {
      // Update beat position at time of change
      this.lastBeatAtChange = this.getExactBeatNumber(t);
      this.lastBPMChangeTime = t;
    }

    this.bpm = bpm;
    this.beatsPerSecond = bpm / 60;
  }

  getExactBeatNumber(t) {
    if (!this.initialized) {
      this.setBPM(this.bpm, t); // Auto-init if needed
    }

    const delta = t - this.lastBPMChangeTime;
    return this.lastBeatAtChange + delta * this.beatsPerSecond;
  }

  getBeatNumber(t) {
    return Math.floor(this.getExactBeatNumber(t));
  }
}

class SimpleReverb {
  constructor(sampleRate, maxDelayTime, decayFactor) {
    this.sampleRate = sampleRate;
    this.maxDelayTime = maxDelayTime;
    this.decayFactor = decayFactor;
    
    this.delayLine1 = new Array(Math.floor(maxDelayTime * sampleRate)).fill(0);
    this.delayLine2 = new Array(Math.floor(maxDelayTime * sampleRate)).fill(0);
    
    this.writeIndex = 0;
    this.readIndex1 = 0;
    this.readIndex2 = 0;
  }

  process(input) {
    // Get current values from delay lines
    const delayedSample1 = this.delayLine1[this.readIndex1];
    const delayedSample2 = this.delayLine2[this.readIndex2];

    // Simple feedback network (mix delayed samples)
    const output = input + this.decayFactor * (delayedSample1 + delayedSample2);

    // Write current sample to the delay lines with feedback
    this.delayLine1[this.writeIndex] = input + delayedSample1 * 0.7;
    this.delayLine2[this.writeIndex] = input + delayedSample2 * 0.5;

    // Update read indices (circular buffer)
    this.readIndex1 = (this.readIndex1 + 1) % this.delayLine1.length;
    this.readIndex2 = (this.readIndex2 + 1) % this.delayLine2.length;
    this.writeIndex = (this.writeIndex + 1) % this.delayLine1.length;

    return output;
  }
}

class SidechainCompressor {
  constructor(sampleRate, threshold = 0.2, ratio = 4, attack = 0.005, release = 0.2) {
    this.sampleRate = sampleRate;
    this.threshold = threshold;
    this.ratio = ratio;
    this.attackCoeff = Math.exp(-1 / (attack * sampleRate));
    this.releaseCoeff = Math.exp(-1 / (release * sampleRate));
    this.env = 0;
    this.gain = 1;
  }

  process(input, sidechainInput) {
    const level = Math.abs(sidechainInput);
    this.env = Math.max(level, this.env * (level > this.env ? this.attackCoeff : this.releaseCoeff));

    let gainReduction = 1;
    if (this.env > this.threshold) {
      const dbOver = Math.log10(this.env / this.threshold) * 20;
      const dbReduced = dbOver / this.ratio;
      const newEnv = this.threshold * 10 ** (dbReduced / 20);
      gainReduction = newEnv / this.env;
    }

    return input * gainReduction;
  }
}


function note(n) {
	return 440*2**(n/12)
}

const m = new Metronome(48e3,140)

const hyper = new HyperEffect(48000);
const dim = new DimensionEffect(48000);
const s = new SoftDistortion(.25,5);
const p = new Phaser(48e3,.1,0.999);
const fil = new BiquadLowPass(48e3,200,1);
const f = new BiquadLowPass(48e3,200,1);
const f2 = new BiquadLowPass(48e3,200,1);
const rv = new SimpleReverb(48e3,.5,.3);
const rv2 = new SimpleReverb(48e3,.5,.3);
const hhf = new BiquadHighPass(48e3,7000,1);
const hhf2 = new BiquadHighPass(48e3,7000,1);
const snf = new BiquadLowPass(48e3,2000,1);
const snf2 = new BiquadLowPass(48e3,2000,1);
const sch = new SidechainCompressor(48e3,.2,90,1,.1);
const sch2 = new SidechainCompressor(48e3,.2,90,1,.1);

function b(t,sR) {
	beat = m.getExactBeatNumber(t)
const [l,r] = [(t*note([0,0,2,3,5,5,7,7][beat&7])/8%1)-.5+sin(t*note([0,0,2,3,5,5,7,7][beat&7])*PI/4)/4,(t*note([0,0,2,3,5,5,7,7][beat&7])*1.01/8%1)-.5+sin(t*note([0,0,2,3,5,5,7,7][beat&7])*PI/4)/4];
const [BoutL, BoutR] = hyper.process([l, r]);
const [outL, outR] = dim.process([BoutL, BoutR]);
const stbass =  [f.process(p.process(s.process(outL))), f2.process(p.process(s.process(outR)))];
const chor = fil.process(((t*note([0,2,5,7][beat/2&3])/8.1%1)/2-.25+((t*note([0,2,5,7][beat/2&3])/8%1)/2-.25)/4*8**(1-beat*4%1))*'100100100001'[beat*4&7]*400**(1-beat%.25)/400)*2
return [sch.process(chor*(beat>64)+stbass[0]+rv.process(sin(sin(t*PI*2*note([0,7,5,2,0,-7,2,-5,-12,-12,,0,7,12,14,17][beat&15]))*(2+(2-beat%2))+beat*8||0)*(beat>16)/8)+hhf.process(random()-.5)*800**(1-beat*2%1)*(beat>32)/800,+sin((beat/2%1)**.01*6000)*800**(1-beat/2%1)*(beat>24)/800)+sin((beat/2%1)**.01*4000)*800**(1-beat/2%1)*(beat>24)/800+snf.process(random()-.5)*2*(1-beat/2%1)*(beat/2&1)*(beat>32),
sch2.process(chor*(beat>64)+stbass[1]+rv2.process(sin(cos(t*PI*2*note([0,7,5,2,0,-7,2,-5,-12,-12,,0,7,12,14,17][beat&15]))*(2+(2-beat%2))+beat*8||0)*(beat>16)/8)+hhf2.process(random()-.5)*800**(1-beat*2%1)*(beat>32)/800,+sin((beat/2%1)**.01*6000)*800**(1-beat/2%1)*(beat>24)/800)+sin((beat/2%1)**.01*4000)*800**(1-beat/2%1)*(beat>24)/800+snf2.process(random()-.5)*2*(1-beat/2%1)*(beat/2&1)*(beat>32)];
}

return t=>b(t,48e3)