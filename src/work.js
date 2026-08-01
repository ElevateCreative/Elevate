/* ============================================================
   /work/ — the case-study gallery
   ------------------------------------------------------------
   A second real document, sharing the studio page's stylesheet, tokens, chrome and
   every module it can. What is new here is the argument the page makes: each card
   takes one element out of a client site and shows the problem, the decision and the
   marketing logic behind it. Where a decision is about BEHAVIOUR, the card rebuilds
   that behaviour rather than screenshotting it — a hover mechanic explained in prose
   next to a still image is asking the reader to take our word for it.
   ============================================================ */

import './styles/main.css';
import './styles/work.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { initSmoothScroll } from './modules/smoothScroll.js';
import { initCursor } from './modules/cursor.js';
import { loadA11yPrefs } from './modules/a11y-prefs.js';
import { applyI18n, initLangToggle } from './modules/i18n.js';
import { initWeightHover } from './modules/weightHover.js';
import { initPageTransition, consumeIncomingTransition } from './modules/transition.js';
import { initMagnifier } from './modules/magnifier.js';
import { initBlobReveal } from './modules/blobReveal.js';
import { initFlipCards } from './modules/flipCard.js';
import { initFocusReveal, playFocusReveal } from './modules/focusReveal.js';

applyI18n();
gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || !!loadA11yPrefs().motion;
const isMobile = window.matchMedia('(max-width: 760px), (hover: none) and (pointer: coarse)').matches;

/* Same reasoning as the studio page: a deep restore replays every entrance at once
   behind an intro that is still running. Start at the top unless a #hash asked for
   something else. */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (!location.hash) window.scrollTo(0, 0);

const lenis = (reduced || isMobile) ? null : initSmoothScroll();
initCursor();
initWeightHover({ reduced });
initPageTransition();

const whenIdle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 1));
whenIdle(() => {
  import('./modules/a11y.js').then((m) => m.initA11y());
  import('./modules/readingHighlight.js').then((m) => m.initReadingHighlight({ reduced }));
});

/* ---------- anchors, dock, theme (shared chrome, same behaviour as the studio page) ---------- */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const el = id && id.length > 1 && document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { duration: 1.2 });
    else el.scrollIntoView({ behavior: 'smooth' });
  });
});

const dock = document.getElementById('dock');
const menuFab = document.getElementById('menuFab');
const dockPanel = document.getElementById('dockPanel');
function setDock(open) {
  if (!dock) return;
  dock.classList.toggle('is-open', open);
  menuFab?.setAttribute('aria-expanded', String(open));
  dockPanel?.setAttribute('aria-hidden', String(!open));
}
initLangToggle();
menuFab?.addEventListener('click', (e) => { e.stopPropagation(); setDock(!dock.classList.contains('is-open')); });
dock?.querySelectorAll('.dock__link').forEach((a) => a.addEventListener('click', () => setDock(false)));
document.addEventListener('click', (e) => { if (dock?.classList.contains('is-open') && !dock.contains(e.target)) setDock(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setDock(false); });

const root = document.documentElement;
document.getElementById('themeToggle')?.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  root.setAttribute('data-theme', next);
  localStorage.setItem('elevate-theme', next);
});

