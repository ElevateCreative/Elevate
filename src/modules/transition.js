/* ============================================================
   PAGE TRANSITION — the kinetic word curtain
   ------------------------------------------------------------
   The studio page and the case-study gallery are two real documents, not two
   routes of an app, so the join between them has to be built across a navigation
   rather than inside one. It runs in two halves and the browser's own load sits
   in the gap:

     OUT (this document, ~0.75s)  the page fades away while a grid of one repeated
                                  word wipes IN, row by row, filling the screen.
     ── navigation ──             the curtain is opaque, so the swap is unseen.
     IN  (next document, ~1.1s)   the grid wipes back OUT, leaving a single centred
                                  word, which lifts away as the new page rises in.

   The handoff is one sessionStorage entry written just before location.href, read
   synchronously on the other side. sessionStorage (not local) so the curtain can
   never be resurrected by a bookmark or a second tab, and it is cleared the moment
   it is read — a refresh mid-animation lands on an ordinary page load.

   Nothing here is required for the destination to work: with JS off, reduced motion,
   or a direct hit on the URL, the links are plain links and the pages are plain pages.
   ============================================================ */

import { gsap } from 'gsap';

const KEY = 'elevate-xfade';

/* Odd counts on both axes so the grid has an exact geometric centre — that centre
   word is the one that survives the wipe and carries the eye across the navigation. */
const ROWS = 5;
const PER_ROW = 5;
const CENTRE_ROW = (ROWS - 1) / 2;
const CENTRE_WORD = (PER_ROW - 1) / 2;

const HIDDEN_LTR = 'inset(0% 0% 0% 100%)';
const HIDDEN_RTL = 'inset(0% 100% 0% 0%)';
const VISIBLE = 'inset(0% 0% 0% 0%)';

const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
  document.documentElement.classList.contains('a11y-no-motion');

/* Builds the curtain. Every row drifts sideways at its own speed and direction, so the
   grid is never a flat aligned block — that stagger is what makes it read as motion
   rather than as a screen of text. */
function buildCurtain(word) {
  const el = document.createElement('div');
  el.className = 'xfade';
  el.setAttribute('aria-hidden', 'true');

  const grid = document.createElement('div');
  grid.className = 'xfade__grid';
  el.appendChild(grid);

  const rows = [];
  for (let r = 0; r < ROWS; r++) {
    const row = document.createElement('div');
    row.className = 'xfade__row';
    const dir = r % 2 === 0 ? 1 : -1;
    const speed = 0.7 + (Math.abs(r - CENTRE_ROW) % 3) * 0.45;
    const words = [];
    for (let w = 0; w < PER_ROW; w++) {
      const span = document.createElement('span');
      span.className = 'xfade__word';
      span.textContent = word;
      if (r === CENTRE_ROW && w === CENTRE_WORD) span.classList.add('is-centre');
      row.appendChild(span);
      words.push(span);
    }
    grid.appendChild(row);
    rows.push({ el: row, words, drift: dir * 90 * speed, ltr: r % 2 === 0 });
  }
  document.body.appendChild(el);
  return { el, grid, rows };
}

/* The words of one row wipe in sequence from the row's own leading edge, so the fill
   sweeps across the screen instead of every word appearing at once. */
function wipe(curtain, tl, { to, at, duration, stagger }) {
  curtain.rows.forEach((row) => {
    const hidden = row.ltr ? HIDDEN_LTR : HIDDEN_RTL;
    row.words.forEach((wordEl, i) => {
      if (wordEl.classList.contains('is-centre') && to === 'hidden') return; // the survivor
      const order = row.ltr ? i : PER_ROW - 1 - i;
      tl.to(wordEl, {
        clipPath: to === 'hidden' ? hidden : VISIBLE,
        duration,
        ease: 'power2.inOut',
      }, at + order * stagger);
    });
  });
}

function fadeTargets() {
  return [...document.querySelectorAll('main, .nav, .dock, .a11y, .altimeter, .mark, .aura, .orbits, .mprogress, .mdots, .takeover, .grain, .passwords')];
}

