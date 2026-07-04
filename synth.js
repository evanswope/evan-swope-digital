/* --------------------------------------------------------------------------
   FM NEURAL MATRIX ENGINE (synth.js)
   -------------------------------------------------------------------------- */

let audioCtx;
let masterGain;
let isPowerOn = false;
let activeVoices = {}; // Tracks currently playing notes

// Matrix State
const fmNodes = [
  { id: 0, x: 0.5, y: 0.5, type: 'sine', ratio: 1.0, isCarrier: true, color: '#ff7e5f' }, // Carrier (Node 1)
  { id: 1, x: 0.2, y: 0.2, type: 'sine', ratio: 2.0, isCarrier: false, color: '#a855f7' }, // Modulator (Node 2)
  { id: 2, x: 0.8, y: 0.2, type: 'sine', ratio: 0.5, isCarrier: false, color: '#39ff14' }, // Modulator (Node 3)
  { id: 3, x: 0.5, y: 0.8, type: 'sine', ratio: 3.0, isCarrier: false, color: '#21d4fd' }  // Modulator (Node 4)
];
let selectedNode = null;
let draggedNode = null;

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
  compressor.connect(audioCtx.destination);

  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  isPowerOn = true;
  overlay.classList.add('hidden');
  powerLight.classList.add('is-on');

  initMatrixCanvas();
}

// --------------------------------------------------------------------------
// FM Synth Voice (Polyphonic 4-Operator)
// --------------------------------------------------------------------------
class FMSynthVoice {
  constructor(baseFreq) {
    this.baseFreq = baseFreq;
    
    // Create 4 Oscillators
    this.oscs = [];
    this.gains = []; // Output gains (only Carrier is audible, Modulators go into freq)
    
    for(let i = 0; i < 4; i++) {
      const osc = audioCtx.createOscillator();
      const nodeDef = fmNodes[i];
      
      osc.type = nodeDef.type;
      osc.frequency.value = baseFreq * nodeDef.ratio;
      
      const gain = audioCtx.createGain();
      gain.gain.value = 0; // Starts at 0
      
      osc.connect(gain);
      osc.start();
      
      this.oscs.push(osc);
      this.gains.push(gain);
    }
    
    // Routing: Modulators -> Carrier Frequency
    // (In a true matrix, they could modulate each other, but for this demo, 2,3,4 modulate 1)
    this.gains[1].connect(this.oscs[0].frequency);
    this.gains[2].connect(this.oscs[0].frequency);
    this.gains[3].connect(this.oscs[0].frequency);
    
    // Main Envelope for the Carrier
    this.envGain = audioCtx.createGain();
    this.envGain.gain.setValueAtTime(0, audioCtx.currentTime);
    this.envGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.05); // Attack
    
    this.gains[0].connect(this.envGain);
    
    // LFO Modulation routing
    this.panNode = audioCtx.createStereoPanner();
    const target = synthState.fx.lfoTarget;
    if (target === 'pitch') {
      lfoGain.connect(this.oscs[0].detune);
      this.lfoConnectedDetune = true;
    } else if (target === 'volume') {
      lfoGain.connect(this.envGain.gain);
      this.lfoConnectedGain = true;
    } else if (target === 'pan') {
      lfoGain.connect(this.panNode.pan);
      this.lfoConnectedPan = true;
    }
    
    this.envGain.connect(this.panNode);
    this.panNode.connect(masterGain);
    
    // Set initial modulation depths
    this.updateModulationDepths();
  }

  updateModulationDepths() {
    // Carrier is always on
    this.gains[0].gain.setTargetAtTime(1.0, audioCtx.currentTime, 0.01);
    
    const carrier = fmNodes[0];
    
    // Modulators (1, 2, 3) distance to Carrier (0)
    for(let i = 1; i < 4; i++) {
      const mod = fmNodes[i];
      const dx = mod.x - carrier.x;
      const dy = mod.y - carrier.y;
      const dist = Math.sqrt(dx*dx + dy*dy); // 0.0 to 1.414
      
      // The closer it is, the higher the modulation index.
      // Max distance = 1.0 (corners). Let's clamp at 0.8
      const proximity = Math.max(0, 1.0 - (dist / 0.8)); // 1.0 when touching, 0.0 when far
      
      // FM Depth formula: BaseFreq * Ratio * ModIndex
      // For wild sounds, ModIndex can go up to 10 or 20.
      const modDepth = this.baseFreq * mod.ratio * (proximity * proximity * 15);
      
      // Update the gain node smoothly
      this.gains[i].gain.setTargetAtTime(modDepth, audioCtx.currentTime, 0.02);
    }
  }

  stop() {
    try {
      // Release
      this.envGain.gain.cancelScheduledValues(audioCtx.currentTime);
      this.envGain.gain.setValueAtTime(this.envGain.gain.value, audioCtx.currentTime);
      this.envGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      
      setTimeout(() => {
        for(let i=0; i<4; i++) {
          this.oscs[i].stop();
          this.oscs[i].disconnect();
          this.gains[i].disconnect();
        }
        if (this.lfoConnectedDetune) lfoGain.disconnect(this.oscs[0].detune);
        if (this.lfoConnectedGain) lfoGain.disconnect(this.envGain.gain);
        if (this.lfoConnectedPan) lfoGain.disconnect(this.panNode.pan);
        this.envGain.disconnect();
        this.panNode.disconnect();
      }, 350);
    } catch (e) {}
  }
}

