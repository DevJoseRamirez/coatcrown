(function () {
  'use strict';

  function initSection(sectionEl) {
    if (!sectionEl || sectionEl.dataset.cwcInit === 'true') return;
    sectionEl.dataset.cwcInit = 'true';

    // The quote slides; the image pairs cross-fade. Both are driven from one
    // index. The controls live outside both, so they never move.
    const textTrack = sectionEl.querySelector('[data-cwc-track="text"]');
    const mediaTrack = sectionEl.querySelector('[data-cwc-track="media"]');
    if (!textTrack && !mediaTrack) return;

    const prevBtn = sectionEl.querySelector('[data-cwc-prev]');
    const nextBtn = sectionEl.querySelector('[data-cwc-next]');
    const counter = sectionEl.querySelector('[data-cwc-counter]');

    const mediaSlides = mediaTrack ? Array.from(mediaTrack.children) : [];
    const count = (textTrack || mediaTrack).children.length;
    if (!count) return;

    let current = 0;
    let syncing = false;
    let syncTimer = null;
    let readTimer = null;

    function clamp(i) {
      return Math.min(Math.max(i, 0), count - 1);
    }

    function render(index) {
      mediaSlides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      if (counter) counter.textContent = index + 1 + ' / ' + count;
      if (prevBtn) prevBtn.disabled = index <= 0;
      if (nextBtn) nextBtn.disabled = index >= count - 1;
    }

    function goTo(index, behavior) {
      current = clamp(index);

      // Suppress the scroll handler while we drive the track ourselves,
      // otherwise the programmatic scroll feeds back as user input.
      if (textTrack) {
        syncing = true;
        textTrack.scrollTo({
          left: current * textTrack.clientWidth,
          behavior: behavior || 'smooth',
        });

        window.clearTimeout(syncTimer);
        syncTimer = window.setTimeout(function () {
          syncing = false;
        }, 450);
      }

      render(current);
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        goTo(current - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        goTo(current + 1);
      });
    }

    // A swipe on the quote track fades the matching image pair in.
    if (textTrack) {
      textTrack.addEventListener(
        'scroll',
        function () {
          if (syncing) return;
          window.clearTimeout(readTimer);
          readTimer = window.setTimeout(function () {
            if (!textTrack.clientWidth) return;
            const index = clamp(Math.round(textTrack.scrollLeft / textTrack.clientWidth));
            if (index !== current) goTo(index, 'auto');
          }, 90);
        },
        { passive: true }
      );

      // Slide width follows viewport width, so re-anchor after a resize.
      window.addEventListener('resize', function () {
        goTo(current, 'auto');
      });
    }

    render(current);
  }

  function initAllSections() {
    document.querySelectorAll('.cwc_before-after').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllSections);
  } else {
    initAllSections();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('.cwc_before-after');
    if (section) initSection(section);
  });
})();
