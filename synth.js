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
  
  
  setTuning(type) {
    this.tuning = type;
    switch(type) {
      case 'major':
        // C Major: C D E F G A B
        this.scaleNotes = [84, 83, 81, 79, 77, 76, 74, 72, 71, 69, 67, 65, 64, 62, 60, 59];
        break;
      case 'minor':
        // C Natural Minor: C D Eb F G Ab Bb
        this.scaleNotes = [84, 82, 80, 79, 77, 75, 74, 72, 70, 68, 67, 65, 63, 62, 60, 58];
        break;
      case 'pentatonic':
        // C Minor Pentatonic: C Eb F G Bb
        this.scaleNotes = [84, 82, 79, 77, 75, 72, 70, 67, 65, 63, 60, 58, 55, 53, 51, 48];
        break;
      case 'lydian':
        // C Lydian: C D E F# G A B
        this.scaleNotes = [84, 83, 81, 79, 78, 76, 74, 72, 71, 69, 67, 66, 64, 62, 60, 59];
        break;
      case 'mixolydian':
        // C Mixolydian: C D E F G A Bb
        this.scaleNotes = [84, 82, 81, 79, 77, 76, 74, 72, 70, 69, 67, 65, 64, 62, 60, 58];
        break;
    }
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
    document.getElementById('sim-tuning')?.addEventListener('change', (e) => this.setTuning(e.target.value));
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
    this.iterations = 80;
    this.type = 'mandelbrot';
    this.tuning = 'harmonic';
    
    this.zoomLevel = 1.0;
    this.zoomSpeed = 1.01;
    this.zoomTargetX = -0.7436438870371587; 
    this.zoomTargetY = 0.13182590420531197;
    
    this.resolutionX = 256;
    this.resolutionY = 64;
    this.fractalData = [];
    this.imagePixels = null;
    
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
      
      // SYNC INITIAL STATE FROM DOM IN CASE USER CHANGED BEFORE POWER ON
      const typeEl = document.getElementById('fractal-type');
      if (typeEl) {
        this.type = typeEl.value;
        if (this.type === 'julia') {
          this.zoomTargetX = 0.0;
          this.zoomTargetY = 0.0;
        } else if (this.type === 'burning') {
          this.zoomTargetX = -1.75;
          this.zoomTargetY = -0.05;
        }
      }
      const tuneEl = document.getElementById('fractal-tuning');
      if (tuneEl) {
        this.tuning = tuneEl.value;
        this.applyTuning();
      }
      
      this.audioInit = true;
    }
    
    this.isActive = true;
    this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.1);
    
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
    this.isPlaying = false;
    const btn = document.getElementById('btn-play-fractal');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-wave-square"></i>';
  }
  
  buildFilterBank(ctx) {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    
    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = noiseBuffer;
    this.noiseSource.loop = true;
    
    this.filters = [];
    this.filterGains = [];
    
    for (let i = 0; i < this.resolutionY; i++) {
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = 40; 
      
      const g = ctx.createGain();
      g.gain.value = 0;
      
      const pan = ctx.createStereoPanner();
      pan.pan.value = (Math.random() * 0.8) - 0.4;
      
      this.noiseSource.connect(f);
      f.connect(g);
      g.connect(pan);
      pan.connect(this.masterGain);
      
      this.filters.push(f);
      this.filterGains.push(g);
    }
    
    this.applyTuning();
    this.noiseSource.start();
  }
  
  applyTuning() {
    const baseFreq = 65.41; 
    let freqs = [];
    
    if (this.tuning === 'harmonic') {
      for (let i = 1; i <= this.resolutionY; i++) {
        let freq = baseFreq * i;
        freqs.push(Math.min(freq, 22000));
      }
    } else if (this.tuning === 'pentatonic') {
      const notes = [36, 39, 41, 43, 46];
      for (let i = 0; i < this.resolutionY; i++) {
        const oct = Math.floor(i / 5);
        let freq = 440 * Math.pow(2, (notes[i % 5] + (oct * 12) - 69) / 12);
        freqs.push(Math.min(freq, 22000));
      }
    } else if (this.tuning === 'lydian') {
      const notes = [36, 38, 40, 42, 43, 45, 46];
      for (let i = 0; i < this.resolutionY; i++) {
        const oct = Math.floor(i / 7);
        let freq = 440 * Math.pow(2, (notes[i % 7] + (oct * 12) - 69) / 12);
        freqs.push(Math.min(freq, 22000));
      }
    }
    
    const ctx = globalAudioCtx;
    for (let i = 0; i < this.resolutionY; i++) {
      if(ctx) this.filters[i].frequency.setValueAtTime(freqs[i], ctx.currentTime);
    }
  }

  computeFractal() {
    this.fractalData = [];
    this.imagePixels = new Uint8ClampedArray(this.resolutionX * this.resolutionY * 4);
    
    let viewWidth = 3.0 / this.zoomLevel;
    let viewHeight = 2.0 / this.zoomLevel;
    let startX = this.zoomTargetX - viewWidth / 2;
    let startY = this.zoomTargetY - viewHeight / 2;
    
    for(let x = 0; x < this.resolutionX; x++) {
      let col = [];
      for(let y = 0; y < this.resolutionY; y++) {
        
        let cx = startX + (x / this.resolutionX) * viewWidth;
        let cy = startY + (y / this.resolutionY) * viewHeight;
        let zx = 0.0, zy = 0.0;
        let iteration = 0;
        
        if (this.type === 'julia') {
          zx = cx; zy = cy;
          cx = -0.4; cy = 0.6;
        }
        
        while (zx*zx + zy*zy <= 4 && iteration < this.iterations) {
          let xtemp = zx*zx - zy*zy + cx;
          zy = 2*zx*zy + cy;
          if (this.type === 'burning') {
            zy = Math.abs(2*zx*zy) + cy;
            zx = Math.abs(xtemp);
          } else {
            zx = xtemp;
          }
          iteration++;
        }
        
        let val = 0;
        if (iteration < this.iterations) {
          val = (Math.sin(iteration * 0.7) + 1.0) / 2.0; 
          val = Math.pow(val, 3);
          if (isNaN(val)) val = 0;
        }
        
        col.push(val);
        
        let drawY = this.resolutionY - 1 - y;
        let pxIndex = (drawY * this.resolutionX + x) * 4;
        this.imagePixels[pxIndex] = 236 * val;
        this.imagePixels[pxIndex+1] = 72 * val;
        this.imagePixels[pxIndex+2] = 153 * val;
        this.imagePixels[pxIndex+3] = 255;
      }
      this.fractalData.push(col);
    }
  }
  
  triggerEnvelope() {
    if(!this.audioInit || !this.isActive) return;
    
    this.isPlaying = !this.isPlaying;
    const btn = document.getElementById('btn-play-fractal');
    const ctx = globalAudioCtx;
    
    if (this.isPlaying) {
      btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
      // CLEAR ANY PREVIOUS RAMPS TO 0!
      for (let y = 0; y < this.resolutionY; y++) {
        this.filterGains[y].gain.cancelScheduledValues(ctx.currentTime);
      }
    } else {
      btn.innerHTML = '<i class="fa-solid fa-wave-square"></i>';
      for (let y = 0; y < this.resolutionY; y++) {
        this.filterGains[y].gain.cancelScheduledValues(ctx.currentTime);
        this.filterGains[y].gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
      }
    }
  }
  
  initCanvas() {
    this.canvas = document.getElementById('fractal-canvas');
    if(!this.canvas) return;
    this.canvas.width = this.resolutionX; 
    this.canvas.height = this.resolutionY;
    this.ctx = this.canvas.getContext('2d');
  }
  
  drawFractal(time) {
    if (!this.isActive) return;
    
    this.computeFractal();
    
    this.zoomLevel *= this.zoomSpeed;
    if (this.zoomLevel > 100000) { 
      this.zoomLevel = 1.0;
    }
    
    if (this.imagePixels) {
      let idata = new ImageData(this.imagePixels, this.resolutionX, this.resolutionY);
      this.ctx.putImageData(idata, 0, 0);
    }
    
    if (this.isPlaying) {
      let progress = (performance.now() % 2000) / 2000;
      let cursorX = progress * this.resolutionX;
      
      this.ctx.beginPath();
      this.ctx.moveTo(cursorX, 0);
      this.ctx.lineTo(cursorX, this.resolutionY);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      
      const ctx = globalAudioCtx;
      const now = ctx.currentTime;
      let xIndex = Math.floor(cursorX);
      if (xIndex >= 0 && xIndex < this.resolutionX && this.fractalData[xIndex]) {
        for (let y = 0; y < this.resolutionY; y++) {
          let val = this.fractalData[xIndex][y];
          // Use setTargetAtTime for smooth, glitch-free continuous changes
          // Multiply by 0.6 to compensate for tight Q=40 filters
          this.filterGains[y].gain.setTargetAtTime(val * 0.6, now, 0.015);
        }
      }
    }
    
    requestAnimationFrame((t) => this.drawFractal(t));
  }
  
  bindUI() {
    document.getElementById('btn-play-fractal')?.addEventListener('click', () => {
      this.triggerEnvelope();
    });
    
    document.getElementById('fractal-type')?.addEventListener('change', (e) => {
      this.type = e.target.value;
      this.zoomLevel = 1.0;
      
      if (this.type === 'julia') {
        this.zoomTargetX = 0.0;
        this.zoomTargetY = 0.0;
      } else if (this.type === 'burning') {
        this.zoomTargetX = -1.75;
        this.zoomTargetY = -0.05;
      } else {
        this.zoomTargetX = -0.7436438870371587;
        this.zoomTargetY = 0.13182590420531197;
      }
    });
    
    document.getElementById('fractal-tuning')?.addEventListener('change', (e) => {
      this.tuning = e.target.value;
      this.applyTuning();
    });
    
    document.getElementById('fractal-zoom')?.addEventListener('input', (e) => {
      let val = parseInt(e.target.value);
      if (val === 1) {
        this.zoomSpeed = 1.0; 
      } else {
        this.zoomSpeed = 1.0 + (val / 1500.0);
      }
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
