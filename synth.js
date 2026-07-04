/* --------------------------------------------------------------------------
   GENERATIVE AUTOMATA SEQUENCER (Dark Mode, Limiter & Lo-Fi)
   -------------------------------------------------------------------------- */

let audioCtx;
let masterGain;
let isPowerOn = false;

// Grid State (32x16 = 2:1 aspect ratio)
const COLS = 32;
const ROWS = 16;
let grid = new Array(COLS).fill(0).map(() => new Array(ROWS).fill(0));
let nextGrid = new Array(COLS).fill(0).map(() => new Array(ROWS).fill(0));
let isSimPlaying = false;
let simSpeed = 150; // ms per tick
let lastTickTime = 0;
let lastBoilTime = 0;

// Musical Scale (C Minor Pentatonic)
const scaleNotes = [
  84, 82, 79, 77, 75, // C6, Bb5, G5, F5, Eb5
  72, 70, 67, 65, 63, // C5, Bb4, G4, F4, Eb4
  60, 58, 55, 53, 51, // C4, Bb3, G3, F3, Eb3
  48                  // C3
];

// Custom FX Nodes
let chorusLfo, chorusDelay, chorusMix;
let distNode, distMix;
let granDelays = [], granMix;
let masterLimiter;

// FX State
let fxLevels = {
  chorus: 0,
  dist: 0,
  granular: 0
};

// UI Elements
const btnStart = document.getElementById('btn-start-audio');
const overlay = document.getElementById('audio-start-overlay');
const powerLight = document.getElementById('power-indicator');
const turbulence = document.getElementById('boil-turbulence');

// --------------------------------------------------------------------------
// Initialization & FX Routing
// --------------------------------------------------------------------------
btnStart.addEventListener('click', initAudio);

