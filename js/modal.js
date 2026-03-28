/* modal.js — car detail lightbox with photo gallery */

(function () {
  'use strict';

  const modal          = document.getElementById('carModal');
  const backdrop       = modal.querySelector('.modal__backdrop');
  const closeBtn       = document.getElementById('modalClose');
  const galleryTrack   = document.getElementById('galleryTrack');
  const galleryPrev    = document.getElementById('galleryPrev');
  const galleryNext    = document.getElementById('galleryNext');
  const galleryCounter = document.getElementById('galleryCounter');
  const galleryThumbs  = document.getElementById('galleryThumbs');
  const modalTitle     = document.getElementById('modalCarTitle');
  const modalPrice     = document.getElementById('modalPrice');
  const modalSpecs     = document.getElementById('modalSpecs');
  const listingLink    = document.getElementById('modalListingLink');

  let currentIndex   = 0;
  let totalSlides    = 0;
  let lastFocused    = null;
  let touchStartX    = 0;

  // ── Open modal ─────────────────────────────────────────────
  window.openModal = function (listing) {
    lastFocused = document.activeElement;

    modalTitle.textContent = capitalise(listing.make) + ' ' + capitalise(listing.model);
    modalPrice.textContent = formatPrice(listing.price) + ' PLN';

    buildSpecs(listing);
    buildGallery(listing.photos || []);

    if (listing.url) {
      listingLink.href = listing.url;
      listingLink.hidden = false;
    } else {
      listingLink.hidden = true;
    }

    // Lock scroll without position:fixed jump
    document.body.dataset.scrollY = window.scrollY;
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height   = '100%';

    modal.hidden = false;
    closeBtn.focus();
  };

  // ── Close modal ────────────────────────────────────────────
  window.closeModal = function () {
    modal.hidden = true;

    // Restore scroll lock
    document.documentElement.style.overflow = '';
    document.documentElement.style.height   = '';

    if (lastFocused) lastFocused.focus();
  };

  // ── Build gallery ──────────────────────────────────────────
  function buildGallery(photos) {
    galleryTrack.innerHTML = '';
    galleryThumbs.innerHTML = '';
    currentIndex = 0;
    totalSlides  = photos.length;

    photos.forEach(function (photo, i) {
      // Main slide — lazy via data-src
      const img = document.createElement('img');
      img.dataset.src = photo.main;
      img.alt         = 'Zdjęcie ' + (i + 1);
      img.style.cssText = 'flex-shrink:0;width:100%;height:100%;object-fit:cover;';
      galleryTrack.appendChild(img);

      // Thumbnail
      const thumb = document.createElement('img');
      thumb.src            = photo.thumbnail;
      thumb.alt            = 'Miniatura ' + (i + 1);
      thumb.className      = 'gallery__thumb' + (i === 0 ? ' is-active' : '');
      thumb.role           = 'listitem';
      thumb.dataset.index  = i;
      thumb.addEventListener('click', function () { goToSlide(i); });
      galleryThumbs.appendChild(thumb);
    });

    goToSlide(0);
  }

  // ── Go to slide ────────────────────────────────────────────
  function goToSlide(index) {
    if (totalSlides === 0) return;
    currentIndex = (index + totalSlides) % totalSlides;

    galleryTrack.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
    galleryCounter.textContent   = (currentIndex + 1) + ' / ' + totalSlides;

    // Lazy-load current + neighbours
    [-1, 0, 1].forEach(function (offset) {
      const i   = (currentIndex + offset + totalSlides) % totalSlides;
      const img = galleryTrack.children[i];
      if (img && img.dataset.src && !img.src) {
        img.src = img.dataset.src;
      }
    });

    // Update thumbnails
    galleryThumbs.querySelectorAll('.gallery__thumb').forEach(function (t, i) {
      t.classList.toggle('is-active', i === currentIndex);
    });

    // Scroll active thumb into view
    const activeThumb = galleryThumbs.children[currentIndex];
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  // ── Build specs ────────────────────────────────────────────
  function buildSpecs(listing) {
    const specs = [
      { label: 'Rok',         value: listing.year },
      { label: 'Przebieg',    value: formatMileage(listing.mileage) },
      { label: 'Moc',         value: listing.enginePower + ' KM' },
      { label: 'Pojemność',   value: (listing.engineCapacity / 1000).toFixed(1) + ' L' },
      { label: 'Paliwo',      value: fuelLabel(listing.fuelType) },
      { label: 'Nr ogłoszenia', value: listing.advertId },
    ];

    modalSpecs.innerHTML = '';
    specs.forEach(function (s) {
      const li    = document.createElement('li');
      li.className = 'modal__spec-item';
      li.innerHTML = '<span class="modal__spec-label">' + s.label + '</span>'
                   + '<span class="modal__spec-value">' + s.value + '</span>';
      modalSpecs.appendChild(li);
    });
  }

  // ── Arrow buttons ──────────────────────────────────────────
  galleryPrev.addEventListener('click', function () { goToSlide(currentIndex - 1); });
  galleryNext.addEventListener('click', function () { goToSlide(currentIndex + 1); });

  // ── Close triggers ─────────────────────────────────────────
  closeBtn.addEventListener('click', window.closeModal);
  backdrop.addEventListener('click', window.closeModal);

  // ── Keyboard ───────────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (modal.hidden) return;
    if (e.key === 'Escape')     window.closeModal();
    if (e.key === 'ArrowLeft')  goToSlide(currentIndex - 1);
    if (e.key === 'ArrowRight') goToSlide(currentIndex + 1);
    if (e.key === 'Tab')        trapFocus(e);
  });

  // ── Touch / swipe ──────────────────────────────────────────
  galleryTrack.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  galleryTrack.addEventListener('touchend', function (e) {
    const delta = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      goToSlide(delta > 0 ? currentIndex + 1 : currentIndex - 1);
    }
  }, { passive: true });

  // ── Focus trap ─────────────────────────────────────────────
  function trapFocus(e) {
    const panel       = modal.querySelector('.modal__panel');
    const focusable   = Array.from(panel.querySelectorAll(
      'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ));
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) { last.focus(); e.preventDefault(); }
    } else {
      if (document.activeElement === last)  { first.focus(); e.preventDefault(); }
    }
  }

  // ── Formatters (shared with listings.js via window) ───────
  function formatPrice(p) { return p.toLocaleString('pl-PL'); }
  function formatMileage(m) { return m.toLocaleString('pl-PL') + ' km'; }
  function fuelLabel(f) { return { petrol: 'Benzyna', diesel: 'Diesel' }[f] || f; }
  function capitalise(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  // Expose formatters for listings.js
  window._fmt = { formatPrice, formatMileage, fuelLabel, capitalise };

})();
