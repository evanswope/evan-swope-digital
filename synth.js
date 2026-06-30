/* --------------------------------------------------------------------------
   SYNTHESIZER ENGINE (synth.js)
   -------------------------------------------------------------------------- */

let audioCtx;
let masterGain;
let isPowerOn = false;
let activeVoices = {}; // Tracks currently playing notes

// Engine Mode
let engineMode = 'additive'; // 'additive' or 'wavetable'
let customWavetable = null; // Will hold the PeriodicWave

// Synth State
const synthState = {
  masterVol: 0.5,
  ch1: { type: 'sine', vol: 0.5, tuneCoarse: 0, tuneFine: 0 },
  ch2: { type: 'square', vol: 0.2, tuneCoarse: 0, tuneFine: 0 },
  ch3: { type: 'triangle', vol: 0.2, tuneCoarse: 0, tuneFine: 0 },
  ch4: { type: 'noise', vol: 0.0, tuneCoarse: 0, tuneFine: 0 }, // For noise, fine = cutoff
  adsr: {
    attack: 0.1,  // seconds
    decay: 0.2,   // seconds
    sustain: 0.7, // 0.0 to 1.0
    release: 0.3  // seconds
  },
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

// Key mapping (QWERTY home row ish to piano keys)
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

const btnModeAdditive = document.getElementById('btn-mode-additive');
const btnModeWavetable = document.getElementById('btn-mode-wavetable');
const btnFreeze = document.getElementById('btn-freeze-wavetable');
const wavetableStatus = document.getElementById('wavetable-status');

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
  delayNode = audioCtx.createDelay(2.0); // max delay 2s
  delayNode.delayTime.value = synthState.fx.delayTime;
  
  delayFeedbackNode = audioCtx.createGain();
  delayFeedbackNode.gain.value = synthState.fx.delayFb;
  
  delayMixDry = audioCtx.createGain();
  delayMixDry.gain.value = 1.0 - synthState.fx.delayMix;
  
  delayMixWet = audioCtx.createGain();
  delayMixWet.gain.value = synthState.fx.delayMix;

  // 3. Compressor
  const compressor = audioCtx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-20, audioCtx.currentTime); // Tighter threshold for limiting
  compressor.knee.setValueAtTime(0, audioCtx.currentTime); // Hard knee
  compressor.ratio.setValueAtTime(20, audioCtx.currentTime); // High ratio (limiting)
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
  // LFO connections are dynamic based on target selection, handled later

  // ROUTING
  masterGain.connect(globalFilter);
  
  // Split to Dry/Wet
  globalFilter.connect(delayMixDry);
  globalFilter.connect(delayNode);
  
  // Delay Feedback Loop
  delayNode.connect(delayFeedbackNode);
  delayFeedbackNode.connect(delayNode);
  
  // Delay Out
  delayNode.connect(delayMixWet);
  
  // Mix together into Compressor
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
  btnFreeze.disabled = false;

  requestAnimationFrame(updateMeter);
  drawADSR();
}

// --------------------------------------------------------------------------
// ADSR Canvas Logic
// --------------------------------------------------------------------------
const canvas = document.getElementById('adsr-canvas');
const ctx = canvas.getContext('2d');
let draggingNode = null;

// ADSR Graph mapping (Max 2 seconds for ADR, max 1.0 for sustain)
const maxTime = 2.0;

function getAdsrNodes() {
  const w = canvas.width;
  const h = canvas.height;
  const pad = 10;
  const usableW = w - (pad * 2);
  const usableH = h - (pad * 2);

  // X coords based on time relative to maxTime (2s total for A+D+R, assuming sustain is fixed width for drawing)
  // Let's allocate drawing width: A (0-30%), D (30-60%), S (60-80%), R (80-100%)
  const aX = pad + (synthState.adsr.attack / maxTime) * (usableW * 0.3);
  const dX = aX + (synthState.adsr.decay / maxTime) * (usableW * 0.3);
  const sX = dX + (usableW * 0.2); // fixed sustain width in UI
  const rX = sX + (synthState.adsr.release / maxTime) * (usableW * 0.2);

  const aY = pad; // Max height
  const sY = pad + (1.0 - synthState.adsr.sustain) * usableH; // Sustain level

  return [
    { id: 'attack', x: aX, y: aY },
    { id: 'decay', x: dX, y: sY },
    { id: 'release', x: rX, y: usableH + pad }
  ];
}

