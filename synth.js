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
    try {
      if (ctx.state === 'suspended') await ctx.resume();
    } catch (e) {
      console.warn("AudioContext resume blocked by browser autoplay policy", e);
    }
    
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
    this.currentKit = 'bus_stop';
    this.bpm = 90;
    this.frameCount = 0;
    this.sampleBuffers = {};
    this.samplesLoaded = false;
    this.seedGrid();
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
    
    // CSS-like padding style: width: 100%; gap: 1.5rem; padding: 0 75px;
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
  
  async loadBusStopSamples(ctx) {
    const samples = {
      0: 'Noisy Shut.wav',
      1: 'Wimpy Push.wav',
      2: 'Left Panned Rumble.wav',
      3: 'Shaker Single.wav',
      4: 'Detuned Twang.wav',
      5: 'Noisy Snare.wav',
      6: 'Distant Side Stick.wav',
      7: 'Wobble Gong Hit.wav',
      8: 'Noisy Hihat.wav',
      9: 'Heavy Noisy Kick.wav'
    };
    
    const promises = Object.entries(samples).map(async ([index, filename]) => {
      try {
        const response = await fetch(`samples/bus_stop/${filename}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        this.sampleBuffers[index] = audioBuffer;
      } catch (e) {
        console.error(`Failed to load sample ${filename}:`, e);
      }
    });
    
    await Promise.all(promises);
    this.samplesLoaded = true;
    console.log("Bus Stop samples loaded.");
  }
  
  async start() {
    const ctx = getAudioCtx();
    try {
      if (ctx.state === 'suspended') await ctx.resume();
    } catch (e) {
      console.warn("AudioContext resume blocked by browser autoplay policy", e);
    }
    
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
      
      this.loadBusStopSamples(ctx); // Load samples in the background
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
    this.lastStepTime = null;
    const btn = document.getElementById('btn-play-rd');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
  }
  

  // --- GENERATIVE POLYRHYTHM SYNTHESIS ---
  buildFilterBank(ctx) {
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(ctx.destination);
    
    // Foley Reverb
    this.foleyReverb = ctx.createConvolver();
    const length = ctx.sampleRate * 2.5; // 2.5 seconds tail
    const ir = ctx.createBuffer(2, length, ctx.sampleRate);
    for(let i=0; i<length; i++) {
      const decay = Math.exp(-i/(ctx.sampleRate*0.5));
      ir.getChannelData(0)[i] = (Math.random()*2-1) * decay;
      ir.getChannelData(1)[i] = (Math.random()*2-1) * decay;
    }
    this.foleyReverb.buffer = ir;
    this.foleyReverbGain = ctx.createGain();
    this.foleyReverbGain.gain.value = 0.7; // Wet mix
    this.foleyReverb.connect(this.foleyReverbGain);
    this.foleyReverbGain.connect(this.masterGain);
    
    // --- Bus Stop (Trip-Hop) Master Effects ---
    this.busStopBus = ctx.createGain();
    
    // Shared 2s Reverb for Pads 2 and 4
    this.shared2sReverb = ctx.createConvolver();
    const irLen = Math.floor(ctx.sampleRate * 2.0); 
    this.shared2sReverbBuffer = ctx.createBuffer(2, irLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const channel = this.shared2sReverbBuffer.getChannelData(ch);
      for (let i = 0; i < irLen; i++) channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - (i / irLen), 3);
    }
    this.shared2sReverb.buffer = this.shared2sReverbBuffer;
    this.shared2sReverbGain = ctx.createGain();
    this.shared2sReverbGain.gain.value = 0.6;
    this.shared2sReverb.connect(this.shared2sReverbGain);
    this.shared2sReverbGain.connect(this.busStopBus);

    
    // Tape Saturation (WaveShaper)
    this.tapeShaper = ctx.createWaveShaper();
    this.tapeShaper.curve = this.getDistortionCurve(10); // Soft clipping
    
    // Wow & Flutter (Delay modulated by LFO)
    this.wowFlutterDelay = ctx.createDelay(0.1);
    this.wowFlutterDelay.delayTime.value = 0.02; // 20ms base
    
    this.wowFlutterLFO = ctx.createOscillator();
    this.wowFlutterLFO.type = 'sine';
    this.wowFlutterLFO.frequency.value = 1.5; // 1.5 Hz wobble
    
    this.wowFlutterGain = ctx.createGain();
    this.wowFlutterGain.gain.value = 0.001; // Depth of pitch wobble
    
    this.wowFlutterLFO.connect(this.wowFlutterGain);
    this.wowFlutterGain.connect(this.wowFlutterDelay.delayTime);
    this.wowFlutterLFO.start();
    
    // Route: Bus -> Saturation -> Delay -> Master
    this.busStopBus.connect(this.tapeShaper);
    this.tapeShaper.connect(this.wowFlutterDelay);
    this.wowFlutterDelay.connect(this.masterGain);
    
    // Vinyl Crackle Generator (Continuous)
    this.vinylCrackleGain = ctx.createGain();
    this.vinylCrackleGain.gain.value = this.currentKit === 'bus_stop' ? 0.3 : 0; 
    this.vinylCrackleGain.connect(this.masterGain);
    
    const vinylLen = ctx.sampleRate * 10;
    const vinylBuf = ctx.createBuffer(1, vinylLen, ctx.sampleRate);
    const vData = vinylBuf.getChannelData(0);
    for(let i=0; i<vinylLen; i++) {
      vData[i] = (Math.random()*2-1) * 0.03; // Hiss
      if (Math.random() < 0.00015) { // Occasional crackle pop
        vData[i] += (Math.random()*2-1) * 0.8;
      }
    }
    
    this.vinylFilter = ctx.createBiquadFilter();
    this.vinylFilter.type = 'bandpass';
    this.vinylFilter.frequency.value = 800; // Muffled hiss
    this.vinylFilter.Q.value = 0.5;
    
    this.vinylSource = ctx.createBufferSource();
    this.vinylSource.buffer = vinylBuf;
    this.vinylSource.loop = true;
    this.vinylSource.connect(this.vinylFilter);
    this.vinylFilter.connect(this.vinylCrackleGain);
    this.vinylSource.start();
    
    // --- Glitchcore Master Effects ---
    // Digital Bitcrusher / Sample Rate Reducer for Glitch Kit
    this.glitchCrusher = ctx.createWaveShaper();
    // 3-bit depth for extreme crushed destruction
    const bits = 3;
    const steps = Math.pow(2, bits);
    const glitchCurve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const x = (i * 2 / 1024) - 1;
      glitchCurve[i] = Math.round(x * steps) / steps;
    }
    this.glitchCrusher.curve = glitchCurve;
    this.glitchCrusher.connect(this.masterGain);
    
    // We do not initialize 64 persistent voices anymore.
    // Drums are synthesized dynamically when triggered.
    this.audioInit = true;
  }

  getDistortionCurve(amount = 50) {
    if (!this.distCurves) this.distCurves = {};
    if (!this.distCurves[amount]) {
      const n_samples = 44100;
      const curve = new Float32Array(n_samples);
      const deg = Math.PI / 180;
      for (let i = 0; i < n_samples; ++i) {
        let x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
      }
      this.distCurves[amount] = curve;
    }
    return this.distCurves[amount];
  }

  playDrumBusStop(index, time, panVal) {
    const ctx = globalAudioCtx;
    if (!ctx) return;
    if (!this.samplesLoaded) return; // Wait for samples
    
    const panner = ctx.createStereoPanner();
    panner.pan.value = panVal;
    panner.connect(this.busStopBus || this.masterGain);
    
    const buffer = this.sampleBuffers[index];
    if (!buffer) return;
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    const gain = ctx.createGain();
    const shaper = ctx.createWaveShaper();
    const filter = ctx.createBiquadFilter();
    
    switch(index) {
      case 9: // Heavy Noisy Kick -> Pitched down, no saturation, tightened
        source.playbackRate.value = 0.8;
        filter.type = 'lowpass'; filter.frequency.value = 1000;
        
        const kickHp = ctx.createBiquadFilter();
        kickHp.type = 'highpass'; kickHp.frequency.value = 50; // Cut the sub boom
        
        source.connect(filter); filter.connect(kickHp); kickHp.connect(gain);
        gain.connect(panner);
        
        gain.gain.setValueAtTime(1.0, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3); // Tighten envelope
        break;
      case 8: // Noisy Hihat -> Highpassed, saturated
        source.playbackRate.value = 1.0;
        filter.type = 'highpass'; filter.frequency.value = 4000;
        shaper.curve = this.getDistortionCurve(100);
        source.connect(filter); filter.connect(shaper); shaper.connect(gain);
        gain.connect(panner);
        gain.gain.setValueAtTime(1.0, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15); // sharp decay
        break;
      case 7: { // Wobble Gong Hit -> Tiny, snappy, high-pitched
        source.playbackRate.value = 3.0; // Pitched way up
        
        filter.type = 'highpass'; filter.frequency.value = 4000;
        
        if (!this.pad7ReverbNode) {
          this.pad7ReverbNode = ctx.createConvolver();
          const irLen = Math.floor(ctx.sampleRate * 0.1); // 100ms tiny reverb
          this.pad7ReverbBuffer = ctx.createBuffer(2, irLen, ctx.sampleRate);
          for (let ch = 0; ch < 2; ch++) {
            const channel = this.pad7ReverbBuffer.getChannelData(ch);
            for (let i = 0; i < irLen; i++) channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - (i / irLen), 3);
          }
          this.pad7ReverbNode.buffer = this.pad7ReverbBuffer;
          
          const shaperNode = ctx.createWaveShaper();
          shaperNode.curve = this.getDistortionCurve(50); // Less distortion
          
          const wetGain = ctx.createGain();
          wetGain.gain.value = 0.5; // Lower wet level
          
          this.pad7ReverbNode.connect(shaperNode);
          shaperNode.connect(wetGain);
          wetGain.connect(this.busStopBus || this.masterGain);
        }
        
        source.connect(filter);
        
        const sourceGain = ctx.createGain();
        sourceGain.gain.setValueAtTime(1.0, time);
        sourceGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05); // Tiny snap envelope
        filter.connect(sourceGain);
        
        // Send to global reverb
        sourceGain.connect(this.pad7ReverbNode);
        
        // Dry signal
        sourceGain.connect(gain);
        gain.connect(panner);
        gain.gain.value = 1.0;
        
        // Add a couple delays at 2x and 3x octaves, spawning between 20-50ms
        for (let i = 0; i < 2; i++) {
          const stutterSource = ctx.createBufferSource();
          stutterSource.buffer = buffer;
          
          // 2x and 3x multiplier of the base 3.0 pitch
          stutterSource.playbackRate.value = 3.0 * (i + 2); 
          
          const stutterFilter = ctx.createBiquadFilter();
          stutterFilter.type = 'highpass'; stutterFilter.frequency.value = 4000;
          
          const stutterGain = ctx.createGain();
          const delaySecs = (20 + Math.random() * 30) / 1000; // 20ms to 50ms
          const startTime = time + delaySecs;
          
          stutterSource.connect(stutterFilter);
          stutterFilter.connect(stutterGain);
          
          // Give these stutters a tiny envelope
          stutterGain.gain.setValueAtTime(0, time);
          stutterGain.gain.setValueAtTime(1.0, startTime);
          stutterGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);
          
          stutterGain.connect(this.pad7ReverbNode);
          stutterGain.connect(panner);
          
          stutterSource.start(startTime);
        }
        break;
      }
      case 6: { // Distant Side Stick -> Pitched up, long reverb
        source.playbackRate.value = 1.5; 
        filter.type = 'highpass'; filter.frequency.value = 600; 
        shaper.curve = this.getDistortionCurve(50); 
        
        if (!this.pad6ReverbNode) {
          this.pad6ReverbNode = ctx.createConvolver();
          const irLen = Math.floor(ctx.sampleRate * 2.0); 
          this.pad6ReverbBuffer = ctx.createBuffer(2, irLen, ctx.sampleRate);
          for (let ch = 0; ch < 2; ch++) {
            const channel = this.pad6ReverbBuffer.getChannelData(ch);
            for (let i = 0; i < irLen; i++) channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - (i / irLen), 3);
          }
          this.pad6ReverbNode.buffer = this.pad6ReverbBuffer;
          
          const wetGain = ctx.createGain();
          wetGain.gain.value = 0.4;
          this.pad6ReverbNode.connect(wetGain);
          wetGain.connect(this.busStopBus || this.masterGain);
        }
        
        source.connect(filter); filter.connect(shaper); shaper.connect(gain);
        
        gain.connect(panner); // Dry
        gain.connect(this.pad6ReverbNode); // Send to global reverb
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(3.0, time + 0.005); 
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15); 
        gain.gain.linearRampToValueAtTime(0, time + 0.16); 
        
        // --- Delayed Octave-Up Chorus ---
        const chorusSource = ctx.createBufferSource();
        chorusSource.buffer = buffer;
        chorusSource.playbackRate.value = 1.5 * 2.0; // One octave above
        
        const chorusGain = ctx.createGain();
        chorusSource.connect(chorusGain);
        chorusGain.connect(panner);
        chorusGain.connect(this.pad6ReverbNode);
        
        const chorusTime = time + 0.033; // 33ms delay
        chorusGain.gain.setValueAtTime(0, time);
        chorusGain.gain.setValueAtTime(0, chorusTime);
        chorusGain.gain.linearRampToValueAtTime(1.5, chorusTime + 0.005); 
        chorusGain.gain.exponentialRampToValueAtTime(0.01, chorusTime + 0.15);
        chorusGain.gain.linearRampToValueAtTime(0, chorusTime + 0.16);
        
        chorusSource.start(chorusTime);
        break;
      }
      case 5: { // Spark plug mechanical stutter
        source.playbackRate.value = 3.5;
        
        filter.type = 'highpass'; 
        filter.frequency.value = 6000;
        
        shaper.curve = this.getDistortionCurve(1000); // Massive distortion for crackle
        
        source.connect(shaper); shaper.connect(filter); filter.connect(gain);
        gain.connect(panner);
        
        gain.gain.setValueAtTime(0, time); 
        gain.gain.linearRampToValueAtTime(0.8, time + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.055); // sharp snap
        
        // Mechanical spark plug stutter: 3-5 rapid fire hits
        const numSparks = 3 + Math.floor(Math.random() * 3); // 3 to 5 sparks
        for (let i = 0; i < numSparks; i++) {
          const sparkSource = ctx.createBufferSource();
          sparkSource.buffer = buffer;
          sparkSource.playbackRate.value = 3.5 + Math.random(); // slightly random pitch
          
          const sparkFilter = ctx.createBiquadFilter();
          sparkFilter.type = 'highpass';
          sparkFilter.frequency.value = 6000 + Math.random() * 2000; // Bright and randomized
          
          const sparkShaper = ctx.createWaveShaper();
          sparkShaper.curve = this.getDistortionCurve(1000);
          
          const sparkGain = ctx.createGain();
          
          // Tiny delay spacing for rapid stutter (approx 10-25ms spacing)
          const delaySecs = 0.01 + (i * (0.01 + Math.random() * 0.015));
          const startTime = time + delaySecs;
          
          sparkSource.connect(sparkShaper);
          sparkShaper.connect(sparkFilter);
          sparkFilter.connect(sparkGain);
          sparkGain.connect(panner); // Route through same panner
          
          // Tiny zaps
          sparkGain.gain.setValueAtTime(0, time);
          sparkGain.gain.setValueAtTime(0, startTime);
          sparkGain.gain.linearRampToValueAtTime(0.8, startTime + 0.005);
          sparkGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.035); // super tight
          
          sparkSource.start(startTime);
        }
        break;
      }
      case 4: { // Pneumatic Shriek
        const duration = 0.2 + Math.random() * 0.4; // Shorter: 0.2s to 0.6s
        
        // Pitch bend: down 3-6 semitones, then back up
        const bendAmountSemis = 3 + Math.random() * 3; // 3 to 6
        const startRate = 1.0;
        const lowRate = Math.pow(2, -bendAmountSemis / 12);
        
        source.playbackRate.setValueAtTime(startRate, time);
        source.playbackRate.exponentialRampToValueAtTime(lowRate, time + (duration / 2));
        source.playbackRate.exponentialRampToValueAtTime(startRate, time + duration);
        
        // High frequency noise element
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for(let i = 0; i < noiseBuffer.length; i++) noiseData[i] = Math.random() * 2 - 1;
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        
        // Clamping Filter
        const filterAmount = 3000 + Math.random() * 4000; // Random filtering clamp floor
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(12000, time); // start even brighter
        filter.frequency.exponentialRampToValueAtTime(filterAmount, time + (duration * 0.2)); // clamp down quickly
        filter.frequency.linearRampToValueAtTime(500, time + duration); // fade out filter
        filter.Q.value = 5.0; // resonant shriek
        
        const hpFilter = ctx.createBiquadFilter();
        hpFilter.type = 'highpass';
        hpFilter.frequency.value = 10000; // Even more highpass
        
        source.connect(filter);
        noiseSource.connect(filter);
        
        // Optional Fuzz
        shaper.curve = this.getDistortionCurve(50);
        
        filter.connect(hpFilter);
        hpFilter.connect(shaper);
        shaper.connect(gain);
        gain.connect(panner);
        
        // Volume Envelope
        const hitVelocity = 0.1 + (Math.random() * 0.19); // 0.1 to 0.29
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(hitVelocity, time + 0.05); // strong attack (randomized lower velocity)
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration); // fade to zero over duration
        
        noiseSource.start(time);
        
        // Add a scattered cluster of 5-10 tiny screeches to the front
        const numScreeches = 5 + Math.floor(Math.random() * 6);
        
        // 1. Distort to all hell (Shared processing chain)
        const screechShaper1 = ctx.createWaveShaper();
        screechShaper1.curve = this.getDistortionCurve(1000); 
        
        // 2. Comb filter (now sweeping down from 8000Hz to 2000Hz to act as a phaser over the cluster)
        const combDelay = ctx.createDelay();
        combDelay.delayTime.setValueAtTime(1.0 / (3.0 * 8000), time);
        combDelay.delayTime.exponentialRampToValueAtTime(1.0 / (3.0 * 2000), time + 0.1);
        const combFb = ctx.createGain();
        combFb.gain.value = 0.85; // heavy feedback
        combDelay.connect(combFb);
        combFb.connect(combDelay);
        const combSum = ctx.createGain();
        
        // 3. Distort again
        const screechShaper2 = ctx.createWaveShaper();
        screechShaper2.curve = this.getDistortionCurve(500);
        
        // 4. Sweeping bandpass
        const trackBp = ctx.createBiquadFilter();
        trackBp.type = 'bandpass';
        trackBp.Q.value = 8.0;
        trackBp.frequency.setValueAtTime(8000, time);
        trackBp.frequency.exponentialRampToValueAtTime(2000, time + 0.1);
        
        // Connect the shared chain
        screechShaper1.connect(combSum); // Dry to sum
        screechShaper1.connect(combDelay);
        combDelay.connect(combSum); // Wet to sum
        
        combSum.connect(screechShaper2);
        screechShaper2.connect(trackBp);
        
        const screechGain = ctx.createGain();
        screechGain.gain.setValueAtTime(0, time);
        screechGain.gain.linearRampToValueAtTime(0.4, time + 0.005);
        screechGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1); // slightly longer to fit the cluster
        
        trackBp.connect(screechGain);
        screechGain.connect(panner);
        
        const revSendPanner = ctx.createStereoPanner();
        revSendPanner.pan.value = (Math.random() * 2) - 1; // Random stereo spread
        screechGain.connect(revSendPanner);
        gain.connect(revSendPanner); // Send the main shriek to the reverb too!
        revSendPanner.connect(this.shared2sReverb);
        
        // Generate the 5-10 screeches and route them into the shredder
        for (let i = 0; i < numScreeches; i++) {
            const screechOsc = ctx.createOscillator();
            screechOsc.type = 'sawtooth';
            screechOsc.frequency.value = 5000 + (Math.random() * 3000); // 5000Hz - 8000Hz
            
            const sOffset = Math.random() * 0.05; // Scatter them over the first 50ms
            const sTime = time + sOffset;
            const sDur = 0.01 + (Math.random() * 0.03); // super fast 10ms-40ms bursts
            
            const sGain = ctx.createGain();
            sGain.gain.setValueAtTime(0, sTime);
            sGain.gain.linearRampToValueAtTime(0.15, sTime + 0.005); // very quiet individually
            sGain.gain.exponentialRampToValueAtTime(0.01, sTime + sDur);
            
            screechOsc.connect(sGain);
            sGain.connect(screechShaper1);
            
            screechOsc.start(sTime);
            screechOsc.stop(sTime + sDur + 0.01);
        }
        
        break;
      }
      case 3: // Shaker Single -> Metallic highpass
        source.playbackRate.value = 1.5;
        filter.type = 'highpass'; filter.frequency.value = 5000; filter.Q.value = 5.0;
        source.connect(filter); filter.connect(gain);
        gain.connect(panner);
        
        gain.gain.value = 0;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.8, time + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        break;
      case 2: { // Bandpassed High Texture with stutters
        source.playbackRate.value = 3.0 + (Math.random() * 2.0); // Pitched way up
        const baseFreq = 3000 + Math.random() * 5000; // 3000Hz - 8000Hz
        
        filter.type = 'bandpass'; 
        filter.frequency.value = baseFreq;
        filter.Q.value = 2.0; // Tame the noise with a gentle resonant peak
        
        source.connect(filter); filter.connect(gain);
        gain.connect(panner);
        
        const mainRevSendPanner = ctx.createStereoPanner();
        mainRevSendPanner.pan.value = (Math.random() * 2) - 1;
        gain.connect(mainRevSendPanner);
        mainRevSendPanner.connect(this.shared2sReverb);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(2.925, time + 0.005); // increased velocity by 50% AGAIN
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);
        
        // Spawn 3 extra delays of the sample at random times and speeds
        for (let i = 0; i < 3; i++) {
          const stutterSource = ctx.createBufferSource();
          stutterSource.buffer = buffer;
          
          // Random play speed in the high register
          stutterSource.playbackRate.value = 3.0 + Math.random() * 3.0;
          
          const stutterFilter = ctx.createBiquadFilter();
          stutterFilter.type = 'bandpass';
          stutterFilter.frequency.value = 3000 + Math.random() * 5000; // Random bandpass for each stutter
          stutterFilter.Q.value = 3.0;
          
          const stutterGain = ctx.createGain();
          
          // Give each stutter a random pan position!
          const stutterPanner = ctx.createStereoPanner();
          stutterPanner.pan.value = (Math.random() * 2) - 1; // -1 to 1
          
          // Random delay between 30ms and 150ms
          const delaySecs = (30 + Math.random() * 120) / 1000;
          const startTime = time + delaySecs;
          
          stutterSource.connect(stutterFilter);
          stutterFilter.connect(stutterGain);
          stutterGain.connect(stutterPanner);
          stutterPanner.connect(this.busStopBus || this.masterGain);
          
          const stutterRevPanner = ctx.createStereoPanner();
          stutterRevPanner.pan.value = (Math.random() * 2) - 1;
          stutterGain.connect(stutterRevPanner);
          stutterRevPanner.connect(this.shared2sReverb);
          
          // Give each stutter its own tight volume envelope
          stutterGain.gain.setValueAtTime(0, time);
          stutterGain.gain.setValueAtTime(2.025, startTime); // increased by 50% AGAIN
          stutterGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
          
          stutterSource.start(startTime);
        }
        break;
      }
      case 1: { // Wimpy Push -> Stereo wide random speed reverb hit
        const randomRate = 0.9 + Math.random() * 1.6; // 90% to 250%
        source.playbackRate.value = randomRate;
        
        const sourceR = ctx.createBufferSource();
        sourceR.buffer = buffer;
        sourceR.playbackRate.value = randomRate * 1.02; // Slight detune for width
        
        const pannerL = ctx.createStereoPanner(); pannerL.pan.value = -1;
        const pannerR = ctx.createStereoPanner(); pannerR.pan.value = 1;
        
        source.connect(pannerL);
        sourceR.connect(pannerR);
        
        const dryMix = ctx.createGain();
        pannerL.connect(dryMix);
        pannerR.connect(dryMix);
        
        // Bandpass to keep it in the "middle frequency" space
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 3.0; // Tighten the bandpass so it's narrower
        dryMix.connect(filter);
        
        if (!this.pad1ReverbNode) {
          this.pad1ReverbNode = ctx.createConvolver();
          const irLen = Math.floor(ctx.sampleRate * 1.0); 
          this.pad1ReverbBuffer = ctx.createBuffer(2, irLen, ctx.sampleRate);
          for (let ch = 0; ch < 2; ch++) {
            const channel = this.pad1ReverbBuffer.getChannelData(ch);
            for (let i = 0; i < irLen; i++) channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - (i / irLen), 3);
          }
          this.pad1ReverbNode.buffer = this.pad1ReverbBuffer;
          
          const wetGain = ctx.createGain();
          wetGain.gain.value = 0.25; // Dial back the heavy reverb
          this.pad1ReverbNode.connect(wetGain);
          wetGain.connect(this.busStopBus || this.masterGain);
        }
        
        filter.connect(this.pad1ReverbNode); 
        filter.connect(gain);
        
        gain.connect(panner); 
        
        gain.gain.setValueAtTime(0.01, time);
        gain.gain.linearRampToValueAtTime(0.3, time + 0.05); // Lower overall peak volume
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.6); // Halve the decay time
        
        sourceR.start(time);
        break;
      }
      case 0: { // Noisy Shut -> High click, double trigger
        const randomPitch = 1.5 + Math.random() * 2.5; // Random pitch between 1.5 and 4.0 per hit
        source.playbackRate.value = randomPitch;
        
        // Narrow bandpass instead of highpass
        filter.type = 'bandpass'; filter.frequency.value = 6000; filter.Q.value = 8.0;
        
        shaper.curve = this.getDistortionCurve(20); // Less splatter, lower CPU overhead
        
        source.connect(filter); filter.connect(shaper); shaper.connect(gain);
        gain.connect(panner);
        
        gain.gain.value = 0;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(1.575, time + 0.005); // Prevent instant pop, 50% louder AGAIN
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05); // sharp decay
        
        const source2 = ctx.createBufferSource();
        source2.buffer = buffer;
        source2.playbackRate.value = randomPitch * (1.2 + Math.random() * 0.8); 
        
        const filter2 = ctx.createBiquadFilter();
        filter2.type = 'bandpass'; filter2.frequency.value = 8000; filter2.Q.value = 8.0; 
        
        const shaper2 = ctx.createWaveShaper();
        shaper2.curve = this.getDistortionCurve(20);
        
        const gain2 = ctx.createGain();
        
        const offset = Math.random() * 0.05; // Random offset up to 50ms
        const startTime = time + offset;
        
        gain2.gain.value = 0;
        gain2.gain.setValueAtTime(0, startTime);
        gain2.gain.linearRampToValueAtTime(1.575, startTime + 0.005); // Prevent instant pop, 50% louder AGAIN
        gain2.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);
        
        source2.connect(filter2); filter2.connect(shaper2); shaper2.connect(gain2); gain2.connect(panner);
        
        source2.start(startTime);
        break;
      }
    }
    
    source.start(time);
  }

  playDrumGlitch(index, time, panVal) {
    const ctx = globalAudioCtx;
    if (!ctx) return;
    
    const panner = ctx.createStereoPanner();
    panner.pan.value = panVal;
    
    panner.connect(this.masterGain);
    
    const makeNoise = (duration) => {
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      return noise;
    };

    switch(index) {
      case 9: // Alien Vocaloid
      {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.value = 120 + Math.random() * 50;
        
        filter.type = 'bandpass';
        filter.Q.value = 20; 
        
        filter.frequency.setValueAtTime(2000, time);
        filter.frequency.exponentialRampToValueAtTime(300, time + 0.3);
        
        osc.connect(filter); filter.connect(gain); gain.connect(panner);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(1.0, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
        
        osc.start(time); osc.stop(time + 0.5);
        break;
      }
      case 8: // Accelerating Laser Bounces
      {
        const numBounces = 12; 
        let tOffset = time;
        let delay = 0.06; 
        
        for (let i = 0; i < numBounces; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'square'; 
          
          const baseFreq = 200 + (i * i * 20); 
          osc.frequency.setValueAtTime(baseFreq, tOffset); 
          osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, tOffset + 0.02); 
          
          const shaper = ctx.createWaveShaper();
          shaper.curve = this.getDistortionCurve(10); 
          
          osc.connect(shaper); shaper.connect(gain); gain.connect(panner);
          
          gain.gain.setValueAtTime(0, tOffset);
          gain.gain.linearRampToValueAtTime(0.5 * (1 - i/numBounces), tOffset + 0.001); 
          gain.gain.exponentialRampToValueAtTime(0.01, tOffset + (delay * 0.9)); 
          
          osc.start(tOffset); osc.stop(tOffset + delay);
          
          tOffset += delay;
          delay *= 0.65; 
        }
        break;
      }
      case 7: // Short Data Burst
      {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle'; 
        
        let t = time;
        while (t < time + 0.08) {
            osc.frequency.setValueAtTime(1000 + Math.random() * 4000, t);
            t += 0.005 + Math.random() * 0.015; 
        }
        
        osc.connect(gain); gain.connect(panner);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.4, time + 0.005);
        gain.gain.setValueAtTime(0.4, time + 0.05);
        gain.gain.linearRampToValueAtTime(0.01, time + 0.08); 
        
        osc.start(time); osc.stop(time + 0.09);
        break;
      }
      case 6: // Digital Noise Burst
      {
        const noise = makeNoise(0.1);
        const filter = ctx.createBiquadFilter();
        const delay = ctx.createDelay();
        const fb = ctx.createGain();
        const gain = ctx.createGain();
        
        delay.delayTime.value = 0.005 + Math.random() * 0.005; 
        fb.gain.value = 0.9;
        
        noise.connect(delay); delay.connect(fb); fb.connect(delay);
        delay.connect(filter);
        
        filter.type = 'highpass'; filter.frequency.value = 1000;
        
        filter.connect(gain); gain.connect(panner);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.6, time + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        
        noise.start(time);
        break;
      }
      case 5: // Glitch Stutter
      {
        const stutters = 3 + Math.floor(Math.random() * 4);
        for(let i=0; i<stutters; i++) {
          const tOffset = time + (i * 0.02);
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.value = 1000 + Math.random() * 3000;
          
          osc.connect(gain); gain.connect(panner);
          
          gain.gain.setValueAtTime(0, tOffset);
          gain.gain.linearRampToValueAtTime(0.5, tOffset + 0.001);
          gain.gain.exponentialRampToValueAtTime(0.01, tOffset + 0.015); 
          
          osc.start(tOffset); osc.stop(tOffset + 0.02);
        }
        break;
      }
      case 4: // High-pitched Sine Ping
      {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 2500 + Math.random() * 500;
        
        osc.connect(gain); gain.connect(panner);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.8, time + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        
        osc.start(time); osc.stop(time + 0.06);
        break;
      }
      case 3: // Crushed Snare
      {
        const noise = makeNoise(0.2);
        const osc = ctx.createOscillator();
        const shaper = ctx.createWaveShaper();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, time);
        osc.frequency.exponentialRampToValueAtTime(100, time + 0.05);
        
        shaper.curve = this.getDistortionCurve(150);
        
        osc.connect(shaper); noise.connect(shaper); shaper.connect(gain); gain.connect(panner);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.7, time + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        
        osc.start(time); noise.start(time); osc.stop(time + 0.2);
        break;
      }
      case 2: // Glass Shatter
      {
        const noise = makeNoise(0.1);
        const hp = ctx.createBiquadFilter();
        const shaper = ctx.createWaveShaper();
        const gain = ctx.createGain();
        
        hp.type = 'highpass'; hp.frequency.value = 6000; hp.Q.value = 10;
        shaper.curve = this.getDistortionCurve(50);
        
        noise.connect(hp); hp.connect(shaper); shaper.connect(gain); gain.connect(panner);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(1.0, time + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
        
        noise.start(time);
        
        for(let i=0; i<3; i++) {
            const tOffset = time + 0.02 + Math.random() * 0.05;
            const shard = makeNoise(0.02);
            const sHp = ctx.createBiquadFilter();
            const sGain = ctx.createGain();
            sHp.type = 'highpass'; sHp.frequency.value = 7000 + Math.random() * 2000; sHp.Q.value = 15;
            shard.connect(sHp); sHp.connect(sGain); sGain.connect(panner);
            sGain.gain.setValueAtTime(0, tOffset);
            sGain.gain.linearRampToValueAtTime(0.5, tOffset + 0.001);
            sGain.gain.exponentialRampToValueAtTime(0.01, tOffset + 0.015);
            shard.start(tOffset);
        }
        break;
      }
      case 1: // Synthetic Click
      {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, time);
        osc.frequency.exponentialRampToValueAtTime(100, time + 0.01);
        
        osc.connect(gain); gain.connect(panner);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(1.0, time + 0.001);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.01);
        
        osc.start(time); osc.stop(time + 0.02);
        break;
      }
      case 0: // Data Bird
      {
        const carrier = ctx.createOscillator();
        const mod = ctx.createOscillator();
        const gain = ctx.createGain();
        const vca = ctx.createGain(); 
        
        carrier.type = 'triangle';
        carrier.frequency.value = 12000 + Math.random() * 2000;
        
        mod.type = 'square';
        mod.frequency.setValueAtTime(50, time);
        mod.frequency.exponentialRampToValueAtTime(2000, time + 0.1); 
        
        mod.connect(vca.gain); 
        carrier.connect(vca);
        vca.connect(gain); gain.connect(panner);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.4, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        
        carrier.start(time); mod.start(time);
        carrier.stop(time + 0.2); mod.stop(time + 0.2);
        break;
      }
    }
  }

  playDrumFoley(index, time, panVal) {
    const ctx = globalAudioCtx;
    if (!ctx) return;
    
    const panner = ctx.createStereoPanner();
    panner.pan.value = panVal;
    panner.connect(this.masterGain);
    if (this.foleyReverb) {
      panner.connect(this.foleyReverb);
    }
    
    const makeNoise = (duration) => {
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      return noise;
    };

    switch(index) {
      case 9: // Sub-bass wavefolded bursts
      {
        const numBursts = 5 + Math.floor(Math.random() * 6); 
        
        // Create a more intense wavefolder curve
        const foldCurve = new Float32Array(1024);
        for (let i = 0; i < 1024; i++) {
          const x = (i * 2 / 1024) - 1;
          foldCurve[i] = Math.sin(x * Math.PI * 2.5); // Multiple folds
        }
        
        for (let i = 0; i < numBursts; i++) {
          // Strum the bursts evenly between 20ms and 65ms
          const windowStart = 0.020;
          const windowEnd = 0.065;
          const fraction = numBursts > 1 ? (i / (numBursts - 1)) : 0;
          const tOffset = time + windowStart + fraction * (windowEnd - windowStart); 
          const osc = ctx.createOscillator();
          const shaper = ctx.createWaveShaper();
          const lp = ctx.createBiquadFilter();
          const gain = ctx.createGain();
          
          osc.type = 'triangle';
          
          const startFreq = 40 + Math.random() * 60; // 40Hz to 100Hz
          osc.frequency.setValueAtTime(startFreq, tOffset);
          // Slight upward pitch bend
          osc.frequency.linearRampToValueAtTime(startFreq + 40, tOffset + 0.04); 
          
          shaper.curve = foldCurve;
          
          lp.type = 'lowpass';
          lp.frequency.value = 150;
          
          // Drive the signal into the shaper to accentuate the fold
          const drive = ctx.createGain();
          drive.gain.value = 4.0; // Pushed harder for more wavefolding
          
          osc.connect(drive); drive.connect(shaper); shaper.connect(lp); lp.connect(gain); gain.connect(panner);
          
          gain.gain.setValueAtTime(0, tOffset); // strict zero cross
          gain.gain.linearRampToValueAtTime(0.8, tOffset + 0.005);
          gain.gain.exponentialRampToValueAtTime(0.001, tOffset + 0.06);
          
          osc.start(tOffset);
          osc.stop(tOffset + 0.06);
        }
        break;
      }
      case 8: // Hollow Knock
      {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.05);
        osc.connect(gain); gain.connect(panner);
        gain.gain.setValueAtTime(1.0, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        osc.start(time); osc.stop(time + 0.1);
        break;
      }
      case 7: // Muted Cardboard
      {
        const osc = ctx.createOscillator();
        const noise = makeNoise(0.05);
        const lp = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, time);
        osc.frequency.exponentialRampToValueAtTime(50, time + 0.05);
        lp.type = 'lowpass';
        lp.frequency.value = 300;
        osc.connect(gain); noise.connect(lp); lp.connect(gain); gain.connect(panner);
        gain.gain.setValueAtTime(1.0, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
        osc.start(time); noise.start(time); osc.stop(time + 0.08);
        break;
      }
      case 6: // Twig Snap
      {
        const noise = makeNoise(0.02);
        const hp = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        hp.type = 'highpass'; hp.frequency.value = 4000;
        noise.connect(hp); hp.connect(gain); gain.connect(panner);
        gain.gain.setValueAtTime(0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.02);
        noise.start(time);
        break;
      }
      case 5: // Mid-frequency Shove + Reverberant Pores
      {
        const detuneSemis = (Math.random() * 7) - 3.5;
        const pitchMult = Math.pow(2, detuneSemis / 12);
        
        // 1. The Shove (Box sliding over gravel)
        const dur = 0.1; // Decreased runtime
        const shoveNoise = makeNoise(dur + 0.01); 
        const shoveFilter = ctx.createBiquadFilter();
        const shoveGain = ctx.createGain();
        
        shoveFilter.type = 'bandpass';
        shoveFilter.frequency.value = 800 * pitchMult; // detuned mid-frequency grit
        shoveFilter.Q.value = 0.5; // wide
        
        shoveNoise.connect(shoveFilter); shoveFilter.connect(shoveGain); shoveGain.connect(panner);
        
        // Friction scrape envelope
        shoveGain.gain.setValueAtTime(0, time);
        shoveGain.gain.linearRampToValueAtTime(0.5, time + 0.02); 
        shoveGain.gain.exponentialRampToValueAtTime(0.01, time + dur - 0.01);
        shoveGain.gain.linearRampToValueAtTime(0, time + dur);
        
        shoveNoise.start(time);
        
        // 2. The Cloud (Microscopic Pores through Comb Filters + 50ms Reverb)
        const localReverb = ctx.createConvolver();
        const irLen = Math.floor(ctx.sampleRate * 0.05); // 50ms tail
        const irBuffer = ctx.createBuffer(2, irLen, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
          const channel = irBuffer.getChannelData(ch);
          for (let i = 0; i < irLen; i++) {
            channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - (i / irLen), 3); 
          }
        }
        localReverb.buffer = irBuffer;
        localReverb.connect(panner); 

        const numGrains = 15;
        for (let i = 0; i < numGrains; i++) {
          const tOffset = time + Math.random() * dur; // Grains squeezed into shorter duration
          const grainNoise = makeNoise(0.006); 
          const grainGain = ctx.createGain();
          
          const delay = ctx.createDelay(0.1);
          const feedback = ctx.createGain();
          feedback.gain.value = 0.85; 
          
          // Detune the comb filter delay time inversely
          delay.delayTime.value = (Math.random() > 0.5 ? 0.002 : 0.003) / pitchMult; 
          
          grainNoise.connect(grainGain);
          grainGain.connect(delay);
          delay.connect(feedback);
          feedback.connect(delay);
          delay.connect(localReverb);
          
          grainGain.gain.setValueAtTime(0, tOffset);
          grainGain.gain.linearRampToValueAtTime(0.05, tOffset + 0.001);
          grainGain.gain.exponentialRampToValueAtTime(0.001, tOffset + 0.005);
          grainGain.gain.linearRampToValueAtTime(0, tOffset + 0.006);
          
          grainNoise.start(tOffset);
        }
        
        break;
      }
      case 4: // Hollow Gourd Shaker
      {
        const noise = makeNoise(0.2);
        const bp = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        
        bp.type = 'bandpass';
        bp.frequency.value = 1800;
        bp.Q.value = 2; // Wooden, hollow resonance
        
        noise.connect(bp); bp.connect(gain); gain.connect(panner);
        
        // Two rapid shakes: "ch-ch"
        gain.gain.setValueAtTime(0.01, time);
        gain.gain.exponentialRampToValueAtTime(0.6, time + 0.02); // first shake
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.4, time + 0.1);  // second shake
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        
        noise.start(time);
        break;
      }
      case 3: // Extended Stuttering Dual Guiro
      {
        const dur = 0.5; // Drawn out duration
        
        const osc = ctx.createOscillator(); // Downward tone
        const upOsc = ctx.createOscillator(); // Upward tone
        const bp = ctx.createBiquadFilter(); // Tracking bandpass for upward tone
        
        const amOsc = ctx.createOscillator(); // AM modulator for the stutter
        const amFilter = ctx.createBiquadFilter(); // Smooth the square wave to prevent popping
        const amGain = ctx.createGain();
        const gain = ctx.createGain();
        
        // 1. Organic pitch bend down
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, time);
        osc.frequency.exponentialRampToValueAtTime(90, time + dur);
        
        // 2. New upward pitch bend with tracking filter
        upOsc.type = 'triangle';
        upOsc.frequency.setValueAtTime(200, time);
        upOsc.frequency.exponentialRampToValueAtTime(800, time + dur);
        
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(200, time);
        bp.frequency.exponentialRampToValueAtTime(800, time + dur);
        bp.Q.value = 8;
        
        upOsc.connect(bp);
        
        // Both tones feed into the AM stutter module
        osc.connect(amGain);
        bp.connect(amGain);
        
        // 3. Fast stuttering AM modulation
        amOsc.type = 'square';
        amOsc.frequency.value = 35 + Math.random() * 15; 
        
        // Run square wave through lowpass filter to "soften" the edges and prevent clicking
        amFilter.type = 'lowpass';
        amFilter.frequency.value = amOsc.frequency.value * 4; 
        amOsc.connect(amFilter);
        amFilter.connect(amGain.gain);
        
        amGain.connect(gain); gain.connect(panner);
        
        // 4. Envelope (Starts at EXACTLY 0, ends at EXACTLY 0 to prevent pops)
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.5, time + 0.005); 
        gain.gain.exponentialRampToValueAtTime(0.01, time + dur - 0.01);
        gain.gain.linearRampToValueAtTime(0, time + dur); 
        
        osc.start(time); upOsc.start(time); amOsc.start(time);
        osc.stop(time + dur); upOsc.stop(time + dur); amOsc.stop(time + dur);
        break;
      }
      case 2: // Spectral Dust (Parallel narrow bandpass noise)
      {
        const noise = makeNoise(0.1);
        const gain = ctx.createGain();
        gain.connect(panner);
        
        // 3 parallel, random, extremely narrow bandpass filters
        for(let i=0; i<3; i++) {
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = 4000 + Math.random() * 4000; // 4k - 8k
          bp.Q.value = 40; // Extremely resonant
          noise.connect(bp); bp.connect(gain);
        }
        
        gain.gain.setValueAtTime(0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        
        noise.start(time);
        break;
      }
      case 1: // Bitcrushed Sine Highpass
      {
        const osc = ctx.createOscillator();
        const shaper = ctx.createWaveShaper();
        const hp = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 2000 + Math.random() * 2000; // 2000-4000Hz
        
        // Bitcrusher waveshaper (2 bits)
        const bits = 2;
        const steps = Math.pow(2, bits);
        const curve = new Float32Array(1024);
        for (let i = 0; i < 1024; i++) {
          const x = (i * 2 / 1024) - 1;
          curve[i] = Math.round(x * steps) / steps;
        }
        shaper.curve = curve;
        
        hp.type = 'highpass';
        hp.frequency.value = 5000;
        hp.Q.value = 10.0; // Tight resonance
        
        osc.connect(shaper); shaper.connect(hp); hp.connect(gain); gain.connect(panner);
        
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        
        osc.start(time); osc.stop(time + 0.2);
        break;
      }
      case 0: // Dark Drone
      {
        const osc1 = ctx.createOscillator(); osc1.type = 'sine'; 
        const osc2 = ctx.createOscillator(); osc2.type = 'sine';
        const gain = ctx.createGain();
        
        const detuneSemis = (Math.random() * 7) - 3.5;
        const pitchMult = Math.pow(2, detuneSemis / 12);
        
        osc1.frequency.value = 50 * pitchMult;
        osc2.frequency.value = 25 * pitchMult; // Sub-octave
        
        osc1.connect(gain); osc2.connect(gain); gain.connect(panner);
        
        const dur = 0.5; // Dramatically reduced runtime from 2.0s
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.6, time + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, time + dur - 0.01);
        gain.gain.linearRampToValueAtTime(0, time + dur);
        
        osc1.start(time); osc2.start(time);
        osc1.stop(time + dur); osc2.stop(time + dur);
        break;
      }
    }
  }

  playDrum(index, time, panVal) {
    if (this.currentKit === 'bus_stop') {
      this.playDrumBusStop(index, time, panVal);
    } else if (this.currentKit === 'disco') {
      this.playDrumGlitch(index, time, panVal);
    } else if (this.currentKit === 'foley') {
      this.playDrumFoley(index, time, panVal);
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
      const ctx = globalAudioCtx;
      if (!ctx) return;
      const now = ctx.currentTime;
      
      // Initialize sequencer state
      if (!this.nextNoteTime) {
        this.nextNoteTime = now + 0.1;
        this.startTime = now + 0.1;
        this.currentStep = 0;
        this.visualQueue = [];
      }
      
      const bpm = this.bpm || 90; 
      // All grids use 8th notes.
      const beatMult = 2;
      const stepDuration = (60 / bpm) / beatMult;
      
      const lookahead = 0.15; // 150ms lookahead window
      
      // Fix background tab throttling crash: 
      // If we've missed more than 4 steps due to tab inactivity or heavy CPU load, 
      // fast-forward the clock to prevent the while loop from locking up the browser.
      if (now - this.nextNoteTime > stepDuration * 4) {
        const skipSteps = Math.floor((now - this.nextNoteTime) / stepDuration);
        this.nextNoteTime += skipSteps * stepDuration;
        this.currentStep += skipSteps;
        this.visualQueue = [];
      }
      
      // Scheduling Lookahead Loop
      while (now + lookahead >= this.nextNoteTime) {
        // 16 columns (128 / 16 = 8 pixels wide)
        const colWidth = this.width / 16;
        const c = this.currentStep % 16;
        
        // 10 rows (64 / 10 = 6.4 pixels tall)
        const rowHeight = this.height / 10;
        
        let potentialTriggers = [];
        
        for (let r = 0; r < 10; r++) {
          let maxB = 0;
          let sumB = 0;
          let sumX = 0;
          let count = 0;
          
          for (let y = Math.floor(r * rowHeight); y < Math.floor((r + 1) * rowHeight); y++) {
            for (let x = Math.floor(c * colWidth); x < Math.floor((c + 1) * colWidth); x++) {
              let b = this.gridB[y * this.width + x];
              if (b > maxB) maxB = b;
              sumB += b;
              if (b > 0.1) { // Only count moderately dense pixels
                sumX += x;
                count++;
              }
            }
          }
          
          if (count >= 2 && maxB > 0.1) {
            potentialTriggers.push({ r, maxB, sumB, sumX, count });
          }
        }
        
        // Sort by total density (sumB) descending so the most populated blobs get priority.
        potentialTriggers.sort((a, b) => b.sumB - a.sumB);
        
        // Take the top 3 (or fewer) triggers
        let numTriggers = Math.min(3, potentialTriggers.length);
        for (let i = 0; i < numTriggers; i++) {
          const t = potentialTriggers[i];
          
          const colCenter = c * colWidth + colWidth / 2;
          const avgX = t.sumX / t.count;
          const diff = (avgX - colCenter) / (colWidth / 2);
          const swingOffset = diff * (stepDuration * 0.2); 
          const panVal = (avgX / this.width) * 2 - 1;
          
          // No Math.max(now)! The triggerTime is scheduled around the future nextNoteTime.
          // This allows early (negative) swingOffsets to be scheduled perfectly.
          const triggerTime = this.nextNoteTime + swingOffset;
          
          this.playDrum(t.r, triggerTime, panVal);
          
          // Queue visual feedback for the exact time the audio plays
          this.visualQueue.push({
            time: triggerTime,
            x: c * colWidth,
            y: t.r * rowHeight,
            w: colWidth,
            h: rowHeight
          });
        }
        
        this.currentStep++;
        this.nextNoteTime += stepDuration;
      }
      
      // Clean up old flashes (keep them for 100ms after playing to fade them out)
      this.visualQueue = this.visualQueue.filter(v => now <= v.time + 0.1);
      
      // Draw flashes
      for (const v of this.visualQueue) {
        if (now >= v.time) {
          const alpha = Math.max(0, 1.0 - ((now - v.time) / 0.1));
          this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
          this.ctx.fillRect(v.x, v.y, v.w, v.h);
        }
      }
      
      // Draw smooth playhead immune to dynamic tempo changes
      const exactStep = this.currentStep - ((this.nextNoteTime - now) / stepDuration);
      let playheadX = (exactStep % 16) * (this.width / 16);
      
      // Ensure playhead wraps correctly for negative modulo values
      if (playheadX < 0) playheadX += this.width;
      
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(playheadX, 0, this.width / 16, this.height);
      
      // Draw 16x10 grid lines
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      for (let i = 1; i < 16; i++) {
        let x = i * (this.width / 16);
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.height);
      }
      for (let i = 1; i < 10; i++) {
        let y = i * (this.height / 10);
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.width, y);
      }
      this.ctx.stroke();
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
        this.lastStepTime = null; // Prevent catch-up bug
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        playBtn.style.color = '#cbd5e1';
      } else {
        this.isPlaying = true;
        this.lastStepTime = null; // Force reset on resume
        playBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
        playBtn.style.color = '#ef4444';
      }
    });
    
    document.getElementById('rd-type')?.addEventListener('change', (e) => {
      this.setType(e.target.value);
    });
    
    document.getElementById('rd-kit')?.addEventListener('change', (e) => {
      this.currentKit = e.target.value;
      if (this.vinylCrackleGain) {
        // Fade crackle in/out smoothly to avoid pops
        const targetVol = this.currentKit === 'bus_stop' ? 0.3 : 0;
        const ct = getAudioCtx().currentTime;
        this.vinylCrackleGain.gain.setTargetAtTime(targetVol, ct, 0.1);
      }
    });
    
    document.getElementById('rd-speed')?.addEventListener('input', (e) => {
      let val = parseInt(e.target.value); // 1 to 100
      this.simSpeed = Math.floor(val / 10) + 1; // 1 to 10 steps per frame
    });
    
    document.getElementById('rd-bpm')?.addEventListener('input', (e) => {
      this.bpm = parseInt(e.target.value);
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
      if (iframe) {
        iframe.src = iframe.src; // Reload iframe to fully kill Tone.js audio context and reset Power On button
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
  if (e.data && e.data.type && e.data.type.toUpperCase() === 'SWIPE') {
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
      if (window.innerWidth < 768) {
        header.classList.add('is-hidden');
      }
    }, 2000);
  }

  // Initial trigger
  showHeader();

  // Show header on scroll, touch, or mouse movement
  window.addEventListener('scroll', showHeader, {passive: true});
  window.addEventListener('mousemove', showHeader, {passive: true});
  window.addEventListener('touchstart', showHeader, {passive: true});
}

// --------------------------------------------------------------------------
// WHEEL SELECTORS & DRUM PADS LOGIC
// --------------------------------------------------------------------------
document.getElementById('toggle-drum-pads')?.addEventListener('click', () => {
  const container = document.getElementById('drum-pads-container');
  const btn = document.getElementById('toggle-drum-pads');
  if (container.classList.contains('open')) {
    container.classList.remove('open');
    btn.classList.remove('open');
  } else {
    container.classList.add('open');
    btn.classList.add('open');
  }
});

document.querySelectorAll('.drum-pad-btn').forEach(btn => {
  btn.addEventListener('mousedown', (e) => {
    const idx = parseInt(e.target.dataset.index);
    if (modules[2] && modules[2].audioInit && globalAudioCtx) {
      modules[2].playDrum(idx, globalAudioCtx.currentTime, 0);
      btn.classList.add('active-hit');
      setTimeout(() => btn.classList.remove('active-hit'), 100);
    }
  });
});

window.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') {
    if (modules[2] && modules[2].audioInit && globalAudioCtx) {
      const idx = parseInt(e.key);
      modules[2].playDrum(idx, globalAudioCtx.currentTime, 0);
      const btn = document.querySelector(`.drum-pad-btn[data-index="${idx}"]`);
      if (btn) {
        btn.classList.add('active-hit');
        setTimeout(() => btn.classList.remove('active-hit'), 100);
      }
    }
  }
});

document.querySelectorAll('.wheel-selector').forEach(wheel => {
  // Clone ALL items to the front and back for seamless infinite scrolling
  const originalItems = Array.from(wheel.querySelectorAll('.wheel-item'));
  const len = originalItems.length;
  if (len > 0) {
    originalItems.forEach(item => {
      const clone = item.cloneNode(true);
      clone.classList.add('clone');
      wheel.insertBefore(clone, originalItems[0]);
    });
    originalItems.forEach(item => {
      const clone = item.cloneNode(true);
      clone.classList.add('clone');
      wheel.appendChild(clone);
    });
  }

  let isDown = false;
  let startX;
  let scrollLeft;
  let items = wheel.querySelectorAll('.wheel-item');
  let currentIndex = len; // Start on the first real item in the middle section
  
  items[currentIndex].classList.add('active');
  // Initialize position instantly
  setTimeout(() => {
    wheel.style.scrollBehavior = 'auto';
    wheel.scrollLeft = items[currentIndex].offsetLeft - (wheel.clientWidth/2) + (items[currentIndex].clientWidth/2);
    setTimeout(() => { wheel.style.scrollBehavior = 'smooth'; }, 10);
  }, 10);

  const updateSelect = () => {
    const val = items[currentIndex].dataset.value;
    const selectId = wheel.dataset.target;
    const select = document.getElementById(selectId);
    if(select) {
      select.value = val;
      select.dispatchEvent(new Event('change'));
    }
  };

  const snapToReal = (index) => {
    // Disable transitions so the color doesn't fade during the swap
    items.forEach(item => item.style.transition = 'none');
    
    items[currentIndex].classList.remove('active');
    currentIndex = index;
    items[currentIndex].classList.add('active');
    
    wheel.style.scrollBehavior = 'auto';
    wheel.scrollTo({
      left: items[currentIndex].offsetLeft - (wheel.clientWidth/2) + (items[currentIndex].clientWidth/2),
      behavior: 'auto'
    });
    
    // Force a browser repaint so the color swap happens instantly without animation
    void wheel.offsetHeight;
    
    setTimeout(() => { 
      wheel.style.scrollBehavior = 'smooth'; 
      items.forEach(item => item.style.transition = '');
    }, 50);
  };

  const spinNext = () => {
    items[currentIndex].classList.remove('active');
    currentIndex = currentIndex + 1;
    items[currentIndex].classList.add('active');
    wheel.scrollTo({
      left: items[currentIndex].offsetLeft - (wheel.clientWidth/2) + (items[currentIndex].clientWidth/2),
      behavior: 'smooth'
    });
    updateSelect();
  };

  // NATIVE SCROLL HANDLER: Handles both trackpad scrolling and momentum scrolling after drag
  wheel.addEventListener('scroll', () => {
    clearTimeout(wheel.snapTimeout);
    wheel.snapTimeout = setTimeout(() => {
      if (isDown) return; // Don't snap update while dragging
      
      let closest = 0;
      let minDiff = Infinity;
      const center = wheel.scrollLeft + wheel.clientWidth / 2;
      items.forEach((item, i) => {
        const itemCenter = item.offsetLeft + item.clientWidth / 2;
        const diff = Math.abs(center - itemCenter);
        if (diff < minDiff) {
          minDiff = diff;
          closest = i;
        }
      });
      
      if (currentIndex !== closest) {
        items[currentIndex].classList.remove('active');
        currentIndex = closest;
        items[currentIndex].classList.add('active');
        updateSelect();
      }
      
      // If we landed in the clone zones, instantly and invisibly snap back to the real middle zone
      if (currentIndex >= 2 * len || currentIndex < len) {
        const realIndex = len + (currentIndex % len);
        snapToReal(realIndex);
      }
    }, 150);
  }, { passive: true });

  // MOUSE DRAG HANDLERS
  wheel.addEventListener('mousedown', (e) => {
    isDown = true;
    wheel.style.cursor = 'grabbing';
    wheel.style.scrollSnapType = 'none'; // Disable snapping during drag
    startX = e.pageX - wheel.offsetLeft;
    scrollLeft = wheel.scrollLeft;
  });
  wheel.addEventListener('mouseleave', () => {
    isDown = false;
    wheel.style.cursor = 'pointer';
    wheel.style.scrollSnapType = 'x mandatory';
  });
  wheel.addEventListener('mouseup', (e) => {
    isDown = false;
    wheel.style.cursor = 'pointer';
    wheel.style.scrollSnapType = 'x mandatory'; // Restore snapping
    const endX = e.pageX - wheel.offsetLeft;
    
    // If it was just a click, spin to next
    if (Math.abs(startX - endX) < 5) {
      spinNext();
    }
    // Otherwise, let native scroll-snap handle centering, which will trigger the scroll listener
  });
  wheel.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - wheel.offsetLeft;
    const walk = (x - startX) * 2; 
    wheel.scrollLeft = scrollLeft - walk;
  });

  // Intercept trackpad/mousewheel scrolling to prevent page scroll and map to horizontal
  wheel.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      wheel.scrollLeft += e.deltaY;
    }
  }, { passive: false });
});

// Auto-play Rhythm Grid on start
document.getElementById('btn-start-fractal')?.addEventListener('click', () => {
  const rd = modules[2];
  rd.isPlaying = true;
  const playBtn = document.getElementById('btn-play-rd');
  if(playBtn) {
    playBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
    playBtn.style.color = '#ef4444';
  }
});

// Stop audio/animation when tab is hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (modules[currentIndex] && typeof modules[currentIndex].stop === 'function') {
      modules[currentIndex].stop();
    }
  }
});
