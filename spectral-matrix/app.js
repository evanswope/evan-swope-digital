/**
 * app.js - 9-Pedal Minimalist Spectral Alchemy Controller
 */

import { SpectralEngine } from './spectral-engine.js';

let engine = null;
let initialized = false;

let latestTelemetry = {
  magnitudes: new Float32Array(128),
  phases: new Float32Array(128),
  peak: 0.01,
  lfoPhase: 0.0
};

const appState = {
  activeSource: 'none',
  dryWet: 1.0,
  volume: 0.75,

  pedals: {
    freeze:  { on: false, blur: 0.6 },
    prism:   { on: false, cascade: 0.75, feedback: 0.65 },
    warp:    { on: false, shiftHz: 120 },
    ghost:   { on: false, morph: 0.8 },
    mirror:  { on: false, pivotHz: 1200 },
    gravity: { on: false, pull: 0.8 },
    shatter: { on: false, chaos: 0.7 },
    crystal: { on: false, threshold: 0.45 },
    ripple:  { on: false, speed: 0.8, depth: 0.85 },
    edge:    { on: false, carve: 0.85, order: 1 },
    escher:  { on: false, speed: 1.2, ceilingHz: 2400 }
  }
};

const pedalNames = {
  freeze:  '❄️ Freeze',
  prism:   '🌈 Prism',
  warp:    '⚡ Warp',
  ghost:   '👻 Ghost',
  mirror:  '🪞 Mirror',
  gravity: '🪐 Gravity',
  shatter: '💥 Shatter',
  crystal: '💎 Crystal',
  ripple:  '🌊 Ripple',
  edge:    '🪚 Edge',
  escher:  '🪜 Escher'
};

async function ensureEngine() {
  if (!initialized) {
    engine = new SpectralEngine();
    await engine.init();
    engine.onTelemetry = (data) => {
      latestTelemetry = data;
      const limBadge = document.getElementById('limiter-badge');
      if (limBadge) {
        limBadge.classList.toggle('active', !!data.limiterActive);
      }
    };
    // Sync all pedals & master settings immediately
    Object.keys(appState.pedals).forEach(id => {
      engine.setPedal(id, appState.pedals[id].on, appState.pedals[id]);
    });
    engine.setMaster(appState.dryWet);
    engine.setMasterVolume(appState.volume);
    initialized = true;
  }
  await engine.resume();
}