function drawADSR() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const w = canvas.width;
  const h = canvas.height;
  const pad = 10;
  
  // Grid
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for(let i=1; i<4; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * (h/4));
    ctx.lineTo(w, i * (h/4));
    ctx.stroke();
  }

  const nodes = getAdsrNodes();
  
  // Draw line
  ctx.beginPath();
  ctx.moveTo(pad, h - pad);
  ctx.lineTo(nodes[0].x, nodes[0].y); // Attack
  ctx.lineTo(nodes[1].x, nodes[1].y); // Decay
  ctx.lineTo(nodes[1].x + (w*0.2), nodes[1].y); // Sustain hold
  ctx.lineTo(nodes[2].x, nodes[2].y); // Release
  
  ctx.strokeStyle = '#21d4fd'; // neon-blue
  ctx.lineWidth = 3;
  ctx.stroke();

  // Fill gradient
  ctx.lineTo(pad, h - pad);
  const grad = ctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0, 'rgba(33, 212, 253, 0.4)');
  grad.addColorStop(1, 'rgba(33, 212, 253, 0.0)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Draw points
  nodes.forEach(n => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, 6, 0, Math.PI*2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#21d4fd'; // neon-blue
    ctx.stroke();
  });
}

// ADSR Mouse Interaction
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;
  
  const nodes = getAdsrNodes();
  for (let n of nodes) {
    if (Math.hypot(n.x - mouseX, n.y - mouseY) < 15) {
      draggingNode = n.id;
      break;
    }
  }
});

window.addEventListener('mouseup', () => {
  draggingNode = null;
});

canvas.addEventListener('mousemove', (e) => {
  if (!draggingNode) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  let mouseX = (e.clientX - rect.left) * scaleX;
  let mouseY = (e.clientY - rect.top) * scaleY;
  
  mouseX = Math.max(10, Math.min(mouseX, canvas.width - 10));
  mouseY = Math.max(10, Math.min(mouseY, canvas.height - 10));
  
  const usableW = canvas.width - 20;
  const usableH = canvas.height - 20;

  if (draggingNode === 'attack') {
    synthState.adsr.attack = Math.max(0.01, (mouseX / (usableW * 0.3)) * maxTime);
  } 
  else if (draggingNode === 'decay') {
    // Decay updates X (time) and Y (sustain level)
    const aX = 10 + (synthState.adsr.attack / maxTime) * (usableW * 0.3);
    const dTime = Math.max(0.01, ((mouseX - aX) / (usableW * 0.3)) * maxTime);
    synthState.adsr.decay = dTime;
    synthState.adsr.sustain = 1.0 - ((mouseY - 10) / usableH);
    synthState.adsr.sustain = Math.max(0, Math.min(1, synthState.adsr.sustain));
  }
  else if (draggingNode === 'release') {
    const aX = 10 + (synthState.adsr.attack / maxTime) * (usableW * 0.3);
    const dX = aX + (synthState.adsr.decay / maxTime) * (usableW * 0.3);
    const sX = dX + (usableW * 0.2);
    synthState.adsr.release = Math.max(0.01, ((mouseX - sX) / (usableW * 0.2)) * maxTime);
  }
  
  drawADSR();
});

drawADSR();


// --------------------------------------------------------------------------
// Synth Engine & Wavetable Extraction
// --------------------------------------------------------------------------
let noiseBuffer = null;
function getNoiseBuffer(ctx = audioCtx) {
  if (noiseBuffer && ctx === audioCtx) return noiseBuffer;
  if (!ctx) return null;
  const bufferSize = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buf.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  if (ctx === audioCtx) noiseBuffer = buf;
  return buf;
}