function makeDistortionCurve(amount) {
  const k = amount * 100; // Map 0-1 to 0-100 distortion
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

async function initAudio() {
  if (audioCtx) return;
  
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();
  
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.5;
  
  buildFXRack();
  
  // Limiter to prevent clipping from heavy FX stacking
  masterLimiter = audioCtx.createDynamicsCompressor();
  masterLimiter.threshold.setValueAtTime(-5, audioCtx.currentTime); // Hard clamp at -5dB
  masterLimiter.knee.setValueAtTime(0, audioCtx.currentTime); // Hard knee
  masterLimiter.ratio.setValueAtTime(20, audioCtx.currentTime); // 20:1 ratio
  masterLimiter.attack.setValueAtTime(0.005, audioCtx.currentTime); // Fast attack
  masterLimiter.release.setValueAtTime(0.05, audioCtx.currentTime); // Fast release
  
  // Dry routing
  masterGain.connect(masterLimiter);
  
  masterLimiter.connect(audioCtx.destination);

  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  isPowerOn = true;
  overlay.classList.add('hidden');
  powerLight.classList.add('is-on');

  initGridCanvas();
}

function buildFXRack() {
  const fxBus = audioCtx.createGain();
  fxBus.gain.value = 1.0;
  // Route ALL FX through the limiter
  // NOTE: masterLimiter is defined in initAudio. 
  // Wait, buildFXRack is called before masterLimiter connects. That's fine, we will connect it after.
  
  // 1. Chorus
  chorusMix = audioCtx.createGain();
  chorusMix.gain.value = fxLevels.chorus;
  
  chorusDelay = audioCtx.createDelay(0.1);
  chorusDelay.delayTime.value = 0.03;
  
  chorusLfo = audioCtx.createOscillator();
  chorusLfo.type = 'sine';
  chorusLfo.frequency.value = 1.5;
  const chorusDepth = audioCtx.createGain();
  chorusDepth.gain.value = 0.005;
  
  chorusLfo.connect(chorusDepth);
  chorusDepth.connect(chorusDelay.delayTime);
  chorusLfo.start();
  
  masterGain.connect(chorusDelay);
  chorusDelay.connect(chorusMix);
  chorusMix.connect(fxBus);
  
  // 2. Lo-Fi Distortion
  distMix = audioCtx.createGain();
  distMix.gain.value = fxLevels.dist;
  
  distNode = audioCtx.createWaveShaper();
  distNode.curve = makeDistortionCurve(0.8);
  distNode.oversample = 'none'; // Lo-Fi Aliasing
  
  masterGain.connect(distNode);
  distNode.connect(distMix);
  distMix.connect(fxBus);
  
  // 3. Granular Cloud (Multi-tap feedback network)
  granMix = audioCtx.createGain();
  granMix.gain.value = fxLevels.granular;
  
  for(let i=0; i<3; i++) {
    const delay = audioCtx.createDelay(2.0);
    delay.delayTime.value = 0.15 + (i * 0.13); 
    const fb = audioCtx.createGain();
    fb.gain.value = 0.6 + (Math.random() * 0.2);
    const pan = audioCtx.createStereoPanner();
    pan.pan.value = -0.8 + (i * 0.8); 
    
    masterGain.connect(delay);
    delay.connect(fb);
    fb.connect(delay); 
    delay.connect(pan);
    pan.connect(granMix);
    granDelays.push(delay);
  }
  granMix.connect(fxBus);
  
  // We will connect fxBus to limiter in initAudio, so we must expose fxBus or bind it late.
  // Actually, we can just defer the connection in initAudio:
  window._fxBus = fxBus;
}

// Ensure fxBus is connected after limiter is created
const _originalInitAudio = initAudio;
initAudio = async function() {
  await _originalInitAudio();
  if (window._fxBus && masterLimiter) {
    window._fxBus.connect(masterLimiter);
  }
}

// --------------------------------------------------------------------------
// Generative Synth Voice (Pluck)
// --------------------------------------------------------------------------
function noteToFreq(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

class PluckVoice {
  constructor(row, col) {
    if (!audioCtx) return;
    
    // Pitch based on Row
    const midiNote = scaleNotes[row % scaleNotes.length];
    const freq = noteToFreq(midiNote);
    
    // X-Axis maps to Filter Cutoff (Brightness)
    const filterFreq = 300 + ((col / (COLS - 1)) * 2700);
    
    this.osc = audioCtx.createOscillator();
    this.osc.type = 'triangle'; 
    this.osc.frequency.value = freq;
    
    this.filter = audioCtx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(filterFreq, audioCtx.currentTime);
    this.filter.frequency.exponentialRampToValueAtTime(Math.max(100, filterFreq - 1000), audioCtx.currentTime + 0.3);
    
    this.gainNode = audioCtx.createGain();
    this.gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    
    // Fast attack, exponential decay for pluck
    this.gainNode.gain.linearRampToValueAtTime(0.7, audioCtx.currentTime + 0.02);
    this.gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    
    this.panNode = audioCtx.createStereoPanner();
    this.panNode.pan.value = (Math.random() * 0.6) - 0.3;
    
    // Connect
    this.osc.connect(this.filter);
    this.filter.connect(this.gainNode);
    this.gainNode.connect(this.panNode);
    this.panNode.connect(masterGain);
    
    this.osc.start();
    
    // Auto kill
    setTimeout(() => {
      this.osc.stop();
      this.osc.disconnect();
      this.filter.disconnect();
      this.gainNode.disconnect();
      this.panNode.disconnect();
    }, 700);
  }
}

// --------------------------------------------------------------------------
// Cellular Automata Simulation
// --------------------------------------------------------------------------
function countNeighbors(x, y) {
  let sum = 0;
  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      let col = (x + i + COLS) % COLS;
      let row = (y + j + ROWS) % ROWS;
      sum += grid[col][row];
    }
  }
  sum -= grid[x][y];
  return sum;
}

function tick() {
  if (!isPowerOn) return;
  
  let newlyBorn = [];
  
  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      let state = grid[i][j];
      let neighbors = countNeighbors(i, j);
      
      if (state === 0 && neighbors === 3) {
        nextGrid[i][j] = 1;
        newlyBorn.push({c: i, r: j});
      } else if (state === 1 && (neighbors < 2 || neighbors > 3)) {
        nextGrid[i][j] = 0;
      } else {
        nextGrid[i][j] = state;
      }
    }
  }
  
  // Swap grids
  let temp = grid;
  grid = nextGrid;
  nextGrid = temp;
  
  // Trigger synths
  if (isPowerOn) {
    for(const cell of newlyBorn) {
      new PluckVoice(cell.r, cell.c);
    }
  }
}

// --------------------------------------------------------------------------
// Grid Canvas Rendering & Interaction
// --------------------------------------------------------------------------
let canvas, ctx;
let isDrawing = false;
let drawMode = 1;