function updateHearingBanner() {
  const activeIds = Object.keys(appState.pedals).filter(k => appState.pedals[k].on);
  const tagEl = document.getElementById('hearing-tag');
  const textEl = document.getElementById('hearing-text');

  if (activeIds.length === 0) {
    tagEl.textContent = 'PASSTHROUGH';
    tagEl.style.background = 'var(--cyan)';
    tagEl.style.color = '#000';
    textEl.textContent = 'All pedals bypassed. Click pedals below to activate.';
  } else {
    const icons = activeIds.map(id => pedalNames[id]).join(' + ');
    tagEl.textContent = `${activeIds.length} ACTIVE`;
    tagEl.style.background = 'var(--pink)';
    tagEl.style.color = '#fff';

    if (activeIds.includes('mirror') && activeIds.includes('freeze')) {
      textEl.textContent = `${icons}: Inverted alien spectrum frozen in time into an otherworldly pad.`;
    } else if (activeIds.includes('gravity') && activeIds.includes('ripple')) {
      textEl.textContent = `${icons}: Harmonic peaks condensed by gravity and undulating through a liquid phaser.`;
    } else if (activeIds.includes('shatter') && activeIds.includes('prism')) {
      textEl.textContent = `${icons}: Scrambled overtone shards cascading into a rainbow delay waterfall.`;
    } else if (activeIds.includes('edge') && activeIds.includes('escher')) {
      textEl.textContent = `${icons}: Infinite Shepard staircase carved into a razor-thin acoustic wireframe.`;
    } else if (activeIds.length === 1) {
      const id = activeIds[0];
      if (id === 'freeze') textEl.textContent = `${icons}: Time stopped! Infinite glowing cathedral pad.`;
      else if (id === 'prism') textEl.textContent = `${icons}: Highs and lows echo at different speeds.`;
      else if (id === 'warp') textEl.textContent = `${icons}: Linear Hertz frequency shift for alien Dalek ring-mods.`;
      else if (id === 'ghost') textEl.textContent = `${icons}: Phase manipulation (robot vocoder or whisper cloud).`;
      else if (id === 'mirror') textEl.textContent = `${icons}: Spectral inversion: high frequencies become deep bass, lows become screaming treble.`;
      else if (id === 'gravity') textEl.textContent = `${icons}: Gravitational pull collapses audio into pure resonant singing laser sines.`;
      else if (id === 'shatter') textEl.textContent = `${icons}: Harmonic dice scramble overtones into gamelan gongs and metallic chimes.`;
      else if (id === 'crystal') textEl.textContent = `${icons}: Dynamic spectral sieve erases weak bins into dancing sine droplets.`;
      else if (id === 'ripple') textEl.textContent = `${icons}: Multi-wave comb filter sweeping like a liquid tide.`;
      else if (id === 'edge') textEl.textContent = `${icons}: Spectral calculus derivative stripping sound down to an acoustic wireframe.`;
      else if (id === 'escher') textEl.textContent = `${icons}: M.C. Escher modular wrap endlessly ascending in an infinite Shepard-Risset staircase.`;
    } else {
      textEl.textContent = `${icons}: Running stacked in the audio chain for complex spectral alchemy!`;
    }
  }
}

function togglePedal(id, forceState = null) {
  const pedal = appState.pedals[id];
  if (!pedal) return;

  pedal.on = (forceState !== null) ? forceState : !pedal.on;

  const card = document.querySelector(`.pedal[data-pedal="${id}"]`);
  if (card) {
    card.classList.toggle('active', pedal.on);
  }

  if (id === 'freeze') {
    const freezePod = document.getElementById('freeze-pod');
    const freezeStomp = document.getElementById('btn-freeze-stomp');
    const freezeBadge = document.getElementById('freeze-state-badge');
    if (freezePod) freezePod.classList.toggle('active', pedal.on);
    if (freezeStomp) freezeStomp.classList.toggle('active', pedal.on);
    if (freezeBadge) {
      freezeBadge.textContent = pedal.on ? 'LATCHED' : 'STANDBY';
    }
  }

  if (engine) {
    engine.setPedal(id, pedal.on, pedal);
  }

  updateHearingBanner();
}

