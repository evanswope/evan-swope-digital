document.addEventListener('DOMContentLoaded', () => {
  const btnGenerate = document.getElementById('btn-sdxl-generate');
  const promptInput = document.getElementById('sdxl-prompt');
  const loadingDiv = document.getElementById('sdxl-loading');
  const resultImg = document.getElementById('sdxl-result');
  const placeholder = document.getElementById('sdxl-placeholder');
  const btnDownload = document.getElementById('btn-sdxl-download');

  if (!btnGenerate) return;

  btnGenerate.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      alert("Please enter a prompt first!");
      return;
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
        body: JSON.stringify({ prompt })
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
        
        const pollRes = await fetch(`/api/poll?id=${predictionId}`);
        prediction = await pollRes.json();
        
        if (!pollRes.ok) {
          throw new Error(prediction.message || 'Error checking status');
        }
        
        if (prediction.status === 'succeeded') {
          break;
        } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
          throw new Error('Generation failed on Replicate.');
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
      alert('Error generating image: ' + err.message);
      // UI State: Error
      loadingDiv.style.display = 'none';
      placeholder.style.display = 'block';
      placeholder.textContent = 'ERROR GENERATING IMAGE';
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
      link.download = `SDXL_Generation_${m}${d}${y}.png`;
      
      // Replicate image URLs are CORS-enabled, so we can fetch and trigger a proper download blob
      // If we just use link.click() on a cross-origin URL, the browser often opens it in a new tab instead.
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
