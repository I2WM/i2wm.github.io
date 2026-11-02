/* Progressive, one-time accents: the content and full figures are visible without JS. */
(function () {
  'use strict';

  function enhance(win, doc) {
    var section = doc.querySelector('#method');
    if (!section || !win.IntersectionObserver || !win.matchMedia) return;
    var preference = win.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches) return;
    var active = new Set();
    var seen = new WeakSet();
    var observer = new win.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var node = entry.target;
        if (!entry.isIntersecting || seen.has(node)) return;
        seen.add(node);
        observer.unobserve(node);
        if (preference.matches || typeof node.animate !== 'function' || node.contains(doc.activeElement)) return;
        var direction = node.getAttribute('data-m33-motion');
        var start = direction === 'right' ? 'translateX(14px)' :
          direction === 'left' ? 'translateX(-14px)' : 'scale(0.99)';
        try {
          var animation = node.animate([{ transform: start }, { transform: 'none' }], {
            duration: 650, easing: 'cubic-bezier(.16,1,.3,1)'
          });
          active.add(animation);
          animation.onfinish = animation.oncancel = function () { active.delete(animation); };
        } catch (_) { /* Keep the visible static figure. */ }
      });
    }, { threshold: 0.12 });
    section.querySelectorAll('[data-m33-motion]').forEach(function (node) { observer.observe(node); });
    function stop() {
      observer.disconnect();
      active.forEach(function (animation) { animation.cancel(); });
      active.clear();
    }
    if (preference.addEventListener) preference.addEventListener('change', function () {
      if (preference.matches) stop();
    });
    win.addEventListener('pagehide', stop, { once: true });
  }

  if (typeof module === 'object' && module.exports) module.exports = enhance;
  else if (typeof window !== 'undefined') enhance(window, document);
}());
