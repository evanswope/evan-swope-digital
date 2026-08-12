document.addEventListener('DOMContentLoaded', () => {
  const btnGenerate = document.getElementById('btn-sdxl-generate');
  const promptInput = document.getElementById('sdxl-prompt');
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
      if (model === 'flux-schnell') {
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
      while (true) {
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
      resultImg.src = prediction.output[0];
      resultImg.onload = () => {
        loadingDiv.style.display = 'none';
        resultImg.style.display = 'block';
        btnDownload.style.display = 'flex';
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
