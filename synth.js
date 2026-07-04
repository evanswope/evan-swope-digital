/* --------------------------------------------------------------------------
   GENERATIVE AUTOMATA SEQUENCER (synth.js)
   -------------------------------------------------------------------------- */

let audioCtx;
let masterGain;
let isPowerOn = false;

// Grid State
const COLS = 32;
const ROWS = 16;
let grid = new Array(COLS).fill(0).map(() => new Array(ROWS).fill(0));
let nextGrid = new Array(COLS).fill(0).map(() => new Array(ROWS).fill(0));
let isSimPlaying = false;
let simSpeed = 150; // ms per tick
let lastTickTime = 0;

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

// Musical Scale (C Minor Pentatonic across 16 rows)
// C3 to C6 roughly. Higher rows = lower pitch visually? Let's make Top row = High pitch
const scaleNotes = [
  84, 82, 79, 77, 75, // C6, Bb5, G5, F5, Eb5
  72, 70, 67, 65, 63, // C5, Bb4, G4, F4, Eb4
  60, 58, 55, 53, 51, // C4, Bb3, G3, F3, Eb3
  48                  // C3
];

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

  initGridCanvas();
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
    
    // Pitch based on Row (Y-axis)
    const midiNote = scaleNotes[row % scaleNotes.length];
    const freq = noteToFreq(midiNote);
    
    // Panning based on Column (X-axis)
    // -1.0 (Left) to 1.0 (Right)
    const panValue = ((col / (COLS - 1)) * 2.0) - 1.0;
    
    this.osc = audioCtx.createOscillator();
    this.osc.type = 'triangle'; // Nice muted pluck tone
    this.osc.frequency.value = freq;
    
    this.gainNode = audioCtx.createGain();
    this.gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    
    // Fast attack, exponential decay for pluck
    this.gainNode.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 0.02);
    this.gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    
    this.panNode = audioCtx.createStereoPanner();
    this.panNode.pan.value = panValue;
    
    // Connect
    this.osc.connect(this.gainNode);
    
    // LFO Modulation routing
    const target = synthState.fx.lfoTarget;
    if (target === 'pitch') {
      lfoGain.connect(this.osc.detune);
      this.lfoConnectedDetune = true;
    } else if (target === 'volume') {
      lfoGain.connect(this.gainNode.gain);
      this.lfoConnectedGain = true;
    } else if (target === 'pan') {
      // Don't override our spatial panning, maybe add to it, but standard LFO might clobber it.
      // We will let the LFO just connect directly to the pan node.
      lfoGain.connect(this.panNode.pan);
      this.lfoConnectedPan = true;
    }
    
    this.gainNode.connect(this.panNode);
    this.panNode.connect(masterGain);
    
    this.osc.start();
    
    // Auto kill after decay
    setTimeout(() => {
      this.osc.stop();
      if (this.lfoConnectedDetune) lfoGain.disconnect(this.osc.detune);
      if (this.lfoConnectedGain) lfoGain.disconnect(this.gainNode.gain);
      if (this.lfoConnectedPan) lfoGain.disconnect(this.panNode.pan);
      this.osc.disconnect();
      this.gainNode.disconnect();
      this.panNode.disconnect();
    }, 600);
  }
}

// --------------------------------------------------------------------------
// Cellular Automata Simulation
// --------------------------------------------------------------------------
function countNeighbors(x, y) {
  let sum = 0;
  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      let col = (x + i + COLS) % COLS; // Wrap around edges
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
  
  // Trigger synths for newly born cells
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
let drawMode = 1; // 1 to draw, 0 to erase

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
    // Toggle state on click
    drawMode = grid[c][r] ? 0 : 1;
    grid[c][r] = drawMode;
    if(drawMode === 1) new PluckVoice(r, c); // Play note when drawn
  }
}

function handleGridMove(e) {
  if (!isDrawing) return;
  const {c, r} = getCellFromMouse(e);
  if(c >= 0 && c < COLS && r >= 0 && r < ROWS) {
    if (grid[c][r] !== drawMode) {
      grid[c][r] = drawMode;
      if(drawMode === 1) new PluckVoice(r, c); // Play note when drawn
    }
  }
}

function handleGridUp() {
  isDrawing = false;
}

function drawGrid(time) {
  if (isSimPlaying && time - lastTickTime > simSpeed) {
    tick();
    lastTickTime = time;
  }
  
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const cellW = w / COLS;
  const cellH = h / ROWS;
  
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, w, h);
  
  // Draw Grid Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for(let i=0; i<=COLS; i++) { ctx.moveTo(i*cellW, 0); ctx.lineTo(i*cellW, h); }
  for(let j=0; j<=ROWS; j++) { ctx.moveTo(0, j*cellH); ctx.lineTo(w, j*cellH); }
  ctx.stroke();
  
  // Draw Cells
  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      if (grid[i][j] === 1) {
        ctx.fillStyle = '#10b981'; // neon-green
        // Add a slight glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#10b981';
        // Padding inside cell
        ctx.fillRect(i * cellW + 1, j * cellH + 1, cellW - 2, cellH - 2);
        ctx.shadowBlur = 0;
      }
    }
  }
  
  requestAnimationFrame(drawGrid);
}

// --------------------------------------------------------------------------
// UI Listeners (Automata Controls)
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
  // Invert slider so right = faster (smaller ms)
  // min 50, max 500
  // If value is 500, we want speed to be 50.
  // If value is 50, we want speed to be 500.
  const val = parseFloat(e.target.value);
  simSpeed = 550 - val; 
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

// Remove Keyboard since this plays itself!
if (keyboardContainer) {
  keyboardContainer.style.opacity = '0.2';
  keyboardContainer.style.pointerEvents = 'none';
}
