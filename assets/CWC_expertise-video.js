(function () {
  'use strict';

  function initSection(sectionEl) {
    if (!sectionEl) return;

    const btn = sectionEl.querySelector('.cwc_expertise-video__play-btn');
    if (!btn) return;

    btn.addEventListener('click', function () {
      const video = sectionEl.querySelector('.cwc_expertise-video__video');
      if (!video) return;

      video.setAttribute('controls', 'controls');
      btn.style.display = 'none';
      const played = video.play();
      if (played && typeof played.catch === 'function') {
        played.catch(function () {});
      }
    });
  }

  function initAllSections() {
    document.querySelectorAll('.cwc_expertise-video').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllSections);
  } else {
    initAllSections();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('.cwc_expertise-video');
    if (section) initSection(section);
  });
})();