function midiToFreq(midiNote) {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

// --------------------------------------------------------------------------
// FFT Wavetable Generation
// --------------------------------------------------------------------------
async function freezeToWavetable() {
  if (!audioCtx) return;
  
  wavetableStatus.innerHTML = "Rendering single cycle...";
  wavetableStatus.style.color = "var(--neon-orange)";
  btnFreeze.disabled = true;

  // We analyze at a low fundamental frequency to get high harmonic resolution
  const fundamentalMidi = 36; // C2 (approx 65.4 Hz)
  const freq = midiToFreq(fundamentalMidi);
  const sampleRate = audioCtx.sampleRate;
  const cycleLengthSeconds = 1 / freq;
  
  // Render exactly one cycle. To avoid edge cases, render slightly more and truncate exactly.
  const renderFrames = Math.ceil(sampleRate * cycleLengthSeconds);
  
  const offCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, renderFrames, sampleRate);
  
  // Replicate the 4 channels
  const tempMaster = offCtx.createGain();
  tempMaster.connect(offCtx.destination);
  tempMaster.gain.value = 1.0; // Don't apply ADSR to the wavetable itself, just the raw mix

  function setupChannel(chState, masterNode) {
    if (chState.type === 'noise') {
      const src = offCtx.createBufferSource();
      src.buffer = getNoiseBuffer(offCtx);
      src.loop = true;
      const filter = offCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = chState.tuneFine; // UI uses tuneFine for cutoff on noise
      const gain = offCtx.createGain();
      gain.gain.value = chState.vol;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(masterNode);
      src.start();
    } else {
      const osc = offCtx.createOscillator();
      osc.type = chState.type;
      // Calculate detuned frequency
      const detunedMidi = fundamentalMidi + chState.tuneCoarse + (chState.tuneFine / 100);
      osc.frequency.value = midiToFreq(detunedMidi);
      const gain = offCtx.createGain();
      gain.gain.value = chState.vol;
      osc.connect(gain);
      gain.connect(masterNode);
      osc.start();
    }
  }

  setupChannel(synthState.ch1, tempMaster);
  setupChannel(synthState.ch2, tempMaster);
  setupChannel(synthState.ch3, tempMaster);
  setupChannel(synthState.ch4, tempMaster);

  // Render
  const renderedBuffer = await offCtx.startRendering();
  const channelData = renderedBuffer.getChannelData(0);

// Global FFT State
const numHarmonics = 64;
let fftReal = new Float32Array(numHarmonics);
let fftImag = new Float32Array(numHarmonics);

function updateCustomWavetable() {
  if (!audioCtx) return;
  customWavetable = audioCtx.createPeriodicWave(fftReal, fftImag, {disableNormalization: false});
  // Update all currently playing wavetable voices
  Object.values(activeVoices).forEach(voice => {
    if (voice.osc && engineMode === 'wavetable') {
      voice.osc.setPeriodicWave(customWavetable);
    }
  });
}

  wavetableStatus.innerHTML = "Running FFT Analysis...";

  // Perform a custom Discrete Fourier Transform (DFT) for a single cycle
  // We want to extract real and imag arrays for PeriodicWave (size e.g., 64 harmonics)
  const N = channelData.length;

  for (let k = 1; k < numHarmonics; k++) {
    let sumReal = 0;
    let sumImag = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      sumReal += channelData[n] * Math.cos(angle);
      sumImag += channelData[n] * Math.sin(angle); // -sin for standard DFT, but Web Audio PeriodicWave uses positive sin
    }
    // Normalize (Fourier series coefficients)
    fftReal[k] = (2 / N) * sumReal;
    fftImag[k] = (2 / N) * sumImag;
  }
  
  // DC offset
  fftReal[0] = 0;
  fftImag[0] = 0;

  updateCustomWavetable();

  wavetableStatus.innerHTML = "Wavetable Ready. Switching mode.";
  wavetableStatus.style.color = "var(--neon-blue)";
  
  // Switch mode
  engineMode = 'wavetable';
  btnModeAdditive.classList.remove('active');
  btnModeWavetable.classList.add('active');
  btnFreeze.disabled = false;
  
  // Switch Dashboards
  if (adsrSection && wavetableDashboard) {
    adsrSection.style.display = 'none';
    wavetableDashboard.style.display = 'block';
  }

  // Stop all active additive notes
  Object.keys(activeVoices).forEach(note => noteOff(note));
}


