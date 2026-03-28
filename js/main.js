/* main.js — navbar, smooth scroll, hamburger, countup, section animations */

(function () {
  'use strict';

  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navMenu   = document.getElementById('navMenu');

  // ── Navbar scroll ──────────────────────────────────────────
  function onScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add('navbar--scrolled');
    } else {
      navbar.classList.remove('navbar--scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Hamburger ──────────────────────────────────────────────
  hamburger.addEventListener('click', function () {
    const isOpen = navMenu.classList.toggle('is-open');
    hamburger.classList.toggle('is-open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    hamburger.setAttribute('aria-label', isOpen ? 'Zamknij menu' : 'Otwórz menu');
  });

  document.addEventListener('click', function (e) {
    if (!navbar.contains(e.target)) {
      navMenu.classList.remove('is-open');
      hamburger.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });

  // ── Smooth scroll with navbar offset ──────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      const href = link.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const navH = navbar.offsetHeight;
      const top  = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top: top, behavior: 'smooth' });
      // Close mobile menu
      navMenu.classList.remove('is-open');
      hamburger.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  // ── Hero video autoplay fallback ───────────────────────────
  const heroVideo = document.querySelector('.hero__video');
  if (heroVideo) {
    heroVideo.play().catch(function () {
      // Autoplay blocked — poster image is shown as fallback
    });
  }

  // ── IntersectionObserver for section entrance ──────────────
  const sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        sectionObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.section').forEach(function (el) {
    sectionObserver.observe(el);
  });

  // ── CountUp animation ──────────────────────────────────────
  function animateCount(el) {
    const target   = parseInt(el.dataset.target, 10);
    const duration = 1800;
    const start    = performance.now();

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const eased    = 1 - (1 - progress) * (1 - progress);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const countObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-card__number[data-target]').forEach(function (el) {
    countObserver.observe(el);
  });

  // ── Contact form ───────────────────────────────────────────
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      let valid = true;

      function setError(inputId, errorId, msg) {
        const input = document.getElementById(inputId);
        const span  = document.getElementById(errorId);
        if (!input) return;
        if (msg) {
          input.classList.add('is-error');
          if (span) span.textContent = msg;
          valid = false;
        } else {
          input.classList.remove('is-error');
          if (span) span.textContent = '';
        }
      }

      const name    = document.getElementById('cf-name');
      const phone   = document.getElementById('cf-phone');
      const email   = document.getElementById('cf-email');
      const message = document.getElementById('cf-message');

      setError('cf-name',    'cf-name-error',    name && !name.value.trim()    ? 'Proszę podać imię i nazwisko.' : '');
      setError('cf-phone',   'cf-phone-error',   phone && !phone.value.trim()  ? 'Proszę podać numer telefonu.' : '');
      setError('cf-message', 'cf-message-error', message && !message.value.trim() ? 'Proszę napisać wiadomość.' : '');

      if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        setError('cf-email', 'cf-email-error', 'Niepoprawny adres e-mail.');
      } else {
        setError('cf-email', 'cf-email-error', '');
      }

      if (!valid) return;

      // TODO: replace stub with real endpoint (Formspree, Netlify Forms, etc.)
      showToast('Wiadomość wysłana! Odpowiemy wkrótce.', 'success');
      contactForm.reset();
    });
  }

  // ── Opinie carousel drag-scroll ───────────────────────────
  const opinieTrack = document.querySelector('.opinie__track');
  if (opinieTrack) {
    let isDown = false, startX, scrollLeft;
    opinieTrack.addEventListener('mousedown', function (e) {
      isDown = true;
      opinieTrack.classList.add('is-dragging');
      startX     = e.pageX - opinieTrack.offsetLeft;
      scrollLeft = opinieTrack.scrollLeft;
    });
    opinieTrack.addEventListener('mouseleave', function () {
      isDown = false;
      opinieTrack.classList.remove('is-dragging');
    });
    opinieTrack.addEventListener('mouseup', function () {
      isDown = false;
      opinieTrack.classList.remove('is-dragging');
    });
    opinieTrack.addEventListener('mousemove', function (e) {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - opinieTrack.offsetLeft;
      opinieTrack.scrollLeft = scrollLeft - (x - startX);
    });

    // Auto-scroll: advance one card every 3s, loop back to start
    var autoScrollTimer = null;
    var cards = opinieTrack.querySelectorAll('.review-card');
    var currentCard = 0;

    function scrollToCard(index) {
      var card = cards[index];
      if (!card) return;
      opinieTrack.scrollTo({ left: card.offsetLeft - opinieTrack.offsetLeft, behavior: 'smooth' });
    }

    function nextCard() {
      currentCard = (currentCard + 1) % cards.length;
      scrollToCard(currentCard);
    }

    function startAutoScroll() {
      if (autoScrollTimer) return;
      autoScrollTimer = setInterval(nextCard, 3000);
    }

    function stopAutoScroll() {
      clearInterval(autoScrollTimer);
      autoScrollTimer = null;
    }

    opinieTrack.addEventListener('mouseenter', stopAutoScroll);
    opinieTrack.addEventListener('mouseleave', startAutoScroll);
    opinieTrack.addEventListener('touchstart', stopAutoScroll, { passive: true });
    opinieTrack.addEventListener('touchend', startAutoScroll, { passive: true });

    startAutoScroll();
  }

  // ── Toast ──────────────────────────────────────────────────
  window.showToast = function (msg, type) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className   = 'toast is-visible' + (type ? ' is-' + type : '');
    setTimeout(function () { toast.className = 'toast'; }, 4000);
  };

})();