/* ---------- half one: leaving ---------- */
function leave(href, word) {
  const curtain = buildCurtain(word);
  const hiddenFor = (row) => (row.ltr ? HIDDEN_LTR : HIDDEN_RTL);
  curtain.rows.forEach((row) => {
    gsap.set(row.el, { x: row.drift * 0.4 });
    gsap.set(row.words, { clipPath: hiddenFor(row) });
  });
  gsap.set(curtain.grid, { scale: 1.14 });

  const tl = gsap.timeline({
    onComplete: () => {
      try { sessionStorage.setItem(KEY, word); } catch { /* private mode → the next page just loads plainly */ }
      location.href = href;
    },
  });
  tl.to(curtain.el, { autoAlpha: 1, duration: 0.28, ease: 'power1.out' }, 0)
    .to(fadeTargets(), { autoAlpha: 0, duration: 0.42, ease: 'power2.in' }, 0)
    .to(curtain.grid, { scale: 1, duration: 0.75, ease: 'power2.out' }, 0.05);
  curtain.rows.forEach((row) => tl.to(row.el, { x: row.drift, duration: 0.75, ease: 'power2.out' }, 0.05));
  wipe(curtain, tl, { to: 'visible', at: 0.1, duration: 0.34, stagger: 0.055 });
  /* A short beat at full so the word is actually read, and so a fast connection does not
     cut the curtain off mid-wipe. */
  tl.to({}, { duration: 0.18 });
}

/* ---------- half two: arriving ---------- */
function arrive(word) {
  const curtain = buildCurtain(word);
  gsap.set(curtain.el, { autoAlpha: 1 });
  gsap.set(curtain.grid, { scale: 1 });
  curtain.rows.forEach((row) => gsap.set(row.el, { x: row.drift }));

  const tl = gsap.timeline({
    onComplete: () => curtain.el.remove(),
  });
  wipe(curtain, tl, { to: 'hidden', at: 0, duration: 0.3, stagger: 0.05 });
  /* everything that is not the survivor is gone by ~0.5s; the survivor then recentres */
  curtain.rows.forEach((row) => tl.to(row.el, { x: 0, duration: 0.5, ease: 'power3.inOut' }, 0.34));
  tl.to('.xfade__word.is-centre', { scale: 1.12, duration: 0.5, ease: 'power2.out' }, 0.34)
    .to('.xfade__word.is-centre', { autoAlpha: 0, scale: 1.5, duration: 0.42, ease: 'power2.in' }, 0.9)
    .to(curtain.el, { autoAlpha: 0, duration: 0.42, ease: 'power2.inOut' }, 0.96);
  return tl;
}

/* ============================================================
   Public API
   ============================================================ */

/* Wires every `<a data-xfade>` on the page. The word shown is the link's own
   `data-xfade-word`, which is why leaving for the gallery and coming back read as two
   different moments rather than one effect played twice. */
export function initPageTransition() {
  if (prefersReduced()) return;

  document.querySelectorAll('a[data-xfade]').forEach((a) => {
    a.addEventListener('click', (e) => {
      // let the browser have every navigation that is not a plain left-click
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const href = a.getAttribute('href');
      if (!href || a.target === '_blank') return;
      e.preventDefault();
      document.body.classList.add('is-leaving');
      leave(href, a.dataset.xfadeWord || '');
    });
  });

  /* iOS keeps the outgoing document alive in the page cache, so coming Back lands on a
     page still wearing the curtain and still faded out. Put it all back. */
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    document.body.classList.remove('is-leaving');
    document.querySelector('.xfade')?.remove();
    gsap.set(fadeTargets(), { clearProps: 'opacity,visibility' });
  });
}

/* Called at the top of a destination page, BEFORE its own intro. Returns a promise that
   settles when the curtain is out of the way (immediately, on a direct visit). */
export function consumeIncomingTransition() {
  let word = null;
  try {
    word = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY); // read once: a refresh is an ordinary load
  } catch { /* no storage → ordinary load */ }

  if (!word || prefersReduced()) return Promise.resolve(false);

  return new Promise((resolve) => {
    arrive(word);
    // hand the page back at the point the curtain starts clearing, so the page's own
    // intro plays THROUGH the fade rather than politely after it
    gsap.delayedCall(0.95, () => resolve(true));
  });
}
