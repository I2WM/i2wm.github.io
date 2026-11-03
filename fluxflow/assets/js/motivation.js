/* Page scroll drives the introduction and the registered DESI-to-HST wipe together. */
(function () {
  'use strict';
  function enhance(win, doc) {
    var root = doc.querySelector('[data-sr-story]');
    if (!root || root.classList.contains('sr-enhanced')) return;
    var track = root.querySelector('[data-sr-track]');
    var scene = root.querySelector('.sr-scene');
    var frame = root.querySelector('[data-sr-comparison]');
    var slider = root.querySelector('[data-sr-range]');
    var copy = Array.from(root.querySelectorAll('[data-sr-view]'));
    var reduce = win.matchMedia('(prefers-reduced-motion: reduce)');
    var pinned = false, stickyTop = 100, distance = 600;
    var raf = null, needsMeasure = false, dragging = false, manual = false;
    var clamp = function (value) { return Math.max(0, Math.min(1, value)); };

    function render(progress) {
      progress = clamp(progress);
      var value = progress * 100;
      frame.style.setProperty('--sr-position', value.toFixed(3) + '%');
      slider.value = String(Math.round(value));
      slider.setAttribute('aria-valuetext', Math.round(value) + '% HST reference, ' + Math.round(100 - value) + '% DESI input');
      frame.querySelector('.sr-compare-tag--hst').style.opacity = String(Math.min(1, progress * 5));
      frame.querySelector('.sr-compare-tag--desi').style.opacity = String(Math.min(1, (1 - progress) * 5));
      root.dataset.view = progress < .5 ? 'desi' : 'hst';
      // One legible introduction at every position, including a divider held halfway.
      var showHst = progress >= .5;
      var copyOpacity = .72 + .28 * clamp(Math.abs(progress - .5) / .2);
      var copyShift = 14 * (1 - copyOpacity) / .28;
      root.style.setProperty('--sr-desi-opacity', String(showHst ? 0 : copyOpacity));
      root.style.setProperty('--sr-hst-opacity', String(showHst ? copyOpacity : 0));
      root.style.setProperty('--sr-desi-shift', (-copyShift).toFixed(2) + 'px');
      root.style.setProperty('--sr-hst-shift', copyShift.toFixed(2) + 'px');
      copy.forEach(function (item) {
        item.setAttribute('aria-hidden', String(item.dataset.srView !== root.dataset.view));
      });
    }
    function measure() {
      var height = scene.getBoundingClientRect().height;
      var viewport = win.innerHeight;
      // Only pin a panel that fits in the visible area below the site's navigation.
      pinned = !reduce.matches && height + 124 <= viewport;
      stickyTop = Math.max(100, (viewport - height + 76) / 2);
      distance = Math.max(500, Math.round(viewport * .85));
      root.classList.toggle('sr-scroll-pinned', pinned);
      root.style.setProperty('--sr-sticky-top', stickyTop + 'px');
      track.style.minHeight = pinned ? (height + distance) + 'px' : '';
    }
    function fromScroll() {
      var progress;
      if (pinned) {
        var travel = (stickyTop - track.getBoundingClientRect().top) / distance;
        // Give each observation a reading interval at the beginning and end.
        progress = clamp((travel - .18) / .64);
      } else {
        // On short screens the panel flows normally; change while its image is visible.
        var rect = frame.getBoundingClientRect();
        var centre = rect.top + rect.height / 2;
        progress = clamp((win.innerHeight * .7 - centre) / (win.innerHeight * .4));
      }
      render(reduce.matches ? (progress < .5 ? 0 : 1) : progress * progress * (3 - 2 * progress));
    }
    function schedule(measureAgain) {
      needsMeasure = needsMeasure || measureAgain;
      if (raf !== null) return;
      raf = win.requestAnimationFrame(function () {
        raf = null;
        if (needsMeasure) { measure(); needsMeasure = false; }
        if (!dragging && !manual) fromScroll();
      });
    }
    win.addEventListener('scroll', function () {
      if (dragging) return;
      manual = false; schedule(false);
    }, { passive: true });
    win.addEventListener('resize', function () { schedule(true); });
    win.addEventListener('pageshow', function () { manual = false; schedule(true); });
    slider.addEventListener('pointerdown', function () { dragging = true; manual = true; });
    slider.addEventListener('input', function () {
      manual = true; render(Number(slider.value) / 100);
    });
    function endDrag() { dragging = false; }
    win.addEventListener('pointerup', endDrag);
    win.addEventListener('pointercancel', endDrag);
    if (reduce.addEventListener) reduce.addEventListener('change', function () { manual = false; schedule(true); });
    root.querySelectorAll('img').forEach(function (img) {
      img.addEventListener('load', function () { schedule(true); });
    });
    root.classList.add('sr-enhanced'); measure(); fromScroll();
    if (win.ResizeObserver) {
      var observer = new win.ResizeObserver(function () { schedule(true); });
      observer.observe(scene);
    }
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { schedule(true); });
  }
  if (typeof module === 'object' && module.exports) module.exports = enhance;
  else enhance(window, document);
})();
