/* RAWild project page.
 * The hero replays the film's title card (same beats, 82 BPM, 1.75x faster) and then keeps its grid box turning in 3D.
 * Everything else uses the film's vocabulary: rise-out-of-the-baseline text, wipes, pops, bars on the beat. */
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
const HOVER = matchMedia('(hover: hover)').matches;
const dprOf = () => Math.min(2, window.devicePixelRatio || 1);
const root = document.documentElement;
const json = url => fetch(url).then(r => { if (!r.ok) throw new Error(url); return r.json(); });
const loadImg = src => new Promise((res, rej) => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = rej; im.src = src; });

function sizeCanvas(cv) {                     // backing store = CSS size x DPR; returns [w, h, ctx]
  const r = cv.getBoundingClientRect(), d = dprOf();
  const w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
  return [r.width, r.height, ctx];
}
function line(ctx, a, b, color, width, p = 1, alpha = 1, dash = null) {
  if (p <= 0 || alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(lerp(a[0], b[0], p), lerp(a[1], b[1], p)); ctx.stroke(); ctx.restore();
}
function poly(ctx, pts, color, width, o = {}) {
  if (pts.length < 2) return;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.globalAlpha *= (o.alpha == null ? 1 : o.alpha);
  if (o.glow) { ctx.shadowColor = rgba(color.startsWith('#') ? color : C.ver, o.glow); ctx.shadowBlur = o.blur || 12; }
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke(); ctx.restore();
}
function dot(ctx, x, y, r, color, alpha = 1, glow = 0) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color;
  if (glow) { ctx.shadowColor = rgba(C.ver, 0.55); ctx.shadowBlur = glow; }
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
const lutY = (lut, x) => { const f = clamp(x) * 255, i = Math.min(254, Math.floor(f)), u = f - i; return lut[i] * (1 - u) + lut[i + 1] * u; };
const LUT3 = m => [m.lut.r, m.lut.g, m.lut.b];

// A loop that only runs while its element is on screen.
function visibleLoop(el, draw, opts = {}) {
  let raf = 0, on = false;
  const tick = t => { raf = 0; if (!on || document.hidden) return; draw(t); raf = requestAnimationFrame(tick); };
  const start = () => { if (!raf && on && !REDUCED) raf = requestAnimationFrame(tick); };
  new IntersectionObserver(es => { on = es[0].isIntersecting; if (on) { start(); if (REDUCED) draw(performance.now()); } }, { rootMargin: opts.margin || '80px 0px' }).observe(el);
  document.addEventListener('visibilitychange', start);
  return { kick: () => { if (REDUCED) draw(performance.now()); else start(); } };
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
  const id = e.target.dataset.nav || e.target.id;
  navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
}), { rootMargin: '-45% 0px -50% 0px' });
[['film'], ['problem'], ['sensors', 'problem'], ['method'], ['story', 'method'], ['architecture', 'method'], ['results'], ['compare', 'results'], ['numbers', 'results'], ['paper']]
  .forEach(([id, nav]) => { const s = document.getElementById(id); if (s) { if (nav) s.dataset.nav = nav; navIO.observe(s); } });
new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) navLinks.forEach(a => a.classList.remove('is-active')); }),
  { rootMargin: '-45% 0px -50% 0px' }).observe($('#top'));

