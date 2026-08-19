document.addEventListener('DOMContentLoaded', () => {
  const btnGenerate = document.getElementById('btn-sdxl-generate');
  const promptInput = document.getElementById('sdxl-prompt');
  
  if (promptInput) {
    const placeholderPrompts = [
      "A romantic candlelit dinner between a sentient block of cheddar and a lonely cracker in aisle 4, photorealistic",
      "A dramatic soap opera scene where a bottle of ketchup discovers its mustard partner has been cheating with relish",
      "A jar of pickles proposing to a cucumber in the produce section, lit by fluorescent humming lights",
      "Two cans of soup holding hands on a checkout conveyor belt, emotional, cinematic lighting",
      "A loaf of bread and a stick of butter slow dancing in the freezer aisle, romantic mist rising from the ice",
      "A heartbroken banana peeling away from an apple who didn't reciprocate its feelings",
      "A bottle of hot sauce aggressively flirting with a carton of milk, tension, grocery store background",
      "A romantic comedy poster featuring a mop and a bucket finding love in the cleaning supplies aisle",
      "A lonely bag of frozen peas finding a soulmate in a bag of frozen corn, 4k resolution",
      "Two avocados touching pits in a tender moment of connection, surreal grocery store romance",
      "A bottle of cheap wine and a block of gouda eloping in the self-checkout lane",
      "A tragic Romeo and Juliet story between a Pepsi and a Coca-Cola separated by the soda aisle divider",
      "A carton of eggs nervously asking a whisk out on a date, photorealistic macro photography",
      "A romantic picnic in the shopping cart between a box of cereal and a gallon of milk",
      "A slice of frozen pizza passionately kissing a microwave dinner under the freezer glow",
      "A bunch of grapes serenading a watermelon in the produce section, cinematic lighting",
      "A box of tissues comforting a weeping onion who just got broken up with",
      "Two toothbrushes finding love at first sight across the pharmacy aisle",
      "A jar of peanut butter and a jar of jelly finally reuniting after being stocked on different shelves",
      "A dramatic breakup between a sponge and a bottle of dish soap, rain pouring down in the sink aisle",
      "A romantic gondola ride in a spilled puddle of juice featuring two romantic strawberries",
      "A roll of paper towels rescuing a spill, falling deeply in love with the counter spray",
      "A passionate embrace between a bottle of olive oil and a bottle of balsamic vinegar",
      "A lonely potato finding true love with a sour cream tub in the baked potato section",
      "A bag of flour and a bag of sugar getting married by a priest who is a measuring cup",
      "Two coffee beans staring longingly at each other before being ground up together, romantic tragedy",
      "A romantic sunset walk across the conveyer belt by a bag of chips and a jar of salsa",
      "A bottle of shampoo and conditioner holding hands while facing their destiny at the checkout",
      "A heroic garlic clove rescuing a basil leaf from the clearance bin, romantic adventure",
      "A tub of ice cream melting from the intense romantic gaze of a bottle of chocolate syrup"
    ];
    promptInput.placeholder = placeholderPrompts[Math.floor(Math.random() * placeholderPrompts.length)];
  }
  const loadingDiv = document.getElementById('sdxl-loading');
  const resultImg = document.getElementById('sdxl-result');
  const placeholder = document.getElementById('sdxl-placeholder');
  const btnDownload = document.getElementById('btn-sdxl-download');
  
  const btnSettings = document.getElementById('btn-sdxl-settings');
  const modalSettings = document.getElementById('sdxl-settings-modal');
  const btnSettingsClose = document.getElementById('btn-sdxl-settings-close');
  const aspectSelect = document.getElementById('sdxl-aspect');
  const negativePrompt = document.getElementById('sdxl-negative');
  const stepsInput = document.getElementById('sdxl-steps');
  const stepsVal = document.getElementById('sdxl-steps-val');
  const guidanceInput = document.getElementById('sdxl-guidance');
  const guidanceVal = document.getElementById('sdxl-guidance-val');
  
  const modelSelect = document.getElementById('sdxl-model');
  const settingNegative = document.getElementById('sdxl-setting-negative');
  const settingSteps = document.getElementById('sdxl-setting-steps');
  const settingGuidance = document.getElementById('sdxl-setting-guidance');

  if (!btnGenerate) return;

  if (modelSelect) {
    modelSelect.addEventListener('change', (e) => {
      const model = e.target.value;
      if (model === 'flux-schnell' || model === 'flux-dev') {
        if (settingNegative) settingNegative.style.display = 'none';
        if (settingSteps) settingSteps.style.display = 'none';
        if (settingGuidance) settingGuidance.style.display = 'none';
      } else {
        if (settingNegative) settingNegative.style.display = 'block';
        if (settingSteps) settingSteps.style.display = 'block';
        if (settingGuidance) settingGuidance.style.display = 'block';
      }
    });
    // Trigger once to set initial state
    modelSelect.dispatchEvent(new Event('change'));
  }

  if (btnSettings && modalSettings && btnSettingsClose) {
    btnSettings.addEventListener('click', () => {
      modalSettings.style.display = 'flex';
    });
    btnSettingsClose.addEventListener('click', () => {
      modalSettings.style.display = 'none';
    });
  }

  if (stepsInput && stepsVal) {
    stepsInput.addEventListener('input', (e) => {
      stepsVal.textContent = e.target.value;
    });
  }
  if (guidanceInput && guidanceVal) {
    guidanceInput.addEventListener('input', (e) => {
      guidanceVal.textContent = e.target.value;
    });
  }

  btnGenerate.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      placeholder.style.display = 'block';
      placeholder.style.color = '#ff4d4d';
      placeholder.innerHTML = `ERROR:<br><span style="color:#aaa; font-size:0.65rem;">PLEASE ENTER A PROMPT FIRST!</span>`;
      return;
    }

    const aspect = aspectSelect ? aspectSelect.value : '1:1';
    const negPrompt = negativePrompt ? negativePrompt.value.trim() : '';
    const steps = stepsInput ? parseInt(stepsInput.value, 10) : 25;
    const guidance = guidanceInput ? parseFloat(guidanceInput.value) : 7.5;
    const modelId = modelSelect ? modelSelect.value : 'flux-schnell';
    
    let width = 1024, height = 1024;
    if (aspect === '3:2') { width = 1216; height = 832; }
    else if (aspect === '2:3') { width = 832; height = 1216; }
    else if (aspect === '16:9') { width = 1344; height = 768; }
    else if (aspect === '9:16') { width = 768; height = 1344; }

    const outputContainer = document.querySelector('.sdxl-output-container');
    if (outputContainer) {
      if (aspect === '3:2') outputContainer.style.aspectRatio = '3/2';
      else if (aspect === '2:3') outputContainer.style.aspectRatio = '2/3';
      else if (aspect === '16:9') outputContainer.style.aspectRatio = '16/9';
      else if (aspect === '9:16') outputContainer.style.aspectRatio = '9/16';
      else outputContainer.style.aspectRatio = '1/1';
    }

    // UI State: Loading
    btnGenerate.disabled = true;
    btnGenerate.style.opacity = '0.5';
    btnGenerate.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> GENERATING...';
    placeholder.style.display = 'none';
    resultImg.style.display = 'none';
    btnDownload.style.display = 'none';
    loadingDiv.style.display = 'flex';

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          model_id: modelId,
          prompt,
          negative_prompt: negPrompt,
          width,
          height,
          num_inference_steps: steps,
          guidance_scale: guidance,
          aspect_ratio: aspect
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Generation failed');
      }

      const predictionId = data.id;
      let prediction;
      
      // Poll the backend until Replicate finishes the image
      let pollCount = 0;
      while (true) {
        if (pollCount > 60) {
          throw new Error('Timeout: Replicate took too long to generate.');
        }
        pollCount++;
        await new Promise(r => setTimeout(r, 1500)); // check every 1.5s
        
        // Cache-bust the request so the browser doesn't cache the "starting" state
        const pollRes = await fetch(`/api/poll?id=${predictionId}&_t=${Date.now()}`);
        prediction = await pollRes.json();
        
        if (!pollRes.ok) {
          throw new Error(prediction.message || 'Error checking status');
        }
        
        if (prediction.status === 'succeeded') {
          break;
        } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
          const errorMessage = prediction.error ? prediction.error : 'Generation failed on Replicate.';
          throw new Error(errorMessage);
        }
        // If status is "starting" or "processing", the loop continues
      }

      // UI State: Success
      let outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      if (!outputUrl) throw new Error("Replicate returned no image URL.");
      
      resultImg.src = outputUrl;
      resultImg.onload = () => {
        loadingDiv.style.display = 'none';
        resultImg.style.display = 'block';
        btnDownload.style.display = 'flex';
      };
      resultImg.onerror = () => {
        loadingDiv.style.display = 'none';
        placeholder.style.display = 'block';
        placeholder.style.color = '#ff4d4d';
        placeholder.innerHTML = `ERROR:<br><span style="color:#aaa; font-size:0.65rem;">FAILED TO LOAD IMAGE (Check network/adblocker)</span>`;
      };

    } catch (err) {
      console.error(err);
      // UI State: Error
      loadingDiv.style.display = 'none';
      placeholder.style.display = 'block';
      placeholder.style.color = '#ff4d4d';
      placeholder.innerHTML = `ERROR GENERATING IMAGE<br><span style="color:#aaa; font-size:0.65rem;">${err.message.toUpperCase()}</span>`;
    } finally {
      btnGenerate.disabled = false;
      btnGenerate.style.opacity = '1';
      btnGenerate.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> GENERATE IMAGE';
    }
  });

  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      if (!resultImg.src) return;
      const link = document.createElement('a');
      const date = new Date();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const y = date.getFullYear();
      link.download = `AI_Generation_${m}${d}${y}.jpg`;
      
      // Replicate image URLs are CORS-enabled, so we can fetch and trigger a proper download blob
      const originalText = btnDownload.innerHTML;
      btnDownload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> SAVING...';
      
      fetch(resultImg.src)
        .then(response => response.blob())
        .then(blob => {
          const blobUrl = window.URL.createObjectURL(blob);
          link.href = blobUrl;
          link.click();
          window.URL.revokeObjectURL(blobUrl);
          btnDownload.innerHTML = originalText;
        })
        .catch(e => {
          console.error("Fallback download", e);
          link.href = resultImg.src;
          link.target = '_blank';
          link.click();
          btnDownload.innerHTML = originalText;
        });
    });
  }
});
