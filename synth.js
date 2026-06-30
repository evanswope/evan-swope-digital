/* --------------------------------------------------------------------------
   SAMPLER & FFT MUTATION ENGINE (synth.js)
   -------------------------------------------------------------------------- */

let audioCtx;
let masterGain;
let isPowerOn = false;
let activeVoices = {}; // Tracks currently playing notes

// Sample Data
let recordedBuffer = null;
let extractedEnvelope = null; // Float32Array of volume contour
let baseFftReal = null;
let baseFftImag = null;
let activePeriodicWave = null; // The mutated wave

// Synth State
const synthState = {
  masterVol: 0.5,
  fx: {
    lfoRate: 5,
    lfoDepth: 0,
    lfoTarget: 'none',
    delayTime: 0.3,
    delayFb: 0.4,
    delayMix: 0,
    filterCutoff: 20000,
    filterRes: 0
  }
};

// Global FX Nodes
let globalFilter, delayNode, delayFeedbackNode, delayMixWet, delayMixDry;
let lfoOsc, lfoGain;
let analyserNode;

// Key mapping (QWERTY)
const keyboardMap = {
  'z': 48, 's': 49, 'x': 50, 'd': 51, 'c': 52, 'v': 53, 'g': 54, 'b': 55, 'h': 56, 'n': 57, 'j': 58, 'm': 59,
  ',': 60, 'l': 61, '.': 62, ';': 63, '/': 64,
  'q': 60, '2': 61, 'w': 62, '3': 63, 'e': 64, 'r': 65, '5': 66, 't': 67, '6': 68, 'y': 69, '7': 70, 'u': 71,
  'i': 72, '9': 73, 'o': 74, '0': 75, 'p': 76
};

// UI Elements
const btnStart = document.getElementById('btn-start-audio');
const overlay = document.getElementById('audio-start-overlay');
const powerLight = document.getElementById('power-indicator');
const keyboardContainer = document.getElementById('keyboard');

// --------------------------------------------------------------------------
// Initialization
// --------------------------------------------------------------------------
btnStart.addEventListener('click', initAudio);

async function initAudio() {
  if (audioCtx) return;
  
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();
  
  masterGain = audioCtx.createGain();
  masterGain.gain.value = synthState.masterVol;
  
  // 1. Master Filter
  globalFilter = audioCtx.createBiquadFilter();
  globalFilter.type = 'lowpass';
  globalFilter.frequency.value = synthState.fx.filterCutoff;
  globalFilter.Q.value = synthState.fx.filterRes;

  // 2. Delay Network
  delayNode = audioCtx.createDelay(2.0);
  delayNode.delayTime.value = synthState.fx.delayTime;
  
  delayFeedbackNode = audioCtx.createGain();
  delayFeedbackNode.gain.value = synthState.fx.delayFb;
  
  delayMixDry = audioCtx.createGain();
  delayMixDry.gain.value = 1.0 - synthState.fx.delayMix;
  
  delayMixWet = audioCtx.createGain();
  delayMixWet.gain.value = synthState.fx.delayMix;

  // 3. Compressor
  const compressor = audioCtx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-20, audioCtx.currentTime);
  compressor.knee.setValueAtTime(0, audioCtx.currentTime);
  compressor.ratio.setValueAtTime(20, audioCtx.currentTime);
  compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
  compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

  // Analyser Node for Oscilloscope
  analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 2048;

  // 4. LFO
  lfoOsc = audioCtx.createOscillator();
  lfoOsc.type = 'sine';
  lfoOsc.frequency.value = synthState.fx.lfoRate;
  lfoGain = audioCtx.createGain();
  lfoGain.gain.value = synthState.fx.lfoDepth;
  lfoOsc.connect(lfoGain);
  lfoOsc.start();

  // ROUTING
  masterGain.connect(globalFilter);
  globalFilter.connect(delayMixDry);
  globalFilter.connect(delayNode);
  delayNode.connect(delayFeedbackNode);
  delayFeedbackNode.connect(delayNode);
  delayNode.connect(delayMixWet);
  delayMixDry.connect(compressor);
  delayMixWet.connect(compressor);
  compressor.connect(analyserNode);
  analyserNode.connect(audioCtx.destination);

  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  isPowerOn = true;
  overlay.classList.add('hidden');
  powerLight.classList.add('is-on');

  requestAnimationFrame(updateMeter);
}

