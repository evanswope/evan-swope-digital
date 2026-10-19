/**
 * TopoArp - 3D Topological Arpeggiator Synthesizer
 * Connects parametric 3D liquid-metal geometry deformations to a Web Audio arpeggiator engine.
 * 
 * Sliders (opaque iconography with tooltips):
 * 1. Sprout  - Node / vertex count <-> Arpeggio note count & meter (3..12)
 * 2. Twist   - Torsion / helical twist <-> Portamento glide & unison detune
 * 3. Bloat   - Cross-sectional inflation <-> Octave register & sub-bass body
 * 4. Spike   - Extrusion / sharpness <-> VCF filter cutoff, Q resonance & FM bite
 * 5. Bump    - Surface ripples / cellular noise <-> White noise injection & lofi grit
 * 6. Tint    - Metallic color & iridescence <-> Musical scale mode & delay color
 * 7. Tumble  - Gyro rotation speed <-> Arpeggiator tempo (BPM) & stereo pan
 */

(function () {
  'use strict';

  // --- MUSICAL SCALES (Mapped to Tint) ---
  const SCALES = [
    // 0.0 - 0.16: Phrygian (Mysterious / Dark)
    { name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10, 12, 13, 15, 17, 19], color: 0x141824, emissive: 0x00f2fe },
    // 0.17 - 0.33: Dorian (Soulful Minor / Jazz)
    { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10, 12, 14, 15, 17, 19], color: 0x8a929e, emissive: 0x4facfe },
    // 0.34 - 0.50: Aeolian (Natural Minor)
    { name: 'Aeolian', intervals: [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19], color: 0xc87d55, emissive: 0xffb199 },
    // 0.51 - 0.67: Harmonic Minor (Dramatic / Neoclassical)
    { name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11, 12, 14, 15, 19, 20], color: 0xb53471, emissive: 0xff7eb3 },
    // 0.68 - 0.83: Lydian (Cosmic / Sci-Fi)
    { name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11, 12, 14, 16, 18, 19], color: 0x00b894, emissive: 0x55efc4 },
    // 0.84 - 1.00: Mixolydian (Radiant / Acid)
    { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10, 12, 14, 16, 17, 19], color: 0x0984e3, emissive: 0x74b9ff }
  ];

  class TopoArpEngine {
    constructor() {
      this.container = document.getElementById('topo-canvas-container');
      if (!this.container) return;

      this.isPlaying = false;
      this.audioCtx = null;
      this.masterGain = null;
      this.delayNode = null;
      this.filterNode = null;
      this.noiseGain = null;

      // Clock / Arp state
      this.currentStep = 0;
      this.nextNoteTime = 0;
      this.timerId = null;
      this.lastFreq = 220;

      // Parameters
      this.params = {
        sprout: 5,     // 3..12 nodes
        twist: 0.22,   // 0..1
        bloat: 0.50,   // 0..1
        spike: 0.35,   // 0..1
        bump: 0.15,    // 0..1
        tint: 0.25,    // 0..1
        tumble: 0.45   // 0..1
      };

      // Mouse drag rotation state
      this.isDragging = false;
      this.previousMousePosition = { x: 0, y: 0 };
      this.manualVelocity = { x: 0, y: 0 };

      // Three.js instances
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.mesh = null;
      this.material = null;
      this.baseGeometry = null;
      this.origVertices = null;
      this.pointLight1 = null;
      this.pointLight2 = null;
      this.pulseIntensity = 0;

      this.init3D();
      this.initUI();
      this.updateMeshGeometry();
      this.updateMaterialProperties();
    }

    // ------------------------------------------------------------------------
    // 1. THREE.JS 3D SCENE & METALLIC SHADER SETUP
    // ------------------------------------------------------------------------
    init3D() {
      const width = this.container.clientWidth || 640;
      const height = this.container.clientHeight || 420;

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      this.camera.position.set(0, 0, 7.2);

      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.25;
      this.container.appendChild(this.renderer.domElement);

      // Studio Lighting for metallic liquid reflections
      const ambient = new THREE.AmbientLight(0xffffff, 0.55);
      this.scene.add(ambient);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
      keyLight.position.set(5, 7, 6);
      this.scene.add(keyLight);

      this.pointLight1 = new THREE.PointLight(0x00f2fe, 3.2, 14);
      this.pointLight1.position.set(-4, -3, 3);
      this.scene.add(this.pointLight1);

      this.pointLight2 = new THREE.PointLight(0xff7eb3, 3.0, 14);
      this.pointLight2.position.set(4, 3, -2);
      this.scene.add(this.pointLight2);

      // Highly subdivided Icosahedron for buttery liquid-metal deformation
      this.baseGeometry = new THREE.IcosahedronGeometry(2.1, 4);
      const posAttr = this.baseGeometry.attributes.position;
      this.origVertices = new Float32Array(posAttr.array);

      this.material = new THREE.MeshStandardMaterial({
        color: 0x8a929e,
        metalness: 0.94,
        roughness: 0.18,
        emissive: 0x000000,
        emissiveIntensity: 0.0,
        flatShading: false
      });

      this.mesh = new THREE.Mesh(this.baseGeometry, this.material);
      this.scene.add(this.mesh);

      // Mouse / Touch Orbit Interaction
      const dom = this.renderer.domElement;
      dom.addEventListener('pointerdown', (e) => {
        this.isDragging = true;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
        this.manualVelocity = { x: 0, y: 0 };
      });

      window.addEventListener('pointermove', (e) => {
        if (!this.isDragging) return;
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;
        this.manualVelocity = { x: deltaX * 0.005, y: deltaY * 0.005 };
        this.mesh.rotation.y += this.manualVelocity.x;
        this.mesh.rotation.x += this.manualVelocity.y;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      });

      window.addEventListener('pointerup', () => {
        this.isDragging = false;
      });

      // Resize Observer
      const ro = new ResizeObserver(() => {
        if (!this.container) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        if (w === 0 || h === 0) return;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      });
      ro.observe(this.container);

      // Start render loop
      this.animate();
    }

    onSlideEnter() {
      if (!this.container || !this.renderer || !this.camera) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      if (w > 0 && h > 0) {
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      }
    }

    // ------------------------------------------------------------------------
    // 2. PROCEDURAL 3D TOPOLOGY DEFORMATION
    // ------------------------------------------------------------------------
    updateMeshGeometry() {
      if (!this.mesh) return;
      const posAttr = this.baseGeometry.attributes.position;
      const pos = posAttr.array;
      const orig = this.origVertices;

      const N = Math.round(this.params.sprout); // 3 to 12 lobes
      const twistAmt = this.params.twist * 3.8; // Torsion
      const bloatAmt = 0.55 + this.params.bloat * 0.85; // Inflation
      const spikeAmt = 0.2 + this.params.spike * 1.5; // Sharpness
      const bumpAmt = this.params.bump * 0.35; // Surface ripples

      const count = orig.length / 3;

      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        const ox = orig[idx];
        const oy = orig[idx + 1];
        const oz = orig[idx + 2];

        const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
        const nx = ox / len;
        const ny = oy / len;
        const nz = oz / len;

        // Spherical coordinates
        const theta = Math.atan2(nz, nx);
        const phi = Math.asin(Math.max(-1, Math.min(1, ny)));

        // 1. Sprout Lobes (Harmonic radial lobes around theta and elevation)
        const lobeVal = Math.cos(N * (theta + ny * twistAmt)) * Math.cos(phi * 2.2);

        // 2. Spike Shaping (Power curve to turn smooth hills into sharp horns)
        const spikeShape = Math.sign(lobeVal) * Math.pow(Math.abs(lobeVal), Math.max(0.6, 2.2 - this.params.spike * 1.2));
        const rLobe = 1.0 + spikeShape * (0.32 + this.params.spike * 0.45);

        // 3. Bloat & Asymmetric Form
        const rBloat = bloatAmt * (1.0 + 0.15 * Math.sin(phi * 3.0));

        // 4. Bump Surface Ripples (Cellular noise simulation)
        let rBump = 0;
        if (bumpAmt > 0.01) {
          rBump = Math.sin(nx * 14.0) * Math.cos(ny * 14.0) * Math.sin(nz * 14.0) * bumpAmt;
        }

        const finalR = 2.0 * rBloat * rLobe + rBump;

        pos[idx]     = nx * finalR;
        pos[idx + 1] = ny * finalR;
        pos[idx + 2] = nz * finalR;
      }

      posAttr.needsUpdate = true;
      this.baseGeometry.computeVertexNormals();
    }

    updateMaterialProperties() {
      if (!this.material) return;
      const t = Math.max(0, Math.min(1, this.params.tint));
      const scaleIdx = Math.min(SCALES.length - 1, Math.floor(t * SCALES.length));
      const scaleObj = SCALES[scaleIdx];

      // Interpolate metallic body color
      this.material.color.setHex(scaleObj.color);
      this.material.roughness = 0.12 + (1.0 - this.params.bloat) * 0.16;

      // Update light rim colors to complement the chosen tint
      if (this.pointLight1) this.pointLight1.color.setHex(scaleObj.emissive);
      if (this.pointLight2) this.pointLight2.color.setHex(scaleObj.emissive);
    }

    animate() {
      requestAnimationFrame(() => this.animate());

      if (this.mesh) {
        // Tumble kinetic spin speed
        const tumbleSpeed = 0.003 + this.params.tumble * 0.038;

        if (this.isDragging) {
          // Handled in pointermove
        } else {
          // Apply residual inertia decay
          this.manualVelocity.x *= 0.94;
          this.manualVelocity.y *= 0.94;
          this.mesh.rotation.y += tumbleSpeed + this.manualVelocity.x;
          this.mesh.rotation.x += tumbleSpeed * 0.65 + this.manualVelocity.y;
          this.mesh.rotation.z += tumbleSpeed * 0.35;
        }

        // Emissive pulse decay on beat
        if (this.pulseIntensity > 0.01) {
          this.pulseIntensity *= 0.88;
          this.material.emissiveIntensity = this.pulseIntensity * 1.6;
        } else {
          this.material.emissiveIntensity = 0.0;
        }
      }

      this.renderer.render(this.scene, this.camera);
    }

    // ------------------------------------------------------------------------
    // 3. WEB AUDIO ENGINE & ARPEGGIATOR SCHEDULER
    // ------------------------------------------------------------------------
    initAudio() {
      if (this.audioCtx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();

      // Master output bus with warm compression
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0.72, this.audioCtx.currentTime);

      // Stereo Ping-Pong Delay
      this.delayNode = this.audioCtx.createDelay(1.5);
      this.delayNode.delayTime.value = 0.28;
      const delayFeedback = this.audioCtx.createGain();
      delayFeedback.gain.value = 0.42;

      this.delayNode.connect(delayFeedback);
      delayFeedback.connect(this.delayNode);
      this.delayNode.connect(this.masterGain);

      // Lowpass Filter
      this.filterNode = this.audioCtx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = 2400;
      this.filterNode.Q.value = 3.2;

      this.filterNode.connect(this.masterGain);
      this.filterNode.connect(this.delayNode);

      // White noise buffer for Bump grit
      const bufferSize = this.audioCtx.sampleRate * 2;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = noiseBuffer;

      this.masterGain.connect(this.audioCtx.destination);
    }

    start() {
      this.initAudio();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      this.isPlaying = true;
      this.currentStep = 0;
      this.nextNoteTime = this.audioCtx.currentTime + 0.05;
      this.scheduleLoop();

      const btn = document.getElementById('btn-topo-play');
      if (btn) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="fa-solid fa-stop"></i>';
        btn.setAttribute('title', 'Stop');
        btn.setAttribute('aria-label', 'Stop');
      }
    }

    stop() {
      this.isPlaying = false;
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
      const btn = document.getElementById('btn-topo-play');
      if (btn) {
        btn.classList.remove('active');
        btn.innerHTML = '<i class="fa-solid fa-play"></i>';
        btn.setAttribute('title', 'Play');
        btn.setAttribute('aria-label', 'Play');
      }
    }

    toggle() {
      if (this.isPlaying) {
        this.stop();
      } else {
        this.start();
      }
    }

    scheduleLoop() {
      if (!this.isPlaying) return;

      while (this.nextNoteTime < this.audioCtx.currentTime + 0.12) {
        this.playStep(this.nextNoteTime, this.currentStep);

        // Tempo mapped from Tumble (75 BPM to 175 BPM)
        const bpm = 75 + this.params.tumble * 100;
        const stepSec = 60 / (bpm * 2); // 8th note steps

        // Delay sync
        if (this.delayNode) {
          this.delayNode.delayTime.setTargetAtTime(stepSec * 1.5, this.nextNoteTime, 0.05);
        }

        this.nextNoteTime += stepSec;
        const numSteps = Math.round(this.params.sprout);
        this.currentStep = (this.currentStep + 1) % numSteps;
      }

      this.timerId = setTimeout(() => this.scheduleLoop(), 25);
    }

    playStep(time, stepIdx) {
      if (!this.audioCtx || !this.isPlaying) return;

      const t = this.audioCtx.currentTime;
      if (time < t) time = t;

      // 1. Calculate Target Pitch from Tint (Scale) & Bloat (Octave)
      const scaleIdx = Math.min(SCALES.length - 1, Math.floor(this.params.tint * SCALES.length));
      const scale = SCALES[scaleIdx];
      const intervals = scale.intervals;
      const interval = intervals[stepIdx % intervals.length];

      // Base octave shifts lower with higher bloat
      const baseMidi = 60 - Math.round(this.params.bloat * 24); // C5 down to C3
      const midi = baseMidi + interval;
      const targetFreq = 440 * Math.pow(2, (midi - 69) / 12);

      // 2. Synthesizer Voice Architecture
      const osc = this.audioCtx.createOscillator();
      const subOsc = this.audioCtx.createOscillator();
      const voiceGain = this.audioCtx.createGain();

      // Spike controls wave shape & FM bite
      osc.type = this.params.spike > 0.45 ? 'sawtooth' : 'triangle';
      subOsc.type = 'sine';

      // Portamento Glide (Mapped to Twist)
      const glideTime = 0.003 + this.params.twist * 0.22;
      osc.frequency.setValueAtTime(this.lastFreq, time);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, time + glideTime);

      subOsc.frequency.setValueAtTime(this.lastFreq * 0.5, time);
      subOsc.frequency.exponentialRampToValueAtTime(targetFreq * 0.5, time + glideTime);
      this.lastFreq = targetFreq;

      // Filter modulation (Mapped to Spike)
      const filterCutoff = 400 + Math.pow(this.params.spike, 1.8) * 7500;
      const filterQ = 1.0 + this.params.spike * 6.5;
      this.filterNode.frequency.setTargetAtTime(filterCutoff, time, 0.02);
      this.filterNode.Q.setTargetAtTime(filterQ, time, 0.02);

      // Sub-bass volume (Mapped to Bloat)
      const subGain = this.audioCtx.createGain();
      subGain.gain.setValueAtTime(this.params.bloat * 0.55, time);
      subOsc.connect(subGain);
      subGain.connect(this.filterNode);

      // Noise burst for Bump grit
      if (this.params.bump > 0.05 && this.noiseBuffer) {
        const noiseSrc = this.audioCtx.createBufferSource();
        noiseSrc.buffer = this.noiseBuffer;
        const nGain = this.audioCtx.createGain();
        nGain.gain.setValueAtTime(this.params.bump * 0.32, time);
        nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
        noiseSrc.connect(nGain);
        nGain.connect(this.filterNode);
        noiseSrc.start(time);
        noiseSrc.stop(time + 0.07);
      }

      // Dynamic Stereo Auto-Pan (Mapped to Tumble)
      if (this.audioCtx.createStereoPanner) {
        const panner = this.audioCtx.createStereoPanner();
        const panVal = Math.sin(stepIdx * 1.8 + this.params.tumble * 5.0) * 0.65;
        panner.pan.setValueAtTime(panVal, time);
        voiceGain.connect(panner);
        panner.connect(this.filterNode);
      } else {
        voiceGain.connect(this.filterNode);
      }

      // Amplitude Envelope (ADSR)
      const noteDur = 0.16 + (1.0 - this.params.tumble) * 0.14;
      voiceGain.gain.setValueAtTime(0.0001, time);
      voiceGain.gain.linearRampToValueAtTime(0.65, time + 0.012);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, time + noteDur);

      osc.connect(voiceGain);

      osc.start(time);
      subOsc.start(time);
      osc.stop(time + noteDur + 0.05);
      subOsc.stop(time + noteDur + 0.05);

      // Visual Beat Trigger (Emissive Pulse on 3D metallic mesh)
      const delayMs = Math.max(0, (time - this.audioCtx.currentTime) * 1000);
      setTimeout(() => {
        if (!this.isPlaying) return;
        this.pulseIntensity = 1.0;
        if (this.material) {
          this.material.emissive.setHex(scale.emissive);
        }
      }, delayMs);
    }

    // ------------------------------------------------------------------------
    // 4. UI HOOKS & CONTROLS BINDING
    // ------------------------------------------------------------------------
    initUI() {
      const sliders = [
        { id: 'topo-slider-sprout', key: 'sprout', isInt: true },
        { id: 'topo-slider-twist',  key: 'twist',  isInt: false },
        { id: 'topo-slider-bloat',  key: 'bloat',  isInt: false },
        { id: 'topo-slider-spike',  key: 'spike',  isInt: false },
        { id: 'topo-slider-bump',   key: 'bump',   isInt: false },
        { id: 'topo-slider-tint',   key: 'tint',   isInt: false },
        { id: 'topo-slider-tumble', key: 'tumble', isInt: false }
      ];

      sliders.forEach(({ id, key, isInt }) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.value = this.params[key];

        const updateVal = (val) => {
          this.params[key] = isInt ? Math.round(Number(val)) : Number(val);
          this.updateMeshGeometry();
          if (key === 'tint' || key === 'bloat') {
            this.updateMaterialProperties();
          }
        };

        el.addEventListener('input', (e) => updateVal(e.target.value));
        el.addEventListener('change', (e) => updateVal(e.target.value));
      });

      // Play / Pause Toggle
      const playBtn = document.getElementById('btn-topo-play');
      if (playBtn) {
        playBtn.addEventListener('click', () => this.toggle());
      }

      // Mutate / Randomize Button
      const mutateBtn = document.getElementById('btn-topo-mutate');
      if (mutateBtn) {
        mutateBtn.addEventListener('click', () => this.mutate());
      }

      // Reset Button
      const resetBtn = document.getElementById('btn-topo-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => this.reset());
      }
    }

    mutate() {
      this.params.sprout = Math.floor(Math.random() * 8) + 3; // 3 to 10
      this.params.twist = Math.random();
      this.params.bloat = 0.2 + Math.random() * 0.7;
      this.params.spike = Math.random();
      this.params.bump = Math.random() * 0.8;
      this.params.tint = Math.random();
      this.params.tumble = 0.2 + Math.random() * 0.7;

      // Update DOM slider elements
      const idMap = {
        sprout: 'topo-slider-sprout',
        twist:  'topo-slider-twist',
        bloat:  'topo-slider-bloat',
        spike:  'topo-slider-spike',
        bump:   'topo-slider-bump',
        tint:   'topo-slider-tint',
        tumble: 'topo-slider-tumble'
      };

      Object.entries(idMap).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (el) el.value = this.params[key];
      });

      this.updateMeshGeometry();
      this.updateMaterialProperties();
    }

    reset() {
      this.params = {
        sprout: 5,
        twist: 0.22,
        bloat: 0.50,
        spike: 0.35,
        bump: 0.15,
        tint: 0.25,
        tumble: 0.45
      };

      const idMap = {
        sprout: 'topo-slider-sprout',
        twist:  'topo-slider-twist',
        bloat:  'topo-slider-bloat',
        spike:  'topo-slider-spike',
        bump:   'topo-slider-bump',
        tint:   'topo-slider-tint',
        tumble: 'topo-slider-tumble'
      };

      Object.entries(idMap).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (el) el.value = this.params[key];
      });

      this.updateMeshGeometry();
      this.updateMaterialProperties();
    }
  }

  // Auto-instantiate when DOM is ready
  window.addEventListener('DOMContentLoaded', () => {
    window.topoArpInstance = new TopoArpEngine();
  });
})();
