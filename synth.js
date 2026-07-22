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
      this.drawRandomPattern();
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

  drawRandomPattern() {
    const pulsar = [
      "  ###   ###  ",
      "             ",
      "#    # #    #",
      "#    # #    #",
      "#    # #    #",
      "  ###   ###  ",
      "             ",
      "  ###   ###  ",
      "#    # #    #",
      "#    # #    #",
      "#    # #    #",
      "             ",
      "  ###   ###  "
    ];

    // The Acorn is a famous "Methuselah" pattern. 
    // Just 7 active cells that run for over 5000 generations!
    const acorn = [
      " #     ",
      "   #   ",
      "##  ###"
    ];

    const gliderFleet = [
      " #     #     ",
      "  #     #    ",
      "###   ###    ",
      "             ",
      "    #     #  ",
      "     #     # ",
      "   ###   ### ",
      "             ",
      "       #     ",
      "        #    ",
      "      ###    "
    ];

    const alien = [
      "   ##        ##   ",
      "    ##      ##    ",
      "  ##############  ",
      " ###  ######  ### ",
      "##################",
      " # ###### ###### #",
      " # #          #  #",
      "   #          #   "
    ];

    const rpentomino = [
      " ##",
      "## ",
      " # "
    ];

    const diehard = [
      "      # ",
      "##      ",
      " #   ###"
    ];

    const glider = [
      " # ",
      "  #",
      "###"
    ];

    const patterns = [pulsar, acorn, gliderFleet, alien, rpentomino, diehard, glider];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    const w = pattern[0].length;
    const h = pattern.length;
    const startX = Math.floor((this.COLS - w) / 2);
    const startY = Math.floor((this.ROWS - h) / 2);
    
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        if (pattern[j][i] === '#') {
          const x = (startX + i + this.COLS) % this.COLS;
          const y = (startY + j + this.ROWS) % this.ROWS;
          this.grid[x][y] = 1;
        }
      }
    }
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
    
    // 8-Bit Bitcrusher
    this.distMix = ctx.createGain();
    this.distMix.gain.value = this.fxLevels.dist;
    this.distNode = ctx.createWaveShaper();
    const bits = 4; // 4-bit depth for that crunchy NES sound!
    const steps = Math.pow(2, bits);
    const n = 44100; 
    const curve = new Float32Array(n);
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curve[i] = Math.round(x * steps) / steps; // Quantize the wave
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
      // Support touch events
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const r = this.canvas.getBoundingClientRect();
      return { c: Math.floor((clientX - r.left) / (r.width / this.COLS)), r: Math.floor((clientY - r.top) / (r.height / this.ROWS)) };
    };

    const startDraw = (e) => {
      if(!this.isActive) return; 
      isDrawing = true;
      const {c, r} = getCell(e);
      if(c>=0 && c<this.COLS && r>=0 && r<this.ROWS) { 
        drawMode = this.grid[c][r] ? 0 : 1; 
        this.grid[c][r] = drawMode; 
        if(drawMode) this.playVoice(r,c); 
      }
    };

    const doDraw = (e) => {
      if(!isDrawing) return; 
      const {c, r} = getCell(e);
      if(c>=0 && c<this.COLS && r>=0 && r<this.ROWS && this.grid[c][r] !== drawMode) { 
        this.grid[c][r] = drawMode; 
        if(drawMode) this.playVoice(r,c); 
      }
    };

    const stopDraw = () => isDrawing = false;

    this.canvas.addEventListener('mousedown', startDraw);
    this.canvas.addEventListener('mousemove', doDraw);
    window.addEventListener('mouseup', stopDraw);

    this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDraw(e); }, {passive: false});
    this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); doDraw(e); }, {passive: false});
    window.addEventListener('touchend', stopDraw);
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
class ReactionDiffusionSynth {
  constructor() {
    this.isActive = false;
    this.audioInit = false;
    
    // Grid resolution (keep small for real-time 60fps)
    this.width = 128;
    this.height = 64;
    
    // Gray-Scott parameters
    this.feed = 0.0367;
    this.kill = 0.0649;
    this.dA = 1.0;
    this.dB = 0.5;
    this.dt = 1.0;
    this.simSpeed = 5;
    this.wavefold = 5.0;
    this.foldLfo = false;
    
    this.gridA = new Float32Array(this.width * this.height);
    this.gridB = new Float32Array(this.width * this.height);
    this.nextA = new Float32Array(this.width * this.height);
    this.nextB = new Float32Array(this.width * this.height);
    
    this.imagePixels = new Uint8ClampedArray(this.width * this.height * 4);
    
    this.isPlaying = false;
    this.type = 'mitosis';
    this.frameCount = 0;
    this.currentStyle = 'rock';
    this.currentStep = 0;
    this.bpm = 120;
    this.sequencerInterval = null;
    this.seedGrid();
    this.setupGroovebox();
  }
  
