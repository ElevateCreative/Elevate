import './styles/main.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { initSmoothScroll } from './modules/smoothScroll.js';
import { initCursor } from './modules/cursor.js';

gsap.registerPlugin(ScrollTrigger);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// phones/tablets can't afford the per-frame blend + heavy-filter compositing, so we
// run a lighter path there (no smooth-scroll hijack, no scroll-driven arrow work).
const isMobile = window.matchMedia('(max-width: 760px), (hover: none) and (pointer: coarse)').matches;

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

/* ---------- central 2D arrow mark — alive: follows the cursor, leans, breathes ---------- */
const mark = document.getElementById('mark');
const markShape = mark && mark.querySelector('.mark__shape');
const markBreathe = mark && mark.querySelector('.mark__breathe');
const markFluid = mark && mark.querySelector('.mark__fluid');
const shine = mark && mark.querySelector('.mark__shine');
let velSquash = null;    // exposed to the scroll choreography below
let breatheTween = null; // started once the intro launch lands
if (markShape && !reduced) {
  gsap.set(markShape, { transformPerspective: 1000, transformOrigin: '50% 50%' });
  gsap.set([markBreathe, markFluid], { transformOrigin: '50% 50%' });

  // continuous "breath" lives on its own layer so it never fights the scroll journey
  // (held until the intro launch lands, so it stays aligned with the outline while filling)
  breatheTween = gsap.to(markBreathe, { scale: 1.06, duration: 4.5, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true });
}

/* heavy, per-frame arrow interactions — desktop only */
if (markShape && !reduced && !isMobile) {
  // the whole mark drifts toward the cursor — it "comes out" to meet the user
  const followX = gsap.quickTo(mark, 'x', { duration: 1.1, ease: 'power3' });
  const followY = gsap.quickTo(mark, 'y', { duration: 1.1, ease: 'power3' });
  // and tilts in 3D / shines toward the pointer
  const rotY = gsap.quickTo(markShape, 'rotationY', { duration: 0.8, ease: 'power3' });
  const rotX = gsap.quickTo(markShape, 'rotationX', { duration: 0.8, ease: 'power3' });
  const shX = gsap.quickTo(shine, 'x', { duration: 0.7, ease: 'power3' });
  const shY = gsap.quickTo(shine, 'y', { duration: 0.7, ease: 'power3' });
  let followScale = 1; // scaled per-scene so the pull is stronger in some scenes
  window.addEventListener('pointermove', (e) => {
    if (document.body.classList.contains('is-loading')) return; // arrow stays steady while it fills
    const nx = (e.clientX / window.innerWidth) * 2 - 1;   // -1 … 1
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    followX(nx * 60 * followScale);
    followY(ny * 46 * followScale);
    rotY(nx * 22);
    rotX(-ny * 17);
    shX(e.clientX - window.innerWidth / 2);
    shY(e.clientY - window.innerHeight / 2);
  }, { passive: true });
  // let scenes dial the magnetism up/down
  mark.dataset.follow = '1';
  window.__setArrowFollow = (s) => { followScale = s; };

  // scroll-velocity deformation: the arrow squashes/stretches & leans into motion
  const sY = gsap.quickTo(markFluid, 'scaleY', { duration: 0.5, ease: 'power3' });
  const sX = gsap.quickTo(markFluid, 'scaleX', { duration: 0.5, ease: 'power3' });
  const skew = gsap.quickTo(markFluid, 'skewY', { duration: 0.5, ease: 'power3' });
  let resetT;
  velSquash = (v) => {
    const a = Math.abs(v);
    sY(1 + a * 0.24);
    sX(1 - a * 0.13);
    skew(v * 8);
    clearTimeout(resetT);
    resetT = setTimeout(() => { sY(1); sX(1); skew(0); }, 130);
  };
}

/* ---------- smooth scroll + cursor ---------- */
const lenis = (reduced || isMobile) ? null : initSmoothScroll();
if (lenis) window.lenis = lenis;
initCursor();