// --------------------------------------------------------------------------
// Sampler / Recording Logic
// --------------------------------------------------------------------------
const btnRecord = document.getElementById('btn-record-sample');
const samplerStatus = document.getElementById('sampler-status');
let mediaRecorder;
let chunks = [];

if (btnRecord) {
  btnRecord.addEventListener('click', async () => {
    if (!audioCtx) await initAudio();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mediaRecorder = new MediaRecorder(stream);
      chunks = [];
      
      mediaRecorder.ondataavailable = e => chunks.push(e.data);
      mediaRecorder.onstop = processRecording;
      
      samplerStatus.style.display = 'block';
      samplerStatus.innerText = "RECORDING...";
      btnRecord.style.background = "#b91c1c";
      
      mediaRecorder.start();
      
      // Stop after 1 second
      setTimeout(() => {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
        samplerStatus.style.display = 'none';
        btnRecord.style.background = "#ef4444";
      }, 1000);
      
    } catch (err) {
      console.error("Mic access denied:", err);
      alert("Microphone access is required to use the sampler.");
    }
  });
}

async function processRecording() {
  const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' }); // WebM is common, AudioContext can decode it
  const arrayBuffer = await blob.arrayBuffer();
  
  audioCtx.decodeAudioData(arrayBuffer, (buffer) => {
    recordedBuffer = buffer;
    
    // Extract Envelope (Amplitude over time)
    extractEnvelope(buffer);
    
    // Extract FFT (Harmonic fingerprint)
    extractFFT(buffer);
    
    // Build initial Wavetable
    activePeriodicWave = audioCtx.createPeriodicWave(baseFftReal, baseFftImag);
    
    // Draw
    drawSampleWaveform(buffer);
    
    // Show Wavetable Dashboard
    document.getElementById('wavetable-dashboard').style.display = 'block';
    
  }, (e) => console.error("Error decoding audio data", e));
}

function extractEnvelope(buffer) {
  const data = buffer.getChannelData(0);
  // We want an envelope array to feed to setValueCurveAtTime. Let's make it 256 points long.
  const points = 256;
  extractedEnvelope = new Float32Array(points);
  
  const step = Math.floor(data.length / points);
  
  // Create a smoothed amplitude curve
  for (let i = 0; i < points; i++) {
    let sum = 0;
    for (let j = 0; j < step; j++) {
      let idx = i * step + j;
      if (idx < data.length) {
        sum += Math.abs(data[idx]);
      }
    }
    let avg = sum / step;
    extractedEnvelope[i] = Math.min(1.0, avg * 5.0); // Boost gain slightly
  }
  
  // Ensure the envelope ends exactly at 0 to avoid clicks
  extractedEnvelope[points - 1] = 0;
  extractedEnvelope[0] = 0; // fade in slightly too
}

function extractFFT(buffer) {
  const data = buffer.getChannelData(0);
  const fftSize = 2048; // A window in the middle of the sample
  const numHarmonics = 64; // Keep to 64 for periodic wave
  
  baseFftReal = new Float32Array(numHarmonics);
  baseFftImag = new Float32Array(numHarmonics);
  
  // Find the peak energy spot in the sample
  let maxEnergy = 0;
  let peakIndex = 0;
  for(let i=0; i < data.length - fftSize; i += 512) {
    let energy = 0;
    for(let j=0; j<fftSize; j++) energy += Math.abs(data[i+j]);
    if(energy > maxEnergy) { maxEnergy = energy; peakIndex = i; }
  }
  
  const windowData = data.slice(peakIndex, peakIndex + fftSize);
  
  // Extremely naive DFT for the first 64 harmonics (since we don't have a fast FFT library imported)
  for (let k = 1; k < numHarmonics; k++) {
    let sumReal = 0;
    let sumImag = 0;
    for (let n = 0; n < fftSize; n++) {
      // Hanning window
      let windowMult = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (fftSize - 1)));
      let val = windowData[n] * windowMult;
      
      let angle = (2 * Math.PI * k * n) / fftSize;
      sumReal += val * Math.cos(angle);
      sumImag -= val * Math.sin(angle);
    }
    baseFftReal[k] = sumReal / fftSize;
    baseFftImag[k] = sumImag / fftSize;
  }
  
  baseFftReal[0] = 0; // DC offset
  baseFftImag[0] = 0;
}

