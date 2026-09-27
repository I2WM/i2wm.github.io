/* RAWild project page.
 * The hero replays the film's title card (same beats, 82 BPM, played 1.75× faster); the rest is small,
 * precise motion in the film's vocabulary: rise-out-of-the-baseline text, wipes, pops, bars on the beat. */
(() => {
'use strict';

// ---------------------------------------------------------------- basics
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const E = {
  cOut: u => 1 - Math.pow(1 - u, 3),
  qOut: u => 1 - Math.pow(1 - u, 5),
  eOut: u => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u)),
  cIn: u => u * u * u,
  cInOut: u => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
  sInOut: u => -(Math.cos(Math.PI * u) - 1) / 2,
};
const P = (b, b0, b1, ease = E.cOut) => ease(clamp((b - b0) / (b1 - b0)));
const C = {
  paper: '#F2F0E8', ink: '#182420', ink2: '#2B3632', muted: '#69736B', faint: '#A7ADA3', rule: '#C8CEC3',
  ver: '#D94F2B', sage: '#739C87', blue: '#587A89',
};
const RGB = [C.ver, C.sage, C.blue];
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgba = (h, a) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; };
const mix = (c1, c2, u) => { const a = hexRgb(c1), b = hexRgb(c2); return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], u))).join(',')})`; };
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const dprOf = () => Math.min(2, window.devicePixelRatio || 1);
const root = document.documentElement;

let DEMO = null;
const dataReady = fetch('assets/data/demo.json').then(r => r.json()).then(d => (DEMO = d)).catch(() => null);
const LUTC = ['r', 'g', 'b'];
function curveY(ch, x) {                      // the predicted curve for ROD night-07357, sampled at k/255
  const a = DEMO.adapter.lut[LUTC[ch]], f = clamp(x) * 255, i = Math.min(254, Math.floor(f)), u = f - i;
  return a[i] * (1 - u) + a[i + 1] * u;
}

function sizeCanvas(cv) {                     // match backing store to CSS size × DPR; returns [w, h, ctx]
  const r = cv.getBoundingClientRect(), d = dprOf();
  const w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
  return [r.width, r.height, ctx];
}
function line(ctx, a, b, color, width, p = 1, alpha = 1, dash = null) {
  if (p <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(lerp(a[0], b[0], p), lerp(a[1], b[1], p)); ctx.stroke(); ctx.restore();
}
function poly(ctx, pts, color, width, o = {}) {
  if (pts.length < 2) return;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.globalAlpha *= (o.alpha == null ? 1 : o.alpha);
  if (o.glow) { ctx.shadowColor = rgba(color, o.glow); ctx.shadowBlur = o.blur || 12; }
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke(); ctx.restore();
}
function dot(ctx, x, y, r, color, alpha = 1, glow = 0) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color;
  if (glow) { ctx.shadowColor = rgba(C.ver, 0.55); ctx.shadowBlur = glow; }
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

// ---------------------------------------------------------------- top bar, progress, active section
const topbar = $('#topbar'), progress = $('.progress span');
function onScroll() {
  const y = window.scrollY, h = root.scrollHeight - innerHeight;
  topbar.classList.toggle('is-solid', y > 40);
  progress.style.setProperty('--p', h > 0 ? (y / h).toFixed(4) : 0);
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();
const navLinks = $$('.nav a');
const navIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
['problem', 'method', 'results', 'paper'].forEach(id => { const s = document.getElementById(id); if (s) navIO.observe(s); });
new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) navLinks.forEach(a => a.classList.remove('is-active')); }),
  { rootMargin: '-45% 0px -50% 0px' }).observe($('#top'));

// ---------------------------------------------------------------- reveal on scroll
const onReveal = new Map();          // element -> callback fired once when it enters
const revealIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('is-in'); revealIO.unobserve(e.target);
  const cb = onReveal.get(e.target); if (cb) cb();
}), { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
$$('.reveal').forEach(el => revealIO.observe(el));
function whenRevealed(el, cb) { if (!el) return; if (el.classList.contains('is-in')) cb(); else onReveal.set(el, cb); }

// ================================================================ HERO — the film's title card, live
const hero = $('.hero'), heroCv = $('.hero-canvas'), emblem = $('.emblem'), wm = $('.wm--hero');
wm.innerHTML = [...'RAWild'].map((ch, i) => `<span class="ch" style="--i:${i}">${ch}</span>`).join('') + '<i class="wm-dot"></i>';
const wmDot = $('.wm-dot', wm);
$$('[data-at]', hero).forEach(el => el.style.setProperty('--at', el.dataset.at));

const BPM = 82;
let BEAT = 60 / BPM / 1.75, t0 = 0, landed = false, heroRAF = 0, heroVisible = true, tilt = 0, tiltTarget = 0;
function setBeat(speed) { BEAT = 60 / BPM / speed; root.style.setProperty('--beat', BEAT.toFixed(4) + 's'); }
const heroBeat = () => (performance.now() - t0) / 1000 / BEAT;

function gridBox(ctx, front, b, unfold, depth) {        // the film's drawGridBox: an oblique box around the emblem
  const [x0, y0, x1, y1] = front;
  const ang = -0.62 + 0.10 * Math.sin(b * 0.33) + tilt;
  const dx = Math.cos(ang) * depth, dy = Math.sin(ang) * depth;
  const back = [x0 + dx, y0 + dy, x1 + dx, y1 + dy];
  const e = (a, c, p, alpha, w) => line(ctx, a, c, C.sage, w, clamp(p), alpha);
  const F4 = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], B4 = [[back[0], back[1]], [back[2], back[1]], [back[2], back[3]], [back[0], back[3]]];
  for (let i = 1; i < 6; i++) { const x = lerp(back[0], back[2], i / 6); e([x, back[1]], [x, back[3]], unfold * 1.5 - 0.3 - i * 0.04, 0.28, 0.9); }
  for (let j = 1; j < 4; j++) { const y = lerp(back[1], back[3], j / 4); e([back[0], y], [back[2], y], unfold * 1.5 - 0.35 - j * 0.05, 0.28, 0.9); }
  for (let i = 1; i < 6; i++) { const x = lerp(x0, x1, i / 6); e([x, y1], [x + dx, y1 + dy], unfold * 1.5 - 0.45 - i * 0.03, 0.28, 0.9); }
  for (let k = 0; k < 4; k++) e(B4[k], B4[(k + 1) % 4], unfold * 1.6 - 0.1, 0.45, 1.1);
  for (let k = 0; k < 4; k++) e(F4[k], B4[k], unfold * 1.6 - 0.2 - k * 0.05, 0.55, 1.1);
  for (let k = 0; k < 4; k++) e(F4[k], F4[(k + 1) % 4], unfold * 1.6 - k * 0.06, 0.75, 1.35);
}

function drawHero(b) {
  if (!DEMO) return;
  const [W, H, ctx] = sizeCanvas(heroCv);
  ctx.clearRect(0, 0, W, H);
  const hr = hero.getBoundingClientRect(), er = emblem.getBoundingClientRect(), dr = wmDot.getBoundingClientRect();
  const ex = er.left - hr.left, ey = er.top - hr.top, ew = er.width, eh = er.height;
  const k = ew / 376;                                    // film emblem: 376 px wide at 1920
  // the plot starts big in the middle of the page, then shrinks into the emblem (beats 3.95–4.8)
  const bw = Math.min(W * 0.69, (H * 0.6) * 1320 / 700), bh = bw * 700 / 1320;
  const shrink = P(b, 3.95, 4.8, E.qOut);
  const cx = lerp(W / 2, ex + ew / 2, shrink), cy = lerp(H * 0.5, ey + eh / 2, shrink);
  const PW = lerp(bw, ew, shrink), PH = lerp(bh, eh, shrink);
  const map = (x, y) => [cx + (x - 0.5) * PW, cy - (y - 0.5) * PH];

  const gridA = P(b, 0, 0.7) * (1 - shrink);           // faint coordinate grid while the plot is big
  if (gridA > 0) {
    ctx.save(); ctx.globalAlpha = gridA;
    for (let i = 0; i <= 10; i++) {
      const u = i / 10, major = i % 5 === 0, p = P(b, 0.05 + i * 0.04, 0.9 + i * 0.04);
      line(ctx, map(u, 0), map(u, 1), C.rule, major ? 1.2 : 0.7, p, major ? 0.55 : 0.28);
      line(ctx, map(0, u), map(1, u), C.rule, major ? 1.2 : 0.7, p, major ? 0.55 : 0.28);
    }
    line(ctx, map(0, 0), map(1, 1), C.faint, 1.2, P(b, 0.3, 1.4), 0.6, [7, 9]);
    ctx.restore();
  }
  // three real curves drawn from left to right, each with its probe (beats 0–3.85)
  const travel = P(b, 0, 3.85, u => 1 - Math.pow(1 - u, 1.7));
  const lw = Math.max(1.7, 5.2 * PW / 1320 * (W / 1920) * 1.9);
  if (travel > 0) for (let ch = 0; ch < 3; ch++) {
    const pts = []; const n = 180;
    for (let i = 0; i <= n; i++) { const x = travel * i / n; pts.push(map(x, curveY(ch, x))); }
    poly(ctx, pts, RGB[ch], lw, { glow: 0.25, blur: 12 * Math.max(0.35, PW / bw) });
  }
  // probes merge into one vermilion dot at (1,1), which then flies to the wordmark's period (lands at beat 6.5)
  const merge = P(b, 3.85, 4.25), depart = P(b, 5.7, 6.5, E.cIn);
  const pr = dr.width / 2, px = dr.left + pr - hr.left, py = dr.top + dr.height / 2 - hr.top;
  if (b >= 6.5 && !landed) land();
  if (travel > 0 && b < 6.5) {
    const s = Math.max(0.6, PW / bw);
    if (merge < 1) for (let ch = 0; ch < 3; ch++) {
      const [x, y] = map(travel, curveY(ch, travel));
      dot(ctx, x, y, lerp(5.2, 6.5, merge) * s, mix(RGB[ch], C.ver, merge), 1, 12);
    }
    if (merge > 0) {
      const [qx, qy] = map(1, 1);
      if (depart <= 0) dot(ctx, qx, qy, lerp(5, pr * 0.8, merge), C.ver, merge, 16);
      else {
        const ccx = px - 0.012 * W, ccy = qy + (py - qy) * 0.28;
        const at = v => [(1 - v) * (1 - v) * qx + 2 * (1 - v) * v * ccx + v * v * px, (1 - v) * (1 - v) * qy + 2 * (1 - v) * v * ccy + v * v * py];
        for (let t = 6; t >= 1; t--) { const v = Math.max(0, depart - t * 0.035), [tx, ty] = at(v); dot(ctx, tx, ty, pr * 0.8 * (1 - t / 7), C.ver, 0.18 * (1 - t / 7)); }
        const [x, y] = at(depart); dot(ctx, x, y, lerp(pr * 0.8, pr, depart), C.ver, 1, 18);
      }
    }
  }
  const unfold = P(b, 6.5, 8.6);
  if (unfold > 0) gridBox(ctx, [ex - 14 * k, ey - 12 * k, ex + ew + 14 * k, ey + eh + 12 * k], b, unfold, 58 * k);
}

function land() {                                        // squash-and-bounce + two ripples, like beat 6.5 of the film
  landed = true;
  wmDot.classList.add('is-landed');
  if (REDUCED) return;
  const hr = hero.getBoundingClientRect(), dr = wmDot.getBoundingClientRect();
  [[5.1, 0], [3.0, 60]].forEach(([s, delay]) => {
    const r = document.createElement('span'); r.className = 'ripple';
    Object.assign(r.style, { left: dr.left - hr.left + 'px', top: dr.top - hr.top + 'px', width: dr.width + 'px', height: dr.height + 'px', animationDelay: delay + 'ms' });
    r.style.setProperty('--s', s); hero.appendChild(r); setTimeout(() => r.remove(), 1400);
  });
}

function heroLoop() {
  heroRAF = 0;
  if (!heroVisible || hero.classList.contains('is-film') || document.hidden) return;
  tilt += (tiltTarget - tilt) * 0.06;
  drawHero(heroBeat());
  heroRAF = requestAnimationFrame(heroLoop);
}
function kickHero() { if (!heroRAF && !REDUCED) heroRAF = requestAnimationFrame(heroLoop); }
function startIntro(speed) {
  setBeat(speed);
  hero.classList.add('is-instant'); hero.classList.remove('is-live'); wmDot.classList.remove('is-landed'); landed = false;
  void hero.offsetWidth;
  if (REDUCED) { hero.classList.add('is-live'); t0 = performance.now() - 20 * 1000 * BEAT; drawHero(20); land(); return; }
  hero.classList.remove('is-instant');
  requestAnimationFrame(() => { hero.classList.add('is-live'); t0 = performance.now(); kickHero(); });
}
new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; if (heroVisible) kickHero(); }).observe(hero);
document.addEventListener('visibilitychange', () => { if (!document.hidden) kickHero(); });
hero.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  const r = hero.getBoundingClientRect(); tiltTarget = ((e.clientX - r.left) / r.width - 0.5) * 0.42;
});
hero.addEventListener('pointerleave', () => { tiltTarget = 0; });
addEventListener('resize', () => { if (REDUCED) drawHero(20); });

const fontsReady = Promise.race([
  Promise.all([document.fonts.load('700 100px "RAWild Mark"'), document.fonts.load('400 24px "Source Serif 4"'), document.fonts.load('500 20px "Barlow SC"')]),
  new Promise(r => setTimeout(r, 1500)),
]);
Promise.all([fontsReady, dataReady]).then(() => startIntro(1.75));

// ================================================================ FILM — the title card hands over to the film
const film = $('#film'), video = $('.film-video'), filmBox = $('.film-box');
let lang = 'en', closeTimer = 0;
const filmSrc = l => `assets/video/film-${l}-${filmBox.getBoundingClientRect().width * dprOf() > 1400 ? 1080 : 720}.mp4`;
function openFilm(e) {
  const btn = e && e.currentTarget;
  if (btn && btn.hasAttribute('data-film-scroll')) window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
  clearTimeout(closeTimer);
  hero.classList.add('is-film'); film.setAttribute('aria-hidden', 'false');
  if (!video.getAttribute('src')) video.src = filmSrc(lang);
  video.muted = false;
  const p = video.play(); if (p && p.catch) p.catch(() => {});
}
function closeFilm() {
  if (!hero.classList.contains('is-film')) return;
  video.pause(); hero.classList.remove('is-film'); film.setAttribute('aria-hidden', 'true');
  setTimeout(() => startIntro(2.6), 120);                 // the title card rebuilds itself, faster
}
$$('[data-film-open]').forEach(b => b.addEventListener('click', openFilm));
$$('[data-film-close]').forEach(b => b.addEventListener('click', closeFilm));
video.addEventListener('ended', () => { closeTimer = setTimeout(closeFilm, 900); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeFilm(); });
new IntersectionObserver(es => { if (!es[0].isIntersecting && !video.paused) video.pause(); }, { threshold: 0.25 }).observe(filmBox);
$$('[data-lang]').forEach(b => b.addEventListener('click', () => {
  const l = b.dataset.lang; if (l === lang) return; lang = l;
  $$('[data-lang]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.lang === l)));
  const t = video.currentTime, playing = !video.paused && !video.ended;
  video.poster = `assets/video/poster-${l}.jpg`;
  video.preload = 'auto';                                  // preload="none" would stop the new source from loading at all
  video.addEventListener('loadedmetadata', () => { try { video.currentTime = t; } catch (_) {} if (playing) video.play().catch(() => {}); }, { once: true });
  video.src = filmSrc(l); video.load();
}));

// ================================================================ 01 — bit-depth ruler
(() => {
  const ruler = $('.bitruler'), cards = $$('.sensor');
  if (!ruler) return;
  for (let bits = 10; bits <= 24; bits += 2) {
    const t = document.createElement('span'); t.className = 'tick'; t.style.left = ((bits - 10) / 14 * 100) + '%'; ruler.appendChild(t);
  }
  const marks = cards.map(c => {
    const bits = +c.dataset.bits, m = document.createElement('span');
    m.className = 'mark'; m.style.left = ((bits - 10) / 14 * 100) + '%'; m.innerHTML = `<span>${$('.sensor-set', c).textContent}</span>`;
    ruler.appendChild(m); return m;
  });
  for (let bits = 10; bits <= 24; bits += 2) {
    const l = document.createElement('span'); l.className = 'tick-label'; l.style.left = ((bits - 10) / 14 * 100) + '%'; l.textContent = bits; ruler.appendChild(l);
  }
  cards.forEach((c, i) => {
    c.addEventListener('pointerenter', () => marks[i].classList.add('is-hot'));
    c.addEventListener('pointerleave', () => marks[i].classList.remove('is-hot'));
    const img = $('img', c); if (img) img.addEventListener('error', () => c.classList.add('is-missing'));
    c.addEventListener('click', () => { if (matchMedia('(hover: none)').matches) c.classList.toggle('is-flip'); });
  });
  whenRevealed($('#sensors'), () => { if (REDUCED) return; marks.forEach((m, i) => setTimeout(() => { m.classList.add('is-hot'); setTimeout(() => m.classList.remove('is-hot'), 520); }, 380 + i * 366)); });
})();

// ================================================================ 02 — inside the adapter
(() => {
  const box = $('#adapter'); if (!box) return;
  const view = $('.demo-image', box), cv = $('.demo-canvas', box), probeEl = $('.probe', box), tag = $('.demo-stage-tag', box);
  const curveCv = $('.curve-canvas', box), gridCv = $('.grid-canvas', box);
  const outCurve = $('[data-readout="curve"]', box), outGrid = $('[data-readout="grid"]', box);
  const tabs = $$('[data-stage]', box);
  const NAMES = ['Linear RAW', 'Bézier', 'Bézier + Grid'];
  const imgs = ['adapter-linear', 'adapter-bezier', 'adapter-grid'].map(() => new Image());   // loaded when the demo comes near
  const IW = 1862, IH = 1200, GW = 118, GH = 76, GD = 8;   // grid: one cell per 16×16 px of the padded 1888×1216 input
  let stage = 2, from = 2, wipeT = 1, wipeStart = 0, curveMix = 1, mixFrom = 1, mixStart = 0;
  let lin = null, tour = [], tourI = 0, pos = null, target = null, moveStart = 0, moveFrom = null;
  let lastUser = -1e9, raf = 0, visible = false, started = false;

  const load = () => {
    ['adapter-linear', 'adapter-bezier', 'adapter-grid'].forEach((n, i) => { imgs[i].decoding = 'async'; imgs[i].src = `assets/img/${n}.webp`; });
    return Promise.all(imgs.map(im => im.decode().catch(() => {})));
  };
  const nearIO = new IntersectionObserver(es => { if (es[0].isIntersecting) { nearIO.disconnect(); ready(); } }, { rootMargin: '900px 0px' });
  nearIO.observe(box);
  const ready = () => load().then(() => {
    const oc = document.createElement('canvas'); oc.width = IW; oc.height = IH;
    const g = oc.getContext('2d', { willReadFrequently: true }); g.drawImage(imgs[0], 0, 0);
    try { lin = g.getImageData(0, 0, IW, IH).data; } catch (_) { lin = null; }
    if (lin) tour = pickTour();
    pos = tour[0] ? { ...tour[0] } : { x: IW * 0.5, y: IH * 0.6 };
    kick();
  });
  function pix(x, y) {
    const i = (Math.min(IH - 1, Math.max(0, y | 0)) * IW + Math.min(IW - 1, Math.max(0, x | 0))) * 4;
    return lin ? [lin[i] / 255, lin[i + 1] / 255, lin[i + 2] / 255] : [0, 0, 0];
  }
  function pickTour() {                                   // points spread over the brightness range, so the probe visits every slice
    const pts = [];
    for (let y = 40; y < IH - 40; y += 10) for (let x = 40; x < IW - 40; x += 10) { const [r, g, b] = pix(x, y); pts.push({ x, y, l: (r + g + b) / 3 }); }
    pts.sort((a, b) => a.l - b.l);
    const want = [[0.35, 0.5, 0.78], [0.7, 0.28, 0.62], [0.9, 0.6, 0.55], [0.985, 0.42, 0.5], [0.997, 0.62, 0.48], [0.8, 0.8, 0.4]];
    return want.map(([q, tx, ty]) => {
      const lo = Math.floor(q * (pts.length - 1) * 0.985), hi = Math.min(pts.length - 1, Math.ceil(q * (pts.length - 1) * 1.012) + 1);
      let best = pts[lo], bd = 1e18;
      for (let i = lo; i <= hi; i++) { const p = pts[i], d = (p.x / IW - tx) ** 2 + (p.y / IH - ty) ** 2; if (d < bd) { bd = d; best = p; } }
      return { x: best.x, y: best.y };
    });
  }
  function setStage(s, user) {
    if (s === stage && wipeT >= 1) return;
    from = stage; stage = s; wipeStart = performance.now(); wipeT = 0;
    mixFrom = curveMix; mixStart = performance.now();
    tabs.forEach(t => t.setAttribute('aria-selected', String(+t.dataset.stage === s)));
    tag.textContent = NAMES[s];
    if (user) lastUser = performance.now();
    kick();
  }
  tabs.forEach(t => t.addEventListener('click', () => setStage(+t.dataset.stage, true)));

  function toImage(e) { const r = view.getBoundingClientRect(); return { x: clamp((e.clientX - r.left) / r.width) * IW, y: clamp((e.clientY - r.top) / r.height) * IH }; }
  view.addEventListener('pointermove', e => { if (e.pointerType === 'touch' && e.buttons === 0) return; pos = toImage(e); target = null; lastUser = performance.now(); kick(); });
  view.addEventListener('pointerdown', e => { pos = toImage(e); target = null; lastUser = performance.now(); kick(); });
  view.addEventListener('keydown', e => {
    const d = e.shiftKey ? 80 : 20, m = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] }[e.key];
    if (!m || !pos) return; e.preventDefault(); pos = { x: clamp(pos.x + m[0], 0, IW - 1), y: clamp(pos.y + m[1], 0, IH - 1) }; target = null; lastUser = performance.now(); kick();
  });

  function drawImage(now) {
    const [W, H, ctx] = sizeCanvas(cv);
    wipeT = clamp((now - wipeStart) / 950);
    const w = E.cInOut(wipeT);
    if (imgs[from].naturalWidth) ctx.drawImage(imgs[from], 0, 0, W, H);
    if (w > 0 && imgs[stage].naturalWidth) {
      const tiltPx = H * 0.32, xb = lerp(-tiltPx, W, w), xt = xb + tiltPx;
      ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(xt, 0); ctx.lineTo(xb, H); ctx.lineTo(0, H); ctx.closePath(); ctx.clip();
      ctx.drawImage(imgs[stage], 0, 0, W, H); ctx.restore();
      if (w < 1) line(ctx, [xt, 0], [xb, H], 'rgba(242,240,232,0.92)', 1.6);
    }
    if (wipeT >= 1) from = stage;
  }
  function drawCurve(v) {
    const [W, H, ctx] = sizeCanvas(curveCv);
    ctx.clearRect(0, 0, W, H);
    const L = 30, R = 8, T = 8, B = 22, pw = W - L - R, ph = H - T - B;
    const X = x => L + x * pw, Y = y => T + (1 - y) * ph;
    ctx.font = '500 11px "Barlow SC", sans-serif'; ctx.fillStyle = C.faint; ctx.textAlign = 'center';
    for (let i = 0; i <= 4; i++) {
      const u = i / 4;
      line(ctx, [X(u), Y(0)], [X(u), Y(1)], C.rule, 1, 1, i === 0 ? 0.9 : 0.35);
      line(ctx, [X(0), Y(u)], [X(1), Y(u)], C.rule, 1, 1, i === 0 ? 0.9 : 0.35);
    }
    ctx.fillText('0', X(0), H - 6); ctx.fillText('1', X(1) - 3, H - 6); ctx.fillText('input', X(0.5), H - 6);
    ctx.save(); ctx.translate(11, Y(0.5)); ctx.rotate(-Math.PI / 2); ctx.fillText('output', 0, 0); ctx.restore();
    line(ctx, [X(0), Y(0)], [X(1), Y(1)], C.faint, 1.1, 1, 0.8, [5, 6]);
    for (let ch = 0; ch < 3; ch++) {
      const pts = [];
      for (let i = 0; i <= 128; i++) { const x = i / 128; pts.push([X(x), Y(lerp(x, curveY(ch, x), curveMix))]); }
      poly(ctx, pts, RGB[ch], 2.1);
    }
    if (v) for (let ch = 0; ch < 3; ch++) {
      const x = v[ch], y = lerp(x, curveY(ch, x), curveMix);
      line(ctx, [X(x), Y(0)], [X(x), Y(y)], RGB[ch], 1, 1, 0.55, [2, 3]);
      line(ctx, [X(x), Y(y)], [X(0), Y(y)], RGB[ch], 1, 1, 0.55, [2, 3]);
      dot(ctx, X(x), Y(y), 5.2, '#fff'); dot(ctx, X(x), Y(y), 3.6, RGB[ch]);
    }
  }
  function drawGrid(p, l) {
    const [W, H, ctx] = sizeCanvas(gridCv);
    ctx.clearRect(0, 0, W, H);
    const on = stage === 2 ? 1 : 0.4;
    const pw = W * 0.62, pd = H * 0.2, sk = W * 0.2, x0 = W * 0.08, gap = (H - pd - 20) / (GD - 1), yb = H - 10;
    const Pt = (u, v, d) => [x0 + u * pw + v * sk, yb - d * gap - v * pd];
    const bin = l == null ? -1 : Math.min(GD - 1, Math.floor(l * GD));
    for (let d = 0; d < GD; d++) {
      const hot = d === bin && stage === 2;
      const q = [Pt(0, 0, d), Pt(1, 0, d), Pt(1, 1, d), Pt(0, 1, d)];
      ctx.save(); ctx.globalAlpha = on;
      ctx.beginPath(); q.forEach((c, i) => (i ? ctx.lineTo(c[0], c[1]) : ctx.moveTo(c[0], c[1]))); ctx.closePath();
      ctx.fillStyle = hot ? 'rgba(217,79,43,0.10)' : 'rgba(115,156,135,0.07)'; ctx.fill();
      ctx.strokeStyle = hot ? C.ver : rgba(C.sage, 0.55); ctx.lineWidth = hot ? 1.5 : 1; ctx.stroke();
      if (hot || d === 0 || d === GD - 1) {
        for (let i = 1; i < 12; i++) line(ctx, Pt(i / 12, 0, d), Pt(i / 12, 1, d), hot ? C.ver : C.sage, 0.6, 1, hot ? 0.28 : 0.16);
        for (let j = 1; j < 6; j++) line(ctx, Pt(0, j / 6, d), Pt(1, j / 6, d), hot ? C.ver : C.sage, 0.6, 1, hot ? 0.28 : 0.16);
      }
      ctx.restore();
    }
    ctx.font = '500 11px "Barlow SC", sans-serif'; ctx.fillStyle = C.faint; ctx.textAlign = 'left';
    const [lx0, ly0] = Pt(1, 0, 0), [lx1, ly1] = Pt(1, 0, GD - 1);
    ctx.fillText('dark', lx0 + 8, ly0 + 2); ctx.fillText('bright', lx1 + 8, ly1 + 2);
    if (p && stage === 2) {
      const u = p.x / IW, v = 1 - p.y / IH;
      const top = Pt(u, v, GD - 1), bot = Pt(u, v, 0), at = Pt(u, v, clamp(l * GD - 0.5, 0, GD - 1));
      line(ctx, bot, top, C.ink2, 1, 1, 0.5, [2, 3]);
      const cu = 1 / 12, cv2 = 1 / 6, u0 = Math.floor(u / cu) * cu, v0 = Math.floor(v / cv2) * cv2;
      const cell = [Pt(u0, v0, bin), Pt(u0 + cu, v0, bin), Pt(u0 + cu, v0 + cv2, bin), Pt(u0, v0 + cv2, bin)];
      ctx.beginPath(); cell.forEach((c, i) => (i ? ctx.lineTo(c[0], c[1]) : ctx.moveTo(c[0], c[1]))); ctx.closePath();
      ctx.fillStyle = 'rgba(217,79,43,0.35)'; ctx.fill();
      dot(ctx, at[0], at[1], 5, '#fff'); dot(ctx, at[0], at[1], 3.4, C.ver);
    }
  }
  const f3 = x => x.toFixed(3).replace(/^0/, '');
  function readouts(v, l) {
    if (!v) return;
    const cls = ['r', 'g', 'b'], nm = ['R', 'G', 'B'];
    if (stage === 0) outCurve.innerHTML = 'Adapter input, linear: ' + v.map((x, c) => `<span class="${cls[c]}">${nm[c]} <b>${f3(x)}</b></span>`).join(' · ');
    else outCurve.innerHTML = v.map((x, c) => `<span class="${cls[c]}">${nm[c]} <b>${f3(x)}</b> → <b>${f3(curveY(c, x))}</b></span>`).join(' · ');
    const bin = Math.min(GD - 1, Math.floor(l * GD)) + 1, gx = Math.floor(pos.x / 16) + 1, gy = Math.floor(pos.y / 16) + 1;
    outGrid.innerHTML = stage === 2
      ? `Brightness ℓ <b>${f3(l)}</b> → luminance bin <b>${bin}</b> of 8 · cell <b>${gx}, ${gy}</b> of ${GW} × ${GH}`
      : `Brightness ℓ <b>${f3(l)}</b> would pick luminance bin <b>${bin}</b> of 8. Switch on the grid to see the lookup.`;
  }

  function frame(now) {
    raf = 0;
    if (!visible) return;
    // after a pause, the probe tours the frame on its own
    if (tour.length && now - lastUser > 2600) {
      if (!target || now - moveStart > 2400) { tourI = (tourI + 1) % tour.length; target = tour[tourI]; moveFrom = { ...pos }; moveStart = now; }
      const u = E.cInOut(clamp((now - moveStart) / 1100));
      pos = { x: lerp(moveFrom.x, target.x, u), y: lerp(moveFrom.y, target.y, u) };
    }
    curveMix = lerp(mixFrom, stage >= 1 ? 1 : 0, E.cInOut(clamp((now - mixStart) / 800)));
    drawImage(now);
    const v = pos ? pix(pos.x, pos.y) : null, l = v ? (v[0] + v[1] + v[2]) / 3 : null;   // ℓ is taken from the unmapped input, as in the paper
    drawCurve(v); drawGrid(pos, l); readouts(v, l);
    if (pos) {
      const r = view.getBoundingClientRect();
      probeEl.style.transform = `translate(${pos.x / IW * r.width}px, ${pos.y / IH * r.height}px)`;
      view.classList.add('is-probing');
    }
    if (visible) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }
  new IntersectionObserver(es => {
    visible = es[0].isIntersecting; kick();
    if (visible && !started) {                            // first view: walk through the three stages
      started = true;
      if (!REDUCED) { stage = 0; from = 0; curveMix = 0; mixFrom = 0; tabs.forEach(t => t.setAttribute('aria-selected', String(+t.dataset.stage === 0))); tag.textContent = NAMES[0];
        setTimeout(() => performance.now() - lastUser > 1000 && setStage(1), 1300); setTimeout(() => performance.now() - lastUser > 1000 && setStage(2), 3300); }
    }
  }, { threshold: 0.2 }).observe(box);
  addEventListener('resize', kick);
})();

// ================================================================ 03 — comparison slider
(() => {
  const box = $('#compare'); if (!box) return;
  const stageEl = $('.compare-stage', box), left = $('.cmp-left', box), svg = $('.cmp-boxes', box), tagL = $('.cmp-tag--left', box);
  const M = {
    'default-isp': { src: 'assets/img/cmp-default-isp.webp', name: 'Default ISP', key: 'default_isp' },
    'raw-adapter': { src: 'assets/img/cmp-raw-adapter.webp', name: 'RAW-Adapter' },
    'dark-isp': { src: 'assets/img/cmp-dark-isp.webp', name: 'Dark-ISP' },
  };
  const warm = new IntersectionObserver(es => { if (es[0].isIntersecting) { warm.disconnect(); Object.values(M).forEach(m => { const im = new Image(); im.src = m.src; }); } }, { rootMargin: '900px 0px' });
  warm.observe(box);
  let method = 'default-isp', x = 50;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
  svg.innerHTML = '';
  const defs = el('defs', {}, svg);
  const cl = el('rect', { x: 0, y: 0, width: 300, height: 400 }, el('clipPath', { id: 'cmpL' }, defs));
  const cr = el('rect', { x: 300, y: 0, width: 300, height: 400 }, el('clipPath', { id: 'cmpR' }, defs));
  const gL = el('g', { 'clip-path': 'url(#cmpL)' }, svg), gR = el('g', { 'clip-path': 'url(#cmpR)' }, svg);
  function boxes(g, preds) {
    g.innerHTML = '';
    preds.forEach((p, k) => {
      const [x0, y0, x1, y1] = p.box, grp = el('g', { class: 'pop', style: `--k:${k}` }, g);
      el('rect', { class: 'box', x: x0, y: y0, width: x1 - x0, height: y1 - y0 }, grp);
      const lab = el('g', { class: 'lab' }, grp), text = `${p.label} ${p.score.toFixed(2)}`;
      const ly = Math.max(0, y0 - 13);
      el('rect', { x: x0 - 0.8, y: ly, width: text.length * 5.55 + 5, height: 13 }, lab);
      const t = el('text', { x: x0 + 2.4, y: ly + 10 }, lab); t.textContent = text;
    });
  }
  dataReady.then(() => { if (!DEMO) return; boxes(gR, DEMO.compare.rawild); if (M[method].key) boxes(gL, DEMO.compare[M[method].key]); });
  function setX(v) {
    x = clamp(v, 0, 100);
    stageEl.style.setProperty('--x', x + '%'); stageEl.setAttribute('aria-valuenow', Math.round(x));
    cl.setAttribute('width', 6 * x); cr.setAttribute('x', 6 * x); cr.setAttribute('width', 600 - 6 * x);
    tagL.style.opacity = x < 16 ? 0 : 1; $('.cmp-tag--right', box).style.opacity = x > 84 ? 0 : 1;
  }
  setX(62);
  $$('[data-m]', box).forEach(b => b.addEventListener('click', () => {
    method = b.dataset.m; $$('[data-m]', box).forEach(o => o.setAttribute('aria-pressed', String(o === b)));
    left.src = M[method].src; tagL.textContent = M[method].name;
    gL.innerHTML = ''; if (M[method].key && DEMO) boxes(gL, DEMO.compare[M[method].key]);
  }));
  let drag = false;
  const at = e => { const r = stageEl.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; };
  stageEl.addEventListener('pointerdown', e => { drag = true; stageEl.setPointerCapture(e.pointerId); stageEl.classList.add('is-drag'); cancelAnim(); setX(at(e)); });
  stageEl.addEventListener('pointermove', e => { if (drag) setX(at(e)); });
  const end = () => { drag = false; stageEl.classList.remove('is-drag'); };
  stageEl.addEventListener('pointerup', end); stageEl.addEventListener('pointercancel', end);
  stageEl.addEventListener('keydown', e => {
    const d = e.shiftKey ? 10 : 2, m = { ArrowLeft: -d, ArrowRight: d, Home: -100, End: 100 }[e.key];
    if (m == null) return; e.preventDefault(); cancelAnim(); setX(x + m);
  });
  let animId = 0;
  function cancelAnim() { cancelAnimationFrame(animId); animId = 0; }
  // The two pedestrians stand in the right third of this frame, so the divider sweeps across them
  // (one baseline box turns into two RAWild boxes as it passes) and rests at their left edge.
  const REST = 62;
  function sweep(pop) {
    cancelAnim(); if (REDUCED) { setX(REST); box.classList.add('is-pop'); return; }
    setX(99); const s = performance.now() + 200;
    const step = now => {
      const u = clamp((now - s) / 1700); setX(lerp(99, REST, E.cInOut(u)));
      if (u < 1) animId = requestAnimationFrame(step); else { animId = 0; if (pop) box.classList.add('is-pop'); }
    };
    animId = requestAnimationFrame(step);
  }
  whenRevealed(box, () => sweep(true));
  $$('[data-m]', box).forEach(b => b.addEventListener('click', () => { if (box.classList.contains('is-in')) sweep(false); }));
})();

// ================================================================ 03 — metrics: bars on the beat, numbers counting up
$$('.bar').forEach(b => b.style.setProperty('--row', b.dataset.i));
function countUp(elm, delay) {
  const to = parseFloat(elm.dataset.to), sign = elm.dataset.sign || '', dec = (elm.dataset.to.split('.')[1] || '').length;
  if (REDUCED) { elm.textContent = sign + to.toFixed(dec); return; }
  elm.textContent = sign + (0).toFixed(dec);
  const s = performance.now() + delay;
  const step = now => { const u = clamp((now - s) / 1500); elm.textContent = sign + (to * E.eOut(u)).toFixed(dec); if (u < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
whenRevealed($('.metrics-hero'), () => { const c = $$('.metrics-hero .count'); if (c[0]) countUp(c[0], 150); if (c[1]) countUp(c[1], 2200); });

// ================================================================ 03 — all numbers from the paper (verbatim)
const TABLES = {"t1r":{"cap":"Table 1 · ResNet-50 backbone · mAP@50 and mAP@75 on PASCALRAW (low-light / normal / over-exposed), LOD, ROD and AODRaw.","groups":["PAS.LOW","PAS.NM","PAS.OE","LOD","ROD","AODRaw"],"sub":["@50","@75"],"rows":[["Linear-RAW","0.7668","0.5793","0.8661","0.7273","0.8747","0.7298","0.5710","0.3713","0.3041","0.1963","0.2301","0.1485"],["Default-ISP","0.8390","0.6676","0.8959","0.7328","0.8967","0.7333","0.5880","0.3549","0.4178","0.2709","0.3241","0.2063"],["ReconfigISP","0.8562","0.6662","0.8949","0.7286","0.8989","0.7263","0.5383","0.2903","0.3436","0.2137","0.2896","0.1763"],["RAW-Adapter","0.8647","0.6935","0.8942","0.7270","0.8987","0.7333","0.6082","0.3285","0.3950","0.2560","0.2934","0.1878"],["AdaptiveISP","0.8871","0.7293","0.9014","0.7872","0.9011","0.7636","0.6142","0.4071","0.4379","0.2848","0.3382","0.2131"],["Dark-ISP","0.7139","0.4663","0.8940","0.7550","0.8840","0.6890","0.5560","0.3630","0.4090","0.2710","0.3240","0.2060"],["Dr.RAW","0.8865","0.7305","0.8983","0.7639","0.8982","0.7624","0.6408","0.4399","0.4720","0.3160","0.3630","0.2310"],["RAWild (ours)","0.8910","0.7330","0.9020","0.7690","0.9020","0.7690","0.6909","0.4363","0.5541","0.3752","0.3623","0.2311"]]},"t1s":{"cap":"Table 1 · Swin-Transformer backbone · mAP@50 and mAP@75 on PASCALRAW (low-light / normal / over-exposed), LOD, ROD and AODRaw.","groups":["PAS.LOW","PAS.NM","PAS.OE","LOD","ROD","AODRaw"],"sub":["@50","@75"],"rows":[["Linear-RAW","0.5517","0.3336","0.8707","0.6882","0.8733","0.6196","0.5279","0.2828","0.3251","0.2120","0.1241","0.0768"],["Default-ISP","0.8581","0.7156","0.9023","0.7769","0.8966","0.7410","0.6978","0.5015","0.4885","0.3119","0.3428","0.2308"],["ReconfigISP","0.8803","0.6999","0.8946","0.7165","0.9017","0.7618","0.5935","0.3746","0.4051","0.2527","0.2977","0.1966"],["RAW-Adapter","0.8727","0.7121","0.9017","0.7869","0.8967","0.7546","0.6289","0.4149","0.4386","0.2869","0.3035","0.1985"],["AdaptiveISP","0.7830","0.5516","0.8704","0.7239","0.8883","0.7308","0.5990","0.4581","0.4440","0.2711","0.3661","0.2471"],["Dark-ISP","0.7233","0.4852","0.9010","0.7672","0.8980","0.7556","0.6303","0.4146","0.5039","0.3273","0.3398","0.2233"],["Dr.RAW","0.8814","0.7183","0.8986","0.7591","0.8958","0.7190","0.6950","0.5266","0.4933","0.3192","0.3268","0.2160"],["RAWild (ours)","0.9083","0.7406","0.9342","0.7792","0.9313","0.7921","0.6986","0.5057","0.5191","0.3467","0.4394","0.3263"]]},"t2":{"cap":"Table 2 · Mixed-sensor detection · synthetic (Syn) and real mixed-sensor datasets, mAP@50 and mAP@75.","groups":["PAS (Syn)","LOD (Syn)","ROD (Syn)","PAS & LOD","Multi-RAW"],"sub":["@50","@75"],"rows":[["Linear-RAW","0.8921","0.7295","0.5310","0.3297","0.3497","0.2273","0.6057","0.4175","0.2539","0.1227"],["RAW-Adapter","0.8869","0.7233","0.5874","0.3945","0.3637","0.2397","0.6540","0.4370","0.2334","0.1025"],["Dr.RAW","0.8949","0.7324","0.5924","0.4164","0.4234","0.2821","0.6660","0.4750","0.2572","0.1195"],["Dark-ISP","0.8888","0.7334","0.5837","0.3390","0.3703","0.2403","0.6420","0.4360","0.2603","0.1063"],["RAWild (ours)","0.8953","0.7343","0.6646","0.4602","0.4291","0.3223","0.6865","0.4896","0.3528","0.1336"]]},"t7":{"cap":"Table 7 · Semantic segmentation on RAW ADE20K with MiT backbones, mIoU, under low-light (LOW), normal (NM) and over-exposed (OE) conditions.","groups":["LOW","NM","OE"],"sub":["B0","B3","B5"],"rows":[["Linear-RAW","0.2027","0.3538","0.3653","0.2632","0.4403","0.4546","0.2691","0.4229","0.4404"],["RAW-Adapter","0.1885","0.3453","0.3636","0.2939","0.4457","0.4541","0.2683","0.4284","0.4385"],["Dr.RAW","0.2206","0.3581","0.3821","0.3134","0.4477","0.4666","0.2929","0.4343","0.4475"],["Dark-ISP","0.2202","0.3559","0.3806","0.3131","0.4432","0.4680","0.2917","0.4283","0.4488"],["RAWild (ours)","0.2872","0.3957","0.4082","0.3534","0.4516","0.4708","0.3372","0.4381","0.4560"]]},"t3":{"cap":"Table 3 · Efficiency · inference time and memory, as reported in the paper.","groups":null,"sub":["Time (ms)","Memory (GB)"],"rows":[["Linear-RAW","7.20","0.23"],["RAW-Adapter","10.00","0.24"],["Dr.RAW","10.52","0.53"],["Dark-ISP","20.45","0.99"],["RAWild (ours)","10.70","0.24"]]}};
(() => {
  const host = $('[data-table-host]'), cap = $('[data-table-caption]'); if (!host) return;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function render(id) {
    const t = TABLES[id]; let h = '<table class="rtable"><thead>';
    if (t.groups) {
      h += '<tr class="group"><th></th>' + t.groups.map(g => `<th colspan="${t.sub.length}" scope="colgroup">${esc(g)}</th>`).join('') + '</tr>';
      h += '<tr><th scope="col">Method</th>' + t.groups.map(() => t.sub.map(s => `<th scope="col">${esc(s)}</th>`).join('')).join('') + '</tr>';
    } else h += '<tr><th scope="col">Method</th>' + t.sub.map(s => `<th scope="col">${esc(s)}</th>`).join('') + '</tr>';
    h += '</thead><tbody>' + t.rows.map(r => `<tr${r[0].startsWith('RAWild') ? ' class="ours"' : ''}><td>${esc(r[0])}</td>${r.slice(1).map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('') + '</tbody></table>';
    host.innerHTML = h; cap.textContent = t.cap + ' Values exactly as printed in the paper.';
  }
  $$('[data-t]').forEach(b => b.addEventListener('click', () => { $$('[data-t]').forEach(o => o.setAttribute('aria-selected', String(o === b))); render(b.dataset.t); }));
  render('t1r');
})();

// ================================================================ 04 — copy BibTeX
$$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
  const src = $(btn.dataset.copy), label = $('.copy-label', btn), text = src.innerText.trim();
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch (_) {
    const r = document.createRange(); r.selectNodeContents(src); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    try { ok = document.execCommand('copy'); } catch (__) { ok = false; } s.removeAllRanges();
  }
  btn.classList.toggle('is-done', ok); label.textContent = ok ? 'Copied' : 'Select and copy';
  setTimeout(() => { btn.classList.remove('is-done'); label.textContent = 'Copy BibTeX'; }, 1800);
}));
})();
