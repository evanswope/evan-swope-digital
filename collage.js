/* ==========================================================================
   CAMERA COLLAGE INTERACTIVE SHOWCASE CONTROLLER (collage.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const collageDataset = {
    blackcat: {
      name: 'Black Cat & Whiskers',
      aspectRatio: '750 / 1000',
      slider: {
        ref: 'assets/images/collage_cat_ref.jpg',
        art: 'assets/images/collage_cat_art.jpg',
        caption: 'Interactive Comparison Slider: Drag handle left and right to reveal the original reference photo vs. the 1,338-piece physical memory collage.',
        stat: '-34.2% Error'
      },
      zoom_quad: {
        src: 'assets/images/pyramidal_blackcat_zoom_quad.png',
        caption: 'Strange Details Closeup: Grocery receipts as whiskers, porcelain toilet bowl, and late-night selfie cutouts.',
        stat: 'Strange Details'
      },
      blur_test: {
        src: 'assets/images/pyramidal_blackcat_gestalt_blur_test.jpg',
        caption: 'Gestalt Low-Frequency Blur Test (σ=15): Side-by-side reference and collage at σ=15. Simulates human Fusiform Face Area recognition from 20 feet away.',
        stat: 'σ = 15 Passed'
      },
      evolution: [
        { src: 'assets/images/evolution/evo_blackcat_0.jpg', badge: 'PASS 1 / 5', title: 'Pass 1: Foundation (Cutouts ≥ 500px)', stat: '≥500px Tier' },
        { src: 'assets/images/evolution/evo_blackcat_1.jpg', badge: 'PASS 2 / 5', title: 'Pass 2: Large Masses (Cutouts ≥ 200px)', stat: '≥200px Tier' },
        { src: 'assets/images/evolution/evo_blackcat_2.jpg', badge: 'PASS 3 / 5', title: 'Pass 3: Anatomy Contours (Cutouts ≥ 80px)', stat: '≥80px Tier' },
        { src: 'assets/images/evolution/evo_blackcat_3.jpg', badge: 'PASS 4 / 5', title: 'Pass 4: Fine Details (Cutouts ≥ 30px)', stat: '≥30px Tier' },
        { src: 'assets/images/evolution/evo_blackcat_4.jpg', badge: 'PASS 5 / 5', title: 'Pass 5: Micro Whiskers (Slender slivers ≤ 20px)', stat: '1,338 Pieces' }
      ]
    },

    tomato: {
      name: 'Tomato Culinary Still Life',
      aspectRatio: '1 / 1',
      slider: {
        ref: 'assets/images/collage_tomato_ref.jpg',
        art: 'assets/images/collage_tomato_art.jpg',
        caption: 'Interactive Comparison Slider: Drag to scrub between fresh vine tomatoes and the 1,218-piece food & receipt collage.',
        stat: '-53.2% Error'
      },
      zoom_quad: {
        src: 'assets/images/pyramidal_tomato_specular_zoom.png',
        caption: 'Strange Details Closeup: Yellow "REDUCED" supermarket price tags, pork ribs, and churros forming the locule seeds.',
        stat: 'Strange Details'
      },
      blur_test: {
        src: 'assets/images/pyramidal_tomato_gestalt_blur_test.jpg',
        caption: 'Gestalt Low-Frequency Blur Test (σ=15): Side-by-side reference and collage at σ=15. Color temperature and volumetric roundness mirror original.',
        stat: 'σ = 15 Passed'
      },
      evolution: [
        { src: 'assets/images/evolution/evo_tomato_0.jpg', badge: 'PASS 1 / 5', title: 'Pass 1: Charcoal Board & Background Staging', stat: '≥500px Tier' },
        { src: 'assets/images/evolution/evo_tomato_1.jpg', badge: 'PASS 2 / 5', title: 'Pass 2: Tomato Domes & Outer Pulp Masses', stat: '≥200px Tier' },
        { src: 'assets/images/evolution/evo_tomato_2.jpg', badge: 'PASS 3 / 5', title: 'Pass 3: Locule Cavity Geometry & Contours', stat: '≥80px Tier' },
        { src: 'assets/images/evolution/evo_tomato_3.jpg', badge: 'PASS 4 / 5', title: 'Pass 4: Locule Seeds & Price Tag Texture', stat: '≥30px Tier' },
        { src: 'assets/images/evolution/evo_tomato_4.jpg', badge: 'PASS 5 / 5', title: 'Pass 5: Specular Highlights & Surface Glints', stat: '1,218 Pieces' }
      ]
    },

    heavy: {
      name: 'Heavy (B&W Drag Chiaroscuro)',
      aspectRatio: '1 / 1',
      slider: {
        ref: 'assets/images/collage_heavy_ref.jpg',
        art: 'assets/images/collage_heavy_art.jpg',
        caption: 'Interactive Comparison Slider: Vintage drag theatrical portrait vs. 10,735-piece monochrome memory reconstruction.',
        stat: '10,735 Pieces'
      },
      zoom_quad: {
        src: 'assets/images/pyramidal_heavy_bw_zoom_quad.jpg',
        caption: 'Strange Details Closeup: Cat-eye makeup sculpted from miniature candid faces, camera lenses, and newspaper typography.',
        stat: 'Zero Exclusions'
      },
      blur_test: {
        src: 'assets/images/pyramidal_heavy_bw_gestalt_blur_test.jpg',
        caption: 'Gestalt Low-Frequency Blur Test (σ=15): Side-by-side reference and collage at σ=15. Preserves dramatic chiaroscuro and bouffant curls from 20 feet away.',
        stat: 'σ = 15 Passed'
      },
      evolution: [
        { src: 'assets/images/evolution/evo_heavy_0.jpg', badge: 'PHASE 1 / 14', title: 'Pass 1A: Gigantic Foundation Placement (≥ 180px)', stat: '≥180px Tier' },
        { src: 'assets/images/evolution/evo_heavy_1.jpg', badge: 'PHASE 2 / 14', title: 'Pass 1B: Heatmap Discrepancy Correction', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_heavy_2.jpg', badge: 'PHASE 3 / 14', title: 'Pass 2A: Torso & Bouffant Hair Masses (≥ 110px)', stat: '≥110px Tier' },
        { src: 'assets/images/evolution/evo_heavy_3.jpg', badge: 'PHASE 4 / 14', title: 'Pass 2B: Heatmap Discrepancy Correction', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_heavy_4.jpg', badge: 'PHASE 5 / 14', title: 'Pass 3A: Large Anatomical Masses (≥ 65px)', stat: '≥65px Tier' },
        { src: 'assets/images/evolution/evo_heavy_5.jpg', badge: 'PHASE 6 / 14', title: 'Pass 3B: Heatmap Discrepancy Correction', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_heavy_6.jpg', badge: 'PHASE 7 / 14', title: 'Pass 4A: Medium Makeup & Glove Placement (≥ 35px)', stat: '≥35px Tier' },
        { src: 'assets/images/evolution/evo_heavy_7.jpg', badge: 'PHASE 8 / 14', title: 'Pass 4B: Heatmap Discrepancy Correction', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_heavy_8.jpg', badge: 'PHASE 9 / 14', title: 'Pass 5A: Small Feature Placement (≥ 18px)', stat: '≥18px Tier' },
        { src: 'assets/images/evolution/evo_heavy_9.jpg', badge: 'PHASE 10 / 14', title: 'Pass 5B: Heatmap Discrepancy Correction', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_heavy_10.jpg', badge: 'PHASE 11 / 14', title: 'Pass 6A: Micro Eyelash & Brow Geometry (≥ 8px)', stat: '≥8px Tier' },
        { src: 'assets/images/evolution/evo_heavy_11.jpg', badge: 'PHASE 12 / 14', title: 'Pass 6B: Heatmap Discrepancy Correction', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_heavy_12.jpg', badge: 'PHASE 13 / 14', title: 'Pass 7A: Nano Polish Placement (≥ 3px)', stat: '≥3px Tier' },
        { src: 'assets/images/evolution/evo_heavy_13.jpg', badge: 'PHASE 14 / 14', title: 'Pass 7B: Final 10,735-Piece Chiaroscuro Convergence', stat: '10,735 Pieces' }
      ]
    },

    wedding: {
      name: 'Wedding Groom & Floral Tie',
      aspectRatio: '1024 / 682',
      slider: {
        ref: 'assets/images/collage_wedding_ref.jpg',
        art: 'assets/images/collage_wedding_art.jpg',
        caption: 'Interactive Comparison Slider: Intimate wedding portrait vs. 6,348-piece full-color optical collage.',
        stat: '6,348 Pieces'
      },
      zoom_quad: {
        src: 'assets/images/pyramidal_wedding_zoom_quad.jpg',
        caption: 'Strange Details Closeup: Groom’s face formed from tiny candid portraits; tie knot woven from wine bottle labels; jeweled bee lapel pin.',
        stat: 'Surreal Details'
      },
      blur_test: {
        src: 'assets/images/pyramidal_wedding_gestalt_blur_test.jpg',
        caption: 'Gestalt Low-Frequency Blur Test (σ=15): Side-by-side reference and collage at σ=15. Sage jacket, peach skin luma, and burgundy floral tie snap into focus.',
        stat: 'σ = 15 Passed'
      },
      evolution: [
        { src: 'assets/images/evolution/evo_wedding_0.jpg', badge: 'PHASE 1 / 14', title: 'Pass 1A: Foundation Placement (≥ 180px)', stat: '≥180px Tier' },
        { src: 'assets/images/evolution/evo_wedding_1.jpg', badge: 'PHASE 2 / 14', title: 'Pass 1B: Heatmap Discrepancy Correction', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_wedding_2.jpg', badge: 'PHASE 3 / 14', title: 'Pass 2A: Suit Jacket & Background Placement (≥ 110px)', stat: '≥110px Tier' },
        { src: 'assets/images/evolution/evo_wedding_3.jpg', badge: 'PHASE 4 / 14', title: 'Pass 2B: Heatmap Discrepancy Correction', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_wedding_4.jpg', badge: 'PHASE 5 / 14', title: 'Pass 3A: Large Anatomical Masses (≥ 65px)', stat: '≥65px Tier' },
        { src: 'assets/images/evolution/evo_wedding_5.jpg', badge: 'PHASE 6 / 14', title: 'Pass 3B: Heatmap Discrepancy Correction', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_wedding_6.jpg', badge: 'PHASE 7 / 14', title: 'Pass 4A: Medium Floral Tie & Hands (≥ 35px)', stat: '≥35px Tier' },
        { src: 'assets/images/evolution/evo_wedding_7.jpg', badge: 'PHASE 8 / 14', title: 'Pass 4B: Heatmap Discrepancy Correction', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_wedding_8.jpg', badge: 'PHASE 9 / 14', title: 'Pass 5A: Small Facial Geometry (≥ 18px)', stat: '≥18px Tier' },
        { src: 'assets/images/evolution/evo_wedding_9.jpg', badge: 'PHASE 10 / 14', title: 'Pass 5B: Heatmap Discrepancy Correction', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_wedding_10.jpg', badge: 'PHASE 11 / 14', title: 'Pass 6A: Micro Edge & Fabric Placement (≥ 8px)', stat: '≥8px Tier' },
        { src: 'assets/images/evolution/evo_wedding_11.jpg', badge: 'PHASE 12 / 14', title: 'Pass 6B: Heatmap Discrepancy Correction', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_wedding_12.jpg', badge: 'PHASE 13 / 14', title: 'Pass 7A: Nano Polish & Bee Pin Placement (≥ 3px)', stat: '≥3px Tier' },
        { src: 'assets/images/evolution/evo_wedding_13.jpg', badge: 'PHASE 14 / 14', title: 'Pass 7B: Final 6,348-Piece Convergence', stat: '6,348 Pieces' }
      ]
    },

    crushworthy: {
      name: 'Crushworthy Pop Models',
      aspectRatio: '1 / 1',
      slider: {
        ref: 'assets/images/collage_crushworthy_ref.jpg',
        art: 'assets/images/collage_crushworthy_art.jpg',
        caption: 'Interactive Comparison Slider: High-key pop fashion portrait vs. 7,635-piece vibrant memory collage.',
        stat: '7,635 Pieces'
      },
      zoom_quad: {
        src: 'assets/images/pyramidal_crushworthy_zoom_quad.jpg',
        caption: 'Strange Details Closeup: Chartreuse mullet tips and dark bangs made of faces and tickets; pink bandana formed of neon stickers; Desperado cowboy tee.',
        stat: 'Pop Details'
      },
      blur_test: {
        src: 'assets/images/pyramidal_crushworthy_gestalt_blur_test.jpg',
        caption: 'Gestalt Low-Frequency Blur Test (σ=15): Side-by-side reference and collage at σ=15. High-key white backdrop and saturated neon foregrounds pop.',
        stat: 'σ = 15 Passed'
      },
      evolution: [
        { src: 'assets/images/evolution/evo_crushworthy_0.jpg', badge: 'PHASE 1 / 14', title: 'Pass 1A: Studio White & Body Foundation (≥ 180px)', stat: '≥180px Tier' },
        { src: 'assets/images/evolution/evo_crushworthy_1.jpg', badge: 'PHASE 2 / 14', title: 'Pass 1B: Heatmap Discrepancy Correction', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_crushworthy_2.jpg', badge: 'PHASE 3 / 14', title: 'Pass 2A: Torso & Studio Wall Placement (≥ 110px)', stat: '≥110px Tier' },
        { src: 'assets/images/evolution/evo_crushworthy_3.jpg', badge: 'PHASE 4 / 14', title: 'Pass 2B: Heatmap Discrepancy Correction', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_crushworthy_4.jpg', badge: 'PHASE 5 / 14', title: 'Pass 3A: Large Dual-Portrait Masses (≥ 65px)', stat: '≥65px Tier' },
        { src: 'assets/images/evolution/evo_crushworthy_5.jpg', badge: 'PHASE 6 / 14', title: 'Pass 3B: Heatmap Discrepancy Correction', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_crushworthy_6.jpg', badge: 'PHASE 7 / 14', title: 'Pass 4A: Medium Neon Mullet & Bandana (≥ 35px)', stat: '≥35px Tier' },
        { src: 'assets/images/evolution/evo_crushworthy_7.jpg', badge: 'PHASE 8 / 14', title: 'Pass 4B: Heatmap Discrepancy Correction', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_crushworthy_8.jpg', badge: 'PHASE 9 / 14', title: 'Pass 5A: Small Facial Features & Cowboy Tee (≥ 18px)', stat: '≥18px Tier' },
        { src: 'assets/images/evolution/evo_crushworthy_9.jpg', badge: 'PHASE 10 / 14', title: 'Pass 5B: Heatmap Discrepancy Correction', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_crushworthy_10.jpg', badge: 'PHASE 11 / 14', title: 'Pass 6A: Micro Texture & Doodle Placement (≥ 8px)', stat: '≥8px Tier' },
        { src: 'assets/images/evolution/evo_crushworthy_11.jpg', badge: 'PHASE 12 / 14', title: 'Pass 6B: Heatmap Discrepancy Correction', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_crushworthy_12.jpg', badge: 'PHASE 13 / 14', title: 'Pass 7A: Nano Polish Placement (≥ 3px)', stat: '≥3px Tier' },
        { src: 'assets/images/evolution/evo_crushworthy_13.jpg', badge: 'PHASE 14 / 14', title: 'Pass 7B: Final 7,635-Piece Convergence', stat: '7,635 Pieces' }
      ]
    }
  };

  let currentSubject = 'blackcat';
  let currentMode = 'slider';
  let currentEvoStep = 0;
  let evoPlayTimer = null;

  const sliderEl = document.getElementById('collage-comparison-slider');
  const sliderArtImg = document.getElementById('slider-art-img');
  const sliderRefImg = document.getElementById('slider-ref-img');
  const imgEl = document.getElementById('collage-display-img');
  const captionTextEl = document.getElementById('collage-caption-text');
  const captionStatEl = document.getElementById('collage-caption-stat');
  const subjectBtns = document.querySelectorAll('.collage-subject-btn');
  const modeBtns = document.querySelectorAll('.collage-mode-btn');
  const drawerToggleBtn = document.getElementById('btn-toggle-case-study');
  const drawerEl = document.getElementById('collage-case-study-drawer');

  // Evolution Controller Elements
  const evoController = document.getElementById('collage-evolution-controller');
  const evoRangeSlider = document.getElementById('evo-range-slider');
  const evoBtnPlay = document.getElementById('evo-btn-play');
  const evoBtnPrev = document.getElementById('evo-btn-prev');
  const evoBtnNext = document.getElementById('evo-btn-next');
  const evoStepBadge = document.getElementById('evo-step-badge');
  const evoStepDesc = document.getElementById('evo-step-desc');

  // Preload cache for smooth scrubbing
  const imagePreloadCache = new Map();
  function preloadImage(src) {
    if (!src || imagePreloadCache.has(src)) return;
    const img = new Image();
    img.src = src;
    imagePreloadCache.set(src, img);
  }

  // Preload all evolution steps for current subject
  function preloadSubjectEvolution(subjectKey) {
    const steps = collageDataset[subjectKey]?.evolution || [];
    steps.forEach(step => preloadImage(step.src));
  }

  // Initialize interactive comparison slider dragging
  function initComparisonSlider() {
    if (!sliderEl) return;

    let isDragging = false;

    function setSliderPos(clientX) {
      const rect = sliderEl.getBoundingClientRect();
      if (rect.width <= 0) return;
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      sliderEl.style.setProperty('--slider-pos', `${pct.toFixed(2)}%`);
    }

    sliderEl.addEventListener('pointerdown', (e) => {
      isDragging = true;
      sliderEl.classList.add('is-dragging');
      sliderEl.setPointerCapture(e.pointerId);
      setSliderPos(e.clientX);
    });

    sliderEl.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      setSliderPos(e.clientX);
    });

    const stopDragging = (e) => {
      if (!isDragging) return;
      isDragging = false;
      sliderEl.classList.remove('is-dragging');
      try {
        sliderEl.releasePointerCapture(e.pointerId);
      } catch (_) {}
    };

    sliderEl.addEventListener('pointerup', stopDragging);
    sliderEl.addEventListener('pointercancel', stopDragging);

    // Keyboard navigation for slider
    const handleBtn = sliderEl.querySelector('.slider-handle-button');
    if (handleBtn) {
      handleBtn.setAttribute('tabindex', '0');
      handleBtn.setAttribute('role', 'slider');
      handleBtn.setAttribute('aria-label', 'Reference versus collage divider');
      handleBtn.addEventListener('keydown', (e) => {
        let currentPos = parseFloat(sliderEl.style.getPropertyValue('--slider-pos')) || 50;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          currentPos = Math.max(0, currentPos - 5);
          sliderEl.style.setProperty('--slider-pos', `${currentPos}%`);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          currentPos = Math.min(100, currentPos + 5);
          sliderEl.style.setProperty('--slider-pos', `${currentPos}%`);
        }
      });
    }
  }

  // Stop evolution autoplay
  function stopEvolutionAutoplay() {
    if (evoPlayTimer) {
      clearInterval(evoPlayTimer);
      evoPlayTimer = null;
    }
    if (evoBtnPlay) {
      evoBtnPlay.classList.remove('is-playing');
      const icon = evoBtnPlay.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-play';
    }
  }

  // Toggle evolution autoplay
  function toggleEvolutionAutoplay() {
    if (evoPlayTimer) {
      stopEvolutionAutoplay();
    } else {
      const steps = collageDataset[currentSubject]?.evolution || [];
      if (steps.length <= 1) return;

      if (evoBtnPlay) {
        evoBtnPlay.classList.add('is-playing');
        const icon = evoBtnPlay.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-pause';
      }

      evoPlayTimer = setInterval(() => {
        const total = collageDataset[currentSubject]?.evolution?.length || 1;
        currentEvoStep = (currentEvoStep + 1) % total;
        applyEvolutionStep();
      }, 1300);
    }
  }

  // Apply current evolution step to image and controller labels
  function applyEvolutionStep() {
    const steps = collageDataset[currentSubject]?.evolution || [];
    if (steps.length === 0) return;

    currentEvoStep = Math.max(0, Math.min(steps.length - 1, currentEvoStep));
    const step = steps[currentEvoStep];

    if (evoRangeSlider) {
      evoRangeSlider.max = steps.length - 1;
      evoRangeSlider.value = currentEvoStep;
    }
    if (evoStepBadge) evoStepBadge.textContent = step.badge;
    if (evoStepDesc) evoStepDesc.textContent = step.title;
    if (captionStatEl) captionStatEl.textContent = step.stat;
    if (captionTextEl) {
      captionTextEl.textContent = `Evolution Timelapse: ${step.title}. Scrub the slider or press play to watch optical hierarchy construct the image.`;
    }

    if (imgEl) {
      imgEl.src = step.src;
      imgEl.alt = `${collageDataset[currentSubject]?.name} - ${step.title}`;
    }

    // Preload next step image
    if (currentEvoStep + 1 < steps.length) {
      preloadImage(steps[currentEvoStep + 1].src);
    }
  }

  function updateView() {
    const subjectData = collageDataset[currentSubject];
    if (!subjectData) return;

    stopEvolutionAutoplay();
    preloadSubjectEvolution(currentSubject);

    if (currentMode === 'slider') {
      if (imgEl) imgEl.style.display = 'none';
      if (evoController) evoController.style.display = 'none';
      if (sliderEl) {
        sliderEl.style.display = 'flex';
        sliderEl.style.setProperty('--slider-aspect', subjectData.aspectRatio || '1 / 1');
        sliderEl.style.setProperty('--slider-pos', '50%');
        if (sliderArtImg) {
          sliderArtImg.src = subjectData.slider.art;
          sliderArtImg.alt = `${subjectData.name} Collage Art`;
        }
        if (sliderRefImg) {
          sliderRefImg.src = subjectData.slider.ref;
          sliderRefImg.alt = `${subjectData.name} Original Reference`;
        }
      }
      if (captionTextEl) captionTextEl.textContent = subjectData.slider.caption;
      if (captionStatEl) captionStatEl.textContent = subjectData.slider.stat;

    } else if (currentMode === 'evolution') {
      if (sliderEl) sliderEl.style.display = 'none';
      if (imgEl) imgEl.style.display = 'block';
      if (evoController) evoController.style.display = 'flex';

      const steps = subjectData.evolution || [];
      if (evoRangeSlider) {
        evoRangeSlider.max = steps.length - 1;
        currentEvoStep = Math.min(currentEvoStep, steps.length - 1);
        evoRangeSlider.value = currentEvoStep;
      }
      applyEvolutionStep();

    } else {
      // Zoom quad or Blur test
      if (sliderEl) sliderEl.style.display = 'none';
      if (evoController) evoController.style.display = 'none';
      if (imgEl) {
        imgEl.style.display = 'block';
        const modeData = subjectData[currentMode];
        if (modeData) {
          imgEl.style.opacity = '0';
          setTimeout(() => {
            imgEl.src = modeData.src;
            imgEl.alt = `${subjectData.name} - ${currentMode}`;
            if (captionTextEl) captionTextEl.textContent = modeData.caption;
            if (captionStatEl) captionStatEl.textContent = modeData.stat;
            imgEl.style.opacity = '1';
          }, 100);
        }
      }
    }
  }

  // Wire Subject buttons
  subjectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      subjectBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSubject = btn.dataset.subject;
      currentEvoStep = 0;
      updateView();
    });
  });

  // Wire Mode buttons
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
      updateView();
    });
  });

  // Wire Evolution Controller events
  if (evoRangeSlider) {
    evoRangeSlider.addEventListener('input', (e) => {
      stopEvolutionAutoplay();
      currentEvoStep = parseInt(e.target.value, 10);
      applyEvolutionStep();
    });
  }

  if (evoBtnPlay) {
    evoBtnPlay.addEventListener('click', () => {
      toggleEvolutionAutoplay();
    });
  }

  if (evoBtnPrev) {
    evoBtnPrev.addEventListener('click', () => {
      stopEvolutionAutoplay();
      const steps = collageDataset[currentSubject]?.evolution || [];
      if (steps.length === 0) return;
      currentEvoStep = (currentEvoStep - 1 + steps.length) % steps.length;
      applyEvolutionStep();
    });
  }

  if (evoBtnNext) {
    evoBtnNext.addEventListener('click', () => {
      stopEvolutionAutoplay();
      const steps = collageDataset[currentSubject]?.evolution || [];
      if (steps.length === 0) return;
      currentEvoStep = (currentEvoStep + 1) % steps.length;
      applyEvolutionStep();
    });
  }

  // Keyboard navigation for Evolution mode
  document.addEventListener('keydown', (e) => {
    if (currentMode !== 'evolution') return;
    if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' && activeEl.type !== 'range' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stopEvolutionAutoplay();
        const steps = collageDataset[currentSubject]?.evolution || [];
        if (steps.length === 0) return;
        currentEvoStep = (currentEvoStep - 1 + steps.length) % steps.length;
        applyEvolutionStep();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stopEvolutionAutoplay();
        const steps = collageDataset[currentSubject]?.evolution || [];
        if (steps.length === 0) return;
        currentEvoStep = (currentEvoStep + 1) % steps.length;
        applyEvolutionStep();
      } else if (e.key === ' ') {
        e.preventDefault();
        toggleEvolutionAutoplay();
      }
    }
  });

  // Wire Case Study Drawer
  if (drawerToggleBtn && drawerEl) {
    drawerToggleBtn.addEventListener('click', () => {
      const isVisible = drawerEl.style.display !== 'none';
      drawerEl.style.display = isVisible ? 'none' : 'block';
      const icon = drawerToggleBtn.querySelector('i');
      const label = drawerToggleBtn.querySelector('span');
      if (isVisible) {
        if (icon) icon.className = 'fa-solid fa-book-open';
        if (label) label.textContent = 'READ RESEARCH & CASE STUDY';
      } else {
        if (icon) icon.className = 'fa-solid fa-xmark';
        if (label) label.textContent = 'CLOSE CASE STUDY';
        drawerEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  initComparisonSlider();
  preloadSubjectEvolution('blackcat');
  updateView();
});