function drawSampleWaveform(buffer) {
  const canvas = document.getElementById('sample-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, w, h);
  
  const data = buffer.getChannelData(0);
  const step = Math.ceil(data.length / w);
  
  ctx.fillStyle = 'rgba(33, 212, 253, 0.4)'; // neon blue wave
  for (let i = 0; i < w; i++) {
    let min = 1.0;
    let max = -1.0;
    for (let j = 0; j < step; j++) {
      let datum = data[(i * step) + j];
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }
    const y1 = (1 + min) * h / 2;
    const y2 = (1 + max) * h / 2;
    ctx.fillRect(i, y1, 1, Math.max(1, y2 - y1));
  }
  
  // Overlay Envelope
  if(extractedEnvelope) {
    ctx.strokeStyle = '#ef4444'; // red envelope line
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < extractedEnvelope.length; i++) {
      const x = (i / extractedEnvelope.length) * w;
      const y = h - (extractedEnvelope[i] * h); // inverted y
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

// --------------------------------------------------------------------------
// FFT Mutations
// --------------------------------------------------------------------------
document.getElementById('btn-mutate-scramble')?.addEventListener('click', () => mutateFFT('scramble'));
document.getElementById('btn-mutate-phase')?.addEventListener('click', () => mutateFFT('phase'));
document.getElementById('btn-mutate-octave')?.addEventListener('click', () => mutateFFT('octave'));

function mutateFFT(type) {
  if (!baseFftReal || !baseFftImag) return;
  
  const numHarmonics = baseFftReal.length;
  const newReal = new Float32Array(numHarmonics);
  const newImag = new Float32Array(numHarmonics);
  
  if (type === 'scramble') {
    // Randomly shuffle magnitudes to different bins
    let mags = [];
    for(let i=1; i<numHarmonics; i++) mags.push({r: baseFftReal[i], i: baseFftImag[i]});
    mags.sort(() => Math.random() - 0.5);
    for(let i=1; i<numHarmonics; i++) {
      newReal[i] = mags[i-1].r;
      newImag[i] = mags[i-1].i;
    }
  } 
  else if (type === 'phase') {
    // Invert phases randomly
    for(let i=1; i<numHarmonics; i++) {
      if(Math.random() > 0.5) {
        newReal[i] = -baseFftReal[i];
        newImag[i] = -baseFftImag[i];
      } else {
        newReal[i] = baseFftReal[i];
        newImag[i] = baseFftImag[i];
      }
    }
  }
  else if (type === 'octave') {
    // Force energy into octaves (bin 1, 2, 4, 8, 16, 32)
    for(let i=1; i<numHarmonics; i++) {
      // is i a power of 2?
      if ((i & (i - 1)) === 0) {
        newReal[i] = baseFftReal[i] * 2.0; // Boost octaves
        newImag[i] = baseFftImag[i] * 2.0;
      } else {
        newReal[i] = 0; // Mute non-octaves
        newImag[i] = 0;
      }
    }
  }
  
  // Save mutations as the new base so they can be stacked
  baseFftReal = newReal;
  baseFftImag = newImag;
  activePeriodicWave = audioCtx.createPeriodicWave(baseFftReal, baseFftImag);
}

// --------------------------------------------------------------------------
// SynthVoice Class
// --------------------------------------------------------------------------
class SynthVoice {
  constructor(freq) {
    this.osc = audioCtx.createOscillator();
    
    // We only play if we have a recorded custom wavetable
    if (activePeriodicWave) {
      this.osc.setPeriodicWave(activePeriodicWave);
    } else {
      this.osc.type = 'sine'; // Fallback beep if they somehow play without recording
    }
    
    this.osc.frequency.value = freq;
    
    // Main Gain Node (controlled by the extracted volume envelope)
    this.gainNode = audioCtx.createGain();
    this.gainNode.gain.value = 0;
    
    // LFO Modulation routing
    this.pitchMod = audioCtx.createGain();
    this.pitchMod.gain.value = 0;
    this.osc.connect(this.pitchMod);
    this.pitchMod.connect(this.gainNode);
    
    // Default straight connection
    this.osc.connect(this.gainNode);

    // Apply Routing based on LFO target
    const target = synthState.fx.lfoTarget;
    if (target === 'pitch') {
      lfoGain.connect(this.osc.detune);
      this.lfoConnectedDetune = true;
    } else if (target === 'volume') {
      lfoGain.connect(this.gainNode.gain);
      this.lfoConnectedGain = true;
    }
    
    // Pan Node for LFO Pan Target
    this.panNode = audioCtx.createStereoPanner();
    if (target === 'pan') {
      lfoGain.connect(this.panNode.pan);
      this.lfoConnectedPan = true;
    }
    
    this.gainNode.connect(this.panNode);
    this.panNode.connect(masterGain);
    
    this.osc.start();
    
    // Apply Envelope
    if (extractedEnvelope && extractedEnvelope.length > 0) {
      // The sample is exactly 1 second long. We scale the curve over 1 second.
      const duration = 1.0; 
      // Need to normalize the curve maximum to 1.0 before applying (or whatever volume)
      this.gainNode.gain.setValueCurveAtTime(extractedEnvelope, audioCtx.currentTime, duration);
      
      // Auto-release the voice after 1 second
      setTimeout(() => {
        this.stop();
      }, duration * 1000);
    } else {
      // Fallback simple ADSR if no sample recorded
      this.gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.1);
      this.gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.0);
      setTimeout(() => this.stop(), 1000);
    }
  }

  stop() {
    try {
      this.osc.stop();
      if (this.lfoConnectedDetune) lfoGain.disconnect(this.osc.detune);
      if (this.lfoConnectedGain) lfoGain.disconnect(this.gainNode.gain);
      if (this.lfoConnectedPan) lfoGain.disconnect(this.panNode.pan);
      this.osc.disconnect();
      this.gainNode.disconnect();
      this.panNode.disconnect();
    } catch (e) {}
  }
}

// --------------------------------------------------------------------------
// Visualizers (FFT and Oscilloscope)
// --------------------------------------------------------------------------
function updateMeter() {
  if (!isPowerOn || !analyserNode) return requestAnimationFrame(updateMeter);
  
  // Oscilloscope
  const oscCanvas = document.getElementById('osc-canvas');
  if (oscCanvas) {
    const oscCtx = oscCanvas.getContext('2d');
    const w = oscCanvas.width;
    const h = oscCanvas.height;
    
    const dataArray = new Float32Array(analyserNode.fftSize);
    analyserNode.getFloatTimeDomainData(dataArray);
    
    oscCtx.fillStyle = '#050510';
    oscCtx.fillRect(0, 0, w, h);
    
    oscCtx.lineWidth = 2;
    oscCtx.strokeStyle = '#39ff14'; // neon-green
    oscCtx.beginPath();
    
    const sliceWidth = w * 1.0 / dataArray.length;
    let x = 0;
    
    for(let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i];
      const y = (v * 0.5 + 0.5) * h;
      if(i === 0) oscCtx.moveTo(x, y);
      else oscCtx.lineTo(x, y);
      x += sliceWidth;
    }
    oscCtx.stroke();
  }

  // Draw Spectral Editor (Static representation of our custom Wavetable)
  const fftCanvas = document.getElementById('fft-canvas');
  if (fftCanvas && baseFftReal && baseFftImag) {
    const fCtx = fftCanvas.getContext('2d');
    const w = fftCanvas.width;
    const h = fftCanvas.height;
    
    fCtx.fillStyle = '#050510';
    fCtx.fillRect(0, 0, w, h);

    const numHarmonics = baseFftReal.length;
    const barWidth = w / numHarmonics;
    
    // Normalize display height
    let maxMag = 0.001;
    for(let i=1; i<numHarmonics; i++) {
      let m = Math.sqrt(baseFftReal[i]*baseFftReal[i] + baseFftImag[i]*baseFftImag[i]);
      if(m > maxMag) maxMag = m;
    }
    
    for(let i=1; i<numHarmonics; i++) {
      let mag = Math.sqrt(baseFftReal[i]*baseFftReal[i] + baseFftImag[i]*baseFftImag[i]);
      let normalized = mag / maxMag;
      
      const barHeight = Math.min(normalized * h, h);
      fCtx.fillStyle = i === 1 ? '#ff7e5f' : '#a855f7'; // neon-orange / neon-purple
      fCtx.fillRect(i * barWidth, h - barHeight, barWidth - 1, barHeight);
    }
  }
  
  requestAnimationFrame(updateMeter);
}