// --------------------------------------------------------------------------
// Neural Matrix Canvas Rendering & Interaction
// --------------------------------------------------------------------------
let canvas, ctx;

function initMatrixCanvas() {
  canvas = document.getElementById('fm-canvas');
  if(!canvas) return;
  
  // High DPI canvas setup
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentNode.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  
  canvas.addEventListener('mousedown', handleMatrixDown);
  canvas.addEventListener('mousemove', handleMatrixMove);
  window.addEventListener('mouseup', handleMatrixUp);
  
  requestAnimationFrame(drawMatrix);
}

function handleMatrixDown(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = (e.clientX - rect.left) / rect.width;
  const mouseY = (e.clientY - rect.top) / rect.height;
  
  // Find clicked node (radius is ~0.05 in normalized coords)
  for(let i = fmNodes.length - 1; i >= 0; i--) {
    const node = fmNodes[i];
    const dx = node.x - mouseX;
    const dy = node.y - mouseY;
    if (Math.hypot(dx, dy) < 0.05) {
      selectedNode = node;
      if (!node.isCarrier) {
        draggedNode = node;
      }
      updateInspectorUI();
      return;
    }
  }
  
  // Clicked empty space
  selectedNode = null;
  updateInspectorUI();
}

function handleMatrixMove(e) {
  if (!draggedNode) return;
  
  const rect = canvas.getBoundingClientRect();
  let mouseX = (e.clientX - rect.left) / rect.width;
  let mouseY = (e.clientY - rect.top) / rect.height;
  
  // Clamp to canvas bounds
  draggedNode.x = Math.max(0.05, Math.min(0.95, mouseX));
  draggedNode.y = Math.max(0.05, Math.min(0.95, mouseY));
  
  // Update audio engine modulations in real-time
  Object.values(activeVoices).forEach(voice => voice.updateModulationDepths());
}

function handleMatrixUp() {
  draggedNode = null;
}

function drawMatrix(time) {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, w, h);
  
  // Draw Synapses (Lines to Carrier)
  const carrier = fmNodes[0];
  for(let i = 1; i < 4; i++) {
    const mod = fmNodes[i];
    const dx = mod.x - carrier.x;
    const dy = mod.y - carrier.y;
    const dist = Math.hypot(dx, dy);
    
    // Closer = thicker and brighter
    const proximity = Math.max(0, 1.0 - (dist / 0.8)); 
    const thickness = proximity * 6 + 1;
    const alpha = proximity * 0.8 + 0.1;
    
    ctx.beginPath();
    ctx.moveTo(mod.x * w, mod.y * h);
    ctx.lineTo(carrier.x * w, carrier.y * h);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = thickness;
    ctx.stroke();
    
    // Draw flowing energy on active synapse
    if (proximity > 0.1 && Object.keys(activeVoices).length > 0) {
      const flowPos = (time / 500) % 1;
      const energyX = mod.x + (carrier.x - mod.x) * flowPos;
      const energyY = mod.y + (carrier.y - mod.y) * flowPos;
      
      ctx.beginPath();
      ctx.arc(energyX * w, energyY * h, 3 + (proximity * 3), 0, Math.PI*2);
      ctx.fillStyle = mod.color;
      ctx.fill();
    }
  }
  
  // Draw Nodes
  for(let i = 0; i < 4; i++) {
    const node = fmNodes[i];
    const x = node.x * w;
    const y = node.y * h;
    const radius = node.isCarrier ? 24 : 18;
    
    // Glow effect
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
    grad.addColorStop(0, node.color);
    grad.addColorStop(1, 'transparent');
    
    ctx.beginPath();
    ctx.arc(x, y, radius * 2, 0, Math.PI*2);
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.6;
    ctx.fill();
    ctx.globalAlpha = 1.0;
    
    // Core
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI*2);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.lineWidth = selectedNode === node ? 3 : 1;
    ctx.strokeStyle = node.color;
    ctx.stroke();
    
    // Label
    ctx.fillStyle = node.color;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.isCarrier ? 'OUT' : `M${i}`, x, y);
  }
  
  requestAnimationFrame(drawMatrix);
}

