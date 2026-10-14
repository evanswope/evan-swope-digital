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
      side_by_side: {
        src: 'assets/images/pyramidal_blackcat_side_by_side.png',
        caption: '1,338-Piece Physical Ephemera Collage vs. Reference (750x1000) · 3.95s on GPU',
        stat: '-34.2% Error'
      },
      zoom_quad: {
        src: 'assets/images/pyramidal_blackcat_zoom_quad.png',
        caption: 'Strange Details Closeup: Grocery receipts as whiskers, porcelain toilet bowl, and late-night selfie cutouts.',
        stat: 'Strange Details'
      },
      blur_test: {
        src: 'assets/images/pyramidal_blackcat_gestalt_blur_test.png',
        caption: 'Gestalt Low-Frequency Blur Test (σ=18, 61x61px kernel). Simulates human Fusiform Face Area recognition.',
        stat: 'Gestalt Passed'
      },
      evolution: {
        src: 'assets/images/pyramidal_blackcat_evolution_strip.png',
        caption: '5-Pass Hierarchy: P1 Foundation (≥500px) → P2 Masses → P3 Contours → P4 Detail → P5 Whiskers (≤20px).',
        stat: '5 Scale Tiers'
      }
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
      side_by_side: {
        src: 'assets/images/pyramidal_tomato_side_by_side.png',
        caption: 'Ripe Vine Tomatoes & Basil on Wooden Board vs. 1,218-Piece Physical Collage (1000x1000) · 4.24s on GPU',
        stat: '-53.2% Error'
      },
      zoom_quad: {
        src: 'assets/images/pyramidal_tomato_specular_zoom.png',
        caption: 'Strange Details Closeup: Yellow "REDUCED" supermarket price tags, pork ribs, and churros forming the locule seeds.',
        stat: 'Strange Details'
      },
      blur_test: {
        src: 'assets/images/pyramidal_tomato_gestalt_blur_test.png',
        caption: 'Gestalt Low-Frequency Blur Test: Color temperature and volumetric roundness mirror original.',
        stat: 'Gestalt Passed'
      },
      evolution: {
        src: 'assets/images/pyramidal_tomato_evolution_strip.png',
        caption: '5-Pass Hierarchy: Charcoal & Board Staging → Tomato Domes → Locule Contours → Seeds → Specular Shines.',
        stat: '5 Scale Tiers'
      }
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
      side_by_side: {
        src: 'assets/images/pyramidal_heavy_bw_side_by_side.jpg',
        caption: 'High-Contrast Theatrical Portrait vs. 10,735-Piece Two-Phase Optical Collage (1000x1000) · 20.2s on GPU',
        stat: '-33.1 ΔE'
      },
      zoom_quad: {
        src: 'assets/images/pyramidal_heavy_bw_zoom_quad.jpg',
        caption: 'Strange Details Closeup: Cat-eye makeup sculpted from miniature candid faces, camera lenses, and newspaper typography.',
        stat: 'Zero Exclusions'
      },
      blur_test: {
        src: 'assets/images/pyramidal_heavy_bw_gestalt_blur_test.jpg',
        caption: 'Multi-Scale Gestalt Blur Test (σ ∈ {1, 3, 7, 15, 30}): Preserves dramatic chiaroscuro and bouffant curls from 20 feet away.',
        stat: 'Gestalt Passed'
      },
      evolution: {
        src: 'assets/images/pyramidal_heavy_bw_evolution_strip.jpg',
        caption: '14-Phase Hierarchical Evolution: 7 scale tiers (180px down to 3px), each pairing Initial Placement (A) with Discrepancy Correction (B).',
        stat: '14 Phases'
      }
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
      side_by_side: {
        src: 'assets/images/pyramidal_wedding_side_by_side.jpg',
        caption: 'Groom Tie Adjustment vs. 6,348-Piece Two-Phase Collage (1024x682) · 13.1s on GPU',
        stat: '-54.2% Error'
      },
      zoom_quad: {
        src: 'assets/images/pyramidal_wedding_zoom_quad.jpg',
        caption: 'Strange Details Closeup: Groom’s face formed from tiny candid portraits; tie knot woven from wine bottle labels; jeweled bee lapel pin.',
        stat: 'Surreal Details'
      },
      blur_test: {
        src: 'assets/images/pyramidal_wedding_gestalt_blur_test.jpg',
        caption: 'Multi-Scale Gestalt Blur Test: Sage jacket, peach skin luma, and burgundy floral tie snap into focus across spatial frequencies.',
        stat: 'Gestalt Passed'
      },
      evolution: {
        src: 'assets/images/pyramidal_wedding_evolution_strip.jpg',
        caption: '14-Phase Full-Color Evolution: Initial coverage followed by CIELAB error correction against the Turbo discrepancy heatmap.',
        stat: '14 Phases'
      }
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
      side_by_side: {
        src: 'assets/images/pyramidal_crushworthy_side_by_side.jpg',
        caption: 'Dual Model Pop Studio vs. 7,635-Piece Two-Phase Collage (1024x1024) · 13.2s on GPU',
        stat: '-62.5% Error'
      },
      zoom_quad: {
        src: 'assets/images/pyramidal_crushworthy_zoom_quad.jpg',
        caption: 'Strange Details Closeup: Chartreuse mullet tips and dark bangs made of faces and tickets; pink bandana formed of neon stickers; Desperado cowboy tee.',
        stat: 'Pop Details'
      },
      blur_test: {
        src: 'assets/images/pyramidal_crushworthy_gestalt_blur_test.jpg',
        caption: 'Multi-Scale Gestalt Blur Test: High-key white backdrop resolves into receipts and paper scraps while saturated neon foregrounds pop.',
        stat: 'Gestalt Passed'
      },
      evolution: {
        src: 'assets/images/pyramidal_crushworthy_evolution_strip.jpg',
        caption: '14-Phase Two-Phase Evolution: Driving Mean ΔE from 69.61 down to 26.09 with peak P90 dropping from 223.09 to 63.82.',
        stat: '14 Phases'
      }
    }
  };

  let currentSubject = 'blackcat';
  let currentMode = 'slider';

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

  function updateView() {
    const subjectData = collageDataset[currentSubject];
    if (!subjectData) return;

    if (currentMode === 'slider') {
      if (imgEl) imgEl.style.display = 'none';
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
    } else {
      if (sliderEl) sliderEl.style.display = 'none';
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
          }, 150);
        }
      }
    }
  }

  subjectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      subjectBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSubject = btn.dataset.subject;
      updateView();
    });
  });

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
      updateView();
    });
  });

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
  updateView();
});
