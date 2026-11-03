/* Run in <head>, before Method can paint. Failure is always readable. */
(function (win, doc) {
  'use strict';
  if (!win.matchMedia || !win.IntersectionObserver || !win.Element ||
      !win.Element.prototype.animate ||
      win.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      win.matchMedia('(max-width: 760px)').matches) return;
  var root = doc.documentElement;
  root.classList.add('m37-armed');
  win.__m37Boot = {
    expired: false,
    timer: win.setTimeout(function () {
      win.__m37Boot.expired = true;
      root.classList.remove('m37-armed');
    }, 4000)
  };
}(window, document));
