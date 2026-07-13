(function () {
  'use strict';

  function initSection(sectionEl) {
    if (!sectionEl) return;

    sectionEl.querySelectorAll('.cwc_video-text__play-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const inner = btn.closest('.cwc_video-text__video-inner');
        if (!inner) return;
        const video = inner.querySelector('video');
        if (!video) return;

        video.setAttribute('controls', 'controls');
        btn.style.display = 'none';
        const played = video.play();
        if (played && typeof played.catch === 'function') {
          played.catch(function () {});
        }
      });
    });
  }

  function initAllSections() {
    document.querySelectorAll('.cwc_video-text').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllSections);
  } else {
    initAllSections();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('.cwc_video-text');
    if (section) initSection(section);
  });
})();
