/* One scroll-driven transition: overview → retained network → first explanation.
   The focused SVG group is never cloned. Without enhancement, the overview
   and all text remain in normal document flow. */
(function (global, factory) {
  'use strict';
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global && global.document) api.mount(global.document, global);
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  function clamp(value) { return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0; }
  function smooth(value) { var t = clamp(value); return t * t * (3 - 2 * t); }
  function progressWithin(p, start, end) { return smooth((p - start) / (end - start)); }
  function stateAt(value) {
    var p = clamp(value);
    var fade = progressWithin(p, 0, 0.23);
    var move = progressWithin(p, 0.23, 0.55);
    var explain = progressWithin(p, 0.55, 0.75);
    return {
      progress: p,
      otherOpacity: 1 - fade,
      x: -390 * move,
      y: 155 * move,
      scale: 1 + 0.2 * move,
      textOpacity: explain,
      textShift: 24 * (1 - explain)
    };
  }
  function mount(doc, win) {
    var root = doc.getElementById('method');
    if (!root || !win.matchMedia || !win.requestAnimationFrame) return null;
    var scene = root.querySelector('[data-m31-scene]');
    var sticky = root.querySelector('[data-m31-sticky]');
    var focus = root.querySelector('[data-m31-focus]');
    var other = Array.prototype.slice.call(root.querySelectorAll('.m31-other'));
    if (!scene || !sticky || !focus || !other.length) return null;
    var motion = win.matchMedia('(prefers-reduced-motion: reduce)');
    var desktop = win.matchMedia('(min-width: 1000px) and (min-height: 600px)');
    var enabled = false;
    var frame = null;
    function reset() {
      enabled = false;
      if (frame !== null && win.cancelAnimationFrame) win.cancelAnimationFrame(frame);
      frame = null;
      root.classList.remove('m31-motion-ready');
      focus.removeAttribute('transform');
      other.forEach(function (node) { node.style.removeProperty('opacity'); });
      scene.style.removeProperty('--m31-copy-alpha');
      scene.style.removeProperty('--m31-copy-shift');
    }
    function render() {
      frame = null;
      if (!enabled) return;
      try {
        var top = parseFloat(win.getComputedStyle(sticky).top) || 0;
        var travel = Math.max(1, scene.offsetHeight - sticky.offsetHeight);
        var progress = (top - scene.getBoundingClientRect().top) / travel;
        var state = stateAt(progress);
        other.forEach(function (node) { node.style.opacity = String(state.otherOpacity); });
        focus.setAttribute('transform', 'translate(' + state.x.toFixed(3) + ' ' + state.y.toFixed(3) + ') scale(' + state.scale.toFixed(4) + ')');
        scene.style.setProperty('--m31-copy-alpha', String(state.textOpacity));
        scene.style.setProperty('--m31-copy-shift', state.textShift.toFixed(2) + 'px');
      } catch (_) { reset(); }
    }
    function schedule() {
      if (!enabled || frame !== null) return;
      frame = win.requestAnimationFrame(render);
    }
    function reconcile() {
      reset();
      if (motion.matches || !desktop.matches) return;
      try {
        enabled = true;
        root.classList.add('m31-motion-ready');
        render();
      } catch (_) { reset(); }
    }
    function listen(media) {
      if (media.addEventListener) media.addEventListener('change', reconcile);
      else if (media.addListener) media.addListener(reconcile);
    }
    win.addEventListener('scroll', schedule, { passive: true });
    win.addEventListener('resize', reconcile);
    win.addEventListener('pagehide', reset);
    win.addEventListener('pageshow', reconcile);
    listen(motion);
    listen(desktop);
    reconcile();
    return { reconcile: reconcile, reset: reset, render: render };
  }
  return { clamp: clamp, stateAt: stateAt, mount: mount };
});
