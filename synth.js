/* --------------------------------------------------------------------------
   EVAN SWOPE DIGITAL - LAB CORE (Modular Synths)
   -------------------------------------------------------------------------- */

let globalAudioCtx = null;

function getAudioCtx() {
  if (!globalAudioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    globalAudioCtx = new AudioContext();
  }
  return globalAudioCtx;
}

/* --------------------------------------------------------------------------
   MODULE 1: GENERATIVE AUTOMATA
   -------------------------------------------------------------------------- */
class GenerativeAutomata {
  constructor() {
    this.isActive = false;
    this.COLS = 32;
    this.ROWS = 16;
    this.grid = new Array(this.COLS).fill(0).map(() => new Array(this.ROWS).fill(0));
    this.nextGrid = new Array(this.COLS).fill(0).map(() => new Array(this.ROWS).fill(0));
    this.isSimPlaying = false;
    this.simSpeed = 150;
    this.lastTickTime = 0;
    
    this.scaleNotes = [84, 82, 79, 77, 75, 72, 70, 67, 65, 63, 60, 58, 55, 53, 51, 48];
    this.fxLevels = { chorus: 0, dist: 0, granular: 0 };
    
    this.audioInit = false;
  }
  
  async start() {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    
    if (!this.audioInit) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = 0.0; 
      
      this.buildFXRack(ctx);
      
      this.masterLimiter = ctx.createDynamicsCompressor();
      this.masterLimiter.threshold.setValueAtTime(-5, ctx.currentTime);
      this.masterLimiter.knee.setValueAtTime(0, ctx.currentTime);
      this.masterLimiter.ratio.setValueAtTime(20, ctx.currentTime);
      this.masterLimiter.attack.setValueAtTime(0.005, ctx.currentTime);
      this.masterLimiter.release.setValueAtTime(0.05, ctx.currentTime);
      
      this.masterGain.connect(this.masterLimiter);
      this.masterLimiter.connect(ctx.destination);
      if (this.fxBus) this.fxBus.connect(this.masterLimiter);
      
      this.initCanvas();
      this.bindUI();
      this.audioInit = true;
    }
    
    this.isActive = true;
    this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
    