class SynthVoice {
  constructor(midiNote) {
    this.midiNote = midiNote;
    this.baseFreq = midiToFreq(midiNote);
    
    // Global Envelope Gain
    this.voiceGain = audioCtx.createGain();
    this.voiceGain.gain.value = 0;
    this.voiceGain.connect(masterGain);

    this.nodesToStop = [];

    if (engineMode === 'wavetable' && customWavetable) {
      // WAVETABLE MODE
      this.osc = audioCtx.createOscillator();
      this.osc.setPeriodicWave(customWavetable);
      this.osc.frequency.value = this.baseFreq;
      this.osc.connect(this.voiceGain);
      this.osc.start();
      this.nodesToStop.push(this.osc);
    } else {
      // ADDITIVE MODE
      this.setupAdditiveChannel(synthState.ch1);
      this.setupAdditiveChannel(synthState.ch2);
      this.setupAdditiveChannel(synthState.ch3);
      this.setupAdditiveChannel(synthState.ch4);
    }

    if (synthState.fx.lfoTarget === 'pitch') {
      this.nodesToStop.forEach(n => {
        if (n.detune && lfoGain) {
          // Increase LFO depth specifically for pitch since detune is in cents (100 = 1 semitone)
          lfoGain.connect(n.detune);
        }
      });
    }

    // Apply Global ADSR Attack
    const now = audioCtx.currentTime;
    this.voiceGain.gain.cancelScheduledValues(now);
    this.voiceGain.gain.setValueAtTime(0, now);
    this.voiceGain.gain.linearRampToValueAtTime(1, now + synthState.adsr.attack);
    this.voiceGain.gain.setTargetAtTime(synthState.adsr.sustain, now + synthState.adsr.attack, synthState.adsr.decay);
  }

  setupAdditiveChannel(chState) {
    if (chState.vol === 0) return;

    if (chState.type === 'noise') {
      const src = audioCtx.createBufferSource();
      src.buffer = getNoiseBuffer();
      src.loop = true;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = chState.tuneFine; // UI uses tuneFine for cutoff
      const gain = audioCtx.createGain();
      gain.gain.value = chState.vol;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.voiceGain);
      src.start();
      this.nodesToStop.push(src);
    } else {
      const osc = audioCtx.createOscillator();
      osc.type = chState.type;
      const detunedMidi = this.midiNote + chState.tuneCoarse + (chState.tuneFine / 100);
      osc.frequency.value = midiToFreq(detunedMidi);
      const gain = audioCtx.createGain();
      gain.gain.value = chState.vol;
      osc.connect(gain);
      gain.connect(this.voiceGain);
      osc.start();
      this.nodesToStop.push(osc);
    }
  }

  stop() {
    const now = audioCtx.currentTime;
    // Release
    this.voiceGain.gain.cancelScheduledValues(now);
    // Keep current value to avoid pops, then ramp down
    const currentVol = this.voiceGain.gain.value;
    this.voiceGain.gain.setValueAtTime(currentVol, now);
    this.voiceGain.gain.setTargetAtTime(0, now, synthState.adsr.release);
    
    // Garbage collection slightly after release tail
    setTimeout(() => {
      this.nodesToStop.forEach(n => n.stop());
      this.voiceGain.disconnect();
    }, (synthState.adsr.release * 5 * 1000) + 100); 
  }
}

