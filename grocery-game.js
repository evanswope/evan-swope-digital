document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
  const logArea = document.getElementById('log-area');
  const gameInput = document.getElementById('game-input');
  
  const statLevel = document.getElementById('stat-level');
  const statCash = document.getElementById('stat-cash');
  const statTrust = document.getElementById('stat-trust');
  const statPop = document.getElementById('stat-pop');
  const statAffection = document.getElementById('stat-affection');

  const itemImage = document.getElementById('item-image');
  const loadingOverlay = document.getElementById('loading-overlay');
  const scannerStatus = document.getElementById('scanner-status');

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
    isTrueLove: false
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
      isTrueLove: false
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
    
    for (let i = 0; i < text.length; i++) {
      p.textContent += text[i];
      logArea.scrollTop = logArea.scrollHeight;
      // Skip wait on spaces for slight speedup
      if (text[i] !== ' ') {
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
      const [succBuf, failBuf] = await Promise.all([
        succRes.arrayBuffer(),
        failRes.arrayBuffer()
      ]);
      sfxBuffers.success = await audioCtx.decodeAudioData(succBuf);
      sfxBuffers.fail = await audioCtx.decodeAudioData(failBuf);
    } catch (e) {
      console.warn("Could not preload SFX buffers", e);
    }
  }

  function playSFX(type) {
    if (!audioCtx || !sfxBuffers[type]) return;
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const source = audioCtx.createBufferSource();
      source.buffer = sfxBuffers[type];
      source.connect(audioCtx.destination);
      source.start();
    } catch (e) {
      console.warn(`Failed to play ${type} SFX`, e);
    }
  }

  function playScannerBeep() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const masterGain = audioCtx.createGain();
      masterGain.connect(audioCtx.destination);
      masterGain.gain.value = 0.3; // keep it subtle

      const osc = audioCtx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1750, audioCtx.currentTime);

      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0, audioCtx.currentTime);
      env.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.02);
      env.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

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

  // Web Audio Drumroll Synthesis
  let drumrollBuffer = null;
  function playDrumroll() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      // Create the buffer once and cache it
      if (!drumrollBuffer) {
        const sampleRate = audioCtx.sampleRate;
        const hitsPerSecond = 24; // Fast snare roll
        const length = sampleRate * 1; // 1 second loop
        drumrollBuffer = audioCtx.createBuffer(1, length, sampleRate);
        const data = drumrollBuffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
          const hitPhase = (i / sampleRate) * hitsPerSecond % 1.0;
          // Sharp attack, fast decay for a snappy snare
          const env = Math.exp(-hitPhase * 25);
          // Bright noise
          const noise = (Math.random() * 2 - 1);
          // Tone (snare fundamental around 180Hz)
          const tone = Math.sin(2 * Math.PI * 180 * (i / sampleRate)) * Math.exp(-hitPhase * 30);
          
          data[i] = (noise * 0.7 + tone * 0.3) * env;
        }
      }

      const source = audioCtx.createBufferSource();
      source.buffer = drumrollBuffer;
      source.loop = true;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 300; // Cut low mud

      const masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.6, audioCtx.currentTime);
      // Ramp down slightly for anticipation
      masterGain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 4);
      
      source.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(audioCtx.destination);

      source.start();

      return {
        stop: () => {
          masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
          masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
          // Quick fade out
          masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.05);
          setTimeout(() => {
            try { source.stop(); } catch(e){}
          }, 60);
        }
      };
    } catch (e) {
      console.error("Drumroll err", e);
      return { stop: () => {} };
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
          body: JSON.stringify({ state })
        });
      }

      state.currentCustomerName = data.name || "A Mysterious Entity";
      state.currentCustomerDesc = data.desc || data.dialogue;
      state.currentCustomerRequest = data.base_item;
      state.currentCustomerNeed = data.emotional_need;
      
      // Start image generation in the background!
      let portraitPrompt = `A surreal portrait of ${state.currentCustomerDesc} standing at a grocery store checkout counter. Cinematic, vibrant.`;
      generateCharacterImage(portraitPrompt);

      // Use typewriter effect to buy time while image generates
      if (data.flavor_text) {
        await addLogTypewriter(`> ${data.flavor_text}`, "log-system", 15);
      }
      
      await addLogTypewriter(`[${state.currentCustomerName.toUpperCase()}] ${data.dialogue}`, "log-customer", 20);
      state.conversationHistory.push({ role: 'assistant', content: data.dialogue });

      await addLogTypewriter(`> Customer Wants: ${data.base_item.toUpperCase()}`, "log-system", 10);
      await addLogTypewriter(`> With: ${data.emotional_need}`, "log-system", 10);
      await addLogTypewriter(`> What grocery item do you slide across the scanner?`, "log-gm", 10);

      state.phase = "WAITING_FOR_USER";
      gameInput.disabled = false;
      gameInput.focus();

    } catch (e) {
      addLog(`Error: ${e.message}`, "log-error");
      gameInput.disabled = false;
      state.phase = "START";
    }
  }

  // Phase: Generate Image
  async function generateImage(prompt, isDating = false, fullPromptOverride = null) {
    const originalPhase = state.phase;
    state.phase = isDating ? "DATING_GENERATING" : "GENERATING";
    gameInput.disabled = true;
    
    itemImage.onload = null;
    itemImage.onerror = null;
    
    itemImage.style.opacity = '0.3';
    loadingOverlay.style.display = 'flex';
    scannerStatus.textContent = isDating ? "VISUALIZING SCENARIO..." : "FABRICATING ITEM...";

    const noItemText = document.getElementById('no-item-text');
    if (noItemText && !isDating) {
      noItemText.innerHTML = 'SEARCHING<br>FOR PRODUCT';
      noItemText.style.display = 'block';
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

        itemImage.src = proxyUrl;
        itemImage.onload = () => {
          loadingOverlay.style.display = 'none';
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
            addLog(`> Item fabricated. Press ENTER or type "GIVE" to hand it over.`, "log-gm");
            
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
            loadingOverlay.style.display = 'none';
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
          loadingOverlay.style.display = 'none';
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

  async function generateCharacterImage(prompt) {
    // Do NOT disable game input or change phase, as this runs in parallel with text
    itemImage.onload = null;
    itemImage.onerror = null;
    itemImage.style.opacity = '0.3';
    loadingOverlay.style.display = 'flex';
    scannerStatus.textContent = "VISUALIZING ENTITY...";
    scannerStatus.style.color = "#00ffcc";

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
        let imageLoadAttempts = 0;

        return new Promise((resolve) => {
          itemImage.onload = () => {
            loadingOverlay.style.display = 'none';
            itemImage.style.opacity = '';
            itemImage.style.display = 'block';
            itemImage.classList.add('loaded');
            scannerStatus.textContent = "VISUALIZATION COMPLETE";
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
              loadingOverlay.style.display = 'none';
              scannerStatus.textContent = "IMAGE LOAD FAILED";
              scannerStatus.style.color = "#ff3333";
              resolve(false);
            }
          };

          itemImage.src = proxyUrl;
        });

      } catch (e) {
        attempt++;
      }
    }
    
    // If we exhaust attempts
    loadingOverlay.style.display = 'none';
    scannerStatus.textContent = "VISUALIZATION FAILED";
    scannerStatus.style.color = "#ff3333";
    return false;
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
      if (data.approved) {
        reactionPrompt = `A surreal painting of ${state.currentCustomerDesc} happily receiving an item. Happy, vibrant, successful, grocery store background. No other humans in frame.`;
      } else {
        reactionPrompt = `A surreal painting of ${state.currentCustomerDesc} angrily yelling and throwing a fit. Dramatic, chaotic, angry, grocery store background. No other humans in frame.`;
      }

      // AUDIO/VISUAL FLAIR: Start the drumroll and hand animation
      const handOverlay = document.getElementById('hand-overlay');
      if (handOverlay) handOverlay.style.display = 'block';
      const drumroll = playDrumroll();

      let imagePromise = generateCharacterImage(reactionPrompt);

      if (data.flavor_text) {
        await addLogTypewriter(`> ${data.flavor_text}`, "log-system", 15);
      } else {
        await addLogTypewriter(`> The clerk hands over the item.`, "log-system", 15);
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
          state.cash += data.value * 2; // Massive cash multiplier for being clever
        } else {
          addLog(`> Item sold. (+${affectionGained} Affection)`, "log-system");
        }

        state.trust = Math.min(100, state.trust + 5);
        for(let i=0; i<3; i++) setTimeout(() => spawnParticle('cash'), i*200);
        if (data.value > 1000) spawnParticle('heart');
      } else {
        scannerStatus.textContent = `REJECTED`;
        scannerStatus.style.color = "#ff3333";
        state.trust = Math.max(0, state.trust - 10);
      }

      // Save customer to ledger
      state.customersServed.push({
        id: state.level,
        name: state.currentCustomerName,
        desc: state.currentCustomerDesc,
        request: state.currentCustomerRequest,
        affectionGained: affectionGained
      });

      updateStatsUI();
      
      if (imagePromise) {
        await imagePromise;
      }

      // The image has loaded! Stop drumroll and hide hands
      drumroll.stop();
      if (handOverlay) handOverlay.style.display = 'none';

      // Play outcome sound effect
      try {
        if (data.approved) {
          playSFX('success');
        } else {
          playSFX('fail');
        }
      } catch (err) {
        console.warn(err);
      }

      // True Love instant-win condition
      if (affectionGained >= 10) {
        state.selectedCustomer = { request: state.currentCustomerRequest, desc: state.currentCustomerDesc };
        addLog(`\n===========================================`, "log-system");
        addLog(`> 💘 TRUE LOVE! 💘`, "log-system");
        addLog(`> This customer fell madly in love with you on the spot!`, "log-system");
        addLog(`> Type "I'm Ace" to just be best friends, or type anything else to go on a date right now!`, "log-gm");
        state.phase = "TRUE_LOVE_PROMPT";
        gameInput.disabled = false;
        gameInput.focus();
        return;
      }

      if (state.level >= 5) {
        updateStatsUI();
        if (data.approved) {
          addLog(`> Success! Shift completed. Type "LEDGER" to review your customers.`, "log-gm");
        } else {
          addLog(`> Too bad. Shift completed. Type "LEDGER" to review your customers.`, "log-gm");
        }
        state.phase = "WAIT_LEDGER";
        gameInput.disabled = false;
        gameInput.focus();
      } else {
        state.level++;
        updateStatsUI();
        if (data.approved) {
          addLog(`> Success! Type "NEXT" to serve the next customer.`, "log-gm");
        } else {
          addLog(`> Too bad. Type "NEXT" to serve the next customer.`, "log-gm");
        }
        state.phase = "START";
        gameInput.disabled = false;
        gameInput.focus();
      }

    } catch (e) {
      addLog(`Appraisal Error: ${e.message}`, "log-error");
      scannerStatus.textContent = "SCANNER ERROR";
      addLog(`> What grocery item do you slide across the scanner?`, "log-gm");
      state.phase = "WAITING_FOR_USER";
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

    addLog(`> Who would you like to woo? Type a number 1-5, or type "I'm Ace" to just hang out as friends.`, "log-gm");
    gameInput.disabled = false;
    gameInput.focus();
  }

  // Phase: Dating Logic
  async function callDatingMaster(userMessage) {
    state.phase = "DATING_GENERATING";
    gameInput.disabled = true;

    if (userMessage) {
      state.datingHistory.push({ role: "user", content: userMessage });
    } else {
      userMessage = "*Calls the customer on the phone*";
    }

    addLog("Waiting for response...", "log-system");

    try {
      const data = await fetchWithRetry('/api/dating-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: state.selectedCustomer,
          userMessage: userMessage,
          datingRound: state.datingRound,
          datingHistory: state.datingHistory,
          isAce: state.isAce
        })
      });

      // Trigger image generation in the background
      let imagePromise = null;
      if (data.image_prompt) {
        imagePromise = generateCharacterImage(data.image_prompt);
      }

      if (data.flavor_text) {
        await addLogTypewriter(`> ${data.flavor_text}`, "log-system", 15);
      }
      if (data.dialogue) {
        await addLogTypewriter(`[DATE] ${data.dialogue}`, "log-customer", 25);
        state.datingHistory.push({ role: "assistant", content: data.dialogue });
      }
      
      if (data.approval === 1) {
        state.datingScore++;
        spawnParticle('heart');
      }

      if (data.terminate) {
        finishDating(true);
        return;
      }

      if (state.datingRound >= 4) {
        // Round 4 is the Vow Evaluation. If we didn't terminate, we won!
        finishDating(false, data.image_prompt);
        return;
      }

      // Automatically advance round since we don't block on generateImage anymore
      state.datingRound++;
      
      if (imagePromise) {
        await imagePromise;
      }

      state.phase = "DATING_WAIT_USER";
      gameInput.disabled = false;
      gameInput.focus();

    } catch (e) {
      addLog(`Dating Error: ${e.message}`, "log-error");
      state.phase = "DATING_WAIT_USER";
      gameInput.disabled = false;
    }
  }

  async function finishDating(forceLoss = false, customWinPrompt = null) {
    state.phase = "DATING_GENERATING";
    const won = forceLoss ? false : (state.datingScore >= 2);
    
    let finalPrompt = won 
      ? (customWinPrompt || `A wildly colorful, cinematic, dramatic romantic fantasy scene showing ${state.selectedCustomer.desc} happily on a wedding date. Epic lighting, beautiful masterpiece. No humans in frame.`)
      : `A wildly dramatic, hyper-emotional cinematic shot of ${state.playerDescription} having an absolute mental breakdown. They are completely collapsed on the ground in the middle of a dimly lit grocery store aisle, sobbing uncontrollably, head in their hands, covered in extreme embarrassment and regret, throwing a fit. Lonely, depressing, Game over vibes. Masterpiece lighting.`;

    addLog(won ? "> YOU FELL IN LOVE! Generating memory..." : "> THEY HATED YOU. Generating memory...", "log-system");

    // We don't await because we just want the final image to show up
    await generateCharacterImage(finalPrompt);
    
    scannerStatus.textContent = won ? "YOU WIN!" : "GAME OVER";
    scannerStatus.style.color = won ? "#ff00ff" : "#ff3333";
    
    addLog(`\n===========================================`, "log-system");
    addLog(won ? `GAME OVER - YOU WON!` : `GAME OVER - YOU LOST!`, "log-system");
    
    if (won) {
      addLog(`> Type your name to immortalize your romance on the Leaderboard, or type "NO" to skip.`, "log-gm");
      state.phase = "LEADERBOARD_PROMPT";
    } else {
      addLog(`Type a complaint to management, or type RESTART to play again.`, "log-gm");
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

      await Promise.race([push(ref(db, 'leaderboard'), scoreData), timeoutPromise]);
      addLog("> Successfully immortalized! 🏆", "log-system");

    } catch (e) {
      console.error(e);
      addLog(`> Error saving to leaderboard: ${e.message}`, "log-error");
      addLog(`> (Memory saved locally instead!)`, "log-error");
    }
    addLog(`\nType a complaint to management, or type RESTART to play again.`, "log-gm");
    state.phase = "COMPLAINT";
    gameInput.disabled = false;
    gameInput.focus();
  }
  // Input Handler
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

      const val = gameInput.value.trim();
      
      if (!val) {
        // Allow empty enter for NEXT or GIVE
        if (state.phase === "START" && state.level > 1) {
          callGameMaster();
        } else if (state.phase === "HAND_OVER_ITEM") {
          appraiseItem(state.pendingItemUrl, state.pendingItemPrompt);
        }
        return;
      }

      gameInput.value = '';
      addLog(val, "log-user");

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
          addLog("> Welcome to your shift. Before we begin, please describe what you look like (e.g., 'a tired clerk with purple hair', 'a suave cashier wearing a tuxedo'). This will be used for your ID badge.", "log-system");
        } else if (val.toLowerCase() === 'next') {
          callGameMaster();
        } else {
          addLog("Type 'start' or 'next' to continue.", "log-system");
        }
      }
      else if (state.phase === "HAND_OVER_ITEM") {
        if (val.toLowerCase() === 'give') {
          appraiseItem(state.pendingItemUrl, state.pendingItemPrompt);
        } else {
          addLog("Press ENTER or type 'GIVE' to hand it over.", "log-system");
        }
      }
      else if (state.phase === "PLAYER_SETUP") {
        state.playerDescription = val;
        addLog("> Badge generated. Booting register...", "log-system");
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
            addLog("> Invalid choice. Pick 1-5 or 'I'm Ace'.", "log-error");
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
          addLog("Type 'ledger' to review your customers.", "log-system");
        }
      }
      else if (state.phase === "DATING_WAIT_USER") {
        callDatingMaster(val);
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

  // Leaderboard Button
  const btnLeaderboard = document.getElementById('btn-leaderboard');
  const btnCloseLeaderboard = document.getElementById('btn-close-leaderboard');
  const modalLeaderboard = document.getElementById('leaderboard-modal');
  const contentLeaderboard = document.getElementById('leaderboard-content');

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
        const { db, ref, get } = window.FirebaseAPI;
        const lbQuery = ref(db, 'leaderboard');
        const snapshot = await get(lbQuery);
        
        if (!snapshot.exists()) {
          contentLeaderboard.innerHTML = '<div style="text-align:center;">No romances recorded yet!</div>';
          return;
        }

        const scores = [];
        snapshot.forEach((child) => { scores.push(child.val()); });
        scores.sort((a, b) => b.score - a.score); // highest first
        const topScores = scores.slice(0, 10); // take top 10

        let html = '<table style="width:100%; text-align:left; border-collapse:collapse;">';
        html += '<tr style="border-bottom:1px solid gold; color:gold;"><th>Rank</th><th>Photo</th><th>Name</th><th>Partner</th><th>Score</th></tr>';
        
        topScores.forEach((s, idx) => {
          html += `
            <tr style="border-bottom:1px solid #333;">
              <td style="padding:0.5rem; font-size:1.5rem;">#${idx+1}</td>
              <td style="padding:0.5rem;"><img src="${s.imageUrl}" class="leaderboard-thumbnail" data-fullsrc="${s.imageUrl}" style="width:50px; height:50px; object-fit:cover; border:1px solid gold; border-radius:5px; cursor:pointer;" crossorigin="anonymous"/></td>
              <td style="padding:0.5rem; color:#fff;">${s.name.substring(0,20)}</td>
              <td style="padding:0.5rem; color:#ff7eb3;">${s.customer}</td>
              <td style="padding:0.5rem; color:#33ff33;">${s.score}</td>
            </tr>
          `;
        });
        html += '</table>';
        contentLeaderboard.innerHTML = html;

        // Add click listeners to thumbnails
        document.querySelectorAll('.leaderboard-thumbnail').forEach(img => {
          img.addEventListener('click', (e) => {
            const fullSrc = e.target.getAttribute('data-fullsrc');
            document.getElementById('image-modal-img').src = fullSrc;
            document.getElementById('image-modal').style.display = 'flex';
          });
        });

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
        && !e.target.closest('#leaderboard-modal')
        && !e.target.closest('#image-modal')
        && !e.target.classList.contains('leaderboard-thumbnail')) {
      gameInput.focus();
    }
  });

});
