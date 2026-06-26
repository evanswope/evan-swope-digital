/* --------------------------------------------------------------------------
   SYNTHESIZER ENGINE (synth.js)
   -------------------------------------------------------------------------- */

let audioCtx;
let masterGain;
let isPowerOn = false;
let activeVoices = {}; // Tracks currently playing notes

// Mixer state
const synthState = {
  masterVol: 0.5,
  ch1: { vol: 0.5, tune: 0 },
  ch2: { vol: 0.2, tune: 0 },
  ch3: { vol: 0.2, tune: 0 },
  ch4: { vol: 0.0, filterFreq: 5000 }
};

// Key mapping (QWERTY home row ish to piano keys)
// Z = C3, S = C#3, X = D3, D = D#3, C = E3, V = F3, G = F#3, B = G3, H = G#3, N = A3, J = A#3, M = B3, , = C4
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
  
  // Create AudioContext
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();
  
  // Create Master Gain
  masterGain = audioCtx.createGain();
  masterGain.gain.value = synthState.masterVol;
  
  // Add a subtle compressor to the master bus to prevent clipping
  const compressor = audioCtx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-10, audioCtx.currentTime);
  compressor.knee.setValueAtTime(40, audioCtx.currentTime);
  compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
  compressor.attack.setValueAtTime(0, audioCtx.currentTime);
  compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

  masterGain.connect(compressor);
  compressor.connect(audioCtx.destination);

  // Resume context if suspended
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  isPowerOn = true;
  overlay.classList.add('hidden');
  powerLight.classList.add('is-on');

  // Start Meter Animation
  requestAnimationFrame(updateMeter);
}

// --------------------------------------------------------------------------
// Synth Engine (Voice Class)
// --------------------------------------------------------------------------