/* ---------- anchors + menu fab ---------- */
function goTo(sel) {
  const el = document.querySelector(sel);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration: 1.2 });
  else el.scrollIntoView({ behavior: 'smooth' });
}
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id && id.length > 1 && document.querySelector(id)) { e.preventDefault(); goTo(id); }
  });
});
/* ---------- floating dock menu (section nav + theme switch) ---------- */
const dock = document.getElementById('dock');
const menuFab = document.getElementById('menuFab');
const dockPanel = document.getElementById('dockPanel');
function setDock(open) {
  if (!dock) return;
  dock.classList.toggle('is-open', open);
  menuFab?.setAttribute('aria-expanded', String(open));
  dockPanel?.setAttribute('aria-hidden', String(!open));
}
menuFab?.addEventListener('click', (e) => { e.stopPropagation(); setDock(!dock.classList.contains('is-open')); });
dock?.querySelectorAll('.dock__link').forEach((a) => a.addEventListener('click', () => setDock(false)));
document.addEventListener('click', (e) => { if (dock?.classList.contains('is-open') && !dock.contains(e.target)) setDock(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setDock(false); });

/* ---------- contact: tap to reveal the phone numbers ---------- */
document.querySelectorAll('[data-phones]').forEach((p) => {
  const t = p.querySelector('.phones__toggle');
  t?.addEventListener('click', () => {
    const open = p.classList.toggle('is-open');
    t.setAttribute('aria-expanded', String(open));
  });
});

/* ---------- dark / light theme toggle ---------- */
const root = document.documentElement;
const savedTheme = localStorage.getItem('elevate-theme');
if (savedTheme) root.setAttribute('data-theme', savedTheme);
document.getElementById('themeToggle')?.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  root.setAttribute('data-theme', next);
  localStorage.setItem('elevate-theme', next);
});

/* ---------- magnetic buttons ---------- */
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

/* ---------- scroll choreography ---------- */
let heroIntro = null;

/* ---------- text splitters: wrap each word/char in an overflow mask ---------- */
function splitWords(el) {
  const inners = [];
  const text = el.textContent;
  el.textContent = '';
  text.split(/(\s+)/).forEach((tok) => {
    if (tok === '') return;
    if (/^\s+$/.test(tok)) { el.appendChild(document.createTextNode(tok)); return; }
    const mask = document.createElement('span');
    mask.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top;';
    const inner = document.createElement('span');
    inner.style.cssText = 'display:inline-block;will-change:transform;';
    inner.textContent = tok;
    mask.appendChild(inner); el.appendChild(mask); inners.push(inner);
  });
  return inners;
}
function splitChars(el) {
  const inners = [];
  const text = el.textContent;
  el.textContent = '';
  [...text].forEach((ch) => {
    if (ch === ' ') { el.appendChild(document.createTextNode(' ')); return; }
    const mask = document.createElement('span');
    mask.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top;';
    const inner = document.createElement('span');
    inner.style.cssText = 'display:inline-block;will-change:transform;';
    inner.textContent = ch;
    mask.appendChild(inner); el.appendChild(mask); inners.push(inner);
  });
  return inners;
}

