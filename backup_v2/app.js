/* ==========================================================================
   EVAN SWOPE - PORTFOLIO INTERACTION LOGIC (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // --------------------------------------------------------------------------
  // 1. BIFOCAL LENS SELECTION SWITCHER
  // --------------------------------------------------------------------------
  const body = document.body;
  const buttons = document.querySelectorAll('.lens-btn');
  const indicator = document.querySelector('.slider-indicator');
  const selectorContainer = document.querySelector('.lens-selector');
  
  // Set initial indicator position
  function initIndicator() {
    const activeBtn = document.querySelector('.lens-btn.active');
    if (activeBtn && indicator) {
      indicator.style.width = `${activeBtn.offsetWidth}px`;
      indicator.style.left = `${activeBtn.offsetLeft}px`;
    }
  }

  // Adjust indicator position on window resize
  window.addEventListener('resize', () => {
    initIndicator();
  });

  // Setup lens switching click events
  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      // Find selected lens type
      const targetLens = button.getAttribute('data-lens');
      
      // Update active classes on buttons
      buttons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Slide the background indicator pill
      if (indicator) {
        indicator.style.width = `${button.offsetWidth}px`;
        indicator.style.left = `${button.offsetLeft}px`;
      }
      
      // Morph the website theme
      // Remove previous lens classes
      body.classList.remove('lens-creative', 'lens-strategy', 'lens-hybrid');
      // Add new lens class
      body.classList.add(`lens-${targetLens}`);

      // Flip all cards depending on the lens selection
      const flipCards = document.querySelectorAll('.project-card-container');
      flipCards.forEach(card => {
        if (targetLens === 'strategy') {
          card.classList.add('is-flipped');
        } else {
          card.classList.remove('is-flipped');
        }
      });
      
      // Adjust scroll animation triggers or layout recalculation if necessary
      triggerGlowTransition(targetLens);
    });
  });

  // Run initial sizing
  setTimeout(initIndicator, 200);

  // Individual Card Flipping Logic
  const flipCards = document.querySelectorAll('.project-card-container');
  flipCards.forEach(card => {
    const flipCues = card.querySelectorAll('.flip-cue');
    flipCues.forEach(cue => {
      cue.addEventListener('click', (e) => {
        e.stopPropagation();
        card.classList.toggle('is-flipped');
      });
    });
  });

  // --------------------------------------------------------------------------
  // 2. VECTOR TRIANGLE MATRIX (VELOCITY RESPONSIVE BACKGROUND)
  // --------------------------------------------------------------------------
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  
  let triangles = [];
  const spacing = 50; // Grid column/row spacing
  let mouseX = -1000;
  let mouseY = -1000;
  let lastFrameX = -1000;
  let lastFrameY = -1000;
  let lastFrameTime = Date.now();
  
  function resizeCanvas() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    if (ctx) ctx.scale(dpr, dpr);
    
    initTriangles();
    console.log("[Portfolio Diagnostics] Canvas initialized. Width:", canvas.width, "Height:", canvas.height, "DPR:", dpr, "Nodes:", triangles.length);
  }
  
  function initTriangles() {
    triangles = [];
    const cols = Math.ceil(window.innerWidth / spacing) + 1;
    const rows = Math.ceil(window.innerHeight / spacing) + 1;
    
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        triangles.push({
          x: c * spacing + (r % 2 === 0 ? spacing / 4 : -spacing / 4), // offsets columns for hex grid layout
          y: r * spacing,
          angle: 0,
          scale: 1,
          wobble: 0,
          wobbleSpeed: 0,
          energy: 0,
          phase: Math.random() * Math.PI * 2
        });
      }
    }
  }

  // Determine active accent color depending on toggle lens (richer contrast for light mode)
  function getThemeColor(opacity) {
    if (body.classList.contains('lens-creative')) {
      return `rgba(219, 39, 119, ${opacity})`; // Rich Pink-600
    } else if (body.classList.contains('lens-strategy')) {
      return `rgba(2, 132, 199, ${opacity})`; // Rich Sky-600
    } else {
      return `rgba(124, 58, 237, ${opacity})`; // Rich Violet-600
    }
  }

  // Distance from point (px, py) to line segment (x1, y1) -> (x2, y2)
  function getDistanceToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) {
      const adx = px - x1;
      const ady = py - y1;
      return Math.sqrt(adx * adx + ady * ady);
    }
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    const pdx = px - projX;
    const pdy = py - projY;
    return Math.sqrt(pdx * pdx + pdy * pdy);
  }

  // Variables for Orb Parallax
  const orb1 = document.getElementById('orb-1');
  const orb2 = document.getElementById('orb-2');
  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;
  const sensitivity = 40;
  const easeFactor = 0.08;

  document.addEventListener('mousemove', (e) => {
    // Update orb parallax targets
    targetX = (e.clientX / window.innerWidth) - 0.5;
    targetY = (e.clientY / window.innerHeight) - 0.5;
    
    // Canvas Mouse Calculations
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function drawMatrix() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    
    const now = Date.now();
    const dt = Math.max(1, now - lastFrameTime);
    lastFrameTime = now;
    
    // Initialize lastFrame position if first run
    if (lastFrameX === -1000 && mouseX !== -1000) {
      lastFrameX = mouseX;
      lastFrameY = mouseY;
    }
    
    // Compute velocity over this frame (pixels/ms)
    let speed = 0;
    if (lastFrameX !== -1000 && mouseX !== -1000) {
      const dx = mouseX - lastFrameX;
      const dy = mouseY - lastFrameY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      speed = dist / dt;
    }
    
    const maxDist = 150; // Proximity field
    const springK = 0.07; // Spring stiffness (slower wobble)
    const damping = 0.03; // Spring damping (more rebound/oscillations)
    
    triangles.forEach(tri => {
      let dist = maxDist + 10;
      if (lastFrameX !== -1000 && mouseX !== -1000) {
        dist = getDistanceToSegment(tri.x, tri.y, lastFrameX, lastFrameY, mouseX, mouseY);
      }
      
      // Proximity & Velocity-based Excitation
      if (dist < maxDist) {
        const proximityFactor = (maxDist - dist) / maxDist; // 1.0 at center, 0.0 at edge
        const speedFactor = Math.min(speed * 2.0, 4.0); // Amplify speed slightly but clamp
        
        // Excite energy (opacity)
        const energyGain = proximityFactor * (0.05 + speedFactor * 0.25);
        tri.energy = Math.max(tri.energy, Math.min(energyGain, 1.0));
        
        // Kick the spring wobble speed!
        const wobbleImpulse = proximityFactor * (0.03 + speedFactor * 0.45);
        tri.wobbleSpeed += wobbleImpulse * 0.28;
        
        // Clamp speed to prevent excessive wobble
        tri.wobbleSpeed = Math.max(-0.6, Math.min(0.6, tri.wobbleSpeed));
      }
      
      // Spring Update (Damped Harmonic Oscillator)
      const force = -springK * tri.wobble - damping * tri.wobbleSpeed;
      tri.wobbleSpeed += force;
      tri.wobble += tri.wobbleSpeed;
      
      // Decay energy (opacity)
      tri.energy *= 0.94;
      if (tri.energy < 0.001) tri.energy = 0;
      
      // Clamp wobble to prevent extreme scaling
      tri.wobble = Math.max(-0.8, Math.min(1.5, tri.wobble));
      
      // Calculate final scale (baseline 1.0 + wobble * scaleFactor)
      const scale = Math.max(0.1, 1.0 + tri.wobble * 1.8);
      
      // Wiggle angle proportional to wobble
      const angle = tri.wobble * 0.7;
      
      // Opacity: Cap at ~12% (0.025 baseline + 0.095 max energy) to keep it deep in the background
      const opacity = 0.025 + (0.095 * tri.energy);
      
      // Draw Vector Triangle (Solid Fill, No Stroke)
      ctx.save();
      ctx.translate(tri.x, tri.y);
      ctx.rotate(angle);
      ctx.scale(scale, scale);
      
      ctx.beginPath();
      // Draw tiny elegant triangle pointing up
      ctx.moveTo(0, -4.5);
      ctx.lineTo(4, 3);
      ctx.lineTo(-4, 3);
      ctx.closePath();
      
      ctx.fillStyle = getThemeColor(opacity);
      ctx.fill();
      ctx.restore();
    });
    
    // Save current mouse coordinates as lastFrame position for the next frame
    lastFrameX = mouseX;
    lastFrameY = mouseY;
  }

  // Setup event listeners for canvas resizing
  if (canvas) {
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
  }

  // Animation frame loop for buttery-smooth mouse tracking
  function animateOrbs() {
    // Lerp calculation: Current = Current + (Target - Current) * Ease
    currentX += (targetX - currentX) * easeFactor;
    currentY += (targetY - currentY) * easeFactor;
    
    if (orb1 && orb2) {
      // Shift opposite directions for depth/parallax effect
      orb1.style.transform = `translate(${currentX * sensitivity}px, ${currentY * sensitivity}px)`;
      orb2.style.transform = `translate(${-currentX * sensitivity}px, ${-currentY * sensitivity}px)`;
    }
    
    // Draw the vector canvas matrix
    drawMatrix();
    
    requestAnimationFrame(animateOrbs);
  }
  
  animateOrbs();

  // --------------------------------------------------------------------------
  // 3. AMBIENT GLOW LENS MODULATION
  // --------------------------------------------------------------------------
  function triggerGlowTransition(lens) {
    if (!orb1 || !orb2) return;
    
    // Shift orbs base scaling based on the perspective selected
    if (lens === 'creative') {
      orb1.style.width = '60vw';
      orb1.style.height = '60vw';
      orb2.style.width = '45vw';
      orb2.style.height = '45vw';
    } else if (lens === 'strategy') {
      orb1.style.width = '40vw';
      orb1.style.height = '40vw';
      orb2.style.width = '55vw';
      orb2.style.height = '55vw';
    } else {
      // Hybrid defaults
      orb1.style.width = '50vw';
      orb1.style.height = '50vw';
      orb2.style.width = '50vw';
      orb2.style.height = '50vw';
    }
  }
  
  // --------------------------------------------------------------------------
  // 4. METRIC PROGRESS COUNTERS (Micro-Interaction)
  // --------------------------------------------------------------------------
  // Trigger number counts when metrics scroll into view
  const metrics = document.querySelectorAll('.metric-number');
  
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const countText = target.innerText;
        
        // Match numbers, decimals, and symbols
        const match = countText.match(/^([^\d]*)([\d.]+)([^\d]*)$/);
        
        if (match) {
          const prefix = match[1];
          const rawNum = parseFloat(match[2]);
          const suffix = match[3];
          
          let start = 0;
          const duration = 1200; // ms
          const startTime = performance.now();
          
          function updateCount(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out quad formula
            const easeProgress = progress * (2 - progress);
            const currentNum = (rawNum * easeProgress).toFixed(rawNum % 1 === 0 ? 0 : 1);
            
            target.innerText = `${prefix}${currentNum}${suffix}`;
            
            if (progress < 1) {
              requestAnimationFrame(updateCount);
            } else {
              target.innerText = countText; // ensure final value is exact
            }
          }
          
          requestAnimationFrame(updateCount);
          observer.unobserve(target); // only count once
        }
      }
    });
  }, observerOptions);
  
  document.querySelectorAll('.stat-number').forEach(stat => {
    observer.observe(stat);
  });
  
  // --------------------------------------------------------------------------
  // 5. LIGHTBOX GALLERY
  // --------------------------------------------------------------------------
  const lightboxModal = document.getElementById('lightbox-modal');
  if (lightboxModal) {
    const lightboxContainer = lightboxModal.querySelector('.lightbox-media-container');
    const closeBtn = lightboxModal.querySelector('.lightbox-close');
    const prevBtn = lightboxModal.querySelector('.lightbox-prev');
    const nextBtn = lightboxModal.querySelector('.lightbox-next');
    const counterDisplay = lightboxModal.querySelector('.lightbox-counter');
    const backdrop = lightboxModal.querySelector('.lightbox-backdrop');
    
    let currentGallery = [];
    let currentIndex = 0;
    
    function updateLightbox() {
      if (!currentGallery || currentGallery.length === 0) return;
      const mediaUrl = currentGallery[currentIndex];
      lightboxContainer.innerHTML = ''; // Clear existing
      
      // Check if video or image
      if (mediaUrl.toLowerCase().endsWith('.mp4') || mediaUrl.toLowerCase().endsWith('.webm')) {
        const video = document.createElement('video');
        video.src = mediaUrl;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.controls = true; // allow user to pause/scrub
        video.playsInline = true;
        lightboxContainer.appendChild(video);
      } else {
        const img = document.createElement('img');
        img.src = mediaUrl;
        img.alt = `Gallery Image ${currentIndex + 1}`;
        lightboxContainer.appendChild(img);
      }
      
      counterDisplay.innerText = `${currentIndex + 1} / ${currentGallery.length}`;
    }
    
    function openLightbox(galleryArray) {
      if (!galleryArray || galleryArray.length === 0) return;
      currentGallery = galleryArray;
      currentIndex = 0;
      updateLightbox();
      lightboxModal.classList.add('is-active');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    
    function closeLightbox() {
      lightboxModal.classList.remove('is-active');
      setTimeout(() => { lightboxContainer.innerHTML = ''; }, 300); // clear after fade out
      document.body.style.overflow = '';
      currentGallery = [];
    }
    
    function nextImage() {
      if (currentGallery.length <= 1) return;
      currentIndex = (currentIndex + 1) % currentGallery.length;
      updateLightbox();
    }
    
    function prevImage() {
      if (currentGallery.length <= 1) return;
      currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
      updateLightbox();
    }
    
    // Attach click listeners to gallery triggers
    document.querySelectorAll('.project-card-front').forEach(frontFace => {
      frontFace.addEventListener('click', (e) => {
        // Only trigger if we aren't clicking a button
        if (e.target.closest('button')) return;
        
        if (frontFace.dataset.gallery) {
          try {
            const galleryArray = JSON.parse(frontFace.dataset.gallery.replace(/&quot;/g, '"'));
            openLightbox(galleryArray);
          } catch (err) {
            console.error("Error parsing gallery JSON:", err);
          }
        }
      });
    });
    
    closeBtn.addEventListener('click', closeLightbox);
    backdrop.addEventListener('click', closeLightbox);
    nextBtn.addEventListener('click', nextImage);
    prevBtn.addEventListener('click', prevImage);
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!lightboxModal.classList.contains('is-active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    });
  }
});
