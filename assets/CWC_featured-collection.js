(function () {
  'use strict';

  function initSection(sectionEl) {
    if (!sectionEl) return;

    const track = sectionEl.querySelector('[data-cwc-track]');
    const prevBtn = sectionEl.querySelector('[data-cwc-prev]');
    const nextBtn = sectionEl.querySelector('[data-cwc-next]');
    if (!track || !prevBtn || !nextBtn) return;

    function scrollAmount() {
      const card = track.querySelector('.cwc_featured-collection__card');
      if (!card) return track.clientWidth;
      const gap = parseInt(getComputedStyle(track).columnGap, 10) || 0;
      return card.offsetWidth + gap;
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
    document.querySelectorAll('.cwc_featured-collection').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllSections);
  } else {
    initAllSections();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('.cwc_featured-collection');
    if (section) initSection(section);
  });
})();
