/**
 * ASCII Portrait Module
 * Handles Webcam capture, Image Upload, Image Processing (Exposure, Contrast, Dehaze, Tone Curve),
 * and ASCII conversion.
 */

document.addEventListener('DOMContentLoaded', () => {
  const btnCam = document.getElementById('btn-ascii-cam');
  if(!btnCam) return;
  const fileUpload = document.getElementById('ascii-upload');
  const video = document.getElementById('ascii-video');
  const hiddenCanvas = document.getElementById('ascii-hidden-canvas');
  const hiddenCtx = hiddenCanvas.getContext('2d', { willReadFrequently: true });
  const pre = document.getElementById('ascii-pre');
  const webcamModal = document.getElementById('ascii-webcam-modal');
  const btnSnap = document.getElementById('btn-ascii-snap');
  const btnCancelCam = document.getElementById('btn-ascii-cancel-cam');
  
  // Controls
  const expSlider = document.getElementById('ascii-exposure');
  const contSlider = document.getElementById('ascii-contrast');
  const dehazeSlider = document.getElementById('ascii-dehaze');
  const densitySlider = document.getElementById('ascii-density');
  const curveCanvas = document.getElementById('ascii-curve-canvas');
  const curveCtx = curveCanvas.getContext('2d');

  // State
  let stream = null;
  let sourceImage = null; // Can be an Image object or a captured frame
  let isMobile = window.innerWidth <= 768;
  
  // ASCII Chars sorted by density (light to dark source mapping for dark UI)
  const asciiChars = " .:-=+*#%@";
  
  // Tone Curve State
  // Points are {x, y} in 0-1 space.
  let curvePoints = [
    {x: 0.0, y: 0.0},
    {x: 0.25, y: 0.25},
    {x: 0.5, y: 0.5},
    {x: 0.75, y: 0.75},
    {x: 1.0, y: 1.0}
  ];
  let draggingPoint = null;

  // ---------------------------------------------------------
  // 1. TONE CURVE UI
  // ---------------------------------------------------------
  function drawCurve() {
    const w = curveCanvas.width;
    const h = curveCanvas.height;
    
    curveCtx.clearRect(0, 0, w, h);
    
    // Draw Grid
    curveCtx.strokeStyle = '#333';
    curveCtx.lineWidth = 1;
    for(let i = 1; i < 4; i++) {
      curveCtx.beginPath(); curveCtx.moveTo(w * i/4, 0); curveCtx.lineTo(w * i/4, h); curveCtx.stroke();
      curveCtx.beginPath(); curveCtx.moveTo(0, h * i/4); curveCtx.lineTo(w, h * i/4); curveCtx.stroke();
    }

    // Draw Line
    curveCtx.beginPath();
    curveCtx.moveTo(curvePoints[0].x * w, h - (curvePoints[0].y * h));
    for (let i = 1; i < curvePoints.length; i++) {
      curveCtx.lineTo(curvePoints[i].x * w, h - (curvePoints[i].y * h));
    }
    curveCtx.strokeStyle = '#ff7eb3';
    curveCtx.lineWidth = 2;
    curveCtx.stroke();

    // Draw Points
    curveCtx.fillStyle = '#fff';
    curvePoints.forEach(p => {
      curveCtx.beginPath();
      curveCtx.arc(p.x * w, h - (p.y * h), 4, 0, Math.PI*2);
      curveCtx.fill();
    });
  }

  // Very simple interpolation for the curve
  function getCurveY(x) {
    if (x <= curvePoints[0].x) return curvePoints[0].y;
    if (x >= curvePoints[4].x) return curvePoints[4].y;
    
    for (let i = 0; i < 4; i++) {
      let p1 = curvePoints[i];
      let p2 = curvePoints[i+1];
      if (x >= p1.x && x <= p2.x) {
        let t = (x - p1.x) / (p2.x - p1.x);
        return p1.y + t * (p2.y - p1.y); // Linear for now for performance
      }
    }
    return x;
  }

  // Curve Interactions
  function getMousePos(e) {
    const rect = curveCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) / rect.width,
      y: 1.0 - ((clientY - rect.top) / rect.height)
    };
  }

  function onCurveDown(e) {
    const pos = getMousePos(e);
    // Find closest point
    let minDist = 0.1;
    draggingPoint = null;
    curvePoints.forEach(p => {
      let dist = Math.hypot(p.x - pos.x, p.y - pos.y);
      if (dist < minDist) {
        minDist = dist;
        draggingPoint = p;
      }
    });
  }

  function onCurveMove(e) {
    if (!draggingPoint) return;
    e.preventDefault();
    const pos = getMousePos(e);
    draggingPoint.y = Math.max(0, Math.min(1, pos.y));
    drawCurve();
    processImage();
  }

  function onCurveUp() {
    draggingPoint = null;
  }

  curveCanvas.addEventListener('mousedown', onCurveDown);
  curveCanvas.addEventListener('mousemove', onCurveMove);
  window.addEventListener('mouseup', onCurveUp);
  curveCanvas.addEventListener('touchstart', onCurveDown, {passive: false});
  curveCanvas.addEventListener('touchmove', onCurveMove, {passive: false});
  window.addEventListener('touchend', onCurveUp);

  drawCurve();

  // ---------------------------------------------------------
  // 2. INPUT CAPTURE
  // ---------------------------------------------------------
  btnCam.addEventListener('click', async () => {
    // Start webcam
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      video.srcObject = stream;
      if (webcamModal) webcamModal.style.display = 'flex';
    } catch (err) {
      alert('Webcam access denied or unavailable.');
    }
  });

  if (btnSnap) {
    btnSnap.addEventListener('click', () => {
      captureFrame();
      stopWebcam();
    });
  }

  if (btnCancelCam) {
    btnCancelCam.addEventListener('click', () => {
      stopWebcam();
    });
  }

  function stopWebcam() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    if (webcamModal) webcamModal.style.display = 'none';
  }
  window.stopAsciiWebcam = stopWebcam;

  fileUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large! Max 5MB.");
      return;
    }
    stopWebcam();
    window.lastAsciiFileName = file.name.replace(/\.[^/.]+$/, "");
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        sourceImage = img;
        processImage();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  function captureFrame() {
    if (!video.videoWidth) return;
    window.lastAsciiFileName = "Webcam Capture";
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const img = new Image();
    img.onload = () => {
      sourceImage = img;
      processImage();
    };
    img.src = canvas.toDataURL('image/jpeg');
  }

  // ---------------------------------------------------------
  // 3. IMAGE PROCESSING & ASCII
  // ---------------------------------------------------------
  function processImage() {
    if (!sourceImage) return;

    isMobile = window.innerWidth <= 768;
    
    // Calculate ASCII resolution based on density slider
    const container = document.querySelector('.ascii-output-container');
    const containerW = container.clientWidth - 20; // account for padding
    
    // Density slider: 1.0 = small font (dense), 0.0 = huge font (chunky)
    const density = parseFloat(densitySlider.value); // 0.0 to 1.0
    const minFontSize = isMobile ? 4 : 6;
    const maxFontSize = 32;
    const fontSize = Math.max(minFontSize, Math.floor(maxFontSize - (maxFontSize - minFontSize) * density));
    const fontWidth = fontSize * 0.6;
    
    // We want the text block to fill the container width, and have a standard landscape aspect ratio
    const boxW = containerW;
    const boxH = boxW * 0.66; // 3:2 aspect ratio everywhere
    
    // Target characters per line, and total lines
    const targetW = Math.max(10, Math.floor(boxW / fontWidth));
    const targetH = Math.max(10, Math.floor(boxH / fontSize));

    // Aspect ratio covering (Crop original image to fill the text block's visual aspect ratio)
    const imgAspect = sourceImage.width / sourceImage.height;
    const boxAspect = boxW / boxH;
    
    let drawW, drawH, offsetX = 0, offsetY = 0;

    if (imgAspect > boxAspect) {
      // Image is wider
      drawH = targetH;
      drawW = sourceImage.width * (targetH / sourceImage.height);
      offsetX = (targetW - drawW) / 2;
    } else {
      // Image is taller
      drawW = targetW;
      drawH = sourceImage.height * (targetW / sourceImage.width);
      offsetY = (targetH - drawH) / 2;
    }

    hiddenCanvas.width = targetW;
    hiddenCanvas.height = targetH;
    
    // Draw and crop
    hiddenCtx.fillStyle = '#000';
    hiddenCtx.fillRect(0, 0, targetW, targetH);
    hiddenCtx.drawImage(sourceImage, offsetX, offsetY, drawW, drawH);

    // Get pixels
    const imgData = hiddenCtx.getImageData(0, 0, targetW, targetH);
    const data = imgData.data;

    // Parameters
    const exposure = parseFloat(expSlider.value); // -1 to 1
    const contrast = parseFloat(contSlider.value); // -1 to 1
    const dehaze = parseFloat(dehazeSlider.value); // 0 to 1
    
    const contrastFactor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

    let asciiStr = "";
    
    for (let y = 0; y < targetH; y++) {
      for (let x = 0; x < targetW; x++) {
        const i = (Math.floor(y) * Math.floor(targetW) + Math.floor(x)) * 4;
        
        let r = data[i];
        let g = data[i+1];
        let b = data[i+2];

        // 1. Dehaze (Simple black point shift & saturation)
        if (dehaze > 0) {
          const bp = dehaze * 50; // shift black point
          r = Math.max(0, r - bp) * (1 + dehaze);
          g = Math.max(0, g - bp) * (1 + dehaze);
          b = Math.max(0, b - bp) * (1 + dehaze);
        }

        // 2. Exposure
        const expMult = Math.pow(2, exposure);
        r *= expMult; g *= expMult; b *= expMult;

        // 3. Contrast
        r = contrastFactor * (r - 128) + 128;
        g = contrastFactor * (g - 128) + 128;
        b = contrastFactor * (b - 128) + 128;

        // Luminance
        let lum = (0.299*r + 0.587*g + 0.114*b) / 255;
        lum = Math.max(0, Math.min(1, lum));

        // 4. Tone Curve
        lum = getCurveY(lum);

        // Map to Char
        const charIdx = Math.floor(lum * (asciiChars.length - 1));
        asciiStr += asciiChars[charIdx] || ' ';
      }
      asciiStr += "\n";
    }

    pre.textContent = asciiStr;
    pre.style.fontSize = `${fontSize}px`;
    pre.style.lineHeight = `${fontSize}px`;
  }

  // Update on slider change
  [expSlider, contSlider, dehazeSlider, densitySlider].forEach(slider => {
    slider.addEventListener('input', processImage);
  });
  
  window.addEventListener('resize', () => {
    if(sourceImage) processImage();
  });

  // ---------------------------------------------------------
  // 4. ACTION BUTTONS
  // ---------------------------------------------------------
  const btnResetCurve = document.getElementById('btn-ascii-reset-curve');
  const btnResetSliders = document.getElementById('btn-ascii-reset-sliders');
  const btnDownload = document.getElementById('btn-ascii-download');

  if (btnResetCurve) {
    btnResetCurve.addEventListener('click', () => {
      curvePoints = [
        {x: 0.0, y: 0.0},
        {x: 0.25, y: 0.25},
        {x: 0.5, y: 0.5},
        {x: 0.75, y: 0.75},
        {x: 1.0, y: 1.0}
      ];
      drawCurve();
      if(sourceImage) processImage();
    });
  }

  if (btnResetSliders) {
    btnResetSliders.addEventListener('click', () => {
      expSlider.value = 0;
      contSlider.value = 0;
      dehazeSlider.value = 0;
      densitySlider.value = 1;
      if(sourceImage) processImage();
    });
  }

  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      if (!sourceImage || !pre.textContent) return;
      
      const exportCanvas = document.createElement('canvas');
      const ctx = exportCanvas.getContext('2d');
      // Trim end to remove the trailing newline which causes an extra blank line at the bottom
      const lines = pre.textContent.trimEnd().split('\n');
      
      const fontSize = parseFloat(pre.style.fontSize) || (isMobile ? 6 : 8);
      
      // Set font first to measure accurately
      ctx.font = `${fontSize}px monospace`;
      const textWidth = ctx.measureText(lines[0]).width;
      
      exportCanvas.width = Math.ceil(textWidth);
      exportCanvas.height = Math.ceil(lines.length * fontSize);
      
      // Context settings reset when canvas is resized, so reapply them
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      ctx.fillStyle = '#ff7eb3';
      ctx.font = `${fontSize}px monospace`;
      ctx.textBaseline = 'top';
      
      lines.forEach((line, i) => {
        ctx.fillText(line, 0, i * fontSize);
      });
      
      const link = document.createElement('a');
      const date = new Date();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const y = date.getFullYear();
      
      const prefix = window.lastAsciiFileName || "Webcam Capture";
      link.download = `${prefix} ASCII Portrait ${m}${d}${y}.png`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();
    });
  }

});