// --------------------------------------------------------------------------
// Play/Stop Logic
// --------------------------------------------------------------------------
function noteOn(midiNote) {
  if (!isPowerOn) return;
  if (activeVoices[midiNote]) return; 

  const voice = new SynthVoice(midiNote);
  activeVoices[midiNote] = voice;
  
  const keyEl = document.querySelector(`.key[data-note="${midiNote}"]`);
  if (keyEl) keyEl.classList.add('active');
}

function noteOff(midiNote) {
  if (activeVoices[midiNote]) {
    activeVoices[midiNote].stop();
    delete activeVoices[midiNote];
  }

  const keyEl = document.querySelector(`.key[data-note="${midiNote}"]`);
  if (keyEl) keyEl.classList.remove('active');
}

// --------------------------------------------------------------------------
// UI Controls Binding
// --------------------------------------------------------------------------
function bindSelect(id, stateObj, prop) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('change', (e) => {
    stateObj[prop] = e.target.value;
  });
}

function bindSlider(id, stateObj, prop, isMaster = false, textElId = null) {
  const el = document.getElementById(id);
  const textEl = textElId ? document.getElementById(textElId) : null;
  if (!el) return;
  el.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (isMaster) {
      synthState[prop] = val;
      if (masterGain) masterGain.gain.setTargetAtTime(val, audioCtx.currentTime, 0.05);
    } else {
      stateObj[prop] = val;
      if (textEl) textEl.innerText = val > 0 ? `+${val}st` : `${val}st`;
    }
  });
}

function bindWaveToggles(groupId, stateObj, prop) {
  const group = document.getElementById(groupId);
  if (!group) return;
  const btns = group.querySelectorAll('.wave-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      stateObj[prop] = btn.getAttribute('data-val');
    });
  });
}

function bindDragBox(id, stateObj, prop, min, max) {
  const el = document.getElementById(id);
  if (!el) return;
  
  let isDragging = false;
  let startY = 0;
  let startVal = 0;

  el.addEventListener('mousedown', (e) => {
    isDragging = true;
    startY = e.clientY;
    startVal = stateObj[prop];
    document.body.style.cursor = 'ns-resize';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaY = startY - e.clientY; // up is positive
    let newVal = startVal + deltaY;
    if (newVal < min) newVal = min;
    if (newVal > max) newVal = max;
    stateObj[prop] = newVal;
    el.innerText = newVal > 0 && prop !== 'tuneFine' ? `+${newVal}` : newVal;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.cursor = '';
  });
  
  // Mobile touch support
  el.addEventListener('touchstart', (e) => {
    isDragging = true;
    startY = e.touches[0].clientY;
    startVal = stateObj[prop];
  }, {passive: true});

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const deltaY = startY - e.touches[0].clientY;
    let newVal = startVal + Math.round(deltaY / 2); // slower on mobile
    if (newVal < min) newVal = min;
    if (newVal > max) newVal = max;
    stateObj[prop] = newVal;
    el.innerText = newVal > 0 && prop !== 'tuneFine' ? `+${newVal}` : newVal;
  }, {passive: true});

  window.addEventListener('touchend', () => {
    isDragging = false;
  });
}

bindSlider('vol-master', synthState, 'masterVol', true);

// Channel Bindings
for(let i=1; i<=4; i++) {
  const chState = synthState[`ch${i}`];
  bindWaveToggles(`wave-group-${i}`, chState, 'type');
  bindSlider(`vol-${i}`, chState, 'vol');
  bindDragBox(`drag-coarse-${i}`, chState, 'tuneCoarse', -24, 24);
  bindDragBox(`drag-fine-${i}`, chState, 'tuneFine', -50, 50);
}

// Dashboards
const adsrSection = document.getElementById('adsr-section');
const wavetableDashboard = document.getElementById('wavetable-dashboard');