function updatePedalSliderUI(id) {
  const p = appState.pedals[id];
  if (!p) return;
  if (id === 'freeze') {
    const el = document.getElementById('slider-freeze-blur');
    const valEl = document.getElementById('val-freeze-blur');
    if (el) el.value = p.blur;
    if (valEl) valEl.textContent = `${Math.round(p.blur * 100)}%`;
  } else if (id === 'prism') {
    const elC = document.getElementById('slider-prism-cascade');
    const valC = document.getElementById('val-prism-cascade');
    const elF = document.getElementById('slider-prism-fb');
    const valF = document.getElementById('val-prism-fb');
    if (elC) elC.value = p.cascade;
    if (valC) valC.textContent = `${Math.round(p.cascade * 100)}%`;
    if (elF) elF.value = p.feedback;
    if (valF) valF.textContent = `${Math.round(p.feedback * 100)}%`;
  } else if (id === 'warp') {
    const el = document.getElementById('slider-warp-shift');
    const valEl = document.getElementById('val-warp-shift');
    if (el) el.value = p.shiftHz;
    if (valEl) valEl.textContent = `${p.shiftHz > 0 ? '+' : ''}${p.shiftHz} Hz`;
  } else if (id === 'ghost') {
    const el = document.getElementById('slider-ghost-morph');
    const valEl = document.getElementById('val-ghost-morph');
    if (el) el.value = p.morph;
    if (valEl) {
      if (p.morph < -0.05) valEl.textContent = `Robot ${Math.round(-p.morph * 100)}%`;
      else if (p.morph > 0.05) valEl.textContent = `Whisper +${Math.round(p.morph * 100)}%`;
      else valEl.textContent = `Natural`;
    }
  } else if (id === 'mirror') {
    const el = document.getElementById('slider-mirror-pivot');
    const valEl = document.getElementById('val-mirror-pivot');
    if (el) el.value = p.pivotHz;
    if (valEl) valEl.textContent = `${p.pivotHz} Hz`;
  } else if (id === 'gravity') {
    const el = document.getElementById('slider-gravity-pull');
    const valEl = document.getElementById('val-gravity-pull');
    if (el) el.value = p.pull;
    if (valEl) valEl.textContent = `${Math.round(p.pull * 100)}%`;
  } else if (id === 'shatter') {
    const el = document.getElementById('slider-shatter-chaos');
    const valEl = document.getElementById('val-shatter-chaos');
    if (el) el.value = p.chaos;
    if (valEl) valEl.textContent = `${Math.round(p.chaos * 100)}%`;
  } else if (id === 'crystal') {
    const el = document.getElementById('slider-crystal-thresh');
    const valEl = document.getElementById('val-crystal-thresh');
    if (el) el.value = p.threshold;
    if (valEl) valEl.textContent = `${Math.round(p.threshold * 100)}%`;
  } else if (id === 'ripple') {
    const elS = document.getElementById('slider-ripple-speed');
    const valS = document.getElementById('val-ripple-speed');
    const elD = document.getElementById('slider-ripple-depth');
    const valD = document.getElementById('val-ripple-depth');
    if (elS) elS.value = p.speed;
    if (valS) valS.textContent = `${p.speed.toFixed(1)} Hz`;
    if (elD) elD.value = p.depth;
    if (valD) valD.textContent = `${Math.round(p.depth * 100)}%`;
  } else if (id === 'edge') {
    const elC = document.getElementById('slider-edge-carve');
    const valC = document.getElementById('val-edge-carve');
    const elO = document.getElementById('slider-edge-order');
    const valO = document.getElementById('val-edge-order');
    if (elC) elC.value = p.carve;
    if (valC) valC.textContent = `${Math.round(p.carve * 100)}%`;
    if (elO) elO.value = p.order;
    if (valO) valO.textContent = p.order === 2 ? '2nd Δ²' : '1st Δ';
  } else if (id === 'escher') {
    const elS = document.getElementById('slider-escher-speed');
    const valS = document.getElementById('val-escher-speed');
    const elC = document.getElementById('slider-escher-ceiling');
    const valC = document.getElementById('val-escher-ceiling');
    if (elS) elS.value = p.speed;
    if (valS) valS.textContent = `${p.speed.toFixed(1)}x`;
    if (elC) elC.value = p.ceilingHz;
    if (valC) valC.textContent = `${p.ceilingHz} Hz`;
  }
}