// ---------------------------------------------------------------- reveal on scroll
const onReveal = new Map();
const revealIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('is-in'); revealIO.unobserve(e.target);
  const cb = onReveal.get(e.target); if (cb) cb();
}), { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
$$('.reveal').forEach(el => revealIO.observe(el));
function whenRevealed(el, cb) { if (!el) return; if (el.classList.contains('is-in')) cb(); else onReveal.set(el, cb); }

// Demo scene metadata (curves etc.), shared by the hero, the pillars and the adapter demo.
const demoIndex = json('assets/demo/index.json').catch(() => []);
const metaCache = new Map();
const demoMeta = id => { if (!metaCache.has(id)) metaCache.set(id, json(`assets/demo/${id}/meta.json`)); return metaCache.get(id); };

// ================================================================ HERO — the film's title card, then a turning grid box
const hero = $('.hero'), heroCv = $('.hero-canvas'), emblem = $('.emblem'), wm = $('.wm--hero');
wm.innerHTML = [...'RAWild'].map((ch, i) => `<span class="ch" style="--i:${i}">${ch}</span>`).join('') + '<i class="wm-dot"></i>';
const wmDot = $('.wm-dot', wm);
$$('[data-at]', hero).forEach(el => el.style.setProperty('--at', el.dataset.at));

const BPM = 82;
let BEAT = 60 / BPM / 1.75, t0 = 0, landed = false, heroVisible = true, heroLUT = null;
const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
const FAN = [1.6, 0, -1.6];                                          // depth per unit of bend: R forward, G flat, B back
function setBeat(speed) { BEAT = 60 / BPM / speed; root.style.setProperty('--beat', BEAT.toFixed(4) + 's'); }
const heroBeat = () => (performance.now() - t0) / 1000 / BEAT;

function drawHero(b) {
  if (!heroLUT) return;
  if (window.__hero && window.__hero.b != null) b = window.__hero.b;     // freeze a beat when tuning
  const [W, H, ctx] = sizeCanvas(heroCv);
  ctx.clearRect(0, 0, W, H);
  const hr = hero.getBoundingClientRect(), er = emblem.getBoundingClientRect(), dr = wmDot.getBoundingClientRect();
  const ex = er.left - hr.left, ey = er.top - hr.top, ew = er.width, eh = er.height;
  const k = ew / 376;                                             // the film's emblem is 376 px wide at 1920
  const bw = Math.min(W * 0.69, (H * 0.6) * 1320 / 700), bh = bw * 700 / 1320;
  const shrink = P(b, 3.95, 4.8, E.qOut);
  const secs = b * BEAT;

  // after the box unfolds it starts to turn; the pointer steers the turn
  const turn = P(b, 6.6, 9.8, E.sInOut);
  const yaw = turn * (0.62 * Math.sin(secs * 0.42) + tilt.x);
  const pitch = turn * (-0.1 + 0.16 * Math.sin(secs * 0.31 + 1.1) + tilt.y);
  const lift = turn * Math.sin(secs * 0.8) * 3;
  const cx = lerp(W / 2, ex + ew / 2, shrink), cy = lerp(H * 0.5, ey + eh / 2, shrink) + lift;
  const PW = lerp(bw, ew, shrink), PH = lerp(bh, eh, shrink);
  const D = ew * 0.5, f = ew * 4.2, spread = P(b, 6.8, 9.2, E.sInOut);
  const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const proj = (x, y, z) => {                                       // x right, y up, z away from the viewer
    const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw;
    const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
    const s = f / (f + z2);
    return [cx + x1 * s, cy - y2 * s, z2];
  };
  const map = (x, y, z = 0) => proj((x - 0.5) * PW, (y - 0.5) * PH, z);

  const gridA = P(b, 0, 0.7) * (1 - shrink);                        // faint coordinate grid while the plot is big
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

  // the grid box: back and floor first, curves in between, front edges last
  const unfold = P(b, 6.5, 8.6);
  const hw = ew / 2 + 14 * k, hh = eh / 2 + 12 * k;
  const V = (sx, sy, sz) => proj(sx * hw, sy * hh, sz * D / 2);
  const depthA = z => clamp(0.55 - z / (D * 2.2), 0.18, 1);         // farther edges are fainter
  const edge = (a, c, p, alpha, w) => { if (p > 0) line(ctx, a, c, C.sage, w, clamp(p), alpha * depthA((a[2] + c[2]) / 2)); };
  if (unfold > 0) {
    for (let i = 1; i < 6; i++) { const x = -1 + 2 * i / 6; edge(V(x, -1, 1), V(x, 1, 1), unfold * 1.5 - 0.3 - i * 0.04, 0.5, 0.9); edge(V(x, -1, -1), V(x, -1, 1), unfold * 1.5 - 0.45 - i * 0.03, 0.5, 0.9); }
    for (let j = 1; j < 4; j++) { const y = -1 + 2 * j / 4; edge(V(-1, y, 1), V(1, y, 1), unfold * 1.5 - 0.35 - j * 0.05, 0.5, 0.9); }
    const B4 = [V(-1, 1, 1), V(1, 1, 1), V(1, -1, 1), V(-1, -1, 1)];
    for (let q = 0; q < 4; q++) edge(B4[q], B4[(q + 1) % 4], unfold * 1.6 - 0.1, 0.8, 1.1);
  }
  const travel = P(b, 0, 3.85, u => 1 - Math.pow(1 - u, 1.7));
  const lw = Math.max(1.7, 5.2 * PW / 1320 * (W / 1920) * 1.9);
  // The three curves share black and white and stay anchored to one straight line, the diagonal (no correction):
  // each leaves it in its own direction — R toward the viewer, B away, G in the plane — by as much as it bends.
  if (spread > 0) line(ctx, map(0, 0), map(1, 1), C.ink2, 1, 1, 0.34 * spread, [3, 5]);
  if (travel > 0) for (let ch = 0; ch < 3; ch++) {
    const pts = [];
    for (let i = 0; i <= 160; i++) { const x = travel * i / 160, y = lutY(heroLUT[ch], x); pts.push(map(x, y, FAN[ch] * (y - x) * PH * spread)); }
    poly(ctx, pts, RGB[ch], lw, { glow: 0.25, blur: 12 * Math.max(0.35, PW / bw) });
  }
  if (unfold > 0) {
    const F4 = [V(-1, 1, -1), V(1, 1, -1), V(1, -1, -1), V(-1, -1, -1)], B4 = [V(-1, 1, 1), V(1, 1, 1), V(1, -1, 1), V(-1, -1, 1)];
    for (let q = 0; q < 4; q++) edge(F4[q], B4[q], unfold * 1.6 - 0.2 - q * 0.05, 1, 1.1);
    for (let q = 0; q < 4; q++) edge(F4[q], F4[(q + 1) % 4], unfold * 1.6 - q * 0.06, 1.3, 1.35);
  }

  // probes merge into one vermilion dot at (1,1), which flies to the wordmark's period (lands on beat 6.5)
  const merge = P(b, 3.85, 4.25), depart = P(b, 5.7, 6.5, E.cIn);
  const pr = dr.width / 2, px = dr.left + pr - hr.left, py = dr.top + dr.height / 2 - hr.top;
  if (b >= 6.5 && !landed) land();
  if (travel > 0 && b < 6.5) {
    const s = Math.max(0.6, PW / bw);
    if (merge < 1) for (let ch = 0; ch < 3; ch++) {
      const [x, y] = map(travel, lutY(heroLUT[ch], travel));
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
}
function land() {                                                    // squash, bounce and two ripples, as on beat 6.5 of the film
  landed = true; wmDot.classList.add('is-landed');
  if (REDUCED) return;
  const hr = hero.getBoundingClientRect(), dr = wmDot.getBoundingClientRect();
  [[5.1, 0], [3.0, 60]].forEach(([s, delay]) => {
    const r = document.createElement('span'); r.className = 'ripple';
    Object.assign(r.style, { left: dr.left - hr.left + 'px', top: dr.top - hr.top + 'px', width: dr.width + 'px', height: dr.height + 'px', animationDelay: delay + 'ms' });
    r.style.setProperty('--s', s); hero.appendChild(r); setTimeout(() => r.remove(), 1400);
  });
}
let heroRAF = 0;
function heroLoop() {
  heroRAF = 0;
  if (!heroVisible || document.hidden) return;
  tilt.x += (tilt.tx - tilt.x) * 0.05; tilt.y += (tilt.ty - tilt.y) * 0.05;
  drawHero(heroBeat());
  heroRAF = requestAnimationFrame(heroLoop);
}
const kickHero = () => { if (!heroRAF && !REDUCED) heroRAF = requestAnimationFrame(heroLoop); };
function startIntro(speed) {
  setBeat(speed);
  hero.classList.add('is-instant'); hero.classList.remove('is-live'); wmDot.classList.remove('is-landed'); landed = false;
  void hero.offsetWidth;
  if (REDUCED) { hero.classList.add('is-live'); drawHero(20); land(); return; }
  hero.classList.remove('is-instant');
  requestAnimationFrame(() => { hero.classList.add('is-live'); t0 = performance.now(); kickHero(); });
}
new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; if (heroVisible) kickHero(); }).observe(hero);
document.addEventListener('visibilitychange', () => { if (!document.hidden) kickHero(); });
addEventListener('pointermove', e => {                               // the pointer steers the box, over a wide range
  if (e.pointerType !== 'mouse' || !heroVisible) return;
  tilt.tx = (e.clientX / innerWidth - 0.5) * 1.1; tilt.ty = (e.clientY / innerHeight - 0.5) * 0.5;
}, { passive: true });
document.addEventListener('pointerleave', () => { tilt.tx = 0; tilt.ty = 0; });
addEventListener('resize', () => { if (REDUCED) drawHero(20); });
const fontsReady = Promise.race([
  Promise.all([document.fonts.load('700 100px "RAWild Mark"'), document.fonts.load('400 24px "Source Serif 4"'), document.fonts.load('500 20px "Barlow SC"')]),
  new Promise(r => setTimeout(r, 1500)),
]);
Promise.all([fontsReady, demoMeta('rod_night-07357').then(m => { heroLUT = LUT3(m); }).catch(() => {})]).then(() => startIntro(1.75));

// ================================================================ FILM — plays by itself when it comes into view
(() => {
  const frame = $('[data-film]'); if (!frame) return;
  const video = $('.film-video', frame), bar = $('[data-bar]', frame), time = $('[data-time]', frame), vol = $('[data-vol]', frame);
  let lang = 'en', userPaused = false, heardOnce = false, idle = 0, dragging = false;
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const src = l => `assets/video/film-${l}-${frame.getBoundingClientRect().width * dprOf() > 1400 ? 1080 : 720}.mp4`;
  const ensureSrc = () => { if (!video.getAttribute('src')) video.src = src(lang); };
  const sync = () => {
    frame.classList.toggle('is-paused', video.paused);
    frame.classList.toggle('is-sound', !video.muted && video.volume > 0);
    $('[data-play]', frame).setAttribute('aria-label', video.paused ? 'Play' : 'Pause');
    $$('[data-sound]', frame).forEach(b => b.setAttribute('aria-label', video.muted ? 'Turn the sound on' : 'Mute'));
    vol.value = video.muted ? 0 : video.volume;
  };
  const tick = () => {
    const d = video.duration || 72, t = video.currentTime;
    bar.style.setProperty('--t', (t / d * 100).toFixed(3) + '%'); bar.setAttribute('aria-valuenow', Math.round(t));
    time.textContent = `${fmt(t)} / ${fmt(d)}`;
    if (video.buffered.length) bar.style.setProperty('--buf', (video.buffered.end(video.buffered.length - 1) / d * 100).toFixed(2) + '%');
  };
  ['play', 'pause', 'volumechange'].forEach(ev => video.addEventListener(ev, sync));
  ['timeupdate', 'progress', 'loadedmetadata'].forEach(ev => video.addEventListener(ev, tick));
  const play = () => { ensureSrc(); const p = video.play(); if (p && p.catch) p.catch(() => {}); };
  new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) ensureSrc(); }), { rootMargin: '600px 0px' }).observe(frame);
  new IntersectionObserver(es => es.forEach(e => {                   // on screen: play (muted); away: pause
    if (e.intersectionRatio >= 0.55) { if (!userPaused && video.paused && !REDUCED) play(); }
    else if (e.intersectionRatio < 0.2 && !video.paused) video.pause();
  }), { threshold: [0, 0.2, 0.55, 1] }).observe(frame);
  const toggle = () => { if (video.paused) { userPaused = false; play(); } else { userPaused = true; video.pause(); } };
  $('[data-play]', frame).addEventListener('click', toggle);
  video.addEventListener('click', toggle);
  $$('[data-sound]', frame).forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    if (video.muted || video.volume === 0) {
      video.muted = false; if (video.volume === 0) video.volume = 1;
      if (!heardOnce && video.currentTime > 1) video.currentTime = 0;    // the first time with sound, start from the top
      heardOnce = true; userPaused = false; play();
    } else video.muted = true;
  }));
  vol.addEventListener('input', () => { video.volume = +vol.value; video.muted = +vol.value === 0; if (!video.muted) heardOnce = true; });
  const seekAt = e => { const r = bar.getBoundingClientRect(); video.currentTime = clamp((e.clientX - r.left) / r.width) * (video.duration || 72); tick(); };
  bar.addEventListener('pointerdown', e => { dragging = true; bar.classList.add('is-drag'); bar.setPointerCapture(e.pointerId); ensureSrc(); seekAt(e); });
  bar.addEventListener('pointermove', e => { if (dragging) seekAt(e); });
  const endDrag = () => { dragging = false; bar.classList.remove('is-drag'); };
  bar.addEventListener('pointerup', endDrag); bar.addEventListener('pointercancel', endDrag);
  bar.addEventListener('keydown', e => {
    const d = { ArrowLeft: -5, ArrowRight: 5, Home: -1e3, End: 1e3 }[e.key]; if (d == null) return;
    e.preventDefault(); video.currentTime = clamp(video.currentTime + d, 0, (video.duration || 72) - 0.1); tick();
  });
  $$('[data-lang]', frame).forEach(b => b.addEventListener('click', () => {
    const l = b.dataset.lang; if (l === lang) return; lang = l;
    $$('[data-lang]', frame).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.lang === l)));
    const t = video.currentTime, playing = !video.paused && !video.ended;
    video.poster = `assets/video/poster-${l}.jpg`; video.preload = 'auto';
    video.addEventListener('loadedmetadata', () => { try { video.currentTime = t; } catch (_) {} if (playing) play(); }, { once: true });
    video.src = src(l); video.load();
  }));
  $('[data-full]', frame).addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (frame.requestFullscreen) frame.requestFullscreen().catch(() => {});
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
  });
  frame.addEventListener('pointermove', () => {
    frame.classList.add('is-active'); clearTimeout(idle);
    idle = setTimeout(() => { if (!dragging) frame.classList.remove('is-active'); }, 2200);
  });
  frame.addEventListener('pointerleave', () => { clearTimeout(idle); frame.classList.remove('is-active'); });
  video.addEventListener('ended', () => { userPaused = true; sync(); });
  sync(); tick();
})();

