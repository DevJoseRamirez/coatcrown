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

  /* Every figure on the page is a function of two choices — which variant and
     whether a subscription is on — so both pickers write into one controller
     rather than each writing to the DOM on its own. */
  function createPricing(sectionEl) {
    const priceEl = sectionEl.querySelector('[data-cwc-price]');
    const compareEl = sectionEl.querySelector('[data-cwc-compare]');
    const saveEl = sectionEl.querySelector('[data-cwc-save]');
    const variantInput = sectionEl.querySelector('[data-cwc-variant-input]');
    const bundleInputs = Array.from(sectionEl.querySelectorAll('[data-cwc-bundle]'));
    // The sticky bar quotes the same figure as the buy box, so it is driven
    // from here rather than kept in step by hand.
    const stickyPriceEl = sectionEl.querySelector('[data-cwc-sticky-price]');

    // What Liquid already rendered, so a buy box with no bundle cards still has
    // one-time figures to fall back to.
    let oneTime = {
      price: priceEl ? priceEl.textContent.trim() : '',
      compare: compareEl ? compareEl.textContent.trim() : '',
      save: saveEl ? saveEl.textContent.trim() : '',
    };
    let variantId = variantInput ? variantInput.value : '';
    let planPrices = {};
    let planActive = false;

    function setText(el, value, hiddenClass) {
      if (!el) return;
      const text = value || '';
      el.textContent = text;
      if (hiddenClass) el.classList.toggle(hiddenClass, text === '');
    }

    function render() {
      const shown = (planActive && planPrices[variantId]) || oneTime;
      if (shown.price) setText(priceEl, shown.price);
      if (shown.price) setText(stickyPriceEl, shown.price);
      setText(compareEl, shown.compare, 'cwc_pdp-product__compare--hidden');
      setText(saveEl, shown.save, 'cwc_pdp-product__save--hidden');

      // Each card carries its own variant, so a plan swap has to walk them all
      // rather than only the selected one.
      bundleInputs.forEach(function (input) {
        const card = input.closest('.cwc_pdp-product__bundle');
        if (!card) return;
        const cardPlan = planActive ? planPrices[input.dataset.variantId] : null;
        setText(card.querySelector('.cwc_pdp-product__bundle-price'), cardPlan ? cardPlan.price : input.dataset.price);
        setText(
          card.querySelector('.cwc_pdp-product__bundle-compare'),
          cardPlan ? cardPlan.compare : input.dataset.compare,
          'cwc_pdp-product__bundle-compare--hidden'
        );
      });
    }

    return {
      selectVariant: function (id, oneTimeFigures) {
        variantId = id;
        if (oneTimeFigures) oneTime = oneTimeFigures;
        render();
      },
      setPlanPrices: function (prices) {
        planPrices = prices || {};
      },
      setPlanActive: function (active) {
        planActive = active;
        render();
      },
      isPlanActive: function () {
        return planActive;
      },
    };
  }

  function initBundles(sectionEl, pricing) {
    const inputs = Array.from(sectionEl.querySelectorAll('[data-cwc-bundle]'));
    if (!inputs.length) return;

    const variantInput = sectionEl.querySelector('[data-cwc-variant-input]');

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

      pricing.selectVariant(input.dataset.variantId || input.value, {
        price: input.dataset.price || '',
        compare: input.dataset.compare || '',
        save: input.dataset.save || '',
      });
    }

    inputs.forEach(function (input) {
      input.addEventListener('change', function () {
        if (input.checked) select(input);
      });
    });
  }

  function initSellingPlan(sectionEl, pricing) {
    const group = sectionEl.querySelector('[data-cwc-plan-group]');
    if (!group) return;

    const radios = Array.from(group.querySelectorAll('[data-cwc-plan]'));
    const planInput = group.querySelector('[data-cwc-plan-input]');
    const pricesEl = group.querySelector('[data-cwc-plan-prices]');

    try {
      pricing.setPlanPrices(JSON.parse(pricesEl ? pricesEl.textContent : '{}'));
    } catch (error) {
      pricing.setPlanPrices({});
    }

    function select(radio) {
      radios.forEach(function (other) {
        const card = other.closest('.cwc_pdp-product__plan');
        if (card) card.classList.toggle('is-selected', other === radio);
      });

      // A one-time purchase must submit no selling_plan at all, so the input is
      // disabled rather than emptied.
      const planId = radio.dataset.planId || '';
      if (planInput) {
        planInput.value = planId;
        planInput.disabled = planId === '';
      }

      pricing.setPlanActive(planId !== '');
    }

    radios.forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (radio.checked) select(radio);
      });
    });

    // Applies the plan pricing on load when the subscription starts selected.
    const checked = radios.filter(function (radio) {
      return radio.checked;
    })[0];
    if (checked) select(checked);
  }

  /* The sticky bar stands in for the Add To Cart button, so it appears only
     once that button has scrolled off the top — never while it is still below
     the fold on first paint. */
  function initStickyVisibility(sectionEl, bar) {
    const watched = sectionEl.querySelector('.cwc_pdp-product__buy');

    if (!watched || typeof IntersectionObserver === 'undefined') {
      // No Add To Cart block on the page (or no observer support) — fall back to
      // a plain scroll distance so the bar is still reachable.
      const onScroll = function () {
        bar.classList.toggle('is-visible', window.scrollY > 600);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      return;
    }

    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        bar.classList.toggle('is-visible', !entry.isIntersecting && entry.boundingClientRect.top < 0);
      });
    }).observe(watched);
  }

  /* The bar sits inside the same product form as the buy box, so it holds no
     variant or purchase type of its own — its picker drives the buy box's, and
     its figures come back through the same pricing controller. */
  function initSticky(sectionEl, pricing) {
    const bar = sectionEl.querySelector('[data-cwc-sticky]');
    if (!bar) return;

    initStickyVisibility(sectionEl, bar);

    const select = bar.querySelector('[data-cwc-sticky-select]');
    if (!select) return;

    const optionEl = bar.querySelector('[data-cwc-sticky-option]');
    const unitEl = bar.querySelector('[data-cwc-sticky-unit]');
    const variantInput = sectionEl.querySelector('[data-cwc-variant-input]');

    function renderPicker() {
      const option = select.options[select.selectedIndex];
      if (!option) return;
      if (optionEl) optionEl.textContent = option.textContent.trim();
      // A per-unit figure is a one-time price, so it is cleared rather than left
      // standing against subscription pricing.
      if (unitEl) unitEl.textContent = pricing.isPlanActive() ? '' : option.dataset.unit || '';
    }

    select.addEventListener('change', function () {
      const option = select.options[select.selectedIndex];
      const bundle = sectionEl.querySelector('[data-cwc-bundle][data-variant-id="' + select.value + '"]');

      if (bundle) {
        // The bundle cards are the buy box's own picker — letting them handle
        // the change keeps the cards, the price and the form input in step.
        bundle.checked = true;
        bundle.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (variantInput) {
        // No cards in the buy box, so this picker is the only one.
        variantInput.value = select.value;
        variantInput.disabled = false;
        pricing.selectVariant(select.value, {
          price: option.dataset.price || '',
          compare: option.dataset.compare || '',
          save: option.dataset.save || '',
        });
      }

      renderPicker();
    });

    // Both the bundle cards and the purchase type toggle bubble their change
    // up to the section, which is the one place that sees either.
    sectionEl.addEventListener('change', function (event) {
      const bundle = event.target.closest('[data-cwc-bundle]');
      if (bundle) select.value = bundle.dataset.variantId || bundle.value;
      if (bundle || event.target.closest('[data-cwc-plan]')) renderPicker();
    });

    renderPicker();
  }

  function initReviews(sectionEl) {
    const group = sectionEl.querySelector('[data-cwc-reviews]');
    if (!group) return;

    const reviews = Array.from(group.querySelectorAll('[data-cwc-review]'));
    if (reviews.length < 2) return;

    const interval = parseInt(group.dataset.interval, 10) || 5000;
    let index = reviews.findIndex(function (review) {
      return review.classList.contains('is-active');
    });
    if (index < 0) index = 0;

    function show(next) {
      reviews.forEach(function (review, i) {
        const isActive = i === next;
        review.classList.toggle('is-active', isActive);
        // The faded-out quotes are still in the layout, so they have to be
        // hidden from assistive tech as well as from the eye.
        if (isActive) {
          review.removeAttribute('aria-hidden');
        } else {
          review.setAttribute('aria-hidden', 'true');
        }
      });
      index = next;
    }

    let timer = setInterval(function () {
      show((index + 1) % reviews.length);
    }, interval);

    // A shopper reading a quote should not have it swapped out from under them.
    group.addEventListener('mouseenter', function () {
      clearInterval(timer);
      timer = null;
    });

    group.addEventListener('mouseleave', function () {
      if (timer) return;
      timer = setInterval(function () {
        show((index + 1) % reviews.length);
      }, interval);
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
    const pricing = createPricing(sectionEl);
    initGallery(sectionEl);
    initBundles(sectionEl, pricing);
    initSellingPlan(sectionEl, pricing);
    initSticky(sectionEl, pricing);
    initReviews(sectionEl);
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

  // In the editor the sticky bar is normally scrolled out of its trigger, so
  // selecting it in the sidebar has to reveal it or there is nothing to style.
  document.addEventListener('shopify:block:select', function (event) {
    const bar = event.target.closest('[data-cwc-sticky]');
    if (bar) bar.classList.add('is-visible');
  });
})();
