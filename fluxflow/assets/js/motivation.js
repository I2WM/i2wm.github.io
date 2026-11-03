/* One pass on entry, explicit replay, and no motion while offscreen. */
(function () {
  'use strict';
  function enhance(win, doc) {
    var root = doc.querySelector('[data-sr-story]');
    if (!root || root.classList.contains('sr-enhanced')) return;
    var panels = Array.from(root.querySelectorAll('[data-sr-scene]'));
    var tabs = Array.from(root.querySelectorAll('[data-sr-tab]'));
    var toggle = root.querySelector('[data-sr-toggle]');
    var toggleText = toggle.querySelector('[data-sr-toggle-text]');
    var pauseIcon = toggle.querySelector('[data-sr-pause-icon]');
    var playIcon = toggle.querySelector('[data-sr-play-icon]');
    var reduce = win.matchMedia('(prefers-reduced-motion: reduce)');
    var compact = win.matchMedia('(max-width: 760px)');
    var durations = [8000, 7000, 8000];
    var index = 0, elapsed = 0, beganAt = 0, timer = null, beatTimer = null;
    var running = false, entered = false, finished = false, touched = false;
    var animations = [], sliderTouched = false;
    var slider = root.querySelector('[data-sr-range]');
    var frame = root.querySelector('[data-sr-comparison]');
    var now = function () { return win.performance.now(); };

    function updateButton() {
      toggleText.textContent = running ? 'Pause' : finished ? 'Replay' : entered || touched ? 'Play' : 'Play story';
      toggle.setAttribute('aria-label', running ? 'Pause the motivation story' : finished ? 'Replay the motivation story' : 'Play the motivation story');
      pauseIcon.toggleAttribute('hidden', !running);
      playIcon.toggleAttribute('hidden', running);
      root.dataset.playing = String(running);
    }
    function cancelAnimations() {
      animations.forEach(function (a) { a.cancel(); });
      animations = [];
    }
    function animate(el, keyframes, options, offset) {
      if (!el || !el.animate || reduce.matches) return;
      var animation = el.animate(keyframes, options);
      if (offset) animation.currentTime = offset;
      animations.push(animation);
    }
    function setBeat() {
      if (index === 0) panels[0].dataset.beat = elapsed >= 4000 ? 'space' : 'ground';
    }
    function clearTimers() {
      if (timer !== null) win.clearTimeout(timer);
      if (beatTimer !== null) win.clearTimeout(beatTimer);
      timer = beatTimer = null;
    }
    function pause() {
      if (running) elapsed = Math.min(durations[index], elapsed + now() - beganAt);
      running = false;
      clearTimers();
      animations.forEach(function (a) { a.pause(); });
      updateButton();
    }
    function select(next, byUser) {
      pause(); cancelAnimations();
      index = next; elapsed = 0; finished = false;
      panels.forEach(function (panel, i) { panel.hidden = i !== index; });
      tabs.forEach(function (tab, i) {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        tab.querySelector('.sr-progress').style.transform = i === index ? 'scaleX(1)' : 'scaleX(0)';
      });
      setBeat();
      if (byUser) {
        touched = true;
        animate(panels[index].querySelector('.sr-copy'), [{ opacity: .6, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 300, easing: 'ease-out', fill: 'both' });
        if (index === 1) animateGrid();
      }
      updateButton();
    }
    function animateGrid() {
      animate(panels[1].querySelector('.sr-grid--fine'), [{ opacity: 0 }, { opacity: 0, offset: .25 }, { opacity: 1 }], { duration: 3200, fill: 'both', easing: 'ease-in-out' }, elapsed);
      animate(panels[1].querySelector('.sr-grid--target-coarse'), [{ opacity: 1 }, { opacity: 1, offset: .25 }, { opacity: 0 }], { duration: 3200, fill: 'both', easing: 'ease-in-out' }, elapsed);
    }
    function play() {
      if (running || doc.hidden) return;
      if (finished) select(0, false);
      entered = true;
      running = true; beganAt = now();
      cancelAnimations(); setBeat();
      var progress = tabs[index].querySelector('.sr-progress');
      animate(progress, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: durations[index], fill: 'both', easing: 'linear' }, elapsed);
      if (index === 0 && elapsed < 4000) {
        beatTimer = win.setTimeout(function () { panels[0].dataset.beat = 'space'; }, 4000 - elapsed);
      }
      if (index === 1) animateGrid();
      if (index === 2 && !sliderTouched) {
        // The two registered observations stay fixed; only the wipe moves.
        animate(frame.querySelector('.sr-compare-hst'), [
          { clipPath: 'inset(0 50% 0 0)' }, { clipPath: 'inset(0 25% 0 0)' },
          { clipPath: 'inset(0 75% 0 0)' }, { clipPath: 'inset(0 50% 0 0)' }
        ], { duration: 4000, fill: 'none', easing: 'ease-in-out' }, elapsed);
        animate(frame.querySelector('.sr-compare-divider'), [
          { left: '50%' }, { left: '75%' }, { left: '25%' }, { left: '50%' }
        ], { duration: 4000, fill: 'none', easing: 'ease-in-out' }, elapsed);
      }
      timer = win.setTimeout(function () {
        running = false; elapsed = 0; clearTimers();
        if (index === panels.length - 1) {
          finished = true; cancelAnimations(); updateButton(); return;
        }
        select(index + 1, false); play();
      }, durations[index] - elapsed);
      updateButton();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, true); });
      tab.addEventListener('keydown', function (event) {
        var next;
        if (event.key === 'ArrowRight') next = (i + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (i + tabs.length - 1) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault(); select(next, true); tabs[next].focus();
      });
    });
    toggle.addEventListener('click', function () {
      touched = true;
      if (running) pause(); else play();
    });
    // Keyboard focus stops time-based changes; clicking Pause still toggles once.
    root.addEventListener('keydown', function (event) {
      if (event.key === 'Tab') { touched = true; pause(); }
    });
    root.addEventListener('focusin', function (event) {
      if (!toggle.contains(event.target)) { touched = true; pause(); }
    });
    function setComparison() {
      touched = true; sliderTouched = true; pause(); cancelAnimations();
      var value = Math.max(0, Math.min(100, Number(slider.value)));
      frame.style.setProperty('--sr-position', value + '%');
      slider.setAttribute('aria-valuetext', value + '% HST reference, ' + (100 - value) + '% DESI input');
    }
    slider.addEventListener('pointerdown', setComparison);
    slider.addEventListener('input', setComparison);
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) pause(); });
    win.addEventListener('pagehide', pause);
    function onPreferenceChange() { pause(); cancelAnimations(); }
    if (reduce.addEventListener) reduce.addEventListener('change', onPreferenceChange);
    if (compact.addEventListener) compact.addEventListener('change', onPreferenceChange);
    root.classList.add('sr-enhanced');
    select(0, false);
    if (win.IntersectionObserver) {
      var observer = new win.IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) { pause(); return; }
          if (!entered && !touched && !reduce.matches && !compact.matches) play();
        });
      }, { threshold: .4 });
      observer.observe(root.querySelector('.sr-scenes'));
    }
    // Without IntersectionObserver the visible manual controls remain functional.
    updateButton();
  }
  if (typeof module === 'object' && module.exports) module.exports = enhance;
  else enhance(window, document);
})();