    document.getElementById('audio-start-overlay').classList.add('hidden');
    document.getElementById('power-indicator').classList.add('is-on');
    requestAnimationFrame((t) => this.drawGrid(t));
  }
  
  stop() {
    this.isActive = false;
    if (this.audioInit && globalAudioCtx) {
      const ct = globalAudioCtx.currentTime;
      this.masterGain.gain.cancelScheduledValues(ct);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, ct);
      this.masterGain.gain.exponentialRampToValueAtTime(0.001, ct + 2.0);
    }
    document.getElementById('audio-start-overlay').classList.remove('hidden');
    document.getElementById('power-indicator').classList.remove('is-on');
  }

  buildFXRack(ctx) {
    this.fxBus = ctx.createGain();
    this.fxBus.gain.value = 1.0;
    
    // Chorus
    this.chorusMix = ctx.createGain();
    this.chorusMix.gain.value = this.fxLevels.chorus;
    this.chorusDelay = ctx.createDelay(0.1);
    this.chorusDelay.delayTime.value = 0.03;
    this.chorusLfo = ctx.createOscillator();
    this.chorusLfo.type = 'sine';
    this.chorusLfo.frequency.value = 1.5;
    const chorusDepth = ctx.createGain();
    chorusDepth.gain.value = 0.005;
    this.chorusLfo.connect(chorusDepth);
    chorusDepth.connect(this.chorusDelay.delayTime);
    this.chorusLfo.start();
    this.masterGain.connect(this.chorusDelay);
    this.chorusDelay.connect(this.chorusMix);
    this.chorusMix.connect(this.fxBus);
    
    // Dist
    this.distMix = ctx.createGain();
    this.distMix.gain.value = this.fxLevels.dist;
    this.distNode = ctx.createWaveShaper();
    const k = 80; const n = 44100; const curve = new Float32Array(n); const deg = Math.PI / 180;
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    this.distNode.curve = curve;
    this.masterGain.connect(this.distNode);
    this.distNode.connect(this.distMix);
    this.distMix.connect(this.fxBus);
    
    // Granular
    this.granMix = ctx.createGain();
    this.granMix.gain.value = this.fxLevels.granular;
    for(let i=0; i<3; i++) {
      const d = ctx.createDelay(2.0);
      d.delayTime.value = 0.15 + (i * 0.13); 
      const fb = ctx.createGain();
      fb.gain.value = 0.6 + (Math.random() * 0.2);
      const pan = ctx.createStereoPanner();
      pan.pan.value = -0.8 + (i * 0.8); 
      this.masterGain.connect(d); d.connect(fb); fb.connect(d); d.connect(pan); pan.connect(this.granMix);
    }
    this.granMix.connect(this.fxBus);
  }

  playVoice(r, c) {
    if (!this.isActive || !globalAudioCtx) return;
    const ctx = globalAudioCtx;
    const freq = 440 * Math.pow(2, (this.scaleNotes[r % this.scaleNotes.length] - 69) / 12);
    const filterFreq = 300 + ((c / (this.COLS - 1)) * 2700);
    
    const osc = ctx.createOscillator();
    osc.type = 'triangle'; osc.frequency.value = freq;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(Math.max(100, filterFreq - 1000), ctx.currentTime + 0.3);
    
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    
    const pan = ctx.createStereoPanner(); pan.pan.value = (Math.random() * 0.6) - 0.3;
    
    osc.connect(filter); filter.connect(gain); gain.connect(pan); pan.connect(this.masterGain);
    osc.start();
    setTimeout(() => { osc.stop(); osc.disconnect(); filter.disconnect(); gain.disconnect(); pan.disconnect(); }, 700);
  }
  
  tick() {
    if (!this.isActive) return;
    let newlyBorn = [];
    for (let i = 0; i < this.COLS; i++) {
      for (let j = 0; j < this.ROWS; j++) {
        let sum = 0;
        for (let x = -1; x < 2; x++) {
          for (let y = -1; y < 2; y++) sum += this.grid[(i + x + this.COLS) % this.COLS][(j + y + this.ROWS) % this.ROWS];
        }
        sum -= this.grid[i][j];
        if (this.grid[i][j] === 0 && sum === 3) { this.nextGrid[i][j] = 1; newlyBorn.push({c: i, r: j}); }
        else if (this.grid[i][j] === 1 && (sum < 2 || sum > 3)) this.nextGrid[i][j] = 0;
        else this.nextGrid[i][j] = this.grid[i][j];
      }
    }
    let temp = this.grid; this.grid = this.nextGrid; this.nextGrid = temp;
    for(const cell of newlyBorn) this.playVoice(cell.r, cell.c);
  }
  
  initCanvas() {
    this.canvas = document.getElementById('grid-canvas');
    if(!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentNode.getBoundingClientRect();
    this.canvas.width = rect.width * dpr; this.canvas.height = rect.height * dpr;
    this.ctx = this.canvas.getContext('2d'); this.ctx.scale(dpr, dpr);
    
    let isDrawing = false; let drawMode = 1;
    const getCell = (e) => {
      const r = this.canvas.getBoundingClientRect();
      return { c: Math.floor((e.clientX - r.left) / (r.width / this.COLS)), r: Math.floor((e.clientY - r.top) / (r.height / this.ROWS)) };
    };
    this.canvas.addEventListener('mousedown', (e) => {
      if(!this.isActive) return; isDrawing = true;
      const {c, r} = getCell(e);
      if(c>=0 && c<this.COLS && r>=0 && r<this.ROWS) { drawMode = this.grid[c][r] ? 0 : 1; this.grid[c][r] = drawMode; if(drawMode) this.playVoice(r,c); }
    });
    this.canvas.addEventListener('mousemove', (e) => {
      if(!isDrawing) return; const {c, r} = getCell(e);
      if(c>=0 && c<this.COLS && r>=0 && r<this.ROWS && this.grid[c][r] !== drawMode) { this.grid[c][r] = drawMode; if(drawMode) this.playVoice(r,c); }
    });
    window.addEventListener('mouseup', () => isDrawing = false);
  }
  
  drawGrid(time) {
    if (!this.isActive) return;
    if (this.isSimPlaying && time - this.lastTickTime > this.simSpeed) { this.tick(); this.lastTickTime = time; }
    
    const w = this.canvas.width / (window.devicePixelRatio || 1); const h = this.canvas.height / (window.devicePixelRatio || 1);
    const cellW = w / this.COLS; const cellH = h / this.ROWS;
    
    this.ctx.clearRect(0, 0, w, h);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; this.ctx.lineWidth = 1; this.ctx.beginPath();
    for(let i=0; i<=this.COLS; i++) { this.ctx.moveTo(i*cellW, 0); this.ctx.lineTo(i*cellW, h); }
    for(let j=0; j<=this.ROWS; j++) { this.ctx.moveTo(0, j*cellH); this.ctx.lineTo(w, j*cellH); }
    this.ctx.stroke();
    
    for (let i = 0; i < this.COLS; i++) {
      for (let j = 0; j < this.ROWS; j++) {
        if (this.grid[i][j] === 1) {
          this.ctx.fillStyle = '#ec4899'; this.ctx.shadowBlur = 10; this.ctx.shadowColor = '#ec4899';
          this.ctx.fillRect(i * cellW + 1, j * cellH + 1, cellW - 2, cellH - 2); this.ctx.shadowBlur = 0;
        }
      }
    }
    requestAnimationFrame((t) => this.drawGrid(t));
  }
  
  bindUI() {
    document.getElementById('btn-play-sim')?.addEventListener('click', () => {
      this.isSimPlaying = !this.isSimPlaying;
      const icon = document.getElementById('play-icon');
      icon.className = this.isSimPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    });
    document.getElementById('btn-clear-sim')?.addEventListener('click', () => { this.grid = new Array(this.COLS).fill(0).map(() => new Array(this.ROWS).fill(0)); });
    document.getElementById('btn-random-sim')?.addEventListener('click', () => {
      for (let i = 0; i < this.COLS; i++) for (let j = 0; j < this.ROWS; j++) this.grid[i][j] = Math.random() > 0.85 ? 1 : 0;
    });
    document.getElementById('sim-speed')?.addEventListener('input', (e) => this.simSpeed = 550 - parseFloat(e.target.value));
    document.getElementById('fx-chorus')?.addEventListener('input', (e) => { this.fxLevels.chorus = parseFloat(e.target.value); if(this.chorusMix) this.chorusMix.gain.value = this.fxLevels.chorus; });
    document.getElementById('fx-dist')?.addEventListener('input', (e) => { this.fxLevels.dist = parseFloat(e.target.value); if(this.distMix) this.distMix.gain.value = this.fxLevels.dist; });
    document.getElementById('fx-granular')?.addEventListener('input', (e) => { this.fxLevels.granular = parseFloat(e.target.value); if(this.granMix) this.granMix.gain.value = this.fxLevels.granular; });
  }
}

