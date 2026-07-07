import './styles/main.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { initSmoothScroll } from './modules/smoothScroll.js';
import { initCursor } from './modules/cursor.js';
import { initA11y, loadA11yPrefs } from './modules/a11y.js';
import { initAscent } from './modules/ascent.js';

gsap.registerPlugin(ScrollTrigger);
// "stop animations" from the accessibility widget rides the same path as the OS setting
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || !!loadA11yPrefs().motion;
// phones/tablets can't afford the per-frame blend + heavy-filter compositing, so we
// run a lighter path there (no smooth-scroll hijack, no scroll-driven arrow work).
const isMobile = window.matchMedia('(max-width: 760px), (hover: none) and (pointer: coarse)').matches;

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

/* ---------- central 2D arrow mark — alive: follows the cursor, leans, breathes ---------- */
const mark = document.getElementById('mark');
const markPos = mark && mark.querySelector('.mark__pos');
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
  // in the SERVICES scene only, the arrow swings to point its tip at the cursor
  const aimRot = gsap.quickTo(markShape, 'rotation', { duration: 0.5, ease: 'power3' });
  // every bit of markShape's per-scene motion runs through these controllers (one owner per property)
  // so the scene resting-poses and the work corner-framing never fight each other
  const mShapeX = gsap.quickTo(markShape, 'x', { duration: 0.9, ease: 'power3' });
  let mShapeY = gsap.quickTo(markShape, 'y', { duration: 0.9, ease: 'power3' });
  const mShapeSX = gsap.quickTo(markShape, 'scaleX', { duration: 0.9, ease: 'power3' });
  const mShapeSY = gsap.quickTo(markShape, 'scaleY', { duration: 0.9, ease: 'power3' });
  // chameleon skins — the arrow borrows the colour of the tile it frames
  // g1/g2 are the SAME colours as the gradient (c1/c2), so the glow matches the arrow exactly
  const ARROW_SKIN = {
    'tile--feature': { c1: '#9a6cff', c2: '#5a2bd0', c3: '#1e1040', g1: '154, 108, 255', g2: '90, 43, 208' },
    'tile--vg':      { c1: '#6a9be0', c2: '#24457e', c3: '#0b1830', g1: '106, 155, 224', g2: '36, 69, 126' },
    'tile--um':      { c1: '#f2b555', c2: '#c07f2c', c3: '#3a2410', g1: '242, 181, 85',  g2: '192, 127, 44' },
    'tile--next':    { c1: '#59dcae', c2: '#1f9a72', c3: '#0a2a22', g1: '89, 220, 174',  g2: '31, 154, 114' },
  };
  const setArrowSkin = (tile) => {
    const key = tile && Object.keys(ARROW_SKIN).find((c) => tile.classList.contains(c));
    if (!key) { ['--arrow-c1', '--arrow-c2', '--arrow-c3', '--glow1', '--glow2'].forEach((p) => markShape.style.removeProperty(p)); return; }
    const s = ARROW_SKIN[key];
    markShape.style.setProperty('--arrow-c1', s.c1);
    markShape.style.setProperty('--arrow-c2', s.c2);
    markShape.style.setProperty('--arrow-c3', s.c3);
    markShape.style.setProperty('--glow1', `rgba(${s.g1}, 0.6)`);
    markShape.style.setProperty('--glow2', `rgba(${s.g2}, 0.36)`);
  };
  window.__setArrowSkin = setArrowSkin;
  // HERO hover: the whole ELEVATE word tilts in 3D toward the cursor (arrow tilts with it)
  gsap.set('.hero__wordmark', { transformPerspective: 1100, transformOrigin: '50% 50%' });
  const wmRotY = gsap.quickTo('.hero__wordmark', 'rotationY', { duration: 0.9, ease: 'power3' });
  const wmRotX = gsap.quickTo('.hero__wordmark', 'rotationX', { duration: 0.9, ease: 'power3' });

  // background orbit rings: gentle mouse parallax (spin moved to GSAP so it composes)
  const orbits = document.querySelector('.orbits');
  let oX = null, oY = null;
  if (orbits) {
    gsap.to(orbits, { rotation: 360, duration: 140, ease: 'none', repeat: -1 });
    oX = gsap.quickTo(orbits, 'x', { duration: 1.6, ease: 'power3' });
    oY = gsap.quickTo(orbits, 'y', { duration: 1.6, ease: 'power3' });
  }

  let followScale = 1; // scaled per-scene so the pull is stronger in some scenes
  const bentoEl = document.querySelector('.bento');
  let lastPX = window.innerWidth / 2, lastPY = window.innerHeight / 2; // last cursor pos (for scroll-entry into work)

  // WORK: fly the arrow to the outer corner of the tile under (px,py), tip pointing back at the tile,
  // wearing that tile's colour. Nearest tile covers the gaps. Container is recentred here too.
  function placeArrowInWork(px, py) {
    if (!bentoEl) return;
    followX(0); followY(0);
    let tile = document.elementFromPoint(px, py)?.closest('.bento .tile');
    const tiles = bentoEl.querySelectorAll('.tile');
    if (!tile) { let bd = Infinity; tiles.forEach((el) => { const r = el.getBoundingClientRect(); const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2)); if (d < bd) { bd = d; tile = el; } }); }
    if (!tile) return;
    const b = bentoEl.getBoundingClientRect();
    const gx = b.left + b.width / 2, gy = b.top + b.height / 2;
    const t = tile.getBoundingClientRect();
    const tcx = t.left + t.width / 2, tcy = t.top + t.height / 2;
    const sx = Math.sign(tcx - gx) || 1, sy = Math.sign(tcy - gy) || 1;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const targetX = clamp(tcx + sx * (t.width * 0.42), 80, window.innerWidth - 80);   // outer corner, kept on-screen
    const targetY = clamp(tcy + sy * (t.height * 0.4), 90, window.innerHeight - 90);
    mShapeX(targetX - window.innerWidth / 2);
    mShapeY(targetY - window.innerHeight / 2);
    mShapeSX(0.44); mShapeSY(0.44);
    aimRot(Math.atan2(tcx - targetX, -(tcy - targetY)) * 180 / Math.PI);
    setArrowSkin(tile);
  }
  // scrolling INTO work places + colours the arrow at once (using the last cursor), no mouse move needed
  window.__placeArrowWork = () => placeArrowInWork(lastPX, lastPY);
  // setArrowPose() drives the shape through the SAME controllers, so leaving work eases cleanly (no fight)
  window.__poseArrow = (x, y, scale, rot) => { mShapeX(x); mShapeY(y); mShapeSX(scale); mShapeSY(scale); if (rot !== null) aimRot(rot); };
  // contact → process: the arrow rises into frame from BELOW the screen (a dedicated y-tween so it
  // truly starts from below; x/scale/rotation still ride the shared controllers)
  window.__riseFromBelow = (x, scale, rot) => {
    gsap.killTweensOf(markShape, 'y');
    gsap.fromTo(markShape, { y: window.innerHeight * 1.5 }, { y: 0, duration: 0.95, ease: 'power3.inOut',
      // the killTweensOf orphaned the y controller — rebuild it so work's y-placement works again
      onComplete: () => { mShapeY = gsap.quickTo(markShape, 'y', { duration: 0.9, ease: 'power3' }); } });
    mShapeX(x); mShapeSX(scale); mShapeSY(scale); if (rot !== null) aimRot(rot);
  };

  window.addEventListener('pointermove', (e) => {
    if (document.body.classList.contains('is-loading')) return; // arrow stays steady while it fills
    if (document.body.classList.contains('is-mark-looping')) return; // let the easter-egg loop own the arrow
    lastPX = e.clientX; lastPY = e.clientY;
    const nx = (e.clientX / window.innerWidth) * 2 - 1;   // -1 … 1
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    const scene = document.body.dataset.scene;
    // in work the shape flies to a tile corner itself, so keep the container centred there
    followX(scene === 'work' ? 0 : scene === 'hero' ? 0 : nx * 60 * followScale);
    followY(scene === 'work' ? 0 : scene === 'hero' ? 0 : ny * 46 * followScale);
    rotY(nx * 22);
    rotX(-ny * 17);
    wmRotY(nx * 12);
    wmRotX(-ny * 9);
    shX(e.clientX - window.innerWidth / 2);
    shY(e.clientY - window.innerHeight / 2);
    if (oX) { oX(nx * 42); oY(ny * 42); }
    if (scene === 'services') {
      const r = markShape.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      aimRot(Math.atan2(e.clientX - cx, -(e.clientY - cy)) * 180 / Math.PI);
    } else if (scene === 'work') {
      placeArrowInWork(e.clientX, e.clientY);
    }
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

/* ---------- easter egg: click the arrow on the HERO only → it loops-the-loop with a glow + light trail ---------- */
(() => {
  if (!mark || !markShape) return;
  let looping = false;
  const spawnTrail = (x, y) => {
    const d = document.createElement('span');
    d.className = 'mark-trail';
    d.style.left = x + 'px'; d.style.top = y + 'px';
    document.body.appendChild(d);
    gsap.to(d, { opacity: 0, scale: 0.25, duration: 0.55, ease: 'power2.out', onComplete: () => d.remove() });
  };
  markShape.addEventListener('click', () => {
    if (looping || reduced) return;
    if (document.body.dataset.scene !== 'hero' || document.body.classList.contains('is-loading')) return; // HERO only
    looping = true;
    document.body.classList.add('is-mark-looping'); // raises the arrow above the type + pauses the cursor-follow
    markShape.classList.add('is-looping');          // boosts the glow behind it
    const R = 110, proxy = { t: 0 };
    let last = 0;
    gsap.to(proxy, {
      t: 1, duration: 1.2, ease: 'power2.inOut',
      onUpdate: () => {
        const th = proxy.t * Math.PI * 2;
        // a full loop around a circle just above the rest spot, with a barrel-roll + a little pop
        gsap.set(mark, { x: R * Math.sin(th), y: -R + R * Math.cos(th), rotation: proxy.t * 360, scale: 1 + Math.sin(proxy.t * Math.PI) * 0.4 });
        const now = performance.now();
        if (now - last > 40) { last = now; const r = markShape.getBoundingClientRect(); spawnTrail(r.left + r.width / 2, r.top + r.height / 2); }
      },
      onComplete: () => {
        gsap.set(mark, { x: 0, y: 0, rotation: 0, scale: 1 }); // back to its exact spot
        markShape.classList.remove('is-looping');
        document.body.classList.remove('is-mark-looping');
        looping = false;
      },
    });
  });
})();

/* ---------- smooth scroll + cursor + accessibility widget ---------- */
const lenis = (reduced || isMobile) ? null : initSmoothScroll();
if (lenis) window.lenis = lenis;
initA11y(); // before initCursor so the widget's buttons get the hover-ring binding
initCursor();
if (!reduced) initAscent({ isMobile }); // rising dust + click sparks + comets

/* ---------- altimeter: your altitude climbs as you scroll (the footer is the summit) ---------- */
const altValue = document.getElementById('altimeterValue');
if (altValue && !isMobile) {
  let cur = 0, shown = -1;
  const climb = () => {
    requestAnimationFrame(climb);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) * 8848 : 0; // Everest
    cur += (target - cur) * 0.09;
    const alt = Math.round(cur);
    if (alt !== shown) { shown = alt; altValue.textContent = alt.toLocaleString('en-US'); }
  };
  climb();
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

/* ---------- mobile: the work tile centred in the viewport lights up with its glow ---------- */
(() => {
  if (!isMobile) return;
  const tiles = document.querySelectorAll('.bento .tile');
  if (!tiles.length) return;
  // root shrunk to a thin band at the vertical centre → a tile is "in centre" while it crosses it
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    en.target.classList.toggle('is-incenter', en.isIntersecting);
  }), { rootMargin: '-45% 0px -45% 0px' });
  tiles.forEach((t) => io.observe(t));
})();

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
const HERO_A = 0.3; // the arrow's scale when it stands in as the "A" in ELEVATE

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
  const sel = '.mono-label, .textlink, .pill, .tile, .work__note, .wa-btn, .phones, .services__intro, .service, .step, .contact__about';
  gsap.set(sel, { y: 50, autoAlpha: 0 });
  ScrollTrigger.batch(sel, {
    start: 'top 86%',
    onEnter: (els) => gsap.to(els, { y: 0, autoAlpha: 1, duration: 1.05, ease: 'power4.out', stagger: 0.1, overwrite: true }),
    onLeaveBack: (els) => gsap.to(els, { y: 50, autoAlpha: 0, duration: 0.45, ease: 'power2.in', overwrite: true }),
  });

  // the arrow sits in the empty "A" slot of the centred word; this is its offset from centre
  const slotEl = document.querySelector('.wm--slot');
  const slotOffset = () => {
    if (!slotEl) return 0;
    const r = slotEl.getBoundingClientRect();
    return (r.left + r.width / 2) - window.innerWidth / 2;
  };

  // HERO — the big arrow shrinks + slides into the "A" of ELEVATE as the word rises in.
  gsap.set('.hero__wordmark .line > span', { yPercent: 130 });
  gsap.set('.hero__scroll', { autoAlpha: 0, y: 14 });
  heroIntro = () => {
    const tl = gsap.timeline();
    if (markPos) tl.to(markPos, { scale: HERO_A, x: () => slotOffset(), duration: 0.9, ease: 'power3.inOut' }, 0);
    tl.to('.hero__wordmark .line > span', { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.12 }, 0.2)
      .to('.hero__scroll', { autoAlpha: 1, y: 0, duration: 0.55 }, '-=0.3')
      .add(() => {
        if (!markPos || markPos.dataset.wired) return;
        markPos.dataset.wired = '1';

        if (isMobile) {
          // smooth, TIMED transition (not scroll-scrubbed): leaving the hero, the arrow
          // grows, recentres and settles in as a faint background element
          ScrollTrigger.create({
            trigger: '#hero', start: 'bottom 72%',
            onEnter: () => {
              gsap.to(markPos, { scale: 1.18, x: 0, duration: 1.0, ease: 'power3.inOut', overwrite: true });
              gsap.to('#mark', { autoAlpha: 0.13, duration: 1.0, ease: 'power2.out', overwrite: true });
            },
            onLeaveBack: () => {
              gsap.to(markPos, { scale: HERO_A, x: () => slotOffset(), duration: 0.8, ease: 'power3.inOut', overwrite: true });
              gsap.to('#mark', { autoAlpha: 1, duration: 0.6, overwrite: true });
            },
          });
          return;
        }

        // GROW + RECENTRE: as the word leaves, the arrow grows to full size back at centre
        gsap.fromTo(markPos, { scale: HERO_A, x: () => slotOffset() }, {
          scale: 1, x: 0, ease: 'none',
          scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom 58%', scrub: true, invalidateOnRefresh: true },
        });
        // EXIT: the ELEV / TE letters lift up out of their masks (staggered) — clean + contained
        gsap.to('.wm .line > span', { yPercent: -145, ease: 'power3.in', stagger: 0.12,
          scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom 74%', scrub: true } });

        // PASS-THROUGH words zoom out through the centre, OVER the arrow (blend → colour shift).
        // Tight range — they all appear AND vanish within the first ~half of the descent,
        // long before section 2 comes into view.
        gsap.set('.pw', { autoAlpha: 0, scale: 0.5 });
        gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: 'center top', scrub: true } })
          .fromTo('.pw--1', { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, ease: 'sine.out' })
          .to('.pw--1', { autoAlpha: 0, scale: 1.7, ease: 'sine.in' })
          .fromTo('.pw--2', { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, ease: 'sine.out' }, '-=0.2')
          .to('.pw--2', { autoAlpha: 0, scale: 1.7, ease: 'sine.in' })
          .fromTo('.pw--3', { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, ease: 'sine.out' }, '-=0.2')
          .to('.pw--3', { autoAlpha: 0, scale: 1.7, ease: 'sine.in' });
      });
    return tl;
  };
}