// --------------------------------------------------------------------------
// UI Listeners (FX and Master)
// --------------------------------------------------------------------------
document.getElementById('vol-master').addEventListener('input', (e) => {
  synthState.masterVol = parseFloat(e.target.value);
  if (masterGain) masterGain.gain.value = synthState.masterVol;
});

document.getElementById('lfo-rate').addEventListener('input', (e) => {
  synthState.fx.lfoRate = parseFloat(e.target.value);
  if(lfoOsc) lfoOsc.frequency.value = synthState.fx.lfoRate;
});
document.getElementById('lfo-depth').addEventListener('input', (e) => {
  synthState.fx.lfoDepth = parseFloat(e.target.value);
  if(lfoGain) lfoGain.gain.value = synthState.fx.lfoDepth * 100; // Scaled for detune
});
document.getElementById('lfo-target').addEventListener('change', (e) => {
  synthState.fx.lfoTarget = e.target.value;
  // Disconnect existing LFO routing
  if(lfoGain) {
    lfoGain.disconnect();
    // It reconnects on next note triggered
  }
});
document.getElementById('delay-time').addEventListener('input', (e) => {
  synthState.fx.delayTime = parseFloat(e.target.value);
  if(delayNode) delayNode.delayTime.value = synthState.fx.delayTime;
});
document.getElementById('delay-fb').addEventListener('input', (e) => {
  synthState.fx.delayFb = parseFloat(e.target.value);
  if(delayFeedbackNode) delayFeedbackNode.gain.value = synthState.fx.delayFb;
});
document.getElementById('delay-mix').addEventListener('input', (e) => {
  synthState.fx.delayMix = parseFloat(e.target.value);
  if(delayMixDry) delayMixDry.gain.value = 1.0 - synthState.fx.delayMix;
  if(delayMixWet) delayMixWet.gain.value = synthState.fx.delayMix;
});
document.getElementById('filter-cutoff').addEventListener('input', (e) => {
  synthState.fx.filterCutoff = parseFloat(e.target.value);
  if(globalFilter) globalFilter.frequency.value = synthState.fx.filterCutoff;
});
document.getElementById('filter-res').addEventListener('input', (e) => {
  synthState.fx.filterRes = parseFloat(e.target.value);
  if(globalFilter) globalFilter.Q.value = synthState.fx.filterRes;
});

