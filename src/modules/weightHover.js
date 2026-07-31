/* ============================================================
   WEIGHT RIPPLE — letters thicken one after another, riding the `wght`
   axis of the variable fonts we now self-host. Works on the Hebrew copy
   as well as the Latin, since Heebo ships the same axis.

   Two ways to set it off, attached independently rather than as an
   either/or: a pointer entering the element, and — for the service
   rows — that row becoming the one at the viewport centre, which is
   how the effect reaches a phone where nothing can hover.

   Notes on the port:
   · No framer-motion. One GSAP tween over an array of plain state
     objects drives every letter, and a single onUpdate writes the
     styles — so a ten-letter label costs one tween, not ten.
   · The resting weight is read from the element's own computed style
     instead of being hard-coded, because font-variation-settings
     overrides font-weight: hard-coding 400 would visibly *thin* the
     500-weight headings the moment you touched them.
   · Only ever applied to short labels. Changing weight changes glyph
     advance, so the line reflows while it animates — fine for a nav
     item or a service title, wrong for a paragraph.
   · The per-letter spans are plain `inline` (see .wgt in the CSS).
     This is load-bearing on a Hebrew page: as inline-block they would
     each become an atomic inline, which reverses embedded Latin runs
     and lets lines break in the middle of a word.
   ============================================================ */

import { gsap } from 'gsap';

const FROM_MAP = { first: 'start', last: 'end', center: 'center', random: 'random' };

function splitLetters(el) {
  const text = el.textContent;
  const letters = [];
  el.textContent = '';

  // the real string stays in the tree for screen readers and for copy/paste
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = text;
  el.appendChild(sr);

  for (const ch of text) {
    if (ch === ' ' || ch === ' ') { el.appendChild(document.createTextNode(ch)); continue; }
    const span = document.createElement('span');
    span.className = 'wgt';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = ch;
    el.appendChild(span);
    letters.push(span);
  }
  return letters;
}

export function initWeightHover({ reduced } = {}) {
  if (reduced) return;

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* On touch there is nothing to hover, so the ripple is driven by scroll instead:
     main.js already marks the service row nearest the viewport centre with .is-active
     (throttled, one row at a time), so we ride that rather than adding a second scroll
     listener that would compute the same thing. Only rows that can receive .is-active
     are wired up — the nav and the dock are display:none at this width, and splitting
     hidden text would be pure waste. */
  const all = [...document.querySelectorAll('[data-weight-hover]')];
  const nodes = canHover ? all : all.filter((el) => el.closest('.service'));
  if (!nodes.length) return;

  const fitTargets = [];

  nodes.forEach((el) => {
    const base = Math.round(parseFloat(getComputedStyle(el).fontWeight)) || 400;
    const to = Math.min(900, Math.max(base + 100, Number(el.dataset.weightHover) || 900));
    const staggerFrom = FROM_MAP[el.dataset.weightFrom] || 'random';
    const each = (Number(el.dataset.weightStagger) || 26) / 1000;

    const letters = splitLetters(el);
    if (!letters.length) return;

    const state = letters.map(() => ({ w: base }));
    const paint = () => {
      for (let i = 0; i < letters.length; i++) {
        letters[i].style.fontVariationSettings = `'wght' ${state[i].w.toFixed(0)}`;
      }
    };
    paint();

    /* Heavier letters are wider, so a label that sizes to its content inside a flex
       row (the nav, the dock) would shove its neighbours sideways for the whole
       animation. Measure it at full weight once and reserve that width up front.
       Checking the PARENT is the point: a span inside a flex container is blockified,
       so its own computed display never reads as inline. Grid items are skipped —
       the service headings already sit in a sized track with room to breathe, and a
       min-width there would fight the track instead of helping. */
    const parentDisplay = el.parentElement ? getComputedStyle(el.parentElement).display : '';
    const locked = parentDisplay.includes('flex') && el.getBoundingClientRect().width > 0;
    if (locked) {
      letters.forEach((l) => { l.style.fontVariationSettings = `'wght' ${to}`; });
      const widest = el.getBoundingClientRect().width;
      paint();
      el.style.display = 'inline-block';
      el.style.minWidth = `${Math.ceil(widest)}px`;
    }

    /* A heavier weight is a WIDER weight. On a heading that already fills its column
       that pushes the last word onto a new line, so the text reflows under the
       pointer — which is what made the services list jump on hover. Walk the target
       weight down until the element keeps its original line count, and animate to
       that instead. Re-run on resize, because the display type is fluid: the same
       heading has room for 900 on a wide screen and only 650 on a narrow one. */
    let target = to;
    const fitTarget = () => {
      if (locked) return;                       // width already reserved — cannot reflow
      paint();
      const baseHeight = el.getBoundingClientRect().height;
      for (let w = to; w > base; w -= 50) {
        letters.forEach((l) => { l.style.fontVariationSettings = `'wght' ${w}`; });
        if (el.getBoundingClientRect().height <= baseHeight + 1) { target = w; paint(); return; }
      }
      target = base;                            // no weight fits without reflowing
      paint();
    };
    fitTarget();
    fitTargets.push(fitTarget);

    let tween = null;
    const run = (w) => {
      tween?.kill();
      tween = gsap.to(state, {
        w,
        duration: 0.55,
        ease: 'power2.out',
        stagger: { each, from: staggerFrom },
        onUpdate: paint,
      });
    };

    // hover lives on whatever the user actually points at, not the text node itself
    const trigger = el.closest('a, button, li, .tile, .service') || el;

    /* The two drivers are independent rather than either/or. Capability and layout do
       not agree as often as you would expect — a narrow desktop window has a real
       mouse AND runs the site's mobile path — so each driver is attached whenever its
       own precondition holds, and they simply agree when both fire. */
    if (canHover) {
      trigger.addEventListener('pointerenter', () => run(target));
      trigger.addEventListener('pointerleave', () => run(base));
      // keyboard users get it too
      trigger.addEventListener('focusin', () => run(target));
      trigger.addEventListener('focusout', () => run(base));
    }

    if (trigger.matches('.service')) {
      // main.js marks the row nearest the viewport centre; ride that for the scroll ripple
      let lit = trigger.classList.contains('is-active');
      new MutationObserver(() => {
        const now = trigger.classList.contains('is-active');
        if (now === lit) return;
        lit = now;
        run(now ? target : base);
      }).observe(trigger, { attributes: true, attributeFilter: ['class'] });
      if (lit) run(target);
    }
  });

  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => fitTargets.forEach((f) => f()), 200);
  }, { passive: true });
}
