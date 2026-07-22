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
    this.seedGrid();
    this.buildDynamicKeyboard();
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
        this.triggerEnvelope();
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
  

  buildDynamicKeyboard() {
    const container = document.getElementById('rd-keyboard');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Base pitch C2 = 65.41 Hz
    const baseFreq = 65.41;
    
    // Match Waveshaper exactly (1 octave, C to C)
    const keysDef = [
      { noteOffset: 0, type: 'natural', label: 'A' },
      { noteOffset: 1, type: 'accidental', label: 'W' },
      { noteOffset: 2, type: 'natural', label: 'S' },
      { noteOffset: 3, type: 'accidental', label: 'E' },
      { noteOffset: 4, type: 'natural', label: 'D' },
      { noteOffset: 5, type: 'natural', label: 'F' },
      { noteOffset: 6, type: 'accidental', label: 'T' },
      { noteOffset: 7, type: 'natural', label: 'G' },
      { noteOffset: 8, type: 'accidental', label: 'Y' },
      { noteOffset: 9, type: 'natural', label: 'H' },
      { noteOffset: 10, type: 'accidental', label: 'U' },
      { noteOffset: 11, type: 'natural', label: 'J' },
      { noteOffset: 12, type: 'natural', label: 'K' }
    ];
    
    const numWhiteKeys = keysDef.filter(k => k.type === 'natural').length; // 8
    let naturalIndex = 0;
    
    let keyElements = [];
    let blackKeys = [];
    
    const keyMap = {};
    
    keysDef.forEach((keyDef) => {
      keyMap[keyDef.label.toLowerCase()] = keyDef.noteOffset;
      let pitch = baseFreq * Math.pow(2, keyDef.noteOffset / 12);
      
      let key = document.createElement('div');
      key.dataset.pitch = pitch;
      
      let label = document.createElement('div');
      label.className = 'key-label';
      label.innerText = keyDef.label;
      label.style.position = 'absolute';
      label.style.bottom = '10px';
      label.style.width = '100%';
      label.style.textAlign = 'center';
      label.style.fontSize = '0.7rem';
      label.style.pointerEvents = 'none';
      
      if (keyDef.type === 'accidental') {
        key.className = 'key black-key';
        key.style.position = 'absolute';
        key.style.width = `calc((100% / ${numWhiteKeys}) * 0.7)`;
        key.style.height = '60%';
        key.style.background = '#ff7eb3';
        key.style.border = 'none';
        key.style.borderRadius = '0 0 4px 4px';
        key.style.zIndex = '2';
        key.style.left = `calc((100% / ${numWhiteKeys}) * ${naturalIndex} - ((100% / ${numWhiteKeys}) * 0.35))`;
        label.style.color = 'rgba(0,0,0,0.5)';
        key.appendChild(label);
        blackKeys.push(key);
      } else {
        key.className = 'key white-key';
        key.style.position = 'relative';
        key.style.display = 'inline-block';
        key.style.width = `calc(100% / ${numWhiteKeys})`;
        key.style.height = '100%';
        key.style.background = '#1a1a1a';
        key.style.border = '1px solid #333';
        key.style.borderTop = 'none';
        key.style.borderRadius = '0 0 6px 6px';
        key.style.zIndex = '1';
        label.style.color = '#666';
        key.appendChild(label);
        keyElements.push(key);
        naturalIndex++;
      }
      
      // Bind interactions
      const trigger = (e) => {
        if(e.type !== 'mouseenter' || e.buttons > 0) {
          if(!this.isPlaying) return;
          const now = globalAudioCtx.currentTime;
          if(this.osc) this.osc.frequency.setTargetAtTime(pitch, now, 0.02);
          if(this.sub) this.sub.frequency.setTargetAtTime(pitch / 2, now, 0.02);
          
          key.style.background = keyDef.type === 'accidental' ? '#ffb3d9' : '#333';
          setTimeout(() => {
            key.style.background = keyDef.type === 'accidental' ? '#ff7eb3' : '#1a1a1a';
          }, 150);
        }
      };
      
      key.addEventListener('mousedown', trigger);
      key.addEventListener('mouseenter', trigger);
      key.addEventListener('touchstart', (e) => { e.preventDefault(); trigger(e); }, {passive: false});
    });
    
    // Append white keys
    keyElements.forEach(k => container.appendChild(k));
    // Append black keys on top
    blackKeys.forEach(k => container.appendChild(k));
    
    // Bind computer keyboard
    window.addEventListener('keydown', (e) => {
      if(!this.isPlaying || !this.isActive) return;
      let noteOffset = keyMap[e.key.toLowerCase()];
      if (noteOffset !== undefined) {
        let pitch = baseFreq * Math.pow(2, noteOffset / 12);
        const now = globalAudioCtx.currentTime;
        if(this.osc) this.osc.frequency.setTargetAtTime(pitch, now, 0.02);
        if(this.sub) this.sub.frequency.setTargetAtTime(pitch / 2, now, 0.02);
        
        // Find matching key and highlight it
        const keys = container.querySelectorAll('.key');
        keys.forEach(k => {
          if (Math.abs(parseFloat(k.dataset.pitch) - pitch) < 0.1) {
            const isBlack = k.classList.contains('black-key');
            k.style.background = isBlack ? '#ffb3d9' : '#333';
            setTimeout(() => {
              k.style.background = isBlack ? '#ff7eb3' : '#1a1a1a';
            }, 150);
          }
        });
      }
    });
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
    
    this.isPlaying = !this.isPlaying;
    const btn = document.getElementById('btn-play-rd');
    const ctx = globalAudioCtx;
    
    if (this.isPlaying) {
      btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
      this.oscGain.gain.cancelScheduledValues(ctx.currentTime);
      this.oscGain.gain.setTargetAtTime(1.0, ctx.currentTime, 0.05);
    } else {
      btn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
      this.oscGain.gain.cancelScheduledValues(ctx.currentTime);
      this.oscGain.gain.setTargetAtTime(0.0, ctx.currentTime, 0.1);
    }
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
          waveform[y] = Math.sin(b * drive * Math.PI);
          
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
    this.buildDynamicKeyboard(); // Reset with new parameters
  }
  
  bindUI() {
    document.getElementById('btn-play-rd')?.addEventListener('click', () => {
      this.triggerEnvelope();
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
    
    window.addEventListener('resize', () => {
      if (this.isActive) {
        this.buildDynamicKeyboard();
      }
    });
    
    // Theremin Pitch Tracking
    document.getElementById('canvas-rd')?.addEventListener('mousemove', (e) => {
      if(!this.isPlaying || !this.osc) return;
      let rect = e.target.getBoundingClientRect();
      let mouseY = (e.clientY - rect.top) / rect.height; // 0 to 1
      // Map to pitch: Bottom = 27.5Hz (Low A), Top = 220Hz (A3)
      let basePitch = 27.5 * Math.pow(2, (1.0 - mouseY) * 3); 
      let now = globalAudioCtx.currentTime;
      this.osc.frequency.setTargetAtTime(basePitch, now, 0.05);
      this.sub.frequency.setTargetAtTime(basePitch / 2, now, 0.05);
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
  track.style.transform = `translateX(-${currentIndex * 100}%)`;
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentIndex);
  });
}

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

