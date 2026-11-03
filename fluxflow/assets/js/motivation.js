/* One continuous explanation: DESI, then a registered wipe to HST. */
(function () {
  'use strict';
  function enhance(win, doc) {
    var root = doc.querySelector('[data-sr-story]');
    if (!root || root.classList.contains('sr-enhanced')) return;
    var frame = root.querySelector('[data-sr-comparison]');
    var slider = root.querySelector('[data-sr-range]');
    var choices = Array.from(root.querySelectorAll('[data-sr-view]'));
    var toggle = root.querySelector('[data-sr-toggle]');
    var text = root.querySelector('[data-sr-toggle-text]');
    var reduce = win.matchMedia('(prefers-reduced-motion: reduce)');
    var compact = win.matchMedia('(max-width: 760px)');
    var hold = 5000, wipe = 2600, duration = hold * 2 + wipe;
    var elapsed = 0, beganAt = 0, raf = null;
    var running = false, entered = false, touched = false, finished = false;
    var now = function () { return win.performance.now(); };

    function emphasize(view) {
      root.dataset.view = view;
      choices.forEach(function (choice) {
        choice.setAttribute('aria-pressed', String(choice.dataset.srView === view));
      });
    }
    function setPosition(value) {
      value = Math.max(0, Math.min(100, value));
      frame.style.setProperty('--sr-position', value.toFixed(3) + '%');
      slider.value = String(Math.round(value));
      slider.setAttribute('aria-valuetext', Math.round(value) + '% HST reference, ' + Math.round(100 - value) + '% DESI input');
      frame.querySelector('.sr-compare-tag--hst').style.opacity = String(Math.min(1, value / 20));
      frame.querySelector('.sr-compare-tag--desi').style.opacity = String(Math.min(1, (100 - value) / 20));
    }
    function render(time) {
      var progress = Math.max(0, Math.min(1, (time - hold) / wipe));
      setPosition((.5 - Math.cos(Math.PI * progress) / 2) * 100);
      emphasize(time < hold ? 'desi' : 'hst');
    }
    function updateButton() {
      text.textContent = running ? 'Pause' : finished ? 'Replay' : entered ? 'Continue' : 'Play';
      toggle.setAttribute('aria-label', running ? 'Pause the DESI to HST comparison' : finished ? 'Replay from DESI to HST' : 'Play the DESI to HST comparison');
      root.querySelector('[data-sr-pause-icon]').toggleAttribute('hidden', !running);
      root.querySelector('[data-sr-play-icon]').toggleAttribute('hidden', running);
      root.dataset.playing = String(running);
    }
    function pause() {
      if (running) {
        elapsed = Math.min(duration, elapsed + now() - beganAt);
        render(elapsed);
      }
      running = false;
      if (raf !== null) win.cancelAnimationFrame(raf);
      raf = null;
      updateButton();
    }
    function tick() {
      var time = Math.min(duration, elapsed + now() - beganAt);
      render(time);
      if (time >= duration) {
        running = false; finished = true; elapsed = duration; raf = null; updateButton();
      } else raf = win.requestAnimationFrame(tick);
    }
    function play() {
      if (running || doc.hidden) return;
      if (finished) { elapsed = 0; finished = false; }
      if (reduce.matches) { setPosition(100); emphasize('hst'); finished = true; updateButton(); return; }
      entered = true; running = true; beganAt = now(); render(elapsed); updateButton();
      raf = win.requestAnimationFrame(tick);
    }
    function manualPosition(value) {
      touched = true; pause(); finished = true;
      setPosition(value); emphasize(value < 50 ? 'desi' : 'hst'); updateButton();
    }
    choices.forEach(function (choice) {
      choice.disabled = false;
      choice.addEventListener('click', function () {
        manualPosition(choice.dataset.srView === 'desi' ? 0 : 100);
      });
    });
    toggle.addEventListener('click', function () { touched = true; if (running) pause(); else play(); });
    slider.addEventListener('pointerdown', function () { touched = true; pause(); });
    slider.addEventListener('input', function () { manualPosition(Number(slider.value)); });
    root.addEventListener('focusin', function (event) {
      if (!toggle.contains(event.target)) { touched = true; pause(); }
    });
    root.addEventListener('keydown', function (event) {
      if (event.key === 'Tab') { touched = true; pause(); }
    });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) pause(); });
    win.addEventListener('pagehide', pause);
    if (reduce.addEventListener) reduce.addEventListener('change', pause);
    if (compact.addEventListener) compact.addEventListener('change', pause);
    root.classList.add('sr-enhanced'); render(0); updateButton();
    if (win.IntersectionObserver) {
      var observer = new win.IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || entry.intersectionRatio < .55) { pause(); return; }
          if (!entered && !touched && !reduce.matches && !compact.matches) play();
        });
      }, { threshold: .55 });
      observer.observe(root.querySelector('.sr-scene'));
    }
  }
  if (typeof module === 'object' && module.exports) module.exports = enhance;
  else enhance(window, document);
})();
