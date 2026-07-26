(function () {
  'use strict';

  function initSection(sectionEl) {
    if (!sectionEl || sectionEl.dataset.cwcInit === 'true') return;
    sectionEl.dataset.cwcInit = 'true';

    const track = sectionEl.querySelector('[data-cwc-track]');
    const prevBtn = sectionEl.querySelector('[data-cwc-prev]');
    const nextBtn = sectionEl.querySelector('[data-cwc-next]');
    if (!track || !prevBtn || !nextBtn) return;

    function scrollAmount() {
      const slide = track.querySelector('.cwc_ingredients__slide');
      if (!slide) return track.clientWidth;
      const gap = parseInt(getComputedStyle(track).columnGap, 10) || 0;
      return slide.offsetWidth + gap;
    }

    function updateButtons() {
      const maxScroll = track.scrollWidth - track.clientWidth - 1;
      prevBtn.disabled = track.scrollLeft <= 0;
      nextBtn.disabled = track.scrollLeft >= maxScroll;
    }

    prevBtn.addEventListener('click', function () {
      track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', function () {
      track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
    });

    track.addEventListener('scroll', updateButtons, { passive: true });
    window.addEventListener('resize', updateButtons);
    updateButtons();
  }

  function initAllSections() {
    document.querySelectorAll('.cwc_ingredients').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllSections);
  } else {
    initAllSections();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('.cwc_ingredients');
    if (section) initSection(section);
  });
})();