/* ---------- scene system: each section is its own "world" ---------- */
const SCENES = ['hero', 'about', 'services', 'work', 'process', 'contact'];

// The arrow's RESTING pose per scene (desktop). Interactive behaviour (cursor drift on the
// container, aim in services, corner-framing in work) composes on top in the pointermove handler.
//  · hero      → left to the intro (the "A" in ELEVATE); not touched here
//  · about     → offset right, calm
//  · services  → offset left, points at the hovered row (aim owns rotation)
//  · work      → hand-placed at the hovered tile's corner (pointermove owns it)
//  · process   → centred, full size
//  · contact   → flies straight up and off the top of the screen
function setArrowPose(name, prev) {
  if (isMobile || reduced || !markShape || !window.__poseArrow) return;
  if (name !== 'work') window.__setArrowSkin?.(null); // chameleon skin only lives in the work scene
  if (name === 'work') { window.__placeArrowWork(); return; } // place + colour at the hovered tile at once

  const vw = window.innerWidth, vh = window.innerHeight;
  let x, y, scale, rot;
  if (name === 'hero') {
    if (!prev) return;                                      // first call at boot → the intro owns the "A"
    x = 0; y = 0; scale = 1; rot = 0;                       // scrolled back up → recentre so the "A" is correct
  }
  else if (name === 'contact')  { x = 0;          y = -1.5 * vh; scale = 1;    rot = 0; }
  else if (name === 'about')    { x = vw * 0.15;  y = 0;         scale = 0.82; rot = 0; }
  else if (name === 'services') { x = -vw * 0.15; y = 0;         scale = 0.72; rot = 0; }    // resets tilt; aim takes over on move
  else                          { x = 0;          y = 0;         scale = 1;    rot = 0; }    // process

  if (prev === 'contact') { window.__riseFromBelow(x, scale, rot); return; } // rise in from below the screen
  window.__poseArrow(x, y, scale, rot);
}

