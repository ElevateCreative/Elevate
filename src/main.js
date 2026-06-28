import './styles/main.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { createArrow } from './three/world.js';
import { initSmoothScroll } from './modules/smoothScroll.js';
import { runPreloader } from './modules/preloader.js';
import { initCursor } from './modules/cursor.js';

gsap.registerPlugin(ScrollTrigger);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

/* ---------- WebGL central arrow ---------- */
const canvas = document.getElementById('gl');
let world = null;
try {
  world = createArrow(canvas, { reduced });
  gsap.ticker.add((t) => world.update(t));
} catch (err) {
  console.error('WebGL failed:', err);
  document.body.classList.add('no-webgl');
}

/* ---------- smooth scroll + cursor ---------- */
const lenis = reduced ? null : initSmoothScroll();
if (lenis) window.lenis = lenis;
initCursor();

if (world && !reduced) {
  window.addEventListener('pointermove', (e) => {
    world.setMouse((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
  }, { passive: true });
}

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
document.querySelector('.menu-fab')?.addEventListener('click', () => goTo('#contact'));

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
  const sel = '.mono-label, .textlink, .pill, .tile, .work__note, .contact__link, .footer span';
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

function story() {
  const nav = document.getElementById('nav');
  ScrollTrigger.create({ start: 'top -60', end: 'max', onUpdate: (s) => nav.classList.toggle('is-scrolled', s.scroll() > 60) });

  if (reduced) return;

  animateText();

  if (!world) return;

  // ONE continuous, eased path — the arrow glides (no teleporting)
  gsap.timeline({ scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1 } })
    .to(world.arrowGroup.position, { x: 3.2, ease: 'sine.inOut' })
    .to(world.arrowGroup.position, { x: -3.2, ease: 'sine.inOut' })
    .to(world.arrowGroup.position, { x: 0, ease: 'sine.inOut' });

  // bottom takeover: the gradient WIPES open from a centre line to full screen; arrow + satellite fade out
  if (world.satellite) world.satellite.material.transparent = true;
  const fadeMats = [world.arrowMat, world.satellite && world.satellite.material].filter(Boolean);
  gsap.fromTo('.takeover', { clipPath: 'inset(50% 0% 50% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: '.cta-band', start: 'top 92%', end: 'top 24%', scrub: true } });
  gsap.fromTo(fadeMats, { opacity: 1 }, { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.cta-band', start: 'top 90%', end: 'top 58%', scrub: true } });
  ScrollTrigger.create({ trigger: '.cta-band', start: 'top 48%', onEnter: () => document.body.classList.add('is-takeover'), onLeaveBack: () => document.body.classList.remove('is-takeover') });
}

/* ---------- boot ---------- */
let booted = false;
function boot() {
  if (booted) return;
  booted = true;
  story();
  const lift = runPreloader({ reduced });
  if (!reduced) {
    let played = false;
    const play = () => { if (played || !heroIntro) return; played = true; heroIntro(); };
    if (lift && typeof lift.then === 'function') lift.then(play);
    setTimeout(play, 3200); // fallback so the hero never stays hidden
  }
  ScrollTrigger.refresh();
}
if (document.fonts && document.fonts.ready) { document.fonts.ready.then(boot); setTimeout(boot, 2500); }
else boot();
setTimeout(() => { const p = document.getElementById('preloader'); if (p && p.style.display !== 'none') p.style.display = 'none'; }, 6000);
