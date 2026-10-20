/**
 * TopoArp - 3D Topological Arpeggiator Synthesizer
 * Connects high-density metallic kinetic sculpture deformations to a warm, melodic Web Audio arpeggiator engine.
 * 
 * Sliders (opaque iconography with tooltips):
 * 1. Sprout  - Node / vertex count <-> Arpeggio note count & loop meter (3..12)
 * 2. Twist   - Helical torsion <-> Portamento note glide & analog unison chorus
 * 3. Bloat   - Cross-sectional inflation <-> Octave register (C2 deep bass to C6 chime) & sub-oscillator body
 * 4. Spike   - Fluted rib sharpness <-> Resonant VCF filter cutoff & juicy pluck envelope bite
 * 5. Bump    - Surface ripples / dimples <-> Warm tape saturation drive & vintage vinyl warmth
 * 6. Tint    - Metallic finish & emissive glow <-> 6 musical modal scale moods
 * 7. Tumble  - Gyro rotation speed <-> Arpeggiator tempo (60..190 BPM) & bouncy stereo auto-pan
 */

(function () {
  'use strict';

  // --- 6 MUSICAL MODAL SCALES (Mapped to Tint) ---
  const SCALES = [
    // 0.00 - 0.16: Obsidian Void (Dark, subterranean Phrygian)
    {
      name: 'Obsidian Void',
      scaleName: 'Phrygian',
      intervals: [0, 1, 3, 5, 7, 8, 10, 12, 13, 15, 17, 19],
      color: 0x141824,
      emissive: 0x00f2fe,
      delayFeedback: 0.46
    },
    // 0.17 - 0.33: Liquid Mercury (Glassy, soulful Dorian)
    {
      name: 'Liquid Mercury',
      scaleName: 'Dorian',
      intervals: [0, 2, 3, 5, 7, 9, 10, 12, 14, 15, 17, 19],
      color: 0xd2d6dc,
      emissive: 0x4facfe,
      delayFeedback: 0.42
    },
    // 0.34 - 0.50: Burnished Bronze (Warm, nostalgic Aeolian)
    {
      name: 'Burnished Bronze',
      scaleName: 'Aeolian',
      intervals: [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19],
      color: 0xc87d55,
      emissive: 0xffb199,
      delayFeedback: 0.38
    },
    // 0.51 - 0.67: Rose Gold (Dramatic, neoclassical Harmonic Minor)
    {
      name: 'Rose Gold',
      scaleName: 'Harmonic Minor',
      intervals: [0, 2, 3, 5, 7, 8, 11, 12, 14, 15, 19, 20],
      color: 0xb53471,
      emissive: 0xff7eb3,
      delayFeedback: 0.44
    },
    // 0.68 - 0.83: Acid Emerald (Dreamy, sci-fi Lydian)
    {
      name: 'Acid Emerald',
      scaleName: 'Lydian',
      intervals: [0, 2, 4, 6, 7, 9, 11, 12, 14, 16, 18, 19],
      color: 0x00b894,
      emissive: 0x55efc4,
      delayFeedback: 0.40
    },
    // 0.84 - 1.00: Electric Cobalt (Radiant, uplifting Mixolydian)
    {
      name: 'Electric Cobalt',
      scaleName: 'Mixolydian',
      intervals: [0, 2, 4, 5, 7, 9, 10, 12, 14, 16, 17, 19],
      color: 0x0984e3,
      emissive: 0x74b9ff,
      delayFeedback: 0.48
    }
  ];

  class TopoArpEngine {
    constructor() {
      this.container = document.getElementById('topo-canvas-container');
      if (!this.container) return;

      this.isPlaying = false;
      this.audioCtx = null;
      this.masterGain = null;
      this.limiterNode = null;
      this.delayNode = null;
      this.delayFeedback = null;
      this.filterNode = null;
      this.tapeShaperNode = null;
      this.noiseBuffer = null;
      this.lastAppliedBump = 0.20;

      // Clock / Arp state
      this.currentStep = 0;
      this.nextNoteTime = 0;
      this.timerId = null;
      this.lastFreq = 261.63; // C4 default

      // Independent Parameters
      this.params = {
        sprout: 5,     // 3..12 nodes / notes
        twist: 0.35,   // 0..1 helical torsion / portamento glide
        bloat: 0.50,   // 0..1 fullness / octave register
        spike: 0.35,   // 0..1 rib sharpness / filter cutoff & pluck
        bump: 0.20,    // 0..1 surface ripples / warm tape drive
        tint: 0.35,    // 0..1 modal scale & metallic color
        tumble: 0.45   // 0..1 rotation speed / tempo & stereo pan
      };

      // Animation & mesh update flags
      this.needsMeshUpdate = false;
      this.needsMaterialUpdate = false;

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

      // Radiating Luma Waves (Surface vertex ripples)
      this.ripples = [];
      for (let i = 0; i < 8; i++) {
        this.ripples.push({
          active: false,
          origin: new THREE.Vector3(),
          age: -1.0,
          speed: 2.2
        });
      }
      this.rippleHead = 0;
      this.lastFrameTime = performance.now();

      this.rippleUniforms = {
        uRippleOrigins: {
          value: [
            new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(),
            new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()
          ]
        },
        uRippleAges: { value: new Float32Array(8).fill(-1.0) },
        uLumaColor: { value: new THREE.Color(0x00f2fe) }
      };

      this.nodeLight = null;
      this.nodeLightIntensity = 0.0;

      this.init3D();
      this.initUI();
      this.updateMeshGeometry();
      this.updateMaterialProperties();
    }

    // ------------------------------------------------------------------------
    // 1. THREE.JS 3D SCENE & HIGH-DENSITY GEODESIC GEOMETRY
    // ------------------------------------------------------------------------
    init3D() {
      const width = this.container.clientWidth || 640;
      const height = this.container.clientHeight || 380;

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
      this.renderer.toneMappingExposure = 1.30;
      this.container.appendChild(this.renderer.domElement);

      // Studio Lighting for metallic reflections
      const ambient = new THREE.AmbientLight(0xffffff, 0.75);
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

      // Geodesic Icosahedron (detail: 5 = 10,240 smooth, uniformly distributed faces)
      this.baseGeometry = new THREE.IcosahedronGeometry(2.1, 5);
      const posAttr = this.baseGeometry.attributes.position;
      this.origVertices = new Float32Array(posAttr.array);

      // Seamless metallic material with custom GPU shader for radiating luma waves
      this.material = new THREE.MeshStandardMaterial({
        color: 0x8a929e,
        metalness: 0.94,
        roughness: 0.16,
        emissive: 0x000000,
        emissiveIntensity: 0.0,
        flatShading: false
      });

      this.material.onBeforeCompile = (shader) => {
        shader.uniforms.uRippleOrigins = this.rippleUniforms.uRippleOrigins;
        shader.uniforms.uRippleAges = this.rippleUniforms.uRippleAges;
        shader.uniforms.uLumaColor = this.rippleUniforms.uLumaColor;

        shader.vertexShader = `
          varying vec3 vLocalPos;
        ` + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
          vLocalPos = transformed;
          `
        );

        shader.fragmentShader = `
          varying vec3 vLocalPos;
          uniform vec3 uRippleOrigins[8];
          uniform float uRippleAges[8];
          uniform vec3 uLumaColor;
        ` + shader.fragmentShader;

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <emissivemap_fragment>',
          `
          #include <emissivemap_fragment>
          vec3 lumaAccum = vec3(0.0);
          for (int i = 0; i < 8; i++) {
            float age = uRippleAges[i];
            if (age >= 0.0 && age < 1.0) {
              float d = distance(vLocalPos, uRippleOrigins[i]);
              float waveRadius = age * 1.5;
              // Radiant wavefront ring radiating out across vertices
              float ring = exp(-pow((d - waveRadius) * 4.5, 2.0));
              // Soft warm origin core
              float core = exp(-d * 3.0) * (1.0 - age);
              // Composite luma fading as it expands
              float intensity = (ring * 1.6 + core * 2.4) * pow(1.0 - age, 1.6);
              lumaAccum += uLumaColor * intensity;
            }
          }
          totalEmissiveRadiance += lumaAccum;
          `
        );
      };

      this.mesh = new THREE.Mesh(this.baseGeometry, this.material);
      this.scene.add(this.mesh);

      // Localized point light at active ripple origin
      this.nodeLight = new THREE.PointLight(0x00f2fe, 0.0, 4.0, 2.0);
      this.mesh.add(this.nodeLight);

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

      const N = Math.round(this.params.sprout); // 3 to 12 fluted lobes
      const twistRate = this.params.twist * 4.6; // True helical torsion
      const bloatAmt = 0.55 + this.params.bloat * 0.85; // Slender spindle to bulbous gourd
      const spikeAmt = this.params.spike; // 0..1 sharpness
      const bumpAmt = this.params.bump; // 0..1 surface ripples

      // Bloat modifies the vertical-to-horizontal aspect ratio
      const yScale = 1.30 - this.params.bloat * 0.55;

      const count = orig.length / 3;

      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        const ox = orig[idx];
        const oy = orig[idx + 1];
        const oz = orig[idx + 2];

        const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
        const nx = ox / (len || 1);
        const ny = oy / (len || 1);
        const nz = oz / (len || 1);

        // Cylindrical / Spherical coordinates
        const theta = Math.atan2(nz, nx);
        const phi = Math.asin(Math.max(-1, Math.min(1, ny))); // -PI/2 to PI/2
        const cosPhi = Math.cos(phi);

        // True Helical Torsion
        const spiralAngle = theta - ny * twistRate;

        // 1. Sprout Lobes with smooth polar taper
        const rawLobe = Math.cos(N * spiralAngle) * (0.45 + 0.55 * cosPhi);

        // 2. Spike Profile (Smooth pillowy mounds at low spike, crisp defined flutes at high spike)
        const power = Math.max(0.7, 2.2 - spikeAmt * 1.3);
        const shapedLobe = Math.sign(rawLobe) * Math.pow(Math.abs(rawLobe), power);
        const rRib = 1.0 + shapedLobe * (0.22 + spikeAmt * 0.42);

        // 3. Bump Surface Micro-Texture
        let rBump = 0;
        if (bumpAmt > 0.02) {
          rBump = bumpAmt * 0.14 * (
            Math.sin(nx * 18.0) * Math.cos(ny * 18.0) * Math.sin(nz * 18.0) +
            0.5 * Math.sin(nx * 36.0 + nz * 36.0)
          );
        }

        // Final radial profile in the XZ plane
        const finalR = 2.05 * bloatAmt * rRib + rBump;

        pos[idx]     = nx * finalR;
        pos[idx + 1] = oy * bloatAmt * yScale + (rBump * 0.5);
        pos[idx + 2] = nz * finalR;
      }

      posAttr.needsUpdate = true;
      this.baseGeometry.computeVertexNormals();
    }

    updateMaterialProperties() {
      if (!this.material) return;
      const t = Math.max(0, Math.min(1, this.params.tint));
      const idx = Math.min(SCALES.length - 1, Math.floor(t * SCALES.length));
      const scaleObj = SCALES[idx];

      this.material.color.setHex(scaleObj.color);
      this.material.roughness = 0.12 + (1.0 - this.params.bloat) * 0.10 + this.params.bump * 0.10;

      if (this.pointLight1) this.pointLight1.color.setHex(scaleObj.emissive);
      if (this.pointLight2) this.pointLight2.color.setHex(scaleObj.emissive);

      if (this.rippleUniforms) {
        this.rippleUniforms.uLumaColor.value.setHex(scaleObj.emissive);
      }

      if (this.delayFeedback && this.audioCtx) {
        this.delayFeedback.gain.setTargetAtTime(scaleObj.delayFeedback, this.audioCtx.currentTime, 0.05);
      }

      // Only regenerate shaper curve if bump changed meaningfully (prevents audio click)
      if (this.tapeShaperNode && Math.abs(this.lastAppliedBump - this.params.bump) > 0.06) {
        this.tapeShaperNode.curve = this.makeTapeSaturationCurve(this.params.bump);
        this.lastAppliedBump = this.params.bump;
      }
    }

    animate() {
      requestAnimationFrame(() => this.animate());

      // Throttled geometry updates (runs at 60fps max, decoupled from 120Hz slider events)
      if (this.needsMeshUpdate) {
        this.updateMeshGeometry();
        this.needsMeshUpdate = false;
      }
      if (this.needsMaterialUpdate) {
        this.updateMaterialProperties();
        this.needsMaterialUpdate = false;
      }

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
          this.mesh.rotation.z += tumbleSpeed * 0.30;
        }

        // Calculate delta time for smooth wave expansion
        const now = performance.now();
        const dt = Math.min(0.05, (now - this.lastFrameTime) * 0.001);
        this.lastFrameTime = now;

        // Advance radiating luma ripples across surface vertices
        for (let i = 0; i < 8; i++) {
          const r = this.ripples[i];
          if (r.active) {
            r.age += r.speed * dt;
            if (r.age >= 1.0) {
              r.active = false;
              r.age = -1.0;
            }
          }
          if (this.rippleUniforms) {
            this.rippleUniforms.uRippleAges.value[i] = r.age;
            this.rippleUniforms.uRippleOrigins.value[i].copy(r.origin);
          }
        }

        // Localized point light decay
        if (this.nodeLightIntensity > 0.01) {
          this.nodeLightIntensity *= 0.86;
          if (this.nodeLight) {
            this.nodeLight.intensity = this.nodeLightIntensity;
          }
        } else if (this.nodeLight) {
          this.nodeLight.intensity = 0.0;
        }
      }

      this.renderer.render(this.scene, this.camera);
    }

    triggerLumaRipple(stepIdx, interval, isDownbeat, scaleObj) {
      const N = Math.round(this.params.sprout);
      const lobeIdx = stepIdx % N;

      // Base azimuth angle for this lobe
      const theta = (2 * Math.PI * lobeIdx) / N;

      // Elevation maps organically to the note pitch interval in the scale
      const pitchRatio = Math.min(1.0, Math.max(0.0, (interval || 0) / 20));
      const ny = -0.35 + pitchRatio * 0.70;

      // Compute exact 3D coordinates of the target vertex on the deformed mesh surface
      const twistRate = this.params.twist * 4.6;
      const spiralTheta = theta + ny * twistRate;

      const bloatAmt = 0.55 + this.params.bloat * 0.85;
      const spikeAmt = this.params.spike;
      const yScale = 1.30 - this.params.bloat * 0.55;

      const phi = Math.asin(Math.max(-1, Math.min(1, ny)));
      const cosPhi = Math.cos(phi);

      const rawLobe = 0.45 + 0.55 * cosPhi;
      const power = Math.max(0.7, 2.2 - spikeAmt * 1.3);
      const rRib = 1.0 + Math.pow(rawLobe, power) * (0.22 + spikeAmt * 0.42);
      const finalR = 2.05 * bloatAmt * rRib;

      const origin = new THREE.Vector3(
        finalR * Math.cos(spiralTheta),
        ny * 2.1 * bloatAmt * yScale,
        finalR * Math.sin(spiralTheta)
      );

      // Trigger radiating ripple in ring buffer
      const r = this.ripples[this.rippleHead];
      r.active = true;
      r.origin.copy(origin);
      r.age = 0.0;
      r.speed = 1.5 + this.params.tumble * 1.8;
      this.rippleHead = (this.rippleHead + 1) % 8;

      if (this.rippleUniforms) {
        this.rippleUniforms.uLumaColor.value.setHex(scaleObj.emissive);
      }

      // Flash localized point light at the origin vertex
      if (this.nodeLight) {
        this.nodeLight.position.copy(origin);
        this.nodeLight.color.setHex(scaleObj.emissive);
        this.nodeLightIntensity = isDownbeat ? 5.0 : 3.6;
      }
    }

    // ------------------------------------------------------------------------
    // 3. WARM MELODIC WEB AUDIO SYNTHESIZER ENGINE (Click-Free & Master-Limited)
    // ------------------------------------------------------------------------
    makeTapeSaturationCurve(amount) {
      const n = 1024;
      const curve = new Float32Array(n);
      if (amount < 0.04) {
        for (let i = 0; i < n; i++) {
          curve[i] = (i * 2) / n - 1;
        }
        return curve;
      }
      // Warm analog soft-clipping tape saturation (smooth arctan drive)
      const drive = 1.0 + amount * 3.5;
      const norm = 2.0 / Math.PI;
      for (let i = 0; i < n; i++) {
        const x = (i * 2) / n - 1;
        curve[i] = norm * Math.atan(x * drive);
      }
      return curve;
    }

    initAudio() {
      if (this.audioCtx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();

      // Master output bus with calibrated gain headroom
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0.65, this.audioCtx.currentTime);

      // Studio Brickwall Limiter to prevent ANY digital clipping, DAC overflow, or popping
      this.limiterNode = this.audioCtx.createDynamicsCompressor();
      this.limiterNode.threshold.setValueAtTime(-2.5, this.audioCtx.currentTime); // -2.5 dBFS ceiling
      this.limiterNode.knee.setValueAtTime(6.0, this.audioCtx.currentTime);
      this.limiterNode.ratio.setValueAtTime(16.0, this.audioCtx.currentTime);    // Hard limiting
      this.limiterNode.attack.setValueAtTime(0.003, this.audioCtx.currentTime);  // 3ms catch
      this.limiterNode.release.setValueAtTime(0.12, this.audioCtx.currentTime);  // 120ms transparent release

      // Warm Tape Saturation Shaper for Bump
      this.tapeShaperNode = this.audioCtx.createWaveShaper();
      this.tapeShaperNode.curve = this.makeTapeSaturationCurve(this.params.bump);

      // Dotted-eighth Hypnotic Echo Delay
      this.delayNode = this.audioCtx.createDelay(1.5);
      this.delayNode.delayTime.value = 0.28;
      this.delayFeedback = this.audioCtx.createGain();
      this.delayFeedback.gain.value = 0.40;

      this.delayNode.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
      this.delayNode.connect(this.masterGain);

      // Resonant Lowpass Filter (Spike gives sweet, musical, juicy sweeps)
      this.filterNode = this.audioCtx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = 2400;
      this.filterNode.Q.value = 2.5;

      // Filter -> Tape Saturation -> Master & Delay -> Limiter -> Destination
      this.filterNode.connect(this.tapeShaperNode);
      this.tapeShaperNode.connect(this.masterGain);
      this.tapeShaperNode.connect(this.delayNode);

      this.masterGain.connect(this.limiterNode);
      this.limiterNode.connect(this.audioCtx.destination);

      // White noise buffer for subtle vintage vinyl air on Bump
      const bufferSize = this.audioCtx.sampleRate * 2;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = noiseBuffer;
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

      // Reset ripples and light cleanly
      if (this.nodeLight) this.nodeLight.intensity = 0.0;
      this.nodeLightIntensity = 0.0;
      for (let i = 0; i < 8; i++) {
        this.ripples[i].active = false;
        this.ripples[i].age = -1.0;
        if (this.rippleUniforms) {
          this.rippleUniforms.uRippleAges.value[i] = -1.0;
        }
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

      const now = this.audioCtx.currentTime;

      // Resync cleanly if slider drags or main thread jank caused late scheduling
      if (this.nextNoteTime < now) {
        this.nextNoteTime = now + 0.02;
      }

      while (this.nextNoteTime < now + 0.12) {
        this.playStep(this.nextNoteTime, this.currentStep);

        // Tempo mapped from Tumble (65 BPM to 185 BPM)
        const bpm = 65 + this.params.tumble * 120;
        const stepSec = 60 / (bpm * 2); // 8th note steps

        // Hypnotic dotted-eighth echo sync with gentle, continuous smoothing
        if (this.delayNode) {
          const targetDelay = Math.min(1.4, stepSec * 1.5);
          this.delayNode.delayTime.setTargetAtTime(targetDelay, this.nextNoteTime, 0.25);
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

      // 1. Current Scale Profile from Tint
      const tIdx = Math.min(SCALES.length - 1, Math.floor(this.params.tint * SCALES.length));
      const scaleObj = SCALES[tIdx];
      const intervals = scaleObj.intervals;
      const interval = intervals[stepIdx % intervals.length];

      // 2. Base Octave governed musically by Bloat
      const baseMidi = 60 - Math.round(this.params.bloat * 24);
      const isDownbeat = stepIdx === 0;
      const noteOctShift = (isDownbeat && Math.round(this.params.sprout) % 2 !== 0) ? 12 : 0;
      const midi = baseMidi + interval + noteOctShift;
      const targetFreq = 440 * Math.pow(2, (midi - 69) / 12);

      // 3. Charming Melodic Voice (Triangle smoothly morphing into Sawtooth via Spike)
      const oscTri = this.audioCtx.createOscillator();
      const oscSaw = this.audioCtx.createOscillator();
      const subOsc = this.audioCtx.createOscillator();

      const triGain = this.audioCtx.createGain();
      const sawGain = this.audioCtx.createGain();
      const subGain = this.audioCtx.createGain();
      const voiceGain = this.audioCtx.createGain();

      oscTri.type = 'triangle';
      oscSaw.type = 'sawtooth';
      subOsc.type = 'sine';

      // Crossfade smoothly between warm cozy triangle and bright singing sawtooth
      const spikeMix = this.params.spike; // 0..1
      triGain.gain.setValueAtTime(Math.cos(spikeMix * Math.PI * 0.5), time);
      sawGain.gain.setValueAtTime(Math.sin(spikeMix * Math.PI * 0.5) * 0.85, time);

      // Sub-bass body layer (governed by Bloat)
      subGain.gain.setValueAtTime(0.12 + this.params.bloat * 0.48, time);

      // Portamento Pitch Glide (Twist)
      const glideTime = 0.004 + this.params.twist * 0.24;
      oscTri.frequency.setValueAtTime(this.lastFreq, time);
      oscTri.frequency.exponentialRampToValueAtTime(targetFreq, time + glideTime);

      oscSaw.frequency.setValueAtTime(this.lastFreq, time);
      oscSaw.frequency.exponentialRampToValueAtTime(targetFreq, time + glideTime);

      subOsc.frequency.setValueAtTime(this.lastFreq * 0.5, time);
      subOsc.frequency.exponentialRampToValueAtTime(targetFreq * 0.5, time + glideTime);

      // Analog Unison Detune (Twist adds lush chorusing)
      const detuneCents = this.params.twist * 12.0;
      oscTri.detune.setValueAtTime(detuneCents, time);
      oscSaw.detune.setValueAtTime(-detuneCents, time);

      this.lastFreq = targetFreq;

      // 4. Resonant Lowpass Filter Envelope Sweep (Click-free continuous ramps)
      const baseCutoff = 350 + Math.pow(this.params.spike, 1.8) * 8000;
      const peakCutoff = Math.min(13500, baseCutoff + 500 + this.params.spike * 3200);
      const resQ = 1.2 + this.params.spike * 5.0;

      this.filterNode.Q.setTargetAtTime(resQ, time, 0.03);
      this.filterNode.frequency.cancelScheduledValues(time);
      this.filterNode.frequency.setValueAtTime(Math.max(60, this.filterNode.frequency.value), time);
      this.filterNode.frequency.linearRampToValueAtTime(peakCutoff, time + 0.008);
      this.filterNode.frequency.exponentialRampToValueAtTime(baseCutoff, time + 0.14);

      // Connect oscillators to voice
      oscTri.connect(triGain);
      oscSaw.connect(sawGain);
      subOsc.connect(subGain);

      triGain.connect(voiceGain);
      sawGain.connect(voiceGain);
      subGain.connect(this.filterNode);

      // 5. Subtle Vintage Vinyl Air & Grit (Bump)
      if (this.params.bump > 0.08 && this.noiseBuffer) {
        const noiseSrc = this.audioCtx.createBufferSource();
        noiseSrc.buffer = this.noiseBuffer;
        const nFilter = this.audioCtx.createBiquadFilter();
        nFilter.type = 'bandpass';
        nFilter.frequency.value = 1800;
        nFilter.Q.value = 1.5;

        const nGain = this.audioCtx.createGain();
        const nLevel = this.params.bump * 0.14;
        nGain.gain.setValueAtTime(nLevel, time);
        nGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);

        noiseSrc.connect(nFilter);
        nFilter.connect(nGain);
        nGain.connect(this.filterNode);
        noiseSrc.start(time);
        noiseSrc.stop(time + 0.09);
      }

      // 6. Stereo Auto-Pan (Tumble)
      if (this.audioCtx.createStereoPanner) {
        const panner = this.audioCtx.createStereoPanner();
        const panVal = Math.sin(stepIdx * 1.8 + this.params.tumble * 5.0) * 0.65;
        panner.pan.setValueAtTime(panVal, time);
        voiceGain.connect(panner);
        panner.connect(this.filterNode);
      } else {
        voiceGain.connect(this.filterNode);
      }

      // 7. Amplitude Envelope (Punchy pluck with downbeat accent & click-free ramps)
      const noteDur = 0.15 + (1.0 - this.params.tumble) * 0.15;
      const peakVol = isDownbeat ? 0.72 : 0.58;
      voiceGain.gain.setValueAtTime(0.0001, time);
      voiceGain.gain.linearRampToValueAtTime(peakVol, time + 0.012);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + noteDur);

      oscTri.start(time);
      oscSaw.start(time);
      subOsc.start(time);

      oscTri.stop(time + noteDur + 0.04);
      oscSaw.stop(time + noteDur + 0.04);
      subOsc.stop(time + noteDur + 0.04);

      // Visual Beat Trigger: radiate luma wave from vertex on corresponding lobe
      const delayMs = Math.max(0, (time - this.audioCtx.currentTime) * 1000);
      setTimeout(() => {
        if (!this.isPlaying) return;
        this.triggerLumaRipple(stepIdx, interval, isDownbeat, scaleObj);
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
          this.needsMeshUpdate = true;
          this.needsMaterialUpdate = true;
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
      this.params.twist = 0.15 + Math.random() * 0.75;
      this.params.bloat = 0.25 + Math.random() * 0.65;
      this.params.spike = 0.15 + Math.random() * 0.70;
      this.params.bump = Math.random() * 0.70;
      this.params.tint = Math.random();
      this.params.tumble = 0.25 + Math.random() * 0.65;

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

      this.needsMeshUpdate = true;
      this.needsMaterialUpdate = true;
    }

    reset() {
      this.params = {
        sprout: 5,
        twist: 0.35,
        bloat: 0.50,
        spike: 0.35,
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

      this.needsMeshUpdate = true;
      this.needsMaterialUpdate = true;
    }
  }

  // Auto-instantiate when DOM is ready
  window.addEventListener('DOMContentLoaded', () => {
    window.topoArpInstance = new TopoArpEngine();
  });
})();