function initGridCanvas() {
  canvas = document.getElementById('grid-canvas');
  if(!canvas) return;
  
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentNode.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  
  canvas.addEventListener('mousedown', handleGridDown);
  canvas.addEventListener('mousemove', handleGridMove);
  window.addEventListener('mouseup', handleGridUp);
  canvas.addEventListener('mouseleave', handleGridUp);
  
  requestAnimationFrame(drawGrid);
}

function getCellFromMouse(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const cellW = rect.width / COLS;
  const cellH = rect.height / ROWS;
  const c = Math.floor(mouseX / cellW);
  const r = Math.floor(mouseY / cellH);
  return {c, r};
}

function handleGridDown(e) {
  if(!isPowerOn) return;
  isDrawing = true;
  const {c, r} = getCellFromMouse(e);
  if(c >= 0 && c < COLS && r >= 0 && r < ROWS) {
    drawMode = grid[c][r] ? 0 : 1;
    grid[c][r] = drawMode;
    if(drawMode === 1) new PluckVoice(r, c);
  }
}

function handleGridMove(e) {
  if (!isDrawing) return;
  const {c, r} = getCellFromMouse(e);
  if(c >= 0 && c < COLS && r >= 0 && r < ROWS) {
    if (grid[c][r] !== drawMode) {
      grid[c][r] = drawMode;
      if(drawMode === 1) new PluckVoice(r, c);
    }
  }
}

function handleGridUp() {
  isDrawing = false;
}

function drawGrid(time) {
  // Boil the SVG scribble (10 frames per second roughly)
  if (time - lastBoilTime > 100 && turbulence) {
    turbulence.setAttribute('seed', Math.floor(Math.random() * 1000));
    lastBoilTime = time;
  }

  if (isSimPlaying && time - lastTickTime > simSpeed) {
    tick();
    lastTickTime = time;
  }
  
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const cellW = w / COLS;
  const cellH = h / ROWS;
  
  // Clear background
  ctx.clearRect(0, 0, w, h);
  
  // Faint dark grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for(let i=0; i<=COLS; i++) { ctx.moveTo(i*cellW, 0); ctx.lineTo(i*cellW, h); }
  for(let j=0; j<=ROWS; j++) { ctx.moveTo(0, j*cellH); ctx.lineTo(w, j*cellH); }
  ctx.stroke();
  
  // Draw Cells (Pink)
  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      if (grid[i][j] === 1) {
        ctx.fillStyle = '#ec4899';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ec4899';
        ctx.fillRect(i * cellW + 1, j * cellH + 1, cellW - 2, cellH - 2);
        ctx.shadowBlur = 0;
      }
    }
  }
  
  requestAnimationFrame(drawGrid);
}

// --------------------------------------------------------------------------
// UI Listeners
// --------------------------------------------------------------------------
document.getElementById('btn-play-sim')?.addEventListener('click', () => {
  isSimPlaying = !isSimPlaying;
  const icon = document.getElementById('play-icon');
  if(isSimPlaying) {
    icon.classList.remove('fa-play');
    icon.classList.add('fa-pause');
  } else {
    icon.classList.remove('fa-pause');
    icon.classList.add('fa-play');
  }
});

document.getElementById('btn-clear-sim')?.addEventListener('click', () => {
  grid = new Array(COLS).fill(0).map(() => new Array(ROWS).fill(0));
});

document.getElementById('btn-random-sim')?.addEventListener('click', () => {
  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      grid[i][j] = Math.random() > 0.85 ? 1 : 0;
    }
  }
});

document.getElementById('sim-speed')?.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  simSpeed = 550 - val; 
});

// FX Controls
document.getElementById('fx-chorus')?.addEventListener('input', (e) => {
  fxLevels.chorus = parseFloat(e.target.value);
  if(chorusMix) chorusMix.gain.value = fxLevels.chorus;
});
document.getElementById('fx-dist')?.addEventListener('input', (e) => {
  fxLevels.dist = parseFloat(e.target.value);
  if(distMix) distMix.gain.value = fxLevels.dist;
});
document.getElementById('fx-granular')?.addEventListener('input', (e) => {
  fxLevels.granular = parseFloat(e.target.value);
  if(granMix) granMix.gain.value = fxLevels.granular;
});
