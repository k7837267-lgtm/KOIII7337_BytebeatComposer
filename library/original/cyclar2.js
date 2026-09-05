t||(_ = (() => {

// cyclar2 - don't leave me behind (DEMO)
// I RAN OUT OF FREAKING TIME!!!!!
// but i didn't want this thing to go to waste...

// FLOATBEAT 48000Hz pl0x
// https://dollchan.net/bytebeat/

//////////////////// GLOBALS & UTILS ////////////////////

// enable 2x oversampling if you dare
const OVERSAMPLING = false

// sample rate (*2 for oversampling)
const SR = 48000          *(OVERSAMPLING?2:1)
// delta time (sample length)
const dt = 1/SR
// math stuff
// (mostly so my text editor knows what the hell is going on)
const sin = Math.sin,
      cos = Math.cos,
      PI = Math.PI,
      min = Math.min,
      max = Math.max,
      floor = Math.floor,
      exp = Math.exp, 
      sqrt = Math.sqrt,
      random = Math.random
const TAU = 2*PI

// mod1: a % 1 but it works properly
const mod1 = (a) => a < 0 ? -(-a%1) + 1 : a%1
// modn: a % n but it works properly
const modn = (a, n) => a < 0 ? -(-a%n) + n : a%n
// mix: dry/wet mixer
const mix = (m, d, w) => m*w + (1 - m)*d

/// waveforms
// sine wave
const wave_sin = (ph) => sin(TAU * ph)
// half sine
const wave_halfsin = (ph) => mod1(ph) < 0.5 ? sin(TAU * ph) : 0
// square wave
const wave_squ = (ph) => mod1(ph) < 0.5 ? 1 : -1
// triangle wave
const wave_tri = (ph) => 1 - abs(modn(4*ph + 1, 4) - 2)
// saw wave
const wave_saw = (ph) => 2*(mod1(ph + 0.5)) - 1

//////////////////// ENGINE CORE ////////////////////

/// scales
const scale_12edo = (base, degree) => base * 2**((degree + 3)/12)
const scale_12edo_on = (offset) => (base, degree) => base * 2**((degree + offset)/12)

/// filters

// biquad filters
// derived using formulas from https://webaudio.github.io/Audio-EQ-Cookbook/audio-eq-cookbook.html
const filt_bq_lp = class {
    #x = [0, 0]
    #y = [0, 0]
    #b0 = 0
    #b1 = 0
    #a1 = 0
    #a2 = 0

    constructor(cutoff, resonance) {
        this.change(cutoff, resonance)
    }

    proc(input) {
        const x = this.#x, y = this.#y
        const output = this.#b0 * input + this.#b1 * x[0] + this.#b0 * x[1] - this.#a1 * y[0] - this.#a2 * y[1]
        x[1] = x[0]
        x[0] = input
        y[1] = y[0]
        y[0] = output
        return output
    }

    change(cutoff = SR / 2, resonance = 1) {
        const omega = TAU*cutoff*dt
        const cos_omega = cos(omega), sin_omega = sin(omega)
        const alpha = sin_omega / (2*resonance)
        const a0_rec = 1/(1 + alpha)
        this.#b0 = 0.5 * (1 - cos_omega) * a0_rec
        this.#b1 = (1 - cos_omega) * a0_rec
        this.#a1 = -2 * cos_omega * a0_rec
        this.#a2 = (1 - alpha) * a0_rec
    }
}

// my shitty delay class (don't ask me why it's here i cba to move it now)
const delay_wawa = class {
    #buffer0 = new Array(SR/6)
    #buffer1 = new Array(SR/6)
    #dlyd = [0, 0]
    #lpf0 = new filt_bq_lp(1400)
    #lpf1 = new filt_bq_lp(1400)
    #pointer = 0

    constructor() {
        this.#buffer0.fill(0)
        this.#buffer1.fill(0)
    }

    proc(in0, in1, out) {
        const a0 = this.#lpf0.proc(in0)
        const a1 = this.#lpf1.proc(in1)

        this.#dlyd[0] = this.#buffer0[this.#pointer]
        this.#dlyd[1] = this.#buffer1[this.#pointer]

        out[0] = a0 + this.#dlyd[0]*0.5
        out[1] = a1 + this.#dlyd[1]*0.5

        this.#buffer0[this.#pointer] = out[1]
        this.#buffer1[this.#pointer] = out[0]

        this.#pointer = (this.#pointer + 1) % this.#buffer0.length
        
        out[0] = mix(0.15, in0, this.#dlyd[0])
        out[1] = mix(0.15, in1, this.#dlyd[1])
    }
}

// downsampler
// adapted from https://www.musicdsp.org/en/latest/Filters/231-hiqh-quality-2-decimators.html
const filt_downsample = class {
    #R1 = 0
    #R2 = 0
    #R3 = 0
    #R4 = 0
    #R5 = 0

    proc(x0, x1) {
        const h5x0 = 0.01300578034682081*x0
        const h3x0 = -0.06358381502890173*x0
        const h1x0 = 0.30057803468208094*x0
        const R6 = this.#R5 + h5x0
        this.#R5 = this.#R4 + h3x0
        this.#R4 = this.#R3 + h1x0
        this.#R3 = this.#R2 + h1x0 + 0.5*x1
        this.#R2 = this.#R1 + h3x0
        this.#R1 = h5x0
        return R6
    }
}

// stereo downsampler
const filt_downsample_s = class {
    #filt_l = new filt_downsample()
    #filt_r = new filt_downsample()

    proc(in1, in2, out) {
        out[0] = this.#filt_l.proc(in1[0], in2[0])
        out[1] = this.#filt_r.proc(in1[1], in2[1])
    }
}

/// envelopes
// unused here but yknow
const env_ad = class {
    constructor(options = {}) {
        this.phase = 0
        this.level = 0
        this._open = false

        this.a = options?.a ?? 0.01
        this.d = options?.d ?? 0.5
    }

    open() {
        this.phase = 0
        this._open = true
    }

    close() {
        this._open = false
    }

    proc() {
        let phase = this.phase, open = this._open, a = open ? this.a : 0
        if (phase < a) {
            this.level = min(1, sin(0.5*PI*(phase / a)))
            this.phase += dt
        } else {
            this.level += -this.level * (open ? this.d : 0.9999)*dt
        }
    }
}

// Attack Hold Decay Sustain Release. What a mouthful!
const env_ahdsr = class {
    level = 0

    #state = 0
    #phase = 0

    a = 0.0001
    h = 0
    d = 0
    s = 1
    r = 0.001

    #a_level = 0
    #r_level = 0

    constructor(options) {
        if (typeof options !== "object") return
        const { a, h, d, s, r } = options
        if (a !== undefined) this.a = a
        if (h !== undefined) this.h = h
        if (d !== undefined) this.d = d
        if (s !== undefined) this.s = s
        if (r !== undefined) this.r = r
    }

    open() {
        this.#state = 1
        this.#phase = 0
        this.#a_level = this.level
    }

    close() {
        this.#state = 0
        this.#phase = 0
        this.#r_level = this.level
    }

    reset() {
        this.#state = 1
        this.#phase = 0
        this.#a_level = 0
        this.#r_level = 0
    }

    proc() {
        // Release state
        if (this.#state === 0) {
            if (this.level === 0) return
            const r = this.r
            if (r === 0) return void (this.level = 0)
            const phase = min(1, this.#phase)
            const level = 1 - phase, r_level = this.#r_level
            this.level = r_level*level*level
            this.#phase = phase + dt/r
            return
        }
        // Attack state
        if (this.#state === 1) {
            const phase = this.#phase
            if (phase >= 1) {
                this.#state = this.h > 0 ? 2 : 3
                this.#phase = 0
            } else {
                const a = this.a, a_level = this.#a_level
                const level = 1 - phase
                this.level = a_level + (1 - a_level)*(1 - level*level)
                this.#phase = phase + dt/a
                return
            }
        }
        // Hold state
        if (this.#state === 2) {
            const phase = this.#phase
            if (phase >= 1) {
                this.#state = 3
                this.#phase = 0
            } else {
                this.level = 1
                this.#phase = phase + dt/this.h
                return
            }
        }
        // Decay state
        if (this.#state === 3) {
            const phase = this.#phase
            if (phase >= 1) {
                this.#state = 4
                this.#phase = 0
            } else {
                const level = 1 - phase
                const s = this.s
                this.level = s + (1 - s)*level*level
                this.#phase = phase + dt/this.d
                return
            }
        }
        // Sustain state
        if (this.#state === 4) {
            this.level = this.s
        }
    }
}

/// synth voices

// fm operator lol
const _fm_op = class {
    waveform = 0
    feedback = 0
    level = 0
    tune = 0
    shift = 0
    freq_mult = 1

    #feedback0 = 0
    #feedback1 = 0
    #phase = 0

    proc(freq, mod = 0) {
        const phase = this.#phase
        const phdelta = dt*(freq*this.freq_mult + this.tune)
        this.#phase = (phase + phdelta)%1
        const feedback = this.feedback*0.5*(this.#feedback0 + this.#feedback1)
        let output
        const modphase = phase + this.shift + mod + feedback
        switch (this.waveform) {
            case 0:
                output = wave_sin(modphase)
                break
            case 1:
                output = wave_halfsin(modphase)
                break
            case 2:
                output = wave_squ(modphase)
                break
            case 3:
                output = wave_saw(modphase)
                break
            case 4:
                output = wave_tri(modphase)
                break
            case 5:
                output = (random() - 0.5)*2
                break
            default:
                output = 0
                break
        }

        this.#feedback1 = this.#feedback0
        this.#feedback0 = output

        return output*this.level
    }

    reset() {
        this.#phase = 0
    }
}

// a whole fm4 voice
const voice_fm4op = class {
    op1 = new _fm_op()
    op2 = new _fm_op()
    op3 = new _fm_op()
    op4 = new _fm_op()

    env1 = new env_ahdsr()
    env2 = new env_ahdsr()
    env3 = new env_ahdsr()
    env4 = new env_ahdsr()

    freq = 0
    pan = 0

    #in_release = false

    constructor(data) {
        this.data = data
        this.op4.level = 1
    }

    configure(options) {
        if (typeof options !== "object") return

        const { freq } = options
        if (freq !== undefined) this.freq = freq
        
        process_op_config(options.op1, this.op1, this.env1)
        process_op_config(options.op2, this.op2, this.env2)
        process_op_config(options.op3, this.op3, this.env3)
        process_op_config(options.op4, this.op4, this.env4)

        function process_op_config(options, op, env) {
            if (typeof options !== "object") return
            const { waveform, level, tune, feedback, shift, freq, mult, env: env_config } = options
            if (waveform !== undefined) op.waveform = waveform
            if (level !== undefined) op.level = level
            if (tune !== undefined) op.tune = tune
            if (feedback !== undefined) op.feedback = feedback
            if (shift !== undefined) op.shift = shift
            if (freq !== undefined) op.fixed_freq = freq
            if (mult !== undefined) op.freq_mult = mult

            if (typeof env_config === "object") {
                const { a, d, h, s, r } = env_config
                if (a !== undefined) env.a = a
                if (h !== undefined) env.h = h
                if (d !== undefined) env.d = d
                if (s !== undefined) env.s = s
                if (r !== undefined) env.r = r
            }
        }
    }

    proc(out) {
        this.env1.proc()
        this.env2.proc()
        this.env3.proc()
        this.env4.proc()

        const freq = this.freq
        const m1 = this.op1.proc(this.op1.fixed_freq ?? freq)*this.env1.level
        const m2 = this.op2.proc(this.op2.fixed_freq ?? freq, m1)*this.env2.level
        const m3 = this.op3.proc(this.op3.fixed_freq ?? freq)*this.env3.level
        const c4 = this.op4.proc(this.op4.fixed_freq ?? freq, m2 + m3)*this.env4.level

        const pan_factor = PI*0.25*(this.pan+1), pan_l = cos(pan_factor), pan_r = sin(pan_factor)
        out[0] = c4*pan_l
        out[1] = c4*pan_r
    }

    open() {
        this.env1.open()
        this.env2.open()
        this.env3.open()
        this.env4.open()
        this.#in_release = false
    }

    close() {
        this.env1.close()
        this.env2.close()
        this.env3.close()
        this.env4.close()
        this.#in_release = true
    }

    retrigger(op) {
        if (op === undefined) {
            this.env1.reset()
            this.op1.reset()
            this.env2.reset()
            this.op2.reset()
            this.env3.reset()
            this.op3.reset()
            this.env4.reset()
            this.op4.reset()
        } else {
            switch (op) {
                case 1:
                    this.env1.reset()
                    this.op1.reset()
                    break
                case 2:
                    this.env2.reset()
                    this.op2.reset()
                    break
                case 3:
                    this.env3.reset()
                    this.op3.reset()
                    break
                case 4:
                    this.env4.reset()
                    this.op4.reset()
                default:
                    break
            }
        }
    }

    get killable() {
        return this.#in_release && this.env4.level <= 0
    }
}

// the vm stands for voice manager
const vm_poly = class {
    #max_voices
    #voices
    #voice_count = 0
    #voice_class
    #kill_queue = []
    
    constructor(voice_class, max_voices = 16) {
        this.#max_voices = max_voices
        this.#voices = new Array(max_voices)
        this.#voice_class = voice_class
    }

    proc() {
        let kill = false
        for (let i = 0; i < this.#voice_count; i++) {
            const voice = this.#voices[i]
            if (voice.killable) {
                kill = true
                this.#kill_queue.push(i)
            }
        }
        if (kill) {
            let voices_killed = 0
            for (const index of this.#kill_queue) {
                this.#kill_voice(index - voices_killed)
                voices_killed++
            }
            this.#kill_queue.length = 0
        }
    }

    getVoice(note) {
        for (let i = 0; i < this.#voice_count; i++) {
            const voice = this.#voices[i]
            if (voice.data.note === note) return voice
        }
    }

    createVoice(data) {
        let voice_count = this.#voice_count
        for (let i = 0; i < voice_count; i++) {
            const voice = this.#voices[i]
            if (voice.data.note === data.note) {
                voice.close()
                voice.data = data
                return voice
            }
        }

        if (voice_count === this.#max_voices) {
            this.#kill_voice(0)
            voice_count--
        }

        const voice = new this.#voice_class(data)
        this.#voices[voice_count] = voice
        this.#voice_count = voice_count + 1
        return voice
    }

    cutVoice(note) {
        for (let i = 0; i < this.#voice_count; i++) {
            const voice = this.#voices[i]
            if (voice.data.note === note) {
                this.#kill_voice(i)
                return
            }
        }
    }

    clear() {
        for (let i = 0; i < this.#voice_count; i++) {
            delete this.#voices[i]
        }
        this.#voice_count = 0
    }

    #kill_voice(index) {
        for (let i = index; i < this.#voice_count - 1; i++) {
            this.#voices[i] = this.#voices[i + 1]
        }       
        this.#voice_count--
        delete this.#voices[this.#voice_count]
    }

    *voices() {
        for (let i = 0; i < this.#voice_count; i++) {
            yield this.#voices[i]
        }
    }

    *distribute(note) {
        if (note !== undefined) {
            const voice = this.getVoice(note)
            if (voice !== undefined) yield voice
        } else {
            for (let i = 0; i < this.#voice_count; i++) {
                yield this.#voices[i]
            }
        }
    }
}

//////////////////// SYNTH UNITS ////////////////////
// FM4
// my flagship 4-operator FM synthesizer
const synth_fm4 = class {
    #vm
    #patch
    #base = 440
    #scale = scale_12edo

    constructor(options) {
        options ??= {}
        this.#vm = new vm_poly(voice_fm4op, options.polyphony ?? 16)
        this.configure(options)
    }

    configure(options) {
        if (typeof options !== "object") return
        const { patch, base_freq, scale } = options
        if (patch !== undefined) this.#patch = patch
        if (base_freq !== undefined) this.#base = base_freq
        if (scale !== undefined) this.#scale = scale
    }

    proc(out) {
        this.#vm.proc()
        for (const voice of this.#vm.voices()) {
            const out_ = [0, 0]
            voice.proc(out_)
            out[0] += out_[0]*0.35
            out[1] += out_[1]*0.35
        }
    }

    event(type, data) {
        data ??= {}
        switch (type) {
            case "note_on":
            {
                const voice = this.#vm.createVoice({ note: data.note ?? 0 })
                voice.freq = data.freq ?? this.#scale(this.#base, voice.data.note)
                voice.pan = data.pan ?? 0
                if (typeof data.func === "function") data.func(voice)
                voice.configure(this.#patch)
                voice.open()
                break
            }
            case "note_off":
            {
                for (const voice of this.#vm.distribute(data.note)) {
                    voice.close()
                }
                break
            }
            case "note_cut":
            {
                if (data.note !== undefined) {
                    this.#vm.cutVoice(data.note)
                } else {
                    this.#vm.clear()
                }
                break
            }
            default:
                break
        }
    }
}

// i ran out of time so i couldn't make any more synths..

/// sequence builder
const seq = (...commands) => {
    const result = []

    let tick = 0
    let last_on = 0
    let last_dur = 0
    let last_command

    for (const [command, ...data] of commands) {
        last_command = command ?? last_command
        switch (last_command) {
            case "#on":
            {
                let [dur, note] = data
                last_on = note ?? last_on
                last_dur = dur ?? last_dur
                for (const note_ of distribute(note)) {
                    result.push([tick, "note_on", { note: note_ }])
                }
                tick += last_dur
                break
            }
            case "#off":
            {
                let [dur, note] = data
                note ??= last_on
                last_dur = dur ?? last_dur
                for (const note_ of distribute(note)) {
                    result.push([tick, "note_off", { note: note_ }])
                }
                tick += last_dur
                break
            }
            case "#off_":
            {
                result.push([tick, "note_off", { }])
                break
            }
            case "#rest":
            {
                last_dur = data[0]
                tick += last_dur
                break
            }
            default:
            {
                result.push([tick, last_command, ...data])
            }
        }
    }

    result.push([tick, "!end"])
    return result

    function* distribute(array_or_scalar) {
        if (Array.isArray(array_or_scalar)) {
            for (const element of array_or_scalar) {
                yield element
            }
        } else {
            yield array_or_scalar
        }
    }
}
const on = (dur, note) => ["#on", dur, note]
const off = (dur, note) => ["#off", dur, note]
const off_ = () => ["#off_"]
const rest = (dur) => ["#rest", dur]
const tempo = (tempo) => ["!tempo", {tempo}]
const div = (div) => ["!div", {div}]
const rep = (n, ...commands) => [].concat(...Array.from({ length: n }, () => commands))

/// sequence player
const seq_player = class {
    #tick = 0
    #last_event = 0
    #tempo = 120
    #loop
    #div = 1

    constructor(seq) {
        this.seq = seq
    }

    proc(...units) {
        const seq = this.seq
        if (this.#last_event >= seq.length) return
        let t = this.#tick
        outer: while (true) {
            const event = seq[this.#last_event]
            if (event === undefined) break
            const [next_tick, event_type, data] = event
            if (t < next_tick) break
            switch (event_type) {
                case "!end":
                {
                    if (this.#loop !== undefined) {
                        this.#last_event = this.#loop
                        t = this.#tick = seq[this.#loop][0]
                        continue outer
                    }
                    break
                }
                case "!tempo":
                {
                    this.#tempo = data.tempo
                    break
                }
                case "!loop":
                {
                    this.#loop = this.#last_event
                    break
                }
                case "!div":
                {
                    this.#div = data.div
                    break
                }
                default:
                {
                    for (const unit of units) {
                        if (typeof unit?.event === "function") unit.event(event_type, data)
                    }
                    break
                }
            }
            this.#last_event++
        }
        this.#tick = t + dt * this.#div * this.#tempo / 60 * (OVERSAMPLING ? 2 : 1)
    }
}

/// mixer
const mixer = class {
    #downsampler = new filt_downsample_s
    chains = []
    #buf1 = [0, 0]
    #buf2 = [0, 0]
    #tmp = [0, 0]

    constructor(...chains) {
        this.chains = chains
    }

    proc(out) {
        const tmp = this.#tmp
        if (OVERSAMPLING)
        {
            for (const buf of [this.#buf1, this.#buf2]) {
                inner(buf, this.chains)
            }
            this.#downsampler.proc(this.#buf1, this.#buf2, out)
        }
        else
        {
            inner(out, this.chains)
        }

        function inner(buf, chains) {
            buf[0] = 0
            buf[1] = 0
            for (const { generator, level = 1, pan = 0, fx: fxs } of chains) {
                tmp[0] = 0
                tmp[1] = 0
                generator.proc(tmp)
                const pan_factor = PI*0.25*(pan + 1), pan_l = cos(pan_factor), pan_r = sin(pan_factor)
                tmp[0] *= level*pan_l
                tmp[1] *= level*pan_r
                if (fxs !== undefined) for (const fx of fxs) {
                    fx.proc(tmp[0], tmp[1], tmp)
                }
                buf[0] += tmp[0]
                buf[1] += tmp[1]
            }
        }
    }
}

//////////////////// SETUP ////////////////////
const bell_patch = {
    op2: {
        level: 0.01,
        mult: 7,
        env: {
            d: 0.711,
            s: 0.005,
            r: 100
        }
    },
    op3: {
        level: 0.41,
        feedback: 0.0126,
        mult: 3,
        env: {
            a: 0,
            d: 0.316,
            s: 0.015,
            r: 100
        }
    },
    op4: {
        level: 0.45,
        feedback: 0.02,
        mult: 1,
        env: {
            a: 0.01,
            d: 4,
            s: 0.025,
            r: 0.075,
        }
    }
}
const bell_synth = new synth_fm4({ scale: scale_12edo_on(-5.2), patch: bell_patch })
const bell_delay = new delay_wawa

const bass_patch = {
    op3: {
        level: 0.5,
        feedback: 0.25,
        mult: 2,
        env: {
            a: 0,
            d: 0.1,
            s: 0.1,
            r: 0,
        }
    },
    op4: {
        env: {
            a: 0.001,
            d: 1.7,
            s: 0.15,
            r: .5
        }
    }
}
const bass_synth = new synth_fm4({ polyphony: 1, scale: scale_12edo_on(-5.2), base_freq: 110, patch: bass_patch })

const lead_patch = {
    op3: {
        level: 0.1,
        waveform: 4,
        freq: 5.5,
        env: {
            a: 0.25,
            r: 100
        }
    },
    op4: {
        waveform: 4,
        env: {
            a: 0.01,
            d: 5,
            s: 0.01,
            r: 0.01
        }
    }
}
const lead_synth = new synth_fm4({ polyphony: 8, scale: scale_12edo_on(-5.2), patch: lead_patch })
const lead_delay = new delay_wawa

const lead2_patch = {
    op3: {
        level: 0.12,
        waveform: 4,
        freq: 5.75,
        env: {
            a: 0.125,
            r: 100
        }
    },
    op4: {
        waveform: 2,
        env: {
            a: 0.5,
            d: 5,
            s: 0.01,
            r: 1
        }
    }
}
const lead2_synth = new synth_fm4({ polyphony: 4, scale: scale_12edo_on(-5.212), patch: lead2_patch })

const bell_sequence = new seq_player(seq(
    tempo(114),
    div(4),
    ...rep(2, on(3, [0,3,7,10]),
    on(1, [0,3,7,10]),
    off(1),
    on(1, -2),
    on(2, [2,3,7]),
    on(1, [-2,2,3,7]),
    off(1),
    on(3, [-4,-2,0,3,7]),
    on(1, [-4,-2,0,3,7]),
    off(1),
    on(1, -4),
    on(3, [-2,0,3,7]),
    off(1, [-4,-2,0,3,7])),
    //
    on(3, [0,3,7,10]),
    on(1, [0,3,7,10]),
    off(1),
    on(1, -2),
    on(2, [2,3,7]),
    on(1, [-2,2,3,7]),
    off(1),
    on(3, [-4,-2,0,3,7]),
    on(1, [-4,-2,0,3,7]),
    off(1),
    on(1, -7),
    on(3, [-2,0,3,7]),
    off(1, [-7,-2,0,3,7]),
    on(3, [0,3,7,10]),
    on(1, [0,3,7,10]),
    off(1),
    on(1, -2),
    on(2, [2,3,7]),
    on(1, [-2,2,3,7]),
    off(1),
    on(3, [-4,-2,0,3,7]),
    on(1, [-4,-2,0,3,7]),
    off(1),
    on(1, -4),
    on(3, [2,5,7,10]),
    off(1, [-4,2,5,7,10]),
    on(3, [0,3,7,10]),
    on(1, [0,3,7,10]),
    off(1),
    on(1, -2),
    on(2, [2,3,7]),
    on(1, [-2,2,3,7]),
    off(1),
    on(3, [-4,-2,0,3,7]),
    on(1, [-4,-2,0,3,7]),
    off(1),
    on(1, -4),
    on(3, [-2,0,3,7]),
    off(1, [-4,-2,0,3,7]),
    on(3, [-5,2,5,10]),
    on(1, [-5,2,5,10]),
    off(1),
    on(1, -5),
    on(2, [2,5,10]),
    on(1, [-5,2,5,10]),
    off(1),
    on(3, [-12,-5,-2,2,3]),
    on(1, [-12,-5,-2,2,3]),
    off(2),
    on(3, [-12,-5,-2,2,3]),
    off(1),
    //
    on(3, [0,3,7,10]),
    on(1, [0,3,7,10]),
    off(1),
    on(1, -2),
    on(2, [2,3,7]),
    on(1, [-2,2,3,7]),
    off(1),
    on(3, [-4,-2,0,3,7]),
    on(1, [-4,-2,0,3,7]),
    off(1),
    on(1, -7),
    on(3, [-2,0,3,7]),
    off(1, [-7,-2,0,3,7]),
    on(3, [0,3,7,10]),
    on(1, [0,3,7,10]),
    off(1),
    on(1, -2),
    on(2, [2,3,7]),
    on(1, [-2,2,3,7]),
    off(1),
    on(3, [-4,-2,0,3,7]),
    on(1, [-4,-2,0,3,7]),
    off(1),
    on(1, -4),
    on(3, [2,5,7,10]),
    off(1, [-4,2,5,7,10]),
    on(3, [0,3,7,10]),
    on(1, [0,3,7,10]),
    off(1),
    on(1, -2),
    on(2, [2,3,7]),
    on(1, [-2,2,3,7]),
    off(1),
    on(3, [-4,-2,0,3,7]),
    on(1, [-4,-2,0,3,7]),
    off(1),
    on(1, -4),
    on(3, [-2,0,3,7]),
    off(1, [-4,-2,0,3,7]),
    on(3, [-5,2,5,10]),
    on(1, [-5,2,5,10]),
    off(1),
    on(1, -5),
    on(2, [2,5,10]),
    on(1, [-5,2,5,10]),
    off(1),
    on(2, [0,3,7,10,15]),
    on(1, [0,3,7,10,15]),
    off(2),
    on(3, [-12,-5,-2,2,3]),
    off(3),
    //
    on(3,[-4,3,7,12,15]),
    on(1,[-4,3,7,12,15]),off(1),
    on(1,-4),on(1,[3,7,12,15]),off(1,[-4,3,7,12,15]),
    on(1,-4),on(1,[3,7,12,15]),off(1,[-4,3,7,12,15]),
    on(1,-4),on(1,[3,7,12,15]),on(1,[-4,3,7,12,15]),off(2),
    on(3,[-5,0,3,10,14]),
    on(1,[-5,0,3,10,14]),
    off(1),
    on(1,-5),
    on(1,[0,3,10,14]),off(1),off(0,-5),
    on(1,0),on(1,[10,14,15,19]),off(1),off_(),on(1,[10,14,15,19]),off(1),off_(),on(1,[-2,3,7,14]),off_(),
    //
    on(1,-4),
    on(2,[3,7,12,15]),off_(),
    on(1,[-4,3,7,12,15]),off(1),
    on(1,-4),on(1,[3,7,12,15]),off(1,[-4,3,7,12,15]),
    on(1,-4),on(1,[3,7,12,15]),off(1,[-4,3,7,12,15]),
    on(1,-4),on(1,[3,7,12,15]),on(1,[-4,3,7,12,15]),off(2),
    on(3,[-5,0,3,10,14]),
    on(1,[-5,0,3,10,14]),
    off(1),
    on(1,-5),
    on(1,[0,3,10,14]),off(1),off(0,-5),
    on(1,0),on(1,[7,10,14,17]),off(1),off_(),on(1,[10,14,15,19]),off(1),off_(),on(1,[-2,3,7,14]),off_(),
    //
    on(3,[-4,3,7,12,15]),
    on(1,[-4,3,7,12,15]),off(1),
    on(1,-4),on(1,[3,7,12,15]),off(1,[-4,3,7,12,15]),
    on(1,-4),on(1,[3,7,12,15]),off(1,[-4,3,7,12,15]),
    on(1,-4),on(1,[3,7,12,15]),on(1,[-4,3,7,12,15]),off(2),
    on(3,[-2,2,5,7,14]),
    off_(),
    on(1,[-2,2,3,7,14]),
    off(1),
    on(1,-2),
    on(1,[2,3,7,14]),off(1),off(0,0),
    on(1,0),on(1,[7,10,14,15]),off(1),off_(),on(1,[7,10,14,15]),off(1),off_(),on(1,[7,10,14,15]),off_(),
    //
    on(1,-7),on(2,[3,7,12,15]),off_(),
    on(1,[-7,3,7,12,15]),off(1),
    on(1,-7),on(1,[3,7,12,15]),off(1,[-7,3,7,12,15]),
    on(1,-7),on(1,[3,7,12,15]),off(1,[-7,3,7,12,15]),
    on(1,-7),on(1,[3,7,12,15]),
    on(1,[-7,3,7,12,15]),off(2),
    on(3,[-5,2,5,7,10]),
    on(1,[-5,2,3,7,10]),off(1,[-5,2,3,5,7,10]),
    on(1,-5),on(1,[2,3,7,10]),off(1,[-5,2,3,7,10]),on(1,-5),on(1,[2,3,7,10]),off(1,[-5,2,3,7,10]),
    on(2,[-2,0,3,7]),off_(),on(1,[-5,-2,2,5]),off(1),on(1,[-5,-2,0,3]),
    //
    on(1,-16),
    on(1,-2),
    on(1,0),
    on(1,3),
    on(32,7),
    off_()
).map((val) => {
    if (val[1] === "note_on") {
        val[2].func = (voice) => {
            voice.pan = Math.random() - 0.5
            voice.env3.a = Math.random() * 0.1
            voice.op3.level *= 0.5*(Math.random() + 1)
        }
    }
    return val
}))
const bass_sequence = new seq_player(seq(
    tempo(114), div(4), 
    rest(40),
    on(3, 0),on(1, 0),off(4),
    on(2, -5),on(3, -4),on(1, -4),off(2),
    on(2, -7),on(1, -7),off(1),on(3, 0),on(1, 0),off(4),
    on(1, 0),on(1, 3),on(3, 5),on(1, 5),off(2),
    on(2, 7),on(1, 7),off(1),
    on(3, 0),on(1, 0),off(4),
    on(2, -5),on(3, -4),on(1, -4),off(2),
    on(2, -7),on(1, -7),off(1),
    on(3, -5),on(1, -5),off(4),
    on(1, -5),on(1, 2),on(3, 0),on(1, 0),off(1),
    on(1, -2),on(2, 0),on(1, 0),off(1),
    //
    on(3, 0),on(1, 0),off(4),
    on(2, -5),on(3, -4),on(1, -4),off(2),
    on(2, -7),on(1, -7),off(1),
    on(3, 0),on(1, 0),off(4),
    on(1, 0),on(1, 3),on(3, 5),on(1, 5),off(2),
    on(2, 7),on(1, 7),off(1),
    on(3, 0),on(1, 0),off(4),
    on(2, -5),on(3, -4),on(1, -4),off(2),
    on(2, -7),on(1, -7),off(1),
    on(3, -5),on(1, -5),off(4),
    on(1, -5),on(1, 2),on(2, 0),on(1, 0),off(1),
    on(1, -2),on(2, 0),on(1, 0),off(1),
    on(1,5),on(1,7),
    //
    div(8),
    on(2, 8),on(2, -4),off(2),
    on(2, -4),off(4),
    on(2, -4),on(2, 8),on(2, 10),on(2, 15),on(1, 12),on(1, 8),on(2, 7),on(2, 8),on(2, 10),on(2, -2),on(2, -1),on(4, 0),on(2, 12),on(2, 0),off(2),
    on(2, 0),off(2),
    on(2, -2),on(2, 0),off(2),
    on(2, 3),on(2, 2),on(2, -2),on(2, 0),
    //
    on(2, -4),on(2, 8),off(2),
    on(2, 8),off(2),
    on(2, -4),on(2, -4),off(2),
    on(2, 8),on(2, 3),on(1, -4),on(1, 0),on(2, 3),on(2, 8),on(2, 10),on(2, -2),on(2, -1),on(4, 0),on(2, 12),on(2, 0),off(2),
    on(2, 0),off(2),
    on(2, -2),on(2, 0),off(2),
    on(2, 3),on(2, 2),on(2, -2),on(2, 0),
    //
    on(2, 8),on(2, -4),off(2),
    on(2, -4),off(4),
    on(2, -4),on(2, 8),on(2, 10),on(2, 15),on(1, 12),on(1, 8),on(2, 7),on(2, 8),on(2, 10),on(2, -2),on(2, -1),on(4, 0),on(2, 12),on(2, 0),off(2),
    on(2, 0),off(2),
    on(2, -2),on(2, 0),off(2),
    on(2, 3),on(2, 2),on(2, -2),on(2, 0),
    //
    on(2, -4),on(2, 8),off(2),
    on(2, 8),off(2),
    on(2, -4),on(2, -4),off(2),
    on(2, 8),on(2, 3),on(1, -4),on(1, 0),on(2, 3),on(2, 8),on(2, 10),on(2, -2),on(2, -1),on(4, 0),on(2, 12),on(2, 0),off(2),
    on(2, 0),off(2),
    on(2, 12),on(2, 0),off(2),
    on(2, -2),on(2, 0),off(2),
    on(2, -5),on(2, -2),on(2, 0),on(32, -4),off_()
))
const lead_sequence = new seq_player(seq(
    tempo(114), div(8),
    rest(240),
    on(24, 0),
    off(2),
    on(4, 2),off_(),
    on(2, -2),off_(),
    on(4, -5),off_(),
    on(4, 0),off_(),
    on(8, 5),off_(),
    on(4, 7),off_(),
    on(8, 10),off_(),
    on(10, 7),off_(),
    on(2, 2),off_(),
    on(4, 3),off_(),
    on(4, 5),off_(),
    on(6, 10),off_(),
    on(6, 8),off_(),
    on(8, 7),off_(),
    on(1,7),off_(),
    on(1,8),off_(),
    on(6,7),off_(),
    on(4,3),off_(),
    on(6,5),off_(),
    on(2,7),off_(),
    on(8,2),off_(),
    on(1,12),off_(),
    on(3,14),off_(),
    on(6,10),off_(),
    on(2,12),off_(),
    on(6,12),off_(),
    on(1,7),off(1),
    on(1,17),off_(),
    on(3,19),
    off(2),
    on(4,17),
    off(2),
    on(2,15),off_(),
    ///
    on(8,[15,19]),off_(),
    on(4,[14,17]),off_(),
    on(8,[17,22]),off_(),
    on(8,[15,19]),off_(),
    on(8,[14,17]),off_(),
    on(4,[15,19]),off_(),
    on(4,[10,14]),off_(),
    on(8,[14,17]),off_(),
    on(8,[15,19]),off_(),
    //
    on(8,[15,19]),off_(),
    on(4,[14,17]),off_(),
    on(8,[17,22]),off_(),
    on(8,[19,24]),off_(),
    on(10,[15,19]),off_(),
    on(2,[22,27]),off_(),
    on(2,[19,26]),off_(),
    on(2,[15,22]),off_(),
    on(4,[14,17]),off_(),
    on(4,[19,24]),off_(),
    on(8,[17,22]),off_(),
    //
    on(8, [15,19]),off_(),
    on(4, [14,17]),off_(),
    on(8, [17,22]),off_(),
    on(8,[15,19]),off_(),
    on(8,[14,17]),off_(),
    on(4,[12,15]),off_(),
    on(4,[10,14]),off_(),
    on(8,[7,10]),off_(),
    on(8,[5,10]),off_(),
    //
    on(32,[3,10]),off(0,3),
    on(32,2),off_()
))
const lead2_sequence = new seq_player(seq(
    tempo(114), div(8),
    rest(402),
    ///
    on(8,19),off_(),
    on(4,17),off_(),
    on(8,22),off_(),
    on(8,19),off_(),
    on(8,17),off_(),
    on(4,19),off_(),
    on(4,14),off_(),
    on(8,17),off_(),
    on(8,19),off_(),
    //
    on(8,19),off_(),
    on(4,17),off_(),
    on(8,22),off_(),
    on(8,24),off_(),
    on(10,19),off_(),
    on(2,27),off_(),
    on(2,26),off_(),
    on(2,22),off_(),
    on(4,17),off_(),
    on(4,24),off_(),
    on(8,22),off_(),
    //
    on(8,19),off_(),
    on(4,17),off_(),
    on(8,22),off_(),
    on(8,19),off_(),
    on(8,17),off_(),
    on(4,15),off_(),
    on(4,14),off_(),
    on(8,10),off_(),
    on(8,10),off_(),
    //
    on(32,10),on(32,7),off_()
))

// mixing hack
const _level = 1.75
const mixer_ = new mixer(
    { generator: bell_synth, fx: [bell_delay], level: 0.55*_level, pan: -0.125 },
    { generator: bass_synth, level: 0.65*_level },
    { generator: lead_synth, fx: [lead_delay], level: 0.75*_level, pan: 0.125 },
    { generator: lead2_synth, level: 0.10*_level, pan: -0.52 }
)
const sequences = [
    bell_sequence,
    bass_sequence,
    lead_sequence,
    lead2_sequence
]

let t = 0
const out = [0, 0]
return () => {
    for (let i = 0; i < sequences.length; i++) {
        if (mixer_.chains[i].generator !== undefined) sequences[i].proc(mixer_.chains[i].generator)
    }
    out[0] = 0
    out[1] = 0
    mixer_.proc(out)

    t++
    return out
}

})()),_()
