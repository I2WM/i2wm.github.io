/* Optional, reversible narration: every figure and caption is visible without JS. */
(function () {
  'use strict';

  function enhance(win, doc) {
    var section = doc.querySelector('#method');
    if (!section || !win.IntersectionObserver || !win.matchMedia) return;
    var reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
    var compact = win.matchMedia('(max-width: 760px)');
    var groups = Array.prototype.slice.call(section.querySelectorAll('[data-m36-sequence]'));
    var observer = null;
    var visible = new WeakSet();
    var active = new Map();
    var timers = new Map();

    function cancelFor(group) {
      var timer = timers.get(group);
      if (timer !== undefined) win.clearTimeout(timer);
      timers.delete(group);
      var animations = active.get(group) || [];
      active.delete(group);
      animations.slice().forEach(function (animation) {
        try { animation.cancel(); } catch (_) {}
      });
    }

    function animate(group, target, frames, options) {
      if (!target || typeof target.animate !== 'function') return;
      try {
        var animation = target.animate(frames, options);
        var animations = active.get(group) || [];
        animations.push(animation);
        active.set(group, animations);
        animation.onfinish = animation.oncancel = function () {
          var current = active.get(group);
          if (!current) return;
          var index = current.indexOf(animation);
          if (index !== -1) current.splice(index, 1);
          if (!current.length) active.delete(group);
        };
      } catch (_) { /* Unanimated content remains visible. */ }
    }

    function play(group) {
      if (reduced.matches || compact.matches || group.contains(doc.activeElement)) return;
      var mode = group.getAttribute('data-m36-sequence');
      var items = Array.prototype.slice.call(group.querySelectorAll('[data-m36-item]'));
      var interval = { trajectory:300, cycle:500, compare:650, toy:550, stars:650, training:550, network:900 }[mode] || 500;
      var duration = 650;
      var ease = 'cubic-bezier(.2,.75,.25,1)';
      var lastEnd = 0;
      cancelFor(group);
      items.forEach(function (item, index) {
        var delay = interval * index;
        var frames;
        if (mode === 'trajectory') {
          frames = [{ opacity:0, transform:'translateY(15px) scale(.96)' }, { opacity:1, transform:'none' }];
        } else if (mode === 'cycle') {
          frames = [{ opacity:0, transform:'translateX(-22px)' }, { opacity:1, transform:'none' }];
        } else if (mode === 'compare') {
          frames = [{ opacity:0, transform:index ? 'translateX(24px)' : 'translateX(-24px)' }, { opacity:1, transform:'none' }];
        } else if (mode === 'toy') {
          frames = [{ opacity:0, transform:'scale(1.06)' }, { opacity:1, transform:'none' }];
        } else if (mode === 'stars') {
          frames = [{ opacity:0, clipPath:index ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' }, { opacity:1, clipPath:'inset(0 0 0 0)' }];
        } else if (mode === 'training') {
          frames = index === 1 ? [{ opacity:0, transform:'scale(.95)' }, { opacity:1, transform:'none' }] :
            [{ opacity:0, transform:index ? 'translateX(22px)' : 'translateY(14px)' }, { opacity:1, transform:'none' }];
        } else {
          frames = [{ opacity:0, transform:'translateY(10px)' }, { opacity:1, transform:'none' }];
        }
        animate(group, item, frames, { duration:duration, delay:delay, easing:ease, fill:'backwards' });
        lastEnd = Math.max(lastEnd, delay + duration);

        if (mode === 'cycle') {
          var arrow = item.querySelector('.m36-next');
          animate(group, arrow, [{ opacity:0, transform:'translateX(-8px)' }, { opacity:1, transform:'none' }],
            { duration:400, delay:delay + 350, easing:ease, fill:'backwards' });
          lastEnd = Math.max(lastEnd, delay + 750);
          if (index === 2) {
            Array.prototype.forEach.call(group.querySelectorAll('[data-m36-link]'), function (image) {
              animate(group, image, [{ boxShadow:'0 0 0 0 rgba(158,202,245,0)' },
                { boxShadow:'0 0 0 4px rgba(158,202,245,.9)', offset:.5 },
                { boxShadow:'0 0 0 0 rgba(158,202,245,0)' }],
                { duration:900, delay:delay + 250, easing:'ease-in-out' });
            });
            lastEnd = Math.max(lastEnd, delay + 1150);
          }
        }
        if (mode === 'toy' && (index === 2 || index === 3)) {
          animate(group, item, [{ boxShadow:'0 0 0 0 rgba(158,202,245,0)' },
            { boxShadow:'0 0 0 4px rgba(158,202,245,.8)', offset:.5 },
            { boxShadow:'0 0 0 0 rgba(158,202,245,0)' }],
            { duration:900, delay:delay + 500, easing:'ease-in-out' });
          lastEnd = Math.max(lastEnd, delay + 1400);
        }
        if (mode === 'network') {
          var key = item.getAttribute('data-m36-key');
          var spot = key ? group.querySelector('[data-m36-spot="' + key + '"]') : null;
          animate(group, spot, [{ opacity:0 }, { opacity:1, offset:.18 }, { opacity:1, offset:.75 }, { opacity:0 }],
            { duration:1100, delay:delay, easing:'ease-in-out' });
          lastEnd = Math.max(lastEnd, delay + 1100);
        }
        if (mode === 'training' && index === 1) {
          Array.prototype.forEach.call(group.querySelectorAll('[data-m36-training-focus]'), function (spot) {
            animate(group, spot, [{ opacity:0 }, { opacity:1, offset:.2 }, { opacity:1, offset:.75 }, { opacity:0 }],
              { duration:1200, delay:delay + 550, easing:'ease-in-out' });
          });
          lastEnd = Math.max(lastEnd, delay + 1750);
        }
      });
      if (active.has(group)) {
        timers.set(group, win.setTimeout(function () { cancelFor(group); }, lastEnd + 700));
      }
    }

    function connect() {
      if (reduced.matches || compact.matches || observer) return;
      observer = new win.IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var group = entry.target;
          if (entry.isIntersecting) {
            if (!visible.has(group)) { visible.add(group); play(group); }
          } else {
            visible.delete(group);
            cancelFor(group);
          }
        });
      }, { threshold:.12, rootMargin:'0px 0px -8% 0px' });
      groups.forEach(function (group) { observer.observe(group); });
    }

    function stop() {
      if (observer) observer.disconnect();
      observer = null;
      Array.from(active.keys()).forEach(cancelFor);
      Array.from(timers.keys()).forEach(cancelFor);
      visible = new WeakSet();
    }
    function update() {
      stop();
      if (!doc.hidden) connect();
    }
    [reduced, compact].forEach(function (query) {
      if (query.addEventListener) query.addEventListener('change', update);
      else if (query.addListener) query.addListener(update);
    });
    section.addEventListener('focusin', function (event) {
      Array.from(active.keys()).forEach(function (group) {
        if (group.contains(event.target)) cancelFor(group);
      });
    });
    if (doc.addEventListener) doc.addEventListener('visibilitychange', update);
    win.addEventListener('pagehide', stop);
    win.addEventListener('pageshow', function (event) { if (event.persisted) update(); });
    connect();
  }

  if (typeof module === 'object' && module.exports) module.exports = enhance;
  else if (typeof window !== 'undefined') enhance(window, document);
}());
