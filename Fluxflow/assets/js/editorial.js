(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const button = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#section-nav');
  const closeMenu = () => {
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Open navigation');
    nav.classList.remove('is-open');
  };
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    nav.classList.toggle('is-open', open);
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', event => { if (!event.target.closest('.topbar')) closeMenu(); });
  matchMedia('(min-width: 901px)').addEventListener('change', closeMenu);

  // Point-source response: a Gaussian wire mesh, drawn in projection.
  const canvas = document.querySelector('#emblem');
  const ctx = canvas.getContext('2d');
  let width = 320, height = 180, active = false, frame = 0;
  function size() {
    const box = canvas.getBoundingClientRect();
    width = box.width; height = box.height;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (reduced) draw(0);
  }
  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    const angle = reduced ? .45 : .45 + Math.sin(time / 8000) * .12;
    const ca = Math.cos(angle), sa = Math.sin(angle);
    const amplitude = height * .48;
    const scale = width * .22;
    const sigma = .54;
    function project(x, z, elevation) {
      return [width * .5 + (x * ca - z * sa) * scale, height * .69 + (x * sa + z * ca) * scale * .29 - elevation];
    }
    function path(points, color, lineWidth) {
      ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p));
      ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke();
    }
    for (let n = -6; n <= 6; n++) {
      const q = n / 4;
      path([project(q,-1.5,0),project(q,1.5,0)], '#c8cec366', .65);
      path([project(-1.5,q,0),project(1.5,q,0)], '#c8cec366', .65);
    }
    for (let n = -10; n <= 10; n++) {
      const z = n * .15;
      const points = [];
      for(let k = 0; k <= 64; k++) {
        const x = -1.5 + 3 * k / 64;
        const elevation = amplitude * Math.exp(-(x*x + z*z)/(2*sigma*sigma));
        points.push(project(x,z,elevation));
      }
      path(points, n === 0 ? '#d94f2b' : '#739c87aa', n === 0 ? 1.6 : .75);
    }
    for (let n = -10; n <= 10; n++) {
      const x = n * .15, points = [];
      for(let k = 0; k <= 64; k++) {
        const z = -1.5 + 3 * k / 64;
        points.push(project(x,z,amplitude * Math.exp(-(x*x+z*z)/(2*sigma*sigma))));
      }
      path(points, n === 0 ? '#587a89' : '#739c8766', n === 0 ? 1.25 : .65);
    }
    path([project(-1.5,-1.5,0),project(1.5,-1.5,0),project(1.5,1.5,0),project(-1.5,1.5,0),project(-1.5,-1.5,0)], '#739c87aa', .8);
  }
  function tick(time) {
    frame = 0;
    if (!active || document.hidden) return;
    draw(time); frame = requestAnimationFrame(tick);
  }
  function resume() { if (active && !frame && !reduced && !document.hidden) frame = requestAnimationFrame(tick); }
  new ResizeObserver(size).observe(canvas);
  new IntersectionObserver(entries => {
    active = entries[0].isIntersecting;
    if (!active && frame) { cancelAnimationFrame(frame); frame = 0; }
    resume();
  }).observe(canvas);
  document.addEventListener('visibilitychange', resume);
  size(); draw(0);
})();
