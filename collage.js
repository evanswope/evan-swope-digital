/* ==========================================================================
   CAMERA COLLAGE INTERACTIVE SHOWCASE CONTROLLER (collage.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const collageDataset = {
    blackcat: {
      name: 'Black Cat & Whiskers',
      side_by_side: {
        src: 'assets/images/pyramidal_blackcat_side_by_side.png',
        caption: '1,338-Piece Physical Ephemera Collage vs. Reference (750x1000) · 3.95s on GPU',
        stat: '-34.2% Error'
      },
      zoom_quad: {
        src: 'assets/images/pyramidal_blackcat_zoom_quad.png',
        caption: 'Macro Zoom: Grocery receipt eyebrows, amber glass irises, and chained white whisker slivers.',
        stat: '238 Slender Ephemera'
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
    spaceneedle: {
      name: 'Seattle Space Needle',
      side_by_side: {
        src: 'assets/images/pyramidal_needle_side_by_side.png',
        caption: 'Seattle Space Needle in Morning Mist (750x1000) vs. Physical Camera Roll Collage · 3.35s on GPU',
        stat: '-19.6% (90th%)'
      },
      zoom_quad: {
        src: 'assets/images/pyramidal_needle_zoom_quad.png',
        caption: 'Macro Zoom: Flying saucer formed of airline ads; bare branches sculpted from vintage text.',
        stat: 'Zonal Allocation'
      },
      blur_test: {
        src: 'assets/images/pyramidal_needle_gestalt_blur_test.png',
        caption: 'Gestalt Low-Frequency Blur Test: Vertical architectural thrust and canopy mass read clearly.',
        stat: 'Gestalt Passed'
      },
      evolution: {
        src: 'assets/images/pyramidal_needle_evolution_strip.png',
        caption: '5-Pass Hierarchy: Ambient Mist → Tower Body → Tripod Legs → Branch Lattice → Spire Highlights.',
        stat: '5 Scale Tiers'
      }
    },
    barex: {
      name: 'Dual Portrait (Bar Reunion)',
      side_by_side: {
        src: 'assets/images/pyramidal_barex_side_by_side.png',
        caption: 'Dual Portrait Reunion at the Bar (1000x750) vs. 1,272-Piece Physical Collage · 3.17s on GPU',
        stat: '-38.8% Error'
      },
      zoom_quad: {
        src: 'assets/images/pyramidal_barex_zoom_quad.png',
        caption: 'Macro Zoom: Ex\'s crimson cap from red stickers; Evan\'s blond crest from candy wrappers; porcelain teeth.',
        stat: '57 Feature Anchors'
      },
      blur_test: {
        src: 'assets/images/pyramidal_barex_gestalt_blur_test.png',
        caption: 'Gestalt Low-Frequency Blur Test: Dual smiles, red cap, coral shirt, and tavern ambient lighting.',
        stat: 'Gestalt Passed'
      },
      evolution: {
        src: 'assets/images/pyramidal_barex_evolution_strip.png',
        caption: '5-Pass Hierarchy: Tavern Atmosphere → Figures → Facial Planes → Anatomical Lattice → Enamel Highlights.',
        stat: '5 Scale Tiers'
      }
    },
    tomato: {
      name: 'Tomato Culinary Still Life',
      side_by_side: {
        src: 'assets/images/pyramidal_tomato_side_by_side.png',
        caption: 'Ripe Vine Tomatoes & Basil on Wooden Board vs. 1,218-Piece Physical Collage (1000x1000) · 4.24s on GPU',
        stat: '-53.2% Error'
      },
      zoom_quad: {
        src: 'assets/images/pyramidal_tomato_specular_zoom.png',
        caption: 'Macro Zoom: Glistening gelatinous locule seed pockets, pale placental tissue, and glossy leaf glints.',
        stat: 'Specular Catchlights'
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
    }
  };

  let currentSubject = 'blackcat';
  let currentMode = 'side_by_side';

  const imgEl = document.getElementById('collage-display-img');
  const captionTextEl = document.getElementById('collage-caption-text');
  const captionStatEl = document.getElementById('collage-caption-stat');
  const subjectBtns = document.querySelectorAll('.collage-subject-btn');
  const modeBtns = document.querySelectorAll('.collage-mode-btn');
  const drawerToggleBtn = document.getElementById('btn-toggle-case-study');
  const drawerEl = document.getElementById('collage-case-study-drawer');

  function updateView() {
    if (!imgEl || !collageDataset[currentSubject]) return;
    const data = collageDataset[currentSubject][currentMode];
    if (!data) return;

    imgEl.style.opacity = '0';
    setTimeout(() => {
      imgEl.src = data.src;
      imgEl.alt = `${collageDataset[currentSubject].name} - ${currentMode}`;
      if (captionTextEl) captionTextEl.textContent = data.caption;
      if (captionStatEl) captionStatEl.textContent = data.stat;
      imgEl.style.opacity = '1';
    }, 150);
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
});
