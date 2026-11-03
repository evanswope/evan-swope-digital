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
      details: {
        src: 'assets/images/details/detail_cat.jpg',
        caption: 'Detail Crop: Unobstructed closeup of the muzzle and whisker cutouts.',
        stat: 'Macro Crop'
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
      details: {
        src: 'assets/images/details/detail_tomato.jpg',
        caption: 'Detail Crop: Unobstructed closeup of the sliced tomato cavity cutouts.',
        stat: 'Macro Crop'
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
        caption: 'Interactive Comparison Slider: 2000×2000 vintage drag portrait vs. 3,870-piece 4-Pass 3-Phase Contour-Locked collage.',
        stat: '3,870 Pieces'
      },
      details: {
        src: 'assets/images/details/detail_heavy.jpg',
        caption: 'Detail Crop: Unobstructed closeup of the 4-Pass 3-Phase face and eyeliner cutouts.',
        stat: 'Macro Crop'
      },
      blur_test: {
        src: 'assets/images/pyramidal_heavy_bw_gestalt_blur_test.jpg',
        caption: 'Gestalt Low-Frequency Blur Test (σ=15): Side-by-side reference and 4-Pass 3-Phase collage at σ=15. Preserves dramatic chiaroscuro and facial structure from 20 feet away.',
        stat: 'σ = 15 Passed'
      },
      evolution: [
        { src: 'assets/images/evolution/evo_heavy_0.jpg', badge: 'PHASE 1 / 12', title: 'Pass 1A: 100% Void-Sealed XL Substrate (650–1050px)', stat: '100% Coverage' },
        { src: 'assets/images/evolution/evo_heavy_1.jpg', badge: 'PHASE 2 / 12', title: 'Pass 1B: Macro Heatmap Discrepancy Fix (380–600px)', stat: 'Mean ΔE 45.1' },
        { src: 'assets/images/evolution/evo_heavy_2.jpg', badge: 'PHASE 3 / 12', title: 'Pass 1C: Major Silhouette & Volume Lock (300–500px)', stat: 'Silhouette Lock' },
        { src: 'assets/images/evolution/evo_heavy_3.jpg', badge: 'PHASE 4 / 12', title: 'Pass 2A: Large Structural Volumes (200–350px)', stat: '200–350px Tier' },
        { src: 'assets/images/evolution/evo_heavy_4.jpg', badge: 'PHASE 5 / 12', title: 'Pass 2B: Structural Discrepancy Correction (150–260px)', stat: 'Mean ΔE 36.9' },
        { src: 'assets/images/evolution/evo_heavy_5.jpg', badge: 'PHASE 6 / 12', title: 'Pass 2C: Head, Jaw & Shoulder Boundary Lock (130–220px)', stat: 'Anatomy Lock' },
        { src: 'assets/images/evolution/evo_heavy_6.jpg', badge: 'PHASE 7 / 12', title: 'Pass 3A: Med-Large Gradient Flow Planes (100–180px)', stat: '100–180px Tier' },
        { src: 'assets/images/evolution/evo_heavy_7.jpg', badge: 'PHASE 8 / 12', title: 'Pass 3B: Contrast-Weighted Error Fix (76–130px)', stat: 'Mean ΔE 30.0' },
        { src: 'assets/images/evolution/evo_heavy_8.jpg', badge: 'PHASE 9 / 12', title: 'Pass 3C: Cheekbone, Brow & Nose Bridge Lock (65–115px)', stat: 'Feature Planes' },
        { src: 'assets/images/evolution/evo_heavy_9.jpg', badge: 'PHASE 10 / 12', title: 'Pass 4A: Identifiable Feature Lattice (48–90px)', stat: '48–90px Tier' },
        { src: 'assets/images/evolution/evo_heavy_10.jpg', badge: 'PHASE 11 / 12', title: 'Pass 4B: High-Contrast Hotspot Seal (40–70px)', stat: 'Hotspot Seal' },
        { src: 'assets/images/evolution/evo_heavy_11.jpg', badge: 'PHASE 12 / 12', title: 'Pass 4C: Eyelid, Lash & Lip Tangent Lock (40–68px)', stat: '3,870 Pieces' }
      ]
    },

    wedding: {
      name: 'Wedding Groom & Floral Tie',
      aspectRatio: '3003 / 2000',
      slider: {
        ref: 'assets/images/collage_wedding_ref.jpg',
        art: 'assets/images/collage_wedding_art.jpg',
        caption: 'Interactive Comparison Slider: 3003×2000 wedding portrait vs. 4,259-piece 4-Pass collage with large, recognizable cutouts.',
        stat: '4,259 Pieces'
      },
      details: {
        src: 'assets/images/details/detail_wedding.jpg',
        caption: 'Detail Crop: Unobstructed closeup of the groom, floral tie, and lapel cutouts.',
        stat: 'Macro Crop'
      },
      blur_test: {
        src: 'assets/images/pyramidal_wedding_gestalt_blur_test.jpg',
        caption: 'Gestalt Low-Frequency Blur Test (σ=15): Side-by-side reference and 4-Pass collage at σ=15. Warm skin tones, sage tweed, and burgundy tie snap into focus.',
        stat: 'σ = 15 Passed'
      },
      evolution: [
        { src: 'assets/images/evolution/evo_wedding_0.jpg', badge: 'PHASE 1 / 8', title: 'Pass 1A: 100% Void-Sealed XL Substrate (650–1050px)', stat: '100% Coverage' },
        { src: 'assets/images/evolution/evo_wedding_1.jpg', badge: 'PHASE 2 / 8', title: 'Pass 1B: Contrast-Weighted XL Error Fix (380–600px)', stat: 'Macro Fix' },
        { src: 'assets/images/evolution/evo_wedding_2.jpg', badge: 'PHASE 3 / 8', title: 'Pass 2A: Suit Jacket & Hallway Volumes (200–350px)', stat: '200–350px Tier' },
        { src: 'assets/images/evolution/evo_wedding_3.jpg', badge: 'PHASE 4 / 8', title: 'Pass 2B: Structural Heatmap Correction (150–260px)', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_wedding_4.jpg', badge: 'PHASE 5 / 8', title: 'Pass 3A: Med-Large Facial & Lapel Planes (100–180px)', stat: '100–180px Tier' },
        { src: 'assets/images/evolution/evo_wedding_5.jpg', badge: 'PHASE 6 / 8', title: 'Pass 3B: High-Contrast Discrepancy Fix (76–130px)', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_wedding_6.jpg', badge: 'PHASE 7 / 8', title: 'Pass 4A: Identifiable Tie, Hands & Smile (48–90px)', stat: '48–90px Tier' },
        { src: 'assets/images/evolution/evo_wedding_7.jpg', badge: 'PHASE 8 / 8', title: 'Pass 4B: Final 4,259-Piece Identifiable Convergence (40–70px)', stat: '4,259 Pieces' }
      ]
    },

    crushworthy: {
      name: 'Crushworthy Pop Models',
      aspectRatio: '1 / 1',
      slider: {
        ref: 'assets/images/collage_crushworthy_ref.jpg',
        art: 'assets/images/collage_crushworthy_art.jpg',
        caption: 'Interactive Comparison Slider: 2000×2000 pop fashion editorial vs. 3,384-piece contrast-weighted 4-Pass collage.',
        stat: '3,384 Pieces'
      },
      details: {
        src: 'assets/images/details/detail_crushworthy.jpg',
        caption: 'Detail Crop: Unobstructed closeup of the bangs, cheek, and bandana cutouts.',
        stat: 'Macro Crop'
      },
      blur_test: {
        src: 'assets/images/pyramidal_crushworthy_gestalt_blur_test.jpg',
        caption: 'Gestalt Low-Frequency Blur Test (σ=15): Side-by-side reference and 4-Pass collage at σ=15. Calm white cyclorama and saturated neon foregrounds match seamlessly.',
        stat: 'σ = 15 Passed'
      },
      evolution: [
        { src: 'assets/images/evolution/evo_crushworthy_0.jpg', badge: 'PHASE 1 / 8', title: 'Pass 1A: 100% Void-Sealed Cyclorama & Foundation (650–1050px)', stat: '100% Coverage' },
        { src: 'assets/images/evolution/evo_crushworthy_1.jpg', badge: 'PHASE 2 / 8', title: 'Pass 1B: Contrast-Weighted XL Error Fix (380–600px)', stat: 'Macro Fix' },
        { src: 'assets/images/evolution/evo_crushworthy_2.jpg', badge: 'PHASE 3 / 8', title: 'Pass 2A: Dual-Portrait Torso & Hair Masses (200–350px)', stat: '200–350px Tier' },
        { src: 'assets/images/evolution/evo_crushworthy_3.jpg', badge: 'PHASE 4 / 8', title: 'Pass 2B: Foreground Discrepancy Correction (150–260px)', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_crushworthy_4.jpg', badge: 'PHASE 5 / 8', title: 'Pass 3A: Med-Large Shag Mullet & Bandana Planes (100–180px)', stat: '100–180px Tier' },
        { src: 'assets/images/evolution/evo_crushworthy_5.jpg', badge: 'PHASE 6 / 8', title: 'Pass 3B: High-Saliency Feature Correction (76–130px)', stat: 'Residual Fix' },
        { src: 'assets/images/evolution/evo_crushworthy_6.jpg', badge: 'PHASE 7 / 8', title: 'Pass 4A: Identifiable Eyes, Bangs & Cowboy Tee (48–90px)', stat: '48–90px Tier' },
        { src: 'assets/images/evolution/evo_crushworthy_7.jpg', badge: 'PHASE 8 / 8', title: 'Pass 4B: Final 3,384-Piece Identifiable Convergence (40–70px)', stat: '3,384 Pieces' }
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

  // Details View Elements
  const detailsContainer = document.getElementById('collage-details-container');
  const detailsImg = document.getElementById('collage-details-img');

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

  // Render clean unobstructed Details Closeup
  function renderDetailsView(subjectKey) {
    const subjectData = collageDataset[subjectKey];
    if (!subjectData || !subjectData.details) return;

    if (detailsImg) {
      detailsImg.src = subjectData.details.src;
      detailsImg.alt = `${subjectData.name} - Details Closeup`;
    }
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
      if (detailsContainer) detailsContainer.style.display = 'none';
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

    } else if (currentMode === 'details') {
      if (sliderEl) sliderEl.style.display = 'none';
      if (imgEl) imgEl.style.display = 'none';
      if (evoController) evoController.style.display = 'none';
      if (detailsContainer) detailsContainer.style.display = 'flex';

      renderDetailsView(currentSubject);

      if (captionTextEl) captionTextEl.textContent = subjectData.details.caption;
      if (captionStatEl) captionStatEl.textContent = subjectData.details.stat;

    } else if (currentMode === 'evolution') {
      if (sliderEl) sliderEl.style.display = 'none';
      if (detailsContainer) detailsContainer.style.display = 'none';
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
      // Blur test
      if (sliderEl) sliderEl.style.display = 'none';
      if (evoController) evoController.style.display = 'none';
      if (detailsContainer) detailsContainer.style.display = 'none';
      if (imgEl) {
        imgEl.style.display = 'block';
        const modeData = subjectData[currentMode] || subjectData.blur_test;
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
  [
    'assets/images/details/detail_cat.jpg',
    'assets/images/details/detail_tomato.jpg',
    'assets/images/details/detail_heavy.jpg',
    'assets/images/details/detail_wedding.jpg',
    'assets/images/details/detail_crushworthy.jpg'
  ].forEach(preloadImage);
  updateView();
});
