(function () {
  'use strict';

  function initSection(sectionEl) {
    if (!sectionEl) return;

    const items = sectionEl.querySelectorAll('.cwc_home-faq__item');
    if (!items.length) return;

    items.forEach(function (item) {
      const btn = item.querySelector('.cwc_home-faq__question');
      if (!btn) return;

      btn.addEventListener('click', function () {
        const isOpen = item.classList.contains('is-active');

        // Close all items in this section (single-open accordion)
        items.forEach(function (other) {
          other.classList.remove('is-active');
          const otherBtn = other.querySelector('.cwc_home-faq__question');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
          item.classList.add('is-active');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  function initAllSections() {
    document.querySelectorAll('.cwc_home-faq').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllSections);
  } else {
    initAllSections();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('.cwc_home-faq');
    if (section) initSection(section);
  });
})();