/* --------------------------------------------------------------------------
   MODULE 2: FRACTAL SUBTRACTIVE SYNTH
   -------------------------------------------------------------------------- */
class FractalSynth {
  constructor() {
    this.isActive = false;
    this.audioInit = false;
    this.iterations = 50;
    this.type = 'mandelbrot';
    this.fractalData = []; // 1D array of 0.0 to 1.0 values
    this.resolution = 256;
    this.isPlaying = false;
  }
  
  async start() {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    
    if (!this.audioInit) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = 0.0;
      this.masterGain.connect(ctx.destination);
      
      this.buildFilterBank(ctx);
      this.initCanvas();
      this.bindUI();
      this.computeFractal();
      this.audioInit = true;
    }
    
    this.isActive = true;
    this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.1);
    
    document.getElementById('fractal-overlay').classList.add('hidden');
    document.getElementById('fractal-power-indicator').classList.add('is-on');
    requestAnimationFrame((t) => this.drawFractal(t));
  }
  
  stop() {
    this.isActive = false;
    if (this.audioInit && globalAudioCtx) {
      const ct = globalAudioCtx.currentTime;
      this.masterGain.gain.cancelScheduledValues(ct);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, ct);
      this.masterGain.gain.exponentialRampToValueAtTime(0.001, ct + 2.0);
    }
    document.getElementById('fractal-overlay').classList.remove('hidden');
    document.getElementById('fractal-power-indicator').classList.remove('is-on');
  }
  
  buildFilterBank(ctx) {
    // Generate white noise buffer
    const bufferSize = ctx.sampleRate * 2; // 2 seconds
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    
    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = noiseBuffer;
    this.noiseSource.loop = true;
    
    // Create 32-Band Harmonic Filter Bank (C2 base)
    this.filters = [];
    this.filterGains = [];
    const baseFreq = 65.41; // C2
    
    for (let i = 1; i <= 32; i++) {
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = baseFreq * i; // Harmonic series!
      f.Q.value = 20; // High Q for resonant pitch
      
      const g = ctx.createGain();
      g.gain.value = 0;
      
      this.noiseSource.connect(f);
      f.connect(g);
      g.connect(this.masterGain);
      
      this.filters.push(f);
      this.filterGains.push(g);
    }
    this.noiseSource.start();
  }
  
  computeFractal() {
    this.fractalData = [];
    for(let i = 0; i < this.resolution; i++) {
      // 1D slice across the X axis
      let x0 = -2.0 + (i / this.resolution) * 3.0; // from -2 to +1
      let y0 = 0.0;
      let x = 0.0, y = 0.0;
      let iteration = 0;
      
      if (this.type === 'julia') {
        x = x0; y = y0;
        x0 = -0.4; y0 = 0.6;
      }
      
      while (x*x + y*y <= 4 && iteration < this.iterations) {
        let xtemp = x*x - y*y + x0;
        y = 2*x*y + y0;
        if (this.type === 'burning') {
          xtemp = x*x - y*y + x0;
          y = Math.abs(2*x*y) + y0;
          x = Math.abs(xtemp);
        } else {
          x = xtemp;
        }
        iteration++;
      }
      // Normalize to 0.0 - 1.0
      this.fractalData.push(iteration / this.iterations);
    }
  }
  
  triggerEnvelope() {
    if(!this.audioInit || !this.isActive) return;
    const ctx = globalAudioCtx;
    const now = ctx.currentTime;
    
    // The envelope plays over 4 seconds, stepping through the 256 fractal values
    const duration = 4.0; 
    const stepTime = duration / this.resolution;
    
    for (let b = 0; b < 32; b++) {
      this.filterGains[b].gain.cancelScheduledValues(now);
      this.filterGains[b].gain.setValueAtTime(0, now);
    }
    
    for(let i=0; i<this.resolution; i++) {
      let val = this.fractalData[i]; // 0 to 1
      let time = now + (i * stepTime);
      
      // Carve the frequencies based on the fractal value!
      // If val is high, higher harmonics ring out.
      const activeBand = Math.floor(val * 31);
      
      for (let b = 0; b < 32; b++) {
        // Create a spectral "bump" around the active band
        const distance = Math.abs(b - activeBand);
        let bandGain = Math.max(0, 1.0 - (distance * 0.2)); 
        this.filterGains[b].gain.linearRampToValueAtTime(bandGain * 0.1, time);
      }
    }
    
    // Silence at end
    for (let b = 0; b < 32; b++) {
      this.filterGains[b].gain.linearRampToValueAtTime(0, now + duration + 0.1);
    }
  }
  
  initCanvas() {
    this.canvas = document.getElementById('fractal-canvas');
    if(!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentNode.getBoundingClientRect();
    this.canvas.width = rect.width * dpr; this.canvas.height = rect.height * dpr;
    this.ctx = this.canvas.getContext('2d'); this.ctx.scale(dpr, dpr);
  }
  
  drawFractal(time) {
    if (!this.isActive) return;
    const w = this.canvas.width / (window.devicePixelRatio || 1); 
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    
    this.ctx.clearRect(0, 0, w, h);
    
    // Draw the 1D slice as a wave/envelope
    this.ctx.beginPath();
    this.ctx.moveTo(0, h);
    for(let i=0; i<this.resolution; i++) {
      let x = (i / this.resolution) * w;
      let y = h - (this.fractalData[i] * h * 0.9);
      this.ctx.lineTo(x, y);
    }
    this.ctx.lineTo(w, h);
    this.ctx.fillStyle = 'rgba(236,72,153, 0.2)';
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#ec4899';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    requestAnimationFrame((t) => this.drawFractal(t));
  }
  
  bindUI() {
    document.getElementById('btn-play-fractal')?.addEventListener('click', () => {
      this.triggerEnvelope();
    });
    document.getElementById('fractal-type')?.addEventListener('change', (e) => {
      this.type = e.target.value;
      this.computeFractal();
    });
    document.getElementById('fractal-iters')?.addEventListener('input', (e) => {
      this.iterations = parseInt(e.target.value);
      this.computeFractal();
    });
  }
}

/* --------------------------------------------------------------------------
   CAROUSEL CONTROLLER
   -------------------------------------------------------------------------- */
const modules = [
  new GenerativeAutomata(),
  new FractalSynth()
];
let currentIndex = 0;

document.getElementById('btn-start-audio').addEventListener('click', () => modules[0].start());
document.getElementById('btn-start-fractal').addEventListener('click', () => modules[1].start());

const track = document.getElementById('carousel-track');
document.getElementById('carousel-prev').addEventListener('click', () => {
  if (currentIndex > 0) {
    modules[currentIndex].stop();
    currentIndex--;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
  }
});
document.getElementById('carousel-next').addEventListener('click', () => {
  if (currentIndex < modules.length - 1) {
    modules[currentIndex].stop();
    currentIndex++;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
  }
});
