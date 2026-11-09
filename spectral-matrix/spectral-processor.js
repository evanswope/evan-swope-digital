/**
 * spectral-processor.js - High-Impact 9-Pedal Combinable Spectral FX Engine
 * 
 * 1. ❄️ FREEZE  - Infinite glowing cathedral drone / time stop
 * 2. 🌈 PRISM   - Frequency-split cascading rainbow delay waterfall
 * 3. ⚡ WARP    - Linear Hertz frequency shifter (Dalek ring-mod)
 * 4. 👻 GHOST   - Polar phase morph (Cold Robot Lock <-> Spirit Whisper Cloud)
 * 5. 🪞 MIRROR  - Full-spectrum inversion (bass becomes screaming highs, highs plunge into sub-bass)
 * 6. 🪐 GRAVITY - Spectral black hole (collapses sound into pure singing laser sines)
 * 7. 💥 SHATTER - 16-band overtone scrambler (gamelan gongs and ringing glass chimes)
 * 8. 💎 CRYSTAL - Dynamic spectral sieve (dancing sine droplets)
 * 9. 🌊 RIPPLE  - Liquid multi-wave sweeping comb phaser
 */

class FastFFT {
  constructor(size) {
    this.size = size;
    this.levels = Math.log2(size);
    this.bitRev = new Uint32Array(size);
    for (let i = 0; i < size; i++) {
      let rev = 0;
      for (let j = 0; j < this.levels; j++) rev = (rev << 1) | ((i >> j) & 1);
      this.bitRev[i] = rev;
    }
    this.cosTable = new Float32Array(size / 2);
    this.sinTable = new Float32Array(size / 2);
    for (let i = 0; i < size / 2; i++) {
      const angle = -2 * Math.PI * i / size;
      this.cosTable[i] = Math.cos(angle);
      this.sinTable[i] = Math.sin(angle);
    }
  }

  transform(real, imag, inverse = false) {
    const n = this.size;
    for (let i = 0; i < n; i++) {
      const j = this.bitRev[i];
      if (j > i) {
        let temp = real[i]; real[i] = real[j]; real[j] = temp;
        temp = imag[i]; imag[i] = imag[j]; imag[j] = temp;
      }
    }
    const sign = inverse ? -1 : 1;
    for (let len = 2; len <= n; len <<= 1) {
      const halfLen = len >> 1;
      const step = n / len;
      for (let i = 0; i < n; i += len) {
        for (let j = 0; j < halfLen; j++) {
          const tableIdx = j * step;
          const cos = this.cosTable[tableIdx];
          const sin = sign * this.sinTable[tableIdx];
          const uR = real[i + j];
          const uI = imag[i + j];
          const vR = real[i + j + halfLen] * cos - imag[i + j + halfLen] * sin;
          const vI = real[i + j + halfLen] * sin + imag[i + j + halfLen] * cos;
          real[i + j] = uR + vR;
          imag[i + j] = uI + vI;
          real[i + j + halfLen] = uR - vR;
          imag[i + j + halfLen] = uI - vI;
        }
      }
    }
    if (inverse) {
      const invN = 1 / n;
      for (let i = 0; i < n; i++) {
        real[i] *= invN;
        imag[i] *= invN;
      }
    }
  }
}

class SpectralProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.fftSize = 2048;
    this.hopSize = 512; // 75% overlap
    this.numBins = this.fftSize / 2; // 1024 bins
    this.binWidth = sampleRate / this.fftSize; // ~23.4375 Hz

    this.fft = new FastFFT(this.fftSize);

    // Symmetric Hann window
    this.window = new Float32Array(this.fftSize);
    for (let i = 0; i < this.fftSize; i++) {
      this.window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / this.fftSize));
    }
    // With 75% overlap and analysis + synthesis windowing, sum of w^2 is 1.5
    this.olaScale = 2.0 / 3.0; // 1 / 1.5

    // STFT Sample Buffers (FIFO architecture)
    this.inBuf = new Float32Array(this.fftSize);
    this.outBuf = new Float32Array(this.fftSize);
    this.dryBuf = new Float32Array(this.fftSize); // Delay line to phase-align dry with wet
    this.hopCounter = 0;

    // Scratch buffers
    this.real = new Float32Array(this.fftSize);
    this.imag = new Float32Array(this.fftSize);
    this.mag = new Float32Array(this.numBins);
    this.phase = new Float32Array(this.numBins);
    this.modMag = new Float32Array(this.numBins);
    this.modPhase = new Float32Array(this.numBins);
    this.tempMag = new Float32Array(this.numBins);
    this.tempPhase = new Float32Array(this.numBins);

    // Effect-specific internal state
    // 1. Freeze
    this.frozenMag = new Float32Array(this.numBins);
    this.frozenPhase = new Float32Array(this.numBins);
    this.frozenPeak = 0.0;
    this.wasFreezeActive = false;

    // 2. Warp
    this.warpPhase = new Float32Array(this.numBins);

    // 3. Prism: complex multi-frame ring buffer (64 frames = ~680ms)
    this.delayMaxFrames = 64;
    this.prismReal = new Float32Array(this.delayMaxFrames * this.numBins);
    this.prismImag = new Float32Array(this.delayMaxFrames * this.numBins);
    this.prismWriteHead = 0;

    // 4. Ripple LFO & Escher Staircase
    this.rippleLfoPhase = 0.0;
    this.escherOffset = 0.0;

    // Safety Limiter
    this.limiterActive = false;
    this.limiterActivityTimer = 0;

    // Dynamic peak tracking
    this.peakMag = 0.01;

    // Master controls
    this.dryWet = 1.0;
    this.bypass = false;

    // The 11 FX Pedals
    this.pedals = {
      freeze:  { on: false, blur: 0.6 },
      prism:   { on: false, cascade: 0.75, feedback: 0.65 },
      warp:    { on: false, shiftHz: 120 },
      ghost:   { on: false, morph: 0.8 },
      mirror:  { on: false, pivotHz: 1200 },
      gravity: { on: false, pull: 0.8 },
      shatter: { on: false, chaos: 0.7 },
      crystal: { on: false, threshold: 0.45 },
      ripple:  { on: false, speed: 0.8, depth: 0.85 },
      edge:    { on: false, carve: 0.85, order: 1 },
      escher:  { on: false, speed: 1.2, ceilingHz: 2400 }
    };

    this.framesSinceTelemetry = 0;
    this.telemetryInterval = 3;

    this.port.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'SET_PEDAL') {
        const { id, on, params } = payload;
        if (this.pedals[id]) {
          if (typeof on === 'boolean') this.pedals[id].on = on;
          if (params) Object.assign(this.pedals[id], params);
        }
      } else if (type === 'SET_MASTER') {
        if ('dryWet' in payload) this.dryWet = payload.dryWet;
        if ('bypass' in payload) this.bypass = payload.bypass;
      }
    };
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input[0] || input[0].length === 0) return true;

    const inChannel = input[0];
    const outChannel = output[0];
    const blockSize = inChannel.length;
    const N = this.fftSize;
    const H = this.hopSize;
    const latency = N - H; // 1536 samples algorithmic delay

    for (let i = 0; i < blockSize; i++) {
      const s = inChannel[i];

      // Shift dry delay line for phase-perfect mix
      const dry = this.dryBuf[0];
      this.dryBuf.copyWithin(0, 1, latency);
      this.dryBuf[latency - 1] = s;

      // Feed input FIFO
      this.inBuf[N - H + this.hopCounter] = s;

      // Read wet from output FIFO
      const wet = this.outBuf[this.hopCounter];

      this.hopCounter++;
      if (this.hopCounter >= H) {
        this.hopCounter = 0;
        this.processHopFrame();
      }

      const raw = this.bypass ? s : (dry * (1.0 - this.dryWet) + wet * this.dryWet);

      // Transparent Lookahead Soft-Limiter (Prevents Digital Hard Clipping & Ear Damage)
      let limited = raw;
      const absVal = Math.abs(raw);
      if (absVal > 0.8) {
        const clamped = 0.8 + 0.198 * Math.tanh((absVal - 0.8) / 0.2);
        limited = raw < 0 ? -clamped : clamped;
        this.limiterActive = true;
        this.limiterActivityTimer = 25; // Hold visual flag for ~70ms
      } else if (this.limiterActivityTimer > 0) {
        this.limiterActivityTimer--;
        if (this.limiterActivityTimer === 0) this.limiterActive = false;
      }

      outChannel[i] = limited;
    }

    if (output[1]) output[1].set(outChannel);
    return true;
  }

  processHopFrame() {
    const N = this.fftSize;
    const H = this.hopSize;
    const numBins = this.numBins;

    // Window the input frame
    for (let j = 0; j < N; j++) {
      this.real[j] = this.inBuf[j] * this.window[j];
      this.imag[j] = 0.0;
    }

    // Forward FFT
    this.fft.transform(this.real, this.imag, false);

    // Polar conversion
    let frameMax = 0.0001;
    for (let k = 0; k < numBins; k++) {
      const r = this.real[k];
      const i = this.imag[k];
      const m = Math.hypot(r, i);
      this.mag[k] = m;
      this.phase[k] = Math.atan2(i, r);
      if (m > frameMax) frameMax = m;
    }
    this.peakMag = Math.max(0.001, 0.90 * this.peakMag + 0.10 * frameMax);

    // Copy to working buffers
    for (let k = 0; k < numBins; k++) {
      this.modMag[k] = this.mag[k];
      this.modPhase[k] = this.phase[k];
    }

    // ==========================================
    // THE 9 COMBINABLE SPECTRAL FX PEDALS
    // ==========================================
    if (!this.bypass) {

      // 1. ❄️ FREEZE: Infinite cathedral pad / time stop
      if (this.pedals.freeze.on) {
        // If freeze just became active or previous freeze was silence, capture current frame
        if (!this.wasFreezeActive || this.frozenPeak < 0.003) {
          this.frozenMag.set(this.modMag);
          this.frozenPeak = frameMax;
          this.wasFreezeActive = true;
          for (let k = 0; k < numBins; k++) {
            this.frozenPhase[k] = this.modPhase[k];
          }
        }
        const blur = this.pedals.freeze.blur;
        const phaseStep = (2 * Math.PI * H) / N;
        for (let k = 0; k < numBins; k++) {
          this.modMag[k] = this.frozenMag[k];
          // Advance phase by nominal bin frequency so it sustains smoothly
          this.frozenPhase[k] += k * phaseStep;
          if (this.frozenPhase[k] > Math.PI) this.frozenPhase[k] -= 2 * Math.PI;

          // Blur adds diffuse shimmering chorus
          const jitter = (Math.random() * 2 - 1) * blur * Math.PI;
          this.modPhase[k] = this.frozenPhase[k] + jitter;
        }
      } else {
        this.wasFreezeActive = false;
        this.frozenPeak = 0.0;
      }

      // 2. 🪞 MIRROR: Symmetrical Full-Spectrum Inversion
      if (this.pedals.mirror.on) {
        const pivotBin = Math.max(10, Math.min(350, Math.round(this.pedals.mirror.pivotHz / this.binWidth)));
        const maxK = 400; // Invert up to ~9.4 kHz (music range)
        this.tempMag.set(this.modMag);
        for (let k = 1; k < maxK; k++) {
          let mk = 2 * pivotBin - k;
          if (mk < 1) mk = Math.abs(mk) + 1;
          if (mk >= maxK) mk = 2 * maxK - mk - 1;
          if (mk >= 1 && mk < maxK) {
            this.modMag[k] = this.tempMag[mk];
          }
        }
      }

      // 3. 🪐 GRAVITY: Spectral Singularity / Singing Laser
      if (this.pedals.gravity.on) {
        const pull = this.pedals.gravity.pull;
        // Locate top 3 dominant harmonic peaks
        const peaks = [];
        for (let k = 3; k < 350; k++) {
          if (this.modMag[k] > this.modMag[k - 1] && this.modMag[k] > this.modMag[k + 1] && this.modMag[k] > this.peakMag * 0.15) {
            peaks.push({ bin: k, mag: this.modMag[k] });
          }
        }
        peaks.sort((a, b) => b.mag - a.mag);
        const topPeaks = peaks.slice(0, 4).map(p => p.bin);

        if (topPeaks.length > 0) {
          this.tempMag.set(this.modMag);
          for (let k = 1; k < 400; k++) {
            // Find nearest peak
            let nearest = topPeaks[0];
            let minDist = 9999;
            for (let p = 0; p < topPeaks.length; p++) {
              const d = Math.abs(k - topPeaks[p]);
              if (d < minDist) { minDist = d; nearest = topPeaks[p]; }
            }
            if (k !== nearest && minDist < 30) {
              const siphon = this.tempMag[k] * pull;
              this.modMag[nearest] += siphon * 0.6;
              this.modMag[k] = Math.max(0, this.modMag[k] - siphon);
            }
          }
        }
        // Nonlinear sharpening for crystal laser tone
        if (pull > 0.05) {
          const exponent = 1.0 + pull * 2.2;
          for (let k = 1; k < 400; k++) {
            const norm = this.modMag[k] / (this.peakMag + 0.0001);
            this.modMag[k] = Math.pow(norm, exponent) * this.peakMag * (1.0 + pull * 0.4);
          }
        }
      }

      // 4. 💥 SHATTER: 16-Band Overtone Permutation / Gamelan Dice
      if (this.pedals.shatter.on) {
        const chaos = this.pedals.shatter.chaos;
        this.tempMag.set(this.modMag);
        this.tempPhase.set(this.modPhase);

        // 16 logarithmically spaced frequency bands from 60 Hz to 7500 Hz
        const numBands = 16;
        const bandEdges = [
          3, 6, 10, 16, 24, 34, 48, 66, 90, 122, 164, 218, 280, 340, 400, 480, 560
        ];

        // Permute bands based on chaos
        for (let b = 0; b < numBands; b++) {
          const bStart = bandEdges[b];
          const bEnd = bandEdges[b + 1];
          const bLen = bEnd - bStart;

          // Pseudorandom target band
          const hash = Math.sin(b * 12.9898 + 78.233) * 43758.5453;
          const targetBand = Math.floor(Math.abs(hash) * numBands) % numBands;
          const tStart = bandEdges[targetBand];
          const tEnd = bandEdges[targetBand + 1];
          const tLen = tEnd - tStart;

          for (let j = 0; j < bLen; j++) {
            const srcK = bStart + j;
            const dstFraction = j / bLen;
            const dstK = Math.min(numBins - 1, tStart + Math.floor(dstFraction * tLen));

            // Blend between original and shattered
            this.modMag[dstK] = (1.0 - chaos) * this.modMag[dstK] + chaos * this.tempMag[srcK];
            this.modPhase[dstK] = this.tempPhase[srcK] + (chaos * Math.sin(srcK) * Math.PI);
          }
        }
      }

      // 5. 💎 CRYSTAL: Dynamic Spectral Sieve (Dancing Sine Droplets)
      if (this.pedals.crystal.on) {
        const thresh = this.peakMag * this.pedals.crystal.threshold * 0.75;
        for (let k = 0; k < numBins; k++) {
          if (this.modMag[k] < thresh) {
            const ratio = this.modMag[k] / thresh;
            this.modMag[k] *= (ratio * ratio * ratio);
          } else {
            // Sparkle boost on surviving peaks
            this.modMag[k] *= 1.25;
          }
        }
      }

      // 6. ⚡ WARP: Linear Hertz Shifter (Dalek Ring-Mod)
      if (this.pedals.warp.on) {
        const shiftBins = Math.round(this.pedals.warp.shiftHz / this.binWidth);
        if (shiftBins !== 0) {
          this.tempMag.set(this.modMag);
          this.tempPhase.set(this.modPhase);
          this.modMag.fill(0.0);

          const phaseStep = (2 * Math.PI * H) / N;
          for (let k = 0; k < numBins; k++) {
            const destK = k + shiftBins;
            if (destK >= 1 && destK < numBins) {
              this.modMag[destK] = this.tempMag[k];
              // Accumulate phase at destination frequency to prevent inter-frame cancel
              this.warpPhase[destK] = (this.warpPhase[destK] + destK * phaseStep) % (2 * Math.PI);
              this.modPhase[destK] = this.warpPhase[destK];
            }
          }
        }
      }

      // 7. 🪚 EDGE: Calculus Spectral Derivative Wireframe
      if (this.pedals.edge.on) {
        const carve = this.pedals.edge.carve;
        this.tempMag.set(this.modMag);
        for (let k = 1; k < numBins - 1; k++) {
          const d1 = Math.abs(this.tempMag[k + 1] - this.tempMag[k - 1]) * 1.6;
          const d2 = Math.abs(this.tempMag[k + 1] - 2 * this.tempMag[k] + this.tempMag[k - 1]) * 2.6;
          const edgeVal = this.pedals.edge.order === 2 ? d2 : d1;
          this.modMag[k] = (1.0 - carve) * this.tempMag[k] + carve * edgeVal;
        }
      }

      // 8. 🪜 ESCHER: M.C. Escher Modular Frequency Wrap / Endless Staircase
      if (this.pedals.escher.on) {
        const speed = this.pedals.escher.speed;
        const ceilBin = Math.max(30, Math.min(380, Math.round(this.pedals.escher.ceilingHz / this.binWidth)));
        this.escherOffset = (this.escherOffset + speed * 0.8) % ceilBin;
        const intOffset = Math.floor(this.escherOffset);

        this.tempMag.set(this.modMag);
        this.tempPhase.set(this.modPhase);

        for (let k = 1; k < ceilBin; k++) {
          const srcK = ((k - intOffset) % ceilBin + ceilBin) % ceilBin;
          if (srcK >= 1 && srcK < numBins) {
            const env = 0.5 * (1.0 - Math.cos((2 * Math.PI * k) / ceilBin));
            this.modMag[k] = this.tempMag[srcK] * env * 1.35;
            this.modPhase[k] = this.tempPhase[srcK];
          }
        }
      }

      // 9. 🌈 PRISM: Frequency-Split Cascading Rainbow Delay Waterfall
      if (this.pedals.prism.on) {
        const cascade = this.pedals.prism.cascade;
        const feedback = Math.min(0.85, this.pedals.prism.feedback);
        const baseFrames = 12;

        for (let k = 1; k < 400; k++) {
          // Bass echoes fast, highs echo late (cascading waterfall)
          const binOffset = Math.floor(cascade * 40 * (k / 400));
          const binDelay = Math.max(2, Math.min(this.delayMaxFrames - 1, baseFrames + binOffset));
          const readHead = (this.prismWriteHead - binDelay + this.delayMaxFrames) % this.delayMaxFrames;

          const readIdx = readHead * numBins + k;
          const writeIdx = this.prismWriteHead * numBins + k;

          const dR = this.prismReal[readIdx];
          const dI = this.prismImag[readIdx];

          const inR = this.modMag[k] * Math.cos(this.modPhase[k]);
          const inI = this.modMag[k] * Math.sin(this.modPhase[k]);

          // Accumulate complex feedback
          const sumR = inR + dR * feedback;
          const sumI = inI + dI * feedback;

          this.prismReal[writeIdx] = sumR;
          this.prismImag[writeIdx] = sumI;

          this.modMag[k] = Math.hypot(sumR, sumI);
          this.modPhase[k] = Math.atan2(sumI, sumR);
        }
        this.prismWriteHead = (this.prismWriteHead + 1) % this.delayMaxFrames;
      }

      // 8. 👻 GHOST: Cold Robot Lock <-> Spirit Whisper Cloud
      if (this.pedals.ghost.on) {
        const morph = this.pedals.ghost.morph;
        if (morph < -0.05) {
          // ROBOT LOCK: Quantize phase to 4-quadrant grid + lock phase progression
          const lockStrength = -morph;
          for (let k = 0; k < numBins; k++) {
            const quantized = Math.round(this.modPhase[k] / (Math.PI / 2)) * (Math.PI / 2);
            this.modPhase[k] = (1.0 - lockStrength) * this.modPhase[k] + lockStrength * quantized;
          }
        } else if (morph > 0.05) {
          // WHISPER CLOUD: Phase diffusion (dissolves pitch into breathy spirit formants)
          for (let k = 0; k < numBins; k++) {
            const randAngle = (Math.random() * 2 - 1) * Math.PI;
            this.modPhase[k] = (1.0 - morph) * this.modPhase[k] + morph * randAngle;
          }
        }
      }

      // 9. 🌊 RIPPLE: Liquid Multi-Resonant Phaser
      if (this.pedals.ripple.on) {
        const speed = this.pedals.ripple.speed;
        const depth = this.pedals.ripple.depth;

        this.rippleLfoPhase += (2 * Math.PI * speed * H) / sampleRate;
        if (this.rippleLfoPhase > 2 * Math.PI) this.rippleLfoPhase -= 2 * Math.PI;

        for (let k = 1; k < numBins; k++) {
          // Musical logarithmic comb spacing across octaves
          const logK = Math.log2(k + 1);
          const wave = 0.5 + 0.5 * Math.sin(logK * 7.5 - this.rippleLfoPhase);
          const notch = (1.0 - depth) + depth * (wave * wave);
          this.modMag[k] *= (notch * 1.3);
        }
      }
    }

    // Spectral Energy Runaway Protector (Prevents Positive-Feedback Blowout)
    let inEnergy = 0;
    let modEnergy = 0;
    for (let k = 0; k < numBins; k++) {
      inEnergy += this.mag[k];
      modEnergy += this.modMag[k];
    }
    if (inEnergy > 0.001 && modEnergy > inEnergy * 3.5) {
      const scale = (inEnergy * 3.5) / modEnergy;
      for (let k = 0; k < numBins; k++) {
        this.modMag[k] *= scale;
      }
    }

    // Polar to Cartesian with Hermitian symmetry
    for (let k = 0; k < numBins; k++) {
      const m = this.modMag[k];
      const p = this.modPhase[k];
      this.real[k] = m * Math.cos(p);
      this.imag[k] = m * Math.sin(p);
    }
    this.imag[0] = 0.0;
    this.imag[numBins] = 0.0;
    for (let k = 1; k < numBins; k++) {
      this.real[N - k] = this.real[k];
      this.imag[N - k] = -this.imag[k];
    }

    // Inverse FFT
    this.fft.transform(this.real, this.imag, true);

    // Shift FIFOs
    this.inBuf.copyWithin(0, H, N);
    this.outBuf.copyWithin(0, H, N);
    this.outBuf.fill(0, N - H, N);

    // Overlap-Add into output buffer
    for (let j = 0; j < N; j++) {
      this.outBuf[j] += this.real[j] * this.window[j] * this.olaScale;
    }

    // Telemetry for 3 Visual Lenses
    this.framesSinceTelemetry++;
    if (this.framesSinceTelemetry >= this.telemetryInterval) {
      this.framesSinceTelemetry = 0;
      this.sendTelemetry();
    }
  }

  sendTelemetry() {
    const displayBins = 128;
    const stride = 3; // Focus on the musically active range: 0 to ~9,000 Hz (384 bins)
    const magData = new Float32Array(displayBins);
    const phaseData = new Float32Array(displayBins);

    const normPeak = Math.max(0.005, this.peakMag);
    for (let i = 0; i < displayBins; i++) {
      magData[i] = Math.min(1.5, this.modMag[i * stride] / normPeak);
      phaseData[i] = this.modPhase[i * stride];
    }

    this.port.postMessage({
      type: 'TELEMETRY',
      payload: {
        magnitudes: magData,
        phases: phaseData,
        peak: normPeak,
        lfoPhase: this.rippleLfoPhase,
        limiterActive: this.limiterActive
      }
    });
  }
}

registerProcessor('spectral-processor', SpectralProcessor);
