// Ai will come and destroy us all
// Almost EVERYTHING in this code is made by AI, hence the name.


// AI part
class BiquadLowPass {
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
    this.b0 = (1 - cosW0) * 0.5 * norm;
    this.b1 = (1 - cosW0) * norm;
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

// Human part

function noteToHz(n) {
	return 440*2**(n/12)
}

function s(t,n) {
return (n?filterA:filterB).process((n?reverb:reverb2).process(sin(sin(t*PI*noteToHz([0,-2,-4,-5][t&3])*2)*abs(t*2%8-4))/3)+random()-.5+sin((t%1)**.01*900)*8**(1-t%1)/8+(t*noteToHz([0,2,5,7][t&3])/4&1)/2-.25+(n?filter2A:filter2B).process((random()-.5)*.001**(t*4%1)*4)*20+(n?filter3A:filter3B).process((random()-.5)*.01**(t%1)*4*(t&1))*2)/2*(1+(n?sin:cos)(t*PI/2)/4)
}

const sampleRate = 48000;
reverb = new SimpleReverb(sampleRate, .25, 0.4);
reverb2 = new SimpleReverb(sampleRate, .25, 0.4);
filterA = new BiquadLowPass(sampleRate, 1000, 1);
filterB = new BiquadLowPass(sampleRate, 1000, 1);
filter2A = new BiquadHighPass(sampleRate, 10000, 1);
filter2B = new BiquadHighPass(sampleRate, 10000, 1);
filter3A = new BiquadLowPass(sampleRate, 3000, 1);
filter3B = new BiquadLowPass(sampleRate, 3000, 1);
return function (t) {
	filterA.setCutoff(abs(t*200%2000-1000)+512)
	filterB.setCutoff(abs(t*200%2000-1000)+512)
	return [s(t,0),s(t,1)]
}