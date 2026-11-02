/* Narrative accents follow visible text; paper figures and labels never move. */
(function () {
  'use strict';

  function enhance(win, doc) {
    var section = doc.querySelector('#method');
    if (!section || !win.IntersectionObserver || !win.matchMedia) return;
    var preference = win.matchMedia('(prefers-reduced-motion: reduce)');
    var small = win.matchMedia('(max-width: 760px)');
    var nodes = Array.prototype.slice.call(section.querySelectorAll('[data-m35-motion]'));
    var observer = null;
    var visible = new WeakSet();
    var active = new Map();

    function cancelFor(node) {
      var items = active.get(node) || [];
      active.delete(node);
      items.slice().forEach(function (animation) {
        try { animation.cancel(); } catch (_) {}
      });
    }
    function animate(owner, target, frames, options) {
      if (!target || typeof target.animate !== 'function') return;
      try {
        var animation = target.animate(frames, options);
        var items = active.get(owner) || [];
        items.push(animation);
        active.set(owner, items);
        animation.onfinish = animation.oncancel = function () {
          var current = active.get(owner);
          if (!current) return;
          var index = current.indexOf(animation);
          if (index !== -1) current.splice(index, 1);
          if (!current.length) active.delete(owner);
        };
      } catch (_) { /* The original text remains visible. */ }
    }
    function play(node) {
      if (preference.matches || node.contains(doc.activeElement)) return;
      var mode = node.getAttribute('data-m35-motion');
      var distance = small.matches ? 10 : 20;
      var ease = 'cubic-bezier(.16,1,.3,1)';
      if (mode === 'sequence' || mode === 'stats') {
        var steps = node.querySelectorAll('[data-m35-step]');
        Array.prototype.forEach.call(steps, function (step, index) {
          var highlight = mode === 'sequence' ? 'rgba(158,202,245,.46)' : 'rgba(158,202,245,.35)';
          animate(node, step, [
            { boxShadow: 'inset 0 -0.12em 0 rgba(158,202,245,0)', transform: 'translateY(0)' },
            { boxShadow: 'inset 0 -0.24em 0 ' + highlight, transform: 'translateY(-2px)', offset: .45 },
            { boxShadow: 'inset 0 -0.12em 0 rgba(158,202,245,0)', transform: 'translateY(0)' }
          ], { duration: 1000, delay: index * 300, easing: ease });
        });
        return;
      }
      var frames;
      if (mode === 'problem') {
        frames = [{ opacity: .76, transform: 'translateX(-' + distance + 'px)' }, { opacity: 1, transform: 'none' }];
      } else if (mode === 'solve') {
        frames = [{ opacity: .76, transform: 'translateX(' + distance + 'px)' }, { opacity: 1, transform: 'none' }];
      } else if (mode === 'bridge') {
        frames = [
          { opacity: .76, transform: 'translateY(16px) scale(.985)' },
          { opacity: 1, transform: 'translateY(-2px) scale(1.005)', offset: .78 },
          { opacity: 1, transform: 'none' }
        ];
      } else if (mode === 'evidence') {
        frames = [{ opacity: .8 }, { opacity: 1 }];
      } else {
        frames = [{ opacity: .78, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }];
      }
      animate(node, node, frames, { duration: mode === 'bridge' ? 800 : 650, easing: ease });
    }
    function connect() {
      if (preference.matches || observer) return;
      observer = new win.IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var node = entry.target;
          if (entry.isIntersecting) {
            if (!visible.has(node)) {
              visible.add(node);
              play(node);
            }
          } else {
            visible.delete(node);
            cancelFor(node);
          }
        });
      }, { threshold: .12 });
      nodes.forEach(function (node) { observer.observe(node); });
    }
    function stop() {
      if (observer) observer.disconnect();
      observer = null;
      Array.from(active.keys()).forEach(cancelFor);
      visible = new WeakSet();
    }
    function changePreference() {
      if (preference.matches) stop();
      else connect();
    }
    if (preference.addEventListener) preference.addEventListener('change', changePreference);
    else if (preference.addListener) preference.addListener(changePreference);
    section.addEventListener('focusin', function (event) {
      Array.from(active.keys()).forEach(function (node) {
        if (node.contains(event.target)) cancelFor(node);
      });
    });
    win.addEventListener('pagehide', stop);
    win.addEventListener('pageshow', function (event) { if (event.persisted) connect(); });
    connect();
  }

  if (typeof module === 'object' && module.exports) module.exports = enhance;
  else if (typeof window !== 'undefined') enhance(window, document);
}());