  seedGrid() {
    for (let i = 0; i < this.width * this.height; i++) {
      this.gridA[i] = 1.0;
      this.gridB[i] = 0.0;
    }
    
    // Seed center with B
    const cx = Math.floor(this.width / 2);
    const cy = Math.floor(this.height / 2);
    const radius = 10;
    
    for (let x = cx - radius; x < cx + radius; x++) {
      for (let y = cy - radius; y < cy + radius; y++) {
        if ((x-cx)*(x-cx) + (y-cy)*(y-cy) < radius*radius) {
          if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.gridB[y * this.width + x] = 1.0;
          }
        }
      }
    }
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
      
      const typeEl = document.getElementById('rd-type');
      if (typeEl) {
        this.setType(typeEl.value);
      }
      this.audioInit = true;
    }
    
    this.isActive = true;
    this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.1);
    
    document.getElementById('rd-overlay').classList.add('hidden');
    document.getElementById('rd-power-indicator').classList.add('is-on');
    
    // Automatically trigger the sound/scan-line on power-up
    if (!this.isPlaying) {
        // Just start visualizer, don't play sound yet
    }
    
    requestAnimationFrame(() => this.simulateAndDraw());
  }
  
  stop() {
    this.isActive = false;
    if (this.audioInit && globalAudioCtx) {
      const ct = globalAudioCtx.currentTime;
      this.masterGain.gain.cancelScheduledValues(ct);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, ct);
      this.masterGain.gain.exponentialRampToValueAtTime(0.001, ct + 2.0);
    }
    document.getElementById('rd-overlay').classList.remove('hidden');
    document.getElementById('rd-power-indicator').classList.remove('is-on');
    this.isPlaying = false;
    const btn = document.getElementById('btn-play-rd');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-wave-square"></i>';
  }
  

  setupGroovebox() {
    const buildPattern = (bpm, bassFunc, kickFunc, snareFunc, hatFunc, extraFunc) => {
      const p = { bpm, bass: new Array(256).fill(0), kick: new Array(256).fill(0), snare: new Array(256).fill(0), hat: new Array(256).fill(0) };
      for (let i = 0; i < 256; i++) {
        p.bass[i] = bassFunc(i);
        p.kick[i] = kickFunc(i);
        p.snare[i] = snareFunc(i);
        p.hat[i] = hatFunc(i);
        if (extraFunc) extraFunc(i, p);
      }
      return p;
    };

    this.patterns = {
      rock: buildPattern(110, 
        (i) => {
          let bar = Math.floor(i / 16);
          let note = (bar < 8) ? 32.7 : ((bar < 12) ? 43.65 : 49.0); // C minor, F minor, G minor
          if (bar === 7 && i % 16 >= 8) return (i % 2 === 0) ? note * 1.5 : 0; // Fill
          if (bar === 15 && i % 16 >= 12) return note * 2; // High fill
          if (i % 4 === 0) return note; // Root
          if (i % 4 === 2) return note * 2; // Octave up
          return 0;
        },
        (i) => {
          let bar = Math.floor(i / 16);
          if (bar === 7 || bar === 15) return (i % 16 === 0 || i % 16 === 8 || i % 16 === 14) ? 1 : 0; // Fill kick
          return (i % 16 === 0 || i % 16 === 8) ? 1 : (i % 16 === 14 && Math.floor(i/16)%2===1 ? 1 : 0);
        },
        (i) => {
          let bar = Math.floor(i / 16);
          if (bar === 7 && i % 16 >= 12) return (i % 2 === 0) ? 1 : 0; // Snare roll
          if (bar === 15 && i % 16 >= 8) return (i % 2 === 0) ? 1 : 0; // Big snare fill
          return (i % 16 === 4 || i % 16 === 12) ? 1 : 0;
        },
        (i) => (i % 2 === 0) ? 1 : 0,
        (i, p) => {
          if (!p.ride) p.ride = new Array(256).fill(0);
          if (i % 64 === 0) p.ride[i] = 1; // Crash on the 1!
        }
      ),
      pop: buildPattern(120, 
        (i) => {
          let bar = Math.floor(i / 16);
          // Pop progression: vi - IV - I - V (A min, F, C, G)
          let note = (bar % 4 === 0) ? 55.0 : ((bar % 4 === 1) ? 43.65 : ((bar % 4 === 2) ? 32.7 : 49.0));
          if (bar === 7 && i % 16 === 8) return note * 1.5; // Slide up
          if (bar === 15 && i % 16 === 0) return note / 2; // Big drop
          if (i % 16 === 0 || i % 16 === 3 || i % 16 === 8) return note;
          return 0;
        },
        (i) => (i % 16 === 0 || i % 16 === 10) ? 1 : 0,
        (i) => (i % 16 === 4 || i % 16 === 12) ? 1 : 0,
        (i) => (i % 4 === 2) ? 1 : 0
      ),
      blues: buildPattern(75, 
        (i) => {
          let bar = Math.floor(i / 16);
          // 12 bar blues in A (55.0): I, I, I, I, IV, IV, I, I, V, IV, I, V
          let root = 55.0; // A
          if (bar === 4 || bar === 5 || bar === 9) root = 73.42; // D
          if (bar === 8 || bar === 11) root = 82.41; // E
          // Turnaround in bar 11-12
          if (bar === 11 && i % 16 >= 8) return 55.0; 
          let walk = [root, 0, root * 1.2, 0, root * 1.25, 0, root * 1.2, 0, root, 0, root * 1.2, 0, root * 1.25, 0, root * 1.2, 0];
          return walk[i % 16];
        },
        (i) => (i % 16 === 0 || i % 16 === 11) ? 1 : 0,
        (i) => (i % 16 === 4 || i % 16 === 12) ? 1 : 0,
        (i) => 0,
        (i, p) => {
          if (!p.ride) p.ride = new Array(256).fill(0);
          p.ride[i] = (i % 4 === 0 || i % 4 === 3) ? 1 : 0; // Swing ride
        }
      ),
      bossa: buildPattern(130, 
        (i) => {
          let bar = Math.floor(i / 16);
          let root = (bar % 2 === 0) ? 41.2 : 49.0; // E to G
          if (bar === 7 || bar === 15) {
             // Syncopated change
             if (i % 16 === 0 || i % 16 === 6 || i % 16 === 12) return root * 1.5;
             return 0;
          }
          if (i % 16 === 0) return root;
          if (i % 16 === 8) return root * 1.5; // Fifth
          return 0;
        },
        (i) => (i % 16 === 0 || i % 16 === 8) ? 1 : 0, // Kick on 1 and 3
        (i) => {
          let bar = Math.floor(i / 16);
          if (bar === 7 || bar === 15) return (i % 16 === 0 || i % 16 === 6 || i % 16 === 12) ? 1 : 0; // Fill
          return (i % 16 === 3 || i % 16 === 6 || i % 16 === 10 || i % 16 === 14) ? 1 : 0; // Clave snare
        },
        (i) => (i % 2 === 0) ? 1 : 0,
        (i, p) => {
          if (!p.tom) p.tom = new Array(256).fill(0);
          if (i % 32 === 30 || i % 32 === 28) p.tom[i] = 1;
        }
      )
    };
    
    // Bind buttons
    const btns = document.querySelectorAll('.style-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        btns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentStyle = e.target.dataset.style;
        this.bpm = this.patterns[this.currentStyle].bpm;
        if(this.isPlaying) {
          this.stopSequencer();
          this.startSequencer();
        }
      });
    });
  }

  startSequencer() {
    this.currentStep = 0;
    this.bpm = this.patterns[this.currentStyle].bpm;
    
    // We use a simple JS interval for the prototype. In production, use Web Audio lookahead.
    const runStep = () => {
      if(!this.isPlaying) return;
      this.playStep();
      this.currentStep = (this.currentStep + 1) % 256;
      
      const stepTime = (60 / this.bpm) / 4; 
      this.sequencerInterval = setTimeout(runStep, stepTime * 1000);
    };
    runStep();
  }

  stopSequencer() {
    if(this.sequencerInterval) {
      clearTimeout(this.sequencerInterval);
      this.sequencerInterval = null;
    }
  }

  playStep() {
    if (!this.audioInit || !globalAudioCtx) return;
    const now = globalAudioCtx.currentTime;
    const pattern = this.patterns[this.currentStyle];
    
    const b = pattern.bass[this.currentStep];
    if (b > 0) {
      if(this.osc) this.osc.frequency.setValueAtTime(b, now);
      if(this.sub) this.sub.frequency.setValueAtTime(b / 2, now);
      this.triggerEnvelope();
    }
    
    if (pattern.kick[this.currentStep]) this.playKick(now);
    if (pattern.snare[this.currentStep]) this.playSnare(now);
    if (pattern.hat[this.currentStep]) this.playHat(now);
    if (pattern.ride && pattern.ride[this.currentStep]) this.playRide(now);
    if (pattern.tom && pattern.tom[this.currentStep]) this.playTom(now);
  }

  // --- DRUM SYNTHESIS ---
  playKick(time) {
    const ctx = globalAudioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    gain.gain.setValueAtTime(1.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    osc.start(time);
    osc.stop(time + 0.5);
  }

  playSnare(time) {
    const ctx = globalAudioCtx;
    // Noise burst
    const noiseSize = ctx.sampleRate * 0.2; // 200ms
    const buffer = ctx.createBuffer(1, noiseSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < noiseSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    
    // Tone
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, time);
    
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    
    noise.start(time);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  playHat(time) {
    const ctx = globalAudioCtx;
    const ratio = 1.2;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'square';
    osc2.type = 'square';
    osc1.frequency.value = 400 * ratio;
    osc2.frequency.value = 520 * ratio;

    const gain = ctx.createGain();
    const bandpass = ctx.createBiquadFilter();
    const highpass = ctx.createBiquadFilter();

    bandpass.type = 'bandpass';
    bandpass.frequency.value = 10000;
    highpass.type = 'highpass';
    highpass.frequency.value = 7000;

    osc1.connect(bandpass);
    osc2.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(gain);
    gain.connect(this.masterGain);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.05);
    osc2.stop(time + 0.05);
  }

  playRide(time) {
    const ctx = globalAudioCtx;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'square';
    osc2.type = 'square';
    osc1.frequency.value = 600;
    osc2.frequency.value = 850;

    const gain = ctx.createGain();
    const bandpass = ctx.createBiquadFilter();
    const highpass = ctx.createBiquadFilter();

    bandpass.type = 'bandpass';
    bandpass.frequency.value = 8000;
    highpass.type = 'highpass';
    highpass.frequency.value = 5000;

    osc1.connect(bandpass);
    osc2.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(gain);
    gain.connect(this.masterGain);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.8);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.8);
    osc2.stop(time + 0.8);
  }

  playTom(time) {
    const ctx = globalAudioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.frequency.setValueAtTime(100, time);
    osc.frequency.exponentialRampToValueAtTime(50, time + 0.3);
    
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    
    osc.start(time);
    osc.stop(time + 0.3);
  }

  buildFilterBank(ctx) {
    this.osc = ctx.createOscillator();
    this.osc.frequency.value = 55.0; 
    
    this.sub = ctx.createOscillator();
    this.sub.type = 'sine';
    this.sub.frequency.value = 27.5;
    
    this.oscGain = ctx.createGain();
    this.oscGain.gain.value = 1.0; // Start unmuted
    
    this.subGain = ctx.createGain();
    this.subGain.gain.value = 0.5;
    
    this.lowpass = ctx.createBiquadFilter();
    this.lowpass.type = 'lowpass';
    this.lowpass.frequency.value = 2500;
    this.lowpass.Q.value = 1.0;
    
    // Routing
    this.osc.connect(this.oscGain);
    this.sub.connect(this.subGain);
    this.subGain.connect(this.oscGain);
    
    this.oscGain.connect(this.lowpass);
    
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(ctx.destination);
    
    this.lowpass.connect(this.masterGain);
    
    this.osc.start();
    this.sub.start();
  }
  
  // Custom Discrete Fourier Transform for 64 points
  computeDFT(timeDomain) {
    const N = timeDomain.length;
    const real = new Float32Array(N / 2 + 1);
    const imag = new Float32Array(N / 2 + 1);
    
    for (let k = 0; k <= N / 2; k++) {
      let r = 0;
      let i = 0;
      for (let n = 0; n < N; n++) {
        const angle = (2 * Math.PI * k * n) / N;
        r += timeDomain[n] * Math.cos(angle);
        i -= timeDomain[n] * Math.sin(angle);
      }
      real[k] = r / N;
      imag[k] = i / N;
    }
    return { real, imag };
  }
  
  triggerEnvelope() {
    if(!this.audioInit || !this.isActive) return;
    
    const ctx = globalAudioCtx;
    const now = ctx.currentTime;
    
    // Simple plucked bass envelope
    this.oscGain.gain.cancelScheduledValues(now);
    this.oscGain.gain.setValueAtTime(0, now);
    this.oscGain.gain.linearRampToValueAtTime(1.0, now + 0.02);
    this.oscGain.gain.exponentialRampToValueAtTime(0.01, now + (60 / this.bpm) * 0.8);
  }
  
  initCanvas() {
    this.canvas = document.getElementById('rd-canvas');
    if(!this.canvas) return;
    this.canvas.width = this.width; 
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d');
  }
  
  laplacian(grid, x, y) {
    let sum = 0;
    sum += grid[y * this.width + x] * -1.0;
    
    const left = x === 0 ? this.width - 1 : x - 1;
    const right = x === this.width - 1 ? 0 : x + 1;
    const up = y === 0 ? this.height - 1 : y - 1;
    const down = y === this.height - 1 ? 0 : y + 1;
    
    sum += grid[y * this.width + left] * 0.2;
    sum += grid[y * this.width + right] * 0.2;
    sum += grid[up * this.width + x] * 0.2;
    sum += grid[down * this.width + x] * 0.2;
    
    sum += grid[up * this.width + left] * 0.05;
    sum += grid[up * this.width + right] * 0.05;
    sum += grid[down * this.width + left] * 0.05;
    sum += grid[down * this.width + right] * 0.05;
    
    return sum;
  }
  
  step() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = y * this.width + x;
        const a = this.gridA[idx];
        const b = this.gridB[idx];
        
        const lapA = this.laplacian(this.gridA, x, y);
        const lapB = this.laplacian(this.gridB, x, y);
        
        const abb = a * b * b;
        
        // Add a slow, traveling sine-wave LFO to the feed rate.
        // This causes "waves of fertility" to travel across the grid, 
        // forcing stable patterns to endlessly expand, contract, and break apart!
        let currentFeed = this.feed + Math.sin(this.frameCount * 0.03 + (x * 0.15) + (y * 0.1)) * 0.008;
        
        this.nextA[idx] = a + (this.dA * lapA - abb + currentFeed * (1 - a)) * this.dt;
        this.nextB[idx] = b + (this.dB * lapB + abb - (this.kill + currentFeed) * b) * this.dt;
        
        // Constrain
        this.nextA[idx] = Math.max(0, Math.min(1, this.nextA[idx]));
        this.nextB[idx] = Math.max(0, Math.min(1, this.nextB[idx]));
      }
    }
    
    // Swap buffers
    const tempA = this.gridA;
    this.gridA = this.nextA;
    this.nextA = tempA;
    
    const tempB = this.gridB;
    this.gridB = this.nextB;
    this.nextB = tempB;
  }
  
  simulateAndDraw() {
    if (!this.isActive) return;
    
    this.frameCount++;
    // Drop a new seed every 120 frames to keep the ecosystem alive and dynamic
    if (this.frameCount % 120 === 0) {
      let rx = Math.floor(Math.random() * this.width);
      let ry = Math.floor(Math.random() * this.height);
      for (let x = rx - 5; x < rx + 5; x++) {
        for (let y = ry - 5; y < ry + 5; y++) {
          if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.gridB[y * this.width + x] = 1.0;
          }
        }
      }
    }
    
    for (let i = 0; i < this.simSpeed; i++) {
      this.step();
    }
    
    for (let i = 0; i < this.width * this.height; i++) {
      const b = this.gridB[i];
      
      
      const pxIndex = i * 4;
      // Chemical A is the "ocean", Chemical B is the "organism"
      let valB = Math.min(1.0, b * 3.0); // Boost B
      let valA = Math.max(0.0, this.gridA[i]);       // A is usually 0 to 1
      
      // B = Green/Teal. A = Deep Blue
      let r = valB * 30 + valA * 10;
      let g = valB * 200 + valA * 30;
      let bl = valB * 150 + valA * 150;
      
      this.imagePixels[pxIndex] = Math.min(255, r);
      this.imagePixels[pxIndex+1] = Math.min(255, g);
      this.imagePixels[pxIndex+2] = Math.min(255, bl);
      this.imagePixels[pxIndex+3] = 255;
    }
    
    if (this.imagePixels) {
      let idata = new ImageData(this.imagePixels, this.width, this.height);
      this.ctx.putImageData(idata, 0, 0);
    }
    
    if (this.isPlaying) {
      let progress = (performance.now() % 4000) / 4000;
      let cursorX = progress * this.width;
      
      this.ctx.beginPath();
      this.ctx.moveTo(cursorX, 0);
      this.ctx.lineTo(cursorX, this.height);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      
      const ctx = globalAudioCtx;
      let xIndex = Math.floor(cursorX);
      if (xIndex >= 0 && xIndex < this.width && this.isPlaying) {
        // Extract 64-sample waveform from the current vertical column
        let waveform = new Float32Array(this.height);
        let hasSignal = false;
        
        for (let y = 0; y < this.height; y++) {
          let b = this.gridB[y * this.width + xIndex];
          
          // WAVEFOLDING: We amplify the soft biological blob by the wavefold amount, 
          // then wrap it back around using Math.sin. This forces smooth gradients 
          // to ripple wildly, generating extreme high-end harmonic complexity!
          let drive = this.wavefold;
          if (this.foldLfo) {
            // Sweep wavefold up and down by 15.0 to create breathing PWM grit
            drive += Math.sin(this.frameCount * 0.03) * 15.0;
            drive = Math.max(1.0, drive); 
          }
          
          let a = this.gridA[y * this.width + xIndex];
          // Chemical Phase Distortion (Asymmetrical Overdrive)
          // As Chemical A (food) increases, it shifts the phase of the wavefolder,
          // morphing the distortion from perfectly symmetrical fuzz (odd harmonics)
          // into an asymmetrical tube-like warmth (even harmonics).
          waveform[y] = Math.sin((b * drive + (a * 0.75)) * Math.PI);
          
          if (b > 0.01) hasSignal = true;
        }
        
        // If there's no pattern here, just stay silent
        if (hasSignal) {
          // Perform Discrete Fourier Transform to get harmonics
          let { real, imag } = this.computeDFT(waveform);
          // Set DC offset to 0
          real[0] = 0; 
          imag[0] = 0;
          
          try {
            let wave = ctx.createPeriodicWave(real, imag, {disableNormalization: false});
            this.osc.setPeriodicWave(wave);
          } catch(e) {
            console.error(e);
          }
        }
      }
    }
    
    requestAnimationFrame(() => this.simulateAndDraw());
  }
  
  setType(val) {
    this.type = val;
    if (val === 'mitosis') {
      this.feed = 0.03;
      this.kill = 0.062;
    } else if (val === 'coral') {
      this.feed = 0.045;
      this.kill = 0.06;
    } else if (val === 'labyrinth') {
      this.feed = 0.029;
      this.kill = 0.057;
    }
    this.seedGrid();
  }
  
  bindUI() {
    const playBtn = document.getElementById('btn-play-rd');
    playBtn?.addEventListener('click', () => {
      if (this.isPlaying) {
        this.isPlaying = false;
        this.stopSequencer();
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        playBtn.style.color = '#cbd5e1';
      } else {
        this.isPlaying = true;
        this.startSequencer();
        playBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
        playBtn.style.color = '#ef4444';
      }
    });
    
    document.getElementById('rd-type')?.addEventListener('change', (e) => {
      this.setType(e.target.value);
    });
    
    document.getElementById('rd-speed')?.addEventListener('input', (e) => {
      let val = parseInt(e.target.value); // 1 to 100
      this.simSpeed = Math.floor(val / 10) + 1; // 1 to 10 steps per frame
    });
    
    document.getElementById('rd-fold')?.addEventListener('input', (e) => {
      this.wavefold = parseFloat(e.target.value);
    });
    
    document.getElementById('rd-sub')?.addEventListener('input', (e) => {
      if(this.subGain) this.subGain.gain.setTargetAtTime(parseFloat(e.target.value), globalAudioCtx.currentTime, 0.05);
    });
    
    document.getElementById('rd-cutoff')?.addEventListener('input', (e) => {
      if(this.lowpass) this.lowpass.frequency.setTargetAtTime(parseFloat(e.target.value), globalAudioCtx.currentTime, 0.05);
    });
    
    document.getElementById('rd-res')?.addEventListener('input', (e) => {
      if(this.lowpass) this.lowpass.Q.setTargetAtTime(parseFloat(e.target.value), globalAudioCtx.currentTime, 0.05);
    });
    

    
    document.getElementById('rd-lfo')?.addEventListener('change', (e) => {
      this.foldLfo = e.target.checked;
    });
  }
}