function randomizePedalParams(id) {
  const p = appState.pedals[id];
  if (!p) return;
  if (id === 'freeze') {
    p.blur = Math.round((0.15 + Math.random() * 0.85) * 100) / 100;
  } else if (id === 'prism') {
    p.cascade = Math.round((0.35 + Math.random() * 0.65) * 100) / 100;
    p.feedback = Math.round((0.45 + Math.random() * 0.38) * 100) / 100;
  } else if (id === 'warp') {
    const sign = Math.random() > 0.5 ? 1 : -1;
    p.shiftHz = sign * (Math.floor(Math.random() * 32) * 10 + 60);
  } else if (id === 'ghost') {
    const isRobot = Math.random() > 0.5;
    p.morph = isRobot ? -Math.round((0.35 + Math.random() * 0.65) * 20) / 20 : Math.round((0.35 + Math.random() * 0.65) * 20) / 20;
  } else if (id === 'mirror') {
    p.pivotHz = Math.floor(Math.random() * 45) * 50 + 600;
  } else if (id === 'gravity') {
    p.pull = Math.round((0.55 + Math.random() * 0.45) * 100) / 100;
  } else if (id === 'shatter') {
    p.chaos = Math.round((0.45 + Math.random() * 0.55) * 100) / 100;
  } else if (id === 'crystal') {
    p.threshold = Math.round((0.28 + Math.random() * 0.47) * 100) / 100;
  } else if (id === 'ripple') {
    p.speed = Math.round((0.4 + Math.random() * 2.2) * 10) / 10;
    p.depth = Math.round((0.65 + Math.random() * 0.35) * 100) / 100;
  } else if (id === 'edge') {
    p.carve = Math.round((0.55 + Math.random() * 0.45) * 100) / 100;
    p.order = Math.random() > 0.6 ? 2 : 1;
  } else if (id === 'escher') {
    p.speed = Math.round((0.5 + Math.random() * 2.5) * 10) / 10;
    p.ceilingHz = Math.floor(Math.random() * 32) * 100 + 1000;
  }
  updatePedalSliderUI(id);
}

function surpriseMe() {
  const fxIds = Object.keys(appState.pedals).filter(id => id !== 'freeze');
  fxIds.forEach(id => togglePedal(id, false));

  // Pick 2 or 3 random pedals from the sound-shaping rack (freeze untouched)
  const count = Math.random() > 0.4 ? 2 : 3;
  const shuffled = [...fxIds].sort(() => 0.5 - Math.random());
  const chosen = shuffled.slice(0, count);

  chosen.forEach(id => {
    randomizePedalParams(id);
    togglePedal(id, true);
  });
}

function clearAllPedals() {
  Object.keys(appState.pedals).forEach(id => togglePedal(id, false));
}

function setupCanvas(id) {
  const canvas = document.getElementById(id);
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { canvas, ctx, width: rect.width, height: rect.height };
}