function setScene(name) {
  const prev = document.body.dataset.scene;
  if (prev === name) return;
  document.body.dataset.scene = name;
  document.querySelectorAll('.aura__layer').forEach((l) => {
    l.style.opacity = l.classList.contains('aura__layer--' + name) ? '1' : '0';
  });
  document.querySelectorAll('.dock__link').forEach((a) => {
    a.classList.toggle('is-active', a.getAttribute('href') === '#' + name);
  });
  // the arrow reaches out harder in the busier scenes
  if (window.__setArrowFollow) {
    // work drives the arrow itself (per-tile corner framing), so followScale is irrelevant there
    window.__setArrowFollow(name === 'services' ? 1.55 : name === 'about' ? 1.15 : 1);
  }
  // give the arrow this scene's resting pose (a clean, deterministic tween — no scroll scrub)
  setArrowPose(name, prev);
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

/* ---------- mobile HUD: top scroll-progress bar + scene dots (markup in HTML, styled in CSS) ---------- */
function initMobileHud() {
  if (!isMobile) return;
  const bar = document.getElementById('mprogressBar');
  const wrap = document.getElementById('mdots');
  const sections = SCENES.map((n) => document.getElementById(n)).filter(Boolean);
  if (!bar || !wrap || !sections.length) return;

  // one dot per scene, in scroll order (the row itself is aria-hidden — decorative)
  const dots = sections.map((sec) => {
    const d = document.createElement('span');
    d.dataset.scene = sec.id;
    wrap.appendChild(d);
    return d;
  });

  let ticking = false;
  const draw = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    // active scene = the last section whose top has crossed the viewport centre
    const mid = window.innerHeight * 0.5;
    let active = 0;
    sections.forEach((sec, i) => { if (sec.getBoundingClientRect().top <= mid) active = i; });
    dots.forEach((d, i) => d.classList.toggle('is-on', i === active));
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(draw); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  draw();
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

  // the mark's per-scene pose is set discretely by setArrowPose() on each scene change
  // (no scroll-scrubbed timeline — that fought the scene overrides and made the arrow flicker).
  // It lives on .mark__shape so the cursor-follow (.mark) and breath (.mark__breathe) compose on top.
  // Skipped on mobile — transforming a heavily-filtered element each frame crashes phones.
  if (markShape && !isMobile && velSquash) {
    // feed live scroll velocity into the arrow's squash/stretch deformation
    ScrollTrigger.create({
      trigger: document.body, start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => velSquash(gsap.utils.clamp(-1, 1, self.getVelocity() / 2600)),
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

  // mobile: exactly ONE service row lights up — the single row nearest the viewport
  // centre (no hover on touch). Picking the nearest guarantees we never light two at once.
  if (isMobile) {
    const services = gsap.utils.toArray('.service');
    if (services.length) {
      let ticking = false;
      const pick = () => {
        ticking = false;
        const mid = window.innerHeight * 0.5;
        let best = null, bd = Infinity;
        services.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.bottom < 0 || r.top > window.innerHeight) return; // off-screen
          const d = Math.abs((r.top + r.height / 2) - mid);
          if (d < bd) { bd = d; best = el; }
        });
        const within = best && bd < window.innerHeight * 0.3; // comfortable centre band, else none
        services.forEach((el) => el.classList.toggle('is-active', within && el === best));
      };
      const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(pick); } };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      pick();
    }
  }

  // bottom takeover: a timed WASH (not scroll-scrubbed → smooth on mobile). On reaching the
  // CTA band the gradient sweeps the screen open and the UI ink flips. On desktop the arrow
  // flies up and off the screen via setArrowPose('contact'); on mobile it just fades out.
  const markRest = isMobile ? 0.13 : 1;
  ScrollTrigger.create({
    trigger: '.cta-band', start: 'top 72%',
    onEnter: () => {
      gsap.to('.takeover', { clipPath: 'circle(155% at 50% 78%)', duration: 1.1, ease: 'power2.inOut' });
      if (isMobile) gsap.to('#mark', { autoAlpha: 0, duration: 0.7, ease: 'power2.in' });
      document.body.classList.add('is-takeover');
    },
    onLeaveBack: () => {
      gsap.to('.takeover', { clipPath: 'circle(0% at 50% 78%)', duration: 0.6, ease: 'power2.in' });
      if (isMobile) gsap.to('#mark', { autoAlpha: markRest, duration: 0.6 });
      document.body.classList.remove('is-takeover');
    },
  });
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
      // 1) blue floods the arrow from the bottom up (slow enough to actually watch)
      .to(markBreathe, { clipPath: 'inset(0% 0% 0% 0%)', duration: 2.1, ease: 'power1.inOut' }, 0)
      .to(counter, { v: 100, duration: 2.1, ease: 'power1.inOut', onUpdate: () => { if (countEl) countEl.textContent = Math.round(counter.v); } }, 0)
      .to({}, { duration: 0.3 }) // a beat at full before it takes off
      // 2) a tiny crouch, the outline lets go
      .to(markShape, { y: 18, scaleY: 0.88, scaleX: 1.08, duration: 0.22, ease: 'power2.in' })
      .to('.mark__outline', { opacity: 0, duration: 0.22 }, '<')
      // 3) LAUNCH — it stretches and flies clean off the TOP while the curtain lifts
      .to(markShape, { y: () => -vh() * 1.25, scaleY: 1.36, scaleX: 0.8, duration: 0.6, ease: 'power3.in' })
      .to(pre, { autoAlpha: 0, duration: 0.5, ease: 'power2.inOut', onStart: reveal }, '<0.05')
      .add(() => { done(); }) // hand the arrow back to z-index:-1 so the blend works
      // 4) it re-enters from the BOTTOM and rises into the hero centre (as the "A")
      .set(markShape, { y: () => vh() * 1.25, scaleY: 1.2, scaleX: 0.88 })
      .to(markShape, { y: 0, scaleY: 1, scaleX: 1, duration: 1.05, ease: 'power3.out', onComplete: () => { if (breatheTween) breatheTween.play(); } });
  });
}

/* ---------- boot ---------- */
let booted = false;
function boot() {
  if (booted) return;
  booted = true;
  setScene('hero');
  story();
  initMobileHud();
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