// Mode Buttons
btnModeAdditive.addEventListener('click', () => {
  engineMode = 'additive';
  btnModeAdditive.classList.add('active');
  btnModeWavetable.classList.remove('active');
  wavetableStatus.innerHTML = "Additive Engine Active";
  wavetableStatus.style.color = "var(--neon-orange)";
  
  // Switch Dashboards
  if (adsrSection && wavetableDashboard) {
    adsrSection.style.display = 'block';
    wavetableDashboard.style.display = 'none';
  }
});

btnModeWavetable.addEventListener('click', () => {
  if (!customWavetable) {
    wavetableStatus.innerHTML = "Freeze a wavetable first!";
    return;
  }
  engineMode = 'wavetable';
  btnModeAdditive.classList.remove('active');
  btnModeWavetable.classList.add('active');
  wavetableStatus.innerHTML = "Wavetable Engine Active";
  wavetableStatus.style.color = "var(--neon-blue)";
});

btnFreeze.addEventListener('click', freezeToWavetable);

// FX Bindings
function bindFxSlider(id, prop, updateFn) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    synthState.fx[prop] = val;
    if (updateFn) updateFn(val);
  });
}

bindFxSlider('filter-cutoff', 'filterCutoff', (v) => { if(globalFilter) globalFilter.frequency.setTargetAtTime(v, audioCtx.currentTime, 0.05); });
bindFxSlider('filter-res', 'filterRes', (v) => { if(globalFilter) globalFilter.Q.setTargetAtTime(v, audioCtx.currentTime, 0.05); });
bindFxSlider('delay-time', 'delayTime', (v) => { if(delayNode) delayNode.delayTime.setTargetAtTime(v, audioCtx.currentTime, 0.05); });
bindFxSlider('delay-fb', 'delayFb', (v) => { if(delayFeedbackNode) delayFeedbackNode.gain.setTargetAtTime(v, audioCtx.currentTime, 0.05); });
bindFxSlider('delay-mix', 'delayMix', (v) => { 
  if(delayMixDry) delayMixDry.gain.setTargetAtTime(1.0 - v, audioCtx.currentTime, 0.05); 
  if(delayMixWet) delayMixWet.gain.setTargetAtTime(v, audioCtx.currentTime, 0.05); 
});

bindFxSlider('lfo-rate', 'lfoRate', (v) => { if(lfoOsc) lfoOsc.frequency.setTargetAtTime(v, audioCtx.currentTime, 0.05); });
bindFxSlider('lfo-depth', 'lfoDepth', (v) => { 
  if(lfoGain) {
    // If target is pitch, we need a massive multiplier because detune is in cents (100 = 1 semitone)
    // If target is volume/pan, depth should be 0.0 - 1.0. 
    // Slider goes 0 - 1. So if target is pitch, multiply by 400 (4 semitones vibrato max)
    const mult = synthState.fx.lfoTarget === 'pitch' ? 400 : 1;
    lfoGain.gain.setTargetAtTime(v * mult, audioCtx.currentTime, 0.05); 
  }
});

let lfoPanNode = null;
function updateLfoRouting() {
  if (!lfoGain || !audioCtx) return;
  lfoGain.disconnect();
  
  if (lfoPanNode) {
    lfoPanNode.disconnect();
    masterGain.disconnect();
    masterGain.connect(globalFilter); // restore normal routing
    lfoPanNode = null;
  }

  const target = synthState.fx.lfoTarget;
  
  // Re-apply depth multiplier based on new target
  const depthEl = document.getElementById('lfo-depth');
  if (depthEl) {
    const v = parseFloat(depthEl.value);
    const mult = target === 'pitch' ? 400 : 1;
    lfoGain.gain.setTargetAtTime(v * mult, audioCtx.currentTime, 0.05);
  }

  if (target === 'volume') {
    lfoGain.connect(masterGain.gain);
  } 
  else if (target === 'pan') {
    if (audioCtx.createStereoPanner) {
      lfoPanNode = audioCtx.createStereoPanner();
      masterGain.disconnect();
      masterGain.connect(lfoPanNode);
      lfoPanNode.connect(globalFilter);
      lfoGain.connect(lfoPanNode.pan);
    }
  }
  // If target === 'pitch', it is handled dynamically in the SynthVoice constructor
}

