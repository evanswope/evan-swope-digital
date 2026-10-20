/**
 * TopoArp - 3D Topological Arpeggiator Synthesizer
 * Connects high-resolution liquid-metal geometry deformations to a multi-timbral Web Audio arpeggiator engine.
 * 
 * Sliders (opaque iconography with tooltips):
 * 1. Sprout  - Node / vertex count <-> Arpeggio note count, meter & polyrhythmic pulse (3..12)
 * 2. Twist   - Torsion / helical twist <-> Portamento glide & stereo unison chorus
 * 3. Bloat   - Cross-sectional inflation <-> Octave register (C1 sub-bass to C6 glass)
 * 4. Spike   - Extrusion / sharpness <-> Resonant VCF cutoff, Q squeal & FM modulator bite
 * 5. Bump    - Surface ripples / cellular noise <-> Wavefolding overdrive, ring-mod grit & continuous noise
 * 6. Tint    - Metallic color & iridescence <-> 6 radical timbre engines (Sub Void -> Glass -> Brass -> Bell -> Acid -> Cobalt)
 * 7. Tumble  - Gyro rotation speed <-> Arpeggiator tempo (60..200 BPM) & rotary stereo pan
 */

(function () {
  'use strict';

  // --- 6 RADICAL TIMBRE ENGINES (Mapped to Tint) ---
  const TIMBRES = [
    // 0.00 - 0.16: Obsidian Void (Subterranean Dark Phrygian Sub-Bass)
    {
      name: 'Obsidian Void',
      scaleName: 'Phrygian',
      intervals: [0, 1, 3, 5, 7, 8, 10, 12, 13, 15, 17, 19],
      color: 0x0f131c,
      emissive: 0x00f2fe,
      wave: 'triangle',
      subOct: 2,
      filterType: 'lowpass',
      baseCutoff: 520,
      filterQ: 2.2,
      fmRatio: 0.5,
      fmDepthMult: 0.2,
      delayFeedback: 0.55,
      delayTimeMult: 2.0
    },
    // 0.17 - 0.33: Liquid Mercury (Glassy Dorian Chime & Resonant Bandpass)
    {
      name: 'Liquid Mercury',
      scaleName: 'Dorian',
      intervals: [0, 2, 3, 5, 7, 9, 10, 12, 14, 15, 17, 19],
      color: 0xd2d6dc,
      emissive: 0x4facfe,
      wave: 'sine',
      subOct: 1,
      filterType: 'bandpass',
      baseCutoff: 2600,
      filterQ: 4.5,
      fmRatio: 2.0,
      fmDepthMult: 0.85,
      delayFeedback: 0.46,
      delayTimeMult: 1.5
    },
    // 0.34 - 0.50: Burnished Bronze (Punchy Analog Aeolian Brass)
    {
      name: 'Burnished Bronze',
      scaleName: 'Aeolian',
      intervals: [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19],
      color: 0xc87d55,
      emissive: 0xffb199,
      wave: 'sawtooth',
      subOct: 1,
      filterType: 'lowpass',
      baseCutoff: 2800,
      filterQ: 3.5,
      fmRatio: 1.5,
      fmDepthMult: 0.6,
      delayFeedback: 0.38,
      delayTimeMult: 1.0
    },
    // 0.51 - 0.67: Rose Gold (Harmonic Minor Metallic FM Church Bell)
    {
      name: 'Rose Gold',
      scaleName: 'Harmonic Minor',
      intervals: [0, 2, 3, 5, 7, 8, 11, 12, 14, 15, 19, 20],
      color: 0xb53471,
      emissive: 0xff7eb3,
      wave: 'sine',
      subOct: 0,
      filterType: 'peaking',
      baseCutoff: 1950,
      filterQ: 5.5,
      fmRatio: 3.14159, // Inharmonic metallic chime
      fmDepthMult: 1.6,
      delayFeedback: 0.52,
      delayTimeMult: 1.5
    },
    // 0.68 - 0.83: Acid Emerald (Screaming Lydian 303 Resonant Squelch)
    {
      name: 'Acid Emerald',
      scaleName: 'Lydian',
      intervals: [0, 2, 4, 6, 7, 9, 11, 12, 14, 16, 18, 19],
      color: 0x00b894,
      emissive: 0x55efc4,
      wave: 'sawtooth',
      subOct: 1,
      filterType: 'lowpass',
      baseCutoff: 4800,
      filterQ: 9.5, // Razor sharp squeal
      fmRatio: 4.0,
      fmDepthMult: 1.2,
      delayFeedback: 0.40,
      delayTimeMult: 0.75
    },
    // 0.84 - 1.00: Electric Cobalt (Mixolydian Prism High-Pass Shimmer)
    {
      name: 'Electric Cobalt',
      scaleName: 'Mixolydian',
      intervals: [0, 2, 4, 5, 7, 9, 10, 12, 14, 16, 17, 19],
      color: 0x0984e3,
      emissive: 0x74b9ff,
      wave: 'square',
      subOct: 0,
      filterType: 'highpass',
      baseCutoff: 1400,
      filterQ: 3.2,
      fmRatio: 2.76,
      fmDepthMult: 1.1,
      delayFeedback: 0.62,
      delayTimeMult: 1.25
    }
  ];

  class TopoArpEngine {
    constructor() {
      this.container = document.getElementById('topo-canvas-container');
      if (!this.container) return;

      this.isPlaying = false;
      this.audioCtx = null;
      this.masterGain = null;
      this.delayNode = null;
      this.delayFeedback = null;
      this.filterNode = null;
      this.waveShaperNode = null;
      this.noiseBuffer = null;

      // Clock / Arp state
      this.currentStep = 0;
      this.nextNoteTime = 0;
      this.timerId = null;
      this.lastFreq = 220;

      // Parameters
      this.params = {
        sprout: 5,     // 3..12 nodes
        twist: 0.28,   // 0..1
        bloat: 0.50,   // 0..1
        spike: 0.40,   // 0..1
        bump: 0.20,    // 0..1
        tint: 0.35,    // 0..1
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
    // 1. THREE.JS 3D SCENE & HIGH-RESOLUTION FLUID GEOMETRY
    // ------------------------------------------------------------------------
    init3D() {
      const width = this.container.clientWidth || 640;
      const height = this.container.clientHeight || 380;

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      this.camera.position.set(0, 0, 7.5);

      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.35;
      this.container.appendChild(this.renderer.domElement);

      // Studio Lighting for metallic liquid reflections
      const ambient = new THREE.AmbientLight(0xffffff, 0.65);
      this.scene.add(ambient);

      const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(6, 8, 7);
      this.scene.add(keyLight);

      this.pointLight1 = new THREE.PointLight(0x00f2fe, 3.5, 16);
      this.pointLight1.position.set(-5, -4, 4);
      this.scene.add(this.pointLight1);

      this.pointLight2 = new THREE.PointLight(0xff7eb3, 3.2, 16);
      this.pointLight2.position.set(5, 4, -3);
      this.scene.add(this.pointLight2);

      // High-resolution UV sphere (128 radial x 96 vertical segments = ~12,500 vertices)
      // Eliminates crystalline facets and produces silky-smooth fluid fluted twisting!
      this.baseGeometry = new THREE.SphereGeometry(2.0, 128, 96);
      const posAttr = this.baseGeometry.attributes.position;
      this.origVertices = new Float32Array(posAttr.array);

      this.material = new THREE.MeshStandardMaterial({
        color: 0x8a929e,
        metalness: 0.96,
        roughness: 0.14,
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
    // 2. PROCEDURAL 3D TOPOLOGY DEFORMATION (Fluid Chrome Kinetic Sculpture)
    // ------------------------------------------------------------------------
    updateMeshGeometry() {
      if (!this.mesh) return;
      const posAttr = this.baseGeometry.attributes.position;
      const pos = posAttr.array;
      const orig = this.origVertices;

      const N = Math.round(this.params.sprout); // 3 to 12 lobes
      const twistAmt = this.params.twist * 9.5; // Dramatic helical torsion (up to 1.5 turns!)
      const bloatAmt = 0.42 + this.params.bloat * 0.95; // Slender spindle to bulbous balloon
      const spikeAmt = this.params.spike; // 0..1 sharpness
      const bumpAmt = this.params.bump; // 0..1 surface ripples

      const count = orig.length / 3;

      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        const ox = orig[idx];
        const oy = orig[idx + 1];
        const oz = orig[idx + 2];

        const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
        const ny = oy / (len || 1);

        // Spherical coordinates
        const theta = Math.atan2(oz, ox);
        const phi = Math.acos(Math.max(-1, Math.min(1, ny))); // 0 (north pole) to PI (south pole)

        // 1. Helical Twist on azimuth angle (proportional to vertical position)
        const thetaTwisted = theta + ny * twistAmt;

        // 2. Sprout Lobes with smooth polar attenuation (sin(phi) prevents pole pinching)
        const sinPhi = Math.sin(phi);
        const lobeVal = Math.cos(N * thetaTwisted) * Math.pow(sinPhi, 1.2);

        // Helical fluting ribs that swirl visibly along the twist axis
        const fluting = Math.sin(N * thetaTwisted + phi * 3.5) * 0.28 * this.params.twist;

        // 3. Spike Power Curve (smooth hills -> curved razor horns)
        const spikeShape = Math.sign(lobeVal) * Math.pow(Math.abs(lobeVal), Math.max(0.65, 2.7 - spikeAmt * 1.7));
        const rLobe = 1.0 + spikeShape * (0.35 + spikeAmt * 0.92) + fluting;

        // 4. Bloat Scale (squashes wider when bloated, stretches taller when thin)
        const rBloat = bloatAmt * (1.0 + 0.12 * Math.cos(phi * 2.0));
        const yScale = 0.75 + (1.0 - this.params.bloat) * 0.65;

        // 5. Bump 3D Ripples (Cellular noise simulation)
        let rBump = 0;
        if (bumpAmt > 0.02) {
          rBump = bumpAmt * 0.32 * (
            Math.sin(ox * 24.0) * Math.cos(oy * 24.0) * Math.sin(oz * 24.0) +
            0.4 * Math.sin(ox * 48.0) * Math.cos(oz * 48.0)
          );
        }

        const finalR = 2.05 * rBloat * rLobe + rBump;

        pos[idx]     = Math.cos(thetaTwisted) * sinPhi * finalR;
        pos[idx + 1] = Math.cos(phi) * finalR * yScale;
        pos[idx + 2] = Math.sin(thetaTwisted) * sinPhi * finalR;
      }

      posAttr.needsUpdate = true;
      this.baseGeometry.computeVertexNormals();
    }

    updateMaterialProperties() {
      if (!this.material) return;
      const t = Math.max(0, Math.min(1, this.params.tint));
      const idx = Math.min(TIMBRES.length - 1, Math.floor(t * TIMBRES.length));
      const timbre = TIMBRES[idx];

      this.material.color.setHex(timbre.color);
      // Smoother, deeper mirror-like clearcoat
      this.material.roughness = 0.10 + (1.0 - this.params.bloat) * 0.14 + this.params.bump * 0.12;

      if (this.pointLight1) this.pointLight1.color.setHex(timbre.emissive);
      if (this.pointLight2) this.pointLight2.color.setHex(timbre.emissive);

      // Live-update DSP nodes if playing
      if (this.filterNode && this.audioCtx) {
        this.filterNode.type = timbre.filterType;
        const currentQ = timbre.filterQ * (0.8 + this.params.spike * 0.6);
        this.filterNode.Q.setTargetAtTime(currentQ, this.audioCtx.currentTime, 0.05);
      }
      if (this.delayFeedback && this.audioCtx) {
        this.delayFeedback.gain.setTargetAtTime(timbre.delayFeedback, this.audioCtx.currentTime, 0.05);
      }
      if (this.waveShaperNode) {
        this.waveShaperNode.curve = this.makeWavefolderCurve(this.params.bump);
      }
    }

    animate() {
      requestAnimationFrame(() => this.animate());

      if (this.mesh) {
        // Tumble kinetic spin speed
        const tumbleSpeed = 0.003 + this.params.tumble * 0.042;

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
          this.material.emissiveIntensity = this.pulseIntensity * 1.8;
        } else {
          this.material.emissiveIntensity = 0.0;
        }
      }

      this.renderer.render(this.scene, this.camera);
    }

    // ------------------------------------------------------------------------
    // 3. WEB AUDIO ENGINE (Multi-Timbral Synthesis & Wavefolding Distortion)
    // ------------------------------------------------------------------------
    makeWavefolderCurve(amount) {
      const n = 1024;
      const curve = new Float32Array(n);
      if (amount < 0.04) {
        for (let i = 0; i < n; i++) {
          curve[i] = (i * 2) / n - 1;
        }
        return curve;
      }
      // West-Coast style sine wavefolder + soft-saturation drive
      const drive = 1.0 + amount * 12.0;
      for (let i = 0; i < n; i++) {
        const x = (i * 2) / n - 1;
        const scaled = x * drive;
        curve[i] = Math.sin(scaled * 1.5707963);
      }
      return curve;
    }

    initAudio() {
      if (this.audioCtx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();

      // Master output bus with warm compression
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0.72, this.audioCtx.currentTime);

      // Dedicated Wavefolder / Distortion Shaper for Bump grit!
      this.waveShaperNode = this.audioCtx.createWaveShaper();
      this.waveShaperNode.curve = this.makeWavefolderCurve(this.params.bump);

      // Stereo Ping-Pong Delay
      this.delayNode = this.audioCtx.createDelay(1.5);
      this.delayNode.delayTime.value = 0.28;
      this.delayFeedback = this.audioCtx.createGain();
      this.delayFeedback.gain.value = 0.42;

      this.delayNode.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
      this.delayNode.connect(this.masterGain);

      // Multimode Filter (Type determined dynamically by Tint)
      this.filterNode = this.audioCtx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = 2400;
      this.filterNode.Q.value = 3.2;

      // Filter -> Wavefolder -> Master & Delay
      this.filterNode.connect(this.waveShaperNode);
      this.waveShaperNode.connect(this.masterGain);
      this.waveShaperNode.connect(this.delayNode);

      // White noise buffer for Bump texture
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

        // Tempo mapped from Tumble (60 BPM to 200 BPM)
        const bpm = 60 + this.params.tumble * 140;
        const stepSec = 60 / (bpm * 2); // 8th note steps

        // Delay sync to tempo and current Tint timbre multiplier
        const tIdx = Math.min(TIMBRES.length - 1, Math.floor(this.params.tint * TIMBRES.length));
        const timbre = TIMBRES[tIdx];
        if (this.delayNode) {
          this.delayNode.delayTime.setTargetAtTime(stepSec * (timbre.delayTimeMult || 1.5), this.nextNoteTime, 0.05);
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

      // 1. Current Timbre Profile from Tint
      const tIdx = Math.min(TIMBRES.length - 1, Math.floor(this.params.tint * TIMBRES.length));
      const timbre = TIMBRES[tIdx];
      const intervals = timbre.intervals;
      const interval = intervals[stepIdx % intervals.length];

      // 2. Base Octave & Polyrhythmic Pulse Accent
      // Bloat maps from C6 (glassy chime) down to C1 (32Hz sub-bass rumble!)
      const baseMidi = 64 - Math.round(this.params.bloat * 36) - (timbre.subOct * 12);
      // Downbeat accent on step 0
      const isDownbeat = stepIdx === 0;
      const noteOctShift = (isDownbeat && Math.round(this.params.sprout) % 2 !== 0) ? 12 : 0;
      const midi = baseMidi + interval + noteOctShift;
      const targetFreq = 440 * Math.pow(2, (midi - 69) / 12);

      // 3. Dual-Oscillator + FM Synthesis Voice
      const carrier = this.audioCtx.createOscillator();
      const modulator = this.audioCtx.createOscillator();
      const fmGain = this.audioCtx.createGain();
      const subOsc = this.audioCtx.createOscillator();
      const voiceGain = this.audioCtx.createGain();

      carrier.type = timbre.wave;
      subOsc.type = 'sine';
      modulator.type = 'sine';

      // Portamento Glide (Mapped to Twist)
      const glideTime = 0.003 + this.params.twist * 0.28;
      carrier.frequency.setValueAtTime(this.lastFreq, time);
      carrier.frequency.exponentialRampToValueAtTime(targetFreq, time + glideTime);

      // Stereo Unison Detune on Twist
      carrier.detune.setValueAtTime(this.params.twist * 14.0, time);

      subOsc.frequency.setValueAtTime(this.lastFreq * 0.5, time);
      subOsc.frequency.exponentialRampToValueAtTime(targetFreq * 0.5, time + glideTime);

      // 4. FM Modulator (Bite mapped to Spike & Timbre FM Ratio)
      const modRatio = timbre.fmRatio || 2.0;
      modulator.frequency.setValueAtTime(targetFreq * modRatio, time);
      const fmPeak = targetFreq * this.params.spike * 2.8 * timbre.fmDepthMult;
      fmGain.gain.setValueAtTime(fmPeak, time);
      fmGain.gain.exponentialRampToValueAtTime(Math.max(1, fmPeak * 0.15), time + 0.12);

      modulator.connect(fmGain);
      fmGain.connect(carrier.frequency);

      this.lastFreq = targetFreq;

      // 5. Dynamic Multimode Filter Sweep (Cutoff mapped to Spike + Timbre)
      const rawCutoff = timbre.baseCutoff + Math.pow(this.params.spike, 1.6) * 7200;
      const cutoff = Math.max(120, Math.min(14000, rawCutoff));
      this.filterNode.type = timbre.filterType;
      this.filterNode.frequency.setTargetAtTime(cutoff, time, 0.02);
      this.filterNode.Q.setTargetAtTime(timbre.filterQ, time, 0.02);

      // 6. Sub-bass volume (Bloat)
      const subGain = this.audioCtx.createGain();
      subGain.gain.setValueAtTime(this.params.bloat * 0.65, time);
      subOsc.connect(subGain);
      subGain.connect(this.filterNode);

      // 7. Bump Audio Artifacts: Wavefolding + Sub-Harmonic Ring Mod + Continuous Texture
      if (this.params.bump > 0.08) {
        // Continuous gritty hiss & vinyl texture throughout note duration
        if (this.noiseBuffer) {
          const noiseSrc = this.audioCtx.createBufferSource();
          noiseSrc.buffer = this.noiseBuffer;
          const nGain = this.audioCtx.createGain();
          const nLevel = this.params.bump * 0.22;
          nGain.gain.setValueAtTime(nLevel, time);
          nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
          noiseSrc.connect(nGain);
          nGain.connect(this.filterNode);
          noiseSrc.start(time);
          noiseSrc.stop(time + 0.20);
        }

        // Sub-harmonic ring modulation for dirty metallic rasp
        const ringOsc = this.audioCtx.createOscillator();
        const ringGain = this.audioCtx.createGain();
        ringOsc.frequency.setValueAtTime(targetFreq * 0.5, time);
        ringGain.gain.setValueAtTime(this.params.bump * 0.38, time);
        ringOsc.connect(ringGain);
        ringGain.connect(carrier.frequency);
        ringOsc.start(time);
        ringOsc.stop(time + 0.25);
      }

      // 8. Stereo Auto-Pan (Tumble)
      if (this.audioCtx.createStereoPanner) {
        const panner = this.audioCtx.createStereoPanner();
        const panVal = Math.sin(stepIdx * 1.8 + this.params.tumble * 5.0) * 0.72;
        panner.pan.setValueAtTime(panVal, time);
        voiceGain.connect(panner);
        panner.connect(this.filterNode);
      } else {
        voiceGain.connect(this.filterNode);
      }

      // 9. Amplitude Envelope (ADSR) with Downbeat Dynamics
      const noteDur = 0.14 + (1.0 - this.params.tumble) * 0.16;
      const peakVol = isDownbeat ? 0.85 : 0.68;
      voiceGain.gain.setValueAtTime(0.0001, time);
      voiceGain.gain.linearRampToValueAtTime(peakVol, time + 0.012);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, time + noteDur);

      carrier.connect(voiceGain);

      carrier.start(time);
      subOsc.start(time);
      modulator.start(time);

      carrier.stop(time + noteDur + 0.05);
      subOsc.stop(time + noteDur + 0.05);
      modulator.stop(time + noteDur + 0.05);

      // Visual Beat Trigger (Emissive Pulse on 3D metallic mesh)
      const delayMs = Math.max(0, (time - this.audioCtx.currentTime) * 1000);
      setTimeout(() => {
        if (!this.isPlaying) return;
        this.pulseIntensity = 1.0;
        if (this.material) {
          this.material.emissive.setHex(timbre.emissive);
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
          this.updateMaterialProperties();
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
      this.params.bump = Math.random() * 0.85;
      this.params.tint = Math.random();
      this.params.tumble = 0.2 + Math.random() * 0.7;

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
        twist: 0.28,
        bloat: 0.50,
        spike: 0.40,
        bump: 0.20,
        tint: 0.35,
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