if (!reduced) {
  const cap = (v) => Math.max(-16, Math.min(16, v));
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo(cap((e.clientX - (r.left + r.width / 2)) * 0.3));
      yTo(cap((e.clientY - (r.top + r.height / 2)) * 0.3));
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

const nav = document.getElementById('nav');
ScrollTrigger.create({ start: 'top -60', end: 'max', onUpdate: (s) => nav?.classList.toggle('is-scrolled', s.scroll() > 60) });

/* ============================================================
   DEMO 1 — the three-field hero
   ------------------------------------------------------------
   A rebuild of the real mechanic, on the real geometry: four numbers say where each
   cut meets the top and the bottom edge, and every field clip, both seam lights and
   the open states are derived from those four. Hover opens a side on a pointer; on
   touch, where there is no hover, a tap does — and tapping the open side closes it,
   so a phone visitor can see both.
   ============================================================ */
function initHeroDemo() {
  const demo = document.querySelector('[data-jpdemo]');
  if (!demo) return;
  const sides = [...demo.querySelectorAll('.jpd__side')];

  const open = (name) => {
    demo.dataset.open = name || '';
    sides.forEach((s) => s.setAttribute('aria-expanded', String(s.dataset.side === name)));
  };

  sides.forEach((side) => {
    const name = side.dataset.side;
    side.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') open(name); });
    side.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') open(null); });
    side.addEventListener('click', () => open(demo.dataset.open === name ? null : name));
    side.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      open(demo.dataset.open === name ? null : name);
    });
  });
  demo.addEventListener('pointerleave', () => open(null));

  /* On a phone the hint would be wrong — nothing to hover with. Swap the wording, and
     open one side once when the demo first comes into view so it is never seen dead. */
  if (isMobile) {
    demo.classList.add('is-touch');
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        obs.disconnect();
        gsap.delayedCall(0.5, () => open('seek'));
        gsap.delayedCall(2.6, () => open(null));
      });
    }, { threshold: 0.4 });
    io.observe(demo);
  }
}

/* ============================================================
   DEMO 2 — the match rails
   ------------------------------------------------------------
   Two streams drift on their own and the page's scroll adds to their speed, which is
   the whole point: the visitor drives the meeting. Chips are duplicated until the
   track spans the rail twice and the position wraps on one set's width, so the loop
   is seamless at any viewport size and the viewport width never enters the maths.
   The pair crossing the centre highlights; the seam ignites only on a real alignment.
   ============================================================ */
function initMatchDemo() {
  const demo = document.querySelector('[data-mdemo]');
  if (!demo) return;
  const tracks = [...demo.querySelectorAll('.mdemo__track')];
  const seam = demo.querySelector('.mdemo__line');
  if (!tracks.length) return;

  const rails = tracks.map((track) => {
    const originals = [...track.children].map((n) => n.cloneNode(true));
    return { track, originals, dir: Number(track.dataset.dir) || 1, span: 0, x: 0, chips: [] };
  });

  const addSet = (rail) => rail.originals.forEach((n) => rail.track.appendChild(n.cloneNode(true)));

  function fill() {
    rails.forEach((rail) => {
      // rebuilt from the pristine originals, so a resize cannot stack duplicates on duplicates
      rail.track.replaceChildren();
      addSet(rail);
      addSet(rail);
      /* The wrap distance is the offset between the first chip of one set and the first
         chip of the next, NOT scrollWidth: scrollWidth leaves out the trailing gap, and
         wrapping one gap short is exactly the kind of error that shows up as a twitch
         once a loop. */
      const kids = rail.track.children;
      rail.span = kids[rail.originals.length].offsetLeft - kids[0].offsetLeft;
      const railW = rail.track.parentElement.clientWidth || 1;
      let guard = 0;
      while (rail.track.scrollWidth < railW + rail.span && guard++ < 10) addSet(rail);
      rail.chips = [...rail.track.children];
      rail.x = 0;
    });
  }
  fill();
  let resizeT;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(fill, 200); }, { passive: true });

  if (reduced) return; // the two lists stay, readable and swipeable, and nothing moves

  let boost = 0;
  let running = false;
  let last = performance.now();

  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    running = en.isIntersecting;
    if (running) { last = performance.now(); requestAnimationFrame(step); }
  }), { threshold: 0.15 });
  io.observe(demo);

  ScrollTrigger.create({
    trigger: demo, start: 'top bottom', end: 'bottom top',
    onUpdate: (self) => { boost = gsap.utils.clamp(-9, 9, self.getVelocity() / 240); },
  });

  const BASE = 26;      // px/sec at rest — a drift, not a marquee
  const SCROLL_GAIN = 8; // how much a fling adds on top of it

  function step(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    boost *= 0.92;

    // scrolling in EITHER direction speeds the streams up: the visitor drags them past
    // each other, rather than being the only thing that moves them
    const speed = BASE + Math.abs(boost) * SCROLL_GAIN;
    const bounds = demo.getBoundingClientRect();
    const mid = bounds.left + bounds.width / 2;

    rails.forEach((rail) => {
      rail.x += rail.dir * speed * dt;
      // wrap on ONE set's width: the content repeats exactly, so the join is invisible
      if (rail.span > 0) rail.x = ((rail.x % rail.span) + rail.span) % rail.span;
      rail.track.style.transform = `translate3d(${-rail.x}px,0,0)`;
    });

    // whichever chip is nearest the centre line, in each rail
    const nearest = rails.map((rail) => {
      let best = null, bd = Infinity;
      rail.chips.forEach((c) => {
        const r = c.getBoundingClientRect();
        if (r.right < bounds.left || r.left > bounds.right) return;
        const d = Math.abs(r.left + r.width / 2 - mid);
        if (d < bd) { bd = d; best = c; }
      });
      return { el: best, d: bd };
    });
    // the nearest chip always highlights, so it is always clear what is in the window;
    // the seam itself ignites only on a real alignment. One loose threshold for both
    // leaves it lit for the whole section, and then the lock means nothing.
    const locked = nearest.every((n) => n.el && n.d < 24);
    rails.forEach((rail, i) => rail.chips.forEach((c) => {
      c.classList.toggle('is-near', c === nearest[i].el);
      c.classList.toggle('is-locked', locked && c === nearest[i].el);
    }));
    demo.classList.toggle('is-locked', locked);
    seam?.classList.toggle('is-lit', locked);

    requestAnimationFrame(step);
  }
}

