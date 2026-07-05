/* ═══════════════════════════════════════════════════════════
   UMBRAS · main.js
   The cursor is the sun. Scroll is the day.
   Concept site by Elevate Creative.
   ═══════════════════════════════════════════════════════════ */

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;

/* shared state, read by scene.js every frame */
const state = {
  p: 0,
  sun: { x: 0.25, y: 0.35 },
  section: 'hero',
  explodeP: reduced ? 0.72 : 0,
  dayP: reduced ? 0.5 : 0,
  reduced,
};

/* ── defensive boot: if CDNs died, still show the page ───── */
function bail() {
  document.body.classList.add('no-motion', 'is-ready', 'no-webgl');
  const l = $('#loader');
  if (l) l.remove();
}
if (!window.gsap || !window.ScrollTrigger) {
  bail();
} else {
  boot();
}

function boot() {
  gsap.registerPlugin(ScrollTrigger);

  /* ── smooth scroll ──────────────────────────────────────── */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.105, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  if (reduced) document.body.classList.add('no-motion');

  /* ── 3D scene (dynamic import → graceful fallback) ──────── */
  const canvas = $('#scene');
  import('./scene.js')
    .then((m) => m.initScene(canvas, state))
    .catch(() => document.body.classList.add('no-webgl'));

  /* ── the sun (pointer ∪ scroll) ─────────────────────────── */
  let vw = window.innerWidth, vh = window.innerHeight;
  let maxScroll = 1;
  const sunPx = { x: vw * 0.62, y: vh * 0.3 };
  const sunTarget = { x: vw * 0.62, y: vh * 0.3 };
  let hasPointer = false;

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') {
      hasPointer = true;
      sunTarget.x = e.clientX;
      sunTarget.y = e.clientY;
    }
  }, { passive: true });

  function measure() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
  }
  measure();
  window.addEventListener('resize', measure);
  ScrollTrigger.addEventListener('refresh', measure);

  /* ── HUD ────────────────────────────────────────────────── */
  const hudTime = $('#hudTime'), hudAz = $('#hudAz'), hudEl = $('#hudEl');
  const DAY_START = 5 * 60 + 47, DAY_END = 19 * 60 + 21; // solar minutes

  function fmtTime(min) {
    const h = Math.floor(min / 60), m = Math.floor(min % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /* ── cast shadows on the DOM, away from the sun ─────────── */
  const castEls = $$('[data-cast]');
  const castTextEls = [...$$('[data-cast-text]'), $('#footGiant')].filter(Boolean);
  const visible = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => en.isIntersecting ? visible.add(en.target) : visible.delete(en.target));
  }, { rootMargin: '12% 0px' });
  [...castEls, ...castTextEls].forEach((el) => io.observe(el));

  let frameN = 0;
  function paintShadows(shadowK) {
    frameN++;
    if (coarse && frameN % 3) return;
    for (const el of visible) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = cx - sunPx.x, dy = cy - sunPx.y;
      const d = Math.hypot(dx, dy) || 1;
      const isText = el.hasAttribute('data-cast-text') || el.id === 'footGiant';
      const big = el.id === 'footGiant' ? 2.6 : 1;
      const len = clamp(d * 0.032, 3, 24) * shadowK * big;
      const ox = (dx / d) * len, oy = (dy / d) * len;
      const blur = clamp(6 + d * 0.018, 8, 30) * (isText ? 0.75 : 1);
      if (isText) {
        el.style.textShadow = `${ox * 0.55}px ${oy * 0.55}px ${blur}px var(--shadow-c)`;
      } else {
        el.style.boxShadow = `${ox}px ${oy}px ${blur}px var(--shadow-c)`;
      }
    }
  }

  /* ── master tick ────────────────────────────────────────── */
  gsap.ticker.add(() => {
    state.p = clamp(window.scrollY / maxScroll, 0, 1);

    /* auto-sun (touch or before first mouse move): arcs with the day */
    if (!hasPointer) {
      sunTarget.x = vw * (0.85 - 0.7 * state.p);
      sunTarget.y = vh * (0.8 - 0.62 * Math.sin(Math.PI * state.p));
    }
    sunPx.x = lerp(sunPx.x, sunTarget.x, 0.085);
    sunPx.y = lerp(sunPx.y, sunTarget.y, 0.085);
    state.sun.x = (sunPx.x / vw) * 2 - 1;
    state.sun.y = -((sunPx.y / vh) * 2 - 1);

    /* long shadows at dawn and dusk, short at noon */
    const shadowK = 0.55 + 1.1 * (1 - Math.sin(Math.PI * state.p));
    paintShadows(shadowK);

    /* HUD */
    if (hudTime) {
      hudTime.textContent = fmtTime(DAY_START + (DAY_END - DAY_START) * state.p);
      const dx = sunPx.x - vw / 2, dy = sunPx.y - vh / 2;
      const az = Math.round((Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360);
      const el = Math.round(clamp(88 * (1 - Math.hypot(dx / vw, dy / vh) * 1.4), 2, 88));
      hudAz.textContent = String(az).padStart(3, '0');
      hudEl.textContent = String(el).padStart(2, '0');
    }
  });

  /* ── custom cursor ──────────────────────────────────────── */
  const cursor = $('#cursor'), cursorDot = $('#cursorDot');
  if (cursor && !coarse) {
    const dot = { x: 0, y: 0 };
    window.addEventListener('pointermove', (e) => {
      cursor.style.opacity = '1';
      cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      dot.x = lerp(dot.x, 0, 0.4);
      dot.y = lerp(dot.y, 0, 0.4);
    }, { passive: true });
    gsap.ticker.add(() => {
      const gx = (sunTarget.x - sunPx.x) * 0.12;
      const gy = (sunTarget.y - sunPx.y) * 0.12;
      cursorDot.style.transform = `translate(${clamp(-gx, -7, 7)}px, ${clamp(-gy, -7, 7)}px)`;
    });
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('a, button, input, [data-elevate], #cmpRange, .space-card')) cursor.classList.add('is-hover');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('a, button, input, [data-elevate], #cmpRange, .space-card')) cursor.classList.remove('is-hover');
    });
    window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
  }

  /* ── click sparks ───────────────────────────────────────── */
  if (!coarse && !reduced) {
    window.addEventListener('pointerdown', (e) => {
      const s = document.createElement('span');
      s.className = 'spark';
      s.style.left = e.clientX + 'px';
      s.style.top = e.clientY + 'px';
      for (let i = 0; i < 6; i++) s.appendChild(document.createElement('i'));
      document.body.appendChild(s);
      const rays = s.querySelectorAll('i');
      gsap.fromTo(s, { scale: 0.4, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.55, ease: 'power2.out', onComplete: () => s.remove() });
      rays.forEach((r, i) => {
        const a = (i / 6) * Math.PI * 2 + Math.random() * 0.6;
        gsap.fromTo(r, { x: 0, y: 0, opacity: 1 }, {
          x: Math.cos(a) * (26 + Math.random() * 22),
          y: Math.sin(a) * (26 + Math.random() * 22),
          opacity: 0, duration: 0.6, ease: 'power3.out',
        });
      });
    });
  }

  /* ── magnetic buttons ───────────────────────────────────── */
  if (!coarse && !reduced) {
    $$('.btn').forEach((btn) => {
      const qx = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
      const qy = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        qx((e.clientX - r.left - r.width / 2) * 0.22);
        qy((e.clientY - r.top - r.height / 2) * 0.28);
      });
      btn.addEventListener('mouseleave', () => { qx(0); qy(0); });
    });
  }

  /* ── split lines ────────────────────────────────────────── */
  function splitLines(el) {
    if (el.dataset.splitDone) return [];
    el.dataset.splitDone = '1';
    const tokens = [];
    el.childNodes.forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/\s+/).filter(Boolean).forEach((w) => tokens.push(w));
      } else if (n.nodeName === 'BR') {
        tokens.push('<br>');
      } else if (n.nodeType === 1) {
        tokens.push(n.outerHTML);
      }
    });
    el.innerHTML = tokens
      .map((t) => (t === '<br>' ? t : `<span class="w">${t}</span>`))
      .join(' ');
    const words = $$('.w', el);
    const lines = [];
    let top = null;
    words.forEach((w) => {
      if (w.offsetTop !== top) { top = w.offsetTop; lines.push([]); }
      lines[lines.length - 1].push(w);
    });
    el.innerHTML = '';
    const inners = [];
    lines.forEach((ws) => {
      const line = document.createElement('span');
      line.className = 'line';
      const inner = document.createElement('span');
      inner.className = 'line-inner';
      inner.innerHTML = ws.map((w) => w.innerHTML).join(' ');
      line.appendChild(inner);
      el.appendChild(line);
      inners.push(inner);
    });
    return inners;
  }

  /* ── build everything that needs final fonts ────────────── */
  const winLoaded = new Promise((res) => {
    if (document.readyState === 'complete') res();
    else window.addEventListener('load', res, { once: true });
  });
  const minDelay = new Promise((res) => setTimeout(res, reduced ? 200 : 2000));
  const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();

  /* loader percent */
  const loaderNum = $('#loaderNum');
  const pct = { v: 0 };
  gsap.to(pct, {
    v: 100, duration: reduced ? 0.2 : 2.1, ease: 'power2.inOut',
    onUpdate: () => { if (loaderNum) loaderNum.textContent = Math.round(pct.v); },
  });

  /* never let slow/blocked images (Unsplash, slow mobile data) trap the visitor
     on the preloader: start no later than the hard cap, whatever else is pending */
  let built = false;
  const runBuild = () => { if (built) return; built = true; build(); };
  const hardCap = new Promise((res) => setTimeout(res, reduced ? 400 : 3400));
  Promise.race([Promise.all([winLoaded, minDelay, fontsReady]), hardCap]).then(runBuild);

  function build() {
    const inHero = (el) => !!el.closest('.hero');

    /* split all display texts */
    const heroInners = [];
    $$('.split').forEach((el) => {
      const inners = splitLines(el);
      if (inHero(el)) {
        heroInners.push(...inners);
      } else if (!reduced) {
        gsap.set(inners, { yPercent: 115, rotate: 0.7 });
        gsap.to(inners, {
          yPercent: 0, rotate: 0, duration: 1.2, ease: 'power4.out', stagger: 0.09,
          scrollTrigger: { trigger: el, start: 'top 84%' },
        });
      }
    });

    /* generic reveals */
    $$('.reveal, .split-soft').forEach((el) => {
      if (el.classList.contains('split-soft')) el.classList.add('reveal');
      if (inHero(el) || reduced) {
        if (reduced) gsap.set(el, { opacity: 1, y: 0 });
        return;
      }
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1.05, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });

    /* counters */
    $$('[data-counter]').forEach((el) => {
      const target = parseFloat(el.dataset.counter);
      const dec = parseInt(el.dataset.dec || '0', 10);
      const o = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => gsap.to(o, {
          v: target, duration: reduced ? 0 : 1.9, ease: 'power2.out',
          onUpdate: () => {
            el.textContent = dec
              ? o.v.toFixed(dec)
              : Math.round(o.v).toLocaleString('en-US');
          },
        }),
      });
    });

    /* section themes */
    $$('[data-theme-sec]').forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec, start: 'top 58%', end: 'bottom 58%',
        onToggle: (self) => { if (self.isActive) document.body.dataset.theme = sec.dataset.themeSec; },
      });
    });

    /* scene section tracking (non-pinned) */
    $$('[data-scene]').forEach((sec) => {
      const name = sec.dataset.scene;
      if (name === 'explode' || name === 'day') return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 52%', end: 'bottom 52%',
        onToggle: (self) => { if (self.isActive) state.section = name; },
      });
    });

    /* pinned · product explode */
    const stages = $$('.stage-item');
    const ticks = $$('.stage-progress i');
    let curStage = -1;
    function setStage(i) {
      if (i === curStage) return;
      curStage = i;
      stages.forEach((s, k) => s.classList.toggle('is-on', k === i));
      ticks.forEach((t, k) => t.classList.toggle('done', k <= i));
    }
    setStage(0);

    if (!reduced) {
      ScrollTrigger.create({
        trigger: '.product', start: 'top top', end: '+=260%', pin: true, anticipatePin: 1,
        onToggle: (self) => { if (self.isActive) state.section = 'explode'; },
        onUpdate: (self) => {
          state.explodeP = self.progress;
          setStage(clamp(Math.floor(self.progress * 4.35), 0, 3));
        },
      });
    } else {
      stages.forEach((s) => s.classList.add('is-on'));
      ScrollTrigger.create({
        trigger: '.product', start: 'top 52%', end: 'bottom 52%',
        onToggle: (self) => { if (self.isActive) state.section = 'explode'; },
      });
    }

    /* pinned · a full day */
    const dayTime = $('#dayTime');
    const dayCaps = $$('.day-cap');
    const dayBeam = $('#dayBeam');
    let curCap = 0;

    function kelvinCss(k) {
      const t = k / 100;
      let r, g, b;
      if (t <= 66) {
        r = 255; g = 99.47 * Math.log(t) - 161.12;
        b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04;
      } else {
        r = 329.7 * Math.pow(t - 60, -0.1332);
        g = 288.12 * Math.pow(t - 60, -0.0755);
        b = 255;
      }
      const c = (v) => Math.round(clamp(v, 0, 255));
      return [c(r), c(g), c(b)];
    }

    function paintDay(p) {
      state.dayP = p;
      const minutes = 6 * 60 + p * (14.5 * 60);
      if (dayTime) dayTime.textContent = fmtTime(minutes);
      const cap = clamp(Math.floor(p * 5), 0, 4);
      if (cap !== curCap || !dayCaps[curCap].classList.contains('is-on')) {
        dayCaps.forEach((c, i) => c.classList.toggle('is-on', i === cap));
        curCap = cap;
      }
      if (dayBeam) {
        const k = 1900 + 4100 * Math.pow(Math.sin(Math.PI * p), 1.1);
        const [r, g, b] = kelvinCss(k);
        const strength = 0.16 + 0.3 * Math.sin(Math.PI * p);
        dayBeam.style.background = `linear-gradient(180deg, rgba(${r},${g},${b},${strength}), rgba(${r},${g},${b},0) 78%)`;
        dayBeam.style.transform = `rotate(${lerp(-26, 26, p)}deg) skewX(${lerp(-8, 8, p)}deg)`;
      }
    }
    paintDay(reduced ? 0.5 : 0.02);

    if (!reduced) {
      ScrollTrigger.create({
        trigger: '.day', start: 'top top', end: '+=240%', pin: true, anticipatePin: 1,
        onToggle: (self) => { if (self.isActive) state.section = 'day'; },
        onUpdate: (self) => paintDay(self.progress),
      });
    } else {
      ScrollTrigger.create({
        trigger: '.day', start: 'top 52%', end: 'bottom 52%',
        onToggle: (self) => { if (self.isActive) state.section = 'day'; },
      });
    }

    /* marquee */
    const track = $('#marqueeTrack');
    if (track) {
      track.innerHTML += track.innerHTML;
      if (!reduced) {
        gsap.to(track, { xPercent: 50, duration: 26, ease: 'none', repeat: -1 });
        if (lenis) {
          const skewTo = gsap.quickTo(track, 'skewX', { duration: 0.5, ease: 'power2' });
          lenis.on('scroll', (e) => skewTo(clamp(e.velocity * 0.35, -8, 8)));
        }
      }
    }

    /* warm sunset wash: the whole page glows golden across the closing sections */
    const rootEl = document.documentElement;
    ScrollTrigger.create({
      trigger: '.join', start: 'top 80%', end: 'bottom bottom', scrub: 0.5,
      onUpdate: (self) => rootEl.style.setProperty('--sunset', self.progress.toFixed(3)),
    });

    /* the plant comparison: warm light swells out past the frame as it enters */
    const cmpGlow = $('.cmp-glow');
    const cmpStage = $('.cmp-stage');
    if (cmpGlow) {
      gsap.set(cmpGlow, { opacity: 0, scale: 0.72 });
      gsap.to(cmpGlow, {
        opacity: 1, scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.shadow-sec', start: 'top 72%', end: 'center 44%', scrub: 0.6 },
      });
      ScrollTrigger.create({
        trigger: '.shadow-sec', start: 'top 55%', end: 'bottom 45%',
        onToggle: (self) => cmpStage && cmpStage.classList.toggle('is-lit', self.isActive),
      });
    }

    /* refresh in document order so pin spacers offset later triggers correctly */
    ScrollTrigger.sort();
    ScrollTrigger.refresh();

    /* ── intro ──────────────────────────────────────────── */
    const loader = $('#loader');
    const tl = gsap.timeline();
    tl.add(() => document.body.classList.add('is-ready'));
    if (loader) {
      tl.to(loader, {
        clipPath: 'inset(0 0 100% 0)', duration: reduced ? 0.2 : 1,
        ease: 'power4.inOut', onComplete: () => loader.remove(),
      }, 0.15);
    }
    if (!reduced) {
      gsap.set(heroInners, { yPercent: 115 });
      tl.to(heroInners, { yPercent: 0, duration: 1.3, ease: 'power4.out', stagger: 0.12 }, 0.55);
      tl.to($$('.hero .reveal'), { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.11 }, 0.95);
      tl.fromTo($$('.hero .anno, .scroll-cue'), { opacity: 0 }, { opacity: 1, duration: 1 }, 1.5);
    } else {
      gsap.set($$('.hero .reveal, .hero .anno, .scroll-cue'), { opacity: 1, y: 0 });
    }
  }

  /* ── anchors through lenis ──────────────────────────────── */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.6 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ── comparison slider ──────────────────────────────────── */
  const cmpRange = $('#cmpRange');
  if (cmpRange) {
    const fig = cmpRange.closest('.cmp');
    let cmpTouched = false;
    const setSplit = (v) => fig.style.setProperty('--split', v + '%');
    cmpRange.addEventListener('input', () => { cmpTouched = true; setSplit(cmpRange.value); });
    cmpRange.addEventListener('pointerdown', () => { cmpTouched = true; });

    /* one-time light sweep on first view: shows the shadow sharpening by itself,
       then hands control back to the visitor. Skipped if they already dragged. */
    if (!reduced && window.ScrollTrigger) {
      ScrollTrigger.create({
        trigger: '.shadow-sec', start: 'top 55%', once: true,
        onEnter: () => {
          if (cmpTouched) return;
          const o = { v: 50 };
          const upd = () => { if (!cmpTouched) { setSplit(o.v); cmpRange.value = o.v; } };
          gsap.timeline({ delay: 0.3 })
            .to(o, { v: 76, duration: 1.0, ease: 'power2.inOut', onUpdate: upd })
            .to(o, { v: 30, duration: 1.2, ease: 'sine.inOut', onUpdate: upd })
            .to(o, { v: 50, duration: 0.9, ease: 'power2.out', onUpdate: upd });
        },
      });
    }
  }

  /* ── Elevate modal ──────────────────────────────────────── */
  const modal = $('#modal');
  let lastFocus = null;

  function openModal() {
    if (!modal || !modal.hidden) return;
    lastFocus = document.activeElement;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('is-open'));
    if (lenis) lenis.stop();
    document.body.style.overflow = 'hidden';
    const first = $('.modal-cta .btn', modal);
    if (first) first.focus({ preventScroll: true });
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-open');
    setTimeout(() => { modal.hidden = true; }, 480);
    if (lenis) lenis.start();
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-elevate]');
    if (opener) { e.preventDefault(); openModal(); return; }
    if (e.target.closest('[data-modal-close]')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement?.matches('[role="button"][data-elevate]')) {
      e.preventDefault();
      openModal();
    }
    if (e.key === 'Tab' && modal && !modal.hidden) {
      const focusables = $$('a, button, [tabindex]:not([tabindex="-1"])', modal)
        .filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ── waitlist (concept, sends nothing) ──────────────────── */
  const joinForm = $('#joinForm');
  if (joinForm) {
    joinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('#joinEmail');
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      if (!ok) {
        input.classList.add('is-err');
        if (!reduced) gsap.fromTo(input, { x: 0 }, { x: 9, duration: 0.08, repeat: 5, yoyo: true, clearProps: 'x' });
        setTimeout(() => input.classList.remove('is-err'), 1200);
        return;
      }
      const done = $('#joinDone');
      const num = $('#joinNum');
      num.textContent = (4180 + Math.floor(Math.random() * 220)).toLocaleString('en-US');
      joinForm.querySelector('button').disabled = true;
      input.disabled = true;
      done.hidden = false;
      if (!reduced) {
        gsap.from(done, { opacity: 0, y: 14, duration: 0.7, ease: 'power3.out' });
        gsap.to(joinForm, { opacity: 0.45, duration: 0.5 });
      }
    });
  }
}