/* ---------- entrance animations for EVERY text element (replayable) ---------- */
function animateText() {
  // SECTION HEADLINES (.big) — each line rises out of its mask; preserves the .line structure
  gsap.utils.toArray('.big .line > span').forEach((inner) => {
    gsap.set(inner, { yPercent: 118 });
    ScrollTrigger.create({
      trigger: inner.parentElement, start: 'top 88%',
      onEnter: () => gsap.to(inner, { yPercent: 0, duration: 1.1, ease: 'power4.out' }),
      onLeaveBack: () => gsap.to(inner, { yPercent: 118, duration: 0.4, ease: 'power2.in' }),
    });
  });

  // PARAGRAPHS — words cascade up out of masks
  document.querySelectorAll('.manifesto__lead, .contact__sub, .upper').forEach((el) => {
    const words = splitWords(el);
    gsap.set(words, { yPercent: 115 });
    ScrollTrigger.create({
      trigger: el, start: 'top 88%',
      onEnter: () => gsap.to(words, { yPercent: 0, duration: 0.9, ease: 'power3.out', stagger: 0.022 }),
      onLeaveBack: () => gsap.to(words, { yPercent: 115, duration: 0.3, ease: 'power2.in' }),
    });
  });

  // LABELS · LINKS · CARDS · FOOTER — bold slide + fade as units
  const sel = '.mono-label, .textlink, .pill, .tile, .work__note, .wa-btn, .phones, .footer span, .services__intro, .service, .step';
  gsap.set(sel, { y: 50, autoAlpha: 0 });
  ScrollTrigger.batch(sel, {
    start: 'top 86%',
    onEnter: (els) => gsap.to(els, { y: 0, autoAlpha: 1, duration: 1.05, ease: 'power4.out', stagger: 0.1, overwrite: true }),
    onLeaveBack: (els) => gsap.to(els, { y: 50, autoAlpha: 0, duration: 0.45, ease: 'power2.in', overwrite: true }),
  });

  // HERO — hidden now; lines rise once the preloader lifts
  gsap.set('.hero__head .line > span', { yPercent: 130 });
  gsap.set('.hero__scroll', { autoAlpha: 0, y: 14 });
  heroIntro = () => gsap.timeline()
    .to('.hero__head .line > span', { yPercent: 0, duration: 1.05, ease: 'power4.out', stagger: 0.14 })
    .to('.hero__scroll', { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.3');
}

/* ---------- scene system: each section is its own "world" ---------- */
const SCENES = ['hero', 'about', 'services', 'work', 'process', 'contact'];
function setScene(name) {
  if (document.body.dataset.scene === name) return;
  document.body.dataset.scene = name;
  document.querySelectorAll('.aura__layer').forEach((l) => {
    l.style.opacity = l.classList.contains('aura__layer--' + name) ? '1' : '0';
  });
  document.querySelectorAll('.dock__link').forEach((a) => {
    a.classList.toggle('is-active', a.getAttribute('href') === '#' + name);
  });
  // the arrow reaches out harder in the busier scenes
  if (window.__setArrowFollow) {
    window.__setArrowFollow(name === 'services' ? 1.55 : name === 'work' ? 1.3 : name === 'about' ? 1.15 : 1);
  }
}
function setupScenes() {
  SCENES.forEach((name) => {
    const el = document.querySelector('#' + name);
    if (!el) return;
    ScrollTrigger.create({
      trigger: el, start: 'top 55%', end: 'bottom 45%',
      onEnter: () => setScene(name), onEnterBack: () => setScene(name),
    });
  });
}

/* ---------- magnetised scroll: settle onto the nearest section, no dead space ---------- */
function setupSnap() {
  if (!lenis || !window.matchMedia('(min-width: 760px)').matches) return;
  const ids = ['#hero', '#about', '#services', '#work', '#process', '#contact'];
  const getPoints = () => ids
    .map((s) => { const el = document.querySelector(s); return el ? el.getBoundingClientRect().top + window.scrollY : null; })
    .filter((v) => v != null);
  let points = getPoints();
  ScrollTrigger.addEventListener('refresh', () => { points = getPoints(); });

  let snapping = false;
  let idle;
  const trySnap = () => {
    if (snapping) return;
    const y = lenis.scroll;
    const vh = window.innerHeight;
    let best = null, bd = Infinity;
    points.forEach((p) => { const d = Math.abs(p - y); if (d < bd) { bd = d; best = p; } });
    if (best == null || bd <= 6 || bd >= vh * 0.9) return; // already there, or free to roam in tall sections
    snapping = true;
    lenis.scrollTo(best, { duration: 0.8, easing: (t) => 1 - Math.pow(1 - t, 3), onComplete: () => { snapping = false; } });
    setTimeout(() => { snapping = false; }, 1100); // safety net if interrupted
  };
  lenis.on('scroll', ({ velocity }) => {
    if (snapping) return;
    clearTimeout(idle);
    if (Math.abs(velocity) < 0.06) idle = setTimeout(trySnap, 90);
  });
}

function story() {
  const nav = document.getElementById('nav');
  ScrollTrigger.create({ start: 'top -60', end: 'max', onUpdate: (s) => nav.classList.toggle('is-scrolled', s.scroll() > 60) });

  if (reduced) return;

  animateText();

  // the central mark takes a richer journey: it glides, scales and rotates through
  // the sections (centre → right → left → centre). It lives on .mark__shape so the
  // cursor-follow (on .mark) and breath (on .mark__breathe) compose on top of it.
  // Skipped on mobile — transforming a heavily-filtered element each frame crashes phones.
  if (markShape && !isMobile) {
    gsap.timeline({ scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1 } })
      .to(markShape, { x: () => window.innerWidth * 0.18, y: () => window.innerHeight * 0.05, scale: 0.8, rotation: 10, ease: 'sine.inOut' })
      .to(markShape, { x: () => -window.innerWidth * 0.19, y: () => -window.innerHeight * 0.04, scale: 0.66, rotation: -12, ease: 'sine.inOut' })
      .to(markShape, { x: () => window.innerWidth * 0.06, y: 0, scale: 0.9, rotation: 5, ease: 'sine.inOut' })
      .to(markShape, { x: 0, y: 0, scale: 1.1, rotation: 0, ease: 'sine.inOut' });

    // feed live scroll velocity into the arrow's squash/stretch deformation
    if (velSquash) {
      ScrollTrigger.create({
        trigger: document.body, start: 'top top', end: 'bottom bottom',
        onUpdate: (self) => velSquash(gsap.utils.clamp(-1, 1, self.getVelocity() / 2600)),
      });
    }
  }

  // mobile: the arrow owns the hero, then fades aside so content stays clean (cheap one-shot)
  if (isMobile && markShape) {
    ScrollTrigger.create({
      trigger: '#hero', start: 'bottom 80%',
      onEnter: () => gsap.to('#mark', { autoAlpha: 0, duration: 0.5 }),
      onLeaveBack: () => gsap.to('#mark', { autoAlpha: 1, duration: 0.5 }),
    });
  }

  setupScenes();
  setupSnap();

  // marquee leans into scroll velocity (speeds up / nudges with momentum)
  const band = document.querySelector('.cta-band__track');
  if (band) {
    const bx = gsap.quickTo(band, 'x', { duration: 0.6, ease: 'power3' });
    ScrollTrigger.create({
      trigger: '.cta-band', start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => bx(gsap.utils.clamp(-80, 80, self.getVelocity() / 60)),
    });
  }

  // process steps: the blue rule draws across each card as it enters
  ScrollTrigger.batch('.step', {
    start: 'top 84%',
    onEnter: (els) => els.forEach((el, i) => gsap.delayedCall(i * 0.12, () => el.classList.add('is-in'))),
    onLeaveBack: (els) => els.forEach((el) => el.classList.remove('is-in')),
  });

  // bottom takeover: the premium gradient BLOOMS open as a circle from the arrow,
  // the mark dissolves, and the UI flips to dark ink over the bright field.
  gsap.fromTo('.takeover',
    { clipPath: 'circle(0% at 50% 78%)' },
    { clipPath: 'circle(150% at 50% 78%)', ease: 'none', scrollTrigger: { trigger: '.cta-band', start: 'top 95%', end: 'top 18%', scrub: true } });
  gsap.fromTo('#mark', { autoAlpha: 1 }, { autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.cta-band', start: 'top 90%', end: 'top 58%', scrub: true } });
  ScrollTrigger.create({ trigger: '.cta-band', start: 'top 48%', onEnter: () => document.body.classList.add('is-takeover'), onLeaveBack: () => document.body.classList.remove('is-takeover') });
}

/* ---------- intro: the hero arrow fills with blue, then launches up into the page ---------- */
function runIntro() {
  const pre = document.getElementById('preloader');
  const countEl = document.getElementById('preloader-count');
  const done = () => { document.body.classList.remove('is-loading'); if (pre) pre.style.display = 'none'; };

  // reduced motion / no arrow → just drop the curtain
  if (reduced || !markShape) {
    if (markBreathe) gsap.set(markBreathe, { clipPath: 'none' });
    return new Promise((resolve) => {
      if (pre) gsap.to(pre, { autoAlpha: 0, duration: 0.4, onComplete: () => { done(); resolve(); } });
      else { done(); resolve(); }
    });
  }

  return new Promise((resolve) => {
    let revealed = false;
    const reveal = () => { if (revealed) return; revealed = true; resolve(); };
    const counter = { v: 0 };
    const vh = () => window.innerHeight;

    gsap.set(markBreathe, { clipPath: 'inset(100% 0% 0% 0%)' });

    gsap.timeline()
      // 1) blue floods the arrow from the bottom up
      .to(markBreathe, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.9, ease: 'power1.inOut' }, 0)
      .to(counter, { v: 100, duration: 1.9, ease: 'power1.inOut', onUpdate: () => { if (countEl) countEl.textContent = Math.round(counter.v); } }, 0)
      .to({}, { duration: 0.25 }) // a beat at full before it takes off
      // 2) a tiny crouch, the outline lets go
      .to(markShape, { y: 16, scaleY: 0.9, scaleX: 1.06, duration: 0.2, ease: 'power2.in' })
      .to('.mark__outline', { opacity: 0, duration: 0.2 }, '<')
      // 3) LAUNCH — it stretches and flies up off the top while the curtain lifts
      .to(markShape, { y: () => -vh() * 0.92, scaleY: 1.32, scaleX: 0.82, duration: 0.62, ease: 'power3.in' })
      .to(pre, { autoAlpha: 0, duration: 0.55, ease: 'power2.inOut', onStart: reveal }, '<0.04')
      .add(() => { done(); }) // hand the arrow back to z-index:-1 so the blend works
      // 4) it swoops back down and plants itself in the hero centre
      .fromTo(markShape,
        { y: () => -vh() * 0.92, scaleY: 1.18, scaleX: 0.9 },
        { y: 0, scaleY: 1, scaleX: 1, duration: 0.95, ease: 'power3.out', onComplete: () => { if (breatheTween) breatheTween.play(); } });
  });
}

/* ---------- boot ---------- */
let booted = false;
function boot() {
  if (booted) return;
  booted = true;
  setScene('hero');
  story();
  const lift = runIntro();
  if (!reduced) {
    let played = false;
    const play = () => { if (played || !heroIntro) return; played = true; heroIntro(); };
    if (lift && typeof lift.then === 'function') lift.then(play);
    setTimeout(play, 4200); // fallback so the hero never stays hidden
  }
  ScrollTrigger.refresh();
}
if (document.fonts && document.fonts.ready) { document.fonts.ready.then(boot); setTimeout(boot, 2500); }
else boot();
// safety net: never leave the curtain (or loading lock) stuck
setTimeout(() => {
  const p = document.getElementById('preloader');
  if (p && p.style.display !== 'none') p.style.display = 'none';
  document.body.classList.remove('is-loading');
}, 6000);