/* --------------------------------------------------------------------------
   CAROUSEL CONTROLLER
   -------------------------------------------------------------------------- */
const modules = [
  { 
    start: () => {}, 
    stop: () => {
      const iframe = document.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage('suspend', '*');
      }
    } 
  },
  new GenerativeAutomata(),
  new ReactionDiffusionSynth()
];
let currentIndex = 0;

// The UI buttons correspond to modules[1] and modules[2] now
document.getElementById('btn-start-audio').addEventListener('click', () => modules[1].start());
document.getElementById('btn-start-fractal').addEventListener('click', () => modules[2].start());

const track = document.getElementById('carousel-track');
const dots = document.querySelectorAll('.carousel-dots .dot');

function updateCarousel() {
  const slides = document.querySelectorAll('.carousel-slide');
  if (slides.length > 0) {
    const slideWidth = slides[0].clientWidth;
    track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
  }
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentIndex);
  });
}

window.addEventListener('resize', () => {
  updateCarousel();
});

dots.forEach((dot, index) => {
  dot.addEventListener('click', () => {
    if (index === currentIndex) return;
    modules[currentIndex].stop();
    currentIndex = index;
    updateCarousel();
  });
});

document.getElementById('carousel-prev').addEventListener('click', () => {
  modules[currentIndex].stop();
  currentIndex = (currentIndex - 1 + modules.length) % modules.length;
  updateCarousel();
});
document.getElementById('carousel-next').addEventListener('click', () => {
  modules[currentIndex].stop();
  currentIndex = (currentIndex + 1) % modules.length;
  updateCarousel();
});

