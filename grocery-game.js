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
    trust: 50, // percentage
    popularity: 0,
    affection: 0,
    currentCustomerRequest: "",
    phase: "START", // START, WAITING_FOR_USER, GENERATING, APPRAISING
    conversationHistory: [] // To pass to Game Master
  };

  // Helper: Add text to log
  function addLog(text, className) {
    const p = document.createElement('p');
    p.className = `log-msg ${className}`;
    p.textContent = text;
    logArea.appendChild(p);
    logArea.scrollTop = logArea.scrollHeight;
  }

  // Helper: Floating particles
  function spawnParticle(type) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.innerHTML = type === 'heart' ? '💖' : '💵';
    p.style.left = Math.random() * 80 + 10 + '%';
    p.style.top = '60%';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 2000);
  }

  // Helper: Update UI stats
  function updateStatsUI() {
    statLevel.textContent = state.level;
    statCash.textContent = state.cash;
    statTrust.textContent = state.trust + '%';
    statPop.textContent = state.popularity;
    statAffection.textContent = state.affection;
  }

  // Phase: Call Game Master
  async function callGameMaster() {
    state.phase = "WAITING_FOR_GM";
    addLog("Waiting for customer...", "log-system");
    gameInput.disabled = true;

    try {
      const res = await fetch('/api/game-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      // GM returns: dialogue, customer_request
      addLog(`[CUSTOMER] ${data.dialogue}`, "log-customer");
      state.currentCustomerRequest = data.customer_request;
      state.conversationHistory.push({ role: 'assistant', content: data.dialogue });

      addLog(`> What do you generate for them?`, "log-gm");
      state.phase = "WAITING_FOR_USER";
      gameInput.disabled = false;
      gameInput.focus();

    } catch (e) {
      addLog(`Error: ${e.message}`, "log-error");
      gameInput.disabled = false;
      state.phase = "WAITING_FOR_USER";
    }
  }

  // Phase: Generate Image
  async function generateImage(prompt) {
    state.phase = "GENERATING";
    gameInput.disabled = true;
    itemImage.style.display = 'none';
    loadingOverlay.style.display = 'flex';
    scannerStatus.textContent = "FABRICATING ITEM...";

    // Secretly append product photography prompt
    const finalPrompt = `${prompt}, isolated on a pure white background, studio lighting, product photography`;

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_id: 'flux-schnell',
          prompt: finalPrompt,
          aspect_ratio: '1:1'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      let predictionId = data.id;
      let prediction;

      let pollCount = 0;
      while (true) {
        if (pollCount > 60) throw new Error('Timeout generating image.');
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

      itemImage.src = outputUrl;
      itemImage.onload = () => {
        loadingOverlay.style.display = 'none';
        itemImage.style.display = 'block';
        scannerStatus.textContent = "SCANNING ITEM...";
        appraiseItem(outputUrl, prompt);
      };

    } catch (e) {
      addLog(`Generation Error: ${e.message}`, "log-error");
      loadingOverlay.style.display = 'none';
      scannerStatus.textContent = "FABRICATION FAILED";
      state.phase = "WAITING_FOR_USER";
      gameInput.disabled = false;
    }
  }

  // Phase: Vision Appraisal
  async function appraiseItem(imageUrl, userPrompt) {
    state.phase = "APPRAISING";

    try {
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          customerRequest: state.currentCustomerRequest,
          userPrompt
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Vision returns: approved (boolean), value (int), reaction (string)
      addLog(`[CUSTOMER] ${data.reaction}`, "log-customer");
      
      if (data.approved) {
        scannerStatus.textContent = `APPROVED: $${data.value}`;
        scannerStatus.style.color = "#33ff33";
        state.cash += data.value;
        state.popularity += 1;
        state.affection += Math.floor(data.value / 100);
        state.trust = Math.min(100, state.trust + 5);
        for(let i=0; i<3; i++) setTimeout(() => spawnParticle('cash'), i*200);
        if (data.value > 1000) spawnParticle('heart');
      } else {
        scannerStatus.textContent = `REJECTED`;
        scannerStatus.style.color = "#ff3333";
        state.trust = Math.max(0, state.trust - 10);
      }

      state.level++;
      updateStatsUI();

      addLog(`> Shift completed. Type "NEXT" to serve the next customer.`, "log-gm");
      state.phase = "START";
      gameInput.disabled = false;
      gameInput.focus();

    } catch (e) {
      addLog(`Appraisal Error: ${e.message}`, "log-error");
      scannerStatus.textContent = "SCANNER ERROR";
      state.phase = "START";
      gameInput.disabled = false;
    }
  }

  // Input Handler
  gameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const val = gameInput.value.trim();
      if (!val) return;
      gameInput.value = '';

      addLog(val, "log-user");

      if (state.phase === "START") {
        if (val.toLowerCase() === 'start' || val.toLowerCase() === 'next') {
          callGameMaster();
        } else {
          addLog("Type 'start' or 'next' to continue.", "log-system");
        }
      } else if (state.phase === "WAITING_FOR_USER") {
        generateImage(val);
      }
    }
  });

});
