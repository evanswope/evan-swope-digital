/* ==========================================================================
   EVAN SWOPE - PORTFOLIO INTERACTION LOGIC (app.js)
   Cleaned & Pruned (Zero Dead Background CPU Loops / Obsolete Listeners)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // --------------------------------------------------------------------------
  // 0. MOBILE MENU
  // --------------------------------------------------------------------------
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenuClose = document.getElementById('mobile-menu-close');
  const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
  
  if (mobileMenuToggle && mobileMenuClose && mobileNavOverlay) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileNavOverlay.classList.add('is-active');
    });
    
    mobileMenuClose.addEventListener('click', () => {
      mobileNavOverlay.classList.remove('is-active');
    });
    
    // Close menu when a link is clicked
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileNavOverlay.classList.remove('is-active');
      });
    });
  }

  // --------------------------------------------------------------------------
  // 1. LIGHTBOX GALLERY
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
    let lastFocusedElement = null;
    
    function updateLightbox() {
      if (!currentGallery || currentGallery.length === 0) return;
      const mediaUrl = currentGallery[currentIndex];
      lightboxContainer.innerHTML = '';
      
      if (mediaUrl.toLowerCase().endsWith('.mp4') || mediaUrl.toLowerCase().endsWith('.webm')) {
        const video = document.createElement('video');
        video.src = mediaUrl;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.controls = true;
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
      lastFocusedElement = document.activeElement;
      currentGallery = galleryArray;
      currentIndex = 0;
      updateLightbox();
      lightboxModal.classList.add('is-active');
      lightboxModal.setAttribute('aria-hidden', 'false');
      lightboxModal.setAttribute('aria-modal', 'true');
      lightboxModal.setAttribute('role', 'dialog');
      document.body.style.overflow = 'hidden';
      setTimeout(() => { if (closeBtn) closeBtn.focus(); }, 50);
    }
    
    function closeLightbox() {
      lightboxModal.classList.remove('is-active');
      lightboxModal.setAttribute('aria-hidden', 'true');
      lightboxModal.removeAttribute('aria-modal');
      setTimeout(() => { lightboxContainer.innerHTML = ''; }, 300);
      document.body.style.overflow = '';
      currentGallery = [];
      if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
      }
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
    
    document.querySelectorAll('.project-card-front').forEach(frontFace => {
      frontFace.addEventListener('click', (e) => {
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
    
    document.addEventListener('keydown', (e) => {
      if (!lightboxModal.classList.contains('is-active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    });
  }

  // --------------------------------------------------------------------------
  // 2. INTERACTIVE CARD FLIP TOGGLE & WCAG KEYBOARD NAVIGATION
  // --------------------------------------------------------------------------
  document.querySelectorAll('.project-card-container').forEach(card => {
    // Initialize accessibility attributes
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-expanded', 'false');
    
    const toggleFlip = (e) => {
      if (e.target.closest('a[href]')) return;
      card.classList.toggle('is-flipped');
      const isFlipped = card.classList.contains('is-flipped');
      card.setAttribute('aria-expanded', isFlipped);
    };

    card.addEventListener('click', toggleFlip);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('a[href]')) return;
        e.preventDefault();
        toggleFlip(e);
      }
    });
  });


  // --------------------------------------------------------------------------
  // 3. SMART STICKY NAVBAR (Elegant Auto-Hide on Scroll Down)
  // --------------------------------------------------------------------------
  const header = document.querySelector('.site-header');
  if (header) {
    let lastScrollY = window.scrollY;
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          // Hide when scrolling down past 70px; reveal immediately when scrolling up or at top
          if (currentScrollY > lastScrollY && currentScrollY > 70) {
            header.classList.add('is-hidden');
          } else {
            header.classList.remove('is-hidden');
          }
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }


  // --------------------------------------------------------------------------
  // 4. ANTI-SCRAPE SECURE EMAIL ASSEMBLER
  // --------------------------------------------------------------------------
  document.querySelectorAll('.js-secure-email').forEach(link => {
    const u = link.dataset.u;
    const d = link.dataset.d;
    if (u && d) {
      const addr = `${u}@${d}`;
      link.href = `mailto:${addr}`;
      const span = link.querySelector('span');
      if (span) span.textContent = addr;
    }
  });

  // --------------------------------------------------------------------------
  // 5. AI LAB TEASER CAROUSEL & MEDIA SLIDESHOW CONTROLLER
  // --------------------------------------------------------------------------
  const labTrack = document.getElementById('lab-carousel-track');
  const labSlides = document.querySelectorAll('.lab-carousel-slide');
  const labDots = document.querySelectorAll('#lab-carousel-dots .lab-dot');
  const labPrevBtn = document.getElementById('lab-carousel-prev');
  const labNextBtn = document.getElementById('lab-carousel-next');

  let currentLabIndex = 0;

  function updateLabCarousel() {
    if (!labTrack || labSlides.length === 0) return;
    labTrack.style.transform = `translateX(-${currentLabIndex * 100}%)`;
    labDots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentLabIndex);
    });
    // Video play/pause management for active slide
    labSlides.forEach((slide, idx) => {
      const video = slide.querySelector('video');
      if (video) {
        if (idx === currentLabIndex) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });
  }

  if (labPrevBtn && labNextBtn) {
    labPrevBtn.addEventListener('click', () => {
      if (labSlides.length <= 1) return;
      currentLabIndex = (currentLabIndex - 1 + labSlides.length) % labSlides.length;
      updateLabCarousel();
    });

    labNextBtn.addEventListener('click', () => {
      if (labSlides.length <= 1) return;
      currentLabIndex = (currentLabIndex + 1) % labSlides.length;
      updateLabCarousel();
    });

    // Dim navigation arrows if only 1 slide exists
    if (labSlides.length <= 1) {
      labPrevBtn.style.opacity = '0.35';
      labPrevBtn.style.cursor = 'default';
      labNextBtn.style.opacity = '0.35';
      labNextBtn.style.cursor = 'default';
    } else {
      labPrevBtn.style.opacity = '1';
      labPrevBtn.style.cursor = 'pointer';
      labNextBtn.style.opacity = '1';
      labNextBtn.style.cursor = 'pointer';
    }
  }

  labDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const slideTo = parseInt(dot.getAttribute('data-slide-to'), 10);
      if (!isNaN(slideTo)) {
        currentLabIndex = slideTo;
        updateLabCarousel();
      }
    });
  });

  // Touch Swipe for Mobile Carousel
  let labTouchStartX = 0;
  let labTouchEndX = 0;
  if (labTrack) {
    labTrack.addEventListener('touchstart', e => {
      labTouchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    labTrack.addEventListener('touchend', e => {
      labTouchEndX = e.changedTouches[0].screenX;
      const diff = labTouchEndX - labTouchStartX;
      if (Math.abs(diff) > 45) {
        if (diff < 0) {
          currentLabIndex = (currentLabIndex + 1) % labSlides.length;
        } else {
          currentLabIndex = (currentLabIndex - 1 + labSlides.length) % labSlides.length;
        }
        updateLabCarousel();
      }
    }, { passive: true });
  }

  // Inner Media Slideshow for Card Previews
  document.querySelectorAll('.lab-card-media-wrapper').forEach(wrapper => {
    const images = wrapper.querySelectorAll('.lab-slide-img');
    const dots = wrapper.querySelectorAll('.lab-media-dot');
    if (images.length <= 1) return;

    let imgIdx = 0;
    let slideTimer = null;

    function showImage(index) {
      imgIdx = index;
      images.forEach((img, i) => img.classList.toggle('active', i === imgIdx));
      dots.forEach((dot, i) => dot.classList.toggle('active', i === imgIdx));
    }

    function startAutoCycle() {
      if (slideTimer) clearInterval(slideTimer);
      slideTimer = setInterval(() => {
        showImage((imgIdx + 1) % images.length);
      }, 3500);
    }

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        showImage(i);
        startAutoCycle();
      });
    });

    wrapper.addEventListener('mouseenter', () => clearInterval(slideTimer));
    wrapper.addEventListener('mouseleave', startAutoCycle);

    startAutoCycle();
  });

});

