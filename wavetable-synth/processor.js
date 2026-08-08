class WavetableSynthProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // 8-Voice Polyphony Array
    this.voices = Array(8).fill(0).map(() => ({
      freq: 0.0,
      phase: 0.0,
      phaseIncrement: 0.0,
      envValue: 0.0,
      envState: 'IDLE' // IDLE, ATTACK, DECAY, RELEASE
    }));
    
    // Default wavetable: a simple sine wave (2048 samples)
    this.wavetable = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) {
      this.wavetable[i] = Math.sin((i / 2048) * Math.PI * 2);
    }
    
    // We will initialize rates in the process block since sampleRate is available globally in the worklet
    this.attackRate = 0.0;
    this.decayRate = 0.0;
    this.releaseRate = 0.0;
    this.sustainLevel = 0.0; // Pure pluck default
    
    this.lpfState = 0.0;
    this.lpfAlpha = 0.0;
    
    this.noiseLevel = 0.0;
    this.masterGain = 1.0;

    // Pre-calculate noise table to avoid Math.random() in audio thread
    this.noiseTable = new Float32Array(8192);
    for (let i = 0; i < 8192; i++) {
        this.noiseTable[i] = Math.random() * 2.0 - 1.0;
    }
    this.noiseIdx = 0;

    // Listen for messages from the main UI thread
    this.port.onmessage = (event) => {
      const { type, payload } = event.data;

      if (type === 'SET_WAVETABLE') {
        if (payload && payload.length > 0) {
          if (this.wavetable.length !== payload.length) {
              this.wavetable = new Float32Array(payload.length);
          }
          this.wavetable.set(payload);
        }
      } else if (type === 'SET_ENVELOPE') {
          // payload: { a: ms, d: ms, s: 0-1, r: ms }
          const { a, d, s, r } = payload;
          // Prevent divide by zero if 0ms is sent
          const attackSec = Math.max(0.001, a / 1000);
          const decaySec = Math.max(0.001, d / 1000);
          const releaseSec = Math.max(0.001, r / 1000);
          
          this.attackRate = 1.0 / (attackSec * sampleRate);
          this.decayRate = 1.0 / (decaySec * sampleRate);
          this.sustainLevel = s;
          this.releaseRate = 1.0 / (releaseSec * sampleRate);
      } else if (type === 'NOTE_ON') {
        // payload is an array of frequencies in Hz
        const freqs = Array.isArray(payload) ? payload : [payload];
        let fIndex = 0;
        
        // 1. Try to find perfectly IDLE voices first
        for (let i = 0; i < 8 && fIndex < freqs.length; i++) {
           if (this.voices[i].envState === 'IDLE') {
               this.voices[i].freq = freqs[fIndex];
               this.voices[i].phaseIncrement = freqs[fIndex] / sampleRate;
               this.voices[i].envState = 'ATTACK';
               this.voices[i].envValue = 0.0; // Ensure envelope starts from absolute silence
               this.voices[i].phase = 0.0;
               fIndex++;
           }
        }
        
        // 2. If we still need voices, steal RELEASE voices (meaning we ran out of polyphony)
        for (let i = 0; i < 8 && fIndex < freqs.length; i++) {
           if (this.voices[i].envState === 'RELEASE') {
               this.voices[i].freq = freqs[fIndex];
               this.voices[i].phaseIncrement = freqs[fIndex] / sampleRate;
               this.voices[i].envState = 'ATTACK';
               this.voices[i].envValue = 0.0; // Hard reset to force the slow attack
               this.voices[i].phase = 0.0;
               fIndex++;
           }
        }
        
        // 3. If we still have frequencies and ran out of IDLE/RELEASE voices, steal active voices
        let stealIndex = 0;
        while (fIndex < freqs.length) {
            this.voices[stealIndex].freq = freqs[fIndex];
            this.voices[stealIndex].phaseIncrement = freqs[fIndex] / sampleRate;
            this.voices[stealIndex].envState = 'ATTACK';
            this.voices[stealIndex].envValue = 0.0;
            this.voices[stealIndex].phase = 0.0;
            fIndex++;
            stealIndex = (stealIndex + 1) % 8;
        }
      } else if (type === 'NOTE_OFF') {
        // Simple NOTE_OFF releases all active voices for block chords / arp
        for (let v of this.voices) {
            if (v.envState !== 'IDLE') v.envState = 'RELEASE';
        }
      } else if (type === 'SET_NOISE') {
        this.noiseLevel = payload;
      } else if (type === 'SET_GAIN') {
        this.masterGain = payload;
      }
    };
  }

  process(inputs, outputs, parameters) {
    // Initialize rates if not set yet (sampleRate is global)
    if (this.lpfAlpha === 0.0) {
        this.lpfAlpha = (2.0 * Math.PI * 13000) / sampleRate; // 13kHz cutoff
        if (this.lpfAlpha > 1.0) this.lpfAlpha = 1.0;
    }
    
    if (this.attackRate === 0.0) {
        this.attackRate = 1.0 / (0.01 * sampleRate); // 10ms attack
        this.decayRate = 1.0 / (0.2 * sampleRate);   // 200ms decay
        this.releaseRate = 1.0 / (0.1 * sampleRate); // 100ms release
    }
    
    const output = outputs[0];
    const channelData = output[0]; // Mono processing first
    const tableLen = this.wavetable.length;

    if (tableLen === 0) return true;

    for (let i = 0; i < channelData.length; i++) {
      let mix = 0.0;
      
      // Sum all 8 voices
      for (let v of this.voices) {
          if (v.envState === 'IDLE' && v.envValue <= 0.001) {
              v.envValue = 0.0;
              continue; // Skip processing dead voices
          }
          
          // Process ADSR Envelope
          if (v.envState === 'ATTACK') {
              v.envValue += this.attackRate;
              if (v.envValue >= 1.0) {
                  v.envValue = 1.0;
                  v.envState = 'DECAY';
              }
          } else if (v.envState === 'DECAY') {
              v.envValue -= this.decayRate;
              if (v.envValue <= this.sustainLevel) {
                  v.envValue = this.sustainLevel;
              }
          } else if (v.envState === 'RELEASE') {
              v.envValue -= this.releaseRate;
              if (v.envValue <= 0.0) {
                  v.envValue = 0.0;
                  v.envState = 'IDLE';
              }
          }
          
          // Read Wavetable
          const exactIndex = v.phase * tableLen;
          const indexInt = exactIndex | 0;
          const fraction = exactIndex - indexInt;
          
          const nextIndex = (indexInt + 1) % tableLen;
          const val1 = this.wavetable[indexInt];
          const val2 = this.wavetable[nextIndex];
          
          let sample = val1 + fraction * (val2 - val1);
          sample *= v.envValue;
          
          // Add to mix
          // Base 0.125 guarantees no clipping for 8 voices.
          // Master Gain brings it up for modes that use fewer voices.
          mix += sample * 0.125 * this.masterGain;
          
          // Advance phase
          v.phase += v.phaseIncrement;
          if (v.phase >= 1.0) v.phase -= 1.0;
      }
      
      // Prevent LPF ringing if mix is completely dead
      if (mix === 0.0 && this.lpfState < 0.001 && this.lpfState > -0.001) {
          this.lpfState = 0.0;
      }

      // Apply One-Pole Lowpass Filter
      this.lpfState += this.lpfAlpha * (mix - this.lpfState);
      
      // Output directly to mono buffer (Pure linear audio, no distortion)
      channelData[i] = this.lpfState;
    }

    // Copy the mono channel to all other channels in this output (e.g., stereo Right)
    // and apply stereo uncorrelated noise shaped by an aggregate envelope estimation
    // (We'll use a rough max envelope to shape the noise tail nicely)
    
    let maxEnv = 0;
    for (let v of this.voices) if (v.envValue > maxEnv) maxEnv = v.envValue;

    for (let c = 0; c < output.length; c++) {
      const outChannel = output[c];
      for (let i = 0; i < outChannel.length; i++) {
        if (c > 0) {
            outChannel[i] = channelData[i];
        }
        
        // Add true stereo white noise
        if (this.noiseLevel > 0) {
            const noiseSample = this.noiseTable[this.noiseIdx] * this.noiseLevel * maxEnv * 0.2;
            outChannel[i] += noiseSample;
            this.noiseIdx = (this.noiseIdx + 1) & 8191; // Fast modulo 8192
        }
      }
    }

    // Return true to keep the processor alive
    return true;
  }
}

// Register the processor
registerProcessor('wavetable-synth-processor', WavetableSynthProcessor);
