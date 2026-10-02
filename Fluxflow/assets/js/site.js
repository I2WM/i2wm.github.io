/* ===========================================================================
   FluxFlow project page —behaviour.

   Three kinds of work happen here:
     1. The hero runs the film's own title card live on canvas (star planes, a
        ringed body, a satellite captured into orbit, the wordmark resolving out
        of focus). Same code path as the film, so the page and the film agree.
     2. Each section carries one canvas that states that section's argument:
        the three point-source states, a hallucination switching off, straight
        flow paths, an inverse-variance weight map, a Wiener correction.
     3. Interaction: scroll reveals, counting numbers, bars that draw, a video
        player, and the one thing worth doing by hand —hovering a field to
        resolve it.
   =========================================================================== */
(() => {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const dpr = Math.min(2, devicePixelRatio || 1);

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function sizeCanvas(cv) {
  const r = cv.getBoundingClientRect();
  const d = dpr;
  const w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const ctx = cv.getContext('2d');
  ctx.setTransform(d, 0, 0, d, 0, 0);
  // A canvas can report a zero rect before layout settles. Returning NaN-safe
  // numbers here keeps every draw loop from throwing on createRadialGradient.
  const rw = isFinite(r.width) ? r.width : 0;
  const rh = isFinite(r.height) ? r.height : 0;
  if (!isFinite(r.width) || !isFinite(r.height)) {
    window.__badRect = (window.__badRect || []).concat([cv.className + ' w=' + r.width + ' h=' + r.height]);
  }
  return [rw, rh, ctx];
}
function visibleLoop(el, draw) {
  let raf = 0, on = false;
  // The rAF timestamp MUST be forwarded. Calling draw() with no argument made
  // every time-based canvas compute NaN and throw on its first gradient.
  const tick = ts => {
    raf = 0;
    if (!on || document.hidden) return;
    draw(ts === undefined ? performance.now() : ts);
    raf = requestAnimationFrame(tick);
  };
  new IntersectionObserver(es => {
    on = es[0].isIntersecting;
    if (on && !raf && !REDUCED) raf = requestAnimationFrame(tick);
  }, { rootMargin: '120px 0px' }).observe(el);
  document.addEventListener('visibilitychange', () => {
    if (on && !raf && !REDUCED && !document.hidden) raf = requestAnimationFrame(tick);
  });
  return () => { if (REDUCED) draw(performance.now()); };
}

const TOK = { star:'#F4F1E9', moon:'#C9BBDD', faint:'#B695FF', dim:'#A28BAE',
              viol:'#FF2D78', ground:'#D4FF3D', ok:'#D4FF3D', space:'#B695FF', rule:'rgba(242,239,230,.12)' };

// ---------------------------------------------------------------------------
// 1. HERO —the film's title card, live
// ---------------------------------------------------------------------------
/* the opening is one timeline: heroIntro starts the clock when the hero goes live, the
   canvas reads it, and __heroSeek lets a test hold any frame still. Without a shared
   reference the two would drift apart by however long the first paint took. */
let heroT0 = 0;
function heroNow() { return heroT0 ? (performance.now() - heroT0) / 1000 : 0; }
window.__heroSeek = function (s) { heroT0 = performance.now() - s * 1000; };
window.__heroT = heroNow;                 /* the canvas clock, readable by a test */

function heroCanvas() {
  const cv = $('.hero-canvas');
  if (!cv) return;
  const hero = $('.hero');

  // star planes, built once
  const planes = [];
  const specs = [
    { n: 900,  mag: 3.9, bright: 0.085, core: 0.24, spike: 0.995, alpha: 0.80 },
    { n: 520,  mag: 3.4, bright: 0.130, core: 0.34, spike: 0.955, alpha: 1.00 },
    { n: 190,  mag: 2.7, bright: 0.220, core: 0.52, spike: 0.905, alpha: 1.00 },
  ];
  function tempColor(u) {
    return [Math.round(lerp(196, 255, Math.pow(u, 0.75))),
            Math.round(lerp(214, 236, Math.pow(u, 0.9))),
            Math.round(lerp(255, 196, Math.pow(u, 1.6)))];
  }
  let built = null;
  function build(W, H) {
    const PAD = 14, PW = W + PAD * 2, PH = H + PAD * 2;
    planes.length = 0;
    for (let pi = 0; pi < specs.length; pi++) {
      const sp = specs[pi];
      const c = document.createElement('canvas');
      c.width = PW; c.height = PH;
      const cx = c.getContext('2d');
      const rnd = mulberry32(0xB16B00B5 + pi * 7919);
      if (pi === 0) {
        cx.save(); cx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 46; i++) {
          const u = rnd();
          const bx = lerp(-160, PW + 160, u), by = lerp(PH * 0.06, PH * 1.02, u) + (rnd() - 0.5) * 120;
          const rr = lerp(150, 430, rnd());
          const g = cx.createRadialGradient(bx, by, 0, bx, by, rr);
          g.addColorStop(0, `rgba(112,124,148,${0.008 + rnd() * 0.012})`);
          g.addColorStop(1, 'rgba(74,84,108,0)');
          cx.fillStyle = g; cx.beginPath(); cx.arc(bx, by, rr, 0, 6.284); cx.fill();
        }
        cx.restore();
      }
      for (let i = 0; i < sp.n; i++) {
        const x = rnd() * PW, y = rnd() * PH;
        const m = Math.pow(rnd(), sp.mag);
        const bright = sp.bright + m * 0.80, core = sp.core + m * 1.05;
        const [r, g, b] = tempColor(rnd());
        cx.save(); cx.globalCompositeOperation = 'lighter';
        const grad = cx.createRadialGradient(x, y, 0, x, y, core * 2.8);
        grad.addColorStop(0, `rgba(255,255,255,${Math.min(1, bright * 1.2)})`);
        grad.addColorStop(0.28, `rgba(${r},${g},${b},${bright * 0.45})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        cx.fillStyle = grad; cx.beginPath(); cx.arc(x, y, core * 2.8, 0, 6.284); cx.fill();
        if (m > sp.spike) {
          const L = lerp(8, 30, (m - sp.spike) / (1 - sp.spike)) * (0.7 + rnd() * 0.6);
          cx.globalAlpha = 0.42; cx.strokeStyle = `rgba(${r},${g},${b},0.7)`; cx.lineWidth = 0.6;
          cx.beginPath(); cx.moveTo(x - L, y); cx.lineTo(x + L, y); cx.moveTo(x, y - L); cx.lineTo(x, y + L); cx.stroke();
        }
        cx.restore();
      }
      planes.push({ cv: c, alpha: sp.alpha });
    }
    built = { W, H };
  }

  // the body the satellite is captured by
  /* size and R have to agree: the disc renders at 0.46 x size, and the innermost ring band
   sits at 1.00R, so R must land just outside the limb or the rings disappear inside the body */
const BODY = { x: 0.71, y: 0.42, size: 0.34, R: 0.245, k: 0.30, tilt: -0.30, img: null };
  const img = new Image();
  img.onload = () => {
    const S = 460;
    const c = document.createElement('canvas'); c.width = S; c.height = S;
    const cx = c.getContext('2d');
    cx.drawImage(img, 0, 0, S, S);
    const sd = cx.getImageData(0, 0, S, S), p = sd.data;
    for (let i = 0; i < p.length; i += 4) {
      for (let ch = 0; ch < 3; ch++) {
        let v = p[i + ch] / 255;
        v = Math.pow(clamp((v - 0.055) / 0.885), 1.5) * 0.94;
        p[i + ch] = clamp(Math.round(v * 255), 0, 255);
      }
    }
    cx.putImageData(sd, 0, 0);
    const R = S * 0.46;
    cx.globalCompositeOperation = 'destination-in';
    const g = cx.createRadialGradient(S / 2, S / 2, R * 0.90, S / 2, S / 2, R);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = g; cx.fillRect(0, 0, S, S);
    cx.globalCompositeOperation = 'source-over';
    cx.beginPath(); cx.arc(S / 2, S / 2, R - 0.5, 0, 6.284);
    cx.lineWidth = 1; cx.strokeStyle = 'rgba(242,239,230,.20)'; cx.stroke();
    BODY.img = c;
  };
  img.src = (window.__INLINE_IMG && window.__INLINE_IMG.starCluster) || 'assets/img/star-cluster.jpg';

  /* `scale` is the short side of the canvas (see the collision block): BODY.R is a fraction
     of it, so R lands on the body's rendered radius. */
  function ringPt(th, W, H, scale) {
    const R = BODY.R * scale;
    const ex = Math.cos(th) * R, ey = Math.sin(th) * R * BODY.k;
    const c = Math.cos(BODY.tilt), s = Math.sin(BODY.tilt);
    return { x: BODY.x * W + ex * c - ey * s, y: BODY.y * H + ex * s + ey * c, behind: Math.sin(th) < 0 };
  }
  function drawRing(ctx, W, H, scale, front, alpha) {
    const R = BODY.R * scale;
    const bands = [[1.24, 4.4, 0.05], [1.10, 2.8, 0.15], [1.00, 1.6, 0.28], [0.90, 1.0, 0.15]];
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'butt';
    for (const [rs, lw, al] of bands) {
      ctx.beginPath();
      const rx = R * rs, ry = R * rs * BODY.k;
      if (front) ctx.ellipse(BODY.x * W, BODY.y * H, rx, ry, BODY.tilt, 0, Math.PI);
      else       ctx.ellipse(BODY.x * W, BODY.y * H, rx, ry, BODY.tilt, Math.PI, Math.PI * 2);
      ctx.strokeStyle = `rgba(196,214,238,${(al * alpha).toFixed(3)})`;
      ctx.lineWidth = lw; ctx.stroke();
    }
    ctx.restore();
  }

  const CYCLE = 26;                         // seconds: the approach, the hit, then a slow orbit
  function draw(now) {
    const [W, H, ctx] = sizeCanvas(cv);
    if (!built || built.W !== W || built.H !== H) build(W, H);
    const K = Math.min(W / 1280, H / 720);
    /* no modulo: the collision happens once. Reduced motion opens on the settled aftermath. */
    const T = REDUCED ? 40 : Math.min(heroNow() || (now - (heroT0 || now)) / 1000, CYCLE);

    /* one timeline for the whole card, declared here so nothing can drift apart */
    const IMPACT = 1.86, BODY_AT = 0.55, IMPACTOR_AT = 0.22;
    /* the frame takes the blow: a decaying jolt, and it wraps every layer below */
    const blow = T - IMPACT;
    const shake = blow >= 0 && blow < 0.85 ? Math.pow(1 - blow / 0.85, 2.1) : 0;
    ctx.save();
    if (shake > 0.001) ctx.translate(Math.sin(now / 13.3) * shake * 11, Math.cos(now / 9.1) * shake * 7.5);


    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    /* the camera opens up as soon as the wave has passed, so the ruins of the strike and the
       arriving content share the frame */
    const ramp = T < 1.9 ? 0 : clamp((T - 1.9) / 12);
    /* a slow push-in through the approach: two seconds of build, not two seconds of waiting */
    const push = Math.pow(clamp(T / 1.86), 1.6) * 0.055;
    const s = 1 + push + ramp * 0.32;
    const PAR = [0.34, 0.66, 1.0];
    for (let i = 0; i < planes.length; i++) {
      const pl = planes[i], f = PAR[i];
      const li = 1 + (s - 1) * f;
      ctx.save();
      ctx.globalAlpha = pl.alpha;
      ctx.translate(W / 2, H / 2); ctx.scale(li, li);
      ctx.drawImage(pl.cv, -pl.cv.width / 2, -pl.cv.height / 2);
      ctx.restore();
    }
    ctx.restore();

    /* ---------------- the collision ----------------------------------------------------
       Scale note: BODY.R is a fraction of the SHORT SIDE. Every ring-plane use used to
       multiply it by K = min(W/1280, H/720) — about 1.1 everywhere — so R came out at a
       quarter of a pixel and the rings, the orbit radius and every ring effect drew as a dot
       in the middle. Handing drawRing the short side is the whole fix. */
    const S = Math.min(W, H);
    const R = BODY.R * S;                       // ≈ the body's rendered radius
    const cx = BODY.x * W, cy = BODY.y * H;
    const cosT = Math.cos(BODY.tilt), sinT = Math.sin(BODY.tilt);
    const entry = Math.atan2(-0.785, 0.62);     // the impactor's line of approach
    const light = -2.15;                        // key light: up and to the left

    /* the contact point: on the face, not on the rim — a flash on the limb reads as a glow
       at the edge of the disc instead of a strike */
    const HIT_AT = 0.62;
    const ipx = cx + Math.cos(entry) * R * HIT_AT, ipy = cy + Math.sin(entry) * R * HIT_AT;

    const plane = (th, r, off) => {
      const ex = Math.cos(th) * r, ey = Math.sin(th) * r * BODY.k + (off || 0) * r * 0.26;
      return { x: cx + ex * cosT - ey * sinT, y: cy + ex * sinT + ey * cosT };
    };

    if (!draw.debris) {
      const rnd = mulberry32(0x512E7A), CLUMP = 6;
      const d = [];
      for (let i = 0; i < 210; i++) {
        const loose = i >= 176;                                    // a thin isotropic halo
        d.push({
          th: loose ? rnd() * 6.284 : (i % CLUMP) / CLUMP * 6.284 + (rnd() - 0.5) * 0.85,
          off: (rnd() - 0.5) * (loose ? 0.95 : 0.32),
          A: 0.24 + Math.pow(rnd(), 1.7) * 0.95,                   // how hard it was thrown
          s: 0.45 + Math.pow(rnd(), 2.2) * 2.5,                    // many fines, few chunks
          a: 0.20 + rnd() * 0.60,
          warm: rnd() < 0.22,
          sh: 0.55 + rnd() * 0.5,                                  // differential shear
          loose
        });
      }
      draw.debris = d;
    }
    const DEBRIS = draw.debris;

    const appear = clamp((T - BODY_AT) / 1.35);
    const tau = T - IMPACT;
    const flash = tau >= 0 ? Math.exp(-tau / 0.30) : 0;
    /* thrown out fast, then falling back: one analytic curve, so a held frame is exact and
       the debris ends up inside the drawn ring bands instead of beside them */
    const curtain = tau >= 0 ? (1 - Math.exp(-tau / 0.30)) * Math.exp(-tau / 2.6) : 0;

    // the target body drifts in, resolving; its rings arrive with the debris
    if (appear > 0.002 && BODY.img) {
      const ringA = clamp((T - IMPACT) / 2.2);
      const ringLit = 1 + flash * 2.6;
      if (ringA > 0.002) drawRing(ctx, W, H, S, false, appear * ringA * (0.34 + 0.66 * ringA) * ringLit);

      const near = 1 + Math.pow(clamp(T / 1.86), 1.6) * 0.05;
      const size = lerp(60, BODY.size * Math.min(W, H * 1.6), appear) * near;
      const br = size * 0.46;                     // the disc the texture resolves to
      const lx = Math.cos(light), ly = Math.sin(light);

      /* 1 — the surface: the real cutout, desaturated and knocked back to a mottle. Drawn
         inside the disc so it reads as material, not as a photograph of a star field. */
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, br, 0, 6.284); ctx.clip();
      ctx.globalAlpha = appear * 0.55;
      ctx.filter = 'saturate(.3) brightness(.62) contrast(.9) blur(' + lerp(4, 0.8, appear).toFixed(2) + 'px)';
      ctx.drawImage(BODY.img, cx - size / 2, cy - size / 2, size, size);
      ctx.filter = 'none';
      /* 2 — sphere shading: the night side falls away from the key light */
      ctx.globalAlpha = appear;
      const sh = ctx.createRadialGradient(cx + lx * br * 0.62, cy + ly * br * 0.62, br * 0.04, cx, cy, br * 1.04);
      sh.addColorStop(0, 'rgba(255,252,246,0.14)');
      sh.addColorStop(0.38, 'rgba(0,0,0,0.26)');
      sh.addColorStop(0.78, 'rgba(0,0,0,0.70)');
      sh.addColorStop(1, 'rgba(0,0,0,0.90)');
      ctx.fillStyle = sh; ctx.fillRect(cx - br, cy - br, br * 2, br * 2);
      ctx.restore();

      /* 3 — the edge: a hairline lit crescent, and a cool rim where the far side turns away */
      ctx.save();
      ctx.globalAlpha = appear;
      ctx.filter = 'blur(' + Math.max(0.4, br * 0.014).toFixed(2) + 'px)';
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(246,243,235,0.50)';
      ctx.lineWidth = Math.max(1, br * 0.013);
      ctx.beginPath(); ctx.arc(cx, cy, br - ctx.lineWidth / 2, light - 1.12, light + 1.12); ctx.stroke();
      ctx.strokeStyle = 'rgba(150,190,224,0.14)';
      ctx.lineWidth = Math.max(0.8, br * 0.007);
      ctx.beginPath(); ctx.arc(cx, cy, br - ctx.lineWidth / 2, light + 1.7, light + 4.6); ctx.stroke();
      ctx.restore();

      /* 4 — the flash lights the night side for a moment, then the scar cools on the limb */
      if (flash > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const rg = ctx.createRadialGradient(ipx, ipy, br * 0.16, ipx, ipy, br * 2.1);
        rg.addColorStop(0, 'rgba(255,238,210,' + (0.32 * flash).toFixed(3) + ')');
        rg.addColorStop(0.42, 'rgba(224,192,146,' + (0.10 * flash).toFixed(3) + ')');
        rg.addColorStop(1, 'rgba(217,160,91,0)');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(ipx, ipy, br * 2.1, 0, 6.284); ctx.fill();
        ctx.restore();
      }
      if (ringA > 0.002) drawRing(ctx, W, H, S, true, appear * ringA * (0.34 + 0.66 * ringA) * ringLit);
    }

    // the impactor: lit crescent, tidal stretch, dust trail that thickens as it closes
    if (T >= IMPACTOR_AT && tau < 0.015 && appear > 0.15) {
      const u = clamp((T - IMPACTOR_AT) / (IMPACT - IMPACTOR_AT));
      /* build, hold, snap: the hang before contact is the tension */
      const e = u < 0.78 ? Math.pow(u / 0.78, 2.0) * 0.80 : 0.80 + Math.pow((u - 0.78) / 0.22, 0.5) * 0.20;
      const dist = lerp(R * 8.2, R * HIT_AT, e);
      const px = cx + Math.cos(entry) * dist, py = cy + Math.sin(entry) * dist;
      const rr = R * lerp(0.075, 0.145, u);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const tailLen = R * (2.2 + 4.4 * u);
      const tx = px + Math.cos(entry) * tailLen, ty = py + Math.sin(entry) * tailLen;
      const tail = ctx.createLinearGradient(tx, ty, px, py);
      tail.addColorStop(0, 'rgba(150,172,204,0)');
      tail.addColorStop(0.55, 'rgba(186,206,232,' + (0.10 + 0.16 * u).toFixed(3) + ')');
      tail.addColorStop(1, 'rgba(222,234,250,' + (0.30 + 0.34 * u).toFixed(3) + ')');
      ctx.strokeStyle = tail; ctx.lineWidth = R * (0.012 + 0.030 * u); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(px, py); ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(px, py); ctx.rotate(entry); ctx.scale(1 + Math.pow(u, 3.2) * 1.7, 1);
      ctx.fillStyle = 'rgba(9,11,15,0.94)';
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, 6.284); ctx.fill();
      ctx.filter = 'blur(' + (rr * 0.20).toFixed(2) + 'px)';
      ctx.strokeStyle = 'rgba(246,242,232,' + (0.45 + 0.40 * u).toFixed(3) + ')';
      ctx.lineWidth = rr * 0.26;
      ctx.beginPath(); ctx.arc(0, 0, rr * 0.95, light - 1.25, light + 1.25); ctx.stroke();
      ctx.restore();
    }

    if (tau >= 0) {
      // ejecta: thrown out, falling back, shearing into a ring
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < DEBRIS.length; i++) {
        const p = DEBRIS[i];
        const rr = R * (1 + p.A * curtain * 1.9);
        const th = p.th + p.sh * tau * 0.22;
        const pt = plane(th, rr, p.off * Math.min(1, tau * 1.4));
        ctx.globalAlpha = p.a * Math.max(p.loose ? 0.05 : 0.11, Math.exp(-tau / 2.3));
        ctx.fillStyle = p.warm ? 'rgba(236,206,166,0.95)' : 'rgba(212,226,244,0.92)';
        const sz = p.s * (1 + 1.7 / (1 + tau * 2.2));
        ctx.beginPath(); ctx.arc(pt.x, pt.y, sz, 0, 6.284); ctx.fill();
      }
      ctx.restore();

      /* long tangential arcs thrown across the frame: the debris that makes the scale read.
         They leave in the ring plane, so they read as material leaving a disc, not as sparks. */
      const arc = tau / 3.2;
      if (arc < 1) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.5 * Math.pow(1 - arc, 1.6);
        ctx.lineCap = 'round';
        for (let i = 0; i < 14; i++) {
          const th = entry + 1.9 + (i / 14) * 4.6;
          const v = 1.5 + (i % 5) * 0.55;
          const r0 = R * (1.05 + v * 0.55 * Math.min(1, tau * 3));
          const r1 = r0 + R * v * Math.min(1.6, tau) * 1.5;
          const a0 = plane(th, r0, (i % 3 - 1) * 0.10);
          const a1 = plane(th, r1, (i % 3 - 1) * 0.10);
          const g = ctx.createLinearGradient(a0.x, a0.y, a1.x, a1.y);
          g.addColorStop(0, 'rgba(232,240,252,0.55)');
          g.addColorStop(0.35, 'rgba(206,222,244,0.22)');
          g.addColorStop(1, 'rgba(180,200,228,0)');
          ctx.strokeStyle = g; ctx.lineWidth = R * (0.008 + (i % 4) * 0.004);
          ctx.beginPath(); ctx.moveTo(a0.x, a0.y); ctx.lineTo(a1.x, a1.y); ctx.stroke();
        }
        ctx.restore();
      }

      // a few chunks on the entry line; the last one leaves and does not come back
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const v = 0.85 + i * 0.6;
        const d = R * (1 + v * tau * (i === 2 ? 1.6 : 0.9));
        const off = (i - 1) * 0.17;
        const fx = ipx + Math.cos(entry + off) * d, fy = ipy + Math.sin(entry + off) * d;
        ctx.globalAlpha = Math.max(0, 0.62 - tau * 0.10);
        ctx.fillStyle = 'rgba(240,232,216,0.9)';
        ctx.beginPath(); ctx.arc(fx, fy, (1.9 - i * 0.4) * (S / 950), 0, 6.284); ctx.fill();
      }
      ctx.restore();

      // ejecta rays: a short cone out of the contact point, away from the body
      const ray = tau / 0.7;
      if (ray < 1) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.22 * Math.pow(1 - ray, 1.9);
        ctx.lineCap = 'round';
        for (let i = 0; i < 5; i++) {
          const a = entry + (i - 2) * 0.15;
          const len = R * (0.85 + (i % 2) * 0.45) * (0.35 + ray * 1.45);
          const g = ctx.createLinearGradient(ipx, ipy, ipx + Math.cos(a) * len, ipy + Math.sin(a) * len);
          g.addColorStop(0, 'rgba(255,241,220,0.6)');
          g.addColorStop(1, 'rgba(255,241,220,0)');
          ctx.strokeStyle = g; ctx.lineWidth = R * 0.014;
          ctx.beginPath(); ctx.moveTo(ipx, ipy);
          ctx.lineTo(ipx + Math.cos(a) * len, ipy + Math.sin(a) * len); ctx.stroke();
        }
        ctx.restore();
      }

      // the scar: warm, then cooling back to the body's own tone
      const cool = clamp(tau / 3.4);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const sr = R * lerp(0.60, 0.28, cool);
      const sg = ctx.createRadialGradient(ipx, ipy, 0, ipx, ipy, sr);
      sg.addColorStop(0, 'rgba(255,216,154,' + (0.50 * (1 - cool)).toFixed(3) + ')');
      sg.addColorStop(0.5, 'rgba(217,160,91,' + (0.30 * (1 - cool)).toFixed(3) + ')');
      sg.addColorStop(1, 'rgba(217,160,91,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(ipx, ipy, sr, 0, 6.284); ctx.fill();
      ctx.restore();

      /* the shock: three fronts racing out past the camera. This is the loudest thing in the
         sequence, and it is why the wave has to leave the frame. */
      const sh = tau / 1.45;
      if (sh < 1) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(242,239,230,0.9)';
        for (let i = 0; i < 3; i++) {
          const k = clamp(sh - i * 0.085);
          if (k <= 0) continue;
          const rr = R * lerp(1.0, 6.2, Math.pow(k, 0.60));
          ctx.globalAlpha = (i === 0 ? 0.44 : i === 1 ? 0.20 : 0.09) * Math.pow(1 - k, 1.4);
          ctx.lineWidth = lerp(i === 0 ? 2.8 : 5.0, 0.5, k) * (S / 950);
          ctx.beginPath(); ctx.ellipse(cx, cy, rr, rr * BODY.k, BODY.tilt, 0, 6.284); ctx.stroke();
        }
        ctx.restore();
      }

      // the flash itself
      const fl = clamp(tau / 0.62);
      if (fl < 1) {
        const k = Math.pow(1 - fl, 2.1);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const fr = R * lerp(0.5, 2.6, Math.pow(fl, 0.5));
        const fg = ctx.createRadialGradient(ipx, ipy, 0, ipx, ipy, fr);
        fg.addColorStop(0, 'rgba(255,255,255,' + (0.95 * k).toFixed(3) + ')');
        fg.addColorStop(0.20, 'rgba(255,244,222,' + (0.62 * k).toFixed(3) + ')');
        fg.addColorStop(0.52, 'rgba(233,182,120,' + (0.26 * k).toFixed(3) + ')');
        fg.addColorStop(1, 'rgba(217,160,91,0)');
        ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(ipx, ipy, fr, 0, 6.284); ctx.fill();
        /* one breath of white over the whole frame: the blow is taken by the picture, not by
           a bright dot inside it */
        ctx.globalAlpha = 0.34 * Math.pow(1 - fl, 3.2);
        ctx.fillStyle = 'rgba(255,250,242,1)';
        ctx.fillRect(0, 0, W, H);
        const L = R * lerp(0.5, 1.5, fl);
        ctx.globalAlpha = 0.42 * k; ctx.strokeStyle = 'rgba(255,246,228,0.9)';
        ctx.lineWidth = 1.1 * (S / 950);
        ctx.beginPath();
        ctx.moveTo(ipx - L, ipy); ctx.lineTo(ipx + L, ipy);
        ctx.moveTo(ipx, ipy - L); ctx.lineTo(ipx, ipy + L);
        ctx.stroke();
        ctx.restore();
      }

      /* the light the event throws on the star field: wide, weak, and the only thing that
         sells the flash as a light source rather than a sticker */
      if (flash > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const br = R * 7.5;
        const bg = ctx.createRadialGradient(ipx, ipy, 0, ipx, ipy, br);
        bg.addColorStop(0, 'rgba(226,208,186,' + (0.10 * flash).toFixed(3) + ')');
        bg.addColorStop(0.35, 'rgba(190,190,205,' + (0.045 * flash).toFixed(3) + ')');
        bg.addColorStop(1, 'rgba(150,170,200,0)');
        ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(ipx, ipy, br, 0, 6.284); ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  visibleLoop(cv, draw)();
  draw(performance.now());
}

// ---------------------------------------------------------------------------
// 2. SECTION CANVASES
// ---------------------------------------------------------------------------
function besselJ1(x) {
  const ax = Math.abs(x);
  if (ax < 3) {
    const y = (x / 3) * (x / 3);
    const p = 0.5 + y * (-0.56249985 + y * (0.21093573 + y * (-0.03954289 +
              y * (0.00443319 + y * (-0.00031761 + y * 0.00001109)))));
    return x * p;
  }
  const z = 3 / ax;
  const f1 = 0.79788456 + z * (0.00000156 + z * (0.01659667 + z * (0.00017105 +
             z * (-0.00249511 + z * (0.00113653 + z * -0.00020033)))));
  const th = ax - 2.35619449 + z * (0.12499612 + z * (0.00005650 + z * (-0.00637879 +
             z * (0.00074348 + z * (0.00079824 + z * -0.00029166)))));
  return Math.sign(x) * f1 / Math.sqrt(ax) * Math.cos(th);
}
const airy = r => r < 1e-4 ? 1 : (t => t * t)(2 * besselJ1(3.8317 * r) / (3.8317 * r));

// 2a. three point-source states, with 1D cross-sections (paper Figure 2)
// 2a. three point-source states as surfaces, with their cross-sections (paper Figure 2)
function psfCanvas() {
  const cv = $('.psf-canvas');
  if (!cv) return;
  const states = ['ideal', 'diffraction', 'seeing'];
  const label = ['Ideal', 'Diffraction-limited', 'Seeing-limited'];
  const value = ['\u2014', '~0.09\u2033', '1.0\u20131.3\u2033'];
  const tint = [TOK.moon, TOK.space, TOK.ground];
  const FWHM_HST = 0.09, FWHM_SEE = 1.15, FOV = 2.0;
  /* the same profiles the paper plots: a delta, an Airy pattern, and a seeing disc */
  const profile = (kind, a) => {
    if (kind === 'ideal') return Math.exp(-Math.pow(a / 0.035, 2));
    if (kind === 'diffraction') return clamp(airy(Math.abs(a) / (FWHM_HST / 0.42)), 0, 1);
    const sig = FWHM_SEE / 2.355;
    return Math.exp(-(a * a) / (2 * sig * sig));
  };
  const st = orbitable(cv, { yaw: -0.52, pitch: 0.52 });
  let t0 = 0;
  function draw(now) {
    const [W, H, ctx] = sizeCanvas(cv);
    if (!t0) t0 = now;
    const dt = Math.min(0.05, (now - (draw.last || now)) / 1000); draw.last = now;
    st.tick(dt);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#211327'; ctx.fillRect(0, 0, W, H);
    const P = st.project(W, H, null, 0.86);
    const SX = 0.40, SZ = 0.40, HGT = 0.62, GAP = 0.60;
    const rise = clamp((now - t0) / 1100);

    /* the floor they stand on */
    ctx.save();
    ctx.strokeStyle = 'rgba(242,239,230,.09)'; ctx.lineWidth = 1;
    const rows = [[-1.32, 1.32]];
    for (const [a, b] of rows) {
      for (let k = 0; k < 3; k++) {
        const z = -SZ + k * SZ;
        const q0 = P(a, 0, z), q1 = P(b, 0, z);
        ctx.beginPath(); ctx.moveTo(q0.x, q0.y); ctx.lineTo(q1.x, q1.y); ctx.stroke();
      }
    }
    ctx.restore();

    let hot = null, hotD = 1e9;
    const col = [0, 0, 0];
    states.forEach((kind, i) => {
      const x0 = (i - 1) * GAP;
      /* the section curve, drawn on the floor in front of its surface: the same chart the 2D
         version printed, now attached to the thing it describes */
      ctx.save();
      ctx.globalAlpha = 0.85 * rise;
      ctx.strokeStyle = tint[i]; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let k = 0; k <= 60; k++) {
        const u = k / 60 - 0.5;
        const q = P(x0 + u * SX * 2, 0.012 + profile(kind, u * FOV) * 0.30, SZ + 0.16);
        if (k === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
      }
      ctx.stroke();
      ctx.restore();
      /* the surface */
      wireMesh(ctx, P, 17, x0, 0, SX * 2, SZ * 2,
        (u, v) => profile(kind, Math.hypot(u * FOV, v * FOV)) * HGT * rise, tint[i], 0.42);
      /* the core, so a needle is not just a mesh vertex */
      const c = P(x0, profile(kind, 0) * HGT * rise, 0);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, kind === 'seeing' ? 26 : 12);
      g.addColorStop(0, 'rgba(255,255,255,' + (0.75 * rise).toFixed(3) + ')');
      g.addColorStop(0.4, tint[i] + '');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = 0.5 * rise;
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(c.x, c.y, kind === 'seeing' ? 26 : 12, 0, 6.284); ctx.fill();
      ctx.restore();
      /* picking: the nearest mesh vertex of any surface */
      if (st.inside) {
        for (let a = 0; a <= 8; a++) for (let b = 0; b <= 8; b++) {
          const u = a / 8 - 0.5, v = b / 8 - 0.5;
          const q = P(x0 + u * SX * 2, profile(kind, Math.hypot(u * FOV, v * FOV)) * HGT * rise, v * SZ * 2);
          const d = Math.hypot(q.x - st.cx, q.y - st.cy);
          if (d < hotD) { hotD = d; hot = { i: i, kind: kind, r: Math.hypot(u, v) * FOV, I: profile(kind, Math.hypot(u * FOV, v * FOV)) }; }
        }
      }
      /* screen column of this surface, so the legend can be ordered the way the eye sees it */
      col[i] = P(x0, 0, 0).x;
    });

    /* The three captions used to be projected under their own surfaces. That only worked at the
       rest camera: the surfaces are stacked in depth, and the idle spin swings them into the same
       screen column, where the labels printed on top of each other and of the next mound (caught
       in out/instruments/psf-3d.png). A fixed legend row cannot collide — and its order follows the
       current screen order, so it stays true after the user orbits past 90 degrees too. */
    const order = [0, 1, 2].sort((a, c) => col[a] - col[c]);
    const legY = H - 60, pad = 14, colW = (W - pad * 2) / 3;
    const scrim2 = ctx.createLinearGradient(0, legY - 34, 0, H - 40);
    scrim2.addColorStop(0, 'rgba(33,19,39,0)');
    scrim2.addColorStop(1, 'rgba(33,19,39,.88)');
    ctx.save();
    ctx.globalAlpha = rise;
    ctx.fillStyle = scrim2; ctx.fillRect(0, legY - 34, W, H - 40 - (legY - 34));
    ctx.textAlign = 'center';
    order.forEach((i, rank) => {
      const cxL = pad + colW * (rank + 0.5);
      const live = hot && hotD < 14 && hot.kind === states[i];
      ctx.fillStyle = tint[i];
      ctx.fillRect(cxL - 6, legY - 15, 12, 2);
      ctx.font = '500 10.5px "Source Sans 3", sans-serif';
      ctx.fillStyle = live ? TOK.star : tint[i];
      ctx.fillText(label[i].toUpperCase(), cxL, legY);
      ctx.font = '500 9.5px "Source Sans 3", sans-serif';
      ctx.fillStyle = TOK.faint;
      ctx.fillText(value[i], cxL, legY + 14);
    });
    ctx.restore();

    cv.__hot = null;
    if (hot && hotD < 14) {
      cv.__hot = { state: hot.kind, r: +hot.r.toFixed(3), I: +hot.I.toFixed(4) };
      pointerReadout(ctx, W, H, st, st.cx, st.cy,
        hot.kind + ' \u00b7 r = ' + hot.r.toFixed(2) + '\u2033',
        'I = ' + hot.I.toFixed(3) + (hot.I > 0.02 ? ' \u00b7 this radius carries light' : ' \u00b7 empty sky'),
        hot.kind === 'seeing' ? TOK.ground : hot.kind === 'diffraction' ? TOK.space : TOK.moon, true);
    }
    screenLabel(ctx, W, H, st, 'POINT-SOURCE RESPONSE \u00b7 HEIGHT = INTENSITY', 'AIRY RINGS \u00b7 SEEING HALO', st.inside ? 'CLICK AND DRAG TO ORBIT' : 'DRAG TO ORBIT');
  }
  visibleLoop(cv, draw)();
  draw(performance.now());
}

// 2b. hallucination: invented sources go out when the correction is applied
function halCanvas() {
  const cv = $('.hal-canvas');
  if (!cv) return;
  let start = 0, hold = 0;
  const stars = [];
  const fake = [];
  (function seed() {
    const r = mulberry32(0xF10A2);
    for (let i = 0; i < 190; i++) {
      stars.push({ x: r(), y: r(), m: Math.pow(r(), 2.6), s: 0.3 + r() * 1.5 });
    }
    for (let i = 0; i < 7; i++) {
      fake.push({ x: 0.10 + r() * 0.80, y: 0.12 + r() * 0.76, s: 1.4 + r() * 1.5, ph: r() * 6.28 });
    }
  })();
  const target = $('.split-copy');
  let hover = 0;
  /* Table 3, the two settings the paper actually measured. */
  const ENDS = { lo: { p: 0.602, r: 0.553, f: 0.5256 }, hi: { p: 0.738, r: 0.458, f: 0.5412 } };
  /* the three bullets are the three behaviours; each one repaints the field */
  const bullets = Array.prototype.slice.call(document.querySelectorAll('#failure li'));
  const MODES = ['regression', 'generative', 'fluxflow'];
  let probe = null;
  bullets.forEach((li, i) => {
    li.classList.add('is-probe');
    li.tabIndex = 0;
    const on = () => { probe = MODES[i] || null; };
    const off = () => { probe = null; };
    const mark = () => {
      bullets.forEach((o, j) => o.classList.toggle('is-active', probe === MODES[j]));
    };
    li.addEventListener('pointerenter', () => { on(); mark(); });
    li.addEventListener('pointerleave', () => { off(); mark(); });
    li.addEventListener('focus', () => { on(); mark(); });
    li.addEventListener('blur', () => { off(); mark(); });
  });
  const range = $('#halRange');
  /* everything below is a tween target, not a value: the field eases between method
     states instead of snapping, so a hover reads as a transition rather than a cut. */
  const st = orbitable(cv, { yaw: -0.58, pitch: 0.50 });
  let soft = 0, invent = 1, softT = 0, inventT = 1;
  let lbl = '', lblMix = 1, lastNow = 0;
  const met = { p: 0.602, r: 0.553, f: 0.5256 };
  let metT = null;
  const stateEl = $('[data-hal-state]');
  const mEl = { p: $('[data-hm="p"]'), r: $('[data-hm="r"]'), f: $('[data-hm="f"]') };
  let manual = -1;                       // -1 = the field drives itself
  function setMetrics(v) {
    const mix = (a, b) => a + (b - a) * v;
    if (mEl.p) mEl.p.textContent = mix(ENDS.lo.p, ENDS.hi.p).toFixed(3);
    if (mEl.r) mEl.r.textContent = mix(ENDS.lo.r, ENDS.hi.r).toFixed(3);
    if (mEl.f) mEl.f.textContent = mix(ENDS.lo.f, ENDS.hi.f).toFixed(4);
    for (const k of ['p', 'r', 'f']) if (mEl[k]) mEl[k].style.color = v > 0.5 ? TOK.viol : TOK.ground;
    if (stateEl) { stateEl.textContent = v <= 0.02 ? 'w/o MC-FS' : v >= 0.98 ? 'FluxFlow' : 'blend'; stateEl.style.color = v > 0.5 ? TOK.viol : TOK.ground; }
  }
  if (range) {
    const onSlide = () => { manual = range.value / 100; setMetrics(manual); };
    range.addEventListener('input', onSlide);
    range.addEventListener('change', onSlide);
    setMetrics(0);
  }
  if (target) {
    target.addEventListener('pointerenter', () => { hold = 1; });
    target.addEventListener('pointerleave', () => { hold = 0; });
  }
  cv.addEventListener('pointerenter', () => { hold = 1; });
  cv.addEventListener('pointerleave', () => { hold = 0; });
  function draw(now) {
    const [W, H, ctx] = sizeCanvas(cv);
    if (!start) start = now;
    const T = (now - start) / 1000;
    const corr = manual >= 0 ? manual : (hold ? 1 : 0);
    let eff = corr, label = '';
    softT = 0; inventT = 1; metT = null;
    if (probe === 'regression') { eff = 1; softT = 1; inventT = 0; label = 'REGRESSION BASELINE \u00b7 OVER-SMOOTHED'; }
    else if (probe === 'generative') { eff = 0; softT = 0; inventT = 1; label = 'GENERATIVE BASELINE \u00b7 7 UNSUPPORTED SOURCES'; metT = ENDS.lo; }
    else if (probe === 'fluxflow') { eff = 1; softT = 0; inventT = 0; label = 'MC-FS ON \u00b7 INVENTED SOURCES SUPPRESSED'; metT = ENDS.hi; }
    const dt = Math.min(0.1, lastNow ? (now - lastNow) / 1000 : 1 / 60);
    lastNow = now;
    const k = 1 - Math.pow(0.0016, dt * 60);
    soft += (softT - soft) * k;
    invent += (inventT - invent) * k;
    if (label && label !== lbl) { lbl = label; lblMix = 0; }
    lblMix = Math.min(1, lblMix + dt / 0.28);
    /* the numbers still count rather than jump */
    if (metT) {
      met.p += (metT.p - met.p) * k; met.r += (metT.r - met.r) * k; met.f += (metT.f - met.f) * k;
    } else if (range) {
      const v = range.value / 100;
      met.p = ENDS.lo.p + (ENDS.hi.p - ENDS.lo.p) * v;
      met.r = ENDS.lo.r + (ENDS.hi.r - ENDS.lo.r) * v;
      met.f = ENDS.lo.f + (ENDS.hi.f - ENDS.lo.f) * v;
    }
    const metricCol = (metT ? (probe === 'fluxflow' ? TOK.viol : TOK.ground) : (range && range.value / 100 > 0.5 ? TOK.viol : TOK.ground));
    if (mEl.p) mEl.p.textContent = met.p.toFixed(3);
    if (mEl.r) mEl.r.textContent = met.r.toFixed(3);
    if (mEl.f) mEl.f.textContent = met.f.toFixed(4);
    for (const kk of ['p', 'r', 'f']) if (mEl[kk]) mEl[kk].style.color = metricCol;
    if (stateEl) {
      const v = manual >= 0 ? manual : (hold ? 1 : 0);
      stateEl.textContent = v <= 0.02 ? 'w/o MC-FS' : v >= 0.98 ? 'FluxFlow' : 'blend';
      stateEl.style.color = v > 0.5 ? TOK.viol : TOK.ground;
    }

    st.tick(dt);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#211327'; ctx.fillRect(0, 0, W, H);
    const P = st.project(W, H, null, 0.92);
    const SX = 1.05, SZ = 0.68, BASE = -0.10;
    /* the residual field: 1 - eff of every invented source, flattened by over-smoothing */
    const amp = (1 - eff) * invent * (1 - soft * 0.72);
    const width = 1 + soft * 1.4;
    const hOf = (u, v) => {
      let h = 0;
      for (const f of fake) {
        const du = (u + 0.5) * 2 * SX - ((f.x - 0.5) * 2 * SX);
        const dv = (v + 0.5) * 2 * SZ - ((f.y - 0.5) * 2 * SZ);
        const rr = Math.hypot(du, dv) / (0.10 * width * f.s);
        h += Math.exp(-rr * rr);
      }
      h = h * 0.34 * amp;
      /* the noise floor stays: a residual field is never flat */
      h += (0.010 + 0.022 * Math.sin(u * 21.7 + v * 13.3)) * (1 - soft * 0.5);
      return BASE + h;
    };
    /* floor + the stars that are actually supported, marked on it */
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (const s of stars) {
      const q = P((s.x - 0.5) * 2 * SX, BASE, (s.y - 0.5) * 2 * SZ);
      ctx.fillStyle = 'rgba(200,212,228,' + (0.10 + s.m * 0.35).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(q.x, q.y, 0.7 + s.m * 1.1, 0, 6.284); ctx.fill();
    }
    ctx.restore();
    wireMesh(ctx, P, 26, 0, 0, SX * 2, SZ * 2, hOf, TOK.moon, 0.30 / (1 + soft * 1.2));

    let hot = null, hotD = 1e9;
    for (let i = 0; i < fake.length; i++) {
      const f = fake[i];
      const fx = (f.x - 0.5) * 2 * SX, fz = (f.y - 0.5) * 2 * SZ;
      const top = P(fx, hOf(f.x, f.y), fz);
      const base = P(fx, BASE, fz);
      if (amp > 0.02) {
        /* the dashed ring marks an unsupported source, drawn on the floor where it stands */
        ctx.save();
        ctx.globalAlpha = clamp(amp * 0.8) * 0.9;
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = TOK.ground; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let a = 0; a <= 24; a++) {
          const th = a / 24 * 6.284, rr = 0.10 * width * f.s;
          const q = P(fx + Math.cos(th) * rr * 1.9, BASE, fz + Math.sin(th) * rr * 1.9);
          if (a === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        /* and a spike to its residual amplitude, so the seven read as standing up */
        ctx.save();
        ctx.globalAlpha = clamp(amp) * 0.9;
        ctx.strokeStyle = TOK.ground; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(top.x, top.y); ctx.stroke();
        ctx.restore();
      }
      const d = Math.hypot(top.x - st.cx, top.y - st.cy);
      if (st.inside && d < hotD) { hotD = d; hot = { i: i, amp: (1 - eff) * invent }; }
    }
    cv.__hot = null;
    if (hot && hotD < 26 && hot.amp > 0.02) {
      cv.__hot = { source: hot.i + 1, amp: +hot.amp.toFixed(3) };
      pointerReadout(ctx, W, H, st, st.cx, st.cy,
        'unsupported source ' + (hot.i + 1),
        'residual +' + (hot.amp * 0.34).toFixed(2) + ' \u00b7 not in the observation',
        TOK.ground, true);
    }
    ctx.save();
    ctx.font = '500 11px "Source Sans 3", sans-serif';
    ctx.textAlign = 'left';
    ctx.globalAlpha = 0.9 * (0.25 + 0.75 * lblMix);
    ctx.fillStyle = eff > 0.5 ? TOK.viol : TOK.ground;
    ctx.fillText(lbl || (eff > 0.5 ? 'MC-FS ON \u00b7 INVENTED SOURCES SUPPRESSED' : 'GENERATIVE BASELINE \u00b7 7 UNSUPPORTED SOURCES'), 12, 20);
    ctx.restore();
    screenLabel(ctx, W, H, st, 'RESIDUAL \u00b7 HEIGHT = WHAT THE MODEL ADDED', 'UNSUPPORTED SOURCES', st.inside ? 'CLICK AND DRAG TO ORBIT' : 'DRAG TO ORBIT');
  }
  visibleLoop(cv, draw)();
  draw(performance.now());
}

// 2c. the straight-path flow, in three dimensions
function flowCanvas() {
  const cv = $('.flow-canvas');
  if (!cv) return;
  const rnd = mulberry32(0xF10B3);
  const N = 46;
  /* noise on a shell, data in a tight core, and a straight line between each pair: the whole
     claim of optimal-transport flow matching is that those lines do not bend */
  const paths = [];
  for (let i = 0; i < N; i++) {
    const z = 1 - 2 * rnd();
    const r = Math.sqrt(Math.max(0, 1 - z * z));
    const th = rnd() * 6.284;
    const dx = (rnd() - 0.5) * 0.26, dy = (rnd() - 0.5) * 0.26, dz = (rnd() - 0.5) * 0.26;
    paths.push({
      nx: Math.cos(th) * r, ny: z, nz: Math.sin(th) * r,      // start: on the noise shell
      dx: dx, dy: dy, dz: dz,                                  // end: inside the data core
      w: 0.5 + rnd() * 0.9, ph: rnd() * 6.28
    });
  }
  const st = orbitable(cv, { yaw: -0.55, pitch: 0.34 });
  let t0 = 0;
  function draw(now) {
    const [W, H, ctx] = sizeCanvas(cv);
    if (!t0) t0 = now;
    const dt = Math.min(0.05, (now - (draw.last || now)) / 1000); draw.last = now;
    st.tick(dt);
    const T = ((now - t0) / 1000 % 7) / 7;
    const u = clamp((T - 0.12) / 0.78);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#211327'; ctx.fillRect(0, 0, W, H);
    const P = st.project(W, H, null, 1.0);
    const R = 1.0;

    /* the noise shell, as hairlines: three great circles is enough to read a sphere */
    ctx.save();
    ctx.strokeStyle = 'rgba(242,239,230,.09)'; ctx.lineWidth = 1;
    for (const plane of [0, 1, 2]) {
      ctx.beginPath();
      for (let i = 0; i <= 48; i++) {
        const a = i / 48 * 6.284, ca = Math.cos(a) * R, sa = Math.sin(a) * R;
        const q = plane === 0 ? P(ca, sa, 0) : plane === 1 ? P(ca, 0, sa) : P(0, ca, sa);
        if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
      }
      ctx.stroke();
    }
    ctx.restore();

    /* the data core at the origin: what every path is converging on */
    const c0 = P(0, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const core = ctx.createRadialGradient(c0.x, c0.y, 0, c0.x, c0.y, Math.min(W, H) * 0.13);
    core.addColorStop(0, 'rgba(255,255,255,' + (0.30 + 0.35 * u).toFixed(3) + ')');
    core.addColorStop(0.35, 'rgba(200,220,245,.12)');
    core.addColorStop(1, 'rgba(200,220,245,0)');
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(c0.x, c0.y, Math.min(W, H) * 0.13, 0, 6.284); ctx.fill();
    ctx.restore();

    /* paths, far to near, with the head of each one at its own parameter */
    const items = paths.map((p, i) => {
      const a = P(p.nx * R, p.ny * R, p.nz * R), b = P(p.dx, p.dy, p.dz);
      const t = clamp(u * 1.06 - p.ph * 0.006);
      return { p: p, i: i, a: a, b: b, t: t, d: (a.d + b.d) * 0.5 };
    }).sort((x, y) => y.d - x.d);

    let hot = null, hotD = 1e9;
    for (const it of items) {
      const p = it.p, a = it.a, b = it.b, t = it.t;
      const hx = a.x + (b.x - a.x) * t, hy = a.y + (b.y - a.y) * t;
      const pick = st.inside ? distToSeg(st.cx, st.cy, a.x, a.y, b.x, b.y) : 1e9;
      if (pick < 9 && pick < hotD) { hotD = pick; hot = it; }
      const isHot = hot === it;
      ctx.save();
      ctx.globalAlpha = (0.10 + 0.32 * (1 - u * 0.6)) * (isHot ? 3.0 : 1);
      ctx.strokeStyle = isHot ? 'rgba(235,165,139,.9)' : TOK.moon;
      ctx.lineWidth = p.w * (isHot ? 1.3 : 0.5);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.restore();
      /* the head: where this sample is right now */
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const r = isHot ? 6.5 : 4.6;
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, r);
      g.addColorStop(0, 'rgba(255,255,255,.95)');
      g.addColorStop(0.4, 'rgba(206,196,255,.35)');
      g.addColorStop(1, 'rgba(255,45,120,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, r, 0, 6.284); ctx.fill();
      ctx.restore();
      /* the start of the path stays marked, so the shell counts as samples rather than dust */
      ctx.save();
      ctx.globalAlpha = isHot ? 0.95 : 0.5;
      ctx.fillStyle = isHot ? 'rgba(226,232,238,.95)' : 'rgba(186,196,206,.75)';
      ctx.beginPath(); ctx.arc(a.x, a.y, isHot ? 2.1 : 1.3, 0, 6.284); ctx.fill();
      ctx.restore();
    }

    cv.__hot = null;
    if (hot) {
      const len = Math.hypot(hot.p.nx - hot.p.dx, hot.p.ny - hot.p.dy, hot.p.nz - hot.p.dz);
      cv.__hot = { path: hot.i, t: +hot.t.toFixed(3), len: +len.toFixed(3) };
      pointerReadout(ctx, W, H, st, st.cx, st.cy,
        'path ' + hot.i + ' \u00b7 t = ' + hot.t.toFixed(2),
        'straight, length ' + len.toFixed(2) + ' \u00b7 no bending',
        TOK.star, true);
    }
    screenLabel(ctx, W, H, st, 't = 0  OBSERVATION', 't = 1  ESTIMATE', st.inside ? 'CLICK AND DRAG TO ORBIT' : 'DRAG TO ORBIT');
  }
  visibleLoop(cv, draw)();
  draw(performance.now());
}

/* a wireframe height mesh: 34 polylines reads as an instrument, where filled quads at the same
   resolution cost a hundred times more fill and look like a lump */
function wireMesh(ctx, P, g, x0, z0, sx, sz, hOf, colour, alpha) {
  const at = (i, j) => {
    const u = i / (g - 1) - 0.5, v = j / (g - 1) - 0.5;
    return P(x0 + u * sx, hOf(u, v), z0 + v * sz);
  };
  ctx.save();
  ctx.strokeStyle = colour; ctx.globalAlpha = alpha; ctx.lineWidth = 1;
  for (let j = 0; j < g; j++) {
    ctx.beginPath();
    for (let i = 0; i < g; i++) { const q = at(i, j); if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y); }
    ctx.stroke();
  }
  for (let i = 0; i < g; i++) {
    ctx.beginPath();
    for (let j = 0; j < g; j++) { const q = at(i, j); if (j === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y); }
    ctx.stroke();
  }
  ctx.restore();
}

/* distance from a point to a segment, for picking a path rather than a cell */
function distToSeg(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay;
  const L = vx * vx + vy * vy;
  const t = L > 0 ? clamp(((px - ax) * vx + (py - ay) * vy) / L) : 0;
  return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
}

// 2d. inverse-variance weight map
/* ---------------------------------------------------------------------------
   2d. THE TWO INSTRUMENTS, AS OBJECTS YOU CAN TURN

   A projection small enough to read: rotate, project, sort by depth, fill. No library and no
   WebGL — every other visual on this page is hand-drawn canvas and the site ships offline, so
   this stays the same instrument one dimension up. A few hundred quads sort in well under a
   frame, and canvas 2D means there is no fallback to write.
   --------------------------------------------------------------------------- */
function orbitable(cv, opts) {
  const st = { yaw: opts.yaw, pitch: opts.pitch, zoom: 1, drag: 0, px: 0, py: 0, idle: 99, keys: {},
    /* pointer in canvas space, and the smoothed lean it drives */
    cx: -1e9, cy: -1e9, inside: 0, tx: 0, ty: 0, hx: 0, hy: 0 };
  cv.style.touchAction = 'none';
  cv.style.cursor = 'grab';
  cv.style.outlineOffset = '4px';
  if (!cv.hasAttribute('tabindex')) cv.tabIndex = 0;

  cv.addEventListener('pointerdown', e => {
    st.drag = 1; st.px = e.clientX; st.py = e.clientY; st.idle = 0;
    cv.style.cursor = 'grabbing';
    if (cv.setPointerCapture) try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  });
  cv.addEventListener('pointermove', e => {
    const r = cv.getBoundingClientRect();
    st.cx = e.clientX - r.left; st.cy = e.clientY - r.top; st.inside = 1;
    st.tx = clamp((e.clientX - r.left) / Math.max(1, r.width) - 0.5, -0.5, 0.5);
    st.ty = clamp((e.clientY - r.top) / Math.max(1, r.height) - 0.5, -0.5, 0.5);
    if (!st.drag) return;
    st.yaw += (e.clientX - st.px) * 0.0075;
    st.pitch = clamp(st.pitch + (e.clientY - st.py) * 0.0055, -0.20, 1.30);
    st.px = e.clientX; st.py = e.clientY; st.idle = 0;
  });
  cv.addEventListener('pointerleave', () => { st.inside = 0; st.tx = 0; st.ty = 0; st.cx = st.cy = -1e9; });
  const release = () => { st.drag = 0; cv.style.cursor = 'grab'; };
  cv.addEventListener('pointerup', release);
  cv.addEventListener('pointercancel', release);
  cv.addEventListener('wheel', e => {
    e.preventDefault();
    st.zoom = clamp(st.zoom * (e.deltaY > 0 ? 0.92 : 1.08), 0.55, 2.6);
    st.idle = 0;
  }, { passive: false });
  cv.addEventListener('dblclick', () => { st.yaw = opts.yaw; st.pitch = opts.pitch; st.zoom = 1; st.idle = 0; });
  cv.addEventListener('keydown', e => {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'ArrowRight') { st.yaw += (k === 'ArrowLeft' ? -1 : 1) * 0.11; st.idle = 0; e.preventDefault(); }
    else if (k === 'ArrowUp' || k === 'ArrowDown') { st.pitch = clamp(st.pitch + (k === 'ArrowUp' ? -1 : 1) * 0.07, -0.20, 1.30); st.idle = 0; e.preventDefault(); }
    else if (k === '+' || k === '=') { st.zoom = clamp(st.zoom * 1.1, 0.55, 2.6); st.idle = 0; e.preventDefault(); }
    else if (k === '-' || k === '_') { st.zoom = clamp(st.zoom * 0.9, 0.55, 2.6); st.idle = 0; e.preventDefault(); }
  });

  st.tick = function (dt) {
    if (!st.drag) st.idle += dt;
    /* it drifts on its own once the reader stops, and stops when they ask for less motion */
    if (!REDUCED && st.idle > 2.2 && !st.drag) st.yaw += dt * 0.105;
    /* the lean eases toward the pointer and eases back out; reduced motion keeps the pick and
       drops the lean, which is the part that is only movement */
    const k = 1 - Math.pow(0.0016, dt);
    const gx = REDUCED ? 0 : st.tx, gy = REDUCED ? 0 : st.ty;
    st.hx += (gx - st.hx) * k * 0.55;
    st.hy += (gy - st.hy) * k * 0.55;
  };
  st.project = function (W, H, spin, s) {
    const yaw = st.yaw + st.hx * 0.075, pitch = clamp(st.pitch + st.hy * 0.055, -0.20, 1.30);
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    /* the model spans about +-1.2 units, so the fit factor is what decides whether the object
       reads at all: at 0.40 it projected into 139px of a 644px canvas and looked empty */
    const D = 3.35, scale = Math.min(W, H * 1.5) * 1.22 * st.zoom * (s == null ? 1 : s);
    return function (x, y, z) {
      const X = x * cy + z * sy;
      const Z = -x * sy + z * cy;
      const Y = y * cp - Z * sp;
      const Z2 = y * sp + Z * cp;
      const f = scale / (D + Z2);
      return { x: W / 2 + X * f, y: H * 0.56 - Y * f, d: Z2, f: f };
    };
  };
  return st;
}

/* a quad, drawn back-to-front; the painter's algorithm is all this needs */
function quad(ctx, p, fill) {
  ctx.beginPath();
  ctx.moveTo(p[0].x, p[0].y);
  for (let i = 1; i < p.length; i++) ctx.lineTo(p[i].x, p[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/* the pointer readout: value, meaning, and a leader back to the thing it describes */
function pointerReadout(ctx, W, H, st, x, y, big, sub, colour, show) {
  const tx = clamp(x + 16, 90, W - 90), ty = clamp(y - 18, 26, H - 60);
  ctx.save();
  /* measured in the font each line is drawn in: this used to measure with whatever font was
     current (and to set a font string canvas cannot parse, since it held a var()), so the box was
     sized off a font that never rendered */
  ctx.font = '500 13px "Source Sans 3", sans-serif';
  const wBig = ctx.measureText(big).width;
  ctx.font = '500 10px "Source Sans 3", sans-serif';
  const wSub = ctx.measureText(sub).width;
  const w = Math.max(wBig, wSub) + 20;
  ctx.strokeStyle = 'rgba(242,239,230,.28)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + 5, y - 5); ctx.lineTo(tx - 8, ty + 2); ctx.stroke();
  ctx.fillStyle = 'rgba(33,19,39,.88)';
  ctx.fillRect(tx - 10, ty - 12, w, 38);
  ctx.strokeStyle = 'rgba(242,239,230,.14)';
  ctx.strokeRect(tx - 10, ty - 12, w, 38);
  ctx.textAlign = 'left';
  if (show) {
    ctx.font = '500 13px "Source Sans 3", sans-serif';
    ctx.fillStyle = colour; ctx.fillText(big, tx, ty + 3);
    ctx.font = '500 10px "Source Sans 3", sans-serif';
    ctx.fillStyle = TOK.faint; ctx.fillText(sub, tx, ty + 18);
  }
  ctx.restore();
}

function screenLabel(ctx, W, H, state, left, right, hint) {
  ctx.save();
  /* a gallery caption sits on a fade, not on the object: the geometry reaches the foot of the
     panel and a faint label printed straight onto it disappears */
  const scrim = ctx.createLinearGradient(0, H - 64, 0, H);
  scrim.addColorStop(0, 'rgba(33,19,39,0)');
  scrim.addColorStop(1, 'rgba(33,19,39,.92)');
  ctx.fillStyle = scrim; ctx.fillRect(0, H - 64, W, 64);
  ctx.font = '500 11px "Source Sans 3", sans-serif';
  const stacked = ctx.measureText(left).width + ctx.measureText(right).width > W - 40;
  ctx.textAlign = 'left';
  ctx.fillStyle = TOK.faint;
  ctx.fillText(left, 12, H - (stacked ? 21 : 6), W - 24);
  ctx.textAlign = 'right';
  ctx.fillStyle = TOK.viol;
  ctx.fillText(right, W - 12, H - 6, W - 24);
  /* the affordance, fading once the reader has taken hold of it */
  const a = clamp(1 - state.idle / 1.6) * 0.7 + (state.idle > 30 ? 0 : 0);
  const show = state.idle < 22 ? Math.max(a, 0.22 * clamp(1 - state.idle / 22)) : 0;
  if (show > 0.01) {
    ctx.textAlign = 'center';
    ctx.globalAlpha = show;
    ctx.fillStyle = TOK.dim;
    ctx.fillText(hint, W / 2, H - (stacked ? 38 : 23), W - 24);
  }
  ctx.restore();
}

// 2d. the weight field: inverse-variance weight as height, source mask in violet
function whtCanvas() {
  const cv = $('.wht-canvas');
  if (!cv) return;
  const G = 18, GZ = 13;
  const rnd = mulberry32(0xA17E1);
  const cells = [];
  for (let j = 0; j < GZ; j++) {
    for (let i = 0; i < G; i++) {
      const u = i / (G - 1) - 0.5, v = j / (GZ - 1) - 0.5;
      const r = Math.hypot(u, v * 1.35);
      let w = clamp(1 - r * 1.35);
      w *= 0.58 + 0.42 * Math.sin(i * 0.9) * Math.cos(j * 0.75);
      const gap = rnd() < 0.055;                       // chip gaps and ray trails
      if (gap) w *= 0.16;
      const src = Math.hypot(u + 0.16, v + 0.10) < 0.145 || Math.hypot(u - 0.22, v - 0.17) < 0.115;
      cells.push({ i, j, u, v, w: clamp(w), src, gap });
    }
  }
  const at = (i, j) => (i < 0 || j < 0 || i >= G || j >= GZ) ? 0 : cells[j * G + i].w;
  const st = orbitable(cv, { yaw: -0.62, pitch: 0.50 });
  let t0 = 0;
  function draw(now) {
    const [W, H, ctx] = sizeCanvas(cv);
    if (!t0) t0 = now;
    const dt = Math.min(0.05, (now - (draw.last || now)) / 1000); draw.last = now;
    st.tick(dt);
    const rise = clamp((now - t0) / 1400);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#211327'; ctx.fillRect(0, 0, W, H);

    const P = st.project(W, H, null, 1);
    const HW = 1.05, HZ = 0.78, HH = 0.88;
    const gx = (i) => (i / (G - 1) - 0.5) * 2 * HW;
    const gz = (j) => (j / (GZ - 1) - 0.5) * 2 * HZ;
    const hOf = (i, j) => at(i, j) * HH * rise * (0.25 + 0.75 * clamp((now - t0 - (i + j) * 26) / 700));

    /* floor: a pool of light with a hairline grid on it, so the field has somewhere to stand */
    const c0 = P(0, 0, 0);
    const pool = ctx.createRadialGradient(c0.x, c0.y, 8, c0.x, c0.y, Math.min(W, H) * 0.52);
    pool.addColorStop(0, 'rgba(120,134,158,.15)');
    pool.addColorStop(1, 'rgba(120,134,158,0)');
    ctx.fillStyle = pool; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.strokeStyle = 'rgba(242,239,230,.10)'; ctx.lineWidth = 1;
    for (let i = 0; i <= G; i += 1) {
      const a = P(gx(i) - HW / (G - 1), 0, -HZ), b = P(gx(i) - HW / (G - 1), 0, HZ);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    for (let j = 0; j <= GZ; j += 1) {
      const a = P(-HW, 0, gz(j) + HZ / (GZ - 1)), b = P(HW, 0, gz(j) + HZ / (GZ - 1));
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.restore();

    /* columns, back to front */
    const order = cells.slice().sort((a, b) => P(b.u * 2 * HW, 0, b.v * 2 * HZ).d - P(a.u * 2 * HW, 0, a.v * 2 * HZ).d);
    /* the light leans with the pointer, so the object answers before any label does */
    const lightX = -0.55 + st.hx * 0.9, lightY = 0.82;
    let hot = null, hotD = 1e9, hotTop = null, hotH = 0;
    const cellW = (HW / (G - 1));
    for (const c of order) {
      const x0 = gx(c.i) - (HW / (G - 1)) * 0.5, x1 = x0 + (HW / (G - 1));
      const z0 = gz(c.j) - (HZ / (GZ - 1)) * 0.5, z1 = z0 + (HZ / (GZ - 1));
      const h = hOf(c.i, c.j);
      if (h <= 0.001) continue;
      const top = [P(x0, h, z0), P(x1, h, z0), P(x1, h, z1), P(x0, h, z1)];
      const tone = c.src ? [155, 138, 230] : [166, 176, 182];
      const a = ((c.gap ? 0.16 : 0.20) + c.w * 0.42) * (c.src ? 1.55 : 1);
      /* top: brightened toward the key light, which now leans with the pointer */
      const lean = clamp(1.25 + st.hx * 0.5 - st.hy * 0.35, 0.7, 1.9);
      quad(ctx, top, 'rgba(' + tone[0] + ',' + tone[1] + ',' + tone[2] + ',' + clamp(a * lean, 0, 0.95).toFixed(3) + ')');
      /* picking: the nearest top-face centre. The columns are the objects here, not mesh edges. */
      if (st.inside) {
        const mx = (top[0].x + top[2].x) / 2, my = (top[0].y + top[2].y) / 2;
        const d = Math.hypot(mx - st.cx, my - st.cy);
        const near = Math.abs(P(cellW, 0, 0).x - P(0, 0, 0).x) * 0.62;
        if (d < near && d < hotD) { hotD = d; hot = c; hotTop = top; hotH = h; }
      }
      /* the two faces that can be seen from the front of the field */
      const hs = at(c.i, c.j + 1) * HH * rise, he = at(c.i + 1, c.j) * HH * rise;
      if (h > hs + 0.002) {
        quad(ctx, [P(x0, hs, z1), P(x1, hs, z1), P(x1, h, z1), P(x0, h, z1)],
          'rgba(' + (tone[0] * 0.72 | 0) + ',' + (tone[1] * 0.74 | 0) + ',' + (tone[2] * 0.78 | 0) + ',' + (a * 0.9).toFixed(3) + ')');
      }
      if (h > he + 0.002) {
        quad(ctx, [P(x1, he, z0), P(x1, he, z1), P(x1, h, z1), P(x1, h, z0)],
          'rgba(' + (tone[0] * 0.55 | 0) + ',' + (tone[1] * 0.58 | 0) + ',' + (tone[2] * 0.64 | 0) + ',' + (a * 0.9).toFixed(3) + ')');
      }
      void lightX; void lightY;
    }
    /* the picked column, redrawn on top: lit face, a hairline to the floor that reads its
       height, and the value at the cursor */
    cv.__hot = null;
    if (hot && hotTop) {
      cv.__hot = { i: hot.i, j: hot.j, w: +hot.w.toFixed(3), src: hot.src, gap: hot.gap };
      const base = P((hotTop[0].x + hotTop[2].x) / 2 - W / 2 + W / 2, 0, 0);
      void base;
      const bx = (hotTop[0].x + hotTop[2].x) / 2, by = (hotTop[0].y + hotTop[2].y) / 2;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,45,120,.55)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, P(0, 0, 0).y + (by - P(0, 0, 0).y) * 0); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      quad(ctx, hotTop, hot.gap ? 'rgba(185,138,106,.85)' : hot.src ? 'rgba(235,165,139,.88)' : 'rgba(226,232,238,.85)');
      pointerReadout(ctx, W, H, st, st.cx, st.cy,
        'w = ' + hot.w.toFixed(2),
        hot.gap ? 'chip gap / ray trail \u00b7 down-weighted' : hot.src ? 'inside the source mask' : 'field pixel',
        hot.gap ? '#B98A6A' : hot.src ? TOK.viol : TOK.moon, true);
    }
    screenLabel(ctx, W, H, st, 'INVERSE-VARIANCE WEIGHT \u2192 HEIGHT', 'SOURCE-REGION MASK', st.inside ? 'CLICK AND DRAG TO ORBIT' : 'DRAG TO ORBIT');
  }
  visibleLoop(cv, draw)();
  draw(performance.now());
}

// 2e. the Wiener kernel as a signed surface, with the estimate walking to the measurement
function mcfsCanvas() {
  const cv = $('.mcfs-canvas');
  if (!cv) return;
  const G = 26;
  /* A deconvolution kernel is a sharp core inside a negative skirt: that is what makes it
     sharpen instead of blur, and it is invisible in the flat cross-hair this replaces. */
  const kern = (u, v) => {
    const r2 = u * u + v * v;
    /* .34 of moat against a .72 peak: the first version's skirt ran to 1.6x the core and the
       object read as a tilted slab instead of a kernel */
    return 1.00 * Math.exp(-r2 / (2 * 0.050)) - 0.34 * Math.exp(-r2 / (2 * 0.34));
  };
  const grid = [];
  let peak = 0, dip = 0;
  for (let j = 0; j < G; j++) {
    for (let i = 0; i < G; i++) {
      const u = (i / (G - 1) - 0.5) * 1.9, v = (j / (G - 1) - 0.5) * 1.9;
      const k = kern(u, v);
      peak = Math.max(peak, k); dip = Math.min(dip, k);
      grid.push({ i, j, u, v, k });
    }
  }
  const st = orbitable(cv, { yaw: -0.55, pitch: 0.56 });
  let t0 = 0;
  function draw(now) {
    const [W, H, ctx] = sizeCanvas(cv);
    if (!t0) t0 = now;
    const dt = Math.min(0.05, (now - (draw.last || now)) / 1000); draw.last = now;
    st.tick(dt);
    const T = ((now - t0) / 1000 % 9) / 9;
    const u = clamp((T - 0.08) / 0.62);
    const est = lerp(0.34, 0.62, u);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#211327'; ctx.fillRect(0, 0, W, H);

    const P = st.project(W, H, null, 0.94);
    const SX = 1.15, SZ = 1.15, SY = 1.15;
    const X = i => (i / (G - 1) - 0.5) * 2 * SX;
    const Z = j => (j / (G - 1) - 0.5) * 2 * SZ;
    const yOf = (k, i, j) => (k / Math.max(peak, 0.001)) * SY * clamp((now - t0 - (i + j) * 22) / 900) - 0.16;

    /* the zero plane, so the negative skirt is legible */
    ctx.save();
    ctx.strokeStyle = 'rgba(242,239,230,.13)'; ctx.lineWidth = 1;
    for (let i = 0; i < G; i += 2) {
      const a = P(X(i), -0.16, -SZ), b = P(X(i), -0.16, SZ);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    for (let j = 0; j < G; j += 2) {
      const a = P(-SX, -0.16, Z(j)), b = P(SX, -0.16, Z(j));
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.restore();

    /* the surface: one quad per cell, painted back to front, cool above the plane and violet
       below it, so the skirt reads as the opposite of the core */
    const order = grid.slice().sort((a, b) => P(b.u, 0, b.v).d - P(a.u, 0, a.v).d);
    const step = 2 / (G - 1);
    for (const c of order) {
      const x0 = X(c.i) - SX * step * 0.5, x1 = x0 + SX * step;
      const z0 = Z(c.j) - SZ * step * 0.5, z1 = z0 + SZ * step;
      const y00 = yOf(c.k, c.i, c.j), y10 = yOf(c.k, c.i + 1, c.j);
      const y11 = yOf(c.k, c.i + 1, c.j + 1), y01 = yOf(c.k, c.i, c.j + 1);
      const pos = c.k > 0;
      const t = Math.min(1, Math.abs(c.k) / Math.max(peak, 0.001));
      /* slope toward the key light (up and to the left): a flat alpha fill is what made the first
         version read as a plate rather than a surface */
      const slope = (y10 - y00) + (y01 - y00);
      const lit = clamp(0.62 + slope * (2.6 + st.hx * 1.8) + t * 0.30 - st.hy * 0.18);
      const col = pos
        ? 'rgba(' + (240 * lit | 0) + ',' + (244 * lit | 0) + ',' + (250 * lit | 0) + ',' + (0.10 + t * 0.66).toFixed(3) + ')'
        : 'rgba(' + (150 * lit | 0) + ',' + (134 * lit | 0) + ',' + (226 * lit | 0) + ',' + (0.08 + t * 0.46).toFixed(3) + ')';
      quad(ctx, [P(x0, y00, z0), P(x1, y10, z0), P(x1, y11, z1), P(x0, y01, z1)], col);
    }

    /* the two references, in the same space rather than as a flat diagram */
    const mz = 0;
    const mA = P(0, 0.62, mz), mB = P(0, -0.42, mz);
    ctx.save();
    ctx.strokeStyle = 'rgba(166,176,182,.55)'; ctx.lineWidth = 1.1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(mA.x, mA.y); ctx.lineTo(mB.x, mB.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '500 10.5px "Source Sans 3", sans-serif'; ctx.fillStyle = TOK.faint; ctx.textAlign = 'center';
    ctx.fillText('MEASUREMENT', mA.x, mA.y - 6);
    ctx.restore();

    const ex = X(Math.round(est * (G - 1))), ez = Z(Math.round((G - 1) * 0.5));
    const e = P(ex, 0.30, ez);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, 26);
    g.addColorStop(0, 'rgba(255,255,255,.95)');
    g.addColorStop(0.3, 'rgba(255,45,120,.5)');
    g.addColorStop(1, 'rgba(255,45,120,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y, 26, 0, 6.284); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.font = '500 10.5px "Source Sans 3", sans-serif'; ctx.fillStyle = TOK.viol; ctx.textAlign = 'center';
    ctx.fillText('ESTIMATE', e.x, e.y + 30);
    ctx.restore();

    /* picking the surface: nearest cell centre in screen space */
    cv.__hot = null;
    if (st.inside) {
      let hd = 1e9, hc = null, hp = null;
      for (const c of order) {
        const px = P(X(c.i), yOf(c.k, c.i, c.j), Z(c.j));
        const d = Math.hypot(px.x - st.cx, px.y - st.cy);
        if (d < hd) { hd = d; hc = c; hp = px; }
      }
      const near = Math.abs(P(X(1), 0, 0).x - P(X(0), 0, 0).x) * 0.55;
      if (hc && hd < near) {
        cv.__hot = { i: hc.i, j: hc.j, k: +hc.k.toFixed(4) };
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(hp.x, hp.y, 0, hp.x, hp.y, 16);
        g.addColorStop(0, 'rgba(255,255,255,.55)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hp.x, hp.y, 16, 0, 6.284); ctx.fill();
        ctx.restore();
        const core = hc.k > 0.02, skirt = hc.k < -0.02;
        pointerReadout(ctx, W, H, st, st.cx, st.cy,
          'W = ' + (hc.k >= 0 ? '+' : '\u2212') + Math.abs(hc.k).toFixed(2),
          core ? 'core \u00b7 this pixel is added' : skirt ? 'skirt \u00b7 this pixel is subtracted' : 'zero crossing',
          core ? TOK.star : skirt ? TOK.viol : TOK.moon, true);
      }
    }
    screenLabel(ctx, W, H, st, 'WIENER-REGULARISED BACK-PROJECTION', 'NEGATIVE SKIRT (SHARPENING)', st.inside ? 'CLICK AND DRAG TO ORBIT' : 'DRAG TO ORBIT');
  }
  visibleLoop(cv, draw)();
  draw(performance.now());
}

// ---------------------------------------------------------------------------
// 3. INTERACTION
// ---------------------------------------------------------------------------
function topbarAndNav() {
  const bar = $('#topbar'), prog = $('.progress span');
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    bar.classList.toggle('is-solid', y > 40);
    prog.style.setProperty('--p', h > 0 ? (y / h).toFixed(4) : 0);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const links = $$('.nav a');
  const targets = links.map(a => document.getElementById(a.hash.slice(1)));
  let pending = 0;
  const updateActive = () => {
    pending = 0;
    let current = -1;
    targets.forEach((section, i) => {
      if (section && section.getBoundingClientRect().top <= innerHeight * .32) current = i;
    });
    links.forEach((link, i) => {
      link.classList.toggle('is-active', i === current);
      if (i === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  const queueActive = () => { if (!pending) pending = requestAnimationFrame(updateActive); };
  addEventListener('scroll', queueActive, {passive:true});
  addEventListener('resize', queueActive);
  updateActive();
}

function reveal() {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    io.unobserve(e.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => io.observe(el));
}

function counters() {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target; io.unobserve(el);
    const to = parseFloat(el.dataset.to), dec = parseInt(el.dataset.dec || '0', 10);
    const grp = el.dataset.to.includes('.') || dec > 0 ? false : true;
    const t0 = performance.now(), dur = 1400;
    const step = now => {
      const u = clamp((now - t0) / dur);
      const v = to * (1 - Math.pow(1 - u, 3));
      el.textContent = grp ? Math.round(v).toLocaleString('en-US') : v.toFixed(dec);
      if (u < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: 0.6 });
  $$('.count').forEach(el => io.observe(el));
}

function filmPlayer() {
  const frame = $('[data-film]');
  if (!frame) return;
  const video = $('.film-video', frame);
  const bar = $('[data-bar]', frame), time = $('[data-time]', frame);
  let dragging = false, userPaused = false;
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const sync = () => {
    frame.classList.toggle('is-paused', video.paused);
    $('[data-play]', frame).setAttribute('aria-label', video.paused ? 'Play' : 'Pause');
    $('[data-mute]', frame).setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute');
    frame.classList.toggle('is-sound', !video.muted && video.volume > 0);
  };
  const tick = () => {
    const d = video.duration || 98, t = video.currentTime;
    bar.style.setProperty('--p', (t / d * 100).toFixed(2) + '%');
    if (video.buffered.length) bar.style.setProperty('--buf', (video.buffered.end(video.buffered.length - 1) / d * 100).toFixed(2) + '%');
    time.textContent = `${fmt(t)} / ${fmt(d)}`;
    bar.setAttribute('aria-valuenow', Math.round(t));
    bar.setAttribute('aria-valuemax', Math.round(d));
    bar.setAttribute('aria-valuetext', `${fmt(t)} of ${fmt(d)}`);
  };
  video.addEventListener('loadedmetadata', () => { sync(); tick(); });
  ['play', 'pause', 'volumechange'].forEach(ev => video.addEventListener(ev, sync));
  ['timeupdate', 'progress'].forEach(ev => video.addEventListener(ev, tick));
  const toggle = () => {
    userPaused = !video.paused;
    if (video.paused) video.play().catch(() => {}); else video.pause();
  };
  video.addEventListener('click', toggle);
  $('[data-play]', frame).addEventListener('click', toggle);
  $('[data-mute]', frame).addEventListener('click', () => { video.muted = !video.muted; if (!video.muted) video.volume = 1; });
  $('[data-sound]', frame).addEventListener('click', () => { video.muted = false; video.volume = 1; video.play().catch(() => {}); });
  $('[data-full]', frame).addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (frame.requestFullscreen) frame.requestFullscreen();
  });
  const seek = e => {
    const r = bar.getBoundingClientRect();
    video.currentTime = clamp((e.clientX - r.left) / r.width) * (video.duration || 98);
    tick();
  };
  bar.addEventListener('pointerdown', e => { dragging = true; bar.setPointerCapture(e.pointerId); seek(e); });
  bar.addEventListener('pointermove', e => { if (dragging) seek(e); });
  bar.addEventListener('pointerup', () => { dragging = false; });
  bar.addEventListener('pointercancel', () => { dragging = false; });
  bar.addEventListener('keydown', e => {
    const d = { ArrowLeft: -2, ArrowRight: 2 }[e.key];
    if (d) { e.preventDefault(); video.currentTime = clamp(video.currentTime + d, 0, (video.duration || 98) - 0.1); tick(); }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
  });
  // autoplay when it enters view, pause when it leaves
  new IntersectionObserver(es => {
    const r = es[0].intersectionRatio;
    if (r > 0.55 && !REDUCED && !userPaused && video.paused) video.play().catch(() => {});
    else if (r < 0.2 && !video.paused) { video.pause(); }
  }, { threshold: [0, 0.2, 0.55] }).observe(frame);
  video.addEventListener('ended', () => { userPaused = true; sync(); });
  sync(); tick();
}

// ---------------------------------------------------------------------------
// The same field, seven ways. Real panels sliced out of the paper's comparison
// grid, so nothing here is a redrawing.
// ---------------------------------------------------------------------------
const SCENES = [
  { id: 'night',  label: 'Field A' },
  { id: 'low',    label: 'Field B' },
  { id: 'oe',     label: 'Field C' },
  { id: 'faint',  label: 'Field D' },
  { id: 'crowd',  label: 'Field E' },
  { id: 'wide',   label: 'Field F' },
];
const METHODS = [
  { id: 'bicubic',  label: 'Bicubic',  note: 'No restoration. The noise is resolved, not the sky.' },
  { id: 'swinir',   label: 'SwinIR',   note: 'Transformer restoration: smooth, and the faint sources go with it.' },
  { id: 'hat',      label: 'HAT',      note: 'Hybrid attention. Crisper, still blind to the observation model.' },
  { id: 'fisr',     label: 'FISR',     note: 'Flow-based. Sharper texture, and the first invented sources appear.' },
  { id: 'cgan',     label: 'cGAN',     note: 'Adversarial. Photometrically unreliable by construction.' },
  { id: 'gdnet',    label: 'GD-Net',   note: 'Degradation-aware. Better calibrated, still noisy.' },
  { id: 'fluxflow', label: 'FluxFlow', note: 'Straight flow plus measurement consistency. Structure and flux held.' },
];

function compareSection() {
  const stage = $('[data-stage]');
  if (!stage) return;
  const under = $('[data-under]');
  const over = $('[data-over]');
  const handle = $('[data-handle]');
  const loupe = $('[data-loupe]');
  const underName = $('[data-under-name]');
  const note = $('[data-cmp-note]');
  const sceneTabs = $('[data-scene-tabs]');
  const methodBox = $('[data-methods]');

  let scene = 0, method = 0;

  SCENES.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(i === 0));
    b.textContent = s.label;
    b.addEventListener('click', () => {
      scene = i;
      $$('button', sceneTabs).forEach((x, j) => x.setAttribute('aria-selected', String(j === i)));
      load();
    });
    sceneTabs.appendChild(b);
  });
  METHODS.forEach((m, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.m = m.id; b.setAttribute('aria-pressed', String(i === 0));
    b.textContent = m.label;
    b.addEventListener('click', () => {
      method = i;
      $$('button', methodBox).forEach((x, j) => x.setAttribute('aria-pressed', String(j === i)));
      if (underName) underName.textContent = m.label;
      if (note) note.textContent = m.note;
      load();
    });
    methodBox.appendChild(b);
  });

  const src = (row, name) => `assets/img/cmp/r${row}-${name}.jpg`;
  /* Square stage, 9:16 slices: every view is a crop, and CROP[scene] is where it sits,
     as object-position Y%. Measured offline from the real pixels (probe-cmp-crop.mjs):
     the window keeping the most sources without dragging in the white caption bar at the
     foot of the strip. Both halves read the same value, or the divider would be comparing
     two different regions of the sky. */
  const CROP = { 0: 90, 1: 86, 2: 84, 3: 55, 4: 78, 5: 6 };
  const cropY = () => (CROP[scene] === undefined ? 50 : CROP[scene]) + '%';
  function load() {
    under.src = src(scene, METHODS[method].id);
    over.src = src(scene, 'fluxflow');
    under.style.objectPosition = '50% ' + cropY();
    over.style.objectPosition = '50% ' + cropY();
    stage.classList.toggle('is-same', METHODS[method].id === 'fluxflow');
  }
  load();
  if (note) note.textContent = METHODS[0].note;

  // divider position, shared by drag and hover
  let pos = 0.5;
  /* one custom property, so the clip and the handle can never disagree */
  function setPos(u) {
    pos = clamp(u, 0, 1);
    stage.style.setProperty('--split', (pos * 100).toFixed(2) + '%');
    stage.setAttribute('aria-valuenow', String(Math.round(pos * 100)));
    stage.setAttribute('aria-valuetext', `${Math.round(pos * 100)} percent FluxFlow`);
  }
  stage.setAttribute('role', 'slider');
  stage.setAttribute('aria-label', 'Image comparison divider');
  stage.setAttribute('aria-valuemin', '0');
  stage.setAttribute('aria-valuemax', '100');
  setPos(0.5);

  let dragging = false;
  const at = e => {
    const r = stage.getBoundingClientRect();
    return (e.clientX - r.left) / r.width;
  };
  stage.addEventListener('pointerdown', e => {
    dragging = true; stage.setPointerCapture(e.pointerId);
    setPos(at(e), true); stage.classList.remove('is-loupe');
  });
  stage.addEventListener('pointermove', e => {
    if (dragging) { setPos(at(e), true); return; }
    // hovering magnifies the sharp side, against the blurry one
    /* the drawn image is NOT the stage box: cover scales it until it fills the square and
       object-position slides it by the crop, so the magnifier has to offset by that much.
       Assuming background-size = stage rect was only ever right while the stage shared the
       slice's 9:16 aspect. */
    const r = stage.getBoundingClientRect();
    const natW = over.naturalWidth || 317, natH = over.naturalHeight || 566;
    const sc = Math.max(r.width / natW, r.height / natH);
    const dw = natW * sc, dh = natH * sc;
    const ox = (r.width - dw) * 0.5;
    const oy = (r.height - dh) * ((CROP[scene] === undefined ? 50 : CROP[scene]) / 100);
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const z = 2.1;
    loupe.style.left = (x - 75) + 'px';
    loupe.style.top = (y - 75) + 'px';
    loupe.style.backgroundImage = `url("${over.src}")`;
    loupe.style.backgroundSize = `${dw * z}px ${dh * z}px`;
    loupe.style.backgroundPosition = `${-((x - ox) * z - 75)}px ${-((y - oy) * z - 75)}px`;
    stage.classList.add('is-loupe');
  });
  const endDrag = () => { dragging = false; };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('pointerleave', () => { endDrag(); stage.classList.remove('is-loupe'); });
  stage.addEventListener('keydown', e => {
    const d = { ArrowLeft: -0.04, ArrowRight: 0.04 }[e.key];
    if (d) { e.preventDefault(); setPos(pos + d, true); }
  });
  stage.tabIndex = 0;
}

// ---------------------------------------------------------------------------
// 0. GLOBAL SKY —one star field behind the entire page, always moving.
// Fixed, pointer-events:none, and the only thing that repaints continuously.
// Sections sit above it with translucent backgrounds, so the page reads as one
// continuous space rather than a stack of panels.
// ---------------------------------------------------------------------------
function globalSky() {
  const cv = document.getElementById('skybg');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const layers = [];
  const specs = [
    { n: 620, mag: 4.0, bright: 0.06, core: 0.22, drift: 0.6, alpha: 0.62 },
    { n: 340, mag: 3.5, bright: 0.11, core: 0.32, drift: 1.5, alpha: 0.85 },
    { n: 120, mag: 2.8, bright: 0.20, core: 0.50, drift: 3.1, alpha: 1.00 },
  ];
  let W = 0, H = 0, dpr0 = 1;
  const meteors = [];
  function tempColor(u) {
    return [Math.round(lerp(196, 255, Math.pow(u, 0.75))),
            Math.round(lerp(214, 236, Math.pow(u, 0.9))),
            Math.round(lerp(255, 196, Math.pow(u, 1.6)))];
  }
  function build() {
    dpr0 = Math.min(1.5, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr0); cv.height = Math.round(H * dpr0);
    ctx.setTransform(dpr0, 0, 0, dpr0, 0, 0);
    layers.length = 0;
    for (let li = 0; li < specs.length; li++) {
      const sp = specs[li];
      const rnd = mulberry32(0x5C1E5 + li * 977);
      const stars = [];
      for (let i = 0; i < sp.n; i++) {
        stars.push({
          x: rnd(), y: rnd(),
          m: Math.pow(rnd(), sp.mag),
          tw: rnd() * 6.283,
          c: tempColor(rnd()),
        });
      }
      layers.push({ sp, stars });
    }
  }
  build();
  addEventListener('resize', build);

  function spawnMeteor() {
    const fromLeft = Math.random() < 0.5;
    meteors.push({
      x: fromLeft ? -0.1 * W : 1.1 * W,
      y: -0.05 * H + Math.random() * 0.42 * H,
      vx: (fromLeft ? 1 : -1) * (0.55 + Math.random() * 0.5) * W,
      vy: (0.12 + Math.random() * 0.22) * H,
      life: 1, len: 90 + Math.random() * 170,
    });
  }

  let last = performance.now(), nextMeteor = 3.5;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    nextMeteor -= dt;
    if (nextMeteor <= 0) { spawnMeteor(); nextMeteor = 7 + Math.random() * 11; }

    const T = now / 1000;
    const yaw = T * 0.004;                       // a very slow turn
    const cx = W / 2, cy = H / 2;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const L of layers) {
      const { sp, stars } = L;
      const dx = Math.sin(yaw) * 6 * sp.drift;
      const dy = Math.cos(yaw * 0.7) * 4 * sp.drift;
      ctx.globalAlpha = sp.alpha;
      for (const st of stars) {
        const x = ((st.x * W + dx) % (W + 40) + W + 40) % (W + 40) - 20;
        const y = ((st.y * H + dy) % (H + 40) + H + 40) % (H + 40) - 20;
        const tw = 0.82 + 0.18 * Math.sin(T * (0.7 + st.m * 1.6) + st.tw);
        const r = (0.35 + st.m * 2.1) * tw;
        const a = (0.10 + st.m * 0.70) * tw;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2);
        g.addColorStop(0, `rgba(255,255,255,${a.toFixed(3)})`);
        g.addColorStop(0.30, `rgba(${st.c[0]},${st.c[1]},${st.c[2]},${(a * 0.42).toFixed(3)})`);
        g.addColorStop(1, `rgba(${st.c[0]},${st.c[1]},${st.c[2]},0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, 6.284); ctx.fill();
      }
      // the brightest layer carries thin spider spikes
      if (sp.drift > 2) {
        ctx.globalAlpha = sp.alpha * 0.5;
        for (const st of stars) {
          if (st.m < 0.62) continue;
          const x = ((st.x * W + dx) % (W + 40) + W + 40) % (W + 40) - 20;
          const y = ((st.y * H + dy) % (H + 40) + H + 40) % (H + 40) - 20;
          const L2 = lerp(9, 34, (st.m - 0.62) / 0.38);
          ctx.strokeStyle = `rgba(${st.c[0]},${st.c[1]},${st.c[2]},0.5)`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(x - L2, y); ctx.lineTo(x + L2, y);
          ctx.moveTo(x, y - L2); ctx.lineTo(x, y + L2);
          ctx.stroke();
        }
      }
    }
    // meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx * dt; m.y += m.vy * dt;
      if (m.x < -0.3 * W || m.x > 1.3 * W || m.y > 1.2 * H) { meteors.splice(i, 1); continue; }
      const L = Math.hypot(m.vx, m.vy), ux = m.vx / L, uy = m.vy / L;
      const ex = m.x - ux * m.len, ey = m.y - uy * m.len;
      const g = ctx.createLinearGradient(m.x, m.y, ex, ey);
      g.addColorStop(0, 'rgba(240,247,255,0.75)');
      g.addColorStop(0.3, 'rgba(200,222,248,0.22)');
      g.addColorStop(1, 'rgba(140,175,220,0)');
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = g; ctx.lineCap = 'round';
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(ex, ey); ctx.stroke();
      const hg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 9);
      hg.addColorStop(0, 'rgba(255,255,255,0.95)');
      hg.addColorStop(1, 'rgba(200,222,248,0)');
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(m.x, m.y, 9, 0, 6.284); ctx.fill();
    }
    ctx.restore();
    raf = requestAnimationFrame(frame);
  }
  let raf = 0;
  if (REDUCED) {
    // still a star field, just frozen and drawn once
    ctx.clearRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const L of layers) {
      ctx.globalAlpha = L.sp.alpha;
      for (const st of L.stars) {
        const x = st.x * W, y = st.y * H, r = 0.35 + st.m * 2.1;
        const a = 0.10 + st.m * 0.70;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2);
        g.addColorStop(0, `rgba(255,255,255,${a.toFixed(3)})`);
        g.addColorStop(1, `rgba(${st.c[0]},${st.c[1]},${st.c[2]},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, 6.284); ctx.fill();
      }
    }
    ctx.restore();
  } else {
    raf = requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => {
    if (REDUCED) return;
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  });
}

function heroIntro() {
  const hero = $('.hero');
  if (!hero) return;
  $$('[data-at]', hero).forEach(el => el.style.setProperty('--at', el.dataset.at));
  const wm = $('.wm--hero', hero);
  if (wm && !wm.dataset.split) {
    wm.dataset.split = '1';
    wm.innerHTML = [...'FluxFlow'].map((ch, i) => `<span class="ch" style="--i:${i}">${ch}</span>`).join('') + '<i class="wm-dot"></i>';
  }
  const start = () => { heroT0 = performance.now(); hero.classList.add('is-live'); };
  if (REDUCED) { start(); return; }
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting) start(); }, { threshold: 0.35 });
  io.observe(hero);
}

function copyBibtex() {
  const btn = $('.copy');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const src = $(btn.dataset.copy);
    if (!src) return;
    const text = src.textContent;
    const done = () => {
      btn.classList.add('is-done');
      $('.copy-label', btn).textContent = 'Copied';
      setTimeout(() => { btn.classList.remove('is-done'); $('.copy-label', btn).textContent = 'Copy BibTeX'; }, 1800);
    };
    try { await navigator.clipboard.writeText(text); done(); }
    catch { const r = document.createRange(); r.selectNode(src); getSelection().removeAllRanges(); getSelection().addRange(r); done(); }
  });
}

// ---------------------------------------------------------------------------
// Pinned scrolltelling: one field walks through the adapter's four stages.
// The stage is read from scroll progress, never from a scroll listener doing
// layout work, and the canvas only repaints while the section is on screen.
// ---------------------------------------------------------------------------
function storySection() {
  const sec = $('#story');
  if (!sec) return;
  const cv = $('.story-canvas', sec);
  const curveCv = $('.story-curve', sec);
  const badge = $('[data-badge]', sec);
  const steps = $$('.story-steps li', sec);

  const src = new Image();
  src.src = (window.__INLINE_IMG && window.__INLINE_IMG.starCluster) || 'assets/img/star-cluster.jpg';
  let sharp = null, ground = null, curveApplied = null, half = null;

  function buildSprites() {
    if (!src.naturalWidth) return;
    const S = 560;
    const base = document.createElement('canvas'); base.width = S; base.height = S;
    const bx = base.getContext('2d');
    bx.drawImage(src, 0, 0, S, S);
    // tone it into the film
    const sd = bx.getImageData(0, 0, S, S), p = sd.data;
    for (let i = 0; i < p.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        let v = p[i + c] / 255;
        v = Math.pow(clamp((v - 0.05) / 0.9), 1.45) * 0.98;
        p[i + c] = clamp(Math.round(v * 255), 0, 255);
      }
    }
    bx.putImageData(sd, 0, 0);
    sharp = base;

    // stage 0 —what the ground actually delivers: blurred, lifted, noisy
    const g = document.createElement('canvas'); g.width = S; g.height = S;
    const gx = g.getContext('2d');
    gx.filter = 'blur(9px)';
    gx.drawImage(base, 0, 0);
    gx.filter = 'none';
    gx.globalCompositeOperation = 'lighter';
    gx.globalAlpha = 0.20; gx.fillStyle = 'rgb(30,34,38)'; gx.fillRect(0, 0, S, S);
    gx.globalAlpha = 1;
    const d = gx.getImageData(0, 0, S, S), q = d.data;
    const rnd = mulberry32(0x5EE2);
    for (let i = 0; i < q.length; i += 4) {
      const n = rnd() < 0.55 ? 0 : 8 + Math.round(rnd() * 30);
      q[i] = clamp(q[i] + n, 0, 255); q[i + 1] = clamp(q[i + 1] + n, 0, 255); q[i + 2] = clamp(q[i + 2] + n, 0, 255);
    }
    gx.putImageData(d, 0, 0);
    ground = g;

    // stage 1 —tone lifted by the global curve, still unresolved
    const c1 = document.createElement('canvas'); c1.width = S; c1.height = S;
    const cx1 = c1.getContext('2d');
    cx1.filter = 'blur(6px)';
    cx1.drawImage(base, 0, 0);
    cx1.filter = 'none';
    const d1 = cx1.getImageData(0, 0, S, S), p1 = d1.data;
    for (let i = 0; i < p1.length; i += 4) {
      for (let c = 0; c < 3; c++) p1[i + c] = clamp(Math.round(Math.pow(p1[i + c] / 255, 0.72) * 232), 0, 255);
    }
    cx1.putImageData(d1, 0, 0);
    curveApplied = c1;

    // stage 2 —local colour restored, still slightly soft
    const c2 = document.createElement('canvas'); c2.width = S; c2.height = S;
    const cx2 = c2.getContext('2d');
    cx2.filter = 'blur(2.4px)';
    cx2.drawImage(base, 0, 0);
    half = c2;
  }
  src.onload = () => { buildSprites(); draw(); };
  if (src.complete && src.naturalWidth) { buildSprites(); }
  // Whatever happens, redraw once the image is ready —the old code left the
  // canvas blank forever if the reader scrolled here before the load finished.
  setTimeout(() => { buildSprites(); draw(); }, 400);

  // the tone curve the adapter predicts, drawn live
  function drawCurve(active) {
    if (!curveCv) return;
    const [W, H, ctx] = sizeCanvas(curveCv);
    ctx.clearRect(0, 0, W, H);
    const pad = W * 0.16, side = W - pad * 2;

    /* Plot box and the 1:1 reference. The reference is dashed on purpose: a solid
       hairline corner-to-corner over a photograph is indistinguishable from a scratch
       on the photograph, which is exactly how readers were reading it. */
    ctx.save();
    ctx.strokeStyle = TOK.rule; ctx.lineWidth = 1;
    ctx.globalAlpha = .95;
    ctx.strokeRect(pad, pad, side, side);
    ctx.globalAlpha = .85;
    ctx.fillStyle = TOK.faint;
    ctx.font = '500 9.5px "Source Sans 3", sans-serif';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '1.2px';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('TONE CURVE', pad + 6, pad + 13);
    ctx.textAlign = 'right';
    ctx.fillText('1:1', pad + side - 5, H - pad - 6);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.restore();

    const chans = [[TOK.ground, 0], [TOK.ok, 1], [TOK.space, 2]];
    for (const [col, k] of chans) {
      ctx.save();
      ctx.globalAlpha = clamp(active * 1.4 - k * 0.08);
      ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const x = i / 40;
        const y = Math.pow(x, 1 + k * 0.10 - active * 0.02);
        const px = pad + x * side;
        const py = (H - pad) - y * side;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke(); ctx.restore();
    }

    /* The 1:1 rule is drawn last, over the channels. The three channels straddle the
       identity, so a rule underneath is simply covered by the middle one; dashed over
       the top it reads as the measured reference the curves depart from. */
    ctx.save();
    ctx.strokeStyle = 'rgba(242,239,230,.42)'; ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(pad, H - pad); ctx.lineTo(pad + side, pad); ctx.stroke();
    ctx.restore();
  }

  let cur = -1;
  function update() {
    const r = sec.getBoundingClientRect();
    const total = r.height - innerHeight;
    const u = clamp((-r.top) / (total > 0 ? total : 1));
    const stage = Math.min(3, Math.floor(u * 4));
    if (stage !== cur) {
      cur = stage;
      steps.forEach((li, i) => li.classList.toggle('is-on', i <= stage));
      if (badge) {
        const names = ['seeing-limited', 'tone corrected', 'colour restored', 'diffraction-limited'];
        badge.textContent = names[stage];
        badge.style.color = stage === 3 ? TOK.space : stage === 0 ? TOK.ground : TOK.viol;
      }
    }
    return u;
  }

  function draw() {
    const u = update();
    if (!cv) return;
    const [W, H, ctx] = sizeCanvas(cv);
    ctx.clearRect(0, 0, W, H);
    // never leave the frame empty: if the sprite is not ready yet, say so with a
    // placeholder instead of a silent black box
    if (!ground) {
      ctx.fillStyle = '#211327'; ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.fillStyle = TOK.faint; ctx.font = '500 12px "Source Sans 3", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LOADING FIELD', W / 2, H / 2);
      ctx.restore();
      return;
    }
    // cover the frame rather than letterboxing a square inside a 3:2 canvas
    const s = Math.max(W, H);
    const x0 = (W - s) / 2, y0 = (H - s) / 2;
    const stages = [ground, curveApplied, half, sharp];
    for (let i = 0; i < 4; i++) {
      const seg = clamp((u - i * 0.25) / 0.25);
      const a = i === 0 ? 1 : seg;
      if (a <= 0.002) continue;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.filter = `blur(${lerp(4, 0, i === 3 ? 1 : seg).toFixed(2)}px)`;
      ctx.drawImage(stages[i], x0, y0, s, s);
      ctx.restore();
    }
    drawCurve(u);
  }
  visibleLoop(sec, draw)();
  // draw on scroll whatever the motion preference: under reduced motion there is
  // no rAF loop, so scroll is the only thing that keeps this section live
  addEventListener('scroll', draw, { passive: true });
  addEventListener('resize', draw);
  draw();
}

// ---------------------------------------------------------------------------
// Result tables, tabbed like the paper's
// ---------------------------------------------------------------------------
// Only numbers that are actually in the paper are listed. Anything not verified
// against the text is omitted rather than estimated: a project page that invents
// a metric is worse than one that links to the table.
const TABLES = {
  t2b: {
    cap: 'Quantitative comparison on DESI-HST (paper Table 2). PSNR in dB and SSIM: higher is better. Flux-L1: lower is better. The last column is FluxFlow.',
    cols: ['Scale', 'Metric', 'Bicubic', 'SwinIR', 'HAT', 'FISR', 'cGAN', 'GD-Net', 'AS-Bridge', 'FluxFlow'],
    rows: [
      ['\u00d72', 'PSNR \u2191',  '26.69', '31.22', '31.31', '30.93', '28.88', '28.82', '28.38', '31.23'],
      ['\u00d72', 'SSIM \u2191',  '0.594', '0.702', '0.711', '0.704', '0.579', '0.692', '0.626', '0.714'],
      ['\u00d72', 'Flux-L1 \u2193', '11.25', '14.136', '3.695', '3.526', '4.502', '3.639', '5.151', '2.959'],
      ['\u00d74', 'PSNR \u2191',  '22.74', '29.15', '29.21', '29.02', '26.48', '24.64', '24.72', '29.14'],
      ['\u00d74', 'SSIM \u2191',  '0.415', '0.569', '0.570', '0.568', '0.477', '0.496', '0.514', '0.570'],
      ['\u00d74', 'Flux-L1 \u2193', '18.08', '4.939', '4.168', '4.082', '5.479', '4.599', '6.542', '3.755'],
    ],
    ours: -1,
  },
};

function tables() {
  const host = $('[data-table-host]');
  if (!host) return;
  const caps = $('[data-table-caption]');
  const buttons = $$('.tabs button');
  const render = key => {
    const t = TABLES[key];
    if (!t) return;
    host.innerHTML = `<table class="res"><thead><tr>${t.cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>` +
      t.rows.map((r, i) => `<tr class="${i === t.ours ? 'is-ours' : ''}">` +
        r.map((c, j) => `<td class="${j === t.cols.length - 1 ? 'best' : ''}">${c}</td>`).join('') + '</tr>').join('') +
      '</tbody></table>';
    if (caps) caps.textContent = t.cap;
  };
  buttons.forEach(b => b.addEventListener('click', () => {
    buttons.forEach(x => x.setAttribute('aria-selected', String(x === b)));
    render(b.dataset.t);
  }));
  render('t2b');
}

function lightbox() {
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.innerHTML = '<button type="button" aria-label="Close">×</button><img alt="">';
  document.body.appendChild(box);
  const img = $('img', box);
  const close = () => { box.classList.remove('is-open'); document.body.style.overflow = ''; };
  box.addEventListener('click', e => { if (e.target === box || e.target.tagName === 'BUTTON') close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  $$('.zoom').forEach(a => a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (!href || !/\.(png|jpe?g|webp)$/i.test(href)) return;
    e.preventDefault();
    img.src = href;
    box.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }));
}

// panels: generate the seeing-limited rendering so hovering is a real resolve
function resolvePanels() {
  $$('.panel').forEach(p => {
    const img = $('img', p);
    if (!img) return;
    p.tabIndex = 0;
    const mark = () => p.classList.add('is-resolved');
    const unmark = () => p.classList.remove('is-resolved');
    p.addEventListener('pointerenter', mark);
    p.addEventListener('pointerleave', unmark);
    p.addEventListener('focus', mark);
    p.addEventListener('blur', unmark);
    p.addEventListener('click', () => p.classList.toggle('is-resolved'));
    p.style.setProperty('--blur', '8px');
  });
}

// ---------------------------------------------------------------------------
function boot() {
  const tasks = {
    heroIntro, psfCanvas, halCanvas, flowCanvas, whtCanvas, mcfsCanvas,
    topbarAndNav, reveal, counters, filmPlayer, storySection, compareSection,
    tables, lightbox, resolvePanels, copyBibtex,
  };
  window.__err = [];
  for (const [name, fn] of Object.entries(tasks)) {
    try { fn(); }
    catch (e) { window.__err.push(name + ': ' + e.message); console.error('boot failed in', name, e); }
  }
  if (window.__err.length) console.warn('boot errors:', window.__err);
}
if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
else boot();

/* ===================== appendix knob sweeps ===================== */
(function () {
  var KNOBS = [
    {
      id: 'psf', lo: 1, hi: 6, def: 2, fmt: function (v) { return v.toFixed(1); },
      xlab: '\u03b3 PSF  (HR pixels)',
      q: {
        psnr: function (v) { return 1 - (v - 1) / 5; },
        l1:   function (v) { return 0.30 + 0.62 * Math.exp(-Math.pow((v - 3.5) / 2.2, 2)); },
        f1:   function (v) { return 0.36 + 0.58 * Math.exp(-Math.pow((v - 3.6) / 1.9, 2)); }
      },
      note: function (v) {
        if (v < 1.7) return 'Narrower than default: the Wiener step back-projects less of the LR residual, so Flux-L1 and detection F1 sit below their plateau.';
        if (v <= 2.3) return 'Default. Both scales are run at \u03b3_PSF = 2 HR pixels.';
        if (v <= 4.4) return 'Inside the broad plateau: PSNR keeps falling while Flux-L1 and detection F1 hold.';
        return 'Past the plateau: an over-wide forward kernel starts to cost Flux-L1 and detection F1 as well.';
      }
    },
    {
      id: 'snr', lo: 10, hi: 100, def: 50, fmt: function (v) { return String(Math.round(v)); },
      xlab: '\u03be SNR',
      q: {
        psnr: function (v) { return 0.900 + 0.012 * Math.sin(v / 7.3); },
        l1:   function (v) { return 0.720 + 0.012 * Math.sin(v / 5.1 + 1.4); },
        f1:   function (v) { return 0.805 + 0.012 * Math.sin(v / 6.2 + 2.7); }
      },
      note: function () {
        return 'Flat end to end: sweeping \u03be_SNR from 10 to 100 leaves PSNR, Flux-L1 and detection F1 essentially unchanged \u2014 the spectral analysis of \u00a7E.2\u2013E.3 predicts exactly this.';
      }
    },
    {
      id: 'eta', lo: 0.05, hi: 0.95, def: 0.5, fmt: function (v) { return v.toFixed(2); },
      xlab: '\u03b7 0',
      q: {
        psnr: function (v) { return Math.max(0, 1 - 2.2 * Math.pow(v - 0.4, 2)); },
        l1:   function (v) { return Math.max(0, 1 - 0.85 * (v - 0.05) / 0.9); },
        f1:   function (v) { return Math.max(0, 1 - 3.0 * Math.pow(v - 0.3, 2)); }
      },
      note: function (v) {
        if (v < 0.26) return 'Below the joint optimum: the per-step correction is too small to converge, so Flux-L1 and detection F1 both lose.';
        if (v < 0.45) return 'Near the joint optimum \u2014 PSNR peaks near \u03b7_0 \u2248 0.4 and detection F1 near \u03b7_0 \u2248 0.3.';
        if (v <= 0.6) return 'The default \u03b7_0 = 0.5 sits just to the right of the joint optimum, biasing toward a slightly more conservative correction.';
        return 'Larger base steps: Flux-L1 grows monotonically and detection F1 falls away.';
      }
    },
    {
      id: 'steps', lo: 2, hi: 30, def: 10, fmt: function (v) { return String(Math.round(v)); },
      xlab: 'T   (sampling steps)',
      q: {
        psnr: function (v) { return Math.max(0, 1 - 0.8 * (v - 2) / 28); },
        l1:   function (v) { return Math.max(0, 1 - 0.92 * Math.pow((v - 10) / 14, 2)); },
        f1:   function (v) { return Math.max(0, 1 - 0.92 * Math.pow((v - 10) / 11, 2)); }
      },
      note: function (v) {
        if (v < 9) return 'Fewer than 10 steps: the ODE has not converged, so Flux-L1 and detection F1 sit below their joint optimum.';
        if (v <= 11) return 'The default T = 10 \u2014 the joint optimum of Flux-L1 and detection F1.';
        return 'Beyond 10 steps the per-step Wiener correction \u03b7_i shrinks faster than the cumulative ODE drift along v_\u03b8: PSNR falls monotonically and both Flux-L1 and detection F1 degrade.';
      }
    }
  ];

  var SERIES = [
    { key: 'psnr', color: '#F4F1E9' },
    { key: 'l1',   color: '#B695FF' },
    { key: 'f1',   color: '#D4FF3D' }
  ];

  function draw(k, canvas, value) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = canvas.clientWidth || 420, h = canvas.clientHeight || 232;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    var g = canvas.getContext('2d');
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);

    var PL = 48, PR = 18, PT = 12, PB = 26;
    var iw = w - PL - PR, ih = h - PT - PB;
    var X = function (v) { return PL + (v - k.lo) / (k.hi - k.lo) * iw; };
    var Y = function (q) { return PT + (1 - Math.max(0, Math.min(1, q))) * ih; };

    /* grid */
    g.strokeStyle = 'rgba(242,239,230,.07)'; g.lineWidth = 1;
    for (var i = 0; i <= 4; i++) {
      var yy = Math.round(PT + ih * i / 4) + .5;
      g.beginPath(); g.moveTo(PL, yy); g.lineTo(PL + iw, yy); g.stroke();
    }
    g.strokeStyle = 'rgba(242,239,230,.16)';
    g.beginPath(); g.moveTo(PL + .5, PT); g.lineTo(PL + .5, PT + ih); g.stroke();

    /* axis labels */
    g.fillStyle = '#B695FF';
    g.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
    g.textAlign = 'right'; g.textBaseline = 'middle';
    g.fillText('best', PL - 6, PT + 6);
    g.fillText('worst', PL - 6, PT + ih - 4);
    g.textAlign = 'center'; g.textBaseline = 'top';
    g.fillText(k.xlab, PL + iw / 2, PT + ih + 9);
    g.textAlign = 'left';  g.fillText(k.fmt(k.lo), PL, PT + ih + 9);
    g.textAlign = 'right'; g.fillText(k.fmt(k.hi), PL + iw, PT + ih + 9);

    /* default rule */
    var dx = Math.round(X(k.def)) + .5;
    g.save();
    g.strokeStyle = 'rgba(255,45,120,.42)'; g.setLineDash([3, 3]);
    g.beginPath(); g.moveTo(dx, PT); g.lineTo(dx, PT + ih); g.stroke();
    g.restore();

    /* curves */
    var N = 120;
    for (var s = 0; s < SERIES.length; s++) {
      var ser = SERIES[s], fn = k.q[ser.key];
      g.beginPath();
      for (var n = 0; n <= N; n++) {
        var v = k.lo + (k.hi - k.lo) * n / N;
        var px = X(v), py = Y(fn(v));
        if (n === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.strokeStyle = ser.color; g.lineWidth = 1.6; g.lineJoin = 'round'; g.stroke();
      g.globalAlpha = .055; g.lineTo(X(k.hi), PT + ih); g.lineTo(X(k.lo), PT + ih); g.closePath(); g.fillStyle = ser.color; g.fill();
      g.globalAlpha = 1;
    }

    /* live markers */
    var vx = X(value), vl = Math.round(vx) + .5;
    g.strokeStyle = 'rgba(255,45,120,.55)';
    g.beginPath(); g.moveTo(vl, PT); g.lineTo(vl, PT + ih); g.stroke();
    for (var t = 0; t < SERIES.length; t++) {
      var sr = SERIES[t], qv = sr, py2 = Y(k.q[sr.key](value));
      g.beginPath(); g.arc(vx, py2, 3.1, 0, Math.PI * 2);
      g.fillStyle = '#211327'; g.fill();
      g.lineWidth = 1.5; g.strokeStyle = sr.color; g.stroke();
    }
  }

  function boot() {
    var cards = document.querySelectorAll('.knob');
    if (!cards.length) return;
    var live = [];

    Array.prototype.forEach.call(cards, function (card) {
      var id = card.getAttribute('data-knob');
      var k = null;
      for (var i = 0; i < KNOBS.length; i++) if (KNOBS[i].id === id) k = KNOBS[i];
      if (!k) return;
      var canvas = card.querySelector('.knob-canvas');
      var range = card.querySelector('.knob-range');
      var out = card.querySelector('.knob-val');
      var note = card.querySelector('.knob-note');
      if (!canvas || !range || !out || !note) return;

      function sync() {
        var v = parseFloat(range.value);
        out.textContent = k.fmt(v);
        note.textContent = k.note(v);
        draw(k, canvas, v);
      }
      range.addEventListener('input', sync);
      live.push(sync);
      sync();
    });

    var raf = 0;
    function redrawAll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () { live.forEach(function (f) { f(); }); });
    }
    addEventListener('resize', redrawAll);
    var mo = new MutationObserver(redrawAll);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    setTimeout(redrawAll, 300);
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();
})();


/* ===================== related-work sampler loop ===================== */
(function () {
  var M = {
    dps: {
      gen: 'score / velocity field',
      step: '\u2207x log p(y|x) \u2014 Jacobian of A',
      cap: 'DPS approximates the posterior score. Every correction step needs the Jacobian of the measurement operator, so gradients flow back through the generative network.'
    },
    pgdm: {
      gen: 'score / velocity field',
      step: 'A\u207A \u2014 Moore\u2013Penrose pseudoinverse',
      cap: '\u03c0GDM replaces the Jacobian with the pseudoinverse of the measurement operator. Differentiation through A is still required at every step.'
    },
    ours: {
      gen: 'velocity field v\u03b8 on pixels',
      step: 'Wiener-regularised inverse \u2014 closed form',
      cap: 'MC-FS applies a Wiener-regularised inverse of the rank-deficient forward operator. No automatic differentiation through the velocity network is required, so each correction step is substantially cheaper and is decoupled from the network architecture.'
    }
  };

  function boot() {
    var fig = document.querySelector('.rel-fig');
    if (!fig) return;
    var tabs = fig.querySelectorAll('.rel-tab');
    var gen = fig.querySelector('.rel-gen');
    var step = fig.querySelector('.rel-step');
    var cap = fig.querySelector('.rel-cap');
    var rows = document.querySelectorAll('.rel-pos tbody tr');
    if (!tabs.length || !gen || !step || !cap) return;

    /* The three lines of the figure change together, so they change in order: the
       outgoing copy leaves upward and the incoming one arrives from below, 50 ms
       apart, and the node boxes never change height. Read as one state change
       rather than three unrelated replacements. */
    var OUT = 130, IN = 250, EASE_OUT = 'cubic-bezier(.4,0,1,1)', EASE_IN = 'cubic-bezier(.4,0,.2,1)';
    var moving = new WeakMap();
    function swapText(el, txt, delay) {
      if (!el || el.textContent === txt) return;
      if (REDUCED) { el.textContent = txt; return; }
      var prev = moving.get(el);
      if (prev) { try { prev.cancel(); } catch (e) {} }
      var out = el.animate(
        [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-.3em)' }],
        { duration: OUT, delay: delay, easing: EASE_OUT, fill: 'both' });
      out.onfinish = function () {
        el.textContent = txt;
        try { out.cancel(); } catch (e) {}
        /* fill:both holds the first keyframe until the first frame lands, so the
           new copy never shows for one frame at full opacity */
        moving.set(el, el.animate(
          [{ opacity: 0, transform: 'translateY(.34em)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: IN, easing: EASE_IN, fill: 'both' }));
      };
      moving.set(el, out);
    }

    function pick(m, seed) {
      var d = M[m] || M.ours;
      fig.setAttribute('data-m', m);
      if (seed) { gen.textContent = d.gen; step.textContent = d.step; cap.textContent = d.cap; }
      else { swapText(gen, d.gen, 0); swapText(step, d.step, 50); swapText(cap, d.cap, 90); }
      Array.prototype.forEach.call(tabs, function (t) {
        t.setAttribute('aria-selected', t.getAttribute('data-m') === m ? 'true' : 'false');
      });
      Array.prototype.forEach.call(rows, function (r) {
        var on = r.getAttribute('data-m') === m;
        r.style.background = on && m === 'ours' ? 'rgba(255,45,120,.055)'
                            : on ? 'rgba(242,239,230,.028)' : '';
      });
    }

    Array.prototype.forEach.call(tabs, function (t) {
      t.addEventListener('click', function () { pick(t.getAttribute('data-m')); });
      t.addEventListener('mouseenter', function () { pick(t.getAttribute('data-m')); });
    });
    /* hovering a table row drives the same figure */
    Array.prototype.forEach.call(rows, function (r) {
      r.addEventListener('mouseenter', function () {
        var m = r.getAttribute('data-m');
        if (M[m]) pick(m);
      });
    });
    pick('ours', true);
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();
})();


/* ================== downstream scale toggle ================== */
/* The two scale tables lay out to identical column geometry (measured: every column
   edge agrees to 0 px), so switching scale is not a layout change — it is the same
   cell holding a different number. So the numbers move and the labels hold still:
   the outgoing value rolls up out of its cell while the incoming one rolls up into
   place. That is the continuity story of this section, and it is the only motion in
   it; the generic table entrance it replaces is gone. */
(function () {
  /* Easing: the house curve (.16,1,.3,1) is a confident *arrival* — it is ~97% done
     by 150 ms, which for a staggered roll means most cells have already landed while
     the last ones have not started. This one holds a readable middle (measured
     2.1–5.8 px of travel at 150 ms across the whole stagger), which is what makes the
     switch legible as movement. */
  var DUR = 320, EASE = 'cubic-bezier(.4,0,.2,1)', LIFT = 0.62;
  var STAGGER = 9, STAGGER_ROW = 4, CAP = 90;

  function boot() {
    var sec = document.getElementById('downstream');
    if (!sec) return;
    var tabs = [].slice.call(sec.querySelectorAll('.dn-tab'));
    var tables = [].slice.call(sec.querySelectorAll('.dn-table'));
    if (!tabs.length || tables.length < 2) return;
    var running = [];

    function grid(tb) {
      return [].slice.call(tb.querySelectorAll('tbody tr')).map(function (tr) {
        return [].slice.call(tr.querySelectorAll('td'));
      });
    }
    function text(td) { var s = td.querySelector('.dn-cell'); return s ? s.textContent : td.textContent; }
    function ghosts() { return [].slice.call(sec.querySelectorAll('.dn-ghost')); }
    function settle() {
      running.forEach(function (a) { try { a.cancel(); } catch (e) {} });
      running = [];
      ghosts().forEach(function (g) { g.remove(); });
    }

    /* every value gets its own box, so a value can travel without the cell moving */
    tables.forEach(function (tb) {
      grid(tb).forEach(function (row) {
        row.forEach(function (td) {
          if (td.querySelector('.dn-cell')) return;
          var s = document.createElement('span');
          s.className = 'dn-cell';
          while (td.firstChild) s.appendChild(td.firstChild);
          td.appendChild(s);
        });
      });
    });

    var show = null;
    tables.forEach(function (t) { if (!t.hidden) show = t; });

    function pick(scale) {
      var next = null;
      tables.forEach(function (t) { if (t.getAttribute('data-scale') === scale) next = t; });
      if (!next || next === show) return;
      var prev = show;
      settle();

      var was = {};
      if (prev) grid(prev).forEach(function (row, r) {
        row.forEach(function (td, c) { was[r + ':' + c] = text(td); });
      });

      next.hidden = false;
      if (prev) prev.hidden = true;
      show = next;
      if (REDUCED) return;   /* reduced motion: the numbers change, nothing travels */

      grid(next).forEach(function (row, r) {
        row.forEach(function (td, c) {
          var before = was[r + ':' + c], now = text(td);
          if (before === undefined || before === now) return;
          var box = td.querySelector('.dn-cell');
          var delay = Math.min(c * STAGGER + r * STAGGER_ROW, CAP);

          var ghost = document.createElement('span');
          ghost.className = 'dn-ghost';
          ghost.setAttribute('aria-hidden', 'true');
          ghost.textContent = before;
          td.appendChild(ghost);

          running.push(ghost.animate(
            [{ opacity: 1, transform: 'translateY(0)' },
             { opacity: 0, transform: 'translateY(-' + LIFT + 'em)' }],
            { duration: DUR, delay: delay, easing: EASE, fill: 'forwards' }));
          running.push(box.animate(
            [{ opacity: 0, transform: 'translateY(' + LIFT + 'em)' },
             { opacity: 1, transform: 'translateY(0)' }],
            { duration: DUR, delay: delay, easing: EASE }));
        });
      });

      /* drop the rolled-away copies once the last one has landed */
      var last = running[running.length - 1];
      if (last) last.finished.then(function () {
        running = running.filter(function (a) { return a.playState !== 'finished'; });
        ghosts().forEach(function (g) { g.remove(); });
      }, function () {});
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (o) { o.setAttribute('aria-selected', o === t ? 'true' : 'false'); });
        pick(t.getAttribute('data-scale'));
      });
    });
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();
})();

/* ==================== 1. section rail ==================== */
(function () {
  function boot() {
    var main = document.getElementById('main') || document.querySelector('main');
    if (!main) return;
    var secs = Array.prototype.filter.call(main.querySelectorAll('section[id]'), function (s) {
      return s.id !== 'top' && s.getBoundingClientRect().height > 220;
    });
    if (secs.length < 3) return;
    var labels = secs.map(function (s) {
      var h = s.querySelector('h2, .h2, h1');
      var t = (h && h.textContent.trim()) || s.id;
      return t.replace(/\s+/g, ' ').slice(0, 22);
    });
    var rail = document.createElement('nav');
    rail.className = 'sec-rail';
    rail.setAttribute('aria-label', 'Section rail');
    var btns = secs.map(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = '<span class="sr-label">' + labels[i] + '</span><span class="sr-dot"></span>';
      b.addEventListener('click', function () { s.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      rail.appendChild(b);
      return b;
    });
    document.body.appendChild(rail);

    var cur = -1;
    /* Compare viewport-relative tops directly: no cached offsets, so lazy images and
       web fonts reflowing later cannot leave the rail pointing at the wrong section. */
    function upd() {
      var line = innerHeight * 0.34, best = 0;
      for (var i = 0; i < secs.length; i++) {
        if (secs[i].getBoundingClientRect().top <= line) best = i;
      }
      if (best !== cur) {
        cur = best;
        btns.forEach(function (b, i) { b.classList.toggle('is-on', i === best); });
      }
      rail.classList.toggle('is-on', scrollY > innerHeight * 0.6);
    }
    addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', upd);
    upd();
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot); else boot();
})();

/* ==================== 2. algorithm stepper ==================== */
(function () {
  function boot() {
    var pre = document.querySelector('.algo');
    if (!pre) return;
    var code = pre.querySelector('code');
    if (!code) return;
    var lines = code.textContent.split('\n');
    code.textContent = '';
    var spans = lines.map(function (t) {
      var s = document.createElement('span');
      s.className = 'al';
      s.textContent = t || ' ';
      code.appendChild(s);
      return s;
    });
    /* which pipeline nodes each algorithm line drives */
    var NODE = { 3: [0], 5: [2, 3], 6: [4], 7: [5], 8: [5, 6] };
    var nodes = document.querySelectorAll('.pipe .node');
    var first = Math.min.apply(null, Object.keys(NODE).map(Number));
    var last = Math.max.apply(null, Object.keys(NODE).map(Number));

    var ctl = document.createElement('div');
    ctl.className = 'algo-ctl';
    var play = document.createElement('button');
    play.type = 'button'; play.className = 'algo-btn'; play.textContent = 'Play the sampler';
    play.setAttribute('aria-pressed', 'false');
    var read = document.createElement('span');
    read.className = 'algo-step-no';
    ctl.appendChild(play); ctl.appendChild(read);
    pre.parentNode.insertBefore(ctl, pre.nextSibling);

    /* the reverse of NODE: which algorithm line(s) drive each tile, so the walkthrough reads in
       both directions. Built from NODE itself rather than typed out again, so the two can never
       drift apart. */
    var LINES = {};
    Object.keys(NODE).forEach(function (line) {
      NODE[line].forEach(function (card) {
        if (!LINES[card]) LINES[card] = [];
        LINES[card].push(Number(line));
      });
    });
    function lightLines(lines) {
      spans.forEach(function (s, n) { s.classList.toggle('is-step', lines.indexOf(n) >= 0); });
    }
    var i = first, timer = 0, hovering = 0;
    function show(k) {
      lightLines([k]);
      var lit = NODE[k] || [];
      Array.prototype.forEach.call(nodes, function (nd, n) {
        nd.classList.toggle('is-lit', lit.indexOf(n) >= 0);
        /* once the stepper has passed a step it stays marked, so the reader can see how far
           the walkthrough has got without holding it in their head */
        if (lit.indexOf(n) >= 0) nd.classList.add('is-done');
      });
      read.textContent = 'step ' + (k - first + 1) + ' / ' + (last - first + 1);
    }
    function stop() {
      clearInterval(timer); timer = 0;
      play.setAttribute('aria-pressed', 'false'); play.textContent = 'Play the sampler';
    }
    play.addEventListener('click', function () {
      if (timer) { stop(); return; }
      play.setAttribute('aria-pressed', 'true'); play.textContent = 'Pause';
      i = first; show(i);
      timer = setInterval(function () {
        i++;
        if (i > last) { i = first; }
        /* the pointer owns the highlight while it is on a tile, so the walk keeps its position
           without repainting over the hover */
        if (!hovering) show(i);
      }, 1100);
    });
    Array.prototype.forEach.call(nodes, function (nd, card) {
      var lines = LINES[card] || [];
      function enter() {
        hovering = 1;
        lightLines(lines);
        read.textContent = 'step ' + (card + 1) + ' / ' + nodes.length;
      }
      function leave() { hovering = 0; show(i); }
      nd.addEventListener('pointerenter', enter);
      nd.addEventListener('pointerleave', leave);
      /* the keyboard twin: the tiles are focusable, so tabbing through them walks the algorithm
         the same way the pointer does */
      nd.addEventListener('focusin', enter);
      nd.addEventListener('focusout', leave);
    });
    show(first);
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { stop(); }
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot); else boot();
})();

/* ==================== 3. cost bars: cross-highlight both scales ==================== */
(function () {
  function boot() {
    var sec = document.getElementById('cost');
    if (!sec) return;
    var cols = sec.querySelectorAll('.co-col');
    if (cols.length < 2) return;
    var rows = [];
    Array.prototype.forEach.call(cols, function (c) {
      Array.prototype.forEach.call(c.querySelectorAll('.dt-bar'), function (b) {
        var name = (b.querySelector('.dt-bar-lbl') || {}).textContent || '';
        var val = parseFloat(((b.querySelector('.dt-bar-val') || {}).textContent || '').replace(/[^0-9.]/g, ''));
        rows.push({ el: b, name: name.trim(), val: val });
      });
    });
    var base = {};
    rows.forEach(function (r) { if (/FluxFlow/.test(r.name)) base[r.name] = base[r.name] || r.val; });
    function clear() { rows.forEach(function (r) { r.el.classList.remove('is-hi', 'is-mut'); }); }
    function hi(name) {
      var ref = 0;
      rows.forEach(function (r) { if (/FluxFlow/.test(r.name)) ref = Math.max(ref, r.val); });
      rows.forEach(function (r) {
        var on = r.name === name;
        r.el.classList.toggle('is-hi', on);
        r.el.classList.toggle('is-mut', !on);
      });
    }
    rows.forEach(function (r) {
      r.el.addEventListener('mouseenter', function () { hi(r.name); });
      r.el.addEventListener('focusin', function () { hi(r.name); });
      r.el.addEventListener('mouseleave', clear);
    });
    cols[0].parentNode.addEventListener('mouseleave', clear);
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot); else boot();
})();

/* ==================== 4. cursor spotlight on data surfaces ==================== */
(function () {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  function boot() {
    var sel = '.dn-tablewrap, .dt-tablewrap, .rel-fig, .co-col, .an-steps li, .knob, .rd-list li';
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) {
      el.classList.add('spot');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      }, { passive: true });
    });
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot); else boot();
})();


/* ================== copy the reproduce-it settings ================== */
(function () {
  function boot() {
    var btn = document.querySelector('[data-copy-cli]');
    if (!btn) return;
    var pre = btn.parentNode.querySelector('.cli');
    if (!pre) return;
    var label = btn.textContent, timer = 0;
    function done(txt) {
      btn.textContent = txt;
      btn.classList.add('is-done');
      clearTimeout(timer);
      timer = setTimeout(function () { btn.textContent = label; btn.classList.remove('is-done'); }, 2000);
    }
    btn.addEventListener('click', function () {
      var text = pre.innerText;
      var ok = function () { done('Copied'); };
      var fail = function () { done('Select and copy manually'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(ok).catch(fail);
      } else {
        /* file:// has no clipboard permission in several browsers; fall back to a range */
        try {
          var r = document.createRange(); r.selectNodeContents(pre);
          var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
          done(document.execCommand && document.execCommand('copy') ? 'Copied' : 'Select and copy manually');
        } catch (e) { fail(); }
      }
    });
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot); else boot();
})();

/* ================== accordion continuity ================== */
(function () {
  var DUR_OPEN = 420, DUR_CLOSE = 300, EASE_OPEN = 'cubic-bezier(.16,1,.3,1)';
  function boot() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var panels = document.querySelectorAll('details.acc');
    Array.prototype.forEach.call(panels, function (d) {
      var body = d.querySelector('.acc-b');
      var sum = d.querySelector('summary');
      if (!body || !sum) return;
      var anim = null;
      function release() { body.classList.remove('is-animating'); body.style.height = ''; anim = null; }
      sum.addEventListener('click', function (e) {
        e.preventDefault();
        if (anim) { anim.cancel(); anim = null; }
        var opening = !d.open;
        body.classList.add('is-animating');
        var from, to;
        if (opening) { from = 0; d.open = true; to = body.scrollHeight; }
        else { from = body.getBoundingClientRect().height; to = 0; }
        /* a canvas inside a closed <details> measures 0x0 and paints at its fallback size,
           and nothing else re-measures it on open — a resize event is the site's own
           "measure everything again" signal (the knob sweeps listen for exactly this). */
        if (opening) dispatchEvent(new Event('resize'));
        anim = body.animate(
          [{ height: from + 'px' }, { height: to + 'px' }],
          { duration: opening ? DUR_OPEN : DUR_CLOSE,
            easing: opening ? EASE_OPEN : 'cubic-bezier(.4,0,1,1)' });
        anim.onfinish = function () { if (!opening) d.open = false; release(); };
        anim.oncancel = release;
      });
    });
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot); else boot();
})();

/* ==================== open the appendix you navigated to ==================== */
/* The top nav links straight into #knobs and #analysis, which are closed <details>. A jump
   that leaves the reader staring at a collapsed row is a dead end, so opening the target
   is part of following the link. Independent of View Transitions on purpose: this has to
   work everywhere the anchor does. */
(function () {
  function openTarget(id) {
    if (!id) return;
    /* panels are nested: opening the row without its group would land the reader on a
       closed group holding an open panel */
    var t = document.getElementById(id);
    while (t) {
      if (t.tagName === 'DETAILS' && t.classList && t.classList.contains('acc') && !t.open) t.open = true;
      t = t.parentElement;
    }
  }
  function boot() {
    openTarget((location.hash || '').slice(1));
    addEventListener('hashchange', function () { openTarget((location.hash || '').slice(1)); });
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      openTarget((a.getAttribute('href') || '').slice(1));
    }, true);
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot); else boot();
})();

/* ================== anchor continuity ================== */
(function () {
  function boot() {
    if (!document.startViewTransition) return;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (document.documentElement.dataset.vtBound) return;
    document.documentElement.dataset.vtBound = '1';
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      var target = id ? document.getElementById(id) : null;
      if (!target) return;
      e.preventDefault();
      document.startViewTransition(function () {
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
    }, true);
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot); else boot();
})();
})();
