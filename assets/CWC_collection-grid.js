(function () {
  'use strict';

  /* Arrows and dots are enhancement only — the track is a native CSS scroll-snap
     carousel on mobile and still swipes with this file absent. */
  function initSection(sectionEl) {
    if (!sectionEl) return;

    const track = sectionEl.querySelector('[data-cwc-track]');
    const prevBtn = sectionEl.querySelector('[data-cwc-prev]');
    const nextBtn = sectionEl.querySelector('[data-cwc-next]');
    const dotsEl = sectionEl.querySelector('[data-cwc-dots]');
    if (!track || !prevBtn || !nextBtn) return;

    let dotCount = 0;

    /* One card plus the gap that follows it — the distance between two card
       start edges, which is what every measurement below is built from. */
    function cardStep() {
      const card = track.querySelector('.cwc_collection-grid__card');
      if (!card || !card.offsetWidth) return 0;
      const gap = parseInt(getComputedStyle(track).columnGap, 10) || 0;
      return card.offsetWidth + gap;
    }

    function cardsPerView() {
      const step = cardStep();
      if (!step) return 1;
      const gap = parseInt(getComputedStyle(track).columnGap, 10) || 0;
      // The trailing card in a view has no gap after it, so add one back before
      // dividing — otherwise 2-up measures as 1.9 and rounds down.
      return Math.max(1, Math.round((track.clientWidth + gap) / step));
    }

    /* A page is one full view of cards. Everything is derived from measured card
       geometry rather than the product count, so it stays right however many
       cards are in view — and collapses to 1 on desktop, where nothing scrolls. */
    function pageStep() {
      return cardsPerView() * cardStep();
    }

    function pageCount() {
      const step = pageStep();
      if (!step || track.scrollWidth <= track.clientWidth + 1) return 1;
      const total = track.querySelectorAll('.cwc_collection-grid__card').length;
      return Math.max(1, Math.ceil(total / cardsPerView()));
    }

    function currentPage() {
      const step = pageStep();
      if (!step) return 0;
      return Math.min(pageCount() - 1, Math.max(0, Math.round(track.scrollLeft / step)));
    }

    function goToPage(index) {
      const maxScroll = track.scrollWidth - track.clientWidth;
      const target = Math.max(0, Math.min(maxScroll, index * pageStep()));
      track.scrollTo({ left: target, behavior: 'smooth' });
    }

    function buildDots(pages) {
      dotsEl.textContent = '';

      // One page means everything is already visible — nothing to signal.
      if (pages <= 1) {
        dotsEl.hidden = true;
        return;
      }

      dotsEl.hidden = false;
      dotsEl.classList.toggle('cwc_collection-grid__dots--many', pages > 10);

      for (let i = 0; i < pages; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'cwc_collection-grid__dot';
        dot.setAttribute('aria-label', 'Go to page ' + (i + 1) + ' of ' + pages);
        dot.addEventListener('click', function () {
          goToPage(i);
        });
        dotsEl.appendChild(dot);
      }
    }

    function updateDots() {
      if (!dotsEl || dotsEl.hidden) return;
      const active = currentPage();
      const dots = dotsEl.children;
      for (let i = 0; i < dots.length; i++) {
        const isActive = i === active;
        dots[i].classList.toggle('cwc_collection-grid__dot--active', isActive);
        if (isActive) {
          dots[i].setAttribute('aria-current', 'true');
        } else {
          dots[i].removeAttribute('aria-current');
        }
      }
    }

    function update() {
      const maxScroll = track.scrollWidth - track.clientWidth - 1;
      prevBtn.disabled = track.scrollLeft <= 0;
      nextBtn.disabled = track.scrollLeft >= maxScroll;

      if (!dotsEl) return;
      // Rebuild only when the page count actually changes — a breakpoint cross
      // or an image finishing layout — not on every scroll frame.
      const pages = pageCount();
      if (pages !== dotCount) {
        dotCount = pages;
        buildDots(pages);
      }
      updateDots();
    }

    /* Arrows step a whole page, not a single card, so one click always advances
       the dots by exactly one. */
    prevBtn.addEventListener('click', function () {
      goToPage(currentPage() - 1);
    });

    nextBtn.addEventListener('click', function () {
      goToPage(currentPage() + 1);
    });

    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  function initAllSections() {
    document.querySelectorAll('.cwc_collection-grid').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllSections);
  } else {
    initAllSections();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('.cwc_collection-grid');
    if (section) initSection(section);
  });
})();