const lfoTargetSelect = document.getElementById('lfo-target');
if (lfoTargetSelect) {
  lfoTargetSelect.addEventListener('change', (e) => {
    synthState.fx.lfoTarget = e.target.value;
    updateLfoRouting();
  });
}

// --------------------------------------------------------------------------
// Keyboard Generation & Events
// --------------------------------------------------------------------------
let isPointerDown = false;
const BASE_NOTE = 48; // C3

function generateKeyboard() {
  if (!keyboardContainer) return;
  keyboardContainer.innerHTML = '';
  
  const containerWidth = keyboardContainer.clientWidth;
  const whiteKeyWidth = Math.max(containerWidth / 15, 30);
  const numWhiteKeys = Math.floor(containerWidth / whiteKeyWidth);
  
  const pattern = [0, 2, 4, 5, 7, 9, 11]; 
  let whiteIndex = 0;

  for (let i = 0; i < numWhiteKeys; i++) {
    const octave = Math.floor(whiteIndex / 7);
    const noteInOctave = pattern[whiteIndex % 7];
    const midiNote = BASE_NOTE + (octave * 12) + noteInOctave;
    
    const wKey = document.createElement('div');
    wKey.className = 'key key-white';
    wKey.dataset.note = midiNote;
    
    const keyLabelStr = Object.keys(keyboardMap).find(k => keyboardMap[k] === midiNote);
    if (keyLabelStr) {
      wKey.innerHTML = `<div class="key-label">${keyLabelStr.toUpperCase()}</div>`;
    }

    keyboardContainer.appendChild(wKey);

    const hasBlackKey = [0, 1, 3, 4, 5].includes(whiteIndex % 7);
    if (hasBlackKey && i < numWhiteKeys - 1) {
      const bKey = document.createElement('div');
      bKey.className = 'key key-black';
      bKey.dataset.note = midiNote + 1;
      wKey.appendChild(bKey);
      
      const bLabelStr = Object.keys(keyboardMap).find(k => keyboardMap[k] === midiNote + 1);
      if (bLabelStr) {
        bKey.innerHTML = `<div class="key-label">${bLabelStr.toUpperCase()}</div>`;
      }
    }
    whiteIndex++;
  }
}

generateKeyboard();
window.addEventListener('resize', generateKeyboard);

keyboardContainer.addEventListener('pointerdown', (e) => {
  isPointerDown = true;
  const key = e.target.closest('.key');
  if (key) {
    e.stopPropagation();
    const note = parseInt(key.dataset.note);
    noteOn(note);
    key.dataset.activePointer = e.pointerId;
    key.setPointerCapture(e.pointerId);
  }
});

keyboardContainer.addEventListener('pointerup', (e) => {
  isPointerDown = false;
  const key = e.target.closest('.key');
  if (key) {
    const note = parseInt(key.dataset.note);
    noteOff(note);
    if (key.hasPointerCapture(e.pointerId)) {
      key.releasePointerCapture(e.pointerId);
    }
  }
  Object.keys(activeVoices).forEach(note => noteOff(note));
});

keyboardContainer.addEventListener('pointercancel', (e) => {
  isPointerDown = false;
  Object.keys(activeVoices).forEach(note => noteOff(note));
});

keyboardContainer.addEventListener('pointermove', (e) => {
  if (!isPointerDown) return;
  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (el) {
    const key = el.closest('.key');
    if (key) {
      const note = parseInt(key.dataset.note);
      Object.keys(activeVoices).forEach(n => {
        if (parseInt(n) !== note) noteOff(n);
      });
      noteOn(note);
    }
  }
});

