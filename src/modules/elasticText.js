/* ============================================================
   ELASTIC TEXT — grab a letter and the whole word stretches after it,
   with neighbours trailing by a geometric falloff, then snaps back on
   a bouncy spring.

   Three deliberate departures from the reference component:

   · Pointer devices only. The original sets touch-action:none on every
     letter, which on a phone turns a headline into a dead zone you
     cannot scroll past. A playful flourish is not worth trapping the
     scroll, so touch gets the plain headline.

   · The headline lines live inside overflow:hidden masks (that is how
     their reveal works), which would clip letters the moment you
     dragged them off the baseline. The mask is opened only for the
     duration of an actual drag and closed again once everything has
     settled, so the reveal still masks correctly on scroll-back.

   · No framer-motion: the dragged letter is written directly and its
     neighbours lerp toward their targets in one shared rAF, then GSAP's
     elastic ease does the release.
   ============================================================ */

import { gsap } from 'gsap';

const FOLLOW = 0.5;      // neighbour at distance d moves FOLLOW^d as far
const NEIGHBOUR_LERP = 0.3;

export function initElasticText({ reduced } = {}) {
  if (reduced) return;
  // touch and hybrid devices keep a normal, scrollable headline
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.querySelectorAll('[data-elastic]').forEach(setup);
}

function setup(root) {
  /* Each masked line becomes its own chain — a letter never drags letters
     on another line, matching the reference's newline rule. */
  const lines = [...root.querySelectorAll('.line > span')].map((holder) => {
    const text = holder.textContent;
    holder.textContent = '';

    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    holder.appendChild(sr);

    const letters = [];
    for (const ch of text) {
      const span = document.createElement('span');
      span.className = 'el-char';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = ch === ' ' ? ' ' : ch;
      holder.appendChild(span);
      letters.push({
        el: span, x: 0, y: 0, tx: 0, ty: 0, bx: 0, by: 0,
        setX: gsap.quickSetter(span, 'x', 'px'),
        setY: gsap.quickSetter(span, 'y', 'px'),
      });
    }
    return letters;
  });

  if (!lines.length) return;

  let active = null;      // { line, index }
  let origin = { x: 0, y: 0 };
  let raf = 0;

  const settle = () => {
    root.classList.remove('is-grabbed');
  };

  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!active) return;
    const { line, index } = active;
    for (let i = 0; i < line.length; i++) {
      const L = line[i];
      if (i === index) { L.x = L.tx; L.y = L.ty; }
      else {
        L.x += (L.tx - L.x) * NEIGHBOUR_LERP;
        L.y += (L.ty - L.y) * NEIGHBOUR_LERP;
      }
      L.setX(L.x); L.setY(L.y);
    }
  };

  const onMove = (e) => {
    if (!active) return;
    const { line, index } = active;
    const dx = e.clientX - origin.x;
    const dy = e.clientY - origin.y;
    for (let i = 0; i < line.length; i++) {
      const k = Math.pow(FOLLOW, Math.abs(i - index));
      // relative to where the letter was when grabbed, so catching one
      // mid-spring does not snap it back to the baseline first
      line[i].tx = line[i].bx + dx * k;
      line[i].ty = line[i].by + dy * k;
    }
  };

  const onUp = () => {
    if (!active) return;
    const { line } = active;
    active = null;
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);

    gsap.to(line, {
      x: 0, y: 0, tx: 0, ty: 0,
      duration: 1.1,
      ease: 'elastic.out(1, 0.42)',
      stagger: { each: 0.012, from: 'center' },
      onUpdate() { line.forEach((L) => { L.setX(L.x); L.setY(L.y); }); },
      // the mask stays open until the last letter is home, then clips again
      onComplete: settle,
    });
  };

  lines.forEach((line) => {
    line.forEach((L, index) => {
      L.el.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        gsap.killTweensOf(line);
        root.classList.add('is-grabbed');
        active = { line, index };
        origin = { x: e.clientX, y: e.clientY };
        line.forEach((o) => { o.bx = o.x; o.by = o.y; o.tx = o.x; o.ty = o.y; });
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(tick);
      });
    });
  });
}
