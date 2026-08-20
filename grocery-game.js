window.isMuted = false;
document.addEventListener('DOMContentLoaded', () => {
  // Audio
  const mobileSoundBtn = document.getElementById('sound-toggle-btn');
  const desktopSoundBtn = document.getElementById('sound-toggle-desktop');
  const mobileSoundIcon = document.getElementById('sound-icon');
  const desktopSoundIcon = document.getElementById('sound-icon-desktop');
  
  const toggleSound = () => {
    window.isMuted = !window.isMuted;
    const icons = [mobileSoundIcon, desktopSoundIcon].filter(Boolean);
    if (window.isMuted) {
      icons.forEach(i => { i.classList.remove('fa-volume-up'); i.classList.add('fa-volume-mute'); });
    } else {
      icons.forEach(i => { i.classList.remove('fa-volume-mute'); i.classList.add('fa-volume-up'); });
    }
  };
  
  if (mobileSoundBtn) mobileSoundBtn.addEventListener('click', toggleSound);
  if (desktopSoundBtn) desktopSoundBtn.addEventListener('click', toggleSound);

  // Leaderboard
  const mobileLbBtn = document.getElementById('leaderboard-btn');
  const desktopLbBtn = document.getElementById('leaderboard-btn-desktop');
  const legacyLbBtn = document.getElementById('btn-leaderboard');
  const modalLeaderboard = document.getElementById('modal-leaderboard');
  const contentLeaderboard = document.getElementById('leaderboard-content');
  
  const openLb = async (e) => {
    if (e) e.preventDefault();
    modalLeaderboard.style.display = 'flex';
    contentLeaderboard.innerHTML = '<div style="text-align:center; padding:2rem;"><i class="fa-solid fa-spinner fa-spin"></i> Loading legends...</div>';
    
    if (!window.FirebaseAPI) {
      contentLeaderboard.innerHTML = '<div style="color:red; text-align:center;">Firebase not loaded yet.</div>';
      return;
    }
    const scores = await window.FirebaseAPI.getTopScores(50);
    renderLeaderboard(scores);
  };
  
  if (mobileLbBtn) mobileLbBtn.addEventListener('click', openLb);
  if (desktopLbBtn) desktopLbBtn.addEventListener('click', openLb);
  if (legacyLbBtn) legacyLbBtn.addEventListener('click', openLb);

  // Info Modal
  const mobileInfoBtn = document.getElementById('info-btn-mobile');
  const desktopInfoBtn = document.getElementById('info-btn-desktop');
  const modalInfo = document.getElementById('modal-info');
  const closeInfo = document.getElementById('close-info');

  const openInfo = (e) => {
    if (e) e.preventDefault();
    modalInfo.style.display = 'flex';
  };

  if (mobileInfoBtn) mobileInfoBtn.addEventListener('click', openInfo);
  if (desktopInfoBtn) desktopInfoBtn.addEventListener('click', openInfo);
  
  if (closeInfo) {
    closeInfo.addEventListener('click', () => {
      modalInfo.style.display = 'none';
    });
  }
  if (modalInfo) {
    modalInfo.addEventListener('click', (e) => {
      if (e.target === modalInfo) modalInfo.style.display = 'none';
    });
  }
});

  const itemImage = document.getElementById('item-image');
  const scannerStatus = document.getElementById('scanner-status');

  // Coupon Word List
  const couponWords = [
    "BAROQUE", "MACAQUE", "GANGRENE", "PULCHRITUDE", "BUMFUZZLE", "CATtywampus", "GOBBLEDYGOOK", "MALARKEY", 
    "NINCOMPOOP", "SHENANIGANS", "SKEDADDLE", "SNIGGER", "TARADIDDLE", "WIDDERSHINS", "KERFUFFLE", "FLUMMOX", 
    "BAMBOOZLE", "CANOODLE", "DISCOMBOBULATE", "FLABBERGAST", "HORNSWOGGLE", "LOLLYGAG", "SNITTY", "SQUABBLE", 
    "SQUEAMISH", "SQUIGGLE", "SQUIRM", "SWAGGER", "SWINDLE", "SWOON", "SYCOPHANT", "TANTALIZE", "TIZZY", 
    "TOPSY", "TURVY", "WADDLE", "WAFFLE", "WHIMSICAL", "WHISPER", "WOBBLE", "ZIGZAG", "ZIPPER", "ZOMBIE", 
    "BLUBBER", "BLUNDER", "BLUSTER", "BOBODDY", "BOGGLE", "BOHICA", "BOINK", "BONKERS", "BOOGALOO", "BOONDOGGLE", 
    "BOOYAH", "BOSSY", "BOUJEE", "BROHAHA", "BUBBLE", "BUCKAROO", "BUGABOO", "BULBOUS", "BULLY", "BUMBLE", 
    "BUMPKIN", "BUNCOMBE", "BUNKUM", "BURBLE", "BURP", "BUSHWHACK", "BUSTLE", "BUTTER", "BUZZ", "CABBAGE", 
    "CACOPHONY", "CAHOOTS", "CALAMITY", "CALLIOPE", "CANARY", "CANTANKEROUS", "CAPER", "CAPRICIOUS", "CARBUNCLE", 
    "CARCASS", "CAROUSE", "CATERWAUL", "CAVORT", "CHAGRIN", "CHORTLE", "CHUCKLE", "CHUMP", "CHUTZPAH", "CLAMOR", 
    "CLAPTRAP", "CLINCH", "CLIQUE", "CLOBBER", "CLOCKWORK", "CLODHOPPER", "CLOG", "CLOISTER", "CLUCK", "CLUNKER", 
    "COCKAMAMIE", "CODFISH", "CODGER", "CODSWALLOP", "COLLOP", "COMBUSTION", "COMEDOWN", "COMFIT", "CONCERN", 
    "CONCOCT", "CONTRAPTION", "CONUNDRUM", "COOT", "CORNUCOPIA", "CORPULENT", "CORUSCATE", "COSMIC", "COSSACK", 
    "COTTON", "COUCH", "COUGH", "COVE", "COWPOKE", "CRABBY", "CRACKPOT", "CRANKY", "CRAPSHOOT", "CRAWL", "CREEP", 
    "CRESS", "CRICKET", "CRINGE", "CRINKLE", "CRIPPLE", "CRISPY", "CROAK", "CRONY", "CROON", "CROTCHETY", "CRUMPET", 
    "CRUMPLE", "CRUNCH", "CRUSADE", "CRUSTY", "CRYBABY", "CUDDLE", "CUDGEL", "CURMUDGEON", "CYBORG", "CYCLONE"
  ];
  const couponNumbers = [10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 90];

  // Game State
  let state = {
    level: 1,
    cash: 0,
    trust: 50,
    popularity: 0,
    affection: 0,
    
    playerDescription: "a tired clerk", // Default if skipped
    currentCustomerDesc: "",
    currentCustomerRequest: "",
    customersServed: [], // Array of { id, desc, request, affectionGained }

    phase: "START", // START, PLAYER_SETUP, WAITING_FOR_USER, GENERATING, APPRAISING, LEDGER, DATING_WAIT_USER, DATING_GENERATING, LEADERBOARD_PROMPT, COMPLAINT
    conversationHistory: [],

    // Dating state
    datingRound: 1,
    datingScore: 0,
    selectedCustomer: null,
    datingHistory: [],
    isAce: false,
      isAro: false,
    isTrueLove: false,
    datingLocation: "",
    datingOutfit: "",
    datingGift: "",
    weddingVenue: "",
    weddingRing: "",
    obstacleTarget: "",
    obstacleCount: 0,
    badgeImageUrl: null,
    customerImageUrl: null,
    lastItemUrl: null,
    barcodeCurrent: "",
    barcodeTarget: "",
      couponTarget: "",
      itemRevealed: false,
      needRevealed: false,
    pendingAppraisalData: null,
    pendingAppraisalImagePromise: null
  };

  function resetGame() {
    state = {
      level: 1,
      cash: 0,
      trust: 50,
      popularity: 0,
      affection: 0,
      playerDescription: "a tired clerk",
      currentCustomerDesc: "",
      currentCustomerRequest: "",
      customersServed: [],
      phase: "START",
      conversationHistory: [],
      datingRound: 1,
      datingScore: 0,
      selectedCustomer: null,
      datingHistory: [],
      isAce: false,
      isTrueLove: false,
      datingLocation: "",
      datingOutfit: "",
      datingGift: "",
      weddingVenue: "",
      weddingRing: "",
      obstacleTarget: "",
      obstacleCount: 0,
      badgeImageUrl: null,
      customerImageUrl: null,
      lastItemUrl: null,
      barcodeCurrent: "",
      barcodeTarget: "",
      couponTarget: "",
      itemRevealed: false,
      needRevealed: false,
      pendingAppraisalData: null,
      pendingAppraisalImagePromise: null
    };
    updateStatsUI();
    logArea.innerHTML = '';
    
    // reset image UI
    itemImage.onload = null;
    itemImage.onerror = null;
    itemImage.classList.remove('loaded');
    itemImage.src = '';
    const noItemText = document.getElementById('no-item-text');
    if (noItemText) noItemText.style.display = 'block';
    const redScanline = document.getElementById('red-scanline');
    if (redScanline) redScanline.classList.remove('active');

    callGameMaster();
  }

  // Helper: Add text to log
  const persistentBox = document.getElementById('persistent-box');
  
    async function setPersistentPrompt(text, type = 'log-gm') {
      if (!text) {
        persistentBox.style.display = 'flex';
        persistentBox.innerHTML = '';
        return;
      }
      persistentBox.style.display = 'flex';
      if (type === 'log-gm') {
         persistentBox.style.color = '#33ff33';
      } else if (type === 'log-subconscious') {
         persistentBox.style.color = '#ffb86c';
         persistentBox.style.fontStyle = 'italic';
      } else {
         persistentBox.style.color = '#fff';
      }
      
      persistentBox.innerHTML = '';
      
      for (let i = 0; i < text.length; i++) {
        persistentBox.innerHTML += text[i];
        if (text[i] !== ' ' && i % 2 === 0) {
          playConsoleBleep();
          await new Promise(r => setTimeout(r, 10));
        }
      }
    }

    function addLog(text, className) {
    const p = document.createElement('div');
    p.className = `log-msg ${className}`;
    p.textContent = text;
    logArea.appendChild(p);
    logArea.scrollTop = logArea.scrollHeight;
  }

  // Helper: Add text to log with typewriter effect
  async function addLogTypewriter(text, className, delayMs = 15) {
    const p = document.createElement('div');
    p.className = `log-msg ${className}`;
    logArea.appendChild(p);
    
    // Disable input while typing
    gameInput.disabled = true;
    
    const isSpeech = className.includes('log-customer');
    
    for (let i = 0; i < text.length; i++) {
      p.textContent += text[i];
      logArea.scrollTop = logArea.scrollHeight;
      // Skip wait on spaces for slight speedup
      if (text[i] !== ' ') {
        if (i % 2 === 0) {
          if (isSpeech) playSpeechBleep(text[i]);
          else playConsoleBleep();
        }
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
    
    // Re-enable if we aren't in a waiting state
    if (state.phase === "WAITING_FOR_USER" || state.phase === "DATING_WAIT_USER" || state.phase === "LEDGER" || state.phase === "TRUE_LOVE_PROMPT" || state.phase === "LEADERBOARD_PROMPT") {
      gameInput.disabled = false;
      gameInput.focus();
    }
  }

  // Helper: Floating particles
  function spawnParticle(type) {
    const p = document.createElement('div');
    p.className = `particle ${type}`;
    // Random position within log area
    p.style.left = Math.random() * 80 + 10 + '%';
    p.style.top = Math.random() * 80 + 10 + '%';
    logArea.appendChild(p);
    
    // Remove after animation
    setTimeout(() => {
      if (p.parentNode) p.parentNode.removeChild(p);
    }, 2000);
  }

  // Audio Management
  let audioCtx = null;
  let sfxBuffers = { success: null, fail: null };

  async function loadSFX() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    try {
      const [succRes, failRes] = await Promise.all([
        fetch('success.mp3'),
        fetch('fail.mp3')
      ]);
      
      if (!succRes.ok || !failRes.ok) {
        addLog(`> AUDIO ERROR: SFX files returned HTTP ${succRes.status}. Check if they are in the correct directory.`, "log-error");
        return;
      }

      const [succBuf, failBuf] = await Promise.all([
        succRes.arrayBuffer(),
        failRes.arrayBuffer()
      ]);
      
      // Use callback signature wrapped in Promise for older Safari compatibility
      const decode = (buf) => new Promise((resolve, reject) => {
        audioCtx.decodeAudioData(buf, resolve, reject).catch(reject); // Catch modern promise rejections too
      });

      sfxBuffers.success = await decode(succBuf);
      sfxBuffers.fail = await decode(failBuf);
      console.log("SFX loaded successfully!");
    } catch (e) {
      console.warn("Could not preload SFX buffers", e);
      addLog(`> AUDIO ERROR: Failed to decode MP3 files. ${e.message}`, "log-error");
    }
  }

  function playSFX(type) {
    if (!audioCtx) {
      addLog("> AUDIO ERROR: audioCtx not initialized.", "log-error");
      return;
    }
    if (!sfxBuffers[type]) {
      addLog(`> AUDIO ERROR: ${type}.mp3 was never loaded into memory.`, "log-error");
      return;
    }
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const source = audioCtx.createBufferSource();
      source.buffer = sfxBuffers[type];
      source.connect(audioCtx.destination);
      source.start();
    } catch (e) {
      addLog(`> AUDIO ERROR: Failed to play ${type} SFX.`, "log-error");
      console.warn(`Failed to play ${type} SFX`, e);
    }
  }

  function playConsoleBleep() {
    if (!audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      
      const osc = audioCtx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(400 + Math.random() * 50, audioCtx.currentTime);
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0, audioCtx.currentTime);
      env.gain.linearRampToValueAtTime(0.07, audioCtx.currentTime + 0.005);
      env.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
      
      osc.connect(filter);
      filter.connect(env);
      env.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.03);

      // Add a tiny noise transient for a "clack"
      const noise = audioCtx.createBufferSource();
      noise.buffer = getNoiseBuffer();
      const noiseFilter = audioCtx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1000;
      const noiseEnv = audioCtx.createGain();
      noiseEnv.gain.setValueAtTime(0, audioCtx.currentTime);
      noiseEnv.gain.linearRampToValueAtTime(0.035, audioCtx.currentTime + 0.005);
      noiseEnv.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.02);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseEnv);
      noiseEnv.connect(audioCtx.destination);
      noise.start();
    } catch(e) {}
  }

  function playSpeechBleep(char) {
    if (!audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      
      const osc = audioCtx.createOscillator();
      osc.type = 'triangle';
      
      const charCode = char.toLowerCase().charCodeAt(0);
      let freq = 500;
      if (charCode >= 97 && charCode <= 122) {
        freq = 300 + (charCode - 97) * 15;
      } else {
        freq = 400 + Math.random() * 200;
      }
      
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.8, audioCtx.currentTime + 0.04);
      
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0, audioCtx.currentTime);
      env.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
      
      osc.connect(env);
      env.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);
    } catch(e) {}
  }

  function playScannerBeep() {
    if (window.isMuted) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const masterGain = audioCtx.createGain();
      masterGain.connect(audioCtx.destination);
      masterGain.gain.value = 0.1; // keep it subtle

      const osc = audioCtx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1750, audioCtx.currentTime);

      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0, audioCtx.currentTime);
      env.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.01);
      env.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);

      osc.connect(env);

      // Simple slapback/ringing reverb with delay
      const delay = audioCtx.createDelay();
      delay.delayTime.value = 0.025; // 25ms ringing

      const feedback = audioCtx.createGain();
      feedback.gain.value = 0.5;

      const wetGain = audioCtx.createGain();
      wetGain.gain.value = 0.25; // 25% wet mix

      // Dry path
      env.connect(masterGain);
      // Wet path
      env.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wetGain);
      wetGain.connect(masterGain);

      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.5); // Allow reverb tail
    } catch(e) {
      console.warn("Audio not supported or allowed yet", e);
    }
  }

  function playSadBeep() {
    if (window.isMuted) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.4);
      
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      
      const delay = audioCtx.createDelay();
      delay.delayTime.value = 0.25;
      const feedback = audioCtx.createGain();
      feedback.gain.value = 0.4;
      
      delay.connect(feedback);
      feedback.connect(delay);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.connect(delay);
      delay.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  // Web Audio Drumroll Synthesis (Lookahead Scheduler)
  let snareBuffer = null;
  let isDrumrolling = false;
  let drumrollTimer = null;
  let nextNoteTime = 0;
  let drumrollMasterGain = null;

  function createSnareBuffer(ctx) {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 0.25; // 250ms
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // Sharp attack for the snap
      const noiseEnv = Math.pow(Math.max(0, 1 - t / 0.15), 2);
      const noise = (Math.random() * 2 - 1) * noiseEnv;
      
      // Drum body tones
      const bodyEnv = Math.pow(Math.max(0, 1 - t / 0.2), 2);
      const tone1 = Math.sin(2 * Math.PI * 180 * t) * bodyEnv;
      const tone2 = Math.sin(2 * Math.PI * 330 * t) * bodyEnv * 0.5;
      
      data[i] = (noise * 0.7) + (tone1 * 0.6) + (tone2 * 0.4);
    }
    return buffer;
  }

  function playDrumroll() {
    if (window.isMuted) return Promise.resolve();
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();

      if (!snareBuffer) {
        snareBuffer = createSnareBuffer(audioCtx);
      }

      drumrollMasterGain = audioCtx.createGain();
      drumrollMasterGain.gain.setValueAtTime(0.26, audioCtx.currentTime);
      // Curve down from 26% to 12% over the first 1.5 seconds
      drumrollMasterGain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 1.5);
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 250;
      filter.connect(drumrollMasterGain);
      
      // Metallic comb filter to simulate the snare springs rattling against the drumhead
      const rattleReverb = audioCtx.createDelay();
      rattleReverb.delayTime.value = 0.005; // 5ms
      
      const rattleFeedback = audioCtx.createGain();
      rattleFeedback.gain.value = 0.6; // High resonance
      
      const rattleFilter = audioCtx.createBiquadFilter();
      rattleFilter.type = 'highpass';
      rattleFilter.frequency.value = 800; // Only ring the high snaps
      
      rattleReverb.connect(rattleFilter);
      rattleFilter.connect(rattleFeedback);
      rattleFeedback.connect(rattleReverb);
      
      // Connect wet rattle to master
      rattleReverb.connect(drumrollMasterGain);

      drumrollMasterGain.connect(audioCtx.destination);

      isDrumrolling = true;
      nextNoteTime = audioCtx.currentTime + 0.05;

      function scheduleDrumroll() {
        while (nextNoteTime < audioCtx.currentTime + 0.1 && isDrumrolling) {
          const source = audioCtx.createBufferSource();
          source.buffer = snareBuffer;
          
          const velGain = audioCtx.createGain();
          const velocity = 0.4 + (Math.random() * 0.6);
          velGain.gain.value = velocity;

          source.connect(velGain);
          
          // Dry path (Drum body)
          velGain.connect(filter);
          
          // Wet path (Snare rattle) - scales exponentially with velocity for realistic dynamics
          const rattleSend = audioCtx.createGain();
          rattleSend.gain.value = Math.pow(velocity, 2) * 0.8;
          velGain.connect(rattleSend);
          rattleSend.connect(rattleReverb);

          source.start(nextNoteTime);

          // 1/32 note is roughly 0.05s. Add slight swing randomness (Â±0.005)
          nextNoteTime += 0.05 + (Math.random() * 0.01 - 0.005);
        }
        if (isDrumrolling) {
          drumrollTimer = setTimeout(scheduleDrumroll, 25);
        }
      }

      scheduleDrumroll();

      return {
        stop: () => {
          return new Promise(resolve => {
            if (drumrollMasterGain) {
              // Cancel current ramps
              drumrollMasterGain.gain.cancelScheduledValues(audioCtx.currentTime);
              drumrollMasterGain.gain.setValueAtTime(drumrollMasterGain.gain.value, audioCtx.currentTime);
              // Crescendo back to 26% over 0.5 seconds
              drumrollMasterGain.gain.linearRampToValueAtTime(0.26, audioCtx.currentTime + 0.5);
              
              setTimeout(() => {
                isDrumrolling = false;
                clearTimeout(drumrollTimer);
                // Quick fade out
                drumrollMasterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.05);
                setTimeout(resolve, 50);
              }, 500);
            } else {
              isDrumrolling = false;
              clearTimeout(drumrollTimer);
              resolve();
            }
          });
        }
      };
    } catch (e) {
      console.error("Drumroll err", e);
      return { stop: () => Promise.resolve() };
    }
  }

  // Helper: Update UI stats
  function updateStatsUI() {
    statLevel.textContent = state.level;
    statCash.textContent = state.cash;
    statTrust.textContent = state.trust + '%';
    statPop.textContent = state.popularity;
    statAffection.textContent = state.affection;
  }

  async function fetchWithRetry(url, options, maxAttempts = 6) {
    let attempt = 1;
    while (attempt <= maxAttempts) {
      if (attempt > 1) {
        addLog(`> Retrying connection (Attempt ${attempt}/${maxAttempts})...`, "log-system");
      }
      try {
        const res = await fetch(url, options);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'API Error');
        return data;
      } catch (e) {
        const isRateLimit = e.message.includes('429') || e.message.toLowerCase().includes('rate limit') || e.message.includes('resets in') || e.message.toLowerCase().includes('throttled');
        if (!isRateLimit || attempt === maxAttempts) throw e;
        
        let waitTime = 2500;
        const match = e.message.match(/resets in ~([0-9]+)s/);
        if (match) waitTime = (parseInt(match[1], 10) * 1000) + 1000;
        
        addLog(`> Rate limit hit. Waiting ${Math.round(waitTime/1000)}s before retrying...`, "log-system");
        await new Promise(r => setTimeout(r, waitTime));
        attempt++;
      }
    }
  }

  // WARM UP THE CLOUD
  // Pre-fetch the first customer and send dummy pings to wake up Replicate GPUs
  let preloadedCustomerPromise = null;
  let lastWarmupTime = Date.now();

  function warmupCloud() {
    lastWarmupTime = Date.now();
    
    // 1. Preload the first customer ONLY if we are at the start screen
    if (state.phase === "START") {
      preloadedCustomerPromise = fetchWithRetry('/api/game-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state })
      });
    }
    
    // 2. Ping Image GPU (flux-schnell)
    fetchWithRetry('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model_id: 'flux-schnell',
        prompt: "A blank white square",
        aspect_ratio: '1:1'
      })
    }).catch(e => console.warn("Warmup image failed:", e));
  }
  // Trigger immediately
  warmupCloud();

  // Re-warm the cloud if the user leaves the tab and comes back later!
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === 'visible') {
      // If it's been more than 3 minutes (180,000 ms), the cloud is probably cold. Warm it up!
      if (Date.now() - lastWarmupTime > 180000) {
        console.log("Tab regained focus after 3+ mins. Rewarming the cloud...");
        warmupCloud();
      }
    }
  });

  async function generateReactionCollageImg2Img(customerUrl, badgeUrl, itemUrl, reactionPrompt, returnUrlOnly = false) {
    if (!returnUrlOnly) {
      
      scannerStatus.textContent = "COMPOSITING MEMORIES...";
      itemImage.style.opacity = '0.3';
      scannerStatus.style.color = "#00ffcc";
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 1024, 1024);

    const loadImage = (url) => new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

    try {
      const [customerImg, badgeImg, itemImg] = await Promise.all([
        loadImage(customerUrl),
        loadImage(badgeUrl),
        loadImage(itemUrl)
      ]);

      // Left half: Customer
      ctx.drawImage(customerImg, 0, 0, 512, 1024);
      // Top Right: Badge
      ctx.drawImage(badgeImg, 512, 0, 512, 512);
      // Bottom Right: Item
      ctx.drawImage(itemImg, 512, 512, 512, 512);

      const base64Collage = canvas.toDataURL('image/jpeg', 0.9);

      if (!returnUrlOnly) scannerStatus.textContent = "SYNTHESIZING COLLAGE...";
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 180 seconds max

      const res = await fetch('/api/img2img', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Collage,
          prompt: reactionPrompt,
          prompt_strength: 0.85
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Img2Img API Error: ${errText}`);
      }
      const data = await res.json();
      
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(data.url)}`;
      if (returnUrlOnly) return proxyUrl;

      return new Promise((resolve) => {
        itemImage.onload = () => {
              const _noText = document.getElementById('no-item-text');
              if (_noText) _noText.style.display = 'none';
          
          itemImage.style.opacity = '';
          itemImage.style.display = 'block';
          itemImage.classList.add('loaded');
          scannerStatus.textContent = "VISUALIZATION COMPLETE";
          resolve();
        };
        itemImage.onerror = () => {
          
          scannerStatus.textContent = "IMAGE LOAD ERROR";
          resolve();
        };
        itemImage.src = proxyUrl;
      });

    } catch (e) {
      console.error("Img2Img Error:", e);
      if (!returnUrlOnly) {
        
        scannerStatus.textContent = "SYNTHESIS FAILED";
        scannerStatus.style.color = "#ff3333";
      }
      return null;
    }
  }

  // Phase: Call Game Master
  async function callGameMaster() {
    state.phase = "WAITING_FOR_GM";
    addLog("Waiting for customer...", "log-system");
    gameInput.disabled = true;

    try {
      let data;
      if (preloadedCustomerPromise) {
        data = await preloadedCustomerPromise;
        preloadedCustomerPromise = null;
      } else {
        data = await fetchWithRetry('/api/game-master', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state, step: 'arrival' })
        });
      }

      state.currentCustomerName = data.name || "A Mysterious Entity";
      state.currentCustomerDesc = data.desc || data.dialogue || "A glitched orb";
      state.currentCustomerRequest = data.base_item;
      state.currentCustomerNeed = data.emotional_need;
      state.currentCustomerSeed = Math.floor(Math.random() * 1000000);
      state.customerFirstLine = data.customer_first_line || "What are you staring at?";
      state.itemRevealed = false;
      state.needRevealed = false;
      
      // Start image generation in the background!
      let portraitPrompt = `A surreal portrait of ${state.currentCustomerDesc} standing at a grocery store checkout counter. Cinematic, vibrant.`;
      generateCharacterImage(portraitPrompt, 'character', state.currentCustomerSeed);

      if (data.scene_flavor) await addLogTypewriter(`> ${data.scene_flavor}`, "log-system", 15);
      if (data.subconscious_line) await addLogTypewriter(`[SUBCONSCIOUS] ${data.subconscious_line}`, "log-gm", 25);
      if (data.customer_arrival_flavor) await addLogTypewriter(`> ${data.customer_arrival_flavor}`, "log-system", 15);
      if (state.customerFirstLine) {
        await addLogTypewriter(`[${state.currentCustomerName.toUpperCase()}] ${state.customerFirstLine}`, "log-customer", 25);
        state.conversationHistory.push({ role: 'assistant', content: state.customerFirstLine });
      }

      setPersistentPrompt("> Type to ask them about what they need, or type ITEM to find the item now.", "log-gm");
      state.phase = "WAITING_FOR_PLAYER_GREETING";
      gameInput.disabled = false;
      gameInput.focus();

    } catch (e) {
      addLog(`Game Master Error: ${e.message}`, "log-error");
      state.phase = "START";
      gameInput.disabled = false;
    }
  }

  async function handlePlayerGreeting(val) {
    if (val.trim().toUpperCase() === 'ITEM') {
      state.phase = "WAITING_FOR_USER";
      if (!state.itemRevealed && !state.needRevealed) {
         await addLogTypewriter(`> Customer Wants: UNKNOWN`, "log-system", 10);
         await addLogTypewriter(`> Hint: UNKNOWN`, "log-system", 10);
      } else {
         await addLogTypewriter(`> Customer Wants: ${state.itemRevealed ? state.currentCustomerRequest.toUpperCase() : "UNKNOWN"}`, "log-system", 10);
         await addLogTypewriter(`> Hint: ${state.needRevealed ? state.currentCustomerNeed : "UNKNOWN"}`, "log-system", 10);
      }
      await setPersistentPrompt(`> What grocery item do you slide across the scanner?`, "log-gm");
      gameInput.disabled = false;
      gameInput.focus();
      return;
    }

    setPersistentPrompt("");
      state.phase = "WAITING_FOR_GM_RESPONSE";
    gameInput.disabled = true;
    state.conversationHistory.push({ role: 'user', content: val });
    
    try {
      let rollItem = Math.random();
      let rollNeed = Math.random();

      let data = await fetchWithRetry('/api/game-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          state, 
          step: 'chat',
          customer_first_line: state.customerFirstLine,
          player_response: val,
          roll_item: rollItem,
          roll_need: rollNeed,
          trust_val: state.trust
        })
      });

      if (data.customer_response_line) {
        await addLogTypewriter(`[${state.currentCustomerName.toUpperCase()}] ${data.customer_response_line}`, "log-customer", 25);
        state.conversationHistory.push({ role: 'assistant', content: data.customer_response_line });
      }

      let newlyRevealedItem = data.revealed_item && !state.itemRevealed;
      let newlyRevealedNeed = data.revealed_need && !state.needRevealed;

      if (newlyRevealedItem) state.itemRevealed = true;
      if (newlyRevealedNeed) state.needRevealed = true;

      if (newlyRevealedItem || newlyRevealedNeed) {
        const itemPhrases = [
          "Got it. They're looking for {item}.",
          "Okay, so the base item is {item}.",
          "I knew it. They want {item}.",
          "Ah, {item}. A classic choice.",
          "Finally got it out of them: {item}.",
          "Looks like I'll need to generate {item}.",
          "So they came all this way for {item}.",
          "They're after {item}. Easy enough.",
          "Target acquired: {item}.",
          "Understood. The secret ingredient is {item}.",
          "Okay, mental note: grab {item}.",
          "They just want {item}? I can do that.",
          "Right, so it's {item} they're hunting for.",
          "Gotcha. {item} coming right up.",
          "I should have guessed it was {item}.",
          "Good to know. They need {item}.",
          "So the request is actually just {item}.",
          "Alright, {item} is what I need to bag.",
          "That solves one mystery. They want {item}.",
          "Noted. {item}."
        ];
        
        const needPhrases = [
          "And they need it for {need}.",
          "Makes sense, considering they want {need}.",
          "So their true motive is {need}.",
          "Ah, the old '{need}' problem.",
          "Looks like they're dealing with {need}.",
          "Wow, they just want {need}.",
          "I guess {need} is weighing heavily on them.",
          "They're just trying to find {need}.",
          "And the underlying issue is {need}.",
          "So it's all about {need}.",
          "I can definitely sympathize with {need}.",
          "Their emotional core right now is {need}.",
          "It seems {need} is driving them today.",
          "That explains why they're so fixated on {need}.",
          "Aha, they need help with {need}.",
          "They're secretly hoping for {need}.",
          "The subtext here is definitely {need}.",
          "Turns out they just want {need}.",
          "So their real struggle is {need}.",
          "I need to make sure this helps with {need}."
        ];

        let subLine = "";
        if (newlyRevealedItem) {
          subLine += itemPhrases[Math.floor(Math.random() * itemPhrases.length)].replace('{item}', state.currentCustomerRequest);
        }
        if (newlyRevealedNeed) {
          if (subLine) subLine += " ";
          subLine += needPhrases[Math.floor(Math.random() * needPhrases.length)].replace('{need}', state.currentCustomerNeed);
        }
        
        await addLogTypewriter(`[SUBCONSCIOUS] ${subLine}`, 'log-subconscious', 20);
      }

      
      
      setPersistentPrompt("> Type to ask them about what they need, or type ITEM to find the item now.", "log-gm");
      state.phase = "WAITING_FOR_PLAYER_GREETING";
      gameInput.disabled = false;
      gameInput.focus();

    } catch (e) {
      addLog(`Game Master Error: ${e.message}`, "log-error");
      state.phase = "START";
      gameInput.disabled = false;
    }
  }
  // Phase: Generate Image
  async function generateImage(prompt, isDating = false, fullPromptOverride = null) {
      setPersistentPrompt("");
    const originalPhase = state.phase;
    state.phase = isDating ? "DATING_GENERATING" : "GENERATING";
    gameInput.disabled = true;
    
    itemImage.onload = null;
    itemImage.onerror = null;
    
    itemImage.style.opacity = '0.3';
      scannerStatus.textContent = isDating ? "VISUALIZING SCENARIO..." : "FABRICATING ITEM...";
      const noItemText = document.getElementById('no-item-text');
      if (noItemText) {
        noItemText.style.display = 'block';
        if (isDating) {
          noItemText.innerHTML = 'VISUALIZING<br>SCENARIO...';
        } else {
          noItemText.innerHTML = 'SEARCHING<br>FOR PRODUCT';
        }
      }

    // If dating, use the LLM's full prompt (no white background requirement). 
    // If grocery, append product photography suffix.
    const finalPrompt = fullPromptOverride ? fullPromptOverride : `${prompt}, isolated on a pure white background, studio lighting, product photography`;

    let success = false;
    let attempt = 1;
    const maxAttempts = 6;

    while (attempt <= maxAttempts && !success) {
      try {
        if (attempt > 1) {
          addLog(`> Retrying image generation (Attempt ${attempt}/${maxAttempts})...`, "log-system");
        }

        // Add an AbortController for a 15s hard timeout on the initial fetch just in case
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model_id: 'flux-schnell',
            prompt: finalPrompt,
            aspect_ratio: '1:1'
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        let predictionId = data.id;
        let prediction;

        let pollCount = 0;
        while (true) {
          // Poll every 1.5s, up to 40 times (60s total wait time per attempt) to allow for cold boots
          if (pollCount > 40) throw new Error('Timeout waiting for image (60s limit). Replicate cold boot taking too long.');
          pollCount++;
          await new Promise(r => setTimeout(r, 1500));
          
          const pollRes = await fetch(`/api/poll?id=${predictionId}&_t=${Date.now()}`);
          prediction = await pollRes.json();
          
          if (!pollRes.ok) throw new Error(prediction.message);
          if (prediction.status === 'succeeded') break;
          if (prediction.status === 'failed' || prediction.status === 'canceled') {
            throw new Error(prediction.error || 'Generation failed.');
          }
        }

        let outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
        if (!outputUrl) throw new Error("No image returned.");

        // Instead of returning immediately, we set up the image load logic.
        // We set success = true here so the loop doesn't retry. If the image fails to LOAD later,
        // it hits onerror, which we don't retry (we just inform the user).
        success = true;
        
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(outputUrl)}`;
        if (!isDating) state.lastItemUrl = proxyUrl;

        itemImage.src = proxyUrl;
        itemImage.onload = () => {
              const _noText = document.getElementById('no-item-text');
              if (_noText) _noText.style.display = 'none';
          
          itemImage.style.opacity = '';
          const noItemText = document.getElementById('no-item-text');
          if (noItemText) noItemText.style.display = 'none';
          
          itemImage.style.display = 'block';
          itemImage.classList.add('loaded');
          const redScanline = document.getElementById('red-scanline');
          if (redScanline) {
            redScanline.classList.remove('active');
            void redScanline.offsetWidth;
            redScanline.classList.add('active');
          }
          
          playScannerBeep();

          if (!isDating) {
            state.phase = "HAND_OVER_ITEM";
            setPersistentPrompt(`> Item fabricated. Press ENTER or type "GIVE" to hand it over.`, "log-gm");
            
            state.pendingVisionData = fetchWithRetry('/api/vision', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageUrl: outputUrl,
                customerRequest: state.currentCustomerRequest,
                emotionalNeed: state.currentCustomerNeed,
                userPrompt: prompt
              })
            }).catch(err => {
              console.error("Prefetch vision error:", err);
              return null;
            });

            // We store the url and prompt in state so the input handler can call appraiseItem
            state.pendingItemUrl = outputUrl;
            state.pendingItemPrompt = prompt;
            gameInput.disabled = false;
            gameInput.focus();
          } else {
            if (state.phase === "DATING_GENERATING") {
              if (state.datingRound > 4) {
                scannerStatus.textContent = "DATE CONCLUDED";
                finishDating();
              } else {
                scannerStatus.textContent = `DATE ROUND ${state.datingRound - 1}/3`;
                state.phase = "DATING_WAIT_USER";
                gameInput.disabled = false;
                gameInput.focus();
              }
            }
          }
        };
        return true;
        
        let imageLoadAttempts = 0;
        itemImage.onerror = () => {
          imageLoadAttempts++;
          if (imageLoadAttempts < 3) {
            setTimeout(() => {
              itemImage.src = proxyUrl + '&retry=' + Date.now();
            }, 1000);
          } else {
            
            scannerStatus.textContent = "IMAGE LOAD ERROR";
            state.phase = isDating ? "DATING_WAIT_USER" : originalPhase;
            gameInput.disabled = false;
            gameInput.focus();
            addLog(`> ERROR: The generated image failed to load. This can happen on mobile due to connection drops, strict browser privacy blocks, or adblockers. Try again!`, "log-error");
          }
        };

      } catch (e) {
        const isRateLimit = e.message.includes('429') || e.message.toLowerCase().includes('rate limit') || e.message.includes('resets in');
        
        if (!isRateLimit || attempt === maxAttempts) {
          addLog(`Generation Error: ${e.message}`, "log-error");
          
          scannerStatus.textContent = "ERROR";
          state.phase = isDating ? "DATING_WAIT_USER" : originalPhase;
          gameInput.disabled = false;
          gameInput.focus();
          return false;
        } else {
          let waitTime = 2500;
          const match = e.message.match(/resets in ~([0-9]+)s/);
          if (match) {
            waitTime = (parseInt(match[1], 10) * 1000) + 1000; // wait requested time + 1s buffer
          }
          addLog(`> Rate limit hit. Waiting ${Math.round(waitTime/1000)}s before retrying...`, "log-system");
          await new Promise(r => setTimeout(r, waitTime));
          attempt++;
        }
      }
    }
  }

  async function generateCharacterImage(prompt, type = 'character', seed = undefined, returnUrlOnly = false) {
    if (!returnUrlOnly) {
      itemImage.onload = null;
      itemImage.onerror = null;
      itemImage.style.opacity = '0.3';
      
      const _noText = document.getElementById('no-item-text');
        if (_noText) {
          _noText.style.display = 'block';
          if (type === 'badge') {
            _noText.innerHTML = 'PRINTING<br>ID BADGE...';
            scannerStatus.textContent = "PRINTING ID BADGE...";
          } else {
            _noText.innerHTML = 'FABRICATING<br>ENTITY...';
            scannerStatus.textContent = "VISUALIZING ENTITY...";
          }
        }
      scannerStatus.style.color = "#00ffcc";
    }

    let attempt = 1;
    const maxAttempts = 3;

    while (attempt <= maxAttempts) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model_id: 'flux-schnell',
            prompt: prompt,
            aspect_ratio: '1:1',
            seed: seed
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        let predictionId = data.id;
        let prediction;
        let pollCount = 0;

        while (true) {
          if (pollCount > 40) throw new Error('Timeout waiting for image (60s limit).');
          pollCount++;
          await new Promise(r => setTimeout(r, 1500));
          
          const pollRes = await fetch(`/api/poll?id=${predictionId}&_t=${Date.now()}`);
          prediction = await pollRes.json();
          
          if (!pollRes.ok) throw new Error(prediction.message);
          if (prediction.status === 'succeeded') break;
          if (prediction.status === 'failed' || prediction.status === 'canceled') {
            throw new Error(prediction.error || 'Generation failed.');
          }
        }

        let outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
        if (!outputUrl) throw new Error("No image returned.");

        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(outputUrl)}`;
        if (type === 'badge') state.badgeImageUrl = proxyUrl;
        else if (type === 'character' && !returnUrlOnly) state.customerImageUrl = proxyUrl;
        
        if (returnUrlOnly) return proxyUrl;

        let imageLoadAttempts = 0;

        return new Promise((resolve) => {
          itemImage.onload = () => {
              const _noText = document.getElementById('no-item-text');
              if (_noText) _noText.style.display = 'none';
            itemImage.style.opacity = '';
            itemImage.style.display = 'block';
            itemImage.classList.add('loaded');
            scannerStatus.textContent = type === 'badge' ? "ID BADGE PRINTED" : "VISUALIZATION COMPLETE";
            scannerStatus.style.color = "#00ffcc";
            resolve(true);
          };

          itemImage.onerror = () => {
            imageLoadAttempts++;
            if (imageLoadAttempts < 3) {
              setTimeout(() => {
                itemImage.src = proxyUrl + '&retry=' + Date.now();
              }, 1000);
            } else {
              if (type !== 'badge') 
              scannerStatus.textContent = "IMAGE LOAD FAILED";
              scannerStatus.style.color = "#ff3333";
              resolve(false);
            }
          };

          itemImage.src = proxyUrl;
        });

      } catch (e) {
          if (attempt < maxAttempts) {
             console.warn("Image generation failed, retrying in 3s...", e);
             await new Promise(r => setTimeout(r, 3000));
          }
          attempt++;
        }
    }
    
    if (!returnUrlOnly) {
      
      scannerStatus.textContent = "VISUALIZATION FAILED";
      scannerStatus.style.color = "#ff3333";
    }
    return null;
  }

  // Phase: Checkout Minigames
  async function handleBarcodeSuccess() {
    state.phase = "CHECKOUT_BARCODE_DONE";
    gameInput.disabled = true;
    gameInput.value = "";
    addLog(`> BARCODE ACCEPTED`, "log-system");
    
    const sub1Options = [
        `Does this object really look like what they wanted? Will it actually help them?`,
        `I hope I didn't mess this up. Are they really going to use this?`,
        `This feels a bit unorthodox, but maybe unorthodox is exactly what they need right now.`,
        `They look skeptical. Or maybe they always look like that. Either way, this is a tall order.`,
        `I should have asked more questions. Is this really the key to their problems?`,
        `My hands are shaking a little. I just really want them to be satisfied.`,
        `Did I grab the right item? The label is smudged. I hope it helps.`,
        `Sometimes you just have to trust your gut. And my gut says this is perfect for them.`,
        `They have such intense eyes. I wonder if they can tell I'm guessing.`,
        `This job is mostly psychology anyway. This item is just a placebo for whatever they are going through.`,
        `If this doesn't help them, they are definitely going to ask for a manager.`,
        `I can see the hesitation in their posture. They doubt this will accomplish anything.`,
        `Why do I care so much? It's just groceries. But they seem so stressed.`,
        `I swear I saw this work in a dream once. It's guaranteed to resolve their bizarre situation.`,
        `I should probably not stare. Let's just focus on ringing this up.`
      ];
    const pick1 = sub1Options[Math.floor(Math.random() * sub1Options.length)];
    await addLogTypewriter(`[SUBCONSCIOUS] ${pick1}`, "log-gm", 15);
    
    state.phase = "CHECKOUT_COUPON";
    const word = couponWords[Math.floor(Math.random() * couponWords.length)];
    const num = couponNumbers[Math.floor(Math.random() * couponNumbers.length)];
    state.couponTarget = `${word}${num}`;
    
    setPersistentPrompt(`> COUPON EVENT: ENTER '${state.couponTarget}'`, "log-error");
    gameInput.disabled = false;
    gameInput.focus();
  }

  async function handleCouponSuccess() {
    state.phase = "CHECKOUT_COUPON_DONE";
    gameInput.disabled = true;
    gameInput.value = "";
    addLog(`> COUPON ACCEPTED`, "log-system");
    
    const sub2Options = [
      `They are staring right through me. I wonder what they are thinking right now...`,
      `The silence between us is deafening. I should bag this faster.`,
      `Are they looking at my nametag? Or the stain on my apron?`,
      `I can hear the hum of the fluorescent lights. And their breathing.`,
      `Why do they look so sad? Or is that just how their face is?`,
      `I wonder if they have a family. I wonder if anyone is waiting for them at home.`,
      `We are just two ships passing in the night. Or two souls trapped in a grocery store.`,
      `I should say something. No, keep quiet. Just bag the items.`,
      `They haven't blinked in a solid minute. It's starting to unnerve me.`,
      `I can feel their impatience radiating off them like heat.`,
      `What if I just walked away right now? Just left the register and never came back?`,
      `They look like they belong in a different century.`,
      `I wonder what their voice sounds like when they aren't asking for groceries.`,
      `Is it hot in here, or is it just the tension of this mundane interaction?`,
      `I bet they have a really interesting secret.`,
      `They look exhausted. Or maybe I'm projecting.`,
      `I should smile more. But my face feels frozen.`,
      `If they sigh one more time, I might actually cry.`,
      `I wonder if they remember my face from the last time they were here.`,
      `This is taking too long. I can feel the fabric of reality thinning.`
    ];
    const pick2 = sub2Options[Math.floor(Math.random() * sub2Options.length)];
    await addLogTypewriter(`[SUBCONSCIOUS] ${pick2}`, "log-gm", 15);
    
    state.phase = "CHECKOUT_BAG";
    setPersistentPrompt(`> BAG THE GROCERIES: TYPE 'BAG'`, "log-error");
    gameInput.disabled = false;
    gameInput.focus();
  }

  async function handleBagSuccess() {
    state.phase = "CHECKOUT_OUTCOME";
    gameInput.disabled = true;
    gameInput.value = "";
    addLog(`> BAGGED`, "log-system");
    
    // AUDIO/VISUAL FLAIR: Start hand animation
    const handOverlay = document.getElementById('hand-overlay');
    if (handOverlay) { handOverlay.style.display = 'none'; void handOverlay.offsetWidth; handOverlay.style.display = 'block'; }

    const data = state.pendingAppraisalData;
    const imagePromise = state.pendingAppraisalImagePromise;

    let drumroll = null;
    let preloadedImgUrl = null;
    let drumrollStartTime = 0;

    if (imagePromise) {
      scannerStatus.textContent = "WAITING ON VISUALIZATION...";
      drumrollStartTime = Date.now();
      drumroll = playDrumroll();
      
      const imgUrl = await Promise.race([
        imagePromise,
        new Promise(resolve => setTimeout(() => {
          console.error("imagePromise fallback timeout triggered.");
          resolve(null);
        }, 185000))
      ]);
      
      if (imgUrl && typeof imgUrl === 'string') {
        preloadedImgUrl = imgUrl;
        
        // Dim the old image and show the red overlay text
        const _noText = document.getElementById('no-item-text');
        if (_noText) {
          _noText.style.display = 'block';
          _noText.innerHTML = 'COMPOSITING<br>MEMORIES...';
        }
        itemImage.style.opacity = '0.3';
        
        // Preload the new image secretly in the background
        await new Promise((resolve) => {
          const tempImg = new Image();
          tempImg.onload = resolve;
          tempImg.onerror = resolve;
          tempImg.src = imgUrl;
        });
      }
    }
    
    if (drumrollStartTime > 0) {
      const elapsed = Date.now() - drumrollStartTime;
      if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed));
    }

    if (data.flavor_text) {
      await addLogTypewriter(`> ${data.flavor_text}`, "log-system", 15);
    } else {
      await addLogTypewriter(`> The clerk hands over the item.`, "log-system", 15);
    }
    
    // Stop the drumroll
    if (drumroll && drumroll.stop) await drumroll.stop();

    // Play outcome sound effect
    try {
      if (data.approved) playSFX('success');
      else playSFX('fail');
    } catch (err) {}

    // Reveal the preloaded image INSTANTLY
    if (preloadedImgUrl) {
      itemImage.src = preloadedImgUrl;
      const _noText = document.getElementById('no-item-text');
      if (_noText) _noText.style.display = 'none';
      itemImage.style.opacity = '';
      itemImage.style.display = 'block';
      itemImage.classList.add('loaded');
      scannerStatus.textContent = "VISUALIZATION COMPLETE";
      scannerStatus.style.color = "#00ffcc";
    }

    await addLogTypewriter(`[${state.currentCustomerName.toUpperCase()}] ${data.reaction}`, "log-customer", 25);
    
    let affectionGained = 0;

    if (data.approved) {
      scannerStatus.textContent = `APPROVED: $${data.value}`;
      scannerStatus.style.color = "#33ff33";
      state.cash += data.value;
      state.popularity += 1;
      
      affectionGained = data.affection || 1;
      state.affection += affectionGained;
      
      if (data.bonus) {
        addLog(`> BONUS! You creatively solved their problem! (+${affectionGained} Affection)`, "log-system");
        state.cash += data.value * 2;
      } else {
        addLog(`> Item sold. (+${affectionGained} Affection)`, "log-system");
      }

      state.trust = Math.min(100, state.trust + 10);
      for(let i=0; i<3; i++) setTimeout(() => spawnParticle('cash'), i*200);
      if (data.value > 1000) spawnParticle('heart');
    } else {
      scannerStatus.textContent = `REJECTED`;
      scannerStatus.style.color = "#ff3333";
      document.body.classList.add('alarm-flashing');
      state.popularity -= 1;
      state.trust = Math.max(0, state.trust - 20);
      addLog(`> Item rejected. (-20 Trust)`, "log-system");
    }
    
    state.customersServed.push({
      id: state.currentCustomerSeed,
      name: state.currentCustomerName,
      desc: state.currentCustomerDesc,
      request: state.currentCustomerRequest,
      affectionGained: affectionGained
    });

    if (handOverlay) handOverlay.style.display = 'none';

    document.body.classList.remove('alarm-flashing');

    // True Love instant-win condition
    if (affectionGained >= 10) {
      state.selectedCustomer = { request: state.currentCustomerRequest, desc: state.currentCustomerDesc, seed: state.currentCustomerSeed, imageUrl: state.customerImageUrl };
      addLog(`\n===========================================`, "log-system");
      addLog(`> 💕 TRUE LOVE! 💕`, "log-system");
      addLog(`> This customer fell madly in love with you on the spot!`, "log-system");
      setPersistentPrompt(`> Type "I'm Ace" or "I'm Aro" to be best friends, or anything else to date!`, "log-gm");
      state.phase = "TRUE_LOVE_PROMPT";
      gameInput.disabled = false;
      gameInput.focus();
      return;
    }

    if (state.level >= 5) {
      updateStatsUI();
      if (data.approved) {
        setPersistentPrompt(`> Success! Shift completed. Type "LEDGER" or hit ENTER to review your customers.`, "log-gm");
      } else {
        setPersistentPrompt(`> Too bad. Shift completed. Type "LEDGER" or hit ENTER to review your customers.`, "log-gm");
      }
      state.phase = "WAIT_LEDGER";
      gameInput.disabled = false;
      gameInput.focus();
    } else {
      state.level++;
      updateStatsUI();
      if (data.approved) {
        setPersistentPrompt(`> Success! Type "NEXT" or hit ENTER to serve the next customer.`, "log-gm");
      } else {
        setPersistentPrompt(`> Too bad. Type "NEXT" or hit ENTER to serve the next customer.`, "log-gm");
      }
      state.phase = "START";
      gameInput.disabled = false;
      gameInput.focus();
    }
  }

  // Phase: Vision Appraisal
  async function appraiseItem(imageUrl, userPrompt) {
    state.phase = "APPRAISING";

    try {
      let data;
      if (state.pendingVisionData) {
        data = await state.pendingVisionData;
        state.pendingVisionData = null;
      }
      
      // If prefetch failed or didn't exist, fetch normally
      if (!data) {
        data = await fetchWithRetry('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl,
            customerRequest: state.currentCustomerRequest,
            emotionalNeed: state.currentCustomerNeed,
            userPrompt
          })
        });
      }

      let reactionPrompt = "";
      const playerContext = state.playerDescription ? `from a grocery clerk described as: ${state.playerDescription}. The clerk is clearly visible in frame` : `from a grocery clerk`;

      if (data.approved) {
        reactionPrompt = `A surreal photograph of ${state.currentCustomerDesc} happily receiving the item "${userPrompt}" ${playerContext}. Happy, vibrant, successful, grocery store background.`;
      } else {
        reactionPrompt = `A surreal photograph of ${state.currentCustomerDesc} angrily yelling and throwing a fit, with the rejected item "${userPrompt}" thrown on the ground in disgust. They are yelling at the clerk. The clerk is described as: ${state.playerDescription || 'a grocery clerk'} and is clearly visible in frame. Dramatic, chaotic, angry, grocery store background.`;
      }

      // Always use Flux-schnell for the reaction! Img2Img with collages just produces collages or chimeras.
      let imagePromise = generateCharacterImage(reactionPrompt, 'character', state.currentCustomerSeed, true);

      state.pendingAppraisalData = data;
      state.pendingAppraisalImagePromise = imagePromise;

      state.phase = "CHECKOUT_BARCODE";
      const schemas = ["XXXX", "XXXXX", "XX-X-XX", "XXX-XXX", "XX-XX-X", "XXX-XXXX", "XXX-XX-XX", "XXX-XXX-XXX"];
        const chosenSchema = schemas[Math.floor(Math.random() * schemas.length)];
        let target = "";
        for (let i = 0; i < chosenSchema.length; i++) {
          if (chosenSchema[i] === 'X') {
            target += Math.floor(Math.random() * 10).toString();
          } else {
            target += chosenSchema[i];
          }
        }
        state.barcodeTarget = target;
        state.barcodeCurrent = chosenSchema;
      
      await addLogTypewriter(`[SYSTEM] The customer stares intently at the item. Ring them up!`, "log-system", 15);
      setPersistentPrompt(`> BARCODE SCANNER: TYPE '${state.barcodeTarget}' TO SCAN`, "log-error");
      
      gameInput.value = state.barcodeCurrent;
      gameInput.disabled = false;
      gameInput.focus();

    } catch (e) {
      addLog(`Appraisal Error: ${e.message}`, "log-error");
      scannerStatus.textContent = "SCANNER ERROR";
      state.phase = "START";
      gameInput.disabled = false;
    }
  }

  // Phase: Ledger / Selection
  function showLedger() {
    if (state.cash === 0) {
      addLog(`\n===========================================`, "log-system");
      addLog(`> YOU SOLD NO GROCERIES. YOU HAVE NO MONEY FOR A DATE.`, "log-error");
      finishDating(true);
      return;
    }

    state.phase = "LEDGER";
    addLog(`\n===========================================`, "log-system");
    addLog(`WEEKLY LEDGER: SHIFT OVER`, "log-system");
    addLog(`===========================================`, "log-system");
    
    // Sort customers by affection, descending
    state.customersServed.sort((a, b) => b.affectionGained - a.affectionGained);

    state.customersServed.forEach((c, idx) => {
      addLog(`[${idx + 1}] ${c.name} | ${c.affectionGained}💖 | Wanted: ${c.request}`, "log-user");
    });

    setPersistentPrompt(`> Pick a customer 1-5, or type "I'm Ace" / "I'm Aro" to just be friends.`, "log-gm");
    gameInput.disabled = false;
    gameInput.focus();
  }

  // Phase: Obstacle Minigame
  async function callObstacleMaster() {
    try {
      const res = await fetch('/api/obstacle-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: state.datingLocation,
          customer: state.selectedCustomer
        })
      });
      if (!res.ok) throw new Error("API Error");
      const data = await res.json();
      
      state.obstacleTarget = data.verb.toUpperCase();
      state.obstacleCount = 0;
      
      await addLogTypewriter(`> ${data.narrative}`, "log-error", 15);
      setPersistentPrompt(`> TYPE '${state.obstacleTarget}' 3 TIMES TO FIX IT!`, "log-error");
      
      state.phase = "DATING_OBSTACLE";
      document.body.classList.add('alarm-flashing');
      playKlaxon();

      gameInput.disabled = false;
      gameInput.focus();
    } catch (e) {
      state.obstacleTarget = "FIX";
      state.obstacleCount = 0;
      setPersistentPrompt(`> Your ride stalls! Type 'FIX' 3 times!`, "log-error");
      state.phase = "DATING_OBSTACLE";
      document.body.classList.add('alarm-flashing');
      playKlaxon();
      gameInput.disabled = false;
      gameInput.focus();
    }
  }

  let klaxonInterval = null;
  function playKlaxon() {
    if (window.isMuted) return;
    if (!audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      klaxonInterval = setInterval(() => {
        const osc = audioCtx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(150, audioCtx.currentTime + 0.3);
        const env = audioCtx.createGain();
        env.gain.setValueAtTime(0, audioCtx.currentTime);
        env.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
        env.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
        osc.connect(env);
        env.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }, 500);
    } catch (e) {}
  }

  function stopKlaxon() {
    if (klaxonInterval) clearInterval(klaxonInterval);
    document.body.classList.remove('alarm-flashing');
  }

  function handleObstacleSuccess() {
    state.obstacleCount++;
    playScannerBeep();
    gameInput.value = '';
    
    if (state.obstacleCount >= 3) {
      stopKlaxon();
      addLog(`> Fixed! Arriving at the date...`, "log-system");
      state.phase = "DATING_GENERATING";
      const packageMsg = `I want to go to ${state.datingLocation}. I am wearing ${state.datingOutfit} and I brought you ${state.datingGift}.`;
      callDatingMaster(packageMsg);
    } else {
      addLog(`> ${state.obstacleTarget} (${state.obstacleCount}/3)`, "log-user");
    }
  }

  // Phase: Dating Logic
  async function callDatingMaster(step, userMessage) {
    state.phase = "DATING_GENERATING";
    gameInput.disabled = true;
    setPersistentPrompt("");

    if (userMessage && (step.startsWith('eval_') || step.startsWith('chat_'))) {
      state.datingHistory.push({ role: "user", content: userMessage });
    }

    addLog("Waiting for response...", "log-system");

    try {
      const data = await fetchWithRetry('/api/dating-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: state,
          step: step,
          userMessage: userMessage,
          datingHistory: state.datingHistory
        })
      });

      if (data.ideal_location) state.idealLocation = data.ideal_location;
      if (data.secret_desire) state.secretDesire = data.secret_desire;
      if (data.vow_requirement) state.vowRequirement = data.vow_requirement;

      let imagePromise = null;
      if (data.image_prompt) {
        imagePromise = generateCharacterImage(data.image_prompt, 'character', state.selectedCustomer.seed);
      }

      if (data.montage_flavor_text) await addLogTypewriter(`> ${data.montage_flavor_text}`, "log-system", 15);
      if (data.customer_flavor_text) await addLogTypewriter(`> ${data.customer_flavor_text}`, "log-system", 15);
      
      if (data.dialogue) {
        const customerName = state.selectedCustomer && state.selectedCustomer.name ? state.selectedCustomer.name.toUpperCase() : "DATE";
        await addLogTypewriter(`[${customerName}] ${data.dialogue}`, "log-customer", 25);
        if (step.startsWith('eval_') || step.startsWith('chat_')) {
           state.datingHistory.push({ role: "assistant", content: data.dialogue });
        }
      }

      if (data.revealed_location) {
         await addLogTypewriter(`[SUBCONSCIOUS] They really want to go to ${state.idealLocation}.`, "log-subconscious", 20);
      }
      if (data.revealed_desire) {
         await addLogTypewriter(`[SUBCONSCIOUS] They are desperate to hear about ${state.secretDesire}.`, "log-subconscious", 20);
      }
      if (data.revealed_vow) {
         await addLogTypewriter(`[SUBCONSCIOUS] To commit forever, they need you to promise ${state.vowRequirement}.`, "log-subconscious", 20);
      }

      if (data.terminate) {
        finishDating(true);
        return;
      }

      if (step === 'init_call' || step === 'chat_call') {
         state.phase = "DATING_CALL_CHAT";
         setPersistentPrompt(`> Chat with them, or type "ASK ON DATE" to propose a location.`, "log-gm");
      } else if (step === 'eval_call') {
         state.phase = "DATING_PREP_OUTFIT";
         setPersistentPrompt(`> What are you going to wear?`, "log-gm");
      } else if (step === 'init_date' || step === 'chat_date') {
         state.phase = "DATING_DATE_CHAT";
         setPersistentPrompt(`> Chat with them, or type "DIVULGE FEELINGS" to answer deeply.`, "log-gm");
      } else if (step === 'eval_date') {
         state.phase = "DATING_PREP_VENUE";
         setPersistentPrompt(`> Where are you hosting the final ceremony?`, "log-gm");
      } else if (step === 'init_altar' || step === 'chat_altar') {
         state.phase = "DATING_ALTAR_CHAT";
         setPersistentPrompt(`> Reassure them, or type "MAKE A VOW" to commit.`, "log-gm");
      } else if (step === 'eval_altar') {
         finishDating(false, data.image_prompt);
         return;
      }

      gameInput.disabled = false;
      gameInput.focus();

    } catch (e) {
      addLog(`Dating Error: ${e.message}`, "log-error");
      gameInput.disabled = false;
      gameInput.focus();
    }
  }

  async function finishDating(forceLoss = false, customWinPrompt = null) {
    state.phase = "DATING_GENERATING";
    const won = forceLoss ? false : (state.datingScore >= 2);
    
    let finalPrompt = won 
      ? (customWinPrompt || `A wildly colorful, cinematic, dramatic romantic fantasy scene showing ${state.selectedCustomer.desc} happily on a wedding date alongside the grocer. The grocer looks like: ${state.playerDescription || 'a grocery clerk'}. Epic lighting, beautiful masterpiece.`)
      : `A wildly dramatic, hyper-emotional cinematic shot of a grocery clerk having an absolute mental breakdown. The clerk looks like: ${state.playerDescription || 'a grocery clerk'}. They are completely collapsed on the ground in the middle of a dimly lit grocery store aisle, sobbing uncontrollably, head in their hands, covered in extreme embarrassment and regret, throwing a fit. Lonely, depressing, Game over vibes. Masterpiece lighting.`;

    addLog(won ? "> YOU FELL IN LOVE! Generating memory..." : "> THEY HATED YOU. Generating memory...", "log-system");

    // We don't await because we just want the final image to show up
    await generateCharacterImage(finalPrompt, 'character', won ? state.selectedCustomer.seed : state.playerSeed);
    
    scannerStatus.textContent = won ? "YOU WIN!" : "GAME OVER";
    scannerStatus.style.color = won ? "#ff00ff" : "#ff3333";
    
    addLog(`\n===========================================`, "log-system");
    addLog(won ? `GAME OVER - YOU WON!` : `GAME OVER - YOU LOST!`, "log-system");
    
    if (won) {
      setPersistentPrompt(`> Type your name for the Leaderboard, or type "NO" to skip.`, "log-gm");
      state.phase = "LEADERBOARD_PROMPT";
    } else {
      setPersistentPrompt(`> Type a complaint to management, or hit ENTER to RESTART`, "log-gm");
      state.phase = "COMPLAINT";
    }
    gameInput.disabled = false;
    gameInput.focus();
  }

  async function saveToLeaderboard(playerName) {
    if (!window.FirebaseAPI) {
      addLog("> Firebase not loaded. Cannot save score.", "log-error");
      return;
    }
    
    addLog("> Uploading memory to the Hall of Romance...", "log-system");
    gameInput.disabled = true;

    try {
      const { db, storage, ref, push, set, storageRef, uploadBytes, getDownloadURL } = window.FirebaseAPI;
      
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout. Firebase might be blocked by an adblocker or the image is too large.")), 20000));

      // 1. Download image from Replicate via proxy to avoid CORS
      const imgUrl = itemImage.src;
      const res = await fetch(imgUrl);
      if (!res.ok) throw new Error("Failed to download image for upload");
      const blob = await res.blob();

      // 2. Upload to Firebase Storage
      const filename = `dates/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const sRef = storageRef(storage, filename);
      await Promise.race([uploadBytes(sRef, blob), timeoutPromise]);
      const permUrl = await getDownloadURL(sRef);

      // 3. Save to Realtime Database
      const totalScore = state.cash + (state.affection * 100);
      const scoreData = {
        name: playerName,
        score: totalScore,
        cash: state.cash,
        affection: state.affection,
        customer: state.selectedCustomer.desc,
        imageUrl: permUrl,
        timestamp: Date.now()
      };

      const newScoreRef = push(ref(db, 'leaderboard'));
      await Promise.race([set(newScoreRef, scoreData), timeoutPromise]);
      localStorage.setItem('myGroceryHighScoreId', newScoreRef.key);
      addLog("> Successfully immortalized! 🏆", "log-system");

    } catch (e) {
      console.error(e);
      addLog(`> Error saving to leaderboard: ${e.message}`, "log-error");
      addLog(`> (Memory saved locally instead!)`, "log-error");
    }
    setPersistentPrompt(`> Type a complaint to management, or hit ENTER to RESTART`, "log-gm");
    state.phase = "COMPLAINT";
    gameInput.disabled = false;
    gameInput.focus();
  }

  let noiseBuffer = null;
  function getNoiseBuffer() {
    if (noiseBuffer) return noiseBuffer;
    const bufferSize = audioCtx.sampleRate * 0.05; // 50ms
    noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  }

  // Initialization
  async function init() {
    await addLogTypewriter(`> LOADING CHECKED OUT v1.14.0...`, "log-system", 10);
    await addLogTypewriter(`> NOW WITH: MOBILE LAYOUT & 3-ACT DATING LOOPS`, "log-system", 10);
    await addLogTypewriter(`> CONNECTING TO NEURAL NET... SUCCESS.`, "log-system", 10);
    await addLogTypewriter(`Welcome weary local grocer! Are you looking for love? Or just cash? Why not both...`, "log-gm", 15);
    await addLogTypewriter(`Provide your customers with the grocery items they need, add a twist to help them emotionally, and you may just end up falling in love!`, "log-gm", 15);
    setPersistentPrompt(`TYPE "START" OR HIT ENTER TO BEGIN SHIFT.`, "log-gm");
    state.phase = "START";
    gameInput.disabled = false;
    gameInput.focus();
  }

  // Input Handlers
  gameInput.addEventListener('keydown', (e) => {
    // Other keydown logic if any (none exist for now, we can leave it empty or remove it)
  });

  gameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      // AUDIO UNLOCK: Must happen synchronously in the event handler
      try {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Kick off loading buffers if they aren't loaded yet
        if (!sfxBuffers.success && !sfxBuffers.fail) loadSFX();
        if (audioCtx.state === 'suspended') audioCtx.resume();
      } catch (err) {}

      let val = gameInput.value.trim();
      
      if (!val) {
        // Handle empty enter logic depending on phase
        if (state.phase === "START") {
          if (state.level > 1) {
            callGameMaster();
            return;
          } else {
            val = 'start'; // Simulate typing 'start' to run the init block below
          }
        } else if (state.phase === "HAND_OVER_ITEM") {
          appraiseItem(state.pendingItemUrl, state.pendingItemPrompt);
          return;
        } else if (state.phase === "WAITING_FOR_PLAYER_GREETING") {
          handlePlayerGreeting(val);
        }
        else if (state.phase === "BADGE_HOLD") {
          addLog("> Booting register...", "log-system");
          callGameMaster();
          return;
        } else if (state.phase === "DATING_PROMPT") {
          val = 'date'; // Simulate dating choice
        } else if (state.phase === "WAIT_LEDGER") {
          val = 'ledger';
        } else if (state.phase === "TRUE_LOVE_PROMPT") {
          val = 'date';
        } else if (state.phase === "COMPLAINT") {
          val = 'restart'; // Simulate restarting
        } else {
          return; // Ignore empty enter for mandatory prompts (grocery item, player setup, dating chat)
        }
      } else {
        addLog(val, "log-user");
      }

      gameInput.value = '';

      if (state.phase === "START") {
        if (val.toLowerCase() === 'start') {
          itemImage.onload = null;
          itemImage.onerror = null;
          itemImage.classList.remove('loaded');
          itemImage.src = '';
          const noItemText = document.getElementById('no-item-text');
          if (noItemText) noItemText.style.display = 'block';
          
          const redScanline = document.getElementById('red-scanline');
          if (redScanline) redScanline.classList.remove('active');
          
          state.phase = "PLAYER_SETUP";
          setPersistentPrompt("> Describe what you look like for your ID badge...", "log-system");
        } else if (val.toLowerCase() === 'next') {
          callGameMaster();
        } else {
          setPersistentPrompt("Type 'start' or 'next' to continue.", "log-system");
        }
      }
      else if (state.phase === "HAND_OVER_ITEM") {
        if (val.toLowerCase() === 'give') {
          appraiseItem(state.pendingItemUrl, state.pendingItemPrompt);
        } else {
          setPersistentPrompt("Press ENTER or type 'GIVE' to hand it over.", "log-system");
        }
      }
      else if (state.phase === "PLAYER_SETUP") {
        state.playerDescription = val;
        state.playerSeed = Math.floor(Math.random() * 1000000);
        gameInput.disabled = true;
        addLog(`> Taking photo for ID badge...`, "log-system");
        
        const badgePrompt = `${val}, smiling employee badge on white background with lanyard, high key lighting portrait photography`;
        generateCharacterImage(badgePrompt, 'badge', state.playerSeed).then(() => {
          setPersistentPrompt("> Badge printed. Press ENTER to start your shift.", "log-system");
          state.phase = "BADGE_HOLD";
          gameInput.disabled = false;
          gameInput.focus();
        });
      }
      else if (state.phase === "WAITING_FOR_PLAYER_GREETING") {
          handlePlayerGreeting(val);
        }
        else if (state.phase === "BADGE_HOLD") {
        gameInput.value = "";
        addLog("> Booting register...", "log-system");
        callGameMaster();
      }
      else if (state.phase === "WAITING_FOR_USER") {
        generateImage(val, false);
      }
      else if (state.phase === "LEDGER") {
        const lower = val.toLowerCase();
        if (lower === "i'm ace" || lower === "im ace") {
          state.isAce = true;
          state.selectedCustomer = state.customersServed[0];
          addLog(`> You decided to just make a friend. Calling up Customer #1...`, "log-gm");
          callDatingMaster(null);
        } else {
          const num = parseInt(val);
          if (num >= 1 && num <= 5) {
            state.selectedCustomer = state.customersServed[num - 1];
            addLog(`> Calling up Customer #${num}...`, "log-gm");
            callDatingMaster(null);
          } else {
            setPersistentPrompt("> Invalid choice. Pick 1-5 or 'I'm Ace'.", "log-error");
          }
        }
      }
      else if (state.phase === "TRUE_LOVE_PROMPT") {
        const lower = val.toLowerCase();
        if (lower === "i'm ace" || lower === "im ace") {
          state.isAce = true;
          addLog(`> You decided to just be best friends!`, "log-gm");
        } else {
          addLog(`> You accept their romantic advances!`, "log-gm");
        }
        // Jump straight to dating round (pass a true love flag to the dating API)
        state.isTrueLove = true;
        callDatingMaster(null);
      }
      else if (state.phase === "WAIT_LEDGER") {
        if (val.toLowerCase() === 'ledger' || val.toLowerCase() === 'next') {
          showLedger();
        } else {
          setPersistentPrompt("Type 'ledger' to review your customers.", "log-system");
        }
      }
      else if (state.phase === "DATING_WAIT_USER") {
        if (state.datingRound === 2) {
          state.datingLocation = val;
          state.phase = "DATING_WARDROBE";
          const wardrobePrompt = async () => {
            gameInput.disabled = true;
            setPersistentPrompt(`> What are you going to wear?`, "log-gm");
            gameInput.disabled = false;
            gameInput.focus();
          };
          wardrobePrompt();
        } else {
          callDatingMaster(val);
        }
      }
      else if (state.phase === "DATING_WARDROBE") {
        state.datingOutfit = val;
        state.playerDescription = `${state.playerDescription}, wearing ${val}`;
        state.phase = "DATING_GIFT";
        const giftPrompt = async () => {
          gameInput.disabled = true;
          setPersistentPrompt(`> You have ${state.cash}. What gift/snack do you bring?`, "log-gm");
          gameInput.disabled = false;
          gameInput.focus();
        };
        giftPrompt();
      }
      else if (state.phase === "DATING_GIFT") {
        state.datingGift = val;
        addLogTypewriter(`> Packing your bags and heading out...`, "log-system", 15);
        state.phase = "DATING_GENERATING"; // lock input
        callObstacleMaster();
      }
      else if (state.phase === "DATING_OBSTACLE") {
        if (val.trim().toUpperCase() === state.obstacleTarget) {
          handleObstacleSuccess();
        } else {
          setPersistentPrompt(`> FAILED! Type '${state.obstacleTarget}'!`, "log-error");
        }
      }
      else if (state.phase === "DATING_HANGOUT_VENUE") {
        state.weddingVenue = val;
        state.phase = "DATING_HANGOUT_SNACK";
        const ringPrompt = async () => {
          gameInput.disabled = true;
          setPersistentPrompt(`> What weird snack do you grab?`, "log-gm");
          gameInput.disabled = false;
          gameInput.focus();
        };
        ringPrompt();
      }
      else if (state.phase === "DATING_HANGOUT_SNACK") {
        state.weddingRing = val;
        state.phase = "DATING_GENERATING"; // lock input
        const packageMsg = `We are hanging out at ${state.weddingVenue} and I brought ${state.weddingRing} to snack on.`;
        callDatingMaster(packageMsg);
      }
      else if (state.phase === "DATING_WEDDING_VENUE") {
        state.weddingVenue = val;
        state.phase = "DATING_WEDDING_RING";
        const ringPrompt = async () => {
          gameInput.disabled = true;
          setPersistentPrompt(`> What kind of bizarre ring do you present them with?`, "log-gm");
          gameInput.disabled = false;
          gameInput.focus();
        };
        ringPrompt();
      }
      else if (state.phase === "DATING_WEDDING_RING") {
        state.weddingRing = val;
        state.phase = "DATING_GENERATING"; // lock input
        const packageMsg = `We are getting married at ${state.weddingVenue} and I got you a ${state.weddingRing}.`;
        callDatingMaster(packageMsg);
      }
      else if (state.phase === "DATING_FINISHED") {
        finishDating();
      }
      else if (state.phase === "LEADERBOARD_PROMPT") {
        if (val.toLowerCase() === 'no') {
          addLog(`Type a complaint to management, or type RESTART to play again.`, "log-gm");
          state.phase = "COMPLAINT";
        } else {
          saveToLeaderboard(val);
        }
      }
      else if (state.phase === "COMPLAINT") {
        if (val.toLowerCase() === 'restart') {
          resetGame();
        } else {
          addLog(`> Your complaint has been sent to the shredder.`, "log-system");
          addLog(`> Restarting...`, "log-system");
          gameInput.disabled = true;
          setTimeout(() => resetGame(), 2000);
        }
      }
    }
  });

  const btnSubmit = document.getElementById('btn-submit');
  if (btnSubmit) {
    btnSubmit.addEventListener('click', () => {
      const e = new KeyboardEvent('keypress', { key: 'Enter' });
      gameInput.dispatchEvent(e);
      gameInput.focus();
    });
  }

  gameInput.addEventListener('input', () => {
    let lowerVal = gameInput.value.toLowerCase().trim();
    if (state.phase === "LEDGER") {
      if (lowerVal === "i'm ace" || lowerVal === "im ace" || lowerVal === "ace" || lowerVal === "i'm aro" || lowerVal === "im aro" || lowerVal === "aro") {
         const e = new KeyboardEvent('keypress', { key: 'Enter' });
         gameInput.dispatchEvent(e);
      } else if (['1','2','3','4','5'].includes(lowerVal)) {
         const e = new KeyboardEvent('keypress', { key: 'Enter' });
         gameInput.dispatchEvent(e);
      }
    } else if (state.phase === "TRUE_LOVE_PROMPT") {
      if (lowerVal === "i'm ace" || lowerVal === "im ace" || lowerVal === "ace" || lowerVal === "i'm aro" || lowerVal === "im aro" || lowerVal === "aro") {
         const e = new KeyboardEvent('keypress', { key: 'Enter' });
         gameInput.dispatchEvent(e);
      }
    }
    if (state.phase === "DATING_OBSTACLE") {
      if (gameInput.value.trim().toUpperCase() === state.obstacleTarget) {
        handleObstacleSuccess();
      }
    } else if (state.phase === "CHECKOUT_COUPON") {
      if (gameInput.value.trim().toUpperCase() === state.couponTarget.toUpperCase()) {
        handleCouponSuccess();
      }
    } else if (state.phase === "CHECKOUT_BAG") {
      if (gameInput.value.trim().toUpperCase() === "BAG") {
        handleBagSuccess();
      }
    } else if (state.phase === "CHECKOUT_BARCODE") {
      let val = gameInput.value.toUpperCase();
      
      // Allow instant win (for copy paste or full typing)
      if (val === state.barcodeTarget) {
        state.barcodeCurrent = state.barcodeTarget;
        gameInput.value = state.barcodeCurrent;
        playScannerBeep();
        handleBarcodeSuccess();
        return;
      }

      // Reconstruct what the user has correctly typed by isolating digits
      let userDigits = val.replace(/[^0-9]/g, '');
      let targetDigits = state.barcodeTarget.replace(/[^0-9]/g, '');

      let isCorrectSoFar = true;
      for (let i = 0; i < userDigits.length; i++) {
        if (userDigits[i] !== targetDigits[i]) {
          isCorrectSoFar = false;
          break;
        }
      }

      let currentCleanLength = state.barcodeCurrent.replace(/[^0-9]/g, '').length;

      if (isCorrectSoFar) {
         // Reconstruct the masked barcode using the target template
         let masked = "";
         let digitIndex = 0;
         for (let i = 0; i < state.barcodeTarget.length; i++) {
           if (state.barcodeTarget[i] === '-') {
             masked += '-';
           } else {
             if (digitIndex < userDigits.length) {
               masked += userDigits[digitIndex];
               digitIndex++;
             } else {
               masked += 'X';
             }
           }
         }
         
         if (userDigits.length > currentCleanLength) {
            playScannerBeep();
         }
         state.barcodeCurrent = masked;
         gameInput.value = state.barcodeCurrent;
         
         if (!state.barcodeCurrent.includes('X')) {
            handleBarcodeSuccess();
         }
      } else {
         // Wrong character typed
         playSadBeep();
         gameInput.classList.add('shake');
         setTimeout(() => gameInput.classList.remove('shake'), 200);
         gameInput.value = state.barcodeCurrent; // reject change
      }
    }
  });

  // Leaderboard Button
  const btnLeaderboard = document.getElementById('btn-leaderboard');
  const btnCloseLeaderboard = document.getElementById('btn-close-leaderboard');
  const modalLeaderboard = document.getElementById('leaderboard-modal');
  const contentLeaderboard = document.getElementById('leaderboard-content');

  let cachedLeaderboardScores = [];
  let visibleLeaderboardCount = 10;

  function renderLeaderboard() {
    const myId = localStorage.getItem('myGroceryHighScoreId');
    const topScores = cachedLeaderboardScores.slice(0, visibleLeaderboardCount);
    let myScoreInTop = false;

    let html = `
    <style>
      .lb-table { width:100%; text-align:left; border-collapse:collapse; table-layout:fixed; }
      .lb-th { padding:0.5rem; border-bottom:1px solid gold; color:gold; }
      .lb-td { padding:0.5rem; }
      
      @media (max-width: 600px) {
        .lb-table, .lb-table tbody, .lb-table tr, .lb-table td { display: block; width: 100%; box-sizing: border-box; }
        .lb-table thead { display: none; }
        .lb-table tr { padding-bottom: 1rem; border-bottom: 1px solid #555 !important; margin-bottom: 1rem; display: flex; flex-wrap: wrap; align-items: center; }
        .lb-td-rank { width: 15%; font-size: 1.5rem !important; }
        .lb-td-photo { width: 25%; }
        .lb-td-name { width: 35%; color: #fff; word-break: break-all; }
        .lb-td-score { width: 25%; color: #33ff33; text-align: right; }
        .lb-td-partner { width: 100%; color: #ff7eb3; line-height: 1.2; margin-top: 0.5rem; border-top: 1px dashed #444; padding-top: 0.5rem !important; }
      }
    </style>
    <table class="lb-table">
      <thead>
        <tr>
          <th class="lb-th" style="width:10%;">Rank</th>
          <th class="lb-th" style="width:15%;">Photo</th>
          <th class="lb-th" style="width:25%;">Name</th>
          <th class="lb-th" style="width:40%;">Partner</th>
          <th class="lb-th" style="width:10%;">Score</th>
        </tr>
      </thead>
      <tbody>
    `;

    topScores.forEach((s, idx) => {
      if (s.id === myId) myScoreInTop = true;
      const nameHtml = s.id === myId ? `${s.name.substring(0,20)} <span class="heart-pulse">💕 That's You!</span>` : s.name.substring(0,20);
      
      html += `
        <tr style="border-bottom:1px solid #333;">
          <td class="lb-td lb-td-rank" style="font-size:1.5rem;">#${idx+1}</td>
          <td class="lb-td lb-td-photo"><img src="${s.imageUrl}" class="leaderboard-thumbnail" data-fullsrc="${s.imageUrl}" style="width:50px; height:50px; object-fit:cover; border:1px solid gold; border-radius:5px; cursor:pointer;" /></td>
          <td class="lb-td lb-td-name" style="color:#fff; word-break: break-all;">${nameHtml}</td>
          <td class="lb-td lb-td-partner" style="color:#ff7eb3; line-height:1.2;">${s.customer}</td>
          <td class="lb-td lb-td-score" style="color:#33ff33;">${s.score}</td>
        </tr>
      `;
    });

    if (myId && !myScoreInTop) {
      const myScore = cachedLeaderboardScores.find(s => s.id === myId);
      if (myScore) {
        let myIdx = cachedLeaderboardScores.findIndex(s => s.id === myId);
        let displayRank = myIdx > -1 ? `#${myIdx+1}` : `#-`;
        
        html += `
            <tr style="border-bottom: none; opacity: 0.7;">
              <td colspan="5" style="text-align:center; padding:1rem; color:gold; font-size:1.5rem; letter-spacing:5px;">â‰€â‰€â‰€â‰€â‰€â‰€â‰€</td>
            </tr>
            <tr style="border-bottom:1px solid #333;">
              <td class="lb-td lb-td-rank" style="font-size:1.5rem;">${displayRank}</td>
              <td class="lb-td lb-td-photo"><img src="${myScore.imageUrl}" class="leaderboard-thumbnail" data-fullsrc="${myScore.imageUrl}" style="width:50px; height:50px; object-fit:cover; border:1px solid gold; border-radius:5px; cursor:pointer;" /></td>
              <td class="lb-td lb-td-name" style="color:#fff; word-break: break-all;">${myScore.name.substring(0,20)} <br><span class="heart-pulse" style="margin:0;">💕 That's You!</span></td>
              <td class="lb-td lb-td-partner" style="color:#ff7eb3; line-height:1.2;">${myScore.customer}</td>
              <td class="lb-td lb-td-score" style="color:#33ff33;">${myScore.score}</td>
            </tr>
        `;
      }
    }

    html += '</tbody></table>';

    if (visibleLeaderboardCount < cachedLeaderboardScores.length) {
      html += `<div style="text-align:center; margin-top:2rem;"><button id="btn-load-more" style="background:transparent; border:2px solid gold; color:gold; padding:0.5rem 1rem; font-family:'VT323', monospace; font-size:1.2rem; cursor:pointer; transition:all 0.2s;">LOAD MORE</button></div>`;
    }

    contentLeaderboard.innerHTML = html;

    document.querySelectorAll('.leaderboard-thumbnail').forEach(img => {
      img.addEventListener('click', (e) => {
        const fullSrc = e.target.getAttribute('data-fullsrc');
        document.getElementById('image-modal-img').src = fullSrc;
        document.getElementById('image-modal').style.display = 'flex';
      });
    });

    const btnLoadMore = document.getElementById('btn-load-more');
    if (btnLoadMore) {
      btnLoadMore.addEventListener('click', () => {
        visibleLeaderboardCount = Math.min(cachedLeaderboardScores.length, visibleLeaderboardCount + 10);
        renderLeaderboard();
      });
    }
  }

  if (btnLeaderboard && modalLeaderboard) {
    btnLeaderboard.addEventListener('click', async (e) => {
      e.preventDefault();
      modalLeaderboard.style.display = 'flex';
      contentLeaderboard.innerHTML = '<div style="text-align:center; padding:2rem;"><i class="fa-solid fa-spinner fa-spin"></i> Loading legends...</div>';
      
      if (!window.FirebaseAPI) {
        contentLeaderboard.innerHTML = '<div style="color:red; text-align:center;">Firebase not loaded yet.</div>';
        return;
      }

      try {
        const { db, ref, get, query, orderByChild, limitToLast } = window.FirebaseAPI;
        const lbQuery = query(ref(db, 'leaderboard'), orderByChild('score'), limitToLast(50));
        const snapshot = await get(lbQuery);
        
        if (!snapshot.exists()) {
          contentLeaderboard.innerHTML = '<div style="text-align:center;">No romances recorded yet!</div>';
          return;
        }

        const scores = [];
        snapshot.forEach((child) => { 
          const val = child.val();
          val.id = child.key;
          scores.push(val); 
        });
        scores.sort((a, b) => b.score - a.score);
        cachedLeaderboardScores = scores;

        const myId = localStorage.getItem('myGroceryHighScoreId');
        if (myId && !cachedLeaderboardScores.find(s => s.id === myId)) {
          const mySnap = await get(ref(db, `leaderboard/${myId}`));
          if (mySnap.exists()) {
            const myVal = mySnap.val();
            myVal.id = mySnap.key;
            cachedLeaderboardScores.push(myVal); 
          }
        }

        visibleLeaderboardCount = 10;
        renderLeaderboard();

      } catch (err) {
        console.error(err);
        contentLeaderboard.innerHTML = `<div style="color:red; text-align:center;">Error loading scores: ${err.message}</div>`;
      }
    });

    btnCloseLeaderboard.addEventListener('click', () => {
      modalLeaderboard.style.display = 'none';
    });

    modalLeaderboard.addEventListener('click', (e) => {
      if (e.target === modalLeaderboard) {
        modalLeaderboard.style.display = 'none';
      }
    });
  }

  // Image Modal Logic
  const imageModal = document.getElementById('image-modal');
  const btnCloseImage = document.getElementById('btn-close-image');
  const imageModalContent = document.getElementById('image-modal-content');

  if (imageModal) {
    imageModal.addEventListener('click', (e) => {
      // Close if they click the background, but not the image itself
      if (e.target === imageModal) {
        imageModal.style.display = 'none';
      }
    });
    btnCloseImage.addEventListener('click', () => {
      imageModal.style.display = 'none';
    });
  }

  // Global Auto-Focus Logic
  document.addEventListener('click', (e) => {
    // If they aren't clicking on a button, link, or inside a modal, refocus input
    if (e.target.tagName !== 'BUTTON' 
        && e.target.tagName !== 'A' 
        && !e.target.closest('header')
        && !e.target.closest('.mobile-nav-overlay')
        && !e.target.closest('#leaderboard-modal')
        && !e.target.closest('#image-modal')
        && !e.target.classList.contains('leaderboard-thumbnail')) {
      gameInput.focus();
    }
  });

  init();

  


  // Advanced Virtual Keyboard Logic (Fast-tap & Long-press)
  const virtualKeys = document.querySelectorAll('.kb-key');
  let pressTimer = null;
  let isLongPress = false;
  
  const handleKeyInput = (keyVal) => {
    if (gameInput.disabled) return;
    if (keyVal === 'ENTER') {
      const evt = new KeyboardEvent('keypress', { key: 'Enter' });
      gameInput.dispatchEvent(evt);
    } else if (keyVal === 'DEL') {
      gameInput.value = gameInput.value.slice(0, -1);
      gameInput.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (keyVal === 'SPACE') {
      gameInput.value += ' ';
      gameInput.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (keyVal === 'ALT') {
      const mainKb = document.getElementById('mobile-keyboard-main');
      const altKb = document.getElementById('mobile-keyboard-alt');
      if (mainKb.style.display === 'none') {
        mainKb.style.display = 'flex';
        altKb.style.display = 'none';
      } else {
        mainKb.style.display = 'none';
        altKb.style.display = 'flex';
      }
    } else {
      gameInput.value += keyVal;
      gameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    gameInput.scrollLeft = gameInput.scrollWidth;
  };

  virtualKeys.forEach(btn => {
    // We use pointer events for responsive touch without 300ms delay
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault(); // Prevents mouse emulation and focus loss
      if (gameInput.disabled) return;
      
      btn.classList.add('active-key');
      isLongPress = false;
      
      const altChar = btn.getAttribute('data-alt');
      if (altChar) {
        pressTimer = setTimeout(() => {
          isLongPress = true;
          handleKeyInput(altChar);
        }, 400); // 400ms threshold for long press
      }
    });

    const triggerUp = (e) => {
      e.preventDefault();
      btn.classList.remove('active-key');
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      if (!isLongPress && !gameInput.disabled) {
        const keyVal = btn.getAttribute('data-key') || btn.textContent;
        handleKeyInput(keyVal);
      }
      isLongPress = false;
    };

    btn.addEventListener('pointerup', triggerUp);
    btn.addEventListener('pointerleave', (e) => {
      btn.classList.remove('active-key');
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    });
    // Prevent default touchstart to stop zooming or native context menus
    btn.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  });

});