/* ============================================================
   DEMO 3 — the phone, where scrolling is the pointer
   ------------------------------------------------------------
   Same rule the client site runs on touch: exactly one card is lit, the one crossing
   a thin band a little above the middle. Here the band is drawn, and the reader
   scrolls the phone themselves — which is the only way to feel why the rule exists.
   ============================================================ */
function initPhoneDemo() {
  const demo = document.querySelector('[data-phonedemo]');
  if (!demo) return;
  const scroller = demo.querySelector('.phone__scroll');
  const cards = [...demo.querySelectorAll('.phone__card')];
  if (!scroller || !cards.length) return;

  let ticking = false;
  const sync = () => {
    ticking = false;
    const r = scroller.getBoundingClientRect();
    const bandTop = r.top + r.height * 0.38;
    const bandBottom = r.top + r.height * 0.48;
    let best = null, bd = Infinity;
    cards.forEach((c) => {
      const b = c.getBoundingClientRect();
      const mid = b.top + b.height / 2;
      const d = mid < bandTop ? bandTop - mid : mid > bandBottom ? mid - bandBottom : 0;
      if (d < bd) { bd = d; best = c; }
    });
    cards.forEach((c) => c.classList.toggle('is-lit', c === best && bd === 0));
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(sync); } };
  scroller.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  sync();

  /* A nudge the first time it comes into view, so it is obvious the panel scrolls at
     all. Driven by hand rather than by a tween on scrollTop: any real touch or wheel
     cancels it immediately, so the hint never fights a visitor who has already started. */
  if (reduced) return;
  const io = new IntersectionObserver((entries, obs) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    obs.disconnect();
    let t = 0;
    let cancelled = false;
    const stop = () => { cancelled = true; };
    ['pointerdown', 'wheel', 'touchstart'].forEach((ev) => scroller.addEventListener(ev, stop, { once: true, passive: true }));
    const tick = () => {
      if (cancelled) return;
      t += 1 / 60;
      // out and back over 3.2s: 0 → 160px → 0
      const p = Math.min(1, t / 3.2);
      scroller.scrollTop = Math.sin(p * Math.PI) * 160;
      sync();
      if (p < 1) requestAnimationFrame(tick);
    };
    setTimeout(() => requestAnimationFrame(tick), 500);
  }), { threshold: 0.5 });
  io.observe(demo);
}

