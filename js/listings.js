/* listings.js — fetch, render, filter car listings */

(function () {
  'use strict';

  const API_URL      = 'https://d3apsgxvdweecv.cloudfront.net/public/active-listings.json';
  const grid         = document.getElementById('listingsGrid');
  const emptyState   = document.getElementById('listingsEmpty');
  const filterCount  = document.getElementById('filterCount');
  const fMake        = document.getElementById('f-make');
  const fModel       = document.getElementById('f-model');
  const fFuel        = document.getElementById('f-fuel');
  const fYearMin     = document.getElementById('f-year-min');
  const fYearMax     = document.getElementById('f-year-max');
  const fPriceMin    = document.getElementById('f-price-min');
  const fPriceMax    = document.getElementById('f-price-max');
  const fPowerMin    = document.getElementById('f-power-min');
  const fCapMin      = document.getElementById('f-cap-min');
  const resetBtn     = document.getElementById('filterReset');
  const emptyReset   = document.getElementById('emptyReset');
  const cardTpl      = document.getElementById('cardTemplate');
  const skelTpl      = document.getElementById('skeletonTemplate');

  let allListings = [];

  // ── Formatters ─────────────────────────────────────────────
  function fmt() { return window._fmt || {}; }
  function formatPrice(p)   { return (fmt().formatPrice   || function(x){return x;})(p); }
  function formatMileage(m) { return (fmt().formatMileage || function(x){return x + ' km';})(m); }
  function fuelLabel(f)     { return (fmt().fuelLabel     || function(x){return x;})(f); }
  function cap(s)           { return (fmt().capitalise    || function(x){return x;})(s); }

  // ── Skeletons ──────────────────────────────────────────────
  function showSkeletons(n) {
    grid.innerHTML = '';
    for (let i = 0; i < n; i++) {
      grid.appendChild(skelTpl.content.cloneNode(true));
    }
    emptyState.classList.add('hidden');
  }

  // ── Render cards ───────────────────────────────────────────
  function renderCards(listings) {
    grid.innerHTML = '';

    if (!listings.length) {
      emptyState.classList.remove('hidden');
      filterCount.textContent = 'Brak wyników.';
      return;
    }

    emptyState.classList.add('hidden');
    filterCount.textContent = 'Znaleziono ' + listings.length + ' ogłosze' +
      (listings.length === 1 ? 'nie' : listings.length < 5 ? 'nia' : 'ń') + '.';

    listings.forEach(function (listing) {
      const clone = cardTpl.content.cloneNode(true);
      const card  = clone.querySelector('.car-card');

      const thumb = listing.photos && listing.photos[0]
        ? listing.photos[0].thumbnail : '';
      const img = card.querySelector('.car-card__thumb');
      img.src  = thumb;
      img.alt  = cap(listing.make) + ' ' + cap(listing.model) + ' ' + listing.year;

      card.querySelector('.car-card__fuel-badge').textContent = fuelLabel(listing.fuelType);
      card.querySelector('.car-card__title').textContent =
        cap(listing.make) + ' ' + cap(listing.model);

      card.querySelector('.spec-year    span').textContent = listing.year;
      card.querySelector('.spec-mileage span').textContent = formatMileage(listing.mileage);
      card.querySelector('.spec-power   span').textContent = listing.enginePower + ' KM';
      card.querySelector('.spec-capacity span').textContent =
        (listing.engineCapacity / 1000).toFixed(1) + ' L';

      card.querySelector('.car-card__price').textContent =
        formatPrice(listing.price) + ' PLN';

      function openThis() { window.openModal(listing); }
      card.addEventListener('click', openThis);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openThis(); }
      });

      grid.appendChild(clone);
    });
  }

  // ── Populate filter options ────────────────────────────────
  function populateFilters(listings) {
    const makes = [...new Set(listings.map(function(l){ return l.make; }))].sort();
    const years = [...new Set(listings.map(function(l){ return l.year; }))].sort(function(a,b){return a-b;});

    makes.forEach(function (m) {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = cap(m);
      fMake.appendChild(opt);
    });

    years.forEach(function (y) {
      const o1 = document.createElement('option'), o2 = document.createElement('option');
      o1.value = o2.value = y;
      o1.textContent = o2.textContent = y;
      fYearMin.appendChild(o1);
      fYearMax.appendChild(o2);
    });
  }

  // ── Cascade model select ───────────────────────────────────
  function updateModelSelect(makeVal) {
    fModel.innerHTML = '<option value="">Model</option>';
    if (!makeVal) {
      fModel.disabled = true;
      return;
    }
    const models = [...new Set(
      allListings
        .filter(function(l){ return l.make === makeVal; })
        .map(function(l){ return l.model; })
    )].sort();
    models.forEach(function (m) {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = cap(m);
      fModel.appendChild(opt);
    });
    fModel.disabled = false;
  }

  // ── Apply filters ──────────────────────────────────────────
  function applyFilters() {
    const makeVal     = fMake.value;
    const modelVal    = fModel.value;
    const fuelVal     = fFuel.value;
    const yearMin     = fYearMin.value   ? parseInt(fYearMin.value, 10)   : null;
    const yearMax     = fYearMax.value   ? parseInt(fYearMax.value, 10)   : null;
    const priceMin    = fPriceMin.value  ? parseFloat(fPriceMin.value)    : null;
    const priceMax    = fPriceMax.value  ? parseFloat(fPriceMax.value)    : null;
    const powerMin    = fPowerMin.value  ? parseFloat(fPowerMin.value)    : null;
    const capMin      = fCapMin.value    ? parseFloat(fCapMin.value)      : null;

    const filtered = allListings.filter(function (l) {
      if (makeVal   && l.make     !== makeVal)   return false;
      if (modelVal  && l.model    !== modelVal)  return false;
      if (fuelVal   && l.fuelType !== fuelVal)   return false;
      if (yearMin   && l.year     < yearMin)     return false;
      if (yearMax   && l.year     > yearMax)     return false;
      if (priceMin  && l.price    < priceMin)    return false;
      if (priceMax  && l.price    > priceMax)    return false;
      if (powerMin  && l.enginePower    < powerMin) return false;
      if (capMin    && l.engineCapacity < capMin)   return false;
      return true;
    });

    renderCards(filtered);
  }

  // ── Reset filters ──────────────────────────────────────────
  function resetFilters() {
    fMake.value     = '';
    fModel.innerHTML = '<option value="">Model</option>';
    fModel.disabled = true;
    fFuel.value     = '';
    fYearMin.value  = '';
    fYearMax.value  = '';
    fPriceMin.value = '';
    fPriceMax.value = '';
    fPowerMin.value = '';
    fCapMin.value   = '';
    renderCards(allListings);
  }

  // ── Init listeners ─────────────────────────────────────────
  function initFilters() {
    fMake.addEventListener('change', function () {
      updateModelSelect(fMake.value);
      applyFilters();
    });
    [fModel, fFuel, fYearMin, fYearMax].forEach(function (el) {
      el.addEventListener('change', applyFilters);
    });
    [fPriceMin, fPriceMax, fPowerMin, fCapMin].forEach(function (el) {
      el.addEventListener('input', applyFilters);
    });
    resetBtn.addEventListener('click', resetFilters);
    if (emptyReset) emptyReset.addEventListener('click', resetFilters);
  }

  // ── Fetch & boot ───────────────────────────────────────────
  showSkeletons(6);

  fetch(API_URL)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      allListings = Array.isArray(data) ? data : [];
      populateFilters(allListings);
      initFilters();
      renderCards(allListings);
    })
    .catch(function (err) {
      console.error('Listings fetch error:', err);
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');
      filterCount.textContent = 'Nie udało się pobrać ogłoszeń.';
    });

})();