// Swipe Logic for Mobile
let touchStartX = 0;
let touchEndX = 0;
let isSwipeAllowed = true;

track.addEventListener('touchstart', e => {
  const target = e.target;
  // If user touches a slider or canvas, disable swiping so they can interact!
  if (target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'canvas') {
    isSwipeAllowed = false;
    return;
  }
  isSwipeAllowed = true;
  touchStartX = e.changedTouches[0].screenX;
}, {passive: true});

track.addEventListener('touchend', e => {
  if (!isSwipeAllowed) return;
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
}, {passive: true});

function handleSwipe() {
  const threshold = 50; // minimum distance to be considered a swipe
  if (touchEndX < touchStartX - threshold) {
    // Swipe Left (Next)
    modules[currentIndex].stop();
    currentIndex = (currentIndex + 1) % modules.length;
    updateCarousel();
  }
  if (touchEndX > touchStartX + threshold) {
    // Swipe Right (Prev)
    modules[currentIndex].stop();
    currentIndex = (currentIndex - 1 + modules.length) % modules.length;
    updateCarousel();
  }
}

// Handle swipe messages from iframe
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SWIPE') {
    if (e.data.direction === 'left') {
      modules[currentIndex].stop();
      currentIndex = (currentIndex + 1) % modules.length;
      updateCarousel();
    } else if (e.data.direction === 'right') {
      modules[currentIndex].stop();
      currentIndex = (currentIndex - 1 + modules.length) % modules.length;
      updateCarousel();
    }
  }
});

// --------------------------------------------------------------------------
// HEADER AUTO-HIDE LOGIC
// --------------------------------------------------------------------------
const header = document.querySelector('.site-header');
let hideTimeout;
if (header) {
  function showHeader() {
    header.classList.remove('is-hidden');
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      // Only auto-hide if scrolled down a bit to prevent hiding at the very top if desired,
      // but the user requested it to just hide after 2 seconds.
      header.classList.add('is-hidden');
    }, 2000);
  }

  // Initial trigger
  showHeader();

  // Show header on scroll, touch, or mouse movement
  window.addEventListener('scroll', showHeader, {passive: true});
  window.addEventListener('mousemove', showHeader, {passive: true});
  window.addEventListener('touchstart', showHeader, {passive: true});
}