/* ============================================================
   The performance panel — bars that draw and numbers that count
   ============================================================ */
function initPerf() {
  const panel = document.querySelector('[data-perf]');
  if (!panel) return;
  const bars = [...panel.querySelectorAll('.perf__bar')];
  const nums = [...panel.querySelectorAll('[data-count]')];

  // reduced motion: the bars are already at their width and the numbers are already in
  // the markup, so there is nothing to do but leave them alone
  if (reduced) return;
  gsap.set(bars, { scaleX: 0, transformOrigin: 'right center' });
  if (document.documentElement.dir === 'ltr') gsap.set(bars, { transformOrigin: 'left center' });

  ScrollTrigger.create({
    trigger: panel, start: 'top 80%', once: true,
    onEnter: () => {
      gsap.to(bars, { scaleX: 1, duration: 1, ease: 'power3.out', stagger: 0.12 });
      nums.forEach((el) => {
        const target = Number(el.dataset.count);
        const unit = el.dataset.unit || '';
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target, duration: 1.2, ease: 'power2.out', delay: 0.15,
          onUpdate: () => { el.textContent = Math.round(obj.v) + unit; },
        });
      });
    },
  });
}

/* ---------- section entrances (the shared vocabulary of the studio page) ---------- */
function animateSections() {
  if (reduced) return;
  /* Scoped away from .wintro on purpose: that block is already on screen at load, so it
     belongs to the intro timeline. Left in the batch it would be revealed twice, once by
     a trigger that fires the instant ScrollTrigger refreshes and once by the intro. */
  const parts = ['.mono-label', '.dec__head', '.dec__note', '.dec__deep', '.dec__visual',
    '.wcase__facts', '.wcase__brief', '.wresult__cta', '.wnext__item', '.swatches'];
  const sel = ['#case', '#decisions', '#result']
    .flatMap((scope) => parts.map((p) => `${scope} ${p}`)).join(', ');

  gsap.set(sel, { y: 44, autoAlpha: 0 });
  ScrollTrigger.batch(sel, {
    start: 'top 88%',
    onEnter: (els) => gsap.to(els, { y: 0, autoAlpha: 1, duration: 0.95, ease: 'power4.out', stagger: 0.08, overwrite: true }),
    onLeaveBack: (els) => gsap.to(els, { y: 44, autoAlpha: 0, duration: 0.4, ease: 'power2.in', overwrite: true }),
  });
}

/* ---------- boot ---------- */
initFocusReveal({ reduced });
initFlipCards({ reduced });
initMagnifier();
initBlobReveal({ reduced });
initHeroDemo();
initMatchDemo();
initPhoneDemo();
initPerf();
animateSections();

const intro = () => {
  const h1 = document.querySelector('.wintro__title');
  if (h1) playFocusReveal(h1, 0.05);
  if (reduced) return;
  gsap.from('.wintro .mono-label', { autoAlpha: 0, y: 16, duration: 0.6, ease: 'power2.out' });
  gsap.from('.wintro__lead', { autoAlpha: 0, y: 22, duration: 0.8, delay: 0.25, ease: 'power3.out' });
  gsap.from('.wintro__meta li', { autoAlpha: 0, y: 22, duration: 0.7, delay: 0.4, stagger: 0.08, ease: 'power3.out' });
  gsap.from('.wintro__cue', { autoAlpha: 0, duration: 0.6, delay: 0.9 });
};

/* The curtain from the studio page finishes here. Its promise settles as the curtain
   starts clearing, so the opening headline pulls into focus THROUGH the fade rather
   than waiting politely behind it. */
consumeIncomingTransition().then(intro);

ScrollTrigger.refresh();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

window.addEventListener('pagehide', () => gsap.ticker.sleep());
window.addEventListener('pageshow', (e) => { if (e.persisted) { gsap.ticker.wake(); ScrollTrigger.refresh(); } });
