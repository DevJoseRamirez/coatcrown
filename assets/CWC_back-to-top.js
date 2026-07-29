(function () {
  'use strict';

  function initSection(sectionEl) {
    if (!sectionEl) return;

    var button = sectionEl.querySelector('.cwc_back-to-top__button');
    if (!button) return;

    var showAfter = parseInt(sectionEl.dataset.showAfter, 10);
    if (isNaN(showAfter)) showAfter = 400;

    function toggleVisibility() {
      sectionEl.classList.toggle('cwc_back-to-top--visible', window.scrollY > showAfter);
    }

    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();
  }

  function initAllSections() {
    document.querySelectorAll('.cwc_back-to-top').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllSections);
  } else {
    initAllSections();
  }

  document.addEventListener('shopify:section:load', function (event) {
    var section = event.target.querySelector('.cwc_back-to-top');
    if (section) initSection(section);
  });
})();