window.addEventListener('keydown', (e) => {
  if (e.repeat) return; 
  const key = e.key.toLowerCase();
  if (keyboardMap[key]) {
    noteOn(keyboardMap[key]);
  }
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  if (keyboardMap[key]) {
    noteOff(keyboardMap[key]);
  }
});

// --------------------------------------------------------------------------
// Master Meter Animation
// --------------------------------------------------------------------------
const meterBar = document.getElementById('meter-level-bar');
let analyzer;

function updateMeter() {
  requestAnimationFrame(updateMeter);
  if (!audioCtx || !isPowerOn) return;
  
  if (meterBar) {
    if (!analyzer) {
      analyzer = audioCtx.createAnalyser();
      analyzer.fftSize = 256;
      masterGain.connect(analyzer);
    }

    const dataArray = new Uint8Array(analyzer.frequencyBinCount);
    analyzer.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for(let i=0; i<dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    const percent = Math.min(100, (avg / 128) * 100); 
    
    meterBar.style.height = percent + '%';
  }

  // Draw Oscilloscope
  if (engineMode === 'wavetable' && analyserNode) {
    const oscCanvas = document.getElementById('osc-canvas');
    if (oscCanvas) {
      const oscCtx = oscCanvas.getContext('2d');
      const w = oscCanvas.width;
      const h = oscCanvas.height;
      const dataArray = new Float32Array(analyserNode.frequencyBinCount);
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
      // Fix: it was trying to draw to `canvas` which was the ADSR canvas, it should be oscCanvas.height/2
      // Also the last line to x, y is enough.
      oscCtx.stroke();
    }
  }

  // Draw Spectral Editor
  if (engineMode === 'wavetable') {
    const fftCanvas = document.getElementById('fft-canvas');
    if (fftCanvas) {
      const fCtx = fftCanvas.getContext('2d');
      const w = fftCanvas.width;
      const h = fftCanvas.height;
      
      fCtx.fillStyle = '#050510';
      fCtx.fillRect(0, 0, w, h);

      const barWidth = w / numHarmonics;
      
      for(let i=1; i<numHarmonics; i++) {
        // Magnitude = sqrt(real^2 + imag^2)
        const mag = Math.sqrt(fftReal[i]*fftReal[i] + fftImag[i]*fftImag[i]);
        // Scale magnitude for display (mag is usually 0 to 1)
        const barHeight = Math.min(mag * h, h);
        
        fCtx.fillStyle = i === 1 ? '#ff7e5f' : '#a855f7'; // neon-orange / neon-purple
        fCtx.fillRect(i * barWidth, h - barHeight, barWidth - 1, barHeight);
      }
    }
  }
}

// --------------------------------------------------------------------------
// Interactive Spectral Editor (FFT Drag Logic)
// --------------------------------------------------------------------------
const fftCanvas = document.getElementById('fft-canvas');
let isDrawingSpectrum = false;

function updateHarmonicFromMouse(e) {
  if (!fftCanvas || engineMode !== 'wavetable') return;
  const rect = fftCanvas.getBoundingClientRect();
  const scaleX = fftCanvas.width / rect.width;
  const scaleY = fftCanvas.height / rect.height;
  
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  
  const binIndex = Math.floor(x / (fftCanvas.width / numHarmonics));
  if (binIndex > 0 && binIndex < numHarmonics) {
    const mag = 1.0 - (y / fftCanvas.height); // 0 to 1
    // We update real part directly (cosine phase). Setting imag to 0 for simplicity on user-drawn shapes.
    fftReal[binIndex] = Math.max(0, Math.min(1, mag));
    fftImag[binIndex] = 0; 
    updateCustomWavetable();
  }
}

if (fftCanvas) {
  fftCanvas.addEventListener('mousedown', (e) => {
    isDrawingSpectrum = true;
    updateHarmonicFromMouse(e);
  });
  window.addEventListener('mouseup', () => isDrawingSpectrum = false);
  fftCanvas.addEventListener('mousemove', (e) => {
    if (isDrawingSpectrum) updateHarmonicFromMouse(e);
  });
}