// ================================================================ 01 — sensor strip (tap to flip on touch screens)
$$('.panel').forEach(p => {
  p.addEventListener('click', () => { if (!HOVER) { const open = !p.classList.contains('is-open'); $$('.panel').forEach(o => o.classList.remove('is-open')); p.classList.toggle('is-open', open); } });
  p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.classList.toggle('is-open'); } });
});

// ================================================================ 02 — three pillars, three moving pictures
(() => {
  const arts = $$('.art'); if (!arts.length) return;
  let curves = [];                                                    // real predicted curves of the demo scenes
  demoIndex.then(ix => Promise.all(ix.map(s => demoMeta(s.id).then(m => ({ label: m.label, lut: LUT3(m) }))))).then(c => { curves = c; }).catch(() => {});
  const draw = {
    curve(ctx, W, H, t) {
      const L = 8, R = W - 8, T = 8, B = H - 22, X = x => lerp(L, R, x), Y = y => lerp(B, T, y);
      line(ctx, [L, B], [R, B], C.rule, 1.2); line(ctx, [L, B], [L, T], C.rule, 1.2);
      line(ctx, [L, B], [R, T], C.faint, 1, 1, 0.8, [4, 5]);
      if (!curves.length) return;
      const per = 3.4, s = t / per, i = Math.floor(s) % curves.length, j = (i + 1) % curves.length, u = E.cInOut(clamp((s % 1 - 0.62) / 0.38));
      for (let ch = 0; ch < 3; ch++) {
        const pts = []; for (let n = 0; n <= 72; n++) { const x = n / 72; pts.push([X(x), Y(lerp(lutY(curves[i].lut[ch], x), lutY(curves[j].lut[ch], x), u))]); }
        poly(ctx, pts, RGB[ch], 2.2);
      }
      const px = 0.5 + 0.44 * Math.sin(t * 0.9);
      for (let ch = 0; ch < 3; ch++) { const y = lerp(lutY(curves[i].lut[ch], px), lutY(curves[j].lut[ch], px), u); dot(ctx, X(px), Y(y), 4.2, '#fff'); dot(ctx, X(px), Y(y), 3, RGB[ch]); }
      line(ctx, [X(px), B], [X(px), T], C.ink2, 1, 1, 0.18, [2, 3]);
      ctx.font = '500 11.5px "Barlow SC", sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = C.muted;
      ctx.globalAlpha = 1 - Math.sin(u * Math.PI) * 0.9; ctx.fillText((u > 0.5 ? curves[j] : curves[i]).label.toUpperCase(), R, H - 5); ctx.globalAlpha = 1;
    },
    grid(ctx, W, H, t) {
      const yaw = 0.5 * Math.sin(t * 0.45), cyw = Math.cos(yaw), syw = Math.sin(yaw);
      const pw = W * 0.34, pd = H * 0.34, gap = H * 0.085, cx = W / 2, base = H * 0.86, f = W * 3;
      const pt = (u, v, d) => {                                         // plane coords u,v in [-1,1], d = luminance bin
        const x = u * pw, z = v * pd, x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, s = f / (f + z1 * 1.6);
        return [cx + x1 * s, base - d * gap - z1 * 0.42 * s];
      };
      const pu = 0.62 * Math.sin(t * 0.7), pv = 0.62 * Math.sin(t * 0.53 + 1), bin = Math.min(7, Math.floor((0.5 + 0.5 * Math.sin(t * 0.37)) * 8));
      for (let d = 0; d < 8; d++) {
        const q = [pt(-1, -1, d), pt(1, -1, d), pt(1, 1, d), pt(-1, 1, d)], hot = d === bin;
        ctx.beginPath(); q.forEach((c, i) => (i ? ctx.lineTo(c[0], c[1]) : ctx.moveTo(c[0], c[1]))); ctx.closePath();
        ctx.fillStyle = hot ? 'rgba(217,79,43,0.12)' : 'rgba(115,156,135,0.07)'; ctx.fill();
        ctx.strokeStyle = hot ? C.ver : rgba(C.sage, 0.55); ctx.lineWidth = hot ? 1.5 : 1; ctx.stroke();
        if (hot) {
          for (let n = 1; n < 6; n++) { line(ctx, pt(-1 + n / 3, -1, d), pt(-1 + n / 3, 1, d), C.ver, 0.6, 1, 0.3); line(ctx, pt(-1, -1 + n / 3, d), pt(1, -1 + n / 3, d), C.ver, 0.6, 1, 0.3); }
          const cu = Math.floor((pu + 1) * 3) / 3 - 1, cv = Math.floor((pv + 1) * 3) / 3 - 1, cell = [pt(cu, cv, d), pt(cu + 1 / 3, cv, d), pt(cu + 1 / 3, cv + 1 / 3, d), pt(cu, cv + 1 / 3, d)];
          ctx.beginPath(); cell.forEach((c, i) => (i ? ctx.lineTo(c[0], c[1]) : ctx.moveTo(c[0], c[1]))); ctx.closePath(); ctx.fillStyle = 'rgba(217,79,43,0.45)'; ctx.fill();
        }
      }
      line(ctx, pt(pu, pv, 0), pt(pu, pv, 7), C.ink2, 1, 1, 0.45, [2, 3]);
      const a = pt(pu, pv, bin); dot(ctx, a[0], a[1], 4.4, '#fff'); dot(ctx, a[0], a[1], 3.1, C.ver);
    },
    hist(ctx, W, H, t) {
      const n = 34, L = 6, R = W - 6, B = H - 26, T = 8, bwid = (R - L) / n;
      const shapes = [[[0.12, 0.08, 1], [0.5, 0.2, 0.25]], [[0.35, 0.14, 1], [0.7, 0.1, 0.4]], [[0.06, 0.05, 1.2], [0.25, 0.12, 0.5], [0.8, 0.08, 0.2]]];
      const s = t / 3.2, i = Math.floor(s) % shapes.length, j = (i + 1) % shapes.length, u = E.cInOut(clamp((s % 1 - 0.55) / 0.45));
      const val = (sh, x) => sh.reduce((a, [m, sd, w]) => a + w * Math.exp(-0.5 * ((x - m) / sd) ** 2), 0);
      const hs = []; let tot = 0;
      for (let k2 = 0; k2 < n; k2++) { const x = (k2 + 0.5) / n, v = lerp(val(shapes[i], x), val(shapes[j], x), u); hs.push(v); tot += v; }
      const mx = Math.max(...hs);
      hs.forEach((v, k2) => { const h = (v / mx) * (B - T); ctx.fillStyle = rgba(C.blue, 0.85); ctx.fillRect(L + k2 * bwid + 1, B - h, bwid - 2, h); });
      line(ctx, [L, B + 0.5], [R, B + 0.5], C.rule, 1.2);
      let acc = 0, q = 1;                                                // quantile ticks: where each eighth of the pixels ends
      hs.forEach((v, k2) => { acc += v / tot; while (q < 8 && acc >= q / 8) { const x = L + (k2 + 1) * bwid; line(ctx, [x, B + 5], [x, B + 15], C.ver, 1.6); q++; } });
      ctx.font = '500 11.5px "Barlow SC", sans-serif'; ctx.fillStyle = C.muted; ctx.textAlign = 'right'; ctx.fillText('QUANTILES', R, H - 3);
    },
  };
  arts.forEach(cv => {
    const kind = cv.dataset.art, t0a = performance.now() + Math.random() * 3000;
    visibleLoop(cv, now => { const [W, H, ctx] = sizeCanvas(cv); ctx.clearRect(0, 0, W, H); draw[kind](ctx, W, H, (now - t0a) / 1000); });
  });
})();

