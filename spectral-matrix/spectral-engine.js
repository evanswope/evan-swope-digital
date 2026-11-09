/**
 * spectral-engine.js - Web Audio Engine Manager for Combinable Pedals
 */

export class SpectralEngine {
  constructor() {
    this.ctx = null;
    this.workletNode = null;
    this.masterGain = null;
    this.onTelemetry = null;

    this.activeSourceType = 'none';
    this.droneOscillators = [];
    this.droneGain = null;
    this.arpInterval = null;
    this.noiseNode = null;
    this.fileSourceNode = null;
    this.fileAudioBuffer = null;
    this.micStream = null;
    this.micSourceNode = null;
  }

  async init() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx({ sampleRate: 48000 });

    const cacheBuster = '?v=' + Date.now();
    await this.ctx.audioWorklet.addModule('./spectral-processor.js' + cacheBuster);

    this.workletNode = new AudioWorkletNode(this.ctx, 'spectral-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2]
    });

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;

    // Studio Brickwall Limiter (Hardware-accelerated native Web Audio DynamicsCompressor)
    this.limiterNode = this.ctx.createDynamicsCompressor();
    this.limiterNode.threshold.value = -0.5; // Starts limiting at -0.5 dBFS
    this.limiterNode.knee.value = 0.0; // Hard brickwall knee
    this.limiterNode.ratio.value = 20.0; // 20:1 brickwall limiting
    this.limiterNode.attack.value = 0.001; // 1ms instant transient capture
    this.limiterNode.release.value = 0.040; // 40ms fast musical recovery

    this.workletNode.connect(this.masterGain);
    this.masterGain.connect(this.limiterNode);
    this.limiterNode.connect(this.ctx.destination);

    this.workletNode.port.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'TELEMETRY' && this.onTelemetry) {
        this.onTelemetry(payload);
      }
    };

    return this;
  }

  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  setPedal(id, on, params = null) {
    if (this.workletNode) {
      this.workletNode.port.postMessage({
        type: 'SET_PEDAL',
        payload: { id, on, params }
      });
    }
  }

  setMaster(dryWet, bypass = false) {
    if (this.workletNode) {
      this.workletNode.port.postMessage({
        type: 'SET_MASTER',
        payload: { dryWet, bypass }
      });
    }
  }

  setMasterVolume(val) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.03);
    }
  }

  stopAllSources() {
    this.droneOscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch (e) {}
    });
    this.droneOscillators = [];
    if (this.droneGain) {
      this.droneGain.disconnect();
      this.droneGain = null;
    }

    if (this.arpInterval) {
      clearInterval(this.arpInterval);
      this.arpInterval = null;
    }

    if (this.noiseNode) {
      try { this.noiseNode.stop(); this.noiseNode.disconnect(); } catch (e) {}
      this.noiseNode = null;
    }

    if (this.fileSourceNode) {
      try { this.fileSourceNode.stop(); this.fileSourceNode.disconnect(); } catch (e) {}
      this.fileSourceNode = null;
    }

    if (this.micSourceNode) {
      try { this.micSourceNode.disconnect(); } catch (e) {}
      this.micSourceNode = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }

    this.activeSourceType = 'none';
  }

  startDrone(fundamental = 110) {
    this.stopAllSources();
    this.resume();

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.35;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 3800;

    const ratios = [0.5, 1.0, 1.003, 1.5, 2.0, 2.5, 3.0];
    const types = ['sawtooth', 'sawtooth', 'square', 'sawtooth', 'sawtooth', 'triangle', 'sawtooth'];

    ratios.forEach((ratio, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = types[idx % types.length];
      osc.frequency.value = fundamental * ratio;

      const subGain = this.ctx.createGain();
      subGain.gain.value = 1.0 / (idx + 1.2);

      osc.connect(subGain);
      subGain.connect(filter);
      osc.start();
      this.droneOscillators.push(osc);
    });

    filter.connect(this.droneGain);
    this.droneGain.connect(this.workletNode);
    this.activeSourceType = 'drone';
  }

  startArp(baseFreq = 220) {
    this.stopAllSources();
    this.resume();

    const scale = [1, 1.2, 1.333, 1.5, 1.667, 2, 2.4, 3];
    let noteIdx = 0;

    const playNote = () => {
      if (this.activeSourceType !== 'arp') return;
      const freq = baseFreq * scale[noteIdx % scale.length];
      noteIdx++;

      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = (noteIdx % 2 === 0) ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      env.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.35, this.ctx.currentTime + 0.015);
      env.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.38);

      osc.connect(env);
      env.connect(this.workletNode);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    };

    playNote();
    this.arpInterval = setInterval(playNote, 180);
    this.activeSourceType = 'arp';
  }

  startNoise() {
    this.stopAllSources();
    this.resume();

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = 0.5;

    this.noiseNode.connect(noiseGain);
    noiseGain.connect(this.workletNode);
    this.noiseNode.start();
    this.activeSourceType = 'noise';
  }

  async startMicrophone() {
    this.stopAllSources();
    this.resume();

    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      },
      video: false
    });

    this.micSourceNode = this.ctx.createMediaStreamSource(this.micStream);
    this.micSourceNode.connect(this.workletNode);
    this.activeSourceType = 'mic';
  }

  async loadAudioFile(file) {
    this.stopAllSources();
    this.resume();

    const arrayBuffer = await file.arrayBuffer();
    this.fileAudioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    this.playAudioFile();
  }

  async playPresetSample(url, loop = true) {
    this.stopAllSources();
    this.resume();

    if (!this.cachedBuffers) this.cachedBuffers = {};
    if (!this.cachedBuffers[url]) {
      const resp = await fetch(url + '?v=' + Date.now());
      const ab = await resp.arrayBuffer();
      this.cachedBuffers[url] = await this.ctx.decodeAudioData(ab);
    }

    this.fileAudioBuffer = this.cachedBuffers[url];
    this.playAudioFile(loop);
    this.activeSourceType = 'sample';
  }

  playAudioFile(loop = true) {
    if (!this.fileAudioBuffer) return;
    if (this.fileSourceNode) {
      try { this.fileSourceNode.stop(); } catch (e) {}
    }

    this.fileSourceNode = this.ctx.createBufferSource();
    this.fileSourceNode.buffer = this.fileAudioBuffer;
    this.fileSourceNode.loop = loop;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.7;

    this.fileSourceNode.connect(gain);
    gain.connect(this.workletNode);
    this.fileSourceNode.start();
    this.activeSourceType = 'file';
  }
}