// Create a buffer for noise once
let noiseBuffer = null;
function getNoiseBuffer() {
  if (noiseBuffer) return noiseBuffer;
  if (!audioCtx) return null;
  const bufferSize = audioCtx.sampleRate * 2; // 2 seconds
  noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function midiToFreq(midiNote) {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

class SynthVoice {
  constructor(midiNote) {
    this.midiNote = midiNote;
    this.baseFreq = midiToFreq(midiNote);
    
    // Voice master gain (for envelope)
    this.voiceGain = audioCtx.createGain();
    this.voiceGain.gain.value = 0;
    this.voiceGain.connect(masterGain);

    // CH 1: Sine
    this.osc1 = audioCtx.createOscillator();
    this.osc1.type = 'sine';
    this.osc1.frequency.value = midiToFreq(this.midiNote + synthState.ch1.tune);
    this.gain1 = audioCtx.createGain();
    this.gain1.gain.value = synthState.ch1.vol;
    this.osc1.connect(this.gain1);
    this.gain1.connect(this.voiceGain);

    // CH 2: Square
    this.osc2 = audioCtx.createOscillator();
    this.osc2.type = 'square';
    this.osc2.frequency.value = midiToFreq(this.midiNote + synthState.ch2.tune);
    this.gain2 = audioCtx.createGain();
    this.gain2.gain.value = synthState.ch2.vol;
    this.osc2.connect(this.gain2);
    this.gain2.connect(this.voiceGain);

    // CH 3: Triangle
    this.osc3 = audioCtx.createOscillator();
    this.osc3.type = 'triangle';
    this.osc3.frequency.value = midiToFreq(this.midiNote + synthState.ch3.tune);
    this.gain3 = audioCtx.createGain();
    this.gain3.gain.value = synthState.ch3.vol;
    this.osc3.connect(this.gain3);
    this.gain3.connect(this.voiceGain);

    // CH 4: Noise
    this.noiseSrc = audioCtx.createBufferSource();
    this.noiseSrc.buffer = getNoiseBuffer();
    this.noiseSrc.loop = true;
    
    this.noiseFilter = audioCtx.createBiquadFilter();
    this.noiseFilter.type = 'lowpass';
    this.noiseFilter.frequency.value = synthState.ch4.filterFreq;

    this.gain4 = audioCtx.createGain();
    this.gain4.gain.value = synthState.ch4.vol;

    this.noiseSrc.connect(this.noiseFilter);
    this.noiseFilter.connect(this.gain4);
    this.gain4.connect(this.voiceGain);

    // Start all
    this.osc1.start();
    this.osc2.start();
    this.osc3.start();
    this.noiseSrc.start();

    // Envelope Attack
    this.voiceGain.gain.setTargetAtTime(1, audioCtx.currentTime, 0.02);
  }

  stop() {
    // Envelope Release
    this.voiceGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
    
    setTimeout(() => {
      this.osc1.stop();
      this.osc2.stop();
      this.osc3.stop();
      this.noiseSrc.stop();
      this.voiceGain.disconnect();
    }, 200); // Wait for release
  }

  // Update parameters live
  updateParams() {
    this.gain1.gain.setTargetAtTime(synthState.ch1.vol, audioCtx.currentTime, 0.05);
    this.osc1.frequency.setTargetAtTime(midiToFreq(this.midiNote + synthState.ch1.tune), audioCtx.currentTime, 0.05);

    this.gain2.gain.setTargetAtTime(synthState.ch2.vol, audioCtx.currentTime, 0.05);
    this.osc2.frequency.setTargetAtTime(midiToFreq(this.midiNote + synthState.ch2.tune), audioCtx.currentTime, 0.05);

    this.gain3.gain.setTargetAtTime(synthState.ch3.vol, audioCtx.currentTime, 0.05);
    this.osc3.frequency.setTargetAtTime(midiToFreq(this.midiNote + synthState.ch3.tune), audioCtx.currentTime, 0.05);

    this.gain4.gain.setTargetAtTime(synthState.ch4.vol, audioCtx.currentTime, 0.05);
    this.noiseFilter.frequency.setTargetAtTime(synthState.ch4.filterFreq, audioCtx.currentTime, 0.05);
  }
}

// --------------------------------------------------------------------------
// Play/Stop Logic
// --------------------------------------------------------------------------
function noteOn(midiNote) {
  if (!isPowerOn) return;
  if (activeVoices[midiNote]) return; // Already playing

  const voice = new SynthVoice(midiNote);
  activeVoices[midiNote] = voice;
  
  // Update UI key
  const keyEl = document.querySelector(`.key[data-note="${midiNote}"]`);
  if (keyEl) keyEl.classList.add('active');
}

function noteOff(midiNote) {
  if (activeVoices[midiNote]) {
    activeVoices[midiNote].stop();
    delete activeVoices[midiNote];
  }

  // Update UI key
  const keyEl = document.querySelector(`.key[data-note="${midiNote}"]`);
  if (keyEl) keyEl.classList.remove('active');
}

// Update all active voices when a knob moves
function updateAllVoices() {
  Object.values(activeVoices).forEach(voice => voice.updateParams());
}


// --------------------------------------------------------------------------
// UI Controls Binding
// --------------------------------------------------------------------------

// Helper to bind slider to state
function bindSlider(id, stateObj, prop, isMaster = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (isMaster) {
      synthState[prop] = val;
      if (masterGain) masterGain.gain.setTargetAtTime(val, audioCtx.currentTime, 0.05);
    } else {
      stateObj[prop] = val;
      updateAllVoices();
    }
  });
}

bindSlider('vol-master', synthState, 'masterVol', true);

bindSlider('vol-sine', synthState.ch1, 'vol');
bindSlider('tune-sine', synthState.ch1, 'tune');

bindSlider('vol-square', synthState.ch2, 'vol');
bindSlider('tune-square', synthState.ch2, 'tune');

bindSlider('vol-triangle', synthState.ch3, 'vol');
bindSlider('tune-triangle', synthState.ch3, 'tune');

bindSlider('vol-noise', synthState.ch4, 'vol');
bindSlider('filter-noise', synthState.ch4, 'filterFreq');


// --------------------------------------------------------------------------
// Keyboard Generation & Events
// --------------------------------------------------------------------------

let isPointerDown = false;
const keyNoteMap = []; // To keep track of generated keys
const BASE_NOTE = 48; // C3