window.addEventListener('DOMContentLoaded', () => {
  const cMag = setupCanvas('canvas-mag');
  const cFreq = setupCanvas('canvas-freq');
  const cPhase = setupCanvas('canvas-phase');

  // Power On Start Overlay
  const audioOverlay = document.getElementById('audioOverlay');
  const btnStartAudio = document.getElementById('btn-start-audio');
  if (btnStartAudio && audioOverlay) {
    btnStartAudio.addEventListener('click', async () => {
      await ensureEngine();
      audioOverlay.classList.add('dismissed');
      // Auto-start Cello drone gently so user immediately hears live sound
      engine.startDrone(110);
      updateSourceUI('drone');
    });
  }

  // Handle postMessage from parent (suspend/resume when sliding between experiments)
  window.addEventListener('message', async (e) => {
    if (e.data === 'suspend') {
      if (engine && engine.ctx && engine.ctx.state === 'running') {
        await engine.ctx.suspend();
      }
    } else if (e.data === 'resume') {
      if (engine && engine.ctx && engine.ctx.state === 'suspended') {
        await engine.ctx.resume();
      }
    }
  });

  window.addEventListener('resize', () => {
    const dpr = window.devicePixelRatio || 1;
    [cMag, cFreq, cPhase].forEach(c => {
      const rect = c.canvas.getBoundingClientRect();
      c.canvas.width = rect.width * dpr;
      c.canvas.height = rect.height * dpr;
      c.width = rect.width;
      c.height = rect.height;
      c.ctx.scale(dpr, dpr);
    });
  });

  // Sound source controls
  const srcButtons = {
    drone: document.getElementById('btn-src-drone'),
    arp: document.getElementById('btn-src-arp'),
    noise: document.getElementById('btn-src-noise'),
    mic: document.getElementById('btn-src-mic'),
    file: document.getElementById('btn-src-file'),
    stop: document.getElementById('btn-src-stop')
  };

  const updateSourceUI = (type) => {
    appState.activeSource = type;
    Object.keys(srcButtons).forEach(k => {
      if (srcButtons[k]) srcButtons[k].classList.toggle('active', k === type);
    });
    document.querySelectorAll('.btn-sample').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.name === type);
    });
  };

  // Sample Preset Buttons
  document.querySelectorAll('.btn-sample').forEach(btn => {
    btn.addEventListener('click', async () => {
      await ensureEngine();
      const sampleUrl = btn.dataset.sample;
      const name = btn.dataset.name;
      await engine.playPresetSample(sampleUrl, true);
      updateSourceUI(name);
    });
  });

  srcButtons.drone.addEventListener('click', async () => {
    await ensureEngine();
    engine.startDrone(110);
    updateSourceUI('drone');
  });

  srcButtons.arp.addEventListener('click', async () => {
    await ensureEngine();
    engine.startArp(220);
    updateSourceUI('arp');
  });

  srcButtons.noise.addEventListener('click', async () => {
    await ensureEngine();
    engine.startNoise();
    updateSourceUI('noise');
  });

  srcButtons.mic.addEventListener('click', async () => {
    await ensureEngine();
    try {
      await engine.startMicrophone();
      updateSourceUI('mic');
    } catch (e) {
      alert('Microphone error: ' + e.message);
    }
  });

  const fileInput = document.getElementById('audio-file-input');
  srcButtons.file.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      await ensureEngine();
      await engine.loadAudioFile(e.target.files[0]);
      updateSourceUI('file');
    }
  });

  srcButtons.stop.addEventListener('click', () => {
    if (engine) engine.stopAllSources();
    updateSourceUI('none');
  });

  // Master Sliders
  document.getElementById('slider-drywet').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.dryWet = val;
    document.getElementById('val-drywet').textContent = `${Math.round(val * 100)}%`;
    if (engine) engine.setMaster(val);
  });

  document.getElementById('slider-vol').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.volume = val;
    if (engine) engine.setMasterVolume(val);
  });

  // Header Actions
  document.getElementById('btn-surprise').addEventListener('click', async () => {
    await ensureEngine();
    surpriseMe();
  });

  document.getElementById('btn-clear-pedals').addEventListener('click', () => {
    clearAllPedals();
  });

  // Pedal Card Toggle
  document.querySelectorAll('.pedal').forEach(card => {
    const id = card.dataset.pedal;
    card.addEventListener('click', async (e) => {
      if (e.target.closest('.pedal-controls')) return;
      await ensureEngine();
      togglePedal(id);
    });
  });

  // Dedicated Freeze Clutch Stomp
  const btnFreezeStomp = document.getElementById('btn-freeze-stomp');
  if (btnFreezeStomp) {
    btnFreezeStomp.addEventListener('click', async () => {
      await ensureEngine();
      togglePedal('freeze');
    });
  }

  // --- Slider Event Bindings ---

  // 1. Freeze
  const sFreeze = document.getElementById('slider-freeze-blur');
  const vFreeze = document.getElementById('val-freeze-blur');
  sFreeze.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.pedals.freeze.blur = val;
    vFreeze.textContent = `${Math.round(val * 100)}%`;
    if (engine) engine.setPedal('freeze', appState.pedals.freeze.on, appState.pedals.freeze);
  });

  // 2. Prism
  const sPrismCascade = document.getElementById('slider-prism-cascade');
  const vPrismCascade = document.getElementById('val-prism-cascade');
  sPrismCascade.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.pedals.prism.cascade = val;
    vPrismCascade.textContent = `${Math.round(val * 100)}%`;
    if (engine) engine.setPedal('prism', appState.pedals.prism.on, appState.pedals.prism);
  });

  const sPrismFb = document.getElementById('slider-prism-fb');
  const vPrismFb = document.getElementById('val-prism-fb');
  sPrismFb.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.pedals.prism.feedback = val;
    vPrismFb.textContent = `${Math.round(val * 100)}%`;
    if (engine) engine.setPedal('prism', appState.pedals.prism.on, appState.pedals.prism);
  });

  // 3. Warp
  const sWarp = document.getElementById('slider-warp-shift');
  const vWarp = document.getElementById('val-warp-shift');
  sWarp.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    appState.pedals.warp.shiftHz = val;
    vWarp.textContent = `${val > 0 ? '+' : ''}${val} Hz`;
    if (engine) engine.setPedal('warp', appState.pedals.warp.on, appState.pedals.warp);
  });

  // 4. Ghost
  const sGhost = document.getElementById('slider-ghost-morph');
  const vGhost = document.getElementById('val-ghost-morph');
  sGhost.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.pedals.ghost.morph = val;
    if (val < -0.05) vGhost.textContent = `Robot ${Math.round(-val * 100)}%`;
    else if (val > 0.05) vGhost.textContent = `Whisper +${Math.round(val * 100)}%`;
    else vGhost.textContent = `Natural`;
    if (engine) engine.setPedal('ghost', appState.pedals.ghost.on, appState.pedals.ghost);
  });

  // 5. Mirror
  const sMirror = document.getElementById('slider-mirror-pivot');
  const vMirror = document.getElementById('val-mirror-pivot');
  sMirror.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    appState.pedals.mirror.pivotHz = val;
    vMirror.textContent = `${val} Hz`;
    if (engine) engine.setPedal('mirror', appState.pedals.mirror.on, appState.pedals.mirror);
  });

  // 6. Gravity
  const sGravity = document.getElementById('slider-gravity-pull');
  const vGravity = document.getElementById('val-gravity-pull');
  sGravity.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.pedals.gravity.pull = val;
    vGravity.textContent = `${Math.round(val * 100)}%`;
    if (engine) engine.setPedal('gravity', appState.pedals.gravity.on, appState.pedals.gravity);
  });

  // 7. Shatter
  const sShatter = document.getElementById('slider-shatter-chaos');
  const vShatter = document.getElementById('val-shatter-chaos');
  sShatter.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.pedals.shatter.chaos = val;
    vShatter.textContent = `${Math.round(val * 100)}%`;
    if (engine) engine.setPedal('shatter', appState.pedals.shatter.on, appState.pedals.shatter);
  });

  // 8. Crystal
  const sCrystal = document.getElementById('slider-crystal-thresh');
  const vCrystal = document.getElementById('val-crystal-thresh');
  sCrystal.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.pedals.crystal.threshold = val;
    vCrystal.textContent = `${Math.round(val * 100)}%`;
    if (engine) engine.setPedal('crystal', appState.pedals.crystal.on, appState.pedals.crystal);
  });

  // 9. Ripple
  const sRippleSpeed = document.getElementById('slider-ripple-speed');
  const vRippleSpeed = document.getElementById('val-ripple-speed');
  sRippleSpeed.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.pedals.ripple.speed = val;
    vRippleSpeed.textContent = `${val.toFixed(1)} Hz`;
    if (engine) engine.setPedal('ripple', appState.pedals.ripple.on, appState.pedals.ripple);
  });

  const sRippleDepth = document.getElementById('slider-ripple-depth');
  const vRippleDepth = document.getElementById('val-ripple-depth');
  sRippleDepth.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.pedals.ripple.depth = val;
    vRippleDepth.textContent = `${Math.round(val * 100)}%`;
    if (engine) engine.setPedal('ripple', appState.pedals.ripple.on, appState.pedals.ripple);
  });

  // 10. Edge
  const sEdgeCarve = document.getElementById('slider-edge-carve');
  const vEdgeCarve = document.getElementById('val-edge-carve');
  if (sEdgeCarve) {
    sEdgeCarve.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      appState.pedals.edge.carve = val;
      vEdgeCarve.textContent = `${Math.round(val * 100)}%`;
      if (engine) engine.setPedal('edge', appState.pedals.edge.on, appState.pedals.edge);
    });
  }

  const sEdgeOrder = document.getElementById('slider-edge-order');
  const vEdgeOrder = document.getElementById('val-edge-order');
  if (sEdgeOrder) {
    sEdgeOrder.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      appState.pedals.edge.order = val;
      vEdgeOrder.textContent = val === 2 ? '2nd Δ²' : '1st Δ';
      if (engine) engine.setPedal('edge', appState.pedals.edge.on, appState.pedals.edge);
    });
  }

  // 11. Escher
  const sEscherSpeed = document.getElementById('slider-escher-speed');
  const vEscherSpeed = document.getElementById('val-escher-speed');
  if (sEscherSpeed) {
    sEscherSpeed.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      appState.pedals.escher.speed = val;
      vEscherSpeed.textContent = `${val.toFixed(1)}x`;
      if (engine) engine.setPedal('escher', appState.pedals.escher.on, appState.pedals.escher);
    });
  }

  const sEscherCeil = document.getElementById('slider-escher-ceiling');
  const vEscherCeil = document.getElementById('val-escher-ceiling');
  if (sEscherCeil) {
    sEscherCeil.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      appState.pedals.escher.ceilingHz = val;
      vEscherCeil.textContent = `${val} Hz`;
      if (engine) engine.setPedal('escher', appState.pedals.escher.on, appState.pedals.escher);
    });
  }

  // --- Real-time Animation Loop ---
  function render() {
    requestAnimationFrame(render);
    const mags = latestTelemetry.magnitudes;
    const phases = latestTelemetry.phases;

    renderMagnitudeCanvas(cMag, mags);
    renderFrequencyCanvas(cFreq, mags);
    renderPhaseCanvas(cPhase, mags, phases);
  }

  render();
});