// --------------------------------------------------------------------------
// MIDI Keyboard
// --------------------------------------------------------------------------
function noteToFreq(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function handleKeydown(e) {
  if (!isPowerOn) return;
  if (e.repeat) return;
  
  // Note: keyup logic is removed because the synth voice self-terminates after 1s (the envelope length).
  // But we still track activeVoices to prevent multi-triggering the same key.
  
  const note = keyboardMap[e.key.toLowerCase()];
  if (note && !activeVoices[note]) {
    const keyEl = document.querySelector(`.key[data-note="${note}"]`);
    if (keyEl) keyEl.classList.add('active');
    
    const freq = noteToFreq(note);
    activeVoices[note] = new SynthVoice(freq);
    
    // Clear the active voice tracker after 1s so it can be re-triggered
    setTimeout(() => {
      delete activeVoices[note];
      if (keyEl) keyEl.classList.remove('active');
    }, 1000);
  }
}

document.addEventListener('keydown', handleKeydown);

// Build Keyboard DOM
if (keyboardContainer) {
  const startNote = 48; // C3
  const endNote = 76; // E5
  
  for(let i = startNote; i <= endNote; i++) {
    const key = document.createElement('div');
    const isBlack = [1, 3, 6, 8, 10].includes(i % 12);
    key.className = `key ${isBlack ? 'black' : 'white'}`;
    key.dataset.note = i;
    
    // Play on click (one-shot 1 second)
    key.addEventListener('mousedown', () => {
      if(!isPowerOn) return;
      const note = parseInt(key.dataset.note);
      if(!activeVoices[note]) {
        key.classList.add('active');
        activeVoices[note] = new SynthVoice(noteToFreq(note));
        
        setTimeout(() => {
          delete activeVoices[note];
          key.classList.remove('active');
        }, 1000);
      }
    });
    
    keyboardContainer.appendChild(key);
  }
}