function generateKeyboard() {
  if (!keyboardContainer) return;
  keyboardContainer.innerHTML = '';
  
  // Calculate how many white keys we can fit. Let's say a white key is ~40px min
  const containerWidth = keyboardContainer.clientWidth;
  const whiteKeyWidth = Math.max(containerWidth / 15, 30); // Max 15 keys, min 30px
  const numWhiteKeys = Math.floor(containerWidth / whiteKeyWidth);
  
  const pattern = [0, 2, 4, 5, 7, 9, 11]; // Major scale intervals (white keys)
  let currentNote = BASE_NOTE;
  let whiteIndex = 0;

  for (let i = 0; i < numWhiteKeys; i++) {
    // Figure out the note number based on pattern
    const octave = Math.floor(whiteIndex / 7);
    const noteInOctave = pattern[whiteIndex % 7];
    const midiNote = BASE_NOTE + (octave * 12) + noteInOctave;
    
    // Create white key
    const wKey = document.createElement('div');
    wKey.className = 'key key-white';
    wKey.dataset.note = midiNote;
    
    // Add label for specific keys mapping
    const keyLabelStr = Object.keys(keyboardMap).find(k => keyboardMap[k] === midiNote);
    if (keyLabelStr) {
      wKey.innerHTML = `<div class="key-label">${keyLabelStr.toUpperCase()}</div>`;
    }

    keyboardContainer.appendChild(wKey);

    // Create black key if applicable (C#, D#, F#, G#, A#)
    const hasBlackKey = [0, 1, 3, 4, 5].includes(whiteIndex % 7);
    if (hasBlackKey && i < numWhiteKeys - 1) {
      const bKey = document.createElement('div');
      bKey.className = 'key key-black';
      bKey.dataset.note = midiNote + 1;
      // Position black key relative to this white key. Since it's flex, we can't easily absolute position relative to container.
      // Actually, we can absolute position it relative to the white key.
      // Wait, flex items don't work great with absolute children overflowing unless the parent has no overflow hidden.
      // We'll append it to the white key!
      wKey.appendChild(bKey);
      
      const bLabelStr = Object.keys(keyboardMap).find(k => keyboardMap[k] === midiNote + 1);
      if (bLabelStr) {
        bKey.innerHTML = `<div class="key-label">${bLabelStr.toUpperCase()}</div>`;
      }
    }
    
    whiteIndex++;
  }
}

// Generate on load and resize
generateKeyboard();
window.addEventListener('resize', generateKeyboard);

// Mouse / Touch events for the keyboard
keyboardContainer.addEventListener('pointerdown', (e) => {
  isPointerDown = true;
  const key = e.target.closest('.key');
  if (key) {
    // If we clicked a black key, don't trigger the white key underneath
    e.stopPropagation();
    const note = parseInt(key.dataset.note);
    noteOn(note);
    // Store active touch note on the element or globally to handle drag off
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
  // Failsafe: turn off all notes
  Object.keys(activeVoices).forEach(note => noteOff(note));
});

keyboardContainer.addEventListener('pointercancel', (e) => {
  isPointerDown = false;
  Object.keys(activeVoices).forEach(note => noteOff(note));
});

keyboardContainer.addEventListener('pointermove', (e) => {
  if (!isPointerDown) return;
  // Custom glissando logic: find element from point since pointerCapture sends events to the original target
  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (el) {
    const key = el.closest('.key');
    if (key) {
      const note = parseInt(key.dataset.note);
      // Turn off other notes (monophonic glide behavior for mouse, though touch could be polyphonic)
      Object.keys(activeVoices).forEach(n => {
        if (parseInt(n) !== note) noteOff(n);
      });
      noteOn(note);
    }
  }
});

// Computer Keyboard events
window.addEventListener('keydown', (e) => {
  if (e.repeat) return; // Prevent continuous re-trigger
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
  if (!audioCtx || !isPowerOn || !meterBar) return;
  
  if (!analyzer) {
    analyzer = audioCtx.createAnalyser();
    analyzer.fftSize = 256;
    masterGain.connect(analyzer);
  }

  const dataArray = new Uint8Array(analyzer.frequencyBinCount);
  analyzer.getByteFrequencyData(dataArray);
  
  // Calculate average volume
  let sum = 0;
  for(let i=0; i<dataArray.length; i++) {
    sum += dataArray[i];
  }
  const avg = sum / dataArray.length;
  const percent = Math.min(100, (avg / 128) * 100); // 128 is a reasonable max for this
  
  meterBar.style.height = percent + '%';
}
