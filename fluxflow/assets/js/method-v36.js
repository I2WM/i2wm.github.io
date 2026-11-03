/* Method narration runs once per group. No replay on reverse scroll or resize. */
(function () {
  'use strict';
  function enhance(win, doc) {
    var section = doc.querySelector('#method');
    var boot = win.__m37Boot;
    var root = doc.documentElement;
    function disarm() { root.classList.remove('m37-armed'); }
    if (boot) win.clearTimeout(boot.timer);
    if (!section || !boot || boot.expired || !win.IntersectionObserver || !win.matchMedia) {
      disarm(); return;
    }
    var reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
    var compact = win.matchMedia('(max-width: 760px)');
    var groups = Array.prototype.slice.call(section.querySelectorAll('[data-m36-sequence]'));
    var records = new Map();
    var observer;
    function finish(group) {
      var record = records.get(group);
      if (!record || record.state === 'done') return;
      record.state = 'done';
      group.setAttribute('data-m37-state', 'done');
      win.clearTimeout(record.timer);
      record.cleanup.splice(0).forEach(function (fn) { fn(); });
      record.animations.splice(0).forEach(function (animation) {
        try { animation.cancel(); } catch (_) {}
      });
      if (observer) observer.unobserve(group);
    }
    function finishAll() { groups.forEach(finish); disarm(); }
    function animate(group, target, frames, options) {
      if (!target || typeof target.animate !== 'function') return;
      var record = records.get(group);
      record.animations.push(target.animate(frames, options));
    }
    function pulse(group, target, delay, duration) {
      animate(group, target, [{ opacity:0 }, { opacity:1, offset:.2 },
        { opacity:1, offset:.78 }, { opacity:0 }],
        { duration:duration, delay:delay, easing:'ease-in-out', fill:'none' });
    }
    function play(group) {
      var record = records.get(group);
      if (!record || record.state === 'done' || record.state === 'playing') return;
      if (reduced.matches || compact.matches || group.contains(doc.activeElement)) { finish(group); return; }
      record.cleanup.splice(0).forEach(function (fn) { fn(); });
      win.clearTimeout(record.timer);
      var mode = group.getAttribute('data-m36-sequence');
      var items = Array.prototype.slice.call(group.querySelectorAll('[data-m36-item]'));
      var interval = {trajectory:700, cycle:1800, compare:1200, toy:1100, stars:1200, training:1300, network:1700}[mode] || 1000;
      var duration = 1000;
      var lastEnd = 0;
      try {
        items.forEach(function (item, index) {
          var delay = interval * index;
          var frames;
          if (mode === 'trajectory') frames = [{opacity:0, transform:'translateY(15px) scale(.96)'}, {opacity:1, transform:'none'}];
          else if (mode === 'cycle') frames = [{opacity:0, transform:'translateX(-18px)'}, {opacity:1, transform:'none'}];
          else if (mode === 'compare') frames = [{opacity:0, transform:index ? 'translateX(24px)' : 'translateX(-24px)'}, {opacity:1, transform:'none'}];
          else if (mode === 'toy') frames = [{opacity:0, transform:'scale(1.06)'}, {opacity:1, transform:'none'}];
          else if (mode === 'stars') frames = [{opacity:0, clipPath:index ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)'}, {opacity:1, clipPath:'inset(0 0 0 0)'}];
          else if (mode === 'training') frames = [{opacity:0, transform:index === 1 ? 'scale(.95)' : 'translateY(14px)'}, {opacity:1, transform:'none'}];
          else frames = [{opacity:0, transform:'translateY(10px)'}, {opacity:1, transform:'none'}];
          animate(group, item, frames, {duration:duration, delay:delay, easing:'cubic-bezier(.2,.75,.25,1)', fill:'both'});
          lastEnd = Math.max(lastEnd, delay + duration);
          if (mode === 'cycle') {
            var cycleKey = item.getAttribute('data-m37-cycle-key');
            pulse(group, group.querySelector('[data-m37-cycle-spot="' + cycleKey + '"]'), delay, 1650);
            lastEnd = Math.max(lastEnd, delay + 1650);
          }
          if (mode === 'network') {
            var key = item.getAttribute('data-m36-key');
            pulse(group, key ? group.querySelector('[data-m36-spot="' + key + '"]') : null, delay, 1600);
            lastEnd = Math.max(lastEnd, delay + 1600);
          }
          if (mode === 'training' && index === 1) {
            Array.prototype.forEach.call(group.querySelectorAll('[data-m36-training-focus]'), function (spot) { pulse(group, spot, delay + 600, 1600); });
            lastEnd = Math.max(lastEnd, delay + 2200);
          }
        });
        // All delayed animations have their first frame before pending styles lift.
        record.state = 'playing';
        group.setAttribute('data-m37-state', 'playing');
        record.timer = win.setTimeout(function () { finish(group); }, lastEnd + 100);
      } catch (_) { finish(group); }
    }
    function prepare(group) {
      var record = records.get(group);
      if (record.state !== 'pending') return;
      record.state = 'loading';
      group.setAttribute('data-m37-state', 'loading');
      var images = Array.prototype.slice.call(group.querySelectorAll('img'));
      var waiting = images.filter(function (img) { return !img.complete; });
      if (!waiting.length) { play(group); return; }
      var remaining = waiting.length;
      waiting.forEach(function (img) {
        var settled = false;
        function ready() {
          if (settled) return;
          settled = true;
          remaining -= 1;
          if (!remaining && record.state === 'loading') play(group);
        }
        img.addEventListener('load', ready);
        img.addEventListener('error', ready);
        record.cleanup.push(function () { img.removeEventListener('load', ready); img.removeEventListener('error', ready); });
      });
      // A stalled image never keeps explanations inaccessible indefinitely.
      record.timer = win.setTimeout(function () { finish(group); }, 4000);
    }
    try {
      groups.forEach(function (group) {
        records.set(group, {state:'pending', timer:null, animations:[], cleanup:[]});
        group.setAttribute('data-m37-state', 'pending');
      });
      if (reduced.matches || compact.matches || doc.hidden) { finishAll(); return; }
      observer = new win.IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var record = records.get(entry.target);
          if (record.state === 'done') return;
          if (entry.isIntersecting) prepare(entry.target);
          else if (record.state === 'playing' || record.state === 'loading' || entry.boundingClientRect.bottom <= 0) finish(entry.target);
        });
      }, {threshold:0, rootMargin:'0px 0px -15% 0px'});
      groups.forEach(function (group) {
        // Restored scroll positions/anchors should not hide already-passed content.
        if (group.getBoundingClientRect().bottom <= 0) finish(group);
        else observer.observe(group);
      });
      disarm();
      [reduced, compact].forEach(function (query) {
        function update() { if (query.matches) finishAll(); }
        if (query.addEventListener) query.addEventListener('change', update);
        else if (query.addListener) query.addListener(update);
      });
      section.addEventListener('focusin', function (event) {
        groups.forEach(function (group) { if (group.contains(event.target)) finish(group); });
      });
      function revealAnchor() {
        var id;
        try { id = decodeURIComponent(win.location.hash.slice(1)); } catch (_) { return; }
        var target = id ? doc.getElementById(id) : null;
        if (target) groups.forEach(function (group) { if (group === target || group.contains(target) || target.contains(group)) finish(group); });
      }
      win.addEventListener('hashchange', revealAnchor);
      revealAnchor();
      doc.addEventListener('visibilitychange', function () { if (doc.hidden) finishAll(); });
      win.addEventListener('pagehide', finishAll);
      win.addEventListener('pageshow', function (event) { if (event.persisted) finishAll(); });
    } catch (_) { finishAll(); }
  }
  if (typeof module === 'object' && module.exports) module.exports = enhance;
  else if (typeof window !== 'undefined') enhance(window, document);
}());