// Canvas 1: Amplitude Spectrum
function renderMagnitudeCanvas(c, mags) {
  const { ctx, width, height } = c;
  ctx.clearRect(0, 0, width, height);

  const barCount = 128;
  const barW = width / barCount;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let y = 0; y < height; y += 25) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  for (let i = 0; i < barCount; i++) {
    const val = Math.min(1.0, mags[i]);
    const h = val * height;
    const x = i * barW;
    const y = height - h;

    const grad = ctx.createLinearGradient(0, height, 0, 0);
    grad.addColorStop(0, '#0052d4');
    grad.addColorStop(0.6, '#4364f7');
    grad.addColorStop(1, '#00f2fe');

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, Math.max(1, barW - 1), h);
  }

  // Overlay: Mirror Pivot Line
  if (appState.pedals.mirror.on) {
    const pivotHz = appState.pedals.mirror.pivotHz;
    const maxHz = 9000;
    const pivotX = Math.min(width - 2, Math.max(2, (pivotHz / maxHz) * width));
    ctx.strokeStyle = '#ff3366';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pivotX, 0); ctx.lineTo(pivotX, height);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Overlay: Crystal Sieve Line
  if (appState.pedals.crystal.on) {
    const lineY = height * (1.0 - appState.pedals.crystal.threshold * 0.7);
    ctx.strokeStyle = '#38ef7d';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, lineY); ctx.lineTo(width, lineY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Overlay: Escher Ceiling Line
  if (appState.pedals.escher.on) {
    const ceilHz = appState.pedals.escher.ceilingHz;
    const ceilX = Math.min(width - 2, Math.max(2, (ceilHz / 9000) * width));
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 2;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(ceilX, 0); ctx.lineTo(ceilX, height);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f39c12';
    ctx.font = '8px "Space Mono"';
    ctx.fillText('ESCHER CEIL', ceilX + 4, 15);
  }

  // Overlay: Ripple Wave
  if (appState.pedals.ripple.on) {
    ctx.strokeStyle = 'rgba(5, 255, 161, 0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < barCount; i++) {
      const x = i * barW;
      const wave = 0.5 + 0.5 * Math.sin(i * 0.22 - latestTelemetry.lfoPhase);
      const y = height * (1.0 - wave * 0.85);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

// Canvas 2: Harmonic Lattice
function renderFrequencyCanvas(c, mags) {
  const { ctx, width, height } = c;
  ctx.clearRect(0, 0, width, height);

  const f0 = 110;
  const warpShift = appState.pedals.warp.on ? appState.pedals.warp.shiftHz : 0;
  const maxDisplayHz = 2800; // Zoom in to clearly see harmonics 1..16

  for (let h = 1; h <= 16; h++) {
    const freq = h * f0 + warpShift;
    if (freq < 20 || freq > maxDisplayHz) continue;
    
    const x = (freq / maxDisplayHz) * width;
    const binIdx = Math.min(127, Math.max(0, Math.round((freq / 24000) * 128)));
    const binEnergy = mags[binIdx] || 0;
    const pulseH = Math.min(height * 0.9, binEnergy * height * 0.75);

    ctx.strokeStyle = appState.pedals.freeze.on ? 'rgba(0, 242, 254, 0.45)' : 'rgba(255, 210, 0, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x, height);
    ctx.stroke();

    if (pulseH > 2) {
      ctx.fillStyle = appState.pedals.warp.on ? '#ff2a85' : (appState.pedals.gravity.on ? '#00f2fe' : '#ffd200');
      ctx.fillRect(x - 2, height - pulseH, 4, pulseH);
    }

    ctx.fillStyle = 'rgba(255, 210, 0, 0.85)';
    ctx.font = '9px "Space Mono"';
    ctx.fillText(`${h}H`, x + 3, (h % 2 === 1) ? 14 : 26);
  }

  // Shatter Arcs
  if (appState.pedals.shatter.on) {
    ctx.strokeStyle = 'rgba(224, 86, 253, 0.75)';
    ctx.lineWidth = 1.8;
    for (let b = 1; b <= 8; b++) {
      const srcHz = b * 220;
      const hash = Math.sin(b * 12.9898 + 78.233) * 43758.5453;
      const targetB = Math.floor(Math.abs(hash) * 8) + 1;
      const dstHz = targetB * 220;

      const srcX = (srcHz / maxDisplayHz) * width;
      const dstX = (dstHz / maxDisplayHz) * width;

      if (srcX < width && dstX < width) {
        ctx.beginPath();
        ctx.moveTo(srcX, height * 0.85);
        ctx.quadraticCurveTo((srcX + dstX) / 2, height * 0.15, dstX, height * 0.85);
        ctx.stroke();
      }
    }
  }
}

// Canvas 3: Polar Phase Rose
function renderPhaseCanvas(c, mags, phases) {
  const { ctx, width, height } = c;
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(cx, cy) * 0.85;

  // Background polar grid
  ctx.strokeStyle = 'rgba(5, 255, 161, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, maxR * 0.5, 0, Math.PI * 2);
  ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
  ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy);
  ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR);
  ctx.stroke();

  // Phase trajectory
  ctx.beginPath();
  const step = 2;
  for (let i = 0; i < 64; i++) {
    const angle = phases[i * step];
    const energy = Math.min(1.0, mags[i * step]);
    const r = Math.max(4, energy * maxR);

    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  const isGhostOn = appState.pedals.ghost.on;
  const strokeColor = isGhostOn ? '#e056fd' : '#05ffa1';
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.0;
  ctx.shadowColor = strokeColor;
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = isGhostOn ? 'rgba(224, 86, 253, 0.12)' : 'rgba(5, 255, 161, 0.08)';
  ctx.fill();
}
