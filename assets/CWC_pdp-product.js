(function () {
  'use strict';

  function initGallery(sectionEl) {
    const stage = sectionEl.querySelector('[data-cwc-stage]');
    if (!stage) return;

    const slides = Array.from(stage.querySelectorAll('[data-cwc-slide]'));
    const thumbs = Array.from(sectionEl.querySelectorAll('[data-cwc-thumb]'));
    const dots = Array.from(sectionEl.querySelectorAll('[data-cwc-dot]'));
    const thumbTrack = sectionEl.querySelector('[data-cwc-thumbs]');
    const thumbPrev = sectionEl.querySelector('[data-cwc-thumb-prev]');
    const thumbNext = sectionEl.querySelector('[data-cwc-thumb-next]');

    function setActive(index) {
      thumbs.forEach(function (thumb, i) {
        thumb.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function slideStart(slide) {
      return slide.offsetLeft - stage.offsetLeft;
    }

    /* Slides are centred in the scrollport, not flush left — on mobile they are
       narrower than the stage so the neighbours peek in at both edges. On
       desktop a slide fills the stage and this reduces to its left edge. */
    function goTo(index) {
      const slide = slides[index];
      if (!slide) return;
      const maxScroll = stage.scrollWidth - stage.clientWidth;
      const centered = slideStart(slide) - (stage.clientWidth - slide.offsetWidth) / 2;
      stage.scrollTo({
        left: Math.max(0, Math.min(maxScroll, centered)),
        behavior: 'smooth',
      });
      setActive(index);
    }

    // Whichever slide's centre sits nearest the middle of the scrollport is the
    // one being looked at — works for a peek layout and a full-width one alike.
    function currentIndex() {
      const viewCenter = stage.scrollLeft + stage.clientWidth / 2;
      let closest = 0;
      let shortest = Infinity;

      slides.forEach(function (slide, i) {
        const distance = Math.abs(slideStart(slide) + slide.offsetWidth / 2 - viewCenter);
        if (distance < shortest) {
          shortest = distance;
          closest = i;
        }
      });

      return closest;
    }

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        goTo(parseInt(thumb.dataset.index, 10) || 0);
      });
    });

    // Keep thumbs/dots in sync when the stage is swiped directly.
    stage.addEventListener(
      'scroll',
      function () {
        setActive(currentIndex());
      },
      { passive: true }
    );

    if (thumbTrack && thumbPrev && thumbNext) {
      function thumbStep() {
        const thumb = thumbTrack.querySelector('[data-cwc-thumb]');
        if (!thumb) return thumbTrack.clientWidth;
        const gap = parseInt(getComputedStyle(thumbTrack).columnGap, 10) || 0;
        return thumb.offsetWidth + gap;
      }

      function updateThumbArrows() {
        const maxScroll = thumbTrack.scrollWidth - thumbTrack.clientWidth - 1;
        thumbPrev.disabled = thumbTrack.scrollLeft <= 0;
        thumbNext.disabled = thumbTrack.scrollLeft >= maxScroll;
      }

      thumbPrev.addEventListener('click', function () {
        thumbTrack.scrollBy({ left: -thumbStep(), behavior: 'smooth' });
      });

      thumbNext.addEventListener('click', function () {
        thumbTrack.scrollBy({ left: thumbStep(), behavior: 'smooth' });
      });

      thumbTrack.addEventListener('scroll', updateThumbArrows, { passive: true });
      window.addEventListener('resize', updateThumbArrows);
      updateThumbArrows();
    }
  }

  function initBundles(sectionEl) {
    const inputs = Array.from(sectionEl.querySelectorAll('[data-cwc-bundle]'));
    if (!inputs.length) return;

    const variantInput = sectionEl.querySelector('[data-cwc-variant-input]');
    const priceEl = sectionEl.querySelector('[data-cwc-price]');
    const compareEl = sectionEl.querySelector('[data-cwc-compare]');
    const saveEl = sectionEl.querySelector('[data-cwc-save]');

    function select(input) {
      inputs.forEach(function (other) {
        const card = other.closest('.cwc_pdp-product__bundle');
        if (card) card.classList.toggle('is-selected', other === input);
      });

      // The hidden input is what ProductFormComponent submits, so it must
      // always track the chosen variant.
      if (variantInput) {
        variantInput.value = input.dataset.variantId || input.value;
        variantInput.disabled = false;
      }

      if (priceEl && input.dataset.price) priceEl.textContent = input.dataset.price;

      if (compareEl) {
        const compare = input.dataset.compare || '';
        compareEl.textContent = compare;
        compareEl.classList.toggle('cwc_pdp-product__compare--hidden', compare === '');
      }

      if (saveEl) {
        const save = input.dataset.save || '';
        saveEl.textContent = save;
        saveEl.classList.toggle('cwc_pdp-product__save--hidden', save === '');
      }
    }

    inputs.forEach(function (input) {
      input.addEventListener('change', function () {
        if (input.checked) select(input);
      });
    });
  }

  function initFaq(sectionEl) {
    const toggles = Array.from(sectionEl.querySelectorAll('[data-cwc-faq-toggle]'));

    toggles.forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        const item = toggle.closest('.cwc_pdp-product__faq-item');
        if (!item) return;
        const isOpen = item.classList.contains('is-open');
        item.classList.toggle('is-open', !isOpen);
        toggle.setAttribute('aria-expanded', String(!isOpen));
      });
    });
  }

  function initSection(sectionEl) {
    if (!sectionEl || sectionEl.dataset.cwcInit === 'true') return;
    sectionEl.dataset.cwcInit = 'true';
    initGallery(sectionEl);
    initBundles(sectionEl);
    initFaq(sectionEl);
  }

  function initAllSections() {
    document.querySelectorAll('.cwc_pdp-product').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllSections);
  } else {
    initAllSections();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('.cwc_pdp-product');
    if (section) initSection(section);
  });
})();