// ================================================================ 02 — one night frame through the adapter, driven by the scroll
// The curve is global, so its step is a plain cross-fade; the grid is local, so its step sweeps across the frame cell by cell.
(() => {
  const story = $('#story'); if (!story) return;
  const layers = $$('.st', story), steps = $$('.story-steps li', story), curveCv = $('.story-curve', story), lattice = $('.story-lattice', story);
  let lut = null, raf = 0, lastS = -1;
  const stageAt = p => (p < 0.14 ? 0 : p < 0.4 ? E.sInOut((p - 0.14) / 0.26) : p < 0.56 ? 1 : p < 0.84 ? 1 + E.sInOut((p - 0.56) / 0.28) : 2);
  const progress = () => { const r = story.getBoundingClientRect(), span = r.height - innerHeight; return span > 0 ? clamp(-r.top / span) : 1; };
  function drawCurve(m) {
    const [W, H, ctx] = sizeCanvas(curveCv); ctx.clearRect(0, 0, W, H);
    const L = 4, R = W - 4, T = 4, B = H - 4, X = x => lerp(L, R, x), Y = y => lerp(B, T, y);
    for (let i = 0; i <= 4; i++) {
      const u = i / 4;
      line(ctx, [X(u), Y(0)], [X(u), Y(1)], C.rule, 1, 1, i === 0 ? 0.9 : 0.32);
      line(ctx, [X(0), Y(u)], [X(1), Y(u)], C.rule, 1, 1, i === 0 ? 0.9 : 0.32);
    }
    line(ctx, [X(0), Y(0)], [X(1), Y(1)], C.faint, 1.1, 1, 0.9, [4, 5]);
    if (!lut) return;
    for (let ch = 0; ch < 3; ch++) {
      const pts = []; for (let i = 0; i <= 96; i++) { const x = i / 96; pts.push([X(x), Y(lerp(x, lutY(lut[ch], x), m))]); }
      poly(ctx, pts, RGB[ch], 2.3);
    }
  }
  function drawSweep(t) {                                             // the grid's cells light up along the sweeping edge
    const [W, H, ctx] = sizeCanvas(lattice); ctx.clearRect(0, 0, W, H);
    if (t <= 0.001 || t >= 0.999) return;
    const cell = W / (1862 / 16), edge = t * W, band = cell * 7;
    ctx.save(); ctx.lineWidth = 0.7;
    for (let x = Math.floor((edge - band) / cell) * cell; x <= edge; x += cell) {
      const a = clamp(1 - (edge - x) / band) * 0.55; if (a <= 0) continue;
      ctx.strokeStyle = `rgba(242,240,232,${a})`; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(242,240,232,0.22)'; ctx.beginPath();
    for (let y = 0; y <= H; y += cell) { ctx.moveTo(Math.max(0, edge - band), y); ctx.lineTo(edge, y); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(242,240,232,0.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(edge, 0); ctx.lineTo(edge, H); ctx.stroke();
    ctx.restore();
  }
  function render() {
    raf = 0;
    const s = REDUCED ? 2 : stageAt(progress());
    if (Math.abs(s - lastS) < 1e-4 && lut) return;
    lastS = s;
    layers[1].style.opacity = clamp(s).toFixed(3);                    // global: the curve fades in everywhere at once
    const t = clamp(s - 1);
    layers[2].style.opacity = t > 0 ? 1 : 0;                          // local: the grid sweeps across
    layers[2].style.clipPath = `inset(0 ${((1 - t) * 100).toFixed(2)}% 0 0)`;
    drawCurve(clamp(s)); drawSweep(t);
    const on = s < 0.5 ? 0 : s < 1.5 ? 1 : 2;
    steps.forEach((li, i) => li.classList.toggle('is-on', REDUCED || i === on));
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(render); };
  demoMeta('rod_night-07732').then(m => { lut = LUT3(m); lastS = -1; schedule(); }).catch(() => {});
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => { lastS = -1; schedule(); });
  schedule();
})();

// ================================================================ 03 — the same frame, four detectors
(() => {
  const box = $('#compare'); if (!box) return;
  const host = $('[data-multiples]', box), note = $('[data-compare-note]', box), tabs = $$('.tabs button[data-scene]', box);
  const SHOW = ['default_isp', 'darkisp', 'drraw_resnet', 'rawild'];
  const cache = new Map(); let current = null, token = 0;
  const load = id => { if (!cache.has(id)) cache.set(id, Promise.all([json(`assets/scenes/${id}/data.json`), loadImg(`assets/scenes/${id}/default.webp`)])); return cache.get(id); };
  host.innerHTML = SHOW.map((k, i) => `<figure class="mult${k === 'rawild' ? ' mult--ours' : ''}" style="--k:${i}"><canvas role="img"></canvas><figcaption><span class="m-name"></span><span class="m-score"></span><span class="m-false"></span></figcaption></figure>`).join('');
  const figs = $$('.mult', host);
  const iou = (a, b) => {
    const ix = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])), iy = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1])), i = ix * iy;
    const u = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - i; return u > 0 ? i / u : 0;
  };
  function matchGT(gt, preds) {                                        // greedy by score, IoU >= 0.5 — the same rule as the counts
    const used = new Set();
    preds.forEach(p => { let best = 0, bj = -1; gt.forEach((g, j) => { if (!used.has(j)) { const o = iou(p.box, g.box); if (o > best) { best = o; bj = j; } } }); if (best >= 0.5) used.add(bj); });
    return used;
  }
  function cropOf(D) {                                                // one crop for all four panels: every box, with room around it
    const [W, H] = D.size, ar = 16 / 10; let x0 = W, y0 = H, x1 = 0, y1 = 0;
    const add = b => { x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]); };
    D.gt.forEach(g => add(g.box)); SHOW.forEach(k => (D.methods[k] ? D.methods[k].boxes : []).forEach(p => add(p.box)));
    let cw = Math.max((x1 - x0) * 1.4, W * 0.35), ch = Math.max((y1 - y0) * 1.4, H * 0.35);
    if (cw / ch < ar) cw = ch * ar; else ch = cw / ar;
    const m = Math.round(W * 0.012), IW = W - 2 * m, IH = H - 2 * m;    // stay clear of the rendering's edge columns
    const k = Math.min(1, IW / cw, IH / ch); cw *= k; ch *= k;
    const cx = clamp((x0 + x1) / 2, m + cw / 2, W - m - cw / 2), cy = clamp((y0 + y1) / 2, m + ch / 2, H - m - ch / 2);
    return [cx - cw / 2, cy - ch / 2, cw, ch];
  }
  function strokeBox(ctx, r, color, dash, width) {
    ctx.save(); ctx.setLineDash(dash || []);
    if (color === '#FFFFFF') { ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = width + 2; ctx.strokeRect(r[0], r[1], r[2], r[3]); }
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.strokeRect(r[0], r[1], r[2], r[3]); ctx.restore();
  }
  function paint() {
    if (!current) return;
    const [D, img] = current, [sx, sy, sw, sh] = cropOf(D), n = D.gt.length;
    figs.forEach((fig, i) => {
      const key = SHOW[i], m = D.methods[key], cv = $('canvas', fig);
      const [W, H, ctx] = sizeCanvas(cv); ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
      const s = W / sw, T = b => [(b[0] - sx) * s, (b[1] - sy) * s, (b[2] - b[0]) * s, (b[3] - b[1]) * s];
      const col = key === 'rawild' ? '#E4552F' : '#FFFFFF', found = matchGT(D.gt, m.boxes);
      D.gt.forEach((g, j) => { if (!found.has(j)) strokeBox(ctx, T(g.box), '#E3A82B', [2, 3], 1.8); });
      m.boxes.forEach(p => strokeBox(ctx, T(p.box), col, p.hit ? null : [7, 4], 2));
      $('.m-name', fig).textContent = m.name;
      $('.m-score', fig).innerHTML = `${m.tp}<small>/${n}</small>`;
      $('.m-false', fig).textContent = m.fp ? `${m.fp} false` : '';
      cv.setAttribute('aria-label', `${m.name}: ${m.tp} of ${n} objects found, ${m.fp} false alarms`);
    });
    note.textContent = `${D.dataset} · ${D.sensor} · ${D.condition.toLowerCase()}. Each method's own detections at score ≥ 0.5, drawn on the dataset's standard rendering; found means IoU ≥ 0.5 with the ground truth.`;
  }
  async function show(id) {
    const my = ++token; const r = await load(id); if (my !== token) return;
    current = r; paint();
  }
  tabs.forEach(t => t.addEventListener('click', () => { tabs.forEach(o => o.setAttribute('aria-selected', String(o === t))); show(t.dataset.scene); }));
  const near = new IntersectionObserver(es => { if (es[0].isIntersecting) { near.disconnect(); show(tabs[0].dataset.scene); } }, { rootMargin: '800px 0px' });
  near.observe(box);
  addEventListener('resize', () => { if (current) paint(); });
})();

// ================================================================ 03 — numbers: bars on the beat, counting up
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