// --------------------------------------------------------------------------
// Node Inspector UI
// --------------------------------------------------------------------------
const inspectorContent = document.getElementById('inspector-content');
const inspectorEmpty = document.getElementById('inspector-empty');
const inspectorTitle = document.getElementById('inspector-title');
const inspectorRatio = document.getElementById('inspector-ratio');
const ratioDisplay = document.getElementById('ratio-display');
const waveBtns = document.querySelectorAll('#inspector-wave-toggles .wave-btn');

function updateInspectorUI() {
  if (!selectedNode) {
    inspectorContent.style.display = 'none';
    inspectorEmpty.style.display = 'flex';
    inspectorTitle.innerText = "NODE INSPECTOR";
    inspectorTitle.style.color = "var(--text-primary)";
    return;
  }
  
  inspectorContent.style.display = 'flex';
  inspectorEmpty.style.display = 'none';
  
  inspectorTitle.innerText = selectedNode.isCarrier ? "CARRIER NODE" : `MODULATOR ${selectedNode.id}`;
  inspectorTitle.style.color = selectedNode.color;
  
  // Set Waveform toggle
  waveBtns.forEach(btn => {
    if (btn.dataset.val === selectedNode.type) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  
  // Set Ratio slider
  inspectorRatio.value = selectedNode.ratio;
  ratioDisplay.innerText = selectedNode.ratio.toFixed(2) + 'x';
}

// Bind Waveform toggles
waveBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if(!selectedNode) return;
    
    // update UI
    waveBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // update state
    selectedNode.type = btn.dataset.val;
    
    // update active voices
    Object.values(activeVoices).forEach(voice => {
      voice.oscs[selectedNode.id].type = selectedNode.type;
    });
  });
});

// Bind Ratio slider
inspectorRatio.addEventListener('input', (e) => {
  if(!selectedNode) return;
  const ratio = parseFloat(e.target.value);
  selectedNode.ratio = ratio;
  ratioDisplay.innerText = ratio.toFixed(2) + 'x';
  
  // update active voices
  Object.values(activeVoices).forEach(voice => {
    voice.oscs[selectedNode.id].frequency.value = voice.baseFreq * ratio;
  });
});

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
  if(lfoGain) lfoGain.disconnect();
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
  
  const note = keyboardMap[e.key.toLowerCase()];
  if (note && !activeVoices[note]) {
    const keyEl = document.querySelector(`.key[data-note="${note}"]`);
    if (keyEl) keyEl.classList.add('active');
    
    const freq = noteToFreq(note);
    activeVoices[note] = new FMSynthVoice(freq);
  }
}

function handleKeyup(e) {
  const note = keyboardMap[e.key.toLowerCase()];
  if (note && activeVoices[note]) {
    const keyEl = document.querySelector(`.key[data-note="${note}"]`);
    if (keyEl) keyEl.classList.remove('active');
    
    activeVoices[note].stop();
    delete activeVoices[note];
  }
}

document.addEventListener('keydown', handleKeydown);
document.addEventListener('keyup', handleKeyup);

// Build Keyboard DOM
if (keyboardContainer) {
  const startNote = 48; // C3
  const endNote = 76; // E5
  
  for(let i = startNote; i <= endNote; i++) {
    const key = document.createElement('div');
    const isBlack = [1, 3, 6, 8, 10].includes(i % 12);
    key.className = `key ${isBlack ? 'key-black' : 'key-white'}`;
    key.dataset.note = i;
    
    key.addEventListener('mousedown', () => {
      if(!isPowerOn) return;
      const note = parseInt(key.dataset.note);
      if(!activeVoices[note]) {
        key.classList.add('active');
        activeVoices[note] = new FMSynthVoice(noteToFreq(note));
      }
    });
    
    key.addEventListener('mouseup', () => {
      const note = parseInt(key.dataset.note);
      if(activeVoices[note]) {
        key.classList.remove('active');
        activeVoices[note].stop();
        delete activeVoices[note];
      }
    });
    
    key.addEventListener('mouseleave', () => {
      const note = parseInt(key.dataset.note);
      if(activeVoices[note]) {
        key.classList.remove('active');
        activeVoices[note].stop();
        delete activeVoices[note];
      }
    });
    
    keyboardContainer.appendChild(key);
  }
}
