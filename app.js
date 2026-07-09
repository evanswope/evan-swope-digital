/* ==========================================================================
   EVAN SWOPE - PORTFOLIO INTERACTION LOGIC (app.js)
   Cleaned & Pruned (Zero Dead Background CPU Loops / Obsolete Listeners)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
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
      if (e.target.closest('button, a') && e.target !== card) return;
      card.classList.toggle('is-flipped');
      const isFlipped = card.classList.contains('is-flipped');
      card.setAttribute('aria-expanded', isFlipped);
    };

    card.addEventListener('click', toggleFlip);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('button, a')) return;
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

});
