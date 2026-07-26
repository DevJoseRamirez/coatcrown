(function () {
  'use strict';

  function initSection(sectionEl) {
    if (!sectionEl || sectionEl.dataset.cwcInit === 'true') return;
    sectionEl.dataset.cwcInit = 'true';

    const toggles = Array.from(sectionEl.querySelectorAll('[data-cwc-faq-toggle]'));

    toggles.forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        const item = toggle.closest('.cwc_pdp-faq__item');
        if (!item) return;
        const isOpen = item.classList.contains('is-open');
        item.classList.toggle('is-open', !isOpen);
        toggle.setAttribute('aria-expanded', String(!isOpen));
      });
    });
  }

  function initAllSections() {
    document.querySelectorAll('.cwc_pdp-faq').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllSections);
  } else {
    initAllSections();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('.cwc_pdp-faq');
    if (section) initSection(section);
  });
})();
